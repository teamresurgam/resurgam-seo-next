# Contributing to @resurgam/seo-next

Thank you for your interest in contributing to `@resurgam/seo-next`! We welcome contributions, bug reports, feature requests, and improvements.

---

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Development Setup

### Prerequisites

- **Node.js**: `>= 18.0.0` (Node 22 LTS recommended)
- **npm**: `>= 9.0.0`
- **Git**

### Getting the Code

1. Fork the repository on GitHub: [teamresurgam/resurgam-seo-next](https://github.com/teamresurgam/resurgam-seo-next).
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/resurgam-seo-next.git
   cd resurgam-seo-next
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## Workflow & Development Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Compiles TypeScript into ESM (`.mjs`), CJS (`.js`), and types (`.d.ts`) in `dist/` |
| `npm run typecheck` | Validates TypeScript types across source files (`tsc --noEmit`) |
| `npm test` | Runs the full Vitest automated test suite |
| `npm run test:watch` | Starts the Vitest interactive watch runner |
| `npm run test:coverage` | Runs tests and generates code coverage report |

---

## Git & Commit Standards

We follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```text
<type>(<optional scope>): <short description in imperative mood>

[optional body explaining motivation and context]

[optional footer(s), e.g., Closes #123]
```

### Types

- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix.
- `docs`: Documentation-only updates.
- `test`: Adding or modifying automated test suites.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Performance optimizations.
- `ci`: CI/CD workflows and configuration changes.
- `build`: Build system or dependency updates.
- `chore`: Repository maintenance tasks.

### Examples

```text
feat(metadata): add support for alternate hreflang canonicals
fix(client): normalize trailing slashes on custom endpoints
docs(api): clarify generateRobots parameter documentation
test(schema): add test suite for breadcrumb JSON-LD generator
```

---

## Pull Request Guidelines

1. **Create a topic branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Write clean, typed code**:
   - Ensure complete TypeScript safety (`noImplicitAny`, strict mode).
   - Maintain the zero-fallback guarantee (never fabricate SEO values when data is absent).
3. **Add automated tests**:
   - Every bug fix or new feature must include corresponding test cases in `tests/`.
4. **Verify checks locally**:
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```
5. **Open a Pull Request**:
   - Fill out the provided [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
   - Ensure all CI status checks pass.

---

## Reporting Issues

- **Bug Reports**: Please use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include steps to reproduce, expected vs. actual behavior, and environment details.
- **Feature Requests**: Please use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) describing the problem and proposed API design.
- **Security Vulnerabilities**: Refer to [SECURITY.md](SECURITY.md) for private disclosure instructions.
