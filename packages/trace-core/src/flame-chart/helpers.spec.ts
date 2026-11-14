import { describe, expect, it } from "vite-plus/test";
import { categoryColor, hashCode, scriptColor } from "./color";
import { eventStyleOf, isJsInvocation } from "./event-styles";
import { formatDuration } from "./format";
import { measureText, truncateText } from "./text-width";

describe("formatDuration", () => {
  it.each([
    [0, "0 μs"],
    [450, "450 μs"],
    [1000, "1.00 ms"],
    [4250, "4.25 ms"],
    [12_345, "12.3 ms"],
    [659_500, "659.5 ms"],
    [1_250_000, "1.25 s"],
  ])("formats %d μs as %s", (microseconds, expected) => {
    expect(formatDuration(microseconds)).toBe(expected);
  });
});

describe("measureText", () => {
  it("adds up the Helvetica width of each character", () => {
    // T 611, a 556, s 500, k 500, in thousandths of the font size.
    expect(measureText("Task", 10)).toBeCloseTo(21.67);
  });

  it("scales with the font size", () => {
    expect(measureText("Task", 20)).toBeCloseTo(2 * measureText("Task", 10));
  });

  it("gives characters outside ASCII a width too", () => {
    expect(measureText("é", 10)).toBeGreaterThan(0);
    expect(measureText("漢", 10)).toBe(10);
  });
});

describe("truncateText", () => {
  it("returns text that fits as it is", () => {
    expect(truncateText("Layout", 100, 11)).toBe("Layout");
  });

  it("cuts text that does not fit and ends it with an ellipsis", () => {
    const cut = truncateText("Recalculate style", 50, 11);

    expect(cut).toBe("Recalc…");
    expect(measureText(cut, 11)).toBeLessThanOrEqual(50);
  });

  it("returns nothing when not even one character fits", () => {
    expect(truncateText("Layout", 12, 11)).toBe("");
  });
});

describe("eventStyleOf", () => {
  it("gives the label and category DevTools uses", () => {
    expect(eventStyleOf("RunTask")).toEqual(["Task", "system"]);
    expect(eventStyleOf("UpdateLayoutTree")).toEqual(["Recalculate style", "rendering"]);
  });

  it("is undefined for an event DevTools does not draw", () => {
    expect(eventStyleOf("ThreadControllerImpl::RunTask")).toBeUndefined();
    expect(eventStyleOf("toString")).toBeUndefined();
  });
});

describe("isJsInvocation", () => {
  it.each(["FunctionCall", "EvaluateScript", "RunMicrotasks", "EventDispatch", "v8.callFunction"])(
    "is true for %s",
    (name) => {
      expect(isJsInvocation(name)).toBe(true);
    },
  );

  it.each(["RunTask", "Layout", "Paint", "ParseHTML"])("is false for %s", (name) => {
    expect(isJsInvocation(name)).toBe(false);
  });
});

describe("colours", () => {
  it("has the DevTools colour of each category", () => {
    expect(categoryColor("scripting")).toBe("#facc15");
    expect(categoryColor("rendering")).toBe("#d190ff");
  });

  it("hashes a string as DevTools does", () => {
    expect(hashCode("")).toBe(0);
    expect(Number.isInteger(hashCode("https://example.com/app.js"))).toBe(true);
    expect(hashCode("https://example.com/app.js")).toBeGreaterThanOrEqual(0);
    expect(hashCode("a")).toBe(hashCode("a"));
    expect(hashCode("a")).not.toBe(hashCode("b"));
  });

  it("gives every frame of a script the same pastel colour", () => {
    const color = scriptColor("https://example.com/app.js");

    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(scriptColor("https://example.com/app.js")).toBe(color);
    // Lightness is 85%, so no channel is dark.
    const channels = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
    expect(Math.min(...channels)).toBeGreaterThan(150);
  });

  it("gives a frame without a script URL the DevTools default", () => {
    expect(scriptColor("")).toBe("#f2ecdc");
  });
});
