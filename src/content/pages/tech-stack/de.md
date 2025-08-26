---
title: Tech Stack
language: de
authors:
  - authors/seez-de
tags:
  - astro
  - jamstack
  - typescript
  - tailwind
  - deployment
  - tech-stack
publicationStatus: published
draft: false
canonicalId: 01k2jadmvq8mn9ckpav7jsd6g
firstPublishedAt: '2025-01-12T19:59:08.408Z'
description: Die Technologien, Frameworks und Prinzipien hinter dieser Website und meinen Projekten.
publishDate: '2025-01-12T19:59:08.408Z'
---

# Der Tech Stack Hinter Diesem Projekt

Diese Seite und die meisten meiner Projekte sind bewusst mit Fokus auf **Einfachheit**, **Performance**, **Wartbarkeit** und **digitale Souveränität** gebaut. Hier siehst du, was alles antreibt und warum ich diese Technologien gewählt habe.

## Core Framework

### 🚀 Astro 5.x

**Warum Astro?** Es verkörpert perfekt meine Philosophie, nur das zu versenden, was wirklich gebraucht wird. Astro generiert standardmäßig statisches HTML und hydriert JavaScript nur bei Bedarf. Das resultiert in blitzschnellen Seiten mit minimalem JavaScript-Ballast.

- **Zero-JS by default**: Seiten laden sofort, weil kein unnötiges JavaScript vorhanden ist
- **Component agnostic**: React, Vue, Svelte oder einfach Astro-Komponenten - was zur Aufgabe passt
- **Content collections**: Perfekt für mehrsprachige Inhalte mit Typsicherheit
- **Moderne Tooling**: Eingebaute TypeScript-Unterstützung, Dev-Server und Build-Optimierung

## Styling & Design

### 🎨 Tailwind CSS

**Warum Tailwind?** Utility-First CSS, das mit deinem Projekt wächst, ohne dass dein Bundle größer wird. Nur die Klassen, die du verwendest, werden in den finalen Build aufgenommen.

- **Kein CSS-Ballast**: Nur tatsächlich verwendete Styles werden eingeschlossen
- **Design-System-Konsistenz**: Durchgesetzte Abstände, Farben und Typografie-Skalen
- **Developer Experience**: IntelliSense und sofortiges visuelles Feedback
- **Wartbar**: Keine CSS-Dateien zu verwalten, Styles sind co-lokalisiert mit Komponenten

## Content Management

### 📝 Astro Content Collections

**Warum Content Collections?** Typsichere, strukturierte Content-Verwaltung, die von einfachen Seiten bis zu komplexen mehrsprachigen Sites skaliert.

- **Typsicherheit**: Content-Fehler zur Build-Zeit abfangen
- **Mehrsprachige Unterstützung**: Eingebaute Behandlung für mehrere Sprachen
- **Flexibles Schema**: Unterstützung für Metadaten, KI-Attribution und komplexe Content-Strukturen
- **Versionskontrolle**: Content lebt in Git neben dem Code

### 🌐 Mehrsprachige Architektur

Von Grund auf für deutsche und englische Inhalte gebaut mit:

- **astro-i18next**: Professionelles i18n-Routing und Übersetzungen
- **Sprachbewusste URLs**: `/en/about` und `/de/ueber` Muster
- **Automatisierte hreflang**: Ordentliche SEO für mehrsprachige Inhalte
- **Übersetzungs-Workflows**: KI-unterstützte Übersetzung mit menschlicher Überprüfung

## Search & Discovery

### 🔍 Pagefind

**Warum Pagefind?** Statische Website-Suche, die keine Server oder externe Services benötigt.

- **Privacy-first**: Kein Tracking, keine externen Services
- **Blitzschnell**: Client-seitige Suche mit exzellenter Performance
- **Mehrsprachig**: Automatische Spracherkennung und Suche
- **Zero-Konfiguration**: Funktioniert out-of-the-box mit Astro

## Deployment & Hosting

### 📦 GitHub Pages & Codeberg Pages

**Warum statisches Hosting?** Entspricht meinen Prinzipien der digitalen Souveränität - kein Vendor Lock-in, maximale Performance, minimale Kosten.

- **GitHub Pages**: Primäres Deployment-Ziel mit GitHub Actions CI/CD
- **Codeberg Pages**: Mirror-Deployment für Redundanz und europäisches Hosting
- **Statische Assets**: Globale CDN-Performance ohne Komplexität
- **Versionskontrolle**: Jedes Deployment ist an einen Git-Commit gebunden

## Development Workflow

### 🔧 Moderne JavaScript-Tooling

