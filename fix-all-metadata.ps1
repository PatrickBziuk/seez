# Fix all MDX files with ai_metadata structure issues
$projectsPath = "src\content\projects\en"
$files = Get-ChildItem "$projectsPath\*.mdx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Check if file has the problematic ai_metadata structure
    if ($content -match 'inputTokens: (\d+)\s*\n\s*outputTokens: (\d+)\s*\n\s*totalTokens: (\d+)\s*\n\s*cost: ([\d\.]+)\s*\n\s*co2Impact: ([\d\.]+)') {
        $totalTokens = $matches[3]
        $cost = $matches[4]
        $co2 = $matches[5]
        
        Write-Host "Fixing $($file.Name)..."
        
        # Replace the problematic ai_metadata section
        $pattern = 'ai_metadata:\s*\n\s*tokenUsage:\s*\n\s*translation:\s*\n\s*operation: translation\s*\n\s*canonicalId: [^\n]*\n\s*model: [^\n]*\n\s*inputTokens: \d+\s*\n\s*outputTokens: \d+\s*\n\s*totalTokens: (\d+)\s*\n\s*cost: ([\d\.]+)\s*\n\s*co2Impact: ([\d\.]+)'
        
        $replacement = @"
ai_metadata:
  tokenUsage:
    translation:
      tokens: $totalTokens
      cost: $cost
      co2: $co2
"@
        
        $content = $content -replace $pattern, $replacement
        
        # Remove any leftover timestamp/source/target language lines after ai_metadata
        $content = $content -replace '\s*timestamp: [^\n]*\n', ''
        $content = $content -replace '\s*sourceLanguage: [^\n]*\n', ''
        $content = $content -replace '\s*targetLanguage: [^\n]*\n', ''
        
        # Save if changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "Fixed $($file.Name)"
        }
    }
}

Write-Host "All files processed."
