# RSS Feeds Guide

**Last Updated**: August 26, 2025  
**Feature Status**: ✅ Fully Operational

RSS (Really Simple Syndication) feeds allow you to stay updated with the latest content from seez.eu using your preferred RSS reader. Our RSS implementation provides multiple feed variants to suit different needs.

## 📡 Available RSS Feeds

### Main RSS Feed
```
https://seez.eu/rss.xml
```
- **Content**: Latest published content from all collections
- **Languages**: Mixed (EN/DE) 
- **Limit**: 50 most recent items
- **Format**: RSS 2.0 with `<lastBuildDate>`

### Language-Specific Feeds
```
https://seez.eu/en/rss.xml    # English content only
https://seez.eu/de/rss.xml    # German content only
```
- **Content**: Language-filtered content from all collections
- **Languages**: Single language per feed
- **Limit**: 50 most recent items per language

### Collection-Specific Feeds
```
https://seez.eu/en/projects/rss.xml    # English projects only
https://seez.eu/en/life/rss.xml        # English life content only
https://seez.eu/en/lab/rss.xml         # English lab experiments only
https://seez.eu/en/music/rss.xml       # English music content only
https://seez.eu/en/books/rss.xml       # English book reviews only

https://seez.eu/de/projects/rss.xml    # German projects only
https://seez.eu/de/life/rss.xml        # German life content only
https://seez.eu/de/lab/rss.xml         # German lab experiments only
https://seez.eu/de/music/rss.xml       # German music content only
https://seez.eu/de/books/rss.xml       # German book reviews only
```
- **Content**: Specific content type in specific language
- **Languages**: Single language per feed
- **Collections**: Individual content categories

## 🔧 RSS Feed Features

### Content Filtering
- **Published Only**: Only content with `publicationStatus: 'published'`
- **No Drafts**: Content marked as `draft: true` is excluded
- **Quality Content**: Manually reviewed and approved content only

### URL Structure
- **Canonical IDs**: When available, URLs include canonical IDs for permanence
  - Format: `/{lang}/{collection}/{slug}-{canonicalId}`
  - Example: `/en/projects/seez-platform-01JDX123ABC456`
- **Fallback**: For content without canonical IDs, uses slug-only format
  - Format: `/{lang}/{collection}/{slug}`
  - Example: `/en/projects/seez-platform`

### Publication Dates
- **Primary**: `firstPublishedAt` for initial publication
- **Secondary**: `updatedAt` for content modifications
- **Fallback**: `lastChangeDate` if other dates unavailable
- **Sorting**: Most recent first (by update date, then publication date)

### Metadata
- **Title**: Article title from frontmatter
- **Description**: Article description or excerpt when available
- **Link**: Absolute URL to full article
- **Publication Date**: Proper RFC-compliant date formatting
- **Channel Info**: Site name, description, and last build timestamp

## 📖 How to Use RSS Feeds

### 1. Choose Your RSS Reader
Popular RSS readers include:
- **Web-based**: Feedly, Inoreader, NewsBlur
- **Desktop**: NetNewsWire (macOS), FeedReader (Windows)
- **Mobile**: Reeder (iOS), Feedly (Android/iOS)
- **Browser**: Many browsers have built-in RSS support

### 2. Subscribe to Feeds
Copy the RSS URL and add it to your RSS reader:

**For all content:**
```
https://seez.eu/rss.xml
```

**For specific interests:**
```
https://seez.eu/en/projects/rss.xml    # Technical projects
https://seez.eu/en/life/rss.xml        # Personal reflections
https://seez.eu/de/rss.xml             # German content
```

### 3. RSS Reader Configuration
Most readers will automatically:
- Detect new content within 15-60 minutes
- Show article titles, descriptions, and publication dates
- Provide links to read full articles
- Organize feeds into folders or categories

## ⚙️ Technical Configuration

### RSS Settings (seez.config.ts)
```typescript
rss: {
  enabled: true,                    // Enable/disable RSS feeds
  limit: 50,                       // Max items per feed
  perLocale: true,                 // Enable language-specific feeds
  perCollection: true,             // Enable collection-specific feeds
  collections: [                   // Included content types
    'books', 
    'projects', 
    'lab', 
    'life', 
    'music'
  ],
}
```

