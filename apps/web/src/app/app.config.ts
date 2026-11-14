import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideExperimentalWebMcpTools,
  provideZoneChangeDetection,
} from "@angular/core";
import { filmStripTools } from "./webmcp/film-strip-tools";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Publishes the film strip to in-browser agents. Does nothing in a browser without WebMCP.
    provideExperimentalWebMcpTools(filmStripTools),
  ],
};
