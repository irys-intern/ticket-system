/**
 * Tracks the pointer over `node` and exposes its position as the `--spot-x`/
 * `--spot-y` CSS custom properties (percentages), for a radial-gradient
 * "spotlight" that follows the cursor. Mutates the DOM directly via
 * `style.setProperty` rather than Svelte state, so hovering never triggers a
 * component re-render -- just a cheap, GPU-composited repaint.
 */
export function spotlight(node: HTMLElement) {
  function handleMove(event: PointerEvent) {
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--spot-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    node.style.setProperty('--spot-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  node.addEventListener('pointermove', handleMove);

  return {
    destroy() {
      node.removeEventListener('pointermove', handleMove);
    },
  };
}
