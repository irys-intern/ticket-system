import { ne } from "drizzle-orm";
import { db } from "../../../../db/index.ts";
import { userTable } from "../../../../db/schema.ts";
import { error, type RequestHandler } from "@sveltejs/kit";
import { DELETED_USER_ID } from "../../../../lib/deletedUser.ts";

const CSV_COLUMNS = ["id", "name", "email", "role", "active", "createdAt"] as const;

function toCsvValue(v: unknown): string {
    const s = v instanceof Date ? v.toISOString() : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: RequestHandler = async ({ locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(404, "Not Found");
    }

    const users = await db.select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        active: userTable.active,
        createdAt: userTable.createdAt,
    }).from(userTable).where(ne(userTable.id, DELETED_USER_ID)).orderBy(userTable.id);

    const lines = [
        CSV_COLUMNS.join(","),
        ...users.map((u) => CSV_COLUMNS.map((col) => toCsvValue(u[col])).join(",")),
    ];

    return new Response(lines.join("\n"), {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="users-export.csv"',
        },
    });
};
