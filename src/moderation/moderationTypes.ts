export type ModerationAction =
    | "timeout"
    | "untimeout"
    | "kick"
    | "ban"
    | "unban"
    | "warn"
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
    durationMs?: number;
    roleName?: string;
    nickname?: string;
    reason?: string;
    mentionTarget?: boolean;
}