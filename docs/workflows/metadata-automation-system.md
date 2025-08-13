# Metadata Automation System - Technical Documentation

**Date**: August 13, 2025  
**System**: Comprehensive Publication Metadata with Pre-commit Automation  
**Status**: ✅ OPERATIONAL

## 🎯 System Overview

The Metadata Automation System provides automatic publication tracking, change detection, and metadata injection for all content in the Seez platform. It seamlessly integrates with the existing pre-commit workflow to ensure accurate publication dates and change tracking without manual intervention.

## 🏗️ Architecture

### Core Components

1. **Enhanced Content Schema** (`src/content/config.ts`)
2. **Metadata Detection Script** (`scripts/utils/detect-metadata-changes.ts`)
3. **Metadata Injection Script** (`scripts/utils/inject-metadata.ts`)
4. **Pre-commit Integration** (`.husky/pre-commit`)
5. **UI Components** (`src/components/content/metadata/`)
6. **Validation System** (`scripts/validation/validate-publication-metadata.ts`)

### Data Flow

```
Content Change → Pre-commit Hook → Metadata Detection → Injection → Auto-add → Commit
                      ↓
               Translation Pipeline → Tag Analysis → Build
```

## 📊 Content Schema

### New Metadata Fields

```typescript
// Enhanced publication metadata
firstPublishDate?: Date;     // Set once when draft→published, never changes
lastChangeDate?: Date;       // Updated when published content changes
publicationStatus: 'draft' | 'published' | 'archived';
changeLog?: Array<{
  date: string;
  description: string;
  author?: string;
  type: 'content' | 'metadata' | 'structure';
}>;
```

### Schema Compatibility

The system supports both new and legacy metadata formats:

- **New Format**: `firstPublishDate`, `lastChangeDate`, `publicationStatus`
- **Legacy Format**: Maintains compatibility with existing `publishDate` fields
- **AI Metadata**: Flexible schema supporting multiple token usage formats

## 🔧 Core Scripts

### 1. Metadata Detection (`detect-metadata-changes.ts`)

**Purpose**: Analyzes staged content files to determine required metadata updates

**Key Functions**:
```typescript
export async function detectMetadataChanges(): Promise<MetadataChange[]>
export function getStagedContentFiles(): Promise<string[]>
export function analyzeContentChange(filePath: string): Promise<ChangeAnalysis>
export function hasSignificantContentChange(current: string, previous: string): boolean
```

**Detection Logic**:
- Identifies draft→published transitions (needs `firstPublishDate`)
- Detects content changes in published articles (needs `lastChangeDate`)
- Analyzes semantic content changes vs metadata-only changes
- Generates change descriptions for changelog

### 2. Metadata Injection (`inject-metadata.ts`)

**Purpose**: Automatically updates content files with required metadata

**Key Functions**:
```typescript
export async function injectMetadata(): Promise<void>
export async function updateFrontmatter(filePath: string, updates: MetadataUpdates): Promise<void>
export function generateChangeLogEntry(changeType: string, description: string): ChangeLogEntry
```

**Injection Rules**:
- **First Publication**: Adds `firstPublishDate` and sets `publicationStatus: 'published'`
- **Content Changes**: Updates `lastChangeDate` and appends to `changeLog`
- **Status Changes**: Updates `publicationStatus` with appropriate dates
- **Preservation**: Maintains all existing metadata and frontmatter

### 3. Validation (`validate-publication-metadata.ts`)

**Purpose**: Ensures metadata consistency and publication workflow integrity

**Validation Rules**:
- `firstPublishDate` cannot be changed once set
- `lastChangeDate` must be after `firstPublishDate`
- Publication status transitions must be valid
- Change log entries must have valid timestamps
- Required fields must be present for published content

## 🔄 Pre-commit Workflow

### Enhanced Workflow Sequence

```bash
1. Content Validation (existing)
   └─ Registry updates & validation

2. Metadata Analysis (NEW)
   ├─ Detect content changes requiring metadata updates
   ├─ Generate metadata-changes.json
   └─ Determine workflow needs

3. Metadata Injection (NEW)
   ├─ Process detected changes
   ├─ Update content files with metadata
   ├─ Auto-add updated files to git
   └─ Track changes for commit message

4. Content Analysis (conditional)
   ├─ TL;DR generation (if content changed)
   ├─ Tag analysis (if content changed)
   └─ Translation detection (if content files staged)

5. Translation Pipeline (existing)
   └─ Generate translations based on registry
```

### Auto-commit Integration

**Safety Features**:
- Only auto-adds files in `src/content/` directory
- Validates files after metadata injection
- Provides clear logging of auto-added files
- Tracks metadata updates for commit message enhancement

**File Tracking**:
```bash
# Files updated with metadata are tracked
echo "📋 Auto-adding files with updated metadata..."
while IFS= read -r file; do
  if [[ "$file" =~ ^src/content/ ]] && [ -f "$file" ]; then
    git add "$file"
    echo "  ✅ Added: $file"
  fi
done < updated-files.txt
```

## 🎨 UI Components

### Enhanced ContentMetadata Component

**Location**: `src/components/content/metadata/ContentMetadata.astro`

**New Features**:
- **Publication Timeline**: Shows first publish and last change dates
- **Status Badges**: Visual indicators for publication status
- **Change Log Display**: Collapsible history of content changes
- **Author Attribution**: Enhanced display for AI+Human collaboration

