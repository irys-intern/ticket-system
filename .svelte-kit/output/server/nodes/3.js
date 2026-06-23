

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/demo/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.Bz8mcPuf.js","_app/immutable/chunks/Dl62to-m.js","_app/immutable/chunks/B46p06FC.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = [];
export const fonts = [];