- **TypeScript**: Typsicherheit über die gesamte Codebasis
- **pnpm**: Schnelle, speichereffiziente Paket-Verwaltung
- **ESLint & Prettier**: Konsistente Code-Formatierung und Qualität
- **Playwright**: End-to-End-Testing für kritische User-Flows

### 🚢 CI/CD Pipeline

- **GitHub Actions**: Automatisiertes Testing, Building und Deployment
- **Multi-Target-Deployment**: Simultanes Deployment auf mehrere Plattformen
- **Quality Gates**: Automatisiertes Testing vor Deployment
- **Dependency Management**: Automatisierte Sicherheits-Updates

## Performance & Optimierung

### ⚡ Build-Optimierung

- **Statische Generierung**: Vor-gerenderte HTML für maximale Performance
- **Bild-Optimierung**: Automatische WebP-Konvertierung und responsive Bilder
- **CSS-Purging**: Nur verwendete Styles schaffen es in die Produktion
- **JavaScript-Minimierung**: Tree-Shaking und Code-Splitting

### 📊 Bundle-Analyse

- **Astro Bundle Analyzer**: Bundle-Größe und Zusammensetzung überwachen
- **Pagefind-Indexierung**: Optimierte Such-Indizes
- **Font-Optimierung**: Selbst-gehostete Inter Variable Font

## KI-Integration & Transparenz

### 🤖 KI-Tooling

- **Übersetzungsassistenz**: KI-gestützte mehrsprachige Inhalte mit menschlicher Überprüfung
- **Content-Analyse**: Automatisierte Qualitätsbewertung und Optimierungsvorschläge
- **Token-Tracking**: Vollständige Transparenz über KI-Nutzung und Kosten
- **Umweltauswirkungen**: CO2-Tracking für KI-Operationen

## Monitoring & Analytics

### 📈 Privacy-First Analytics

- **Plausible Analytics**: DSGVO-konforme, Cookie-freie Website-Analytics
- **Core Web Vitals**: Performance-Monitoring ohne User-Tracking
- **Build-Analytics**: Build-Zeiten und Optimierungsmöglichkeiten überwachen

## Warum Dieser Stack?

### 🎯 Übereinstimmung mit Prinzipien

Jede Technologie-Entscheidung entspricht meinen Kernprinzipien:

1. **Digitale Souveränität**: Kein Vendor Lock-in, selbst-hostbar, Open Source
2. **Performance**: Schnelles Laden, minimales JavaScript, optimierte Auslieferung
3. **Privacy**: Kein Tracking, keine externen Abhängigkeiten, benutzerkontrolliert
4. **Transparenz**: Open Source, dokumentierte Entscheidungen, klare Architektur
5. **Wartbarkeit**: Einfach, gut dokumentiert, zukunftssicher

### 🔄 Lernen & Evolution

Dieser Stack wächst mit meinem Wissen:

- **Astro**: Gelernt durch den Bau dieser Seite
- **Tailwind**: Gemeistert durch mehrere Projekte
- **TypeScript**: Kontinuierliche Verbesserung über alle Projekte
- **Deployment**: Multi-Plattform-Strategie für Resilience

### 🛠 Praktische Vorteile

- **Schnelle Entwicklung**: Hot Reload, großartige DX, minimale Konfiguration
- **Zuverlässiges Deployment**: Mehrere Hosting-Ziele, automatisierte Pipelines
- **Skalierbarer Content**: Von einzelnen Seiten bis zu großen mehrsprachigen Sites
- **Kosteneffektiv**: Größtenteils kostenloses Hosting mit optionalen Premium-Features

---

## Willst du etwas Ähnliches bauen?

Wenn dich dieser Ansatz inspiriert und du etwas Ähnliches bauen möchtest, hier sind die Schlüsselentscheidungen, die den größten Unterschied gemacht haben:

1. **Starte mit Astro**, wenn du eine content-heavy Site mit optionaler Interaktivität brauchst
2. **Verwende Tailwind**, wenn du schnell vorankommen willst ohne CSS-Wartungsaufwand
3. **Wähle statisches Hosting** für Performance, Einfachheit und Souveränität
4. **Plane für Mehrsprachigkeit** von Tag eins an, falls du sie später brauchst
5. **Implementiere Suche** mit Pagefind für privacy-respektierende Website-Suche

Der gesamte Stack ist darauf ausgelegt, mit deinen Bedürfnissen zu wachsen, während er Einfachheit und Performance beibehält. Jeder Teil kann verstanden, modifiziert oder ersetzt werden, ohne das ganze System zu brechen.

So sieht **digitale Souveränität** in der Praxis aus.