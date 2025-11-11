# Nx Monorepo Cursor Rules

## Project Structure
- This is an Nx monorepo workspace
- Apps are located in `apps/` directory
- Libraries should be created in `libs/` directory (when needed)
- Each project has its own `project.json` configuration file

## Nx Commands
- Always use `nx` commands instead of `npm` scripts when possible
- Run commands with: `nx [target] [project]` (e.g., `nx build web`, `nx test web`)
- Use `nx affected` commands to run tasks only on affected projects
- Use `nx graph` to visualize project dependencies
- Use `nx run-many` to run tasks across multiple projects

## Module Boundaries
- Respect module boundaries defined in ESLint configuration
- Projects should only depend on libraries with compatible tags
- Use `@nx/enforce-module-boundaries` rule to enforce import restrictions
- Avoid circular dependencies between projects

## Code Generation
- Use Nx generators to create new projects, components, and services
- Angular apps: Use `@nx/angular` generators (e.g., `nx g @nx/angular:component`)
- Always specify the project when generating code: `nx g @nx/angular:component my-component --project=web`
- Follow the existing project structure and naming conventions

## Dependencies
- Add dependencies to the root `package.json` only
- Use `@nx/dependency-checks` to ensure dependencies are properly declared
- Avoid installing packages in individual project directories
- Keep versions consistent across the monorepo

## Caching and Performance
- Nx caches build outputs and test results automatically
- Ensure proper `inputs` and `outputs` are defined in `project.json` or `nx.json`
- Use `namedInputs` in `nx.json` for reusable input patterns
- Define `targetDefaults` in `nx.json` for common target configurations

## Testing
- This workspace uses Vitest for testing
- Test files should be colocated with source files using `.spec.ts` suffix
- Run tests with: `nx test [project]`
- Use `nx affected:test` to test only affected projects

## Building
- Build apps with: `nx build [project]`
- Use `nx affected:build` to build only affected projects
- Build outputs are cached by default for faster rebuilds

## Angular-Specific Rules
- This workspace uses Angular 20.3.0
- Use standalone components (no NgModules)
- Component selectors should use `app` prefix
- Follow kebab-case for component selectors
- Use camelCase for directive selectors
- Always import required dependencies in component `imports` array

## ESLint Configuration
- Root ESLint config is in `eslint.config.mjs`
- Project-specific configs extend the root config
- Nx rules are enforced via `@nx/eslint-plugin`
- Always fix linting errors before committing

## Best Practices
- Keep the project graph acyclic (no circular dependencies)
- Use libraries to share code between applications
- Tag libraries appropriately for access control
- Use Nx Cloud for distributed caching and task execution (already configured)
- Leverage `nx affected` commands in CI/CD pipelines

## File Naming Conventions
- Use kebab-case for file names
- Component files: `component-name.ts`, `component-name.html`, `component-name.scss`
- Test files: `*.spec.ts`
- Configuration files: `*.config.ts` or `*.config.mjs`

## Import Paths
- Use TypeScript path mappings defined in `tsconfig.base.json`
- Prefer absolute imports using workspace aliases
- Import from project's public API (barrel exports) when available

## When Making Changes
- Always check if changes affect other projects using `nx affected:graph`
- Run affected tests and builds before considering work complete
- Ensure all linting passes with `nx affected:lint`
- Update project dependencies in `project.json` if adding new inter-project dependencies

