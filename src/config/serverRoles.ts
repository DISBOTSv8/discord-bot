export interface ServerRoles {
    VERIFIED_USER_ROLE: string;
    NOT_VERIFIED_USER_ROLE: string;
}

export function getServerRoles(): ServerRoles {
    const VERIFIED_USER_ROLE =
        process.env.VERIFIED_USER_ROLE;

    const NOT_VERIFIED_USER_ROLE =
        process.env.NOT_VERIFIED_USER_ROLE;

    if (!VERIFIED_USER_ROLE) {
        throw new Error(
            "VERIFIED_USER_ROLE is not configured.",
        );
    }

    if (!NOT_VERIFIED_USER_ROLE) {
        throw new Error(
            "NOT_VERIFIED_USER_ROLE is not configured.",
        );
    }

    return {
        VERIFIED_USER_ROLE,
        NOT_VERIFIED_USER_ROLE,
    };
}