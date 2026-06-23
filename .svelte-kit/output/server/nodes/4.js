

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/demo/playwright/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/4.BsuD9hbs.js","_app/immutable/chunks/Dl62to-m.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = [];
export const fonts = [];
