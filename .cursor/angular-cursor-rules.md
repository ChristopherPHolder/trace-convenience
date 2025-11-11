---
description: This rule provides comprehensive best practices and coding standards for Angular development, focusing on modern TypeScript, standalone components, signals, and performance optimizations.
globs: ["**/*.{ts,html,scss,css}"]
---

# Angular Best Practices

This project adheres to modern Angular best practices, emphasizing maintainability, performance, accessibility, and scalability.

## TypeScript Best Practices

* **Strict Type Checking:** Always enable and adhere to strict type checking. This helps catch errors early and improves code quality.
* **Prefer Type Inference:** Allow TypeScript to infer types when they are obvious from the context. This reduces verbosity while maintaining type safety.
    * **Bad:**
        ```typescript
        let name: string = 'Angular';
        ```
    * **Good:**
        ```typescript
        let name = 'Angular';
        ```
* **Avoid `any`:** Do not use the `any` type unless absolutely necessary as it bypasses type checking. Prefer `unknown` when a type is uncertain and you need to handle it safely.

## Angular Best Practices

* **Standalone Components:** Always use standalone components, directives, and pipes. Avoid using `NgModules` for new features or refactoring existing ones.
* **Implicit Standalone:** When creating standalone components, you do not need to explicitly set `standalone: true` inside the `@Component`, `@Directive` and `@Pipe` decorators, as it is implied by default.
    * **Bad:**
        ```typescript
        @Component({
          standalone: true,
          // ...
        })
        export class MyComponent {}
        ```
    * **Good:**
        ```typescript
        @Component({
          // `standalone: true` is implied
          // ...
        })
        export class MyComponent {}
        ```
* **Signals for State Management:** Utilize Angular Signals for reactive state management within components and services.
* **Lazy Loading:** Implement lazy loading for feature routes to improve initial load times of your application.
* **NgOptimizedImage:** Use `NgOptimizedImage` for all static images to automatically optimize image loading and performance.
* **Host bindings:** Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.

## Components

* **Single Responsibility:** Keep components small, focused, and responsible for a single piece of functionality.
* **`input()` and `output()` Functions:** Prefer `input()` and `output()` functions over the `@Input()` and `@Output()` decorators for defining component inputs and outputs.
    * **Old Decorator Syntax:**
        ```typescript
        @Input() userId!: string;
        @Output() userSelected = new EventEmitter<string>();
        ```
    * **New Function Syntax:**
        ```typescript
        import { input, output } from '@angular/core';

        // ...
        userId = input<string>('');
        userSelected = output<string>();
        ```
* **`computed()` for Derived State:** Use the `computed()` function from `@angular/core` for derived state based on signals.
* **`ChangeDetectionStrategy.OnPush`:** Always set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator for performance benefits by reducing unnecessary change detection cycles.
* **Inline Templates:** Prefer inline templates (template: `...`) for small components to keep related code together. For larger templates, use external HTML files.
* **Reactive Forms:** Prefer Reactive forms over Template-driven forms for complex forms, validation, and dynamic controls due to their explicit, immutable, and synchronous nature.
* **No `ngClass` / `NgClass`:** Do not use the `ngClass` directive. Instead, use native `class` bindings for conditional styling.
    * **Bad:**
        ```html
        <section [ngClass]="{'active': isActive}"></section>
        ```
    * **Good:**
        ```html
        <section [class.active]="isActive"></section>
        <section [class]="{'active': isActive}"></section>
        <section [class]="myClasses"></section>
        ```
* **No `ngStyle` / `NgStyle`:** Do not use the `ngStyle` directive. Instead, use native `style` bindings for conditional inline styles.
    * **Bad:**
        ```html
        <section [ngStyle]="{'font-size': fontSize + 'px'}"></section>
        ```
    * **Good:**
        ```html
        <section [style.font-size.px]="fontSize"></section>
        <section [style]="myStyles"></section>
        ```

## State Management

* **Signals for Local State:** Use signals for managing local component state.
* **`computed()` for Derived State:** Leverage `computed()` for any state that can be derived from other signals.
* **Pure and Predictable Transformations:** Ensure state transformations are pure functions (no side effects) and predictable.
* **Signal value updates:** Do NOT use `mutate` on signals, use `update` or `set` instead.

## Templates

* **Simple Templates:** Keep templates as simple as possible, avoiding complex logic directly in the template. Delegate complex logic to the component's TypeScript code.
* **Native Control Flow:** Use the new built-in control flow syntax (`@if`, `@for`, `@switch`) instead of the older structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).
    * **Old Syntax:**
        ```html
        <section *ngIf="isVisible">Content</section>
        <section *ngFor="let item of items">{{ item }}</section>
        ```
    * **New Syntax:**
        ```html
        @if (isVisible) {
          <section>Content</section>
        }
        @for (item of items; track item.id) {
          <section>{{ item }}</section>
        }
        ```
* **Async Pipe:** Use the `async` pipe to handle observables in templates. This automatically subscribes and unsubscribes, preventing memory leaks.

## Services

