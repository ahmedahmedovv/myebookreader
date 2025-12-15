# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: [Your email address]
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature

Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Best Practices

### API Keys

⚠️ **Important**: This application uses client-side API keys for Mistral AI. 

- API keys are stored in environment variables (`.env` file)
- The `.env` file is gitignored and should never be committed
- **Note**: Even with environment variables, API keys are still exposed in the client bundle since this is a client-side application
- For production deployments, consider:
  - Using a backend proxy to hide API keys
  - Implementing rate limiting
  - Monitoring API usage
  - Rotating keys regularly

### Environment Variables

Never commit `.env` files or expose API keys in:
- Source code
- Documentation
- Commit messages
- Public repositories

## Known Security Considerations

1. **Client-Side API Keys**: API keys are visible in the browser bundle
2. **No Rate Limiting**: Client-side rate limiting can be bypassed
3. **No Authentication**: The app doesn't require user authentication
4. **Local Storage**: Sensitive data may be stored in localStorage

## Recommendations

For production use:
- Implement a backend API proxy
- Add user authentication
- Implement server-side rate limiting
- Use secure storage for sensitive data
- Regularly audit dependencies for vulnerabilities

