import { Component, input } from "@angular/core";

export type NoticeKind = "info" | "error";

@Component({
  selector: "pb-notice",
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      padding: var(--space-2-5) var(--space-4);
      border: 1px solid var(--info-border);
      border-radius: var(--radius-lg);
      background: var(--info-bg);
      color: var(--info-text);
    }

    :host(.error) {
      border-color: var(--danger-border);
      background: var(--danger-bg);
      color: var(--danger-text);
    }
  `,
  host: { class: "text-body-sm", "[class.error]": "kind() === 'error'" },
})
export class PbNotice {
  readonly kind = input<NoticeKind>("info");
}
