import { monitor } from "../../utils/monitor";

export default monitor(60 * 10, null, () => ({
  label: "hackatime",
  heartbeats: "400gb+",
  source: "wakatime fork",
  live: false,
}));
