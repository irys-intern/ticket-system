import { client } from '../lib/redis.ts';

export interface Session {
    userId: string;
    createdAt: number;
    name: string;
    role: string;
}

export const sessionStore = {
    async createSession(userId: string, email: string, name: string, role: string, maxAge: number): Promise<string> {
        const sessionId = crypto.randomUUID();
        const sessionData: Session = {
            userId,
            createdAt: Date.now(),
            name,
            role,
        };
        await client.set(`session:${sessionId}`, JSON.stringify(sessionData));
        await client.expire(`session:${sessionId}`, maxAge);
        return sessionId;
    },
    async getSession(sessionId: string): Promise<Session | null> {
        const sessionData = await client.get(`session:${sessionId}`);
        if (!sessionData) return null;
        return JSON.parse(sessionData);
    },
    async validateSession(sessionId: string): Promise<{ valid: boolean; session?: Session }> {
        const session = await this.getSession(sessionId);
        return {
            valid: !!session,
            session: session || undefined,
        };
    },
    async deleteSession(sessionId: string): Promise<void> {
        await client.del(`session:${sessionId}`);
    },
}