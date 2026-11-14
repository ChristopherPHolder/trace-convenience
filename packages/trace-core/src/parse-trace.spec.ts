import { describe, expect, it } from "vite-plus/test";
import { formatTimestamp, getTimeDelta, parseTrace, toDataUri } from "./index";

describe("trace-core", () => {
  describe("parseTrace", () => {
    it("should throw error for invalid trace format", () => {
      expect(() => parseTrace(null)).toThrow("Invalid trace format");
      expect(() => parseTrace(undefined)).toThrow("Invalid trace format");
      expect(() => parseTrace("string")).toThrow("Invalid trace format");
    });

    it("should throw error for trace without events array", () => {
      expect(() => parseTrace({ traceEvents: "not-an-array" })).toThrow(
        "Trace events must be an array",
      );
    });

    it("should parse trace with no screenshots", () => {
      const trace = {
        traceEvents: [
          { name: "SomeEvent", ts: 1000 },
          { name: "AnotherEvent", ts: 2000 },
        ],
      };

      const result = parseTrace(trace);

      expect(result.screenshots).toEqual([]);
      expect(result.metadata.screenshotCount).toBe(0);
      // When there are no screenshots, metadata is all zeros
      expect(result.metadata.startTime).toBe(0);
      expect(result.metadata.endTime).toBe(0);
      expect(result.metadata.duration).toBe(0);
    });

    it("should extract Screenshot events", () => {
      const trace = {
        traceEvents: [
          {
            name: "Screenshot",
            cat: "disabled-by-default-devtools.screenshot",
            ts: 1000000,
            args: { snapshot: "/9j/base64data" },
          },
          {
            name: "Screenshot",
            cat: "disabled-by-default-devtools.screenshot",
            ts: 2000000,
            args: { snapshot: "iVBORbase64data" },
          },
        ],
      };

      const result = parseTrace(trace);

      expect(result.screenshots.length).toBe(2);
      expect(result.screenshots[0].data).toBe("/9j/base64data");
      expect(result.screenshots[0].format).toBe("jpeg");
      expect(result.screenshots[0].timestamp).toBe(1000000);
      expect(result.screenshots[1].data).toBe("iVBORbase64data");
      expect(result.screenshots[1].format).toBe("png");
    });

    it("should extract ScreencastFrame events", () => {
      const trace = {
        traceEvents: [
          {
            name: "ScreencastFrame",
            ts: 1000000,
            args: { dataUri: "data:image/jpeg;base64,/9j/test123" },
          },
        ],
      };

      const result = parseTrace(trace);

      expect(result.screenshots.length).toBe(1);
      expect(result.screenshots[0].data).toBe("/9j/test123");
      expect(result.screenshots[0].format).toBe("jpeg");
    });

    it("should sort screenshots by timestamp", () => {
      const trace = {
        traceEvents: [
          {
            name: "Screenshot",
            cat: "disabled-by-default-devtools.screenshot",
            ts: 3000000,
            args: { snapshot: "third" },
          },
          {
            name: "Screenshot",
            cat: "disabled-by-default-devtools.screenshot",
            ts: 1000000,
            args: { snapshot: "first" },
          },
          {
            name: "Screenshot",
            cat: "disabled-by-default-devtools.screenshot",
            ts: 2000000,
            args: { snapshot: "second" },
          },
        ],
      };

      const result = parseTrace(trace);

      expect(result.screenshots.length).toBe(3);
      expect(result.screenshots[0].data).toBe("first");
      expect(result.screenshots[1].data).toBe("second");
      expect(result.screenshots[2].data).toBe("third");
    });

    it("should handle empty trace events array", () => {
      const trace = { traceEvents: [] };
      const result = parseTrace(trace);

      expect(result.screenshots).toEqual([]);
      expect(result.metadata.screenshotCount).toBe(0);
      expect(result.metadata.startTime).toBe(0);
      expect(result.metadata.endTime).toBe(0);
    });
  });

  describe("toDataUri", () => {
    it("should create JPEG data URI", () => {
      const screenshot = {
        timestamp: 1000,
        data: "base64data",
        format: "jpeg" as const,
      };

      const result = toDataUri(screenshot);

      expect(result).toBe("data:image/jpeg;base64,base64data");
    });

    it("should create PNG data URI", () => {
      const screenshot = {
        timestamp: 1000,
        data: "base64data",
        format: "png" as const,
      };

      const result = toDataUri(screenshot);

      expect(result).toBe("data:image/png;base64,base64data");
    });
  });

  describe("formatTimestamp", () => {
    it("should format milliseconds", () => {
      expect(formatTimestamp(500, 0)).toBe("1ms");
      expect(formatTimestamp(500000, 0)).toBe("500ms");
    });

    it("should format seconds", () => {
      expect(formatTimestamp(1000000, 0)).toBe("1.00s");
      expect(formatTimestamp(1500000, 0)).toBe("1.50s");
      expect(formatTimestamp(10000000, 0)).toBe("10.00s");
    });

    it("should handle relative timestamps", () => {
      expect(formatTimestamp(2000000, 1000000)).toBe("1.00s");
      expect(formatTimestamp(1500000, 1000000)).toBe("500ms");
    });
  });

  describe("getTimeDelta", () => {
    it("should calculate time difference in milliseconds", () => {
      const screenshot1 = {
        timestamp: 1000000,
        data: "",
        format: "jpeg" as const,
      };
      const screenshot2 = {
        timestamp: 2000000,
        data: "",
        format: "jpeg" as const,
      };

      const delta = getTimeDelta(screenshot2, screenshot1);

      expect(delta).toBe(1000);
    });
  });
});
