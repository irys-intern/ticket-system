import {error, redirect} from '@sveltejs/kit'

export const load = async ({ locals }) => {
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