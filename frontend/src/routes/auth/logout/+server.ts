import { json, type RequestHandler } from "@sveltejs/kit";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const POST: RequestHandler = async ({cookies, fetch}) => {

    fetch(PUBLIC_BACKEND_URL+"/auth/logout", {method: "POST"})
    cookies.delete('sessionId', { path: '/' });
    return json({success:true})
}