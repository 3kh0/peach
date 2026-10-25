import { finite, monitor } from "../../../server/utils/monitor";

type SteamPayload = {
  result?: { players?: number };
  response?: { monthly_player_count?: number };
};

export const onRequestGet = monitor<SteamPayload, unknown>(
  60 * 30,
  "https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1?format=json",
  (d) => {
    const players = finite(d?.result?.players ?? d?.response?.monthly_player_count);
    return { players, live: players != null };
  },
);
