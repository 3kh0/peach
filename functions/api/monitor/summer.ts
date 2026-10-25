import { monitor } from "../../../server/utils/monitor";

export const onRequestGet = monitor(60 * 10, null, () => ({
  label: "summer of making",
  teens: "20k+",
  action: "ended",
  live: false,
}));
