import { error, json, type RequestHandler } from '@sveltejs/kit';
import { readFile, writeFile, unlink, access } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const MATERIALS_DIR = join(process.cwd(), 'training-materials');

const updateMaterialSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1),
});

function safeSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug);
}

async function getFile(slug: string): Promise<string> {
    if (!safeSlug(slug)) throw error(400, 'Invalid slug');
    const filePath = join(MATERIALS_DIR, `${slug}.md`);
    const content = await readFile(filePath, 'utf-8').catch(() => null);
    if (content === null) throw error(404, 'Not found');
    return content;
}

export const GET: RequestHandler = async ({ params, locals }) => {
    const role = locals.user?.role;
    if (role !== 'agent' && role !== 'admin') {
        throw error(401, 'Unauthenticated');
    }

    const content = await getFile(params.slug!);
    return json({ slug: params.slug, content });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, 'Unauthenticated');
    }

    const body = await request.json();
    const parsed = updateMaterialSchema.safeParse(body);
    if (!parsed.success) {
        throw error(400, parsed.error.issues[0].message);
    }

    // Verify it exists before writing
    await getFile(params.slug!);

    const filePath = join(MATERIALS_DIR, `${params.slug}.md`);
    await writeFile(filePath, parsed.data.content, 'utf-8');
    return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, 'Unauthenticated');
    }

    if (!safeSlug(params.slug!)) throw error(400, 'Invalid slug');
    const filePath = join(MATERIALS_DIR, `${params.slug}.md`);

    const exists = await access(filePath).then(() => true).catch(() => false);
    if (!exists) throw error(404, 'Not found');

    await unlink(filePath);
    return json({ ok: true });
};
