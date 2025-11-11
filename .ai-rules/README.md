# AI Rules Directory

This directory contains AI coding assistant rules and guidelines for this Nx monorepo workspace.

## Files

### `nx-monorepo-rules.md`
Contains comprehensive Nx-specific best practices and guidelines for working with this monorepo, including:
- Project structure conventions
- Nx command usage
- Module boundaries and dependencies
- Code generation patterns
- Testing and building strategies
- File naming conventions

### `angular-cursor-rules.md`
Official Angular best practices from the Angular team (https://angular.dev/ai/develop-with-ai), including:
- TypeScript best practices
- Modern Angular patterns (standalone components, signals)
- Component design guidelines
- State management with signals
- Template syntax (native control flow)
- Service patterns with `inject()`
- Accessibility requirements

## Active Rules

The `.cursorrules` file in the workspace root combines both Nx and Angular guidelines into a single, unified set of rules that AI coding assistants (like Cursor) will automatically follow.

## Updating Rules

To update the Angular rules to the latest version:
```bash
curl -o .ai-rules/angular-cursor-rules.md https://angular.dev/assets/context/angular-20.mdc
```

## References

- [Angular AI Development Guide](https://angular.dev/ai/develop-with-ai)
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules)
- [Nx Documentation](https://nx.dev)

