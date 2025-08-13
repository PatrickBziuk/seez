# Fix cosensai.mdx completely
$filePath = "src\content\projects\en\cosensai.mdx"
$content = Get-Content $filePath -Raw

# Replace the entire ai_metadata section with a clean one
$pattern = 'ai_metadata:[\s\S]*?(?=---|\z)'
$replacement = @"
ai_metadata:
  tokenUsage:
    translation:
      tokens: 3594
      cost: 0.0008154000000000001
      co2: 0.3594
    total:
      tokens: 3665
      cost: 0.0008378000000001
      co2: 0.3665
  generationDate: '2025-08-13T07:35:30.301Z'
  model: gpt-4.1-nano
  translationQuality: pending_review
---
"@

$content = $content -replace $pattern, $replacement

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Completely fixed ai_metadata structure in cosensai.mdx"
