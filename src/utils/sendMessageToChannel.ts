import {
    MessageCreateOptions,
} from "discord.js";

import { client } from "../client";

export async function sendMessageToChannel(
    channelId: string,
    message: string | MessageCreateOptions,
): Promise<void> {
    const channel =
        await client.channels.fetch(channelId);

    if (!channel) {
        throw new Error(
            `Channel ${channelId} not found.`,
        );
    }

    if (!channel.isTextBased()) {
        throw new Error(
            `Channel ${channelId} is not a text channel.`,
        );
    }

    if (!channel.isSendable()) {
        throw new Error(
            `Channel ${channelId} is not sendable.`,
        );
    }

    await channel.send(message);
}