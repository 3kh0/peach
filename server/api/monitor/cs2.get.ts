import { finite, monitor } from "../../utils/monitor";

type SteamPayload = {
  result?: { players?: number };
  response?: { monthly_player_count?: number };
};

export default monitor<SteamPayload, unknown>(
  60 * 30,
  "https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1?format=json",
  (d) => {
    const players = finite(d?.result?.players ?? d?.response?.monthly_player_count);
    return { players, live: players != null };
  },
);
