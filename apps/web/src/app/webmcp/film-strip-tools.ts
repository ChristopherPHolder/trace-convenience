import { inject, type WebMcpToolDescriptor, type WebMcpToolExecute } from "@angular/core";
import { FilmStripExportService } from "../services/film-strip-export.service";
import { FilmStripSettingsService } from "../services/film-strip-settings.service";
import { FilmStripService } from "../services/film-strip.service";
import { TraceService } from "../services/trace.service";

/** Interval sampling accepts the same range as the slider in the settings dialog. */
const MIN_INTERVAL_MS = 10;
const MAX_INTERVAL_MS = 2000;

/** A long strip sampled at a short interval has thousands of frames. */
const MAX_REPORTED_FRAME_TIMES = 200;

const NO_TRACE_MESSAGE =
  "No trace is loaded. Ask the user to drop a Chrome DevTools performance trace (.json) on the page.";

/** A failure the agent can act on, such as a bad argument or a missing trace. */
class ToolError extends Error {}

/** What a tool returns in place of its result when the call could not be carried out. */
export interface ToolFailure {
  error: string;
}

/**
 * Returns a `ToolError` as `{ error }`. Chrome replaces an error thrown by a
 * tool with a generic failure, so a thrown message never reaches the agent.
 */
function reportingErrors(execute: WebMcpToolExecute): WebMcpToolExecute {
  return (input, client) => {
    try {
      const result = execute(input, client);
      return result instanceof Promise ? result.catch(toFailure) : result;
    } catch (error) {
      return toFailure(error);
    }
  };
}

function toFailure(error: unknown): ToolFailure {
  if (error instanceof ToolError) return { error: error.message };
  throw error;
}

/** What the tools report about the film strip. Times are in ms from the first screenshot. */
export interface FilmStripState {
  /** `null` until the user loads a trace. */
  trace: { fileName: string; screenshotCount: number; durationMs: number } | null;
  settings: {
    /** 0 when the strip shows every screenshot. */
    intervalMs: number;
    timeRangeEnabled: boolean;
    timeRangeStartMs: number;
    timeRangeEndMs: number;
    showTimestamps: boolean;
  };
  frames: {
    count: number;
    /** When each frame is shown. Capped at the first 200 frames. */
    timesMs: number[];
    timesTruncated: boolean;
  };
}

/** Reads the state inside an injection context. */
function readState(): FilmStripState {
  const file = inject(TraceService).currentFile();
  const settings = inject(FilmStripSettingsService);
  const filmStrip = inject(FilmStripService);

  const screenshots = filmStrip.screenshots();
  const frames = filmStrip.frames();
  const origin = screenshots[0]?.timestamp ?? 0;

  return {
    trace: file && {
      fileName: file.name,
      screenshotCount: screenshots.length,
      durationMs: Math.round(filmStrip.totalDurationMs()),
    },
    settings: {
      intervalMs: settings.useIntervalFiltering() ? settings.minIntervalMs() : 0,
      timeRangeEnabled: settings.useTimeRangeFilter(),
      timeRangeStartMs: settings.startTimeMs(),
      timeRangeEndMs: settings.endTimeMs(),
      showTimestamps: settings.exportShowTimestamps(),
    },
    frames: {
      count: frames.length,
      timesMs: frames
        .slice(0, MAX_REPORTED_FRAME_TIMES)
        .map((frame) => Math.round((frame.displayTimestamp - origin) / 1000)),
      timesTruncated: frames.length > MAX_REPORTED_FRAME_TIMES,
    },
  };
}

const getFilmStripState: WebMcpToolDescriptor = {
  name: "get_film_strip_state",
  title: "Get film strip state",
  description:
    "Reports the loaded trace, the film strip settings and when each displayed frame is shown. " +
    "Times are in milliseconds from the first screenshot. `trace` is null until the user loads a trace file.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: () => readState(),
};

const SETTING_KEYS = [
  "intervalMs",
  "timeRangeStartMs",
  "timeRangeEndMs",
  "timeRangeEnabled",
  "showTimestamps",
] as const;

