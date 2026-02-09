# Contributing to InterviewGym

First off, thank you for considering contributing to InterviewGym! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to help people land their dream jobs.

## How Can I Contribute?

### Reporting Bugs

1. Check existing [Issues](https://github.com/arxel2468/interviewgym/issues) first
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues for similar suggestions
2. Open a new issue with the `enhancement` label
3. Describe the problem you're solving
4. Explain your proposed solution

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test:run`
5. Run linting: `npm run lint`
6. Run type check: `npm run typecheck`
7. Commit with a descriptive message
8. Push and open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/interviewgym.git
cd interviewgym

# Install dependencies
npm install

# Set up environment variables
cp .env.production.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma migrate dev

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities, AI integrations, database
└── test/          # Test setup and utilities
```

## Coding Standards

- **TypeScript**: Use strict types, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Files**: kebab-case for file names
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Testing

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Run with coverage
npm run test:coverage
```

## Questions?

Open an issue or start a discussion. We're happy to help!


