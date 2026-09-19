import type { VoiceChannel } from "discord.js";

import {
    muteEveryone,
} from "./muteEveryone";

const MUTE_PHRASES = [
    "всем мут",
    "окунь всем мут",
    "всем тишина",
    "тишина",
];

export const processVoiceCommand = async (
    channel: VoiceChannel,
    userId: string,
    text: string,
): Promise<void> => {
    const normalized =
        text
            .toLowerCase()
            .replace(/[.,!?;:]/g, "")
            .trim();

    const member =
        channel.guild.members.cache.get(
            userId,
        );

    const username =
        member?.displayName ??
        userId;

    console.log(
        `🎤 [VOICE COMMAND] ${username}: "${normalized}"`,
    );

    const isMuteCommand =
        MUTE_PHRASES.some(
            (phrase) =>
                normalized.includes(
                    phrase,
                ),
        );

    if (!isMuteCommand) {
        return;
    }

    console.log(
        `🔇 [VOICE COMMAND] ${username} → MUTE ALL`,
    );

    await muteEveryone(channel);
};