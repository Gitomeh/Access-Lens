# AccessLens

**AI-Powered Web Accessibility Auditor**

AccessLens is a production-grade accessibility auditing tool that combines deterministic testing with AI-powered explanations to help developers identify, understand, and fix accessibility issues in their web applications.

## What It Does

AccessLens provides two primary workflows for accessibility analysis:

### URL Analysis
- Enter any public website URL
- Server-side fetching with comprehensive SSRF protection
- Automated accessibility scanning using axe-core
- AI-powered explanations of findings via Google Gemini
- WCAG success criterion references
- Practical remediation guidance with code examples

### HTML Analysis
- Paste HTML code directly into the editor
- Same axe-core scanning and AI explanation pipeline
- 500KB input size limit for performance
- Character count display
- Clear and reset functionality

### Core Components
- **axe-core**: Performs deterministic accessibility detection based on WCAG rules
- **Google Gemini**: Provides human-readable explanations and remediation guidance
- **SSRF Protection**: Blocks internal/private addresses, cloud metadata endpoints
- **Rate Limiting**: Prevents API abuse (10 requests/minute, 60 requests/hour per IP)
- **Input Validation**: Server-side limits on request size, URL length, and response size

## Live Demo

https://access-lens-coral.vercel.app/

## Screenshots

> **Note**: Screenshots should be added here showing:
> 1. Landing page with hero section and "How It Works"
> 2. URL input and fetch functionality
> 3. Accessibility results dashboard with severity breakdown
> 4. Issue details panel with AI explanation
> 5. Code example and remediation guidance

## Features

- **Deterministic Accessibility Testing**: axe-core provides consistent, standards-based detection
- **AI-Powered Explanations**: Gemini delivers practical, developer-focused guidance
- **Server-Side URL Fetching**: Secure fetching with comprehensive SSRF protection
- **Severity-Based Results**: Issues categorized by Critical, Serious, Moderate, and Minor
- **Manual Review Items**: Identifies findings requiring human verification
- **WCAG References**: All findings include WCAG success criterion tags
- **Interactive Results**: Select findings to view detailed remediation guidance
- **Code Examples**: AI provides corrected code when applicable
- **Accessible Interface**: AccessLens itself designed against WCAG 2.2 AA practices
- **Rate Limiting**: API abuse protection with 429 responses
- **Input Validation**: Server-side size limits and content validation
- **Graceful Degradation**: Full functionality without AI; fallback to axe-core help text

## Tech Stack

### Frontend
- **React**: 19.2.8 - UI framework
- **TypeScript**: 6.0.2 - Type safety
- **Vite**: 8.2.2 - Build tool and dev server
- **Tailwind CSS**: 3.4.0 - Styling

### Accessibility
- **axe-core**: 4.13.0 - Deterministic accessibility testing

### AI
- **Google Gemini**: 1.5 Flash - AI-powered explanations

### Testing
- **Vitest**: 4.1.11 - Unit testing
- **React Testing Library**: 16.3.2 - Component testing
- **Playwright**: 1.62.1 - E2E testing

### Code Quality
- **ESLint**: 9.39.5 - Linting
- **oxlint**: 1.79.0 - Fast linting
- **Prettier**: 3.9.6 - Code formatting

## Architecture

```
User Input (URL or HTML)
    ↓
Client-Side Validation
    ↓
Server API (/api/fetch or /api/explain)
    ↓
Rate Limiting (10 req/min, 60 req/hour)
    ↓
Input Size Validation
    ↓
URL Processing (if URL)
    ├─ SSRF Protection
    ├─ Protocol Validation (HTTP/HTTPS only)
    ├─ Address Blocking (localhost, private IPs, cloud metadata)
    ├─ Redirect Validation
    └─ Content-Type Validation
    ↓
HTML Processing
    ├─ Sanitization
    └─ Size Limits (2MB max)
    ↓
axe-core Scan
    ↓
Structured Accessibility Findings
    ├─ Violations (Critical, Serious, Moderate, Minor)
    ├─ Passes
    └─ Incomplete (Needs Manual Review)
    ↓
Results Dashboard
    ↓
User Selects Finding
    ↓
Gemini API Call (Server-Side)
    ├─ Prompt Engineering
    ├─ Timeout (15s)
    └─ Response Validation
    ↓
AI Explanation
    ├─ Summary
    ├─ Why It Matters
    ├─ Who Is Affected
    ├─ Recommended Fix
    └─ Code Example
    ↓
Finding Details Panel
```

