import { finite, monitor } from "../../utils/monitor";

type SlackCountPayload = {
  count?: number;
};

export default monitor<SlackCountPayload, unknown>(
  60 * 10,
  "https://slack-data.hackclub.dev/count",
  (d) => {
    const members = finite(d?.count);
    return { members, live: members != null };
  },
);
