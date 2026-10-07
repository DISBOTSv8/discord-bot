import {
    GuildMember,
} from "discord.js";

import {
    MODERATION_ROLE_IDS,
} from "../config/moderationRoles";

export function canModerate(
    member: GuildMember,
): boolean {
    // @ts-ignore
    return member.roles.cache.some(
        (role) =>
            MODERATION_ROLE_IDS.includes(
                role.id,
            ),
    );
}