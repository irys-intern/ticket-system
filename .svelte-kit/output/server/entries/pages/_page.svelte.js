import { R as FILENAME, n as pop_element, r as push_element } from "../../chunks/dev.js";
//#region src/routes/+page.svelte
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<h1>`);
		push_element($$renderer, "h1", 1, 0);
		$$renderer.push(`Welcome to your library project</h1>`);
		pop_element();
		$$renderer.push(` <p>`);
		push_element($$renderer, "p", 2, 0);
		$$renderer.push(`Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>`);
		pop_element();
		$$renderer.push(` <p>`);
		push_element($$renderer, "p", 3, 0);
		$$renderer.push(`Visit <a href="https://svelte.dev/docs/kit">`);
		push_element($$renderer, "a", 3, 9);
		$$renderer.push(`svelte.dev/docs/kit</a>`);
		pop_element();
		$$renderer.push(` to read the documentation</p>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
