import {
    GuildMember,
    PartialGuildMember,
} from "discord.js";

import {
    LOG_CHANNEL,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

export async function handleGuildMemberRemove(
    member: GuildMember | PartialGuildMember,
): Promise<void> {
    try {
        await sendMessageToChannel(
            LOG_CHANNEL,
            `👋 Участник <@${member.user.id}> покинул сервер.`,
        );

        console.info(
            `[MEMBER LEAVE] ${member.user.tag} (${member.user.id}) left the server.`,
        );
    } catch (error) {
        console.error(
            `[MEMBER LEAVE] Failed to send leave message for ${member.user.tag}.`,
            error,
        );
    }
}