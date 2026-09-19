import {
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";

import type { VoiceChannel } from "discord.js";

import {
    handleSpeaker,
} from "./voiceReceiver";

const connections =
    new Map<string, VoiceConnection>();

const channels =
    new Map<string, string>();

const disconnectTimers =
    new Map<string, NodeJS.Timeout>();

const EMPTY_CHANNEL_TIMEOUT =
    10_000;

export const connectToVoice = (
    channel: VoiceChannel,
): VoiceConnection => {
    const guildId =
        channel.guild.id;

    // Cancel pending disconnect
    const disconnectTimer =
        disconnectTimers.get(
            guildId,
        );

    if (disconnectTimer) {
        clearTimeout(
            disconnectTimer,
        );

        disconnectTimers.delete(
            guildId,
        );
    }

    const currentChannelId =
        channels.get(guildId);

    // Already connected
    if (
        currentChannelId ===
        channel.id &&
        connections.has(guildId)
    ) {
        return connections.get(
            guildId,
        )!;
    }

    // Destroy old connection
    const oldConnection =
        connections.get(guildId);

    if (oldConnection) {
        console.log(
            `🔌 [VOICE STT] Disconnecting from old channel`,
        );

        oldConnection.destroy();

        connections.delete(
            guildId,
        );

        channels.delete(
            guildId,
        );
    }

    // Create connection
    const connection =
        joinVoiceChannel({
            channelId: channel.id,

            guildId,

            adapterCreator:
            channel.guild
                .voiceAdapterCreator,

            selfDeaf: false,

            selfMute: true,
        });

    connections.set(
        guildId,
        connection,
    );

    channels.set(
        guildId,
        channel.id,
    );

    console.log(
        `🎙️ [VOICE STT] Connected → ${channel.name}`,
    );

    // ============================================
    // Connection state
    // ============================================

    connection.on(
        "stateChange",
        (
            oldState,
            newState,
        ) => {
            console.log(
                `🔄 [VOICE STT] ` +
                `${oldState.status} → ${newState.status}`,
            );

            if (
                newState.status ===
                VoiceConnectionStatus.Ready
            ) {
                console.log(
                    `✅ [VOICE STT] Ready → ${channel.name}`,
                );
            }
        },
    );

    // ============================================
    // Connection error
    // ============================================

    connection.on(
        "error",
        (error) => {
            console.error(
                `❌ [VOICE STT] Connection error:`,
                error,
            );
        },
    );

    // ============================================
    // User speaking
    // ============================================

    connection.receiver.speaking.on(
        "start",
        (userId) => {
            // Ignore bot
            if (
                userId ===
                channel.client.user?.id
            ) {
                return;
            }

            handleSpeaker(
                connection,
                channel,
                userId,
            ).catch(
                (error) => {
                    console.error(
                        `❌ [VOICE STT] Speaker error:`,
                        error,
                    );
                },
            );
        },
    );

    return connection;
};

// ================================================
// Check real users
// ================================================

export const hasRealUsers = (
    channel: VoiceChannel,
): boolean => {
    return [
        ...channel.members.values(),
    ].some(
        (member) =>
            !member.user.bot,
    );
};

// ================================================
// Disconnect
// ================================================

export const disconnectFromVoice = (
    guildId: string,
): void => {
    const connection =
        connections.get(guildId);

    if (!connection) {
        return;
    }

    console.log(
        `🔌 [VOICE STT] Disconnecting`,
    );

    connection.destroy();

    connections.delete(
        guildId,
    );

    channels.delete(
        guildId,
    );
};

// ================================================
// Empty channel
// ================================================

export const checkEmptyVoiceChannel = (
    channel: VoiceChannel,
): void => {
    const guildId =
        channel.guild.id;

    // Real user exists
    if (hasRealUsers(channel)) {
        const timer =
            disconnectTimers.get(
                guildId,
            );

        if (timer) {
            clearTimeout(timer);

            disconnectTimers.delete(
                guildId,
            );
        }

        return;
    }

    // Already scheduled
    if (
        disconnectTimers.has(
            guildId,
        )
    ) {
        return;
    }

    console.log(
        `⏳ [VOICE STT] No real users in ${channel.name}. ` +
        `Disconnecting in ${EMPTY_CHANNEL_TIMEOUT / 1000}s...`,
    );

    const timer =
        setTimeout(
            () => {
                if (
                    !hasRealUsers(
                        channel,
                    )
                ) {
                    disconnectFromVoice(
                        guildId,
                    );
                }

                disconnectTimers.delete(
                    guildId,
                );
            },
            EMPTY_CHANNEL_TIMEOUT,
        );

    disconnectTimers.set(
        guildId,
        timer,
    );
};