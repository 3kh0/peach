import { finite, monitor } from "../../utils/monitor";

type GitHubUserPayload = {
  public_repos?: number;
  followers?: number;
};

export default monitor<GitHubUserPayload, unknown>(
  60 * 5,
  "https://api.github.com/users/3kh0",
  (d) => {
    const repos = finite(d?.public_repos);
    const followers = finite(d?.followers);
    return {
      handle: "3kh0",
      publicRepos: repos,
      followers,
      live: repos != null || followers != null,
    };
  },
);
