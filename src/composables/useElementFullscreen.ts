/**
 * Puts an element in the browser's full screen and takes it out (fork).
 *
 * The browser takes the element out of full screen by itself on Escape, so the
 * state follows the fullscreenchange event rather than the calls.
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export function useElementFullscreen(element: Ref<HTMLElement | undefined>) {
  const isFullscreen = ref(false);

  const onFullscreenChange = () => {
    isFullscreen.value =
      !!element.value && document.fullscreenElement === element.value;
  };

  /** Enter full screen, or leave it when the element is in full screen. */
  const toggle = async () => {
    if (!element.value) return;
    try {
      if (document.fullscreenElement === element.value) {
        await document.exitFullscreen();
      } else {
        await element.value.requestFullscreen();
      }
    } catch {
      // a browser that refuses full screen (no user gesture, an iframe) keeps the page
    }
  };

  onMounted(() =>
    document.addEventListener("fullscreenchange", onFullscreenChange),
  );
  onBeforeUnmount(() =>
    document.removeEventListener("fullscreenchange", onFullscreenChange),
  );

  return { isFullscreen, toggle };
}
