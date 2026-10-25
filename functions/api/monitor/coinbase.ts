import { finite, monitor } from "../../../server/utils/monitor";

type CoinbasePayload = {
  data?: {
    currency?: string;
    rates?: Record<string, string>;
  };
};

export const onRequestGet = monitor<CoinbasePayload, unknown>(
  45,
  "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
  (d) => {
    const price = finite(d?.data?.rates?.USD);
    return { symbol: "BTC", currency: "USD", price, live: price != null };
  },
);
