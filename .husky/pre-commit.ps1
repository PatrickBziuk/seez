# PowerShell pre-commit hook
$ErrorActionPreference = "Stop"

Write-Host "🔍 Pre-commit validation, metadata injection, and content analysis..." -ForegroundColor Cyan

# 1) Validate content & update registry if needed
Write-Host "📋 Validating content structure..." -ForegroundColor Yellow
npx tsx scripts/validation/validate-content-precommit-simple.ts

if (Test-Path "data/content-registry.json.updated") {
    git add data/content-registry.json
    Remove-Item "data/content-registry.json.updated"
}

# 2) Comprehensive metadata detection and content analysis
Write-Host "🏷️  Analyzing content for metadata, TL;DR, tags, and translation needs..." -ForegroundColor Yellow
try {
    npx tsx scripts/utils/detect-metadata-changes.ts > metadata-changes.json 2>$null
} catch {
    "[]" | Out-File -FilePath metadata-changes.json -Encoding UTF8
}

# Check if we have metadata changes to process
$metadataUpdated = $false
if ((Test-Path "metadata-changes.json") -and (Get-Content "metadata-changes.json" -Raw).Trim() -ne "[]") {
    Write-Host "📝 Injecting metadata updates..." -ForegroundColor Green
    npx tsx scripts/utils/inject-metadata.ts
    
    # Auto-add files that were updated with metadata
    if (Test-Path "updated-files.txt") {
        Write-Host "📋 Auto-adding files with updated metadata..." -ForegroundColor Green
        Get-Content "updated-files.txt" | ForEach-Object {
            if ($_ -match "^src/content/" -and (Test-Path $_)) {
                git add $_
                Write-Host "  ✅ Added: $_" -ForegroundColor Green
                $metadataUpdated = $true
            }
        }
        Remove-Item "updated-files.txt"
    }
} else {
    Write-Host "ℹ️  No metadata updates needed" -ForegroundColor Blue
}

# Clean up temporary files
if (Test-Path "metadata-changes.json") { Remove-Item "metadata-changes.json" }
if (Test-Path "metadata-affected-files.txt") { Remove-Item "metadata-affected-files.txt" }

# 3) Content analysis for TL;DR and tagging (only if content files are staged)
$stagedContentFiles = git diff --cached --name-only | Where-Object { $_ -match '^src/content/.*\.(md|mdx)$' }
if ($stagedContentFiles) {
    Write-Host "🧠 Analyzing content for missing TL;DR and tags..." -ForegroundColor Yellow
    
    # Check for missing TL;DR and generate them
    Write-Host "📄 Checking for content missing TL;DR summaries..." -ForegroundColor Yellow
    try {
        npx tsx scripts/content/ai/generate_tldr.ts > tldr-results.json 2>$null
        Write-Host "✅ TL;DR generation completed" -ForegroundColor Green
        if (Test-Path "tldr-results.json") { Remove-Item "tldr-results.json" }
    } catch {
        Write-Host "⚠️  TL;DR generation failed" -ForegroundColor Yellow
    }
    
    # 4) Translation detection (registry-based)
    Write-Host "🔍 Detecting translation tasks..." -ForegroundColor Yellow
    try {
        npx tsx scripts/translations/check_translations_registry.ts > translation-tasks.json 2>$null
        Write-Host "✅ Translation detection completed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Translation detection failed, creating empty task list" -ForegroundColor Yellow
        "[]" | Out-File -FilePath translation-tasks.json -Encoding UTF8
    }

    # 5) Generate translations (but don't block commit)
    if ((Test-Path "translation-tasks.json") -and (Get-Content "translation-tasks.json" -Raw).Trim() -ne "[]") {
        $content = Get-Content "translation-tasks.json" -Raw
        if ($content.StartsWith("[") -or $content.StartsWith("{")) {
            if ($content.Trim() -ne "[]") {
                Write-Host "🤖 Generating AI translations (will be marked as draft and require review)..." -ForegroundColor Magenta
                Get-Content "translation-tasks.json" | npx tsx scripts/translations/generate_translations_registry.ts
                Write-Host "✅ Translations generated successfully" -ForegroundColor Green
                Write-Host "📋 Note: Generated translations are marked as draft and require human review" -ForegroundColor Yellow
                Write-Host "   • Review the translations in the generated files" -ForegroundColor Yellow
                Write-Host "   • Set draft=false and status.review.translation=true when ready" -ForegroundColor Yellow
                git add src/content
            } else {
                Write-Host "ℹ️ No translation tasks found" -ForegroundColor Blue
            }
        } else {
            Write-Host "⚠️  Invalid JSON in translation-tasks.json, skipping translation generation" -ForegroundColor Yellow
            Write-Host "Content preview: $($content.Substring(0, [Math]::Min(50, $content.Length)))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️ No translation tasks file created" -ForegroundColor Blue
    }

    if (Test-Path "translation-tasks.json") { Remove-Item "translation-tasks.json" }
} else {
    Write-Host "ℹ️  No content files staged, skipping content analysis and translation generation" -ForegroundColor Blue
}

Write-Host "✅ Pre-commit processing completed" -ForegroundColor Green
if ($metadataUpdated) {
    Write-Host "💡 Files were automatically updated with metadata and added to this commit" -ForegroundColor Cyan
}
Write-Host "💡 Reminder: Review generated translations before pushing!" -ForegroundColor Cyan
