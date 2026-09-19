import {
    getLevelFromXp,
    XP_REWARDS,
    type XpAction,
} from "../config/experience";

import {addXp, updateLevel} from "../db/discord-users";

export async function giveXp(
    guildId: string,
    userId: string,
    action: XpAction,
    customAmount?: number,
) {
    const amount =
        customAmount ?? XP_REWARDS[action];

    const user = await addXp(
        guildId,
        userId,
        amount,
    );

    if (!user) {
        return null;
    }

    const oldLevel = user.level;

    const newLevel = getLevelFromXp(
        Number(user.exp),
    );

    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
        await updateLevel(
            guildId,
            userId,
            newLevel,
        );
    }

    return {
        user,
        action,
        amount,
        exp: Number(user.exp),
        oldLevel,
        newLevel,
        leveledUp,
    };
}