**Example Output**:
```html
<!-- Publication Timeline -->
<div class="publication-timeline">
  <span>📅 Published: August 13, 2025</span>
  <span>📝 Updated: August 13, 2025</span>
</div>

<!-- Status Badge -->
<Badge variant="success" text="published" />

<!-- Change Log (collapsible) -->
<details class="change-log">
  <summary>Change History (3 entries)</summary>
  <ul>
    <li>Aug 13: Content update - Enhanced metadata system</li>
    <li>Aug 12: Structure change - Added new sections</li>
    <li>Aug 11: Initial publication</li>
  </ul>
</details>
```

### Enhanced Badge Component

**Location**: `src/components/ui/display/Badge.astro`

**New Variants**:
- `draft`: Yellow badge for unpublished content
- `published`: Green badge for published content  
- `archived`: Gray badge for archived content
- `warning`: Orange badge for attention needed
- `info`: Blue badge for informational status
- `success`: Green badge for successful status

## 🔍 Change Detection Algorithm

### Semantic Content Analysis

The system uses sophisticated change detection to differentiate between:

1. **Significant Content Changes**: Require `lastChangeDate` update
   - Body content modifications
   - Title or subtitle changes
   - Structural changes (headings, lists)
   - New sections or substantial additions

2. **Metadata-Only Changes**: Do not trigger change dates
   - Tag additions/removals
   - SEO metadata updates
   - Translation status changes
   - Minor formatting adjustments

3. **Publication Status Changes**: Special handling
   - Draft→Published: Adds `firstPublishDate`
   - Published→Archived: Updates status only
   - Status reversions: Validates and logs

### Algorithm Implementation

```typescript
export function hasSignificantContentChange(current: string, previous: string): boolean {
  // Extract and compare body content (excluding frontmatter)
  const currentBody = extractBodyContent(current);
  const previousBody = extractBodyContent(previous);
  
  // Calculate similarity score using text comparison
  const similarity = calculateTextSimilarity(currentBody, previousBody);
  
  // Threshold for significant change (95% similarity = minor change)
  return similarity < 0.95;
}
```

## 📝 Integration Points

### Content Registry System

**File**: `data/content-registry.json`

The metadata system coordinates with the existing content registry:
- Publication status tracked in registry
- Canonical ID correlation with metadata
- Translation pipeline coordination
- Cross-language publication consistency

### Translation Pipeline

**Coordination Features**:
- Metadata changes trigger translation checks
- Publication dates coordinated across languages
- Translation-specific change tracking
- Registry-based translation detection

### Validation Framework

**Integration Points**:
- Pre-commit validation includes metadata checks
- Build-time schema validation
- Runtime metadata consistency checks
- Publication workflow validation

## 🛡️ Safety & Recovery

### Error Handling

1. **Graceful Degradation**: System continues if metadata injection fails
2. **Validation Gates**: Multiple validation points prevent corruption
3. **Rollback Capability**: Git-based recovery for all changes
4. **Logging**: Comprehensive logging for debugging

### Backup Strategy

- **Git History**: Primary backup mechanism
- **Validation**: Pre-injection validation prevents corruption
- **Manual Override**: Ability to manually fix metadata issues
- **Registry Sync**: Content registry maintains publication state

## 📊 Monitoring & Analytics

### Success Metrics

1. **Automation Rate**: % of content getting automatic metadata (target: 100%)
2. **Accuracy**: Correct publication date assignment (target: 100%)
3. **Performance**: Pre-commit hook execution time (target: <30s)
4. **Safety**: Zero data loss incidents

### Diagnostic Commands

```bash
# Check metadata status across content
pnpm run content:validate

# Sync content registry after changes
pnpm run content:sync

# Check for metadata inconsistencies
tsx scripts/validation/validate-publication-metadata.ts
```

## 🚀 Usage Examples

### Typical Content Lifecycle

1. **Create Draft**:
   ```yaml
   ---
   title: "My New Article"
   draft: true
   publicationStatus: draft
   # No publication dates yet
   ---
   ```

2. **Publish Content** (change `draft: false`):
   - System automatically adds `firstPublishDate`
   - Sets `publicationStatus: 'published'`
   - Creates initial change log entry

3. **Update Published Content**:
   - System detects content changes
   - Updates `lastChangeDate`
   - Adds change log entry with description

4. **Result**:
   ```yaml
   ---
   title: "My New Article"
   draft: false
   publicationStatus: published
   firstPublishDate: 2025-08-13T10:30:00Z
   lastChangeDate: 2025-08-13T15:45:00Z
   changeLog:
     - date: "2025-08-13T15:45:00Z"
       description: "Content update - Added new examples"
       type: "content"
   ---
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Metadata Not Injected**:
   - Check if files are properly staged
   - Verify pre-commit hook execution
   - Check `metadata-changes.json` output

2. **TypeScript Errors**:
   - Ensure schema is synced: `pnpm astro sync`
   - Check content schema compatibility
   - Validate frontmatter format

3. **Auto-add Not Working**:
   - Verify files are in `src/content/` directory
   - Check file validation passes
   - Review `updated-files.txt` output

### Debug Commands

```bash
# Manual metadata detection
tsx scripts/utils/detect-metadata-changes.ts

# Manual metadata injection
tsx scripts/utils/inject-metadata.ts

# Validate specific content file
tsx scripts/validation/validate-publication-metadata.ts [file]
```

## 📚 References

- **Plan Document**: `docs/plan-10034-comprehensive-metadata-system.md`
- **Content Schema**: `src/content/config.ts`
- **Pre-commit Hook**: `.husky/pre-commit`
- **UI Components**: `src/components/content/metadata/`

---

This system provides a robust, automated solution for publication metadata management while maintaining safety, accuracy, and seamless integration with existing Seez workflows.
