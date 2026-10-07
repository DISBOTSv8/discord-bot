import "dotenv/config";

import { client } from "./client";
import { registerEvents } from "./events";

const token = process.env.DISCORD_TOKEN;

if (!token) {
    throw new Error(
        "DISCORD_TOKEN is missing.",
    );
}

registerEvents(client);

void client.login(token).catch(
    (error: unknown) => {
        console.error(
            "Failed to connect to Discord.",
            error,
        );

        process.exitCode = 1;
    },
);