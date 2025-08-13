#!/usr/bin/env python3

import re
import sys
import os

def fix_mdx_file(filepath):
    """Fix MDX file metadata structure"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix null values
    content = re.sub(r'reviewer: null', 'reviewer: ""', content)
    content = re.sub(r'reviewDate: null', 'reviewDate: ""', content)
    
    # Fix ai_metadata structure
    # Pattern to match the problematic ai_metadata section
    pattern = r'ai_metadata:\s*\n\s*tokenUsage:\s*\n\s*translation:\s*\n\s*operation: translation\s*\n\s*canonicalId: ([^\n]*)\n\s*model: ([^\n]*)\n\s*inputTokens: (\d+)\s*\n\s*outputTokens: (\d+)\s*\n\s*totalTokens: (\d+)\s*\n\s*cost: ([\d\.]+)\s*\n\s*co2Impact: ([\d\.]+)\s*\n\s*timestamp: ([^\n]*)\n\s*sourceLanguage: ([^\n]*)\n\s*targetLanguage: ([^\n]*)\n\s*total:\s*\n\s*tokens: (\d+)\s*\n\s*cost: ([\d\.]+)\s*\n\s*co2: ([\d\.]+)'
    
    match = re.search(pattern, content, re.MULTILINE)
    if match:
        total_tokens = match.group(5)
        cost = match.group(6)
        co2 = match.group(7)
        total_tokens_2 = match.group(11)
        total_cost = match.group(12)
        total_co2 = match.group(13)
        
        replacement = f'''ai_metadata:
  tokenUsage:
    translation:
      tokens: {total_tokens}
      cost: {cost}
      co2: {co2}
    total:
      tokens: {total_tokens_2}
      cost: {total_cost}
      co2: {total_co2}
  generationDate: '2025-08-13T07:35:30.301Z'
  model: gpt-4.1-nano
  translationQuality: pending_review'''
        
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")
        return True
    else:
        print(f"No changes needed for {filepath}")
        return False

def main():
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        fix_mdx_file(filepath)
    else:
        # Fix all MDX files in projects/en
        projects_dir = "src/content/projects/en"
        if os.path.exists(projects_dir):
            for filename in os.listdir(projects_dir):
                if filename.endswith('.mdx'):
                    filepath = os.path.join(projects_dir, filename)
                    fix_mdx_file(filepath)

if __name__ == "__main__":
    main()
