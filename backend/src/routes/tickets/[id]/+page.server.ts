import {error, redirect} from '@sveltejs/kit'
import type { PageServerLoad } from './$types.ts'

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/auth/login');
    }
    if (!locals.user.userId) {
        error(403, 'Forbidden')
    }
    return {
        user: locals.user
    }
}