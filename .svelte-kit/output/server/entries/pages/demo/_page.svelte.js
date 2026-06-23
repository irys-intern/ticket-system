import { I as attr, R as FILENAME, n as pop_element, r as push_element } from "../../../chunks/dev.js";
import { t as resolve } from "../../../chunks/paths.js";
//#region src/routes/demo/+page.svelte
_page[FILENAME] = "src/routes/demo/+page.svelte";
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<a${attr("href", resolve("/demo/playwright"))}>`);
		push_element($$renderer, "a", 5, 0);
		$$renderer.push(`playwright</a>`);
		pop_element();
	}, _page);
}
_page.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _page as default };
