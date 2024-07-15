import { linear } from "../api/linearClient";
import { LinearClient, ProjectUpdate, User } from "@linear/sdk";
import { startOfMonth, startOfQuarter, formatISO, startOfWeek } from "date-fns";

type ProjectUpdateResult = Pick<ProjectUpdate, "id" | "body" | "url" | "health" | "createdAt"> & {
  user: Pick<User, "id" | "displayName" | "avatarUrl" | "email">;
} & {
  project: { id: string; name: string; url: string };
};

const getProjectUpdatesSince = async (client: LinearClient, date: Date) => {
  const graphQLClient = client.client;
  const formattedDate = formatISO(date);

  const query = `
    query {
      projectUpdates(
        filter: {
          createdAt: { gte: "${formattedDate}" }
        }
      ) {
        nodes {
          id
          body
          url
          health
          createdAt
          user {
            id
            displayName
            avatarUrl
            email
          }
          project {
            id
            name
            url
          }
        }
      }
    }
  `;

  const { data } = await graphQLClient.rawRequest<
    { projectUpdates: { nodes: ProjectUpdateResult[] } },
    Record<string, unknown>
  >(query);

  const projectUpdates = data?.projectUpdates.nodes ?? [];

  return JSON.stringify(
    projectUpdates.map((update) => {
      return {
        id: update.id,
        user: update.user.displayName,
        url: update.url,
        health: update.health,
        body: update.body,
        createdAt: update.createdAt,
        project: update.project.name,
      };
    }),
    null,
    2,
  );
};

const fetchProjectUpdates: Tools.ProjectUpdates = async () => {
  const token = await linear.authorize();
  const linearClient = new LinearClient({ accessToken: token });

  const now = new Date();

  return [
    {
      id: "this-week",
      title: "This Week",
      content: () => getProjectUpdatesSince(linearClient, startOfWeek(now)),
    },
    {
      id: "this-month",
      title: "This Month",
      content: () => getProjectUpdatesSince(linearClient, startOfMonth(now)),
    },
    {
      id: "this-quarter",
      title: "This Quarter",
      content: () => getProjectUpdatesSince(linearClient, startOfQuarter(now)),
    },
  ];
};

export default fetchProjectUpdates;
