/** The look of the chart. Shared by everything that draws a `FlameChartLayout`. */
export const FLAME_CHART_STYLE = {
  /**
   * Fonts with the metrics of Helvetica, which `layoutFlameChart` measures
   * labels with.
   */
  fontFamily: "Helvetica, Arial, 'Liberation Sans', sans-serif",
  /** In px. */
  fontSize: 11,
  background: "#ffffff",
  text: "#202124",
  /** Opacity of the duration that follows a name. */
  detailOpacity: 0.6,
  axisText: "#5f6368",
  gridLine: "#e3e3e3",
  longTask: "#d93025",
  /** Id of the hatch pattern that marks the overrun of a long task. */
  longTaskPatternId: "flame-chart-long-task",
  /** Distance from a tick's line to its label, in px. */
  tickLabelOffset: 4,
  /** Distance from the left edge of a bar to its text, in px. */
  textPadding: 5,
  /** Distance from the bottom of a bar to the baseline of its text, in px. */
  textBaseline: 4.5,
} as const;
