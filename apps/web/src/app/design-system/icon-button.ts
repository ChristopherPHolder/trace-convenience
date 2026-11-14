import { Component, input } from "@angular/core";

export type IconButtonTone = "quiet" | "danger" | "overlay";

/** A square, icon-only button. Give it an `aria-label`. */
@Component({
  selector: "button[pbIconButton], a[pbIconButton]",
  template: `<ng-content />`,
  styles: `
    :host {
      appearance: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: var(--space-2);
      border: 1px solid transparent;
      border-radius: var(--radius-lg);
      background: transparent;
      color: var(--text-muted);
      text-decoration: none;
      transition:
        background-color var(--duration-base) ease-out,
        color var(--duration-base) ease-out,
        box-shadow var(--duration-base) ease-out;
    }

    :host:hover {
      background: var(--quiet-bg-hover);
      color: var(--text-heading);
    }

    :host(.danger:hover) {
      color: var(--danger-hover);
    }

    :host(.overlay) {
      padding: var(--space-3);
      border-radius: var(--radius-full);
      border-color: var(--border);
      background: var(--surface-raised);
      color: var(--text-heading);
      box-shadow: var(--shadow-lg);
    }

    :host(.overlay:hover) {
      background: var(--surface-subtle);
    }

    :host:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    :host:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    /* Low specificity, so a consumer can size its own icon. */
    :host ::ng-deep :where(svg) {
      display: block;
      width: 1.25rem;
      height: 1.25rem;
    }
  `,
  host: {
    "[class.danger]": "tone() === 'danger'",
    "[class.overlay]": "tone() === 'overlay'",
  },
})
export class PbIconButton {
  readonly tone = input<IconButtonTone>("quiet");
}
