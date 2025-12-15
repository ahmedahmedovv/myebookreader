# Contributing to EPUB Reader

Thank you for your interest in contributing to EPUB Reader! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/epub-reader-copy.git
   cd epub-reader-copy
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   ```
5. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Commit Messages

Please write clear commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally

Example:
```
Add keyboard navigation support

- Implement arrow key navigation
- Add Escape key to close panels
- Update documentation

Fixes #123
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** if applicable (we're working on adding tests)
3. **Ensure linting passes**: `npm run lint`
4. **Ensure the build succeeds**: `npm run build`
5. **Update the README** if needed
6. **Create a pull request** with a clear description

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added/updated (if applicable)
- [ ] All tests pass

## Areas for Contribution

We welcome contributions in the following areas:

- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Optimizations, lazy loading, caching improvements
- **Features**: New reading features, UI improvements, customization options
- **Documentation**: Code comments, README improvements, guides
- **Testing**: Unit tests, integration tests, E2E tests
- **Bug Fixes**: Fixing reported issues

## Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: Browser, OS, device information
- **Screenshots**: If applicable

## Feature Requests

For feature requests, please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider implementation complexity

## Questions?

Feel free to open an issue for questions or discussions. We're happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

