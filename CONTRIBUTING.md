# Contributing to TAMU Law Adjunct Hiring Portal

Thank you for your interest in contributing to the TAMU Law Adjunct Hiring Portal! 

We welcome contributions from the community. Whether you're fixing bugs, adding features, improving documentation, or reporting issues, your help is appreciated.

This document provides guidelines for setting up your development environment, coding standards, and the contribution process.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. We are committed to providing a welcoming and inclusive experience for everyone.

---

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Requirements](#documentation-requirements)
- [Security Best Practices](#security-best-practices)
- [Getting Help](#getting-help)

---

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** v18.0.0 or later
- **npm** v9.0.0 or later
- **Docker** and **Docker Compose** (for local PostgreSQL)
- **Git** v2.0.0 or later
- **AWS CLI** (for S3 operations)
- A code editor (VS Code recommended)

### Required Accounts
- **OpenAI API Key** - For AI-powered candidate search
- **AWS Account** - For S3 and RDS access (provided by team lead)
- **Azure AD Credentials** - For SSO authentication (provided by team lead)
- **GitHub Account** - For repository access

---

## Development Setup

### 1. Fork and Clone the Repository
```bash
# Clone the repository
git clone https://github.com/FA25-CSCE482-capstone/github-setup-tamu-law.git
cd github-setup-tamu-law

# Add upstream remote for syncing
git remote add upstream https://github.com/FA25-CSCE482-capstone/github-setup-tamu-law.git
```

### 2. Environment Configuration

**Backend Environment** (`server/.env`):
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials:
```env
# Database (Docker Compose for local dev)
DATABASE_URL=postgresql://tamu:secret@localhost:5432/law_portal

# Server
PORT=4000
NODE_ENV=development

# OpenAI API (get from team lead or use your own key)
OPENAI_API_KEY=sk-your-key-here

# AWS S3 (configure via aws configure or use team credentials)
AWS_REGION=us-east-2
S3_BUCKET_NAME=resume-storage-tamu-law

# Azure AD (get from team lead)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:4000/auth/callback

# Session
SESSION_SECRET=your-local-dev-secret
REDIS_URL=redis://localhost:6379

# AI Search Configuration
SEARCH_LIMIT=200
BATCH_SIZE=15
```

**Frontend Environment** (`frontend/.env`):
```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

### 3. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 4. Start Local Database
```bash
# From project root
docker-compose up -d

# Verify database is running
docker-compose ps
# Should show "healthy" status

# View database logs (optional)
docker-compose logs db
```

The database will automatically initialize with the schema from `db/init/001_schema.sql` and sample data from `db/init/002_data.sql`.

### 5. Configure AWS CLI (if using S3)
```bash
aws configure
# AWS Access Key ID: [provided by team lead]
# AWS Secret Access Key: [provided by team lead]
# Default region name: us-east-2
# Default output format: json
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### 7. Verify Installation
- Backend health check: http://localhost:4000/health
- Frontend: http://localhost:5173
- Admin dashboard: http://localhost:5173/admin (requires TAMU login)

---

## Project Architecture

### Directory Structure
```
github-setup-tamu-law/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
├── server/                # Node.js + Express backend
│   └── src/
│       ├── index.js       # Main server file (API routes)
│       ├── auth.js        # Azure AD authentication
│       ├── embeddings.js  # Vector embedding generation
│       └── s3-utils.js    # AWS S3 helpers
├── db/
│   └── init/              # Database schema and sample data
├── infra/                 # AWS CDK infrastructure
└── scripts/               # Utility scripts
```

### Technology Stack
- **Frontend:** React 19, Vite, React Router, react-markdown
- **Backend:** Express.js, Node.js 18+
- **Database:** PostgreSQL 16 with pgvector extension
- **AI/ML:** OpenAI GPT-4o-mini, @xenova/transformers
- **Cloud:** AWS S3, AWS RDS, Azure AD
- **Session Storage:** Redis (production), MemoryStore (local dev)

### Key Design Patterns
- **Authentication:** Azure AD OAuth2 with MSAL
- **Authorization:** Middleware-based (requireAuth, requireTAMUEmail)
- **File Upload:** Multer → S3 → Pre-signed URLs
- **AI Pipeline:** Vector search (pgvector) → Batch processing (GPT-4o-mini)
- **Session Management:** Express-session with Redis backing

---

## Coding Standards

### JavaScript Style Guide
- **ES6+ Syntax:** Use modern JavaScript (import/export, async/await, arrow functions)
- **Naming Conventions:**
  - Variables/Functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: Match component name or use `kebab-case`
- **Indentation:** 2 spaces (no tabs)
- **Semicolons:** Use semicolons at the end of statements
- **Quotes:** Single quotes for strings (except JSX attributes)

### Code Quality
- **ESLint:** Run `npm run lint` before committing
- **Comments:** Document complex logic and function purposes
- **Error Handling:** Always use try-catch for async operations
- **Security:** Never commit `.env` files or API keys

### React Best Practices
- **Functional Components:** Use hooks instead of class components
- **State Management:** Use `useState` and `useEffect` appropriately
- **Props Validation:** Document expected prop types in comments
- **Component Size:** Keep components under 300 lines (split if larger)

### Backend Best Practices
- **API Responses:** Always return consistent JSON format:
  ```javascript
  // Success
  { success: true, data: {...} }
  
  // Error
  { success: false, error: 'message' }
  ```
- **SQL Queries:** Use parameterized queries to prevent SQL injection
- **Environment Variables:** Use `process.env` for configuration
- **Logging:** Use `console.log` for info, `console.error` for errors

### File Organization
- **One Component Per File:** Each React component in its own file
- **Co-locate Styles:** Keep `.css` files next to their components
- **Group by Feature:** Organize by feature/domain, not by file type

---

## Git Workflow

### Branch Naming Convention
- **Feature:** `feature/short-description` (e.g., `feature/add-csv-export`)
- **Bug Fix:** `bugfix/issue-description` (e.g., `bugfix/fix-login-redirect`)
- **Hotfix:** `hotfix/critical-issue` (e.g., `hotfix/s3-upload-error`)
- **Docs:** `docs/update-readme` (e.g., `docs/add-api-examples`)

### Commit Message Format
Follow the conventional commits specification:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config)

**Examples:**
```bash
feat(chatbot): add markdown rendering for resume links

fix(auth): resolve CORS issue with Azure AD redirect

docs(readme): add API endpoint examples

refactor(embeddings): optimize batch processing performance
```

### Development Workflow
```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Make changes and commit
git add .
git commit -m "feat(scope): description"

# 4. Push to your fork
git push origin feature/my-new-feature

# 5. Create Pull Request on GitHub
```

---

## Pull Request Process

### Before Submitting a PR
1. **Sync with main branch:**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/my-feature
   git merge main
   ```

2. **Test your changes:**
   - Run backend: `cd server && npm run dev`
   - Run frontend: `cd frontend && npm run dev`
   - Test affected functionality manually
   - Check for console errors

3. **Run linters:**
   ```bash
   cd frontend && npm run lint
   ```

4. **Verify environment variables:**
   - Ensure no secrets are committed
   - Check `.gitignore` covers sensitive files

### PR Template
When creating a pull request, use this template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Changes Made
- Bullet point list of specific changes
- Include file paths if applicable

## Testing Done
- [ ] Tested locally (backend + frontend)
- [ ] Verified database changes (if applicable)
- [ ] Tested with sample data
- [ ] Checked for console errors

## Related Issues
Closes #[issue number]

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation (README, comments)
- [ ] My changes generate no new warnings
- [ ] I have tested my changes locally
- [ ] No sensitive data (API keys, passwords) is committed
```

### Review Process
1. **Automated Checks:** Wait for any CI/CD checks to pass
2. **Peer Review:** At least one team member must approve
3. **Address Feedback:** Make requested changes and update PR
4. **Merge:** Once approved, the PR will be merged by a maintainer

### After Merge
```bash
# Update your local main branch
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## Testing Guidelines

### Manual Testing Checklist
Before submitting a PR, test the following:

**Backend (http://localhost:4000):**
- [ ] Health check endpoint: `GET /health`
- [ ] Authentication flow (if modified)
- [ ] API endpoints return expected data
- [ ] Database operations work correctly
- [ ] File uploads to S3 succeed (if applicable)
- [ ] AI search returns reasonable results (if applicable)

**Frontend (http://localhost:5173):**
- [ ] All pages load without errors
- [ ] Authentication redirects work
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] No console errors or warnings
- [ ] Responsive design works (test mobile view)

### Test Scenarios
Create test cases for new features:

**Example: AI Search Testing**
```bash
# In server directory, run test script
node test-ai-search.js

# Expected behavior:
# - Returns 5-15 candidates
# - Confidence scores are 4 or 5
# - Resume links are valid pre-signed URLs
# - Response time < 10 seconds
```

### Database Testing
```bash
# Connect to local database
docker-compose exec db psql -U tamu -d law_portal

# Run test queries
SELECT COUNT(*) FROM applicants;
SELECT COUNT(*) FROM resumes WHERE embedding IS NOT NULL;
```

---

## Documentation Requirements

### Code Comments
Document functions with JSDoc-style comments:
```javascript
/**
 * Generate embedding vector for resume text
 * @param {string} text - Resume text (max 5000 chars)
 * @returns {Promise<number[]>} - 384-dimensional vector
 * @throws {Error} - If embedding generation fails
 */
async function generateEmbedding(text) {
  // Implementation
}
```

### README Updates
When adding features, update the README:
- Add to [Features](#features) section
- Update [API Documentation](#api-documentation) if adding endpoints
- Add to [Usage](#usage) section with examples
- Update [Project Structure](#project-structure) if adding files

### API Documentation
New endpoints must include:
- **Description:** What the endpoint does
- **Authentication:** Required auth level
- **Request Format:** Parameters, body, headers
- **Response Format:** Success and error examples
- **Example Usage:** curl or fetch example

---

## Security Best Practices

### Never Commit Secrets
- **API Keys:** Use environment variables
- **Database Credentials:** Store in `.env` (gitignored)
- **AWS Credentials:** Use AWS CLI configuration
- **Session Secrets:** Generate random secrets for production

### Input Validation
- **SQL Injection:** Use parameterized queries
  ```javascript
  // Good
  pool.query('SELECT * FROM applicants WHERE id = $1', [id])
  
  // Bad
  pool.query(`SELECT * FROM applicants WHERE id = ${id}`)
  ```
- **File Uploads:** Validate file types and sizes
- **User Input:** Sanitize before processing

### Access Control
- **Authentication:** Use `requireAuth` middleware for protected routes
- **TAMU Email Check:** Use `requireTAMUEmail` for admin routes
- **CORS:** Restrict origins in production

### Data Protection
- **Pre-signed URLs:** Use 7-day expiration for S3 files
- **HTTPS:** Always use SSL/TLS in production
- **Session Security:** Configure secure cookies in production

---

## Getting Help

### Resources
- **README.md:** Main project documentation
- **GitHub Issues:** Search existing issues before creating new ones
- **Team Members:** Contact project coordinators (see [Contact](#contact) in README)

### Reporting Issues
When reporting bugs, include:
1. **Description:** What went wrong?
2. **Steps to Reproduce:** How can we reproduce it?
3. **Expected Behavior:** What should happen?
4. **Actual Behavior:** What actually happened?
5. **Environment:** OS, Node version, browser (if frontend issue)
6. **Screenshots/Logs:** Any relevant error messages

### Feature Requests
When requesting features:
1. **Use Case:** Why is this needed?
2. **Proposed Solution:** How should it work?
3. **Alternatives:** What other approaches did you consider?
4. **Additional Context:** Any relevant details

---

## Contact

### Project Team
- **Anik Momin** (Lead Developer and Risk Coordinator) - anikmomin@tamu.edu
- **Mitchell Good** (Stakeholder Coordinator) - gm10073103@tamu.edu
- **Adeeb Momin** (Scope Coordinator) - adeeb_momin@tamu.edu
- **Abhinav Devireddy** (Quality Coordinator) - abhidev979@tamu.edu
- **Ryan Mohammadian** (Schedule Coordinator) - ryanm64@tamu.edu

### Faculty Sponsor
- **Steven Vaughn** (TAMU Law) - steven.vaughn@law.tamu.edu

### Course Instructor
- **Dr. Pauline Wade** (CSCE) - paulinewade@tamu.edu

---

## License
By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the TAMU Law Adjunct Hiring Portal!**

*Last Updated: December 2, 2025*
