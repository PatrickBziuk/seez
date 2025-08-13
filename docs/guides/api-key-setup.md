# GitHub Repository Secrets Setup

## Setting up OPENAI_API_KEY Secret

### 1. GitHub Repository Secret (for CI workflows)

1. **Go to your GitHub repository**: https://github.com/PatrickBziuk/seez
2. **Navigate to Settings**: Click on "Settings" tab in your repository
3. **Go to Secrets**: In the left sidebar, click "Secrets and variables" → "Actions"
4. **Add New Secret**: Click "New repository secret"
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (e.g., `sk-proj-...`)
5. **Save**: Click "Add secret"

### 2. Local Development Setup (.env.local)

For local development, create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your API key
# .env.local content:
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
TRANSLATION_QUALITY_THRESHOLD=70
```

### 3. Verify Setup

**Local verification:**

```bash
# Check if your local environment is working
node -e "console.log('API Key:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Missing ❌')"
```

**GitHub verification:**

- Go to Actions tab in your repository
- Manual workflow dispatch should work after adding the secret

## Environment File Structure

```
seez/
├── .env.example          # Template (committed to git)
├── .env.local           # Your local config (NOT committed)
├── .husky/
│   ├── pre-commit       # Uses .env.local automatically
│   └── pre-push         # Uses .env.local automatically
└── .github/workflows/
    └── manual-regen.yml # Uses secrets.OPENAI_API_KEY
```

## Security Notes

- ✅ `.env.local` is in `.gitignore` - won't be committed
- ✅ GitHub secrets are encrypted and only accessible to workflows
- ✅ Local hooks will use `.env.local` automatically
- ✅ CI workflows use `secrets.OPENAI_API_KEY` from repository settings

## Usage Examples

**Local development:**

```bash
# Hooks will automatically use .env.local
git add src/content/projects/en/my-project.mdx
git commit -m "Add new project"
# → Hook reads OPENAI_API_KEY from .env.local

# Manual local generation
pnpm run translations:generate-registry
# → Script reads OPENAI_API_KEY from .env.local
```

**GitHub Actions:**

```bash
# Manual regeneration workflow
# → Uses secrets.OPENAI_API_KEY from repository settings
```

## Troubleshooting

**"API key not found" locally:**

1. Ensure `.env.local` exists in project root
2. Check file contains `OPENAI_API_KEY=sk-proj-...`
3. Restart your terminal/IDE

**GitHub Actions failing:**

1. Verify secret is added in repository settings
2. Secret name must be exactly `OPENAI_API_KEY`
3. Check Actions logs for specific error messages