### Content Requirements
For content to appear in RSS feeds:
```yaml
# In content frontmatter
publicationStatus: 'published'     # Must be 'published'
draft: false                       # Must not be draft
language: 'en'                     # Must specify language
title: 'Article Title'             # Must have title
```

### Feed Generation
- **Build Time**: RSS feeds generated during site build
- **Content Source**: Astro content collections
- **Filtering**: Server-side filtering ensures only appropriate content
- **Performance**: Static XML files, no runtime processing

## 🔍 RSS Feed Autodiscovery

The site includes RSS autodiscovery meta tags in the HTML head:
```html
<link rel="alternate" type="application/rss+xml" 
      title="seez RSS" href="/rss.xml" />
```

This allows:
- Browser RSS detection (when supported)
- Automatic feed discovery by RSS readers
- Better SEO through syndication signals

## 📊 RSS Feed Structure

### Channel Information
```xml
<channel>
  <title>seez — Recent content</title>
  <description>🚀 A Blog about Development, Writing, Social Projects and Life itself.</description>
  <link>https://seez.eu</link>
  <lastBuildDate>Mon, 26 Aug 2025 19:00:00 GMT</lastBuildDate>
  <generator>Astro</generator>
  
  <item>
    <title>Article Title</title>
    <description>Article description or excerpt</description>
    <link>https://seez.eu/en/projects/article-slug</link>
    <pubDate>Mon, 26 Aug 2025 12:00:00 GMT</pubDate>
    <guid>https://seez.eu/en/projects/article-slug</guid>
  </item>
</channel>
```

### Language-Specific Titles
- **Main Feed**: "seez — Recent content"
- **English Feed**: "seez — EN updates" 
- **German Feed**: "seez — DE updates"
- **Collection Feeds**: "seez — EN projects updates"

## 🚨 Troubleshooting

### Feed Not Updating
- **Check Publication Status**: Ensure content is `publicationStatus: 'published'`
- **Verify Build**: RSS feeds regenerate on site build/deployment
- **Clear Cache**: Some RSS readers cache feeds aggressively
- **Check URL**: Ensure you're using the correct feed URL

### Content Missing from Feed
- **Draft Status**: Check if content is marked as `draft: true`
- **Publication Status**: Must be `publicationStatus: 'published'`
- **Language Mismatch**: Ensure content language matches feed language
- **Collection Filter**: Verify content is in included collections

### Invalid Feed Errors
- **XML Validation**: Feeds are automatically validated during build
- **Character Encoding**: All content properly escaped for XML
- **Date Format**: Publication dates in RFC-compliant format

## 📈 RSS Analytics

While RSS feeds don't provide detailed analytics, you can monitor:
- **Feed Requests**: Server logs show RSS feed access
- **Referrer Traffic**: Users clicking from RSS readers to full articles
- **Subscriber Estimates**: Some RSS readers provide subscriber counts

## 🔮 Future Enhancements

Planned RSS improvements:
- **Custom Categories**: RSS category tags for better organization
- **Full Content**: Option for full article content in feeds
- **Media Enclosures**: Support for podcast/video content
- **Feed Customization**: User-configurable feed parameters
- **Webhook Notifications**: Real-time feed updates for services

## 📚 Additional Resources

- **RSS 2.0 Specification**: [RSS Advisory Board](https://www.rssboard.org/rss-specification)
- **RSS Reader Recommendations**: [RSS Readers Directory](https://rss-readers.org/)
- **Feed Validation**: [W3C Feed Validation Service](https://validator.w3.org/feed/)
- **RSS Best Practices**: [Mozilla RSS Guide](https://developer.mozilla.org/en-US/docs/Web/RSS)

---

**Need Help?** If you encounter issues with RSS feeds or have suggestions for improvements, please [open an issue on GitHub](https://github.com/PatrickBziuk/seez/issues) with the label `rss`.