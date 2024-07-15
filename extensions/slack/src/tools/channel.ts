import { slack } from "../shared/client/WebClient";
import { WebClient } from "@slack/web-api";

const fetchChannelMessages: Tools.Channel = async () => {
  const token = await slack.authorize();
  const slackWebClient = new WebClient(token, { rejectRateLimitedCalls: true });
  const channels = await slackWebClient.conversations.list({
    exclude_archived: true,
    types: "public_channel,private_channel",
    limit: 1000,
  });

  return (
    channels.channels?.map((channel) => ({
      id: channel.id ?? "",
      title: channel.name ?? "",
      content: async () => {
        // if (!channel.id) return;
        const messages = await slackWebClient.conversations.history({
          channel: channel.id,
          limit: 10,
        });

        return JSON.stringify(messages.messages, null, 2);
      },
    })) ?? []
  );
};

export default fetchChannelMessages;
