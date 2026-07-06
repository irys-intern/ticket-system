import { error, json, type RequestHandler } from '@sveltejs/kit';
import { readdir, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { sanitizeMarkdown } from '../../utils/sanitizeMarkdown.ts';

const MATERIALS_DIR = join(process.cwd(), 'training-materials');

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const createMaterialSchema = z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
});

export const GET: RequestHandler = async ({ locals }) => {
    const role = locals.user?.role;
    if (role !== 'agent' && role !== 'admin') {
        throw error(401, 'Unauthenticated');
    }

    const files = await readdir(MATERIALS_DIR).catch(() => [] as string[]);
    const materials = files
        .filter((f) => f.endsWith('.md'))
        .map((f) => ({
            slug: f.slice(0, -3),
            title: f
                .slice(0, -3)
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
        }));

    return json({ materials });
};

export const POST: RequestHandler = async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, 'Unauthenticated');
    }

    const body = await request.json();
    const parsed = createMaterialSchema.safeParse(body);
    if (!parsed.success) {
        throw error(400, parsed.error.issues[0].message);
    }

    const { title, content } = parsed.data;
    const slug = slugify(title);
    if (!slug) throw error(400, 'Invalid title');

    const filePath = join(MATERIALS_DIR, `${slug}.md`);

    // Prevent overwriting existing files
    const exists = await access(filePath).then(() => true).catch(() => false);
    if (exists) {
        throw error(409, 'A material with that title already exists');
    }

    await writeFile(filePath, sanitizeMarkdown(content), 'utf-8');
    return json({ slug }, { status: 201 });
};
