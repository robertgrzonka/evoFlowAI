# Contributing to evoFlowAI

Thank you for your interest in contributing to evoFlowAI! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/evoflowai.git`
3. Install dependencies: `npm run install:all`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## 📋 Development Workflow

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Follow the existing code style
- **Naming**: Use descriptive names for variables, functions, and components
- **Comments**: Add comments for complex logic

### Commit Messages

Follow conventional commit format:
```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Branch Naming

Use descriptive branch names:
- `feature/` - for new features
- `fix/` - for bug fixes
- `docs/` - for documentation updates
- `refactor/` - for code refactoring

## 🧪 Testing

Before submitting a PR:
1. Test your changes locally
2. Run type checking: `npm run type-check` (in web/)
3. Build the project: `npm run build`
4. Ensure no console errors

## 📝 Pull Request Process

1. Update documentation if needed
2. Add/update tests if applicable
3. Ensure your code follows the project's style
4. Write a clear PR description:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes

## 🏗️ Project Structure

```
evoflowai/
├── backend/          # Node.js GraphQL API
├── web/              # Next.js web application
├── shared/           # Shared TypeScript types
├── ios/              # iOS SwiftUI application
└── docs/             # Documentation
```

## 🎨 Design Guidelines

### Dark Theme Colors
- Background: `#0a0a0a`
- Surface: `#1a1a1a`
- Primary Accent: `#8B4B6B` (dark pink)
- Text Primary: `#ffffff`
- Text Secondary: `#d1d5db`

### UI Components
- Use Tailwind CSS for web styling
- Follow SwiftUI best practices for iOS
- Maintain consistency with existing components
- Ensure responsive design for web

## 🐛 Bug Reports

When reporting bugs, include:
1. Description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment details (OS, browser, etc.)

## 💡 Feature Requests

For feature requests, provide:
1. Clear description of the feature
2. Use case and motivation
3. Proposed implementation (optional)
4. Any relevant examples or mockups

## 📚 Documentation

- Update README.md for user-facing changes
- Update SETUP.md for installation/configuration changes
- Add inline comments for complex code
- Update API documentation for GraphQL changes

## 🔒 Security

If you discover a security vulnerability:
1. **Do not** open a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability

## ✅ Code Review

All submissions require review. We will:
- Review code quality and style
- Test functionality
- Provide constructive feedback
- Merge once approved

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Collaborate and communicate openly

## 📞 Contact

For questions or discussions:
- Open an issue for bugs or features
- Use discussions for general questions
- Contact maintainers for sensitive matters

---

Thank you for contributing to evoFlowAI! 🌟

