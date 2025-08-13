# Fix cosensai.mdx ai_metadata structure
$filePath = "src\content\projects\en\cosensai.mdx"
$content = Get-Content $filePath -Raw

# Fix the ai_metadata structure
$content = $content -replace 'ai_metadata:\s*\n\s*tokenUsage:\s*\n\s*translation:\s*\n\s*operation: translation\s*\n\s*canonicalId: slug-20250805-e84d4526\s*\n\s*model: gpt-4\.1-nano\s*\n\s*inputTokens: \d+\s*\n\s*outputTokens: \d+\s*\n\s*totalTokens: (\d+)\s*\n\s*cost: ([\d\.]+)\s*\n\s*co2Impact: ([\d\.]+)', 'ai_metadata:
  tokenUsage:
    translation:
      tokens: $1
      cost: $2
      co2: $3'

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Fixed ai_metadata structure in cosensai.mdx"