const updateFilmStripSettings: WebMcpToolDescriptor = {
  name: "update_film_strip_settings",
  title: "Update film strip settings",
  description:
    "Changes which frames the film strip shows and returns the resulting state. " +
    "Pass only the settings to change. The strip on the page updates at once.",
  inputSchema: {
    type: "object",
    properties: {
      intervalMs: {
        type: "integer",
        description: `Show one frame every this many milliseconds, from ${MIN_INTERVAL_MS} to ${MAX_INTERVAL_MS}. 0 shows every screenshot in the trace.`,
      },
      timeRangeStartMs: {
        type: "integer",
        description:
          "Start of the time window, in milliseconds from the first screenshot. Setting it turns the time range on.",
      },
      timeRangeEndMs: {
        type: "integer",
        description:
          "End of the time window, in milliseconds from the first screenshot. Setting it turns the time range on.",
      },
      timeRangeEnabled: {
        type: "boolean",
        description: "false shows the whole trace. true limits the strip to the time window.",
      },
      showTimestamps: {
        type: "boolean",
        description: "Show each frame's time under it, on the page and in exports.",
      },
    },
  },
  annotations: { untrustedContentHint: true },
  execute: reportingErrors((input) => {
    const settings = inject(FilmStripSettingsService);
    const filmStrip = inject(FilmStripService);
    if (!inject(TraceService).currentFile()) throw new ToolError(NO_TRACE_MESSAGE);

    // Check everything first, so a bad value leaves the settings untouched.
    const args = toObject(input);
    const unknownKeys = Object.keys(args).filter(
      (key) => !(SETTING_KEYS as readonly string[]).includes(key),
    );
    if (unknownKeys.length > 0) {
      throw new ToolError(
        `Unknown settings: ${unknownKeys.join(", ")}. The settings are ${SETTING_KEYS.join(", ")}.`,
      );
    }

    const intervalMs = optionalInteger(args, "intervalMs");
    const startArg = optionalInteger(args, "timeRangeStartMs");
    const endArg = optionalInteger(args, "timeRangeEndMs");
    const timeRangeEnabled = optionalBoolean(args, "timeRangeEnabled");
    const showTimestamps = optionalBoolean(args, "showTimestamps");

    if (
      intervalMs === undefined &&
      startArg === undefined &&
      endArg === undefined &&
      timeRangeEnabled === undefined &&
      showTimestamps === undefined
    ) {
      throw new ToolError(`Pass at least one setting: ${SETTING_KEYS.join(", ")}.`);
    }

    if (
      intervalMs !== undefined &&
      intervalMs !== 0 &&
      (intervalMs < MIN_INTERVAL_MS || intervalMs > MAX_INTERVAL_MS)
    ) {
      throw new ToolError(
        `intervalMs must be 0 or from ${MIN_INTERVAL_MS} to ${MAX_INTERVAL_MS}. Got ${intervalMs}.`,
      );
    }

    const maxMs = Math.ceil(filmStrip.totalDurationMs());
    const startMs = startArg ?? settings.startTimeMs();
    // The end is 0 until the strip has rendered once; the whole trace is the default.
    const endMs = endArg ?? (settings.endTimeMs() || maxMs);
    const setsWindow = startArg !== undefined || endArg !== undefined;
    const turnsRangeOn = timeRangeEnabled ?? setsWindow;
    if ((setsWindow || turnsRangeOn) && !(startMs >= 0 && startMs < endMs && endMs <= maxMs)) {
      throw new ToolError(
        `The time range must satisfy 0 <= timeRangeStartMs < timeRangeEndMs <= ${maxMs}. ` +
          `Got ${startMs} to ${endMs}.`,
      );
    }

    if (intervalMs !== undefined) {
      settings.setUseIntervalFiltering(intervalMs > 0);
      if (intervalMs > 0) settings.setMinIntervalMs(intervalMs);
    }
    if (setsWindow || turnsRangeOn) {
      settings.setStartTimeMs(startMs);
      settings.setEndTimeMs(endMs);
    }
    if (setsWindow || timeRangeEnabled !== undefined) settings.setUseTimeRangeFilter(turnsRangeOn);
    if (showTimestamps !== undefined) settings.setExportShowTimestamps(showTimestamps);

    return readState();
  }),
};

const exportFilmStrip: WebMcpToolDescriptor = {
  name: "export_film_strip",
  title: "Export film strip",
  description:
    "Downloads the displayed frames to the user's device and returns the file name, frame count and pixel size. " +
    "png is one image with the frames side by side. gif is an animation with one frame every 500 milliseconds.",
  inputSchema: {
    type: "object",
    properties: {
      format: { type: "string", enum: ["png", "gif"], description: "The file format." },
    },
    required: ["format"],
  },
  execute: reportingErrors((input) => {
    const exportService = inject(FilmStripExportService);
    const frames = inject(FilmStripService).frames();
    if (!inject(TraceService).currentFile()) throw new ToolError(NO_TRACE_MESSAGE);

    const { format } = toObject(input);
    if (format !== "png" && format !== "gif") {
      throw new ToolError(`format must be "png" or "gif". Got ${JSON.stringify(format)}.`);
    }
    if (frames.length === 0) {
      throw new ToolError("The loaded trace has no screenshots, so there is nothing to export.");
    }

    return exportService.download(format, frames).catch((error: unknown) => {
      throw new ToolError(
        `The export failed. ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }),
};

/** The tools the app publishes to in-browser agents. */
export const filmStripTools: WebMcpToolDescriptor[] = [
  getFilmStripState,
  updateFilmStripSettings,
  exportFilmStrip,
];

function toObject(input: unknown): Record<string, unknown> {
  if (input === undefined || input === null) return {};
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new ToolError("The tool input must be a JSON object.");
  }
  return input as Record<string, unknown>;
}

function optionalInteger(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ToolError(`${key} must be a whole number. Got ${JSON.stringify(value)}.`);
  }
  return value;
}

function optionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ToolError(`${key} must be true or false. Got ${JSON.stringify(value)}.`);
  }
  return value;
}
