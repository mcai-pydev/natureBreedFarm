# Contributing to Nature Breed Farm

Thank you for your interest in contributing to Nature Breed Farm! This document provides guidelines and instructions for contributing to our project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue tracker to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed and what behavior you expected to see
- Include screenshots if applicable
- Provide device and environment information

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Any possible alternatives you've considered
- Whether your feature would require new dependencies
- Mockups or examples if applicable

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow our coding standards and style
- Document new code based on our documentation standards
- Update the documentation when necessary
- Include comprehensive tests
- Avoid platform-dependent code

## Development Process

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/nature-breed-farm.git`
3. Add the main repository as a remote: `git remote add upstream https://github.com/original-org/nature-breed-farm.git`
4. Install dependencies: `npm install`
5. Create a branch for your feature: `git checkout -b feature/your-feature-name`

### Coding Standards

We follow these coding standards:

- Use TypeScript for type safety
- Follow the Airbnb JavaScript Style Guide
- Write self-documenting code with descriptive variable names
- Use comments to explain why, not what
- Keep functions small and focused on a single responsibility
- Write and run tests for your code

### Commit Guidelines

We use conventional commits to standardize our commit messages:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Updates to build process, dependencies, etc.

Example: `feat(shop): add mobile-friendly product filters`

### Pull Request Process

1. Update the README.md or documentation with details of changes if applicable
2. Update the tests to reflect your changes
3. Ensure all tests pass before submitting your pull request
4. Get your pull request reviewed by at least one maintainer
5. Make any requested changes from the review
6. A maintainer will merge your pull request once it's ready

## Mobile First Development Guidelines

Since our application prioritizes mobile experience, please follow these guidelines:

1. Design for the smallest screens first, then enhance for larger screens
2. Test all features on mobile devices or emulators
3. Ensure touch targets are at least 44x44 pixels
4. Optimize images and assets for low-bandwidth environments
5. Consider offline functionality whenever possible
6. Use relative units (%, em, rem) instead of fixed pixels for layout
7. Test on a variety of mobile devices and screen sizes

## Accessibility Guidelines

1. Ensure proper color contrast (minimum 4.5:1 for normal text)
2. Include proper alt text for images
3. Ensure all interactive elements are keyboard accessible
4. Use semantic HTML elements
5. Test with screen readers
6. Support text scaling up to 200%

## Internationalization Guidelines

1. Use translation keys instead of hardcoded text
2. Avoid idioms or colloquialisms that may not translate well
3. Consider text expansion in different languages (allow space for longer text)
4. Support right-to-left languages when possible
5. Use culturally-neutral icons and images

## Additional Resources

- [Project Documentation](../docs)
- [Design Guidelines](../docs/design-guidelines.md)
- [API Documentation](../docs/api.md)

Thank you for contributing to Nature Breed Farm!