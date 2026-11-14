import type { FlameChartLayout } from "./layout";
import { FLAME_CHART_STYLE } from "./style";

/**
 * Draws a flame chart as a standalone SVG document. It carries its own colours
 * and uses no stylesheet, script or web font, so it looks the same in a
 * browser, in a slide and in an image editor.
 */
export function renderFlameChartSvg(layout: FlameChartLayout): string {
  const style = FLAME_CHART_STYLE;
  const { width, height, axisHeight, fontSize } = layout;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${style.fontFamily}" font-size="${fontSize}">`,
    `<defs><pattern id="${style.longTaskPatternId}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="${style.longTask}"/></pattern></defs>`,
    `<rect width="${width}" height="${height}" fill="${style.background}"/>`,
  ];

  if (axisHeight > 0) {
    const lines = layout.ticks.map((tick) => `M${tick.x} 0V${height}`).join("");
    parts.push(
      `<path d="${lines}M0 ${axisHeight - 0.5}H${width}" fill="none" stroke="${style.gridLine}"/>`,
      `<g fill="${style.axisText}">`,
      ...layout.ticks.map(
        (tick) =>
          `<text x="${tick.x + style.tickLabelOffset}" y="${axisHeight - 7}">${escapeXml(tick.label)}</text>`,
      ),
      `</g>`,
    );
  }

  parts.push(`<g>`);
  for (const bar of layout.bars) {
    parts.push(
      `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" fill="${bar.color}"><title>${escapeXml(bar.title)}</title></rect>`,
    );
  }
  parts.push(`</g>`);

  // Text and hatching sit above the bars and let the pointer through to them.
  parts.push(`<g pointer-events="none">`);
  for (const overrun of layout.longTaskOverruns) {
    parts.push(
      `<rect x="${overrun.x}" y="${overrun.y}" width="${overrun.width}" height="${overrun.height}" fill="url(#${style.longTaskPatternId})" fill-opacity="0.5"/>`,
    );
  }
  parts.push(`<g fill="${style.text}">`);
  for (const bar of layout.bars) {
    if (!bar.label) continue;
    const detail = bar.detail
      ? `<tspan dx="${style.textPadding}" fill-opacity="${style.detailOpacity}">${escapeXml(bar.detail)}</tspan>`
      : "";
    parts.push(
      `<text x="${bar.x + style.textPadding}" y="${bar.y + bar.height - style.textBaseline}">${escapeXml(bar.label)}${detail}</text>`,
    );
  }
  parts.push(`</g></g></svg>`);

  return parts.join("\n");
}

const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes markup and drops the control characters XML does not allow. */
function escapeXml(text: string): string {
  return (
    text
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
      .replace(/[&<>"']/g, (char) => XML_ESCAPES[char])
  );
}
