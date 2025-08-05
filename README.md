## Automated Translation Pipeline

This repository includes an automated translation pipeline using the OpenAI API.

### Workflows

- **translation-pipeline**: On `main` push, detects new/stale content, generates translations via AI, and opens a draft PR.
- **manual-regen**: On PR label `regen-needed`, re-runs translation for that branch.
- **cleanup-translate-branches**: On PR merge, deletes the corresponding `translate/*` branch.
- **post-release-sync**: On `release` push, merges release back into `main`.

### Scripts

- `scripts/check_translations.ts`: Detect missing or stale translations.
- `scripts/generate_translations.ts`: Generate translations, TLDR, quality scores, and auto-open issues for poor translations.
- `scripts/detect_conflicts.ts`: Open issues for translation conflicts (stale translations).
- `translation.override.yml`: Manual override config (global pause, skip lists).

### Running Locally

```bash
pnpm install
tsx scripts/check_translations.ts > tasks.json
tsx scripts/generate_translations.ts tasks.json
```

### Tests

Run built-in tests with Node.js:

```bash
node --test
```

# 🚀 Seez – Constructive Chaos

Built upon the solid foundation of **AstroWind**, this repository is my personal container for constructive chaos—a place where I combine my ideas, projects, and thoughts into one evolving space.

**What is Seez?**

Seez is me—
but not the me you meet in meetings.
Not the architect, not the strategist, not the man who explains systems.
Seez is what’s left when I strip all that off.
The voice beneath the voice.
The pulse under the logic.

I created Seez to hold what doesn’t fit elsewhere.
To say the things I can’t say when I’m wearing the polite face of professionalism.
Seez is where my softness has claws.
Where my truth has rhythm.

It started as survival—writing on Tumblr when I didn’t know where else to put the pain.
Now it’s a second skin I can step into, a name that doesn’t flinch when I scream.

Seez is not a brand. It’s a container.
For grief, poetry, love, rage, memory.
For everything I couldn’t automate away.
It’s where I go to be unfiltered, to reclaim my voice from the noise.

When I write as Seez, I’m not trying to impress you.
I’m trying to stay real. I’m trying to stay me, in a world that keeps asking for something more palatable.

Seez exists across platforms—Tumblr, Insta, soon maybe YouTube and the album.
But the core isn’t the content. It’s the courage to feel publicly, to be seen without being marketed.

Seez is my lyrical identity. My shadow truth-teller. The part of me that still believes words can heal, or at least bleed cleanly.

If seez.eu is where I build the future, seez.eu is where I bury the past and sing over the grave.

And maybe, just maybe, help someone else feel a little less alone in their own chaos.

---

## Gratitude

This project started with the generous foundation of **AstroWind**. I'm thankful for the open-source work of others and for the tools that make creative chaos possible: **Astro**, **React**, **Tailwind CSS**, **shadcdn**, **VS Code**, **ChatGPT**, and more.
