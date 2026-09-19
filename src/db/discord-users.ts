import {and, desc, eq, sql} from "drizzle-orm";
import {db} from "../db";
import {
    discordUsersTable,
    type DiscordUser,
} from "./schema";

export type SetDiscordUserData = {
    guildId: string;
    userId: string;
    username: string;
    displayName: string | null;
    nickname: string | null;
    joinedAt: Date;
};

export async function setData(
    data: SetDiscordUserData,
): Promise<DiscordUser> {
    const id = `${data.guildId}:${data.userId}`;

    const [user] = await db
        .insert(discordUsersTable)
        .values({
            id,
            guildId: data.guildId,
            userId: data.userId,
            username: data.username,
            displayName: data.displayName,
            nickname: data.nickname,
            joinedAt: data.joinedAt,
        })
        .onConflictDoUpdate({
            target: [
                discordUsersTable.guildId,
                discordUsersTable.userId,
            ],
            set: {
                username: data.username,
                displayName: data.displayName,
                nickname: data.nickname,
                joinedAt: data.joinedAt,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (!user) {
        throw new Error(
            `Could not save Discord user ${data.userId}.`,
        );
    }

    return user;
}

export async function getData(
    guildId: string,
    userId: string,
): Promise<DiscordUser | undefined> {
    const [user] = await db
        .select()
        .from(discordUsersTable)
        .where(
            and(
                eq(
                    discordUsersTable.guildId,
                    guildId,
                ),
                eq(
                    discordUsersTable.userId,
                    userId,
                ),
            ),
        )
        .limit(1);

    return user;
}

export async function getAllData(
    guildId: string,
): Promise<DiscordUser[]> {
    return db
        .select()
        .from(discordUsersTable)
        .where(
            eq(
                discordUsersTable.guildId,
                guildId,
            ),
        )
        .orderBy(
            desc(discordUsersTable.joinedAt),
        );
}

export async function addXp(
    guildId: string,
    userId: string,
    amount: number,
) {
    const [user] = await db
        .update(discordUsersTable)
        .set({
            exp: sql`${discordUsersTable.exp}
            +
            ${amount}`,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(discordUsersTable.guildId, guildId),
                eq(discordUsersTable.userId, userId),
            ),
        )
        .returning();

    return user;
}

export async function updateLevel(
    guildId: string,
    userId: string,
    level: number,
) {
    const [user] = await db
        .update(discordUsersTable)
        .set({
            level,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(discordUsersTable.guildId, guildId),
                eq(discordUsersTable.userId, userId),
            ),
        )
        .returning();

    return user;
}

export async function updateNickname(
    guildId: string,
    userId: string,
    nickname: string
) {
    const [user] = await db
        .update(discordUsersTable)
        .set({
            nickname,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(discordUsersTable.guildId, guildId),
                eq(discordUsersTable.userId, userId),
            ),
        )
        .returning();

    return user;
}