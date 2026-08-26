# AccessLens

**See your website through every user's lens.**

AccessLens is an AI-powered web accessibility reviewer that helps developers identify accessibility problems in HTML and understand how to fix them. The application combines deterministic accessibility testing using axe-core with AI-powered explanations from Google Gemini to provide practical developer guidance.

## Features

- **HTML Input Editor**: Paste any HTML snippet to analyze for accessibility issues
- **Deterministic Accessibility Testing**: Uses axe-core for reliable, standards-based accessibility detection
- **Severity-Based Results**: Issues are categorized by severity (Critical, Serious, Moderate, Minor)
- **AI-Powered Explanations**: Google Gemini provides detailed explanations of accessibility issues
- **WCAG Compliance**: References WCAG 2.1 AA standards for all findings
- **Interactive Results**: Select individual findings to see detailed information and remediation guidance
- **Code Examples**: AI provides corrected code examples when applicable
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility Compliant**: AccessLens itself meets WCAG 2.1 AA standards

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Accessibility Testing**: axe-core
- **AI Integration**: Google Gemini API (gemini-1.5-flash)
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier

## Architecture

AccessLens follows a clear separation of concerns between deterministic accessibility testing and AI enhancement:

```
HTML Input
    ↓
axe-core (Deterministic Testing)
    ↓
Structured Accessibility Findings
    ↓
Google Gemini API (AI Enhancement)
    ↓
Explanations + Remediation Guidance
```

### Why Deterministic Testing?

The application uses axe-core for accessibility detection rather than asking the LLM to identify violations. This approach ensures:

- **Reliability**: axe-core provides consistent, standards-based results
- **Accuracy**: Built-in accessibility rules are tested and validated
- **Performance**: Automated checks are faster than AI analysis
- **Standards Compliance**: Follows established WCAG guidelines
- **Audit Trail**: Clear, reproducible findings

The AI layer enhances the deterministic findings by providing:
- Human-readable explanations
- Context about why issues matter
- Information about affected users
- Step-by-step remediation guidance
- Code examples for fixes

## Local Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd accesslens
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file
4. **Never commit your `.env` file or API keys to version control**

### Running the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Testing

### Unit Tests

Run unit tests with Vitest:
```bash
npm test
```

### End-to-End Tests

Run E2E tests with Playwright:
```bash
npm run test:e2e
```

### Test Coverage

The test suite covers:
- HTML input rendering and validation
- Analyze button behavior
- Accessibility findings display
- Severity label rendering
- Error state handling
- AI loading states
- AI failure fallback behavior
- Copy-fix interaction
- Main user flow (HTML input → analyze → results → details)

## Accessibility

AccessLens itself is designed to meet WCAG 2.1 AA standards. The application includes:

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Visible focus indicators
- Form labels and error messages
- Accessible buttons and controls
- Appropriate ARIA attributes
- Sufficient color contrast
- Screen-reader-friendly status messages
- Responsive layout for all devices
- Touch-friendly controls

### Accessibility Testing

The application is tested using:
- axe-core for automated accessibility checks
- Manual keyboard navigation testing
- Screen reader compatibility testing
- Color contrast validation

## AI Integration

### Gemini Model

AccessLens uses Google Gemini 1.5 Flash for AI-powered explanations. This model was chosen for its:
- Fast response times
- Free tier availability
- Strong reasoning capabilities
- JSON output support

### Information Sent to AI

The following information is sent to the Gemini API for each accessibility finding:
- Rule ID
- Description
- Impact/severity
- Help text
- Affected HTML snippet
- WCAG tags

No personal data or user information is sent to the AI provider.

### Prompt Strategy

The system uses a structured prompt that:
- Provides context about the accessibility finding
- Requests specific output format (JSON)
- Defines required fields for the response
- Ensures consistent, actionable responses

### Structured Output

The AI returns JSON with the following structure:
```json
{
  "summary": "Brief 1-2 sentence summary",
  "whyItMatters": "Why this issue matters",
  "whoIsAffected": "Which users are affected",
  "recommendedFix": "Step-by-step fix instructions",
  "codeExample": "Optional corrected code example"
}
```

### Validation and Fallback

AI responses are validated before display:
- JSON structure validation
- Required field checking
- Error handling for malformed responses

If AI generation fails:
- Original accessibility findings remain visible
- axe-core help text is displayed
- Friendly error message is shown
- User can retry the explanation

The application remains fully functional without AI.

## Error Handling

AccessLens handles various error scenarios gracefully:

### Empty Input
- Validation message displayed when user tries to analyze empty HTML
- Clear error text with guidance

### Invalid HTML
- Graceful handling of malformed or unusual input
- Error messages guide user to correct input

### Scan Failure
- Understandable error message displayed
- Retry functionality available
- Original input preserved

### AI Unavailable
- Core accessibility results still work
- Clear message about AI unavailability
- Fallback to axe-core help text
- Retry option available

### API Rate Limit
- Friendly message rather than raw API error
- Guidance on rate limits and retry timing

### Network Failure
- Clear error communication
- Retry functionality
- Graceful degradation

### Unexpected AI Response
- Response validation before display
- Fallback to deterministic information
- Error logging for debugging

## Security Considerations

### HTML Input Handling
- User-provided HTML is treated as untrusted input
- HTML is analyzed in a controlled DOM environment
- No script execution from user input
- No unsafe rendering patterns

### API Key Protection
- API keys stored in environment variables
- `.env` file excluded from version control
- `.env.example` provided for setup reference
- No API keys in client-side code

### Data Privacy
- No personal data sent to AI provider
- Only accessibility findings shared with AI
- No data persistence or logging
- No third-party analytics

### Dependency Security
- Regular dependency updates
- Security audit of dependencies
- No unnecessary packages
- Minimal attack surface

## Performance

AccessLens is optimized for performance:

- **Bundle Size**: ~790KB (minified)
- **Lazy Loading**: Large dependencies loaded only when needed
- **Efficient Scanning**: axe-core provides fast accessibility checks
- **Optimized AI Calls**: Only called when user requests explanations
- **Code Splitting**: Vite automatic code splitting
- **Tree Shaking**: Unused code eliminated

### Performance Targets
- Lighthouse Performance: 85+
- Lighthouse Accessibility: 90+
- Lighthouse Best Practices: 90+
- Lighthouse SEO: 90+

## Known Limitations

AccessLens is an MVP with the following limitations:

- **Static HTML Only**: Analyzes supplied HTML snippets rather than live websites
- **No Dynamic State**: Cannot evaluate application states or interactions
- **Client-Side Only**: AI API key stored in environment variables (for MVP simplicity)
- **Manual Input**: Requires users to paste HTML rather than crawling websites
- **No History**: Does not save or share accessibility reports
- **Limited AI Model**: Uses free-tier Gemini with rate limits
- **Automated Testing Only**: Cannot detect all accessibility issues (human testing still needed)

### What Automated Tools Cannot Detect

- Semantic appropriateness of content
- Logical reading order
- Content clarity and simplicity
- Video caption quality
- Audio description quality
- Context-dependent accessibility issues

**Human accessibility testing is still necessary for comprehensive evaluation.**

## Future Improvements

Potential future enhancements:

- **Live URL Analysis**: Analyze websites by URL rather than HTML snippets
- **Browser Extension**: Chrome/Firefox extension for in-browser testing
- **Accessibility Regression Testing**: CI/CD integration for automated checks
- **Saved Reports**: User accounts and report history
- **Shareable Reports**: Generate shareable accessibility reports
- **GitHub Integration**: Pull request accessibility checks
- **Advanced AI**: More sophisticated AI models for complex issues
- **Mobile App**: Native mobile applications
- **Team Collaboration**: Multi-user support and team features
- **Custom Rules**: Custom accessibility rule configurations
- **Export Options**: PDF, CSV, and other export formats

## Deployment

AccessLens is configured for deployment on Vercel.

### Environment Variables

Configure the following environment variable in your deployment platform:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Deployment Steps

1. Push code to GitHub repository
2. Import project in Vercel
3. Configure environment variables
4. Deploy

See `DEPLOYMENT.md` for detailed deployment instructions.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [axe-core](https://www.deque.com/axe/) for accessibility testing
- [Google Gemini](https://ai.google.dev/) for AI-powered explanations
- [React](https://react.dev/) for the UI framework
- [Vite](https://vite.dev/) for the build tool
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Support

For issues, questions, or contributions, please visit the GitHub repository.
