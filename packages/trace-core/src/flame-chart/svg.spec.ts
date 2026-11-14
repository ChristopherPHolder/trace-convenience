import { describe, expect, it } from "vite-plus/test";
import type { FlameChartBar, FlameChartLayout } from "./layout";
import { renderFlameChartSvg } from "./svg";

const bar = (overrides: Partial<FlameChartBar> = {}): FlameChartBar => ({
  entryIndex: 0,
  x: 10,
  y: 22,
  width: 200,
  height: 16,
  color: "#facc15",
  label: "Function call",
  detail: "12.5 ms",
  title: "Function call\n12.5 ms (self 2.50 ms)",
  ...overrides,
});

const layoutOf = (overrides: Partial<FlameChartLayout> = {}): FlameChartLayout => ({
  width: 400,
  height: 39,
  axisHeight: 22,
  fontSize: 11,
  timeRange: { startMs: 0, endMs: 100 },
  ticks: [
    { x: 0, label: "0 ms" },
    { x: 200, label: "50 ms" },
  ],
  bars: [bar()],
  longTaskOverruns: [],
  ...overrides,
});

describe("renderFlameChartSvg", () => {
  it("is a standalone SVG document of the layout's size", () => {
    const svg = renderFlameChartSvg(layoutOf());

    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="39" viewBox="0 0 400 39" /,
    );
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain('<rect width="400" height="39" fill="#ffffff"/>');
  });

  it("draws each bar with its colour and a tooltip", () => {
    const svg = renderFlameChartSvg(layoutOf());

    expect(svg).toContain(
      '<rect x="10" y="22" width="200" height="16" fill="#facc15"><title>Function call\n12.5 ms (self 2.50 ms)</title></rect>',
    );
  });

  it("writes the name on the bar and the duration after it, dimmed", () => {
    const svg = renderFlameChartSvg(layoutOf());

    expect(svg).toContain(
      '<text x="15" y="33.5">Function call<tspan dx="5" fill-opacity="0.6">12.5 ms</tspan></text>',
    );
  });

  it("writes no text for a bar without a label", () => {
    const svg = renderFlameChartSvg(layoutOf({ bars: [bar({ label: "", detail: "" })] }));

    expect(svg).not.toContain("<tspan");
    expect(svg.match(/<text /g)).toHaveLength(2);
  });

  it("draws the axis with a grid line and a label per tick", () => {
    const svg = renderFlameChartSvg(layoutOf());

    expect(svg).toContain('<path d="M0 0V39M200 0V39M0 21.5H400" fill="none" stroke="#e3e3e3"/>');
    expect(svg).toContain('<text x="4" y="15">0 ms</text>');
    expect(svg).toContain('<text x="204" y="15">50 ms</text>');
  });

  it("leaves the axis out of a layout without one", () => {
    const svg = renderFlameChartSvg(layoutOf({ axisHeight: 0, ticks: [] }));

    expect(svg).not.toContain("<path");
  });

  it("hatches the overrun of a long task", () => {
    const svg = renderFlameChartSvg(
      layoutOf({ longTaskOverruns: [{ x: 100, y: 22, width: 110, height: 16 }] }),
    );

    expect(svg).toContain('<pattern id="flame-chart-long-task"');
    expect(svg).toContain(
      '<rect x="100" y="22" width="110" height="16" fill="url(#flame-chart-long-task)" fill-opacity="0.5"/>',
    );
  });

  it("escapes names taken from the trace", () => {
    const svg = renderFlameChartSvg(
      layoutOf({
        bars: [
          bar({
            label: `<script>alert("x")</script>`,
            detail: "",
            title: `a & b's <c>\u0000\u0007`,
          }),
        ],
      }),
    );

    expect(svg).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(svg).toContain("<title>a &amp; b&apos;s &lt;c&gt;</title>");
    expect(svg).not.toContain("<script>");
  });
});
