/**
 * SzPlayer – custom controls for the site's own <video> (markup: components/seez/media/SzPlayer.astro).
 * Modelled on the usual video-platform layout so a hosted embed could take its place later,
 * but without anyone's logo or name. Plain JS, no storage, nothing loaded from elsewhere.
 *
 * mountPlayer(root) wires one player; bootPlayers() mounts every player on the page that is not
 * marked data-szp-defer (templates that get cloned first, e.g. the Videothek rental slip).
 */

const T = {
  de: {
    play: 'Abspielen (k)',
    pause: 'Pause (k)',
    replay: 'Noch einmal ansehen',
    mute: 'Stummschalten (m)',
    unmute: 'Ton an (m)',
    volume: 'Lautstärke',
    seek: 'Suchen',
    of: 'von',
    settings: 'Einstellungen',
    speed: 'Geschwindigkeit',
    normal: 'Normal',
    fs: 'Vollbild (f)',
    fsExit: 'Vollbild beenden (f)',
    wide: 'Kinomodus (t)',
    wideExit: 'Standardansicht (t)',
    cc: 'Untertitel (c)',
  },
  en: {
    play: 'Play (k)',
    pause: 'Pause (k)',
    replay: 'Watch again',
    mute: 'Mute (m)',
    unmute: 'Unmute (m)',
    volume: 'Volume',
    seek: 'Seek',
    of: 'of',
    settings: 'Settings',
    speed: 'Playback speed',
    normal: 'Normal',
    fs: 'Full screen (f)',
    fsExit: 'Exit full screen (f)',
    wide: 'Theatre mode (t)',
    wideExit: 'Default view (t)',
    cc: 'Subtitles (c)',
  },
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const FRAME = 1 / 30;
const IDLE_MS = 2600;

export const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

const parseLength = (s?: string) => {
  if (!s) return 0;
  return s.split(':').reduce((acc, p) => acc * 60 + Number(p || 0), 0) || 0;
};

export function mountPlayer(root: HTMLElement) {
  if (root.dataset.szpReady) return;
  root.dataset.szpReady = '1';
  const $ = <E extends Element = HTMLElement>(sel: string) => root.querySelector<E>(sel) as E;
  const v = $<HTMLVideoElement>('video');
  const t = T[root.dataset.lang === 'en' ? 'en' : 'de'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const num = (n: number) => (root.dataset.lang === 'en' ? String(n) : String(n).replace('.', ','));

  v.controls = false;
  v.removeAttribute('controls');
  root.classList.add('is-js', 'is-paused');

  const big = $<HTMLButtonElement>('[data-szp-big]');
  const playBtn = $<HTMLButtonElement>('[data-szp-play]');
  const muteBtn = $<HTMLButtonElement>('[data-szp-mute]');
  const vol = $('[data-szp-vol]');
  const volFill = $('[data-szp-volfill]');
  const prog = $('[data-szp-progress]');
  const played = $('[data-szp-played]');
  const buffered = $('[data-szp-buffered]');
  const handle = $('[data-szp-handle]');
  const tip = $('[data-szp-tip]');
  const cur = $('[data-szp-cur]');
  const dur = $('[data-szp-dur]');
  const gear = $<HTMLButtonElement>('[data-szp-gear]');
  const menu = $('[data-szp-menu]');
  const fsBtn = $<HTMLButtonElement>('[data-szp-fs]');
  const wideBtn = root.querySelector<HTMLButtonElement>('[data-szp-wide]');
  const ccBtn = $<HTMLButtonElement>('[data-szp-cc]');
  const flash = $('[data-szp-flash]');
  const hint = $('[data-szp-hint]');
  const wideHost = root.closest<HTMLElement>('[data-szp-theater]');
  if (wideBtn && !wideHost) wideBtn.hidden = true;

  let length = parseLength(root.dataset.length);
  const total = () => (Number.isFinite(v.duration) && v.duration > 0 ? v.duration : length);
  let scrubbing = false;
  let resumeAfterScrub = false;

  // ---------- labels / state ----------
  const setLabel = (b: HTMLElement | null, label: string) => {
    if (!b) return;
    b.setAttribute('aria-label', label);
    b.title = label;
  };
  const syncPlay = () => {
    const paused = v.paused;
    const ended = v.ended;
    root.classList.toggle('is-paused', paused);
    root.classList.toggle('is-playing', !paused);
    root.classList.toggle('is-ended', ended);
    const label = ended ? t.replay : paused ? t.play : t.pause;
    setLabel(playBtn, label);
    setLabel(big, label);
  };
  const syncVol = () => {
    const level = v.muted ? 0 : v.volume;
    root.classList.toggle('is-muted', level === 0);
    root.classList.toggle('is-quiet', level > 0 && level < 0.5);
    setLabel(muteBtn, level === 0 ? t.unmute : t.mute);
    volFill.style.width = `${level * 100}%`;
    vol.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    vol.setAttribute('aria-valuetext', `${Math.round(level * 100)} %`);
  };
  const syncTime = () => {
    const d = total();
    const c = scrubbing ? Number(prog.dataset.scrub || 0) : v.currentTime;
    const p = d ? Math.min(1, c / d) : 0;
    played.style.transform = `scaleX(${p})`;
    handle.style.left = `${p * 100}%`;
    cur.textContent = fmt(c);
    dur.textContent = fmt(d);
    prog.setAttribute('aria-valuemax', String(Math.round(d)));
    prog.setAttribute('aria-valuenow', String(Math.round(c)));
    prog.setAttribute('aria-valuetext', `${fmt(c)} ${t.of} ${fmt(d)}`);
    let b = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= v.currentTime + 0.5) b = Math.max(b, v.buffered.end(i));
    }
    buffered.style.transform = `scaleX(${d ? Math.min(1, b / d) : 0})`;
  };
  let raf = 0;
  const loop = () => {
    syncTime();
    raf = v.paused ? 0 : requestAnimationFrame(loop);
  };

  // ---------- controls visibility ----------
  let idleTimer = 0;
  const wake = () => {
    root.classList.add('is-active');
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!v.paused && !menuOpen() && !scrubbing && !root.querySelector('.szp__bar :focus-visible'))
        root.classList.remove('is-active');
    }, IDLE_MS);
  };
  const sleep = () => {
    if (v.paused || menuOpen()) return;
    clearTimeout(idleTimer);
    root.classList.remove('is-active');
  };

  // ---------- actions ----------
  const doFlash = (kind: string) => {
    if (reduce || !flash) return;
    flash.dataset.kind = kind;
    flash.classList.remove('is-on');
    void flash.offsetWidth;
    flash.classList.add('is-on');
  };
  const doHint = (text: string) => {
    if (!hint) return;
    hint.textContent = text;
    hint.classList.remove('is-on');
    void hint.offsetWidth;
    hint.classList.add('is-on');
  };
  const toggle = () => {
    if (v.paused || v.ended) {
      root.classList.add('is-started');
      if (v.readyState < 3) root.classList.add('is-waiting');
      v.play().catch(() => root.classList.remove('is-waiting'));
      doFlash('play');
    } else {
      v.pause();
      doFlash('pause');
    }
    wake();
  };
  const seekTo = (s: number) => {
    const d = total();
    v.currentTime = Math.max(0, d ? Math.min(d, s) : s);
    syncTime();
    wake();
  };
  const seekBy = (s: number) => {
    seekTo(v.currentTime + s);
    doHint(`${s > 0 ? '+' : '−'}${Math.abs(s)} s`);
  };
  const setVolume = (x: number) => {
    x = Math.max(0, Math.min(1, x));
    v.volume = x;
    v.muted = x === 0;
    wake();
  };
  const toggleMute = () => {
    if (v.muted || v.volume === 0) {
      v.muted = false;
      if (v.volume === 0) v.volume = 0.5;
    } else v.muted = true;
    wake();
  };
  const fsEl = () =>
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
  const toggleFs = () => {
    type W = HTMLElement & { webkitRequestFullscreen?: () => void };
    const vv = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (fsEl()) {
      (
        document.exitFullscreen || (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen
      )?.call(document);
    } else if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => vv.webkitEnterFullscreen?.());
    } else if ((root as W).webkitRequestFullscreen) {
      (root as W).webkitRequestFullscreen!();
    } else vv.webkitEnterFullscreen?.();
  };
  const syncFs = () => {
    const on = fsEl() === root;
    root.classList.toggle('is-fs', on);
    setLabel(fsBtn, on ? t.fsExit : t.fs);
  };
  const toggleWide = () => {
    if (!wideHost || !wideBtn) return;
    const on = !wideHost.hasAttribute('data-wide');
    wideHost.toggleAttribute('data-wide', on);
    wideBtn.setAttribute('aria-pressed', String(on));
    setLabel(wideBtn, on ? t.wideExit : t.wide);
  };
  const setSpeed = (s: number) => {
    v.playbackRate = s;
    menu
      .querySelectorAll<HTMLElement>('[data-speed]')
      .forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.speed) === s)));
    const label = s === 1 ? t.normal : `${num(s)}×`;
    const val = gear.querySelector('[data-szp-speedval]');
    if (val) val.textContent = s === 1 ? '' : `${num(s)}×`;
    setLabel(gear, `${t.settings} · ${t.speed}: ${label}`);
  };
  const tracks = () => Array.from(v.textTracks).filter((x) => x.kind === 'subtitles' || x.kind === 'captions');
  const toggleCc = () => {
    const list = tracks();
    if (!list.length) return;
    const on = list[0].mode !== 'showing';
    list.forEach((x, i) => (x.mode = on && i === 0 ? 'showing' : 'disabled'));
    ccBtn.setAttribute('aria-pressed', String(on));
  };

  // ---------- settings menu ----------
  const menuOpen = () => !menu.hidden;
  const closeMenu = (focusGear = false) => {
    if (menu.hidden) return;
    menu.hidden = true;
    gear.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    if (focusGear) gear.focus();
  };
  const outside = (e: Event) => {
    if (!menu.contains(e.target as Node) && !gear.contains(e.target as Node)) closeMenu();
  };
  const openMenu = () => {
    menu.hidden = false;
    gear.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', outside, true);
    (
      menu.querySelector<HTMLElement>('[aria-checked="true"]') ||
      menu.querySelector<HTMLElement>('[role="menuitemradio"]')
    )?.focus();
    wake();
  };
  gear.addEventListener('click', () => (menuOpen() ? closeMenu() : openMenu()));
  menu.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-speed]');
    if (!b) return;
    setSpeed(Number(b.dataset.speed));
    closeMenu(true);
  });
  menu.addEventListener('keydown', (e) => {
    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]'));
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => items[(n + items.length) % items.length]?.focus();
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      closeMenu(e.key === 'Escape');
      e.stopPropagation();
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
  });

  // ---------- sliders ----------
  const ratioAt = (el: HTMLElement, x: number) => {
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width));
  };
  prog.addEventListener('pointermove', (e) => {
    const p = ratioAt(prog, e.clientX);
    tip.textContent = fmt(p * total());
    const r = prog.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.max(half, Math.min(r.width - half, p * r.width))}px`;
    prog.style.setProperty('--hover', String(p));
    if (scrubbing) {
      prog.dataset.scrub = String(p * total());
      syncTime();
      v.currentTime = p * total();
    }
  });
  prog.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    prog.setPointerCapture(e.pointerId);
    scrubbing = true;
    root.classList.add('is-scrubbing', 'is-started');
    resumeAfterScrub = !v.paused;
    if (resumeAfterScrub) v.pause();
    const s = ratioAt(prog, e.clientX) * total();
    prog.dataset.scrub = String(s);
    v.currentTime = s;
    syncTime();
    wake();
  });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false;
    root.classList.remove('is-scrubbing');
    if (resumeAfterScrub) v.play().catch(() => {});
    syncTime();
  };
  prog.addEventListener('pointerup', endScrub);
  prog.addEventListener('pointercancel', endScrub);
  prog.addEventListener('keydown', (e) => {
    const k = e.key;
    const step =
      k === 'PageUp'
        ? 10
        : k === 'PageDown'
          ? -10
          : k === 'ArrowRight' || k === 'ArrowUp'
            ? 5
            : k === 'ArrowLeft' || k === 'ArrowDown'
              ? -5
              : 0;
    if (step) seekBy(step);
    else if (k === 'Home') seekTo(0);
    else if (k === 'End') seekTo(total());
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  let volDrag = false;
  vol.addEventListener('pointerdown', (e) => {
    vol.setPointerCapture(e.pointerId);
    volDrag = true;
    setVolume(ratioAt(vol, e.clientX));
  });
  vol.addEventListener('pointermove', (e) => volDrag && setVolume(ratioAt(vol, e.clientX)));
  vol.addEventListener('pointerup', () => (volDrag = false));
  vol.addEventListener('pointercancel', () => (volDrag = false));
  vol.addEventListener('keydown', (e) => {
    const k = e.key;
    const level = v.muted ? 0 : v.volume;
    if (k === 'ArrowRight' || k === 'ArrowUp') setVolume(level + 0.05);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') setVolume(level - 0.05);
    else if (k === 'Home') setVolume(0);
    else if (k === 'End') setVolume(1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  // ---------- buttons ----------
  big.addEventListener('click', toggle);
  playBtn.addEventListener('click', toggle);
  muteBtn.addEventListener('click', toggleMute);
  fsBtn.addEventListener('click', toggleFs);
  wideBtn?.addEventListener('click', toggleWide);
  ccBtn.addEventListener('click', toggleCc);

  // ---------- surface: click, double click, touch ----------
  const surface = $('[data-szp-surface]');
  let lastTap = 0;
  let lastTapX = 0;
  let tapTimer = 0;
  let lastPointer = 'mouse';
  surface.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType));
  surface.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    // touch / pen: tap toggles the controls, double tap on the sides jumps ±10 s
    const r = surface.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const now = performance.now();
    if (now - lastTap < 300 && Math.abs(x - lastTapX) < 0.2 && (x < 0.35 || x > 0.65)) {
      clearTimeout(tapTimer);
      seekBy(x < 0.5 ? -10 : 10);
      lastTap = 0;
      return;
    }
    lastTap = now;
    lastTapX = x;
    clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => {
      if (!root.classList.contains('is-started')) return toggle();
      if (root.classList.contains('is-active') && !v.paused) sleep();
      else wake();
    }, 250);
  });
  surface.addEventListener('click', () => {
    if (lastPointer !== 'mouse') return;
    root.focus({ preventScroll: true });
    toggle();
  });
  surface.addEventListener('dblclick', () => {
    if (lastPointer !== 'mouse') return;
    toggleFs();
  });
  root.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && wake());
  root.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && sleep());
  root.addEventListener('focusin', wake);

  // ---------- keyboard (like the big platforms) ----------
  root.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tgt = e.target as HTMLElement;
    const onButton = tgt.closest('button, [role="menuitemradio"]');
    const k = e.key;
    switch (k) {
      case ' ':
        if (onButton) return;
        toggle();
        break;
      case 'k':
      case 'K':
        toggle();
        break;
      case 'j':
      case 'J':
        seekBy(-10);
        break;
      case 'l':
      case 'L':
        seekBy(10);
        break;
      case 'ArrowLeft':
        seekBy(-5);
        break;
      case 'ArrowRight':
        seekBy(5);
        break;
      case 'ArrowUp':
        setVolume((v.muted ? 0 : v.volume) + 0.05);
        doHint(`${Math.round(v.volume * 100)} %`);
        break;
      case 'ArrowDown':
        setVolume((v.muted ? 0 : v.volume) - 0.05);
        doHint(`${Math.round(v.muted ? 0 : v.volume * 100)} %`);
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'f':
      case 'F':
        toggleFs();
        break;
      case 't':
      case 'T':
        if (!wideHost) return;
        toggleWide();
        break;
      case 'c':
      case 'C':
        if (!tracks().length) return;
        toggleCc();
        break;
      case 'Home':
        seekTo(0);
        break;
      case 'End':
        seekTo(total());
        break;
      case ',':
      case '.':
        if (!v.paused) return;
        seekTo(v.currentTime + (k === '.' ? FRAME : -FRAME));
        break;
      case '<':
      case '>': {
        const i = SPEEDS.indexOf(v.playbackRate);
        const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 2 : i) + (k === '>' ? 1 : -1)))];
        setSpeed(next);
        doHint(`${num(next)}×`);
        break;
      }
      case 'Escape':
        if (!menuOpen()) return;
        closeMenu(true);
        break;
      default:
        if (/^[0-9]$/.test(k)) {
          seekTo((Number(k) / 10) * total());
          break;
        }
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  });

  // ---------- media events ----------
  v.addEventListener('play', () => {
    root.classList.add('is-started');
    syncPlay();
    if (!raf) raf = requestAnimationFrame(loop);
    wake();
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((m) => m !== v && m.pause());
  });
  v.addEventListener('pause', () => {
    syncPlay();
    syncTime();
    root.classList.add('is-active');
  });
  v.addEventListener('ended', () => {
    syncPlay();
    root.classList.add('is-active');
  });
  v.addEventListener('waiting', () => root.classList.add('is-waiting'));
  ['playing', 'canplay', 'pause', 'error', 'seeked'].forEach((ev) =>
    v.addEventListener(ev, () => {
      if (ev !== 'seeked' || v.readyState >= 3) root.classList.remove('is-waiting');
      if (ev === 'playing') syncPlay();
    })
  );
  v.addEventListener('seeking', () => {
    syncPlay();
    if (v.readyState < 3 && !v.paused) root.classList.add('is-waiting');
  });
  v.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(v.duration)) length = v.duration;
    syncTime();
  });
  v.addEventListener('timeupdate', () => {
    if (!raf) syncTime();
    if (v.ended !== root.classList.contains('is-ended')) syncPlay();
  });
  v.addEventListener('seeked', syncPlay);
  v.addEventListener('progress', syncTime);
  v.addEventListener('volumechange', syncVol);
  v.addEventListener('ratechange', () => setSpeed(v.playbackRate));
  root.addEventListener('fullscreenchange', syncFs);
  root.addEventListener('webkitfullscreenchange', syncFs);

  if (tracks().length) {
    ccBtn.hidden = false;
    ccBtn.setAttribute('aria-pressed', String(tracks()[0].mode === 'showing'));
    setLabel(ccBtn, t.cc);
  }
  if (
    !(document.fullscreenEnabled || (v as HTMLVideoElement & { webkitEnterFullscreen?: unknown }).webkitEnterFullscreen)
  )
    fsBtn.hidden = true;

  syncPlay();
  syncVol();
  syncTime();
  syncFs();
  setSpeed(1);
  if (wideBtn) setLabel(wideBtn, t.wide);
}

export function bootPlayers() {
  document.querySelectorAll<HTMLElement>('[data-szp]:not([data-szp-defer])').forEach(mountPlayer);
}