## Security

### SSRF Protection
URL fetching implements comprehensive SSRF protections:

- **Protocol Validation**: Only HTTP and HTTPS allowed
- **Blocked Addresses**: localhost, 127.0.0.1, private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- **Link-Local Blocking**: 169.254.0.0/16, fe80::/10, fc00::/7
- **Cloud Metadata**: Blocks 169.254.169.254 and metadata.google.internal
- **Redirect Validation**: Revalidates destination after each redirect
- **Request Limits**: 15-second timeout, 2MB response size limit
- **Content Validation**: Checks content-type for HTML

### API Key Security
- Gemini API key stored in `GEMINI_API_KEY` environment variable (server-side only)
- Never exposed to client code (no `NEXT_PUBLIC_*` or `VITE_*` prefix)
- `.env` file excluded from version control
- API calls made server-side via `/api/explain` endpoint

### Rate Limiting
- **Per-IP Limits**: 10 requests/minute, 60 requests/hour
- **Implementation**: In-memory rate limiter (see limitations below)
- **Response**: HTTP 429 with `Retry-After` header
- **Limitation**: In-memory storage not shared across Vercel serverless instances

### Input Validation
- **Request Body Size**: 100KB max for `/api/explain`, 10KB max for `/api/fetch`
- **URL Length**: 2,000 characters max
- **Response Size**: 2MB max for fetched HTML
- **HTML Input**: 500KB max for direct HTML input
- **Content-Type**: Validates HTML content-type for URL fetches

### HTML Sanitization
- User HTML sanitized before analysis
- Script tags and event handlers removed
- JavaScript protocols blocked
- Analysis performed in isolated DOM environment

## Accessibility

AccessLens itself is designed and tested against WCAG 2.2 AA practices:

- **Semantic HTML**: Proper heading hierarchy, landmarks, and structure
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **ARIA Attributes**: Landmarks, live regions, and appropriate roles
- **Form Labels**: All inputs have associated labels
- **Error Messages**: Clear, accessible error announcements
- **Color Contrast**: 4.5:1 for text, 3:1 for large text
- **Screen Reader**: Compatible announcements and descriptions
- **Responsive Design**: Works across desktop and mobile devices

### Limitations
Automated testing cannot detect:
- Semantic appropriateness of content
- Logical reading order
- Content clarity and simplicity
- Video caption quality
- Audio description quality
- Context-dependent accessibility issues

**Manual testing is still required for comprehensive evaluation. AccessLens is designed to supplement, not replace, manual accessibility testing.**

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone repository
git clone https://github.com/Gitomeh/Access-Lens.git
cd Access-Lens

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Add Gemini API key to .env
GEMINI_API_KEY=your_api_key_here
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` file
4. **Never commit `.env` or API keys to version control**

### Development Commands

```bash
# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable         | Required | Description                           |
| ---------------- | -------- | ------------------------------------- |
| `GEMINI_API_KEY` | Yes      | Gemini API key used server-side only   |

**Important**: Do not prefix with `VITE_` or `NEXT_PUBLIC_` as this would expose the key to client-side code.

## Testing

### Test Coverage
- **Unit Tests**: 72 tests covering URL validation, SSRF protection, HTML sanitization, result parsing, API endpoints, and component behavior
- **Integration Tests**: API endpoint behavior, error handling, Gemini integration
- **E2E Tests**: Complete user flows, keyboard navigation, accessibility

### Running Tests

```bash
# Unit tests with Vitest
npm test

# E2E tests with Playwright
npm run test:e2e

# Watch mode
npm test -- --watch
```

### Current Test Results
- Tests: 72/72 passing
- Lint: PASS
- TypeScript: PASS
- Build: PASS

## Deployment

### Vercel Deployment

AccessLens is deployed on Vercel with serverless functions.

#### Environment Variables
Configure in Vercel project settings:
- `GEMINI_API_KEY`: Server-side environment variable (not client-side)

#### Build Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite

#### Serverless Functions
- `/api/explain`: Generates AI explanations
- `/api/fetch`: Fetches HTML from URLs with SSRF protection

