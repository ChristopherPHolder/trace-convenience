/**
 * Advance widths of Helvetica for the printable ASCII characters, space to
 * tilde, in thousandths of the font size. Arial and Liberation Sans share
 * them, so a label measured here fits wherever the chart's font stack lands.
 *
 * trace-core has no DOM and no canvas, so it cannot ask a browser how wide a
 * label is.
 */
const ASCII_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const FIRST_ASCII = 32;
const ELLIPSIS = "…";
const ELLIPSIS_WIDTH = 1000;
/** Outside ASCII: about the width of a digit, or a full em for CJK and other wide scripts. */
const OTHER_WIDTH = 556;
const WIDE_WIDTH = 1000;
const FIRST_WIDE_CODE = 0x2e80;

function charWidth(code: number): number {
  const ascii = ASCII_WIDTHS[code - FIRST_ASCII];
  if (ascii !== undefined) return ascii;
  if (code === 0x2026) return ELLIPSIS_WIDTH;
  return code >= FIRST_WIDE_CODE ? WIDE_WIDTH : OTHER_WIDTH;
}

/** Width of `text` in px when set in the chart's font at `fontSize` px. */
export function measureText(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) width += charWidth(text.charCodeAt(i));
  return (width * fontSize) / 1000;
}

/**
 * Cuts `text` to fit `maxWidth` px, ending it with an ellipsis. Returns an
 * empty string when not even one character and the ellipsis fit.
 */
export function truncateText(text: string, maxWidth: number, fontSize: number): string {
  const budget = (maxWidth * 1000) / fontSize;
  let width = 0;
  let fits = 0;
  for (let i = 0; i < text.length; i++) {
    width += charWidth(text.charCodeAt(i));
    if (width + ELLIPSIS_WIDTH <= budget) fits = i + 1;
    if (width > budget) return fits > 0 ? text.slice(0, fits) + ELLIPSIS : "";
  }
  return text;
}
