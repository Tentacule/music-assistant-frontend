import { describe, expect, it } from "vitest";
import { isMusicVideoFullscreenShortcut } from "./music_video_fullscreen";

const press = (init: KeyboardEventInit, target?: Element) => {
  const event = new KeyboardEvent("keydown", init);
  if (target) Object.defineProperty(event, "target", { value: target });
  return event;
};

describe("isMusicVideoFullscreenShortcut", () => {
  it("takes a plain f, in either case", () => {
    expect(isMusicVideoFullscreenShortcut(press({ key: "f" }))).toBe(true);
    expect(isMusicVideoFullscreenShortcut(press({ key: "F" }))).toBe(true);
  });

  it("leaves other keys, modifiers and repeats alone", () => {
    expect(isMusicVideoFullscreenShortcut(press({ key: "g" }))).toBe(false);
    expect(
      isMusicVideoFullscreenShortcut(press({ key: "f", ctrlKey: true })),
    ).toBe(false);
    expect(
      isMusicVideoFullscreenShortcut(press({ key: "f", repeat: true })),
    ).toBe(false);
  });

  it("leaves typing in a field alone", () => {
    const input = document.createElement("input");
    expect(isMusicVideoFullscreenShortcut(press({ key: "f" }, input))).toBe(
      false,
    );
  });
});
