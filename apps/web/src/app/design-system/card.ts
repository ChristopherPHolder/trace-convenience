import { Component, input } from "@angular/core";

export type CardTone = "subtle" | "raised";

@Component({
  selector: "pb-card",
  template: `<ng-content />`,
  styles: `
    :host(.raised) {
      background: var(--surface-raised);
      box-shadow: var(--shadow-sm);
    }
  `,
  host: { class: "pb-card", "[class.raised]": "tone() === 'raised'" },
})
export class PbCard {
  readonly tone = input<CardTone>("subtle");
}
