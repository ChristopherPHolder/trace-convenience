import { ComponentFixture, TestBed } from "@angular/core/testing";
import { traceFile, traceWithTasksAt } from "../../../testing/trace-fixture";
import { TraceService } from "../../services/trace.service";
import { TraceToolsComponent } from "./trace-tools";

describe("TraceToolsComponent", () => {
  let fixture: ComponentFixture<TraceToolsComponent>;
  let element: HTMLElement;

  const tabs = () => Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const selectedTab = () => tabs().find((tab) => tab.getAttribute("aria-selected") === "true");
  const press = (key: string) => {
    element
      .querySelector('[role="tablist"]')!
      .dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TraceToolsComponent] }).compileComponents();
    TestBed.inject(TraceService).addFile(traceFile(), traceWithTasksAt([[0, 100]]));

    fixture = TestBed.createComponent(TraceToolsComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it("has a tab for each tool", () => {
    expect(tabs().map((tab) => tab.textContent?.trim())).toEqual(["Film strip", "Flame chart"]);
  });

  it("opens on the film strip", () => {
    expect(selectedTab()?.textContent?.trim()).toBe("Film strip");
    expect(element.querySelector("app-film-strip")).not.toBeNull();
    expect(element.querySelector("app-flame-chart")).toBeNull();
  });

  it("shows the flame chart when its tab is chosen", () => {
    tabs()[1].click();
    fixture.detectChanges();

    expect(selectedTab()?.textContent?.trim()).toBe("Flame chart");
    expect(element.querySelector("app-flame-chart")).not.toBeNull();
    expect(element.querySelector("app-film-strip")).toBeNull();
  });

  it("ties the panel to the selected tab", () => {
    tabs()[1].click();
    fixture.detectChanges();

    const panel = element.querySelector('[role="tabpanel"]')!;
    expect(panel.id).toBe("tool-panel-flame-chart");
    expect(panel.getAttribute("aria-labelledby")).toBe(selectedTab()?.id);
    expect(selectedTab()?.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("keeps only the selected tab in the tab order", () => {
    expect(tabs().map((tab) => tab.getAttribute("tabindex"))).toEqual(["0", "-1"]);
  });

  it("moves between the tabs with the arrow keys, Home and End", () => {
    press("ArrowRight");
    expect(selectedTab()?.textContent?.trim()).toBe("Flame chart");
    expect(document.activeElement).toBe(tabs()[1]);

    press("ArrowRight");
    expect(selectedTab()?.textContent?.trim()).toBe("Film strip");

    press("End");
    expect(selectedTab()?.textContent?.trim()).toBe("Flame chart");

    press("Home");
    expect(selectedTab()?.textContent?.trim()).toBe("Film strip");

    press("ArrowLeft");
    expect(selectedTab()?.textContent?.trim()).toBe("Flame chart");
  });
});
