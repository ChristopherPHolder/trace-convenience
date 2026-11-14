import { Component } from "@angular/core";

@Component({
  selector: "[pbHeading]",
  template: `<ng-content />`,
  styles: `
    :host {
      margin: 0;
      color: var(--text-heading);
    }
  `,
  host: { class: "text-title" },
})
export class PbHeading {}
