import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../../db/index.ts";
import { ticketsTable } from "../../../../db/schema.ts";
import { and, eq } from "drizzle-orm";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const GET: RequestHandler = async () => {
    return (await (await fetch(PUBLIC_BACKEND_URL+'/'+window.location.pathname, {credentials: 'include'})).json())
}   