#### Deployment Steps
1. Push code to GitHub repository
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Engineering Decisions

### Why axe-core?
axe-core performs deterministic accessibility detection based on established WCAG rules. Using a rules-based engine for detection ensures:
- **Consistency**: Same input always produces same results
- **Accuracy**: Rules are tested and validated by accessibility experts
- **Standards Compliance**: Follows WCAG 2.1/2.2 guidelines
- **Audit Trail**: Clear, reproducible findings
- **Performance**: Faster than AI-based detection

AI is used only for explanation and remediation guidance, not for determining whether an issue exists.

### Why Gemini?
Gemini 1.5 Flash was chosen for AI explanations because:
- **Free Tier**: Available without immediate cost for development
- **Fast Response**: Low latency for user experience
- **JSON Output**: Structured response format for reliable parsing
- **Strong Reasoning**: Capable of providing practical developer guidance

The AI layer enhances deterministic findings with human-readable explanations but is never the source of truth for accessibility violations.

### Why Server-Side URL Fetching?
Client-side URL fetching is vulnerable to Server-Side Request Forgery (SSF) attacks. Server-side fetching enables:
- **SSRF Protection**: Block internal/private addresses
- **CORS Bypass**: Fetch pages that don't allow cross-origin requests
- **Security**: Keep API keys and validation logic server-side
- **Control**: Enforce timeouts, size limits, and content validation

### Why Input Limits?
Input limits protect against:
- **API Cost**: Prevent unlimited Gemini API consumption
- **Denial of Service**: Prevent resource exhaustion
- **Performance**: Ensure reasonable response times
- **Abuse**: Discourage automated abuse

### Why "Needs Review"?
Automated accessibility tools cannot evaluate every WCAG success criterion. Some findings require human judgment for:
- Context appropriateness
- Content clarity
- Logical reading order
- Video/audio quality

The "Needs Review" category transparently communicates these limitations.

## How AI Tools Built This

This project was developed with assistance from AI coding tools (Cascade/Devin). AI was used to:

- **Implementation**: Generate and refactor code for components, API handlers, and utility functions
- **Testing**: Create unit tests, integration tests, and E2E test scenarios
- **Debugging**: Identify and fix TypeScript errors, lint issues, and test failures
- **Documentation**: Draft README content, API documentation, and code comments
- **Security**: Implement SSRF protection, rate limiting, and input validation

### Human Engineering Judgment
All AI-generated code was reviewed, tested, and validated. Human judgment was required for:

- **SSRF Risk Assessment**: Evaluating which addresses and patterns to block
- **API Security**: Ensuring API keys remain server-side only
- **Accessibility Limitations**: Understanding what automated tools cannot detect
- **WCAG Interpretation**: Applying WCAG guidelines appropriately
- **Architecture Decisions**: Choosing deterministic testing over AI-based detection
- **Product Requirements**: Defining the scope and features of the application
- **Production Readiness**: Validating security, performance, and deployment requirements
- **Code Review**: Ensuring generated code follows best practices and is maintainable

AI was a force multiplier for implementation speed and test coverage, but human oversight ensured security, accessibility, and production quality.

## Browser Testing

The application has been tested in:
- **Chrome**: Desktop (latest)
- **Firefox**: Desktop (latest)
- **Safari**: Desktop (latest)
- **Mobile**: Responsive design tested via Chrome DevTools

Full cross-browser testing on physical mobile devices is recommended before production use.

## Remaining Limitations

- **Rate Limiting**: In-memory implementation not shared across Vercel serverless instances
- **No Authentication**: No user accounts or authentication
- **No History**: Does not save or share accessibility reports
- **Static Analysis**: Cannot evaluate dynamic application states
- **AI Dependency**: AI explanations require Gemini API availability
- **Manual Testing Required**: Automated testing cannot establish full WCAG conformance
- **Single-User Focus**: Not designed for team collaboration or enterprise features

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [axe-core](https://www.deque.com/axe/) for accessibility testing
- [Google Gemini](https://ai.google.dev/) for AI-powered explanations
- [React](https://react.dev/) for the UI framework
- [Vite](https://vite.dev/) for the build tool
- [Tailwind CSS](https://tailwindcss.com/) for styling
