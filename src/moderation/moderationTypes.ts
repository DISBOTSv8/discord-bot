export type ModerationAction =
    | "warn"
    | "timeout"
    | "untimeout"
    | "kick"
    | "ban"
    | "unban"
    | "add_role"
    | "remove_role"
    | "nickname"
    | "mention"
    | "mute_voice";

export type CommandIntent =
    | "execute"
    | "check_capability";

export interface ParsedCommand {
    intent: CommandIntent;
    action: ModerationAction;
    targetUserId: string | null;
    targetQuery?: string;
    durationMs?: number;
    roleName?: string;
    nickname?: string;
    reason?: string;
    mentionTarget?: boolean;
}

export interface PendingModerationCommand {
    guildId: string;
    channelId: string;
    requesterId: string;
    command: ParsedCommand;
    targetUserId: string;
    targetDisplayName: string;
    createdAt: number;
}