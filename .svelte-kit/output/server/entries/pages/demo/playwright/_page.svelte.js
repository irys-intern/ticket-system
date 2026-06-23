import { R as FILENAME, n as pop_element, r as push_element } from "../../../../chunks/dev.js";
//#region src/routes/demo/playwright/+page.svelte
_page[FILENAME] = "src/routes/demo/playwright/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<h1>`);
		push_element($$renderer, "h1", 1, 0);
		$$renderer.push(`Playwright e2e test demo</h1>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
