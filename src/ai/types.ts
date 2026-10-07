// src/ai/types.ts

export interface AIContext {
    guildId: string;
    channelId: string;
    channelName: string;
    userId: string;
    displayName: string;
    mentionedUsers: {
        id: string;
        displayName: string;
    }[];
    availableCommands: string;
    repliedTo?: {
        id: string;
        displayName: string;
    };
}