import type { FlameChartCategory } from "./types";

type EventStyle = readonly [label: string, category: FlameChartCategory];

/**
 * The trace events the DevTools Performance panel draws on a thread, with the
 * label and the category it gives each. An event that is not listed is not
 * drawn, which keeps Chrome's internal events out of the chart.
 *
 * Mirrors the visible rows of the event styles in devtools-frontend
 * (`front_end/models/trace/Styles.ts`).
 */
const EVENT_STYLES: Readonly<Record<string, EventStyle>> = {
  RunTask: ["Task", "system"],
  Program: ["Other", "system"],
  "CpuProfiler::StartProfiling": ["Profiling overhead", "system"],
  "V8.FinalizeDeserialization": ["Profiling overhead", "system"],
  "v8.parseOnBackground": ["Streaming compile task", "system"],
  "v8.parseOnBackgroundWaiting": ["Waiting for network", "idle"],
  AsyncTask: ["Async task", "async"],

  ParseHTML: ["Parse HTML", "loading"],
  ParseAuthorStyleSheet: ["Parse stylesheet", "loading"],
  ResourceWillSendRequest: ["Will send request", "loading"],
  ResourceSendRequest: ["Send request", "loading"],
  ResourceReceiveResponse: ["Receive response", "loading"],
  ResourceReceivedData: ["Receive data", "loading"],
  ResourceFinish: ["Finish loading", "loading"],

  EventDispatch: ["Event", "scripting"],
  TimerInstall: ["Install timer", "scripting"],
  TimerRemove: ["Remove timer", "scripting"],
  TimerFire: ["Timer fired", "scripting"],
  XHRReadyStateChange: ["XHR readyState change", "scripting"],
  XHRLoad: ["XHR load", "scripting"],
  "v8.compile": ["Compile script", "scripting"],
  "v8.produceCache": ["Cache script code", "scripting"],
  "V8.CompileCode": ["Compile code", "scripting"],
  "V8.OptimizeCode": ["Optimize code", "scripting"],
  EvaluateScript: ["Evaluate script", "scripting"],
  "V8.CompileModule": ["Compile module", "scripting"],
  "v8.produceModuleCache": ["Cache module code", "scripting"],
  "v8.evaluateModule": ["Evaluate module", "scripting"],
  "v8.parseOnBackgroundParsing": ["Parse and compile", "scripting"],
  "v8.deserializeOnBackground": ["Deserialize code cache", "scripting"],
  "v8.wasm.streamFromResponseCallback": ["Streaming Wasm response", "scripting"],
  "v8.wasm.compiledModule": ["Compiled Wasm module", "scripting"],
  "v8.wasm.cachedModule": ["Cached Wasm module", "scripting"],
  "v8.wasm.moduleCacheHit": ["Wasm module cache hit", "scripting"],
  "v8.wasm.moduleCacheInvalid": ["Wasm module cache invalid", "scripting"],
  TimeStamp: ["Timestamp", "scripting"],
  ConsoleTime: ["Console time", "scripting"],
  UserTiming: ["User timing", "scripting"],
  RunMicrotasks: ["Run microtasks", "scripting"],
  FunctionCall: ["Function call", "scripting"],
  GCEvent: ["GC event", "scripting"],
  MajorGC: ["Major GC", "scripting"],
  MinorGC: ["Minor GC", "scripting"],
  "CppGC.IncrementalSweep": ["C++ GC", "scripting"],
  "BlinkGC.AtomicPhase": ["DOM GC", "scripting"],
  RequestAnimationFrame: ["Request animation frame", "scripting"],
  CancelAnimationFrame: ["Cancel animation frame", "scripting"],
  FireAnimationFrame: ["Animation frame fired", "scripting"],
  RequestIdleCallback: ["Request idle callback", "scripting"],
  CancelIdleCallback: ["Cancel idle callback", "scripting"],
  FireIdleCallback: ["Fire idle callback", "scripting"],
  WebSocketCreate: ["Create WebSocket", "scripting"],
  WebSocketSendHandshakeRequest: ["Send WebSocket handshake", "scripting"],
  WebSocketReceiveHandshakeResponse: ["Receive WebSocket handshake", "scripting"],
  WebSocketDestroy: ["Destroy WebSocket", "scripting"],
  WebSocketSend: ["Send WebSocket message", "scripting"],
  WebSocketReceive: ["Receive WebSocket message", "scripting"],
  EmbedderCallback: ["Embedder callback", "scripting"],
  DoEncrypt: ["Encrypt", "scripting"],
  DoEncryptReply: ["Encrypt reply", "scripting"],
  DoDecrypt: ["Decrypt", "scripting"],
  DoDecryptReply: ["Decrypt reply", "scripting"],
  DoDigest: ["Digest", "scripting"],
  DoDigestReply: ["Digest reply", "scripting"],
  DoSign: ["Sign", "scripting"],
  DoSignReply: ["Sign reply", "scripting"],
  DoVerify: ["Verify", "scripting"],
  DoVerifyReply: ["Verify reply", "scripting"],
  SchedulePostTaskCallback: ["Schedule postTask", "scripting"],
  RunPostTaskCallback: ["Fire postTask", "scripting"],
  AbortPostTaskCallback: ["Cancel postTask", "scripting"],
  "V8Console::runTask": ["Run console task", "scripting"],

  HandlePostMessage: ["On message", "messaging"],
  SchedulePostMessage: ["Schedule postMessage", "messaging"],

  Animation: ["Animation", "rendering"],
  HitTest: ["Hit test", "rendering"],
  ScheduleStyleRecalculation: ["Schedule style recalculation", "rendering"],
  UpdateLayoutTree: ["Recalculate style", "rendering"],
  Layerize: ["Layerize", "rendering"],
  Layout: ["Layout", "rendering"],
  UpdateLayerTree: ["Update layer tree", "rendering"],
  PrePaint: ["Pre-paint", "rendering"],
  ScrollLayer: ["Scroll", "rendering"],
  ComputeIntersections: ["Compute intersections", "rendering"],
  "IntersectionObserverController::computeIntersections": ["Compute intersections", "rendering"],
  EventTiming: ["Event timing", "rendering"],

  PaintSetup: ["Paint setup", "painting"],
  Paint: ["Paint", "painting"],
  RasterTask: ["Rasterize paint", "painting"],
  Commit: ["Commit", "painting"],
  CompositeLayers: ["Composite layers", "painting"],
  "Decode Image": ["Image decode", "painting"],
  GPUTask: ["GPU", "painting"],
};

/** The label and category of a trace event, or `undefined` when DevTools does not draw it. */
export function eventStyleOf(eventName: string): EventStyle | undefined {
  return Object.hasOwn(EVENT_STYLES, eventName) ? EVENT_STYLES[eventName] : undefined;
}

/**
 * Trace events that run JavaScript. CPU profile samples taken inside one of
 * these become JavaScript frames under it.
 */
export function isJsInvocation(eventName: string): boolean {
  switch (eventName) {
    case "RunMicrotasks":
    case "FunctionCall":
    case "EvaluateScript":
    case "EventDispatch":
    case "V8Console::runTask":
      return true;
    default:
      return eventName.startsWith("v8") || eventName.startsWith("V8");
  }
}
