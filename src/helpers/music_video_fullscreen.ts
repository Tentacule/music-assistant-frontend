/** The keyboard shortcut that puts a music video in full screen, or takes it out (fork). */
export const MUSIC_VIDEO_FULLSCREEN_KEY = "f";

const EDITABLE =
  'input, select, textarea, [contenteditable]:not([contenteditable="false"])';

/**
 * Whether a key press is the full screen shortcut of a music video.
 *
 * The shortcut is a plain "f": with a modifier it belongs to the browser, and
 * in a field it is typing.
 *
 * @param event - The key press.
 */
export function isMusicVideoFullscreenShortcut(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== MUSIC_VIDEO_FULLSCREEN_KEY) return false;
  if (event.repeat || event.defaultPrevented) return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  const target = event.target;
  return !(target instanceof Element && target.closest(EDITABLE));
}
