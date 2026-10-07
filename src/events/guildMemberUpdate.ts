import {
    EmbedBuilder,
    GuildMember,
    PartialGuildMember,
} from "discord.js";

import { client } from "../client";
import {
    LOG_CHANNEL,
    NOT_VERIFIED_USER_ROLE,
    PROMT_CHANEL,
    WHY_YOU_ARE,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

const WHY_YOU_ARE_MESSAGE_ID =
    "1554210539305963642";

export async function guildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
): Promise<void> {
    try {
        const oldRoles =
            oldMember.roles.cache;

        const newRoles =
            newMember.roles.cache;

        // Added roles
        const addedRoles =
            newRoles.filter(
                (role) =>
                    !oldRoles.has(role.id) &&
                    role.id !== newMember.guild.id,
            );

        for (
            const role of addedRoles.values()
            ) {
            await sendMessageToChannel(
                LOG_CHANNEL,
                `Участнику <@${newMember.id}> добавили роль: **${role.name}**`,
            );

            if (
                role.id ===
                NOT_VERIFIED_USER_ROLE
            ) {
                try {
                    const channel =
                        await client.channels.fetch(
                            PROMT_CHANEL,
                        );

                    if (
                        !channel?.isTextBased()
                    ) {
                        throw new Error(
                            `Channel ${PROMT_CHANEL} is not a text channel.`,
                        );
                    }

                    const message =
                        await channel.messages.fetch(
                            WHY_YOU_ARE_MESSAGE_ID,
                        );

                    const image =
                        message.attachments.first()
                            ?.url;

                    const embed =
                        new EmbedBuilder()
                            .setDescription(
                                `Укажи свой ник <@${newMember.id}> в игре через слэш-команду \`/указать_ник\`, чтобы получить роль и доступ к серверу.`,
                            );

                    if (image) {
                        embed.setImage(image);
                    }

                    await sendMessageToChannel(
                        WHY_YOU_ARE,
                        {
                            embeds: [embed],
                        },
                    );
                } catch (error) {
                    console.error(
                        `[MEMBER UPDATE] Failed to send nickname instruction to ${newMember.user.tag}.`,
                        error,
                    );
                }
            }
        }

        // Removed roles
        const removedRoles =
            oldRoles.filter(
                (role) =>
                    !newRoles.has(role.id) &&
                    role.id !== newMember.guild.id,
            );

        for (
            const role of removedRoles.values()
            ) {
            await sendMessageToChannel(
                LOG_CHANNEL,
                `У участника <@${newMember.id}> забрали роль: **${role.name}**`,
            );
        }

        // Nickname changed
        if (
            oldMember.nickname !==
            newMember.nickname
        ) {
            await sendMessageToChannel(
                LOG_CHANNEL,
                `Пользователь <@${newMember.id}> изменил ник:\n` +
                `**${oldMember.nickname ?? "нет ника"}** → **${newMember.nickname ?? "нет ника"}**`,
            );
        }
    } catch (error) {
        console.error(
            `[MEMBER UPDATE] Failed to process ${newMember.user.tag}.`,
            error,
        );
    }
}