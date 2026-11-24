/**
 * Werkstatt (workshop) texts, moved from the former System Logs, Creative Core and
 * Tech Stack pages (KONZEPT B9). Wording kept; umlauts restored, English UI labels
 * translated on the German side.
 *
 * Visibility follows the publication gate: general pages (process, tools, origin) are
 * public. Work states (song phase lists, release planning) are `publicationStatus:
 * 'draft'` and only appear in the local draft preview (`pnpm dev:drafts`).
 */
type L = { de: string; en: string };

export const PROCESS_STEPS: Array<{ title: L; text: L }> = [
  {
    title: { de: 'Eingang: rohes Gefühl', en: 'Input: raw emotion' },
    text: {
      de: 'Gedankenfetzen, alte Notizen, rohe Situationen aus Jugend, Internet und Beziehungen.',
      en: 'Thought fragments, old notes, and raw situations from youth, internet, and relationships.',
    },
  },
  {
    title: { de: 'Prozess: Iteration', en: 'Process: iteration' },
    text: {
      de: 'KI als Portal für Varianten: Stimme, Perspektive, Rhythmus. Danach harte menschliche Selektion.',
      en: 'AI as portal for variations: voice, perspective, rhythm. Then strict human selection.',
    },
  },
  {
    title: { de: 'Ergebnis: Echtheit', en: 'Output: authenticity' },
    text: {
      de: 'Das Endergebnis ist kein Zufall. Es ist kuratiert, geschichtet und final bewusst entschieden.',
      en: 'The output is not random. It is curated, layered, and deliberately decided.',
    },
  },
];

export const PROCESS_LEAD: L = {
  de: 'Ein Prozess statt einem Tool-Stack: Emotion, Iteration und Produktion greifen ineinander. KI bleibt Verstärker, nicht Ursprung.',
  en: 'A process, not a tool stack: emotion, iteration, and production work as one. AI stays amplifier, not origin.',
};

export const MANIFESTO: L = {
  de: 'Ich ersetze kein Team. Ich bin das Team. KI ist Werkzeug, nicht Ursprung.',
  en: 'I am not replacing a team. I am the team. AI is a tool, not the origin.',
};

/** Former "Evidence Locker" real entries: where the material comes from. Placeholder slots dropped. */
export const ORIGINS: Array<{ stamp: string; title: L; text: L }> = [
  {
    stamp: '2014–2016',
    title: { de: 'Tumblr-Zeit / zeilenliebe', en: 'Tumblr era / zeilenliebe' },
    text: {
      de: '15k Follower, Q&A-Fragmente, alte Posts als Ursprung der Splinter-Stimme.',
      en: '15k followers, Q&A fragments, legacy posts as source of the Splinter voice.',
    },
  },
  {
    stamp: '2015+',
    title: { de: 'Skizzenarchiv', en: 'Sketch archive' },
    text: {
      de: 'Unknown, Drift und weitere Charakter-Skizzen als Rohmaterial für die heutige Bildpipeline.',
      en: "Unknown, Drift and other character sketches as raw material for today's visual pipeline.",
    },
  },
  {
    stamp: '2014',
    title: { de: 'Frühe Kleidung', en: 'Legacy wear' },
    text: {
      de: 'Frühe Hoodie- und Merch-Versuche als erster Beweis für eine Community.',
      en: 'Early hoodie and merch attempts as first community proof.',
    },
  },
  {
    stamp: '2025–2026',
    title: { de: 'Wechsel zu Seez', en: 'Transition to Seez' },
    text: {
      de: 'Übergang von alten Identitäten in ein gemeinsames Universum aus Text, Musik und Figuren.',
      en: 'Migration from old identities into one universe of text, music, and characters.',
    },
  },
];

