import {
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  booleanAttribute,
  inject,
  input,
} from "@angular/core";

export type ButtonVariant = "primary" | "ghost" | "tertiary";

export type ButtonSize = "md" | "lg";

/** A PushBased button. Styles live in the global `.pb-btn` classes so a plain `<span>` can wear them too. */
@Component({
  selector: "button[pbButton], a[pbButton]",
  template: `<ng-content />`,
  host: {
    class: "pb-btn",
    "[class.pb-btn-lg]": "size() === 'lg'",
    "[class.pb-btn-full]": "fullWidth()",
    "[class.pb-btn-primary]": "variant() === 'primary'",
    "[class.pb-btn-ghost]": "variant() === 'ghost'",
    "[class.pb-btn-tertiary]": "variant() === 'tertiary'",
    "[attr.aria-disabled]": "disabled() || null",
  },
})
export class PbButton {
  readonly variant = input<ButtonVariant>("primary");

  readonly size = input<ButtonSize>("md");

  readonly fullWidth = input(false, { transform: booleanAttribute });

  /** Disables the button without removing it from the tab order, so it stays discoverable. */
  readonly disabled = input(false, { transform: booleanAttribute });

  constructor() {
    const stopListening = inject(Renderer2).listen(
      inject(ElementRef).nativeElement,
      "click",
      (event: Event) => this.swallowWhileDisabled(event),
      { capture: true },
    );

    inject(DestroyRef).onDestroy(stopListening);
  }

  private swallowWhileDisabled(event: Event): void {
    if (!this.disabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
