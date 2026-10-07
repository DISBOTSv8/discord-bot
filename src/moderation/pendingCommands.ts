import {
    PendingModerationCommand,
} from "./moderationTypes";

const pendingCommands =
    new Map<string, PendingModerationCommand>();

const CONFIRMATION_TTL = 60_000;

function getKey(
    guildId: string,
    requesterId: string,
): string {
    return `${guildId}:${requesterId}`;
}

export function setPendingCommand(
    command: PendingModerationCommand,
): void {
    const key =
        getKey(
            command.guildId,
            command.requesterId,
        );

    pendingCommands.set(
        key,
        command,
    );

    setTimeout(() => {
        const current =
            pendingCommands.get(key);

        if (
            current &&
            current.createdAt ===
            command.createdAt
        ) {
            pendingCommands.delete(key);
        }
    }, CONFIRMATION_TTL);
}

export function getPendingCommand(
    guildId: string,
    requesterId: string,
): PendingModerationCommand | null {
    const key =
        getKey(
            guildId,
            requesterId,
        );

    const command =
        pendingCommands.get(key);

    if (!command) {
        return null;
    }

    if (
        Date.now() -
        command.createdAt >
        CONFIRMATION_TTL
    ) {
        pendingCommands.delete(key);

        return null;
    }

    return command;
}

export function removePendingCommand(
    guildId: string,
    requesterId: string,
): void {
    pendingCommands.delete(
        getKey(
            guildId,
            requesterId,
        ),
    );
}