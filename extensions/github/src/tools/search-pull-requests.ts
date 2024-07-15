import { GraphQLClient } from "graphql-request";
import fetch from "node-fetch";
import { Octokit } from "octokit";

import { githubOAuthService } from "../api/githubClient";
import { getSdk, PullRequestExtendedDetailsFragment, PullRequestFieldsFragment } from "../generated/graphql";

const searchPullRequests: Tools.SearchPullRequests = async (input: string) => {
  const token = await githubOAuthService.authorize();
  const github = getSdk(
    new GraphQLClient("https://api.github.com/graphql", { headers: { authorization: `bearer ${token}` } }),
  );

  const octokit = new Octokit({ auth: token, request: { fetch } });

  if (input.length === 0) {
    return [];
  }

  const results = await github.fastSearchPullRequests({
    query: `${input}`,
    numberOfItems: 20,
  });

  const prs = results.search.edges?.map((edge) => edge?.node as PullRequestFieldsFragment) ?? [];

  // filter out all empty PRs
  const filteredPrs = prs.filter((pr) => pr.id);

  return filteredPrs.map(({ id, title, number }) => {
    return {
      id: id,
      title: `${title} (#${number})`,
      content: async () => {
        const detail = await github.pullRequestExtendedDetails({ nodeId: id });
        const pr = detail.node as PullRequestExtendedDetailsFragment;
        const files = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
          owner: pr.repository.owner.login,
          repo: pr.repository.name,
          pull_number: pr.number,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        return JSON.stringify({ ...pr, files: files.data }, null, 2);
      },
    };
  });
};

export default searchPullRequests;
