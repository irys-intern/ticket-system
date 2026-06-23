import { R as FILENAME } from "../../chunks/dev.js";
//#region src/routes/+layout.svelte
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { children } = $$props;
		children($$renderer);
		$$renderer.push(`<!---->`);
	}, _layout);
}
_layout.render = function() {
	throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
//#endregion
export { _layout as default };
