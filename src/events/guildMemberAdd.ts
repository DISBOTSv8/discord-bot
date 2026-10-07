import {
    GuildMember,
} from "discord.js";

import {
    NOT_VERIFIED_USER_ROLE,
    VERIFIED_USER_ROLE,
    WHY_YOU_ARE,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

import {
    createAIWelcomeEmbed,
} from "../services/aiWelcome";

export async function handleGuildMemberAdd(
    member: GuildMember,
): Promise<void> {
    if (member.user.bot) {
        return;
    }

    console.info(
        `[MEMBER JOIN] ${member.user.tag} (${member.user.id}) joined the server.`,
    );

    try {
        if (
            member.roles.cache.has(
                VERIFIED_USER_ROLE,
            )
        ) {
            console.info(
                `[MEMBER JOIN] ${member.user.tag} is already verified.`,
            );

            return;
        }

        if (
            !member.roles.cache.has(
                NOT_VERIFIED_USER_ROLE,
            )
        ) {
            await member.roles.add(
                NOT_VERIFIED_USER_ROLE,
                "New member joined the server",
            );

            console.info(
                `[MEMBER JOIN] Added not verified role to ${member.user.tag}.`,
            );
        }

        const embed =
            await createAIWelcomeEmbed(
                member.id,
            );

        await sendMessageToChannel(
            WHY_YOU_ARE,
            {
                embeds: [embed],
            },
        );
    } catch (error) {
        console.error(
            `[MEMBER JOIN] Failed to process ${member.user.tag}.`,
            error,
        );
    }
}