* **Single Responsibility:** Design services around a single, well-defined responsibility.
* **`providedIn: 'root'`:** Use the `providedIn: 'root'` option when declaring injectable services to ensure they are singletons and tree-shakable.
* **`inject()` Function:** Prefer the `inject()` function over constructor injection when injecting dependencies, especially within `provide` functions, `computed` properties, or outside of constructor context.
    * **Old Constructor Injection:**
        ```typescript
        constructor(private myService: MyService) {}
        ```
    * **New `inject()` Function:**
        ```typescript
        import { inject } from '@angular/core';

        export class MyComponent {
          private myService = inject(MyService);
          // ...
        }
        ```

## Accessibility Requirements

* **AXE Compliance:** All components MUST pass AXE accessibility checks.
* **WCAG AA Standards:** Follow WCAG AA minimums including focus management, color contrast, and ARIA attributes.

## Angular Style Guide (Official)

### File Naming Conventions

* **Separate words with hyphens:** Use hyphens (`-`) to separate words in file names (e.g., `user-profile.ts`)
* **Match file names to TypeScript identifiers:** File names should reflect the main class name within (e.g., `UserProfile` class → `user-profile.ts`)
* **Test file naming:** End unit test files with `.spec.ts` (e.g., `user-profile.spec.ts`)
* **Shared naming for component files:** Components should share the same base name across TypeScript, template, and style files:
    * TypeScript: `user-profile.ts`
    * Template: `user-profile.html`
    * Styles: `user-profile.css` or `user-profile.scss`
* **Multiple style files:** Append descriptive words for additional style files (e.g., `user-profile-settings.css`, `user-profile-subscription.css`)

### Project Structure

* **All UI code in `src/`:** All Angular UI code (TypeScript, HTML, styles) must live inside the `src` directory
* **Bootstrap in `main.ts`:** Application bootstrap code must be in `src/main.ts` as the primary entry point
* **Group related files together:** Keep component files (TS, HTML, CSS) and their tests in the same directory
* **Organize by feature areas:** Structure subdirectories by features/themes, NOT by code type
    * **Good:** `show-times/`, `reserve-tickets/`, `payment-info/`
    * **Avoid:** `components/`, `directives/`, `services/`
* **One concept per file:** Focus each file on a single concept (one component, directive, or service per file)
* **When in doubt, prefer consistency:** Maintain consistency within existing files over strict adherence to these rules

### Dependency Injection

* **Prefer `inject()` function:** Use `inject()` over constructor parameter injection for better readability, type inference, and flexibility
    * Especially important when targeting ES2022+ with `useDefineForClassFields`
    * Easier to add comments to injected dependencies
    * Better for use in `provide` functions and `computed` properties

### Component and Directive Best Practices

* **Use `protected` for template-only members:** Mark class members used only in templates as `protected`, not `public`
    ```typescript
    @Component({
      template: `<p>{{ fullName() }}</p>`,
    })
    export class UserProfile {
      firstName = input();
      lastName = input();
      
      // Not part of public API, but used in template
      protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
    }
    ```
* **Use `readonly` for Angular-initialized properties:** Mark properties initialized by Angular as `readonly`:
    * Properties from `input()`, `model()`, `output()`, and queries
    * This prevents accidental overwrites of Angular-managed values
    ```typescript
    @Component({/* ... */})
    export class UserProfile {
      readonly userId = input();
      readonly userSaved = output();
      readonly userName = model();
    }
    ```
* **Group Angular properties before methods:** Place Angular-specific properties (injected dependencies, inputs, outputs, queries) together near the top of the class, before methods
* **Focus on presentation:** Component/directive code should relate to UI; extract complex business logic to services or utility functions
* **Avoid complex template logic:** Refactor complex template expressions into `computed()` properties or methods in the TypeScript code
* **Name event handlers by action:** Name handlers for what they do, not the triggering event
    * **Good:** `(click)="saveUserData()"`
    * **Avoid:** `(click)="handleClick()"`
    * Exception: Use specific names like `handleKeydown()` when delegating to multiple behaviors
* **Keep lifecycle methods simple:** Extract complex logic from lifecycle hooks into well-named methods and call those methods instead
    ```typescript
    // Good
    ngOnInit() {
      this.startLogging();
      this.runBackgroundTask();
    }
    
    // Avoid putting all logic directly in ngOnInit
    ```
* **Implement lifecycle hook interfaces:** Always import and implement lifecycle interfaces (e.g., `OnInit`, `OnDestroy`) to ensure correct method naming
    ```typescript
    import { Component, OnInit } from '@angular/core';
    
    @Component({/* ... */})
    export class UserProfile implements OnInit {
      ngOnInit() { /* ... */ }
    }
    ```

### Directive Selectors

* **Use application prefix:** Directives should use the same application-specific prefix as components
* **Use camelCase for attribute selectors:** When using attribute selectors, use camelCase (e.g., `[appTooltip]`)

### Template Best Practices

* **No globals in templates:** Do not assume globals like `new Date()` are available in templates
* **No arrow functions in templates:** Do not write arrow functions in templates (they are not supported)
* **No regular expressions in templates:** Do not write regular expressions in templates (they are not supported)
* **When using external templates/styles:** Use paths relative to the component TS file
