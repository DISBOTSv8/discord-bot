// src/services/loadGuildHistory.ts

import {
    ChannelType,
    Client,
    Message,
} from "discord.js";

import {
    saveGuildMessage,
} from "../ai/openai";

const HISTORY_LIMIT_PER_CHANNEL = 100;

export async function loadGuildHistory(
    client: Client<true>,
): Promise<void> {
    for (const guild of client.guilds.cache.values()) {
        for (const channel of guild.channels.cache.values()) {
            if (
                channel.type !== ChannelType.GuildText &&
                channel.type !== ChannelType.GuildAnnouncement
            ) {
                continue;
            }

            try {
                const messages =
                    await channel.messages.fetch({
                        limit: HISTORY_LIMIT_PER_CHANNEL,
                    });

                const orderedMessages =
                    [...messages.values()].sort(
                        (a, b) =>
                            a.createdTimestamp -
                            b.createdTimestamp,
                    );

                for (const message of orderedMessages) {
                    saveMessage(message);
                }
            } catch (error) {
                console.error(
                    `[HISTORY] Failed to load #${channel.name}:`,
                    error,
                );
            }
        }
    }
}

function saveMessage(
    message: Message,
): void {
    if (
        message.author.bot ||
        !message.content.trim()
    ) {
        return;
    }

    saveGuildMessage({
        id: message.id,
        guildId: message.guildId!,
        channelId: message.channelId,
        channelName:
            ("name" in message.channel ? message.channel.name : null) ??
            message.channelId,
        userId: message.author.id,
        displayName:
            message.member?.displayName ??
            message.author.globalName ??
            message.author.username,
        content: message.content,
        timestamp: message.createdTimestamp,
        referenceMessageId: message.reference?.messageId,
    });
}