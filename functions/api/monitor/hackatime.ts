import { monitor } from "../../../server/utils/monitor";

export const onRequestGet = monitor(60 * 10, null, () => ({
  label: "hackatime",
  heartbeats: "400gb+",
  source: "wakatime fork",
  live: false,
}));
