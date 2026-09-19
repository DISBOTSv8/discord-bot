// src/db/schema.ts

import {
    pgTable,
    text,
    integer,
    timestamp,
    unique,
    numeric
} from "drizzle-orm/pg-core";

export const discordUsersTable = pgTable(
    "discord_users",
    {
        id: text("id").primaryKey(),

        guildId: text("guild_id").notNull(),
        userId: text("user_id").notNull(),
        nickname: text("nickname"),

        username: text("username").notNull(),
        displayName: text("display_name"),

        joinedAt: timestamp("joined_at").notNull(),

        exp: numeric("exp", {
            precision: 12,
            scale: 1,
        })
            .notNull()
            .default("0"),
        level: integer("level").notNull().default(1),

        createdAt: timestamp("created_at")
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at")
            .defaultNow()
            .notNull(),
    },
    (table) => [
        unique("guild_user_unique").on(
            table.guildId,
            table.userId,
        ),
    ],
);

export type DiscordUser =
    typeof discordUsersTable.$inferSelect;