/** Former "Character Style Matrix": one figure, one medium in writing. */
export const STYLE_MATRIX: Array<{ figure: string; device: L; text: L }> = [
  {
    figure: 'splinter',
    device: { de: 'Notizblock', en: 'Notebook' },
    text: {
      de: 'Skizzen, Szenen, Gedanken, Entwürfe, Poesie und roher Schmerz.',
      en: 'Sketches, scenes, thoughts, drafts, poetry, and raw pain.',
    },
  },
  {
    figure: 'gl1tch',
    device: { de: 'Codeblock', en: 'Code block' },
    text: {
      de: 'Tech-Liebe und der Versuch, Liebe, Ethik und Identität zu formalisieren.',
      en: 'Love for tech and the attempt to formalize love, ethics, and identity.',
    },
  },
  {
    figure: 'lume',
    device: { de: 'Klappentexte', en: 'Blurb fragments' },
    text: {
      de: 'Lume denkt in Büchern und Fandom-Arcs, als wäre jedes Kapitel ein Portal.',
      en: 'Lume thinks in books and fandom arcs, as if every chapter were a portal.',
    },
  },
  {
    figure: 'lume',
    device: { de: 'Wiki-/Fandomartikel', en: 'Wiki/fandom article' },
    text: {
      de: 'Lume pflegt die Wissensbasis der Splitter, Gl1tch liefert die Infrastruktur.',
      en: 'Lume curates the splitter knowledge base, Gl1tch builds the infrastructure.',
    },
  },
  {
    figure: 'drift',
    device: { de: 'Tumblr-Post', en: 'Tumblr post' },
    text: {
      de: 'Affekt, Geschwindigkeit, keine Schutzschicht: raus in die Welt, sofort.',
      en: 'Impulse, speed, no guardrails: straight into the world.',
    },
  },
];

/** Former Creative Core modules. */
export const TOOLS: Array<{ label: string; title: string; text: L }> = [
  {
    label: 'Visual',
    title: 'ComfyUI + ControlNet',
    text: {
      de: 'Skizzen werden in visuelle Identitäten gerendert. Die Handschrift bleibt menschlich, die Ausführung wird präziser.',
      en: 'Sketches are rendered into visual identities. Human signature stays; execution gets sharper.',
    },
  },
  {
    label: 'Narrative',
    title: 'LLM-Iteration',
    text: {
      de: 'Sätze werden hundertfach geschliffen, bis sie tragen. Nicht der erste Output gewinnt, sondern der ehrlichste.',
      en: 'Lines are iterated heavily until they hold. Not first output wins, the most honest one does.',
    },
  },
  {
    label: 'Audio',
    title: 'Suno + Logic Pro',
    text: {
      de: 'Ideen starten digital und enden in menschlichem Feintuning. Layering, Rauschen und Haltung machen den Unterschied.',
      en: 'Ideas start digitally and finish with human refinement. Layering, noise, and intent create the difference.',
    },
  },
];

export const TOOLS_LEAD: L = {
  de: 'Werkzeuge sind nicht der Ursprung. KI, Webtechnik und Automatisierung sind Produktionsmittel im Seez-Kosmos. Die Hauptsache bleibt: Stimme, Figur, Song, Fragment.',
  en: 'Tools are not the origin. AI, web tech, and automation are production means inside the Seez cosmos. The core remains voice, figure, song, fragment.',
};

/**
 * Work states from the former System Logs. Not public (user decision: the workshop shows
 * only what is explicitly released). Kept here so nothing is lost; visible in draft preview.
 */
export const WORK_STATES = {
  publicationStatus: 'draft' as const,
  phaseOne: [
    'Aufstiegstraum (Shift)',
    'Listen & Lichter (Splinter)',
    'Weißes Rauschen (Drift)',
    'Hedwig (Unknown)',
    'Mondstein (Drift)',
    'Questlog (Lume)',
    'CVE-10 (Gl1tch)',
    'Tumblr Träume (Splinter)',
    'Fuck Suno (Gl1tch)',
    'Kiffen Kippen Alk (Drift)',
    'Illegale Aliens (Unknown)',
    'Spiegelkrise (Splinter)',
  ],
  phaseTwo: [
    'Maskenspiel (Splinter)',
    'Schichtliebe (Shift)',
    'Genäht (Splinter)',
    'Als sie (Unknown)',
    'Herz klopft, Kopf platzt (Drift)',
    'Ich will leuchten (Lume)',
    'Target Audience (Gl1tch)',
    'Schmetterlingsmoment (Lume)',
    'Nachtgedanken (Splinter)',
    'Zwischenräume (Unknown)',
    'Mehrarbeit (Shift)',
  ],
  phaseOneLead: 'Kindheit, Pubertät, Tumblr. Leitmotiv: Warum bin ich so geworden?',
  phaseTwoLead: 'Systemkritik, Überforderung, Beziehungscrash. Leitmotiv: Warum funktioniert Reparieren nicht?',
  // Former "Release Dossier" milestone text named dates; it is not shown anywhere (user decision 9).
};
