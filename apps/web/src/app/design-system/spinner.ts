import { Component } from '@angular/core';

@Component({
  selector: 'pb-spinner',
  template: ``,
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
      border-top-color: currentColor;
      border-radius: var(--radius-full);
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class PbSpinner {}
