import { Component, input } from "@angular/core";

export type BadgeTone = "done" | "brand" | "quiet";

@Component({
  selector: "pb-badge",
  template: `<ng-content />`,
  styles: `
    :host {
      --badge-bg: var(--surface-sunken);
      --badge-color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-0-5) var(--space-2);
      border-radius: var(--radius-full);
      background: var(--badge-bg);
      color: var(--badge-color);
      font-weight: 600;
      white-space: nowrap;
    }

    :host(.done) {
      --badge-bg: var(--success-bg);
      --badge-color: var(--success-text);
    }

    :host(.brand) {
      --badge-bg: var(--accent-soft);
      --badge-color: var(--accent-soft-text);
    }
  `,
  host: { class: "text-caption", "[class]": "tone()" },
})
export class PbBadge {
  readonly tone = input<BadgeTone>("quiet");
}
