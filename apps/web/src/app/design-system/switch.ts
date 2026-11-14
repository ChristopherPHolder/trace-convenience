import { Component, model } from '@angular/core';

/** An on/off switch. Give it an `aria-label` or point `aria-labelledby` at a visible label. */
@Component({
  selector: 'button[pbSwitch]',
  template: `<span class="thumb"></span>`,
  styles: `
    :host {
      appearance: none;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      width: 2.75rem;
      height: 1.5rem;
      padding: 0;
      border: none;
      border-radius: var(--radius-full);
      background: var(--border-control);
      transition:
        background-color var(--duration-base) ease-out,
        box-shadow var(--duration-base) ease-out;
    }

    :host([aria-checked='true']) {
      background: var(--btn-primary-bg);
    }

    :host:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    .thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: var(--radius-full);
      background: #ffffff;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-base) var(--ease-out);
    }

    :host([aria-checked='true']) .thumb {
      transform: translateX(1.25rem);
    }
  `,
  host: {
    type: 'button',
    role: 'switch',
    '[attr.aria-checked]': 'checked()',
    '(click)': 'checked.set(!checked())',
  },
})
export class PbSwitch {
  readonly checked = model(false);
}
