export const XP_REWARDS = {
    MESSAGE: 0.75,
    REACTION: 1,
    COMMAND: 1.5,
    VOICE_MINUTE: 0.2,
} as const;

export const XP_CONFIG = {
    BASE_XP: 100,
    GROWTH: 1.5,
} as const;

export type XpAction = keyof typeof XP_REWARDS;

export function getXpForLevel(level: number): number {
    if (level <= 1) {
        return 0;
    }

    return Math.floor(
        XP_CONFIG.BASE_XP *
        Math.pow(level - 1, XP_CONFIG.GROWTH),
    );
}

export function getXpForNextLevel(level: number): number {
    return getXpForLevel(level + 1);
}

export function getLevelFromXp(exp: number): number {
    let level = 1;

    while (exp >= getXpForNextLevel(level)) {
        level++;
    }

    return level;
}

export function getLevelProgress(
    exp: number,
    level: number,
) {
    const currentLevelXp = getXpForLevel(level);
    const nextLevelXp = getXpForNextLevel(level);

    const currentXp = Math.max(
        0,
        exp - currentLevelXp,
    );

    const requiredXp =
        nextLevelXp - currentLevelXp;

    const progress = Math.min(
        Math.max(currentXp / requiredXp, 0),
        1,
    );

    return {
        currentLevelXp,
        nextLevelXp,
        currentXp,
        requiredXp,
        progress,
        percent: Math.floor(progress * 100),
    };
}