import { TestBed } from "@angular/core/testing";
import { App } from "./app";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it("should render title", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("h1")?.textContent).toContain("Trace Convenience");
  });

  it("should credit PushBased with a UTM-tagged link", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      "footer a",
    );
    const url = new URL(link?.href ?? "");
    expect(url.hostname).toBe("push-based.io");
    expect(url.searchParams.get("utm_source")).toBe("trace-convenience");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
  });
});
