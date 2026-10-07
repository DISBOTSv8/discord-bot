import { client } from "../client";

export async function getImageFromMessage(
    channelId: string,
    messageId: string,
): Promise<string | null> {
    const channel = await client.channels.fetch(channelId);

    if (!channel?.isTextBased()) {
        return null;
    }

    const message = await channel.messages.fetch(messageId);

    const attachment = message.attachments.first();

    return attachment?.url ?? null;
}