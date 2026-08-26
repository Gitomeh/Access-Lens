# Deployment Guide

This guide covers deploying AccessLens to production, specifically for Vercel.

## Prerequisites

- GitHub repository with AccessLens code
- Vercel account (free tier works)
- Google Gemini API key

## Deployment Checklist

### Pre-Deployment

- [ ] **Production build succeeds**
  ```bash
  npm run build
  ```
  Verify the build completes without errors.

- [ ] **Environment variables configured**
  - `VITE_GEMINI_API_KEY` set in Vercel project settings
  - API key obtained from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - `.env` file exists locally for development

- [ ] **No secrets committed**
  - `.env` file in `.gitignore`
  - No API keys in source code
  - No sensitive data in repository

- [ ] **Core accessibility scan works**
  - Test with sample HTML input
  - Verify axe-core integration
  - Check results display correctly

- [ ] **AI explanation works**
  - Test with valid API key
  - Verify AI responses display
  - Check error handling

- [ ] **AI failure fallback works**
  - Test with invalid API key
  - Verify graceful degradation
  - Check fallback to axe-core help text

- [ ] **Error states tested**
  - Empty input validation
  - Invalid HTML handling
  - Network failure simulation
  - API rate limit handling

- [ ] **Unit tests pass**
  ```bash
  npm test
  ```
  Verify all unit tests pass.

- [ ] **E2E test passes**
  ```bash
  npm run test:e2e
  ```
  Verify end-to-end tests pass.

- [ ] **Lighthouse audit completed**
  - Performance score: 85+
  - Accessibility score: 90+
  - Best Practices score: 90+
  - SEO score: 90+

- [ ] **Accessibility audit completed**
  - Run axe-core against AccessLens itself
  - Fix all serious accessibility violations
  - Verify WCAG 2.1 AA compliance

- [ ] **Mobile layout checked**
  - Test on mobile devices
  - Verify responsive design
  - Check touch interactions

- [ ] **Production URL verified**
  - Deploy to staging/production
  - Test live application
  - Verify all functionality works

- [ ] **Rollback procedure documented**
  - See Rollback Plan below

## Vercel Deployment

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub
2. Verify `.gitignore` includes:
   ```
   .env
   .env.local
   node_modules
   dist
   ```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the Vite configuration

### Step 3: Configure Environment Variables

1. In Vercel project settings, go to "Environment Variables"
2. Add the following variable:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your actual Gemini API key
3. Click "Save"

### Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Vercel will provide a production URL

### Step 5: Verify Deployment

1. Visit the production URL
2. Test the main user flow:
   - Enter HTML sample
   - Analyze accessibility
   - View results
   - Test AI explanation (if API key configured)
3. Test error states
4. Check mobile responsiveness

## Environment Variables

### Required Variables

- `VITE_GEMINI_API_KEY`: Google Gemini API key for AI explanations

### Getting Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add to Vercel environment variables

**Important**: Never commit API keys to version control.

## Rollback Plan

If a deployment causes issues, follow this rollback procedure:

### Immediate Rollback

1. **Vercel Automatic Rollbacks**
   - Vercel keeps previous deployments
   - Go to your project in Vercel Dashboard
   - Navigate to "Deployments"
   - Find the previous successful deployment
   - Click "Promote to Production"

### Manual Rollback

1. **Git-Based Rollback**
   ```bash
   # Revert to previous commit
   git revert <commit-hash>
   git push origin main
   ```
   - Vercel will automatically redeploy
   - Monitor the new deployment

2. **Emergency Hotfix**
   ```bash
   # Create a hotfix branch
   git checkout -b hotfix/emergency-fix
   # Make necessary fixes
   git commit -am "Emergency fix"
   git push origin hotfix/emergency-fix
   # Merge to main and deploy
   ```

### Rollback Verification

After rollback, verify:
- [ ] Application loads correctly
- [ ] Core functionality works
- [ ] No console errors
- [ ] Accessibility scans work
- [ ] Error states handled properly

## Post-Deployment Monitoring

### Health Checks

Regularly check:
- Application uptime
- Error rates in logs
- API key usage (Gemini quotas)
- User feedback

### Performance Monitoring

Monitor:
- Lighthouse scores
- Core Web Vitals
- Bundle size
- API response times

### Accessibility Monitoring

- Schedule regular accessibility audits
- Monitor for new WCAG guidelines
- Check user-reported accessibility issues

## Troubleshooting

### Build Failures

**Issue**: Build fails in Vercel
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

**Solution**:
- Ensure `package.json` scripts are correct
- Check for environment-specific issues
- Verify TypeScript compilation

### Environment Variables

**Issue**: Features not working in production
- Environment variables not set correctly
- API key missing or invalid

**Solution**:
- Verify Vercel environment variables
- Check variable names match exactly
- Ensure API key is valid and active

### API Issues

**Issue**: AI explanations not working
- Gemini API key invalid or expired
- Rate limits exceeded
- Network issues

**Solution**:
- Verify API key in Vercel settings
- Check Gemini API status
- Monitor usage quotas
- Implement retry logic if needed

### Performance Issues

**Issue**: Slow load times
- Large bundle size
- Unoptimized assets
- Slow API responses

**Solution**:
- Check bundle size in build output
- Implement code splitting
- Optimize images and assets
- Review API call patterns

## Security Considerations

### Production Security

- [ ] API keys stored in environment variables only
- [ ] No sensitive data in client-side code
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured
- [ ] Dependencies regularly updated

### API Key Management

- [ ] Rotate API keys periodically
- [ ] Monitor API usage for anomalies
- [ ] Set usage limits if available
- [ ] Have backup API keys ready

## Maintenance

### Regular Updates

- Update dependencies monthly
- Review and apply security patches
- Update accessibility rules (axe-core)
- Monitor for API changes

### Backup Strategy

- Git repository serves as backup
- Vercel maintains deployment history
- Keep local development environment synced

## Support

For deployment issues:
- Check Vercel documentation
- Review build logs
- Check GitHub issues
- Contact support if needed

## Continuous Improvement

Post-deployment:
- Monitor user feedback
- Track performance metrics
- Plan feature enhancements
- Schedule regular audits
