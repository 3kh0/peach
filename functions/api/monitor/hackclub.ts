import { finite, monitor } from "../../../server/utils/monitor";

type SlackCountPayload = {
  count?: number;
};

export const onRequestGet = monitor<SlackCountPayload, unknown>(
  60 * 10,
  "https://slack-data.hackclub.dev/count",
  (d) => {
    const members = finite(d?.count);
    return { members, live: members != null };
  },
);
