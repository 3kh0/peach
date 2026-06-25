import { monitor } from "../../utils/monitor";

export default monitor(60 * 10, null, () => ({
  label: "summer of making",
  teens: "20k+",
  action: "ended",
  live: false,
}));
