# Translation Opt-Out Guide (notranslate)

This project now supports marking content that must NOT be auto-translated.

Two mechanisms are available:

- Frontmatter list: add `notranslate: ['Gl1tch', 'SZ-005']` to preserve exact phrases.
- Block markers: wrap any section in HTML comments:

  <!-- notranslate:start -->

  Original text, lyrics, code-like content, brand names, etc.
  <!-- notranslate:end -->

The translation generators detect and mask these before sending to the model and restore them after.

Collections affected: all that extend the base schema (figures, texts, music, etc.).

Notes:

- Use sparingly—prefer exact phrases for stability.
- Update DecapCMS config to expose `notranslate` as a list for editors.
