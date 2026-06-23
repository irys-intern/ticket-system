import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    cookies.delete('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
    })
    return json({ success: true, message: 'Logout successful' }, { status: 200 });
    } catch (error) {
        console.error('Logout error:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
};