import { logServerError } from "../../../server/utils/logger";
import { finite, monitorCache } from "../../../server/utils/monitor";

type NasdaqChart = {
  data?: {
    lastSalePrice?: string;
    previousClose?: string;
    chart?: Array<{ y?: number; z?: { close?: string } }>;
  };
};

const parseMoney = (s?: string | null) => (s ? finite(String(s).replace(/[^0-9.-]/g, "")) : null);

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const headers = monitorCache(60 * 5);

export const onRequestGet = async () => {
  try {
    const day = 1000 * 60 * 60 * 24;
    const now = Date.now();
    // Use yesterday as todate so the close series only contains completed sessions;
    // today's intraday data (if any) is excluded and we rely on lastSalePrice for the live price.
    const url = `https://api.nasdaq.com/api/quote/QQQ/chart?assetclass=etf&fromdate=${toISO(new Date(now - day * 95))}&todate=${toISO(new Date(now - day))}`;
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`nasdaq returned ${res.status}`);

    const json = (await res.json()) as NasdaqChart;
    const rawCloses = (json?.data?.chart ?? [])
      .map((p) => (typeof p.y === "number" ? p.y : Number(p?.z?.close)))
      .filter((v): v is number => Number.isFinite(v));

    const lastSale = parseMoney(json?.data?.lastSalePrice);
    const prev = parseMoney(json?.data?.previousClose);

    // NASDAQ chart API appends the current session's intraday price as a trailing
    // element even when todate=yesterday. Detect and strip it: the closes series
    // should end exactly at the previous trading day's official close (= prev).
    const closes =
      rawCloses.length > 1 && prev != null && Math.abs(rawCloses.at(-1)! - prev) > 0.01
        ? rawCloses.slice(0, -1)
        : rawCloses;
    const previousClose = closes.at(-1) ?? prev ?? null;

    return Response.json(
      {
        symbol: "QQQ",
        currency: "USD",
        price: lastSale ?? closes.at(-1) ?? null,
        previousClose,
        closes,
        live: closes.length > 0,
      },
      { headers },
    );
  } catch (error) {
    logServerError("monitor:market", error);
    return Response.json(
      {
        symbol: "QQQ",
        currency: "USD",
        price: null,
        previousClose: null,
        closes: [],
        live: false,
      },
      { headers },
    );
  }
};
