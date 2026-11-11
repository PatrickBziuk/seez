"""Bibliothek, Papierwildnis, Kastenkampf, Nachklang, Outro."""
from core import *
from s1 import toast2, GB, COL8
from s2 import scene_hook_voxel, LABELS

# ================= Verse 3a: Spielebibliothek und Listen =================
COVERS = [("0f380f", "9bbc0f"), ("000814", "f2c14e"), ("4c7c2c", "c8c8c8"), ("5e6b3a", "e8c547"), ("3b3226", "f08a24"),
          ("6daa2c", "f6d78c"), ("6b9be8", "976b4b"), ("000000", "00ff00"), ("1e4e7a", "c8a250"), ("c8b48a", "1a1410"),
          ("000000", "ffffff"), ("7ba4ff", "6aaa40"), ("2a2140", "9ad0f5"), ("3a1a40", "ff60a0")]


def cover(d, x, y, w, h, i, dim=False):
    a, b = (hx(c) for c in COVERS[i % len(COVERS)])
    if dim:
        a, b = mix(a, hx("232a36"), .55), mix(b, hx("232a36"), .55)
    d.rounded_rectangle([x, y, x + w, y + h], radius=5, fill=a)
    r = rnd("cov", i)
    kind = i % 5
    cx, cy = x + w / 2, y + h * .45
    if kind == 0:
        for q in range(4):
            d.rectangle([x + 8 + q * (w - 16) / 4, cy - 6 + (q % 2) * 10, x + 8 + (q + .7) * (w - 16) / 4, cy + 6 + (q % 2) * 10], fill=b)
    elif kind == 1:
        d.ellipse([cx - w * .25, cy - w * .25, cx + w * .25, cy + w * .25], outline=b, width=3)
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=b)
    elif kind == 2:
        d.polygon([(cx, cy - w * .3), (cx + w * .3, cy + w * .2), (cx - w * .3, cy + w * .2)], fill=b)
    elif kind == 3:
        for q in range(3):
            d.line([x + 10, cy - 10 + q * 10, x + w - 10, cy - 10 + q * 10], fill=b, width=3)
    else:
        d.rectangle([cx - w * .22, cy - w * .22, cx + w * .22, cy + w * .22], outline=b, width=3)
        d.line([cx - w * .22, cy + w * .22, cx + w * .22, cy - w * .22], fill=b, width=2)
    d.rectangle([x + 8, y + h - 20, x + w - 8 - r.randrange(0, 20), y + h - 15], fill=b)


def scene_library(t):
    W, H = 960, 540
    ls = SEC["v3a"]
    k = cur_line("v3a", t)
    base, panel, card, txt, muted, acc = hx("12151c"), hx("1b2029"), hx("232a36"), hx("e6e9ef"), hx("8a93a3"), hx("b28fd6")
    im, d = new(W, H, base, aa=True)
    # Kopf
    d.rectangle([0, 0, W, 44], fill=panel)
    d.text((20, 22), "SeezSpiele", font=F("sansx", 17), fill=acc, anchor="lm")
    for i, tb in enumerate(["Bibliothek", "Laden", "Freunde"]):
        d.text((180 + i * 110, 22), tb, font=F("sansb", 14), fill=txt if i == 0 else muted, anchor="lm")
    d.line([180, 42, 252, 42], fill=acc, width=3)
    d.text((W - 20, 22), "So. 10:42", font=F("sans", 13), fill=muted, anchor="rm")
    # linke Spalte: Sonntag, dann die Listen
    d.rectangle([0, 44, 250, H], fill=panel)
    d.text((20, 62), "SONNTAG", font=F("sansb", 12), fill=muted)
    y = 84
    L0, L1, L3 = ls[0], ls[1], ls[3]
    items = []
    if t >= word_t(L0, "Zeit"):
        items.append(("Zeit für mich", word_t(L0, "Zeit"), acc, True))
    for frag, lab in [("Wäsche", "Wäsche machen"), ("einkaufen", "einkaufen"), ("ordentlich", "ordentlich sein")]:
        if k >= 1 and t >= word_t(L1, frag):
            items.append((lab, word_t(L1, frag), hx("f0a030"), False))
    if k >= 3 and t >= word_t(L3, "Nichtstun"):
        items.append(("Nichtstun", word_t(L3, "Nichtstun"), hx("3fb950"), False))
    pushed = sum(1 for it in items if not it[3])
    for lab, ts, col, mine in items:
        a = ease((t - ts) / .25)
        yy = y
        if mine:  # rutscht nach unten, sobald Pflichten kommen
            yy = y + 0
        x0 = int(lerp(-230, 16, a))
        struck = mine and pushed > 0
        d.rounded_rectangle([x0, yy, x0 + 218, yy + 40], radius=6, fill=card, outline=mix(col, card, .4))
        d.rounded_rectangle([x0 + 10, yy + 11, x0 + 28, yy + 29], radius=4, outline=col, width=2)
        d.text((x0 + 38, yy + 20), lab, font=F("sansb", 15), fill=muted if struck else txt, anchor="lm")
        if struck:
            d.line([x0 + 36, yy + 21, x0 + 40 + F("sansb", 15).getlength(lab), yy + 21], fill=muted, width=2)
            d.text((x0 + 208, yy + 20), "später", font=F("sans", 11), fill=muted, anchor="rm")
        y += 48
    if k >= 3 and t >= word_t(L3, "Liste"):
        d.text((20, y + 6), "+ neue Liste", font=F("sans", 13), fill=acc)
    # Kachelraster wächst
    grow = 0
    if k >= 2:
        grow = int((beat_phase(t) - beat_phase(ls[2]["s"])) * 1.6)
    n = min(48, 9 + int(max(0, t - 130.8) * .5) + grow * 2)
    cw, chh, gap = 96, 136, 14
    cols = 6
    rows_total = (n + cols - 1) // cols
    vis_rows = 2.55
    scroll = max(0, rows_total - vis_rows) * (chh + gap + 22)
    gx, gy = 278, 186
    played = 2
    for i in range(n):
        r, c = divmod(i, cols)
        x = gx + c * (cw + gap)
        yy = gy + r * (chh + gap + 22) - scroll
        if yy < 20 or yy > H:
            continue
        new_ = i >= n - 2 and k >= 2
        s = 1 + .06 * pulse(t) if new_ else 1
        cover(d, x - (s - 1) * cw / 2, yy - (s - 1) * chh / 2, cw * s, chh * s, i, dim=False)
        # verschweißt: Folienglanz
        d.line([x + 6, yy + chh - 40, x + cw - 30, yy + 6], fill=(255, 255, 255), width=1)
        d.rectangle([x, yy + chh + 4, x + cw, yy + chh + 8], fill=card)
        if i < played:
            d.rectangle([x, yy + chh + 4, x + cw * (.3 if i else .12), yy + chh + 8], fill=hx("f0a030"))
        d.text((x, yy + chh + 11), "0 Std." if i >= played else ["2 Std.", "40 Min."][i], font=F("sans", 10), fill=muted)
        if new_:
            d.rounded_rectangle([x + cw - 34, yy + 6, x + cw - 6, yy + 22], radius=4, fill=hx("3fb950"))
            d.text((x + cw - 20, yy + 14), "NEU", font=F("sansb", 9), fill=(255, 255, 255), anchor="mm")
    d.rectangle([250, 44, W, 176], fill=base)
    d.text((gx, 158), f"UNGESPIELT · {n}", font=F("sansb", 12), fill=muted)
    if k >= 0:
        L = ls[k]
        f = F("sansx", 30)
        lines, _ = wrap_full(L, t, f, 660)
        for j, l in enumerate(lines[:2]):
            d.text((278, 62 + j * 38), l, font=f, fill=txt)
    # Fußleiste
    d.rectangle([250, H - 28, W, H], fill=panel)
    d.text((270, H - 14), f"{n} Spiele · {played} angefangen · 0 durchgespielt", font=F("sans", 12), fill=muted, anchor="lm")
    toast2(d, W, "Alter 29 · neu: eigenes Geld, keine Zeit", t - 131.0, y=H - 84, H=H, f=F("sansb", 14), bg=card, fg=txt)
    return im


# ================= Verse 3b: Papierwildnis =================
def wob(pts, t, seed, amp=1.2):
    r = rnd(seed, int(t * 8))
    return [(x + r.uniform(-amp, amp), y + r.uniform(-amp, amp)) for x, y in pts]


def meter(d, cx, cy, rad, f, col, glyph, t, seed):
    ink = hx("1a1410")
    d.ellipse([cx - rad - 3, cy - rad - 3, cx + rad + 3, cy + rad + 3], fill=ink)
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=hx("4a4030"))
    # füllt sich von unten
    h = int(2 * rad * clamp(f))
    if h > 0:
        m = Image.new("L", (rad * 2 + 1, rad * 2 + 1), 0)
        md = ImageDraw.Draw(m); md.ellipse([0, 0, rad * 2, rad * 2], fill=255)
        md.rectangle([0, 0, rad * 2, rad * 2 - h], fill=0)
        d._image.paste(col, (cx - rad, cy - rad), m)
    if glyph == 0:  # Aktentasche
        d.rectangle([cx - 9, cy - 5, cx + 9, cy + 8], outline=ink, width=2); d.arc([cx - 5, cy - 11, cx + 5, cy - 1], 180, 360, fill=ink, width=2)
    elif glyph == 1:  # zwei Köpfe
        d.ellipse([cx - 11, cy - 8, cx - 1, cy + 2], outline=ink, width=2); d.ellipse([cx + 1, cy - 8, cx + 11, cy + 2], outline=ink, width=2); d.arc([cx - 12, cy + 2, cx + 12, cy + 18], 180, 360, fill=ink, width=2)
    else:  # Mond
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], outline=ink, width=2); d.ellipse([cx - 3, cy - 11, cx + 13, cy + 5], fill=col if f > .5 else hx("4a4030"))


def scene_paper(t):
    W, H = 960, 540
    ls = SEC["v3b"]
    k = cur_line("v3b", t)
    paper, ink = hx("c8b48a"), hx("1a1410")
    energy = 1 - clamp((t - 151) / 9.5) * .82
    im, d = new(W, H, paper, aa=True)
    r = rnd("paper")
    for i in range(900):
        x, y = r.randrange(W), r.randrange(H)
        d.line([x, y, x + r.randrange(3, 14), y + r.randrange(-1, 2)], fill=mix(paper, hx("8a7a4a"), r.random() * .5))
    # Bäume als Scherenschnitt
    for i in range(9):
        x = 40 + i * 118 + rnd("tr", i).randrange(-30, 30)
        if 380 < x < 600:
            continue
        hgt = 150 + rnd("th", i).randrange(90)
        d.line(wob([(x, 400), (x + 4, 400 - hgt)], t, i, 1.5), fill=ink, width=7)
        for q in range(4):
            yy = 400 - hgt * (.45 + q * .14)
            s = 1 if q % 2 else -1
            d.line(wob([(x + 3, yy), (x + s * (46 - q * 6), yy - 30)], t, (i, q)), fill=ink, width=3)
        d.ellipse([x - 26, 396, x + 34, 408], fill=hx("8a7a4a"))
    # Feuer
    fx, fy = 480, 380
    fl = 26 * energy + 6 * abs(math.sin(t * 9))
    d.ellipse([fx - 46, fy - 4, fx + 46, fy + 14], fill=hx("8a7a4a"))
    d.line(wob([(fx - 26, fy + 6), (fx + 26, fy - 2)], t, "l1"), fill=ink, width=8); d.line(wob([(fx - 26, fy - 2), (fx + 26, fy + 6)], t, "l2"), fill=ink, width=8)
    d.polygon(wob([(fx - 16, fy - 2), (fx - 6, fy - fl * 1.2), (fx, fy - fl * .8), (fx + 6, fy - fl * 1.6), (fx + 16, fy - 2)], t, "fl", 2), fill=hx("d08a2a"), outline=ink)
    d.polygon(wob([(fx - 7, fy - 2), (fx, fy - fl * .8), (fx + 7, fy - 2)], t, "fl2", 1.5), fill=hx("e8c860"))
    # LUME als Papierfigur, dünne Glieder, dicke Kontur
    lx, ly = 400, 392
    sway = 3 * math.sin(t * 2)
    d.ellipse([lx - 26, ly - 2, lx + 26, ly + 10], fill=hx("8a7a4a"))
    d.line(wob([(lx - 6, ly - 46), (lx - 10, ly)], t, "a"), fill=ink, width=5); d.line(wob([(lx + 6, ly - 46), (lx + 10, ly)], t, "b"), fill=ink, width=5)
    d.polygon(wob([(lx - 18, ly - 96), (lx + 18, ly - 96), (lx + 22, ly - 40), (lx - 22, ly - 40)], t, "body"), fill=hx("b28fd6"), outline=ink)
    d.line(wob([(lx - 18, ly - 88), (lx - 32, ly - 50 + sway)], t, "c"), fill=ink, width=4); d.line(wob([(lx + 18, ly - 88), (lx + 34, ly - 56 - sway)], t, "dd"), fill=ink, width=4)
    hc = (lx + sway * .4, ly - 126)
    d.polygon(wob([(hc[0] - 34, hc[1] - 20), (hc[0] + 34, hc[1] - 20), (hc[0] + 40, hc[1] + 62), (hc[0] - 40, hc[1] + 62)], t, "hair"), fill=hx("9ad0f5"), outline=ink)
    d.ellipse([hc[0] - 26, hc[1] - 26, hc[0] + 26, hc[1] + 30], fill=hx("f0dcc0"), outline=ink, width=3)
    d.pieslice([hc[0] - 30, hc[1] - 34, hc[0] + 30, hc[1] + 22], 180, 360, fill=hx("9ad0f5"), outline=ink, width=3)
    for s in (-1, 1):
        d.ellipse([hc[0] + s * 12 - 9, hc[1] - 4, hc[0] + s * 12 + 9, hc[1] + 14], outline=hx("b88a1a"), width=3)
        lid = int(6 * (1 - energy))
        d.ellipse([hc[0] + s * 12 - 3, hc[1] + 2 + lid // 2, hc[0] + s * 12 + 3, hc[1] + 8], fill=ink)
    d.arc([hc[0] - 8, hc[1] + 16, hc[0] + 8, hc[1] + 26], 200, 340, fill=ink, width=2)
    # Dunkelheit kommt von außen
    dark = Image.new("RGB", (W, H), hx("14101c"))
    m = Image.new("L", (W // 4, H // 4), 0)
    md = ImageDraw.Draw(m)
    rad = (60 + 170 * energy) / 4 * (1 + .04 * math.sin(t * 9))
    for q in range(12):
        rr = rad * (1 + q * .09)
        md.ellipse([fx / 4 - 12 - rr * 1.5, fy / 4 - 14 - rr, fx / 4 - 12 + rr * 1.5, fy / 4 - 14 + rr], fill=int(255 * (q + 1) / 12) if False else 255 - q * 0)
    # weicher Rand: von innen nach außen dunkler
    m = Image.new("L", (W // 4, H // 4), 255)
    md = ImageDraw.Draw(m)
    for q in range(12, -1, -1):
        rr = rad * (1 + q * .1)
        md.ellipse([fx / 4 - 12 - rr * 1.5, fy / 4 - 14 - rr, fx / 4 - 12 + rr * 1.5, fy / 4 - 14 + rr], fill=int(235 * (1 - energy * .25) * q / 12))
    m = m.resize((W, H), Image.BILINEAR)
    im = Image.composite(dark, im, m)
    d = ImageDraw.Draw(im)
    # Augen im Dunkeln: Erwartungen
    if k >= 3:
        r2 = rnd("eyes")
        n = int(clamp((t - ls[3]["s"]) / 2.4) * 9)
        for i in range(n):
            ex, ey = r2.choice([r2.randrange(40, 240), r2.randrange(720, 920)]), r2.randrange(150, 330)
            bl = int(t * 3 + i) % 7 == 0
            if not bl:
                d.ellipse([ex, ey, ex + 10, ey + 5], fill=hx("e8c860")); d.ellipse([ex + 22, ey, ex + 32, ey + 5], fill=hx("e8c860"))
    # drei runde Anzeigen
    vals = [1.0, 1.0, 1.0]
    if k >= 0: vals[1] = 1 - .7 * ease((t - word_t(ls[0], "ab")) / 1.0)
    if k >= 1:
        vals[1] = lerp(vals[1], 1.0, ease((t - word_t(ls[1], "zu")) / .8)); vals[2] = 1 - .8 * ease((t - word_t(ls[1], "Ruhe")) / 1.0)
    cols = [hx("d08a2a"), hx("8ab06a"), hx("9ad0f5")]
    for i in range(3):
        meter(d, W - 190 + i * 62, 52, 23, vals[i], cols[i], i, t, i)
    # Energie als großer Ring
    cx, cy = W - 128, 128
    d.ellipse([cx - 34, cy - 34, cx + 34, cy + 34], fill=ink)
    d.pieslice([cx - 30, cy - 30, cx + 30, cy + 30], -90, -90 + 360 * energy, fill=hx("e8c860") if energy > .35 else hx("8a1e1e"))
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=ink)
    d.text((cx, cy), f"{int(energy * 100)}", font=F("serif", 15), fill=paper, anchor="mm")
    # Schrift
    f = F("serifi", 34)
    if k >= 0:
        L = ls[k]
        lines, nfull = wrap_full(L, t, f, 760)
        full = wrap(L["text"], f, 760)
        y0 = 452 if nfull > 1 else 470
        for j, l in enumerate(lines):
            x0 = W / 2 - f.getlength(full[j]) / 2
            d.text((x0 + 2, y0 + j * 38 + 2), l, font=f, fill=ink)
            d.text((x0, y0 + j * 38), l, font=f, fill=hx("f0e4c4"))
    toast2(d, W, "Alter 29 · neu: Erschöpfung", t - 151.0, y=176, H=H, f=F("serif", 16), bg=ink, fg=paper) if t < 154.4 else None
    return im


# ================= Bridge: der Kasten =================
def heart(d, x, y, s, col):
    for (dx, dy, w, h) in [(1, 0, 2, 1), (5, 0, 2, 1), (0, 1, 8, 3), (1, 4, 6, 1), (2, 5, 4, 1), (3, 6, 2, 1)]:
        d.rectangle([x + dx * s, y + dy * s, x + (dx + w) * s - 1, y + (dy + h) * s - 1], fill=col)


def scene_box(t):
    W, H = 640, 360
    ls = SEC["bridge"]
    k = cur_line("bridge", t)
    im, d = new(W, H, (0, 0, 0))
    f = F("uni", 16)
    f2 = F("uni", 32)
    white = (255, 255, 255)
    L0 = ls[0]
    # Kasten atmet: im ersten Teil Spielfeld, danach Textfeld
    wide = ease((t - ls[1]["s"] + .2) / .4)
    bw = lerp(440, 560, wide); bh = lerp(150, 120, wide)
    cx, cy = 320, lerp(150, 172, wide)
    box = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]
    # die drei Forderungen als Geschosse
    if k == 0:
        demands = [("Sei erfolgreich,", word_t(L0, "erfolgreich"), 0), ("sei gesellig,", word_t(L0, "gesellig"), 1), ("achte immer gut auf dich.", word_t(L0, "achte"), 2)]
        hxp = cx + 150 * math.sin(t * 2.3); hyp = cy + 44 * math.sin(t * 4.3 + 1)
        hit = False
        for s, ts, lane in demands:
            ts -= .35
            if t < ts:
                continue
            a = (t - ts) / 1.7
            w = f2.getlength(s)
            if lane == 0:
                x, y = lerp(W, -w, a), cy - 58
            elif lane == 1:
                x, y = lerp(-w, W, a), cy - 14
            else:
                x, y = lerp(W, -w, a * .9), cy + 30
            lay = Image.new("RGB", (W, H), (0, 0, 0)); ld = ImageDraw.Draw(lay); ld.fontmode = "1"
            ld.text((x, y), s, font=f2, fill=white)
            bb = (int(box[0]) + 4, int(y), int(box[2]) - 3, int(y) + 36)
            im.paste(lay.crop(bb), bb[:2])
            if x < hxp < x + w and y < hyp + 6 < y + 34 and box[0] < hxp < box[2]:
                hit = True
        d.rectangle(box, outline=white, width=4)
        heart(d, int(hxp) - 8, int(hyp) - 7, 2, (255, 255, 255) if hit and int(t * 20) % 2 else hx("ff2020"))
    else:
        d.rectangle(box, fill=(0, 0, 0), outline=white, width=4)
        y = box[1] + 14
        L = ls[k]
        lines, _ = wrap_full(L, t, f2, bw - 80)
        d.text((box[0] + 20, y), "*", font=f2, fill=white)
        for j, l in enumerate(lines[:3]):
            d.text((box[0] + 52, y + j * 34), l, font=f2, fill=white)
    # Name, Stufe, Kraft
    hp = 1 - clamp((t - 162.7) / 10.9) * .8
    yb = 250
    d.text((70, yb), "LUME   ST 29", font=f, fill=white)
    d.text((250, yb), "KRAFT", font=f, fill=white)
    d.rectangle([304, yb + 1, 404, yb + 15], fill=hx("c01010")); d.rectangle([304, yb + 1, 304 + int(100 * hp), yb + 15], fill=hx("ffe020"))
    d.text((414, yb), f"{int(hp * 100):3d} / 100", font=f, fill=white)
    # drei Knöpfe, jeder will 100 Prozent
    orange, yellow = hx("ff7f27"), hx("ffff40")
    L3 = ls[3]
    full3 = k >= 3 and t >= word_t(L3, "hundert")
    sel = int(beat_phase(t)) % 3
    for i, lab in enumerate(["ARBEIT", "FREUNDE", "ICH"]):
        x0 = 70 + i * 176
        c = yellow if (i == sel or full3) else orange
        d.rectangle([x0, 286, x0 + 148, 328], outline=c, width=3)
        d.text((x0 + 86, 299), lab, font=f, fill=c, anchor="mt")
        heart(d, x0 + 14, 300, 2, hx("ff2020")) if (i == sel and not full3) else None
        if full3:
            d.text((x0 + 14, 299), "100%", font=f, fill=yellow)
    if t < 166.0:
        s = "Alter 29 · neu: Zweifel"
        a = ease((t - 162.7) / .3) * (1 - ease((t - 165.6) / .3))
        d.text((W - 20, int(lerp(-20, 12, a))), s, font=f, fill=hx("808080"), anchor="ra")
    return im


# ================= Nachklang und Outro =================
def scene_echo(t):
    """Die Würfelwelt bleibt stehen, die Sonne geht unter."""
    return scene_hook_voxel(min(t, 196.0) if False else t, "hook3")


NIGHT = dict(sky1=hx("101638"), sky2=hx("3a2f6a"), hill=hx("1a2a4a"), grass=hx("24486a"), grass2=hx("1e3c5c"), box=hx("1c2a7a"), box2=hx("2a3c9a"),
             frame=hx("e9c979"), txt=hx("f4f0ff"))


def scene_outro(t):
    W, H = 384, 216
    ls = SEC["outro"]
    k = cur_line("outro", t)
    N = NIGHT
    im, d = new(W, H)
    for y in range(120):
        d.line([0, y, W, y], fill=mix(N["sky1"], N["sky2"], y / 120))
    r = rnd("ost")
    for i in range(90):
        x, y = r.randrange(W), r.randrange(110)
        tw = .5 + .5 * math.sin(t * (1 + r.random() * 2) + i)
        d.point((x, y), fill=mix(N["sky1"], (255, 255, 255), .3 + .6 * tw * r.random()))
    d.ellipse([220, 18, 242, 40], fill=hx("fff4c8")); d.ellipse([214, 14, 234, 34], fill=mix(N["sky1"], N["sky2"], .2))
    pts = [(0, 130)] + [(x, 104 + 12 * math.sin(x * .017) + 6 * math.sin(x * .05)) for x in range(0, W + 8, 8)] + [(W, 130)]
    d.polygon(pts, fill=N["hill"])
    for ty in range(112, H, 16):
        for tx in range(0, W, 16):
            rr = rnd(tx, ty, 21)
            d.rectangle([tx, ty, tx + 15, ty + 15], fill=N["grass"] if rr.random() < .7 else N["grass2"])
            if rr.random() < .2:
                d.line([tx + 5, ty + 10, tx + 6, ty + 6], fill=hx("3a6a8a"))
    # Baum, Speicherpunkt, LUME sitzt mit der Handkonsole
    d.rectangle([84, 96, 93, 140], fill=hx("3a2a3a")); d.ellipse([56, 56, 122, 108], fill=hx("1e3a4a"), outline=hx("14283a"))
    sx, sy = 250, 142
    glow = .6 + .4 * math.sin(t * 2.2)
    for q in range(4, 0, -1):
        d.ellipse([sx - q * 7, sy - q * 4 - 8, sx + q * 7, sy + q * 4 - 8], fill=mix(N["grass"], hx("ffe9a0"), .12 * (5 - q) * glow))
    d.polygon([(sx, sy - 22), (sx + 6, sy - 10), (sx, sy + 2), (sx - 6, sy - 10)], fill=hx("ffe9a0"), outline=hx("e9b949"))
    lx, ly = 190, 152
    pal = {kk: mix(v, hx("20305a"), .1) for kk, v in PAL_LUME.items()}
    rows = LUME_ROWS[:12] + ["..ollllllo..", ".offllllffo.", "............", "............"]
    sprite(d, lx, ly + 4, pal, s=2, rows=rows)
    d.rectangle([lx - 6, ly - 14, lx + 5, ly - 8], fill=hx("3a3f6a"), outline=hx("14183a")); d.rectangle([lx - 3, ly - 13, lx + 2, ly - 10], fill=mix(hx("9ad0f5"), (255, 255, 255), .3 * glow))
    # Falter
    bx = lx + 40 + 22 * math.sin(t * .9); by = ly - 50 + 12 * math.sin(t * 1.7)
    fl = int(t * 8) % 2
    d.point((bx, by), fill=hx("ffe9a0")); d.rectangle([bx - 2 - fl, by - 2, bx - 1, by], fill=hx("9ad0f5")); d.rectangle([bx + 1, by - 2, bx + 2 + fl, by], fill=hx("9ad0f5"))
    # freie Stunden als Zähler
    fu = F("uni", 16)
    if k >= 2:
        L2 = ls[2]
        n = 1 + min(2, int(max(0, t - word_t(L2, "zähl")) * 1.2))
        d.rectangle([W - 104, 6, W - 6, 26], fill=N["box"], outline=N["frame"])
        for i in range(3):
            c = hx("ffe9a0") if i < n else hx("0c1440")
            d.rectangle([W - 98 + i * 12, 11, W - 90 + i * 12, 21], fill=c, outline=N["frame"])
        d.text((W - 12, 8), "Std.", font=fu, fill=N["txt"], anchor="ra")
    # Textkasten wie in ihrem Rollenspiel
    if k >= 0 and t < 226.2:
        by0 = H - 58
        d.rectangle([6, by0, W - 7, H - 5], fill=N["box"], outline=N["frame"])
        d.rectangle([8, by0 + 2, W - 9, H - 7], outline=N["box2"])
        d.rectangle([10, by0 - 11, 50, by0 + 3], fill=N["box"], outline=N["frame"])
        d.text((30, by0 - 4), "LUME", font=F("dvb", 9), fill=N["frame"], anchor="mm")
        pp = dict(PAL_LUME); pp["bg"] = hx("3a2f6a")
        portrait(d, 14, by0 + 9, 2, pp, mood=1 if int(t * .7) % 5 == 0 else 0)
        L = ls[k]
        prev = ls[k - 1] if k % 2 == 1 else None
        y = by0 + 8
        if prev:
            d.text((54, y), prev["text"], font=fu, fill=mix(N["txt"], N["box"], .35)); y += 18
        d.text((54, y), shown(L, t), font=fu, fill=N["txt"])
        if k == 5 and t > L["e"] + .6:
            d.text((W - 60, H - 24), "gespeichert", font=F("dv", 8), fill=N["frame"], anchor="rm") if False else None
    # Abspann
    if t > 224.6:
        a = ease((t - 224.6) / 1.2)
        ov = Image.new("RGB", (W, H), hx("0a0e24"))
        im = Image.blend(im, ov, .72 * a)
        d = ImageDraw.Draw(im); d.fontmode = "1"
        if a > .5:
            text(d, (W // 2, 36), "DREI VON DREI · LUME · 2026", fu, hx("ffe9a0"), anchor="mt")
            for j, s in enumerate(["Musik und Figurenbilder KI-gestützt", "Apps und Marken im Bild sind erfunden", "", "Kacheln und Figuren im Code gebaut", "", "Spielstand: zwei von drei. Reicht für heute."]):
                text(d, (W // 2, 66 + j * 18), s, fu, N["txt"] if j < 5 else hx("9ad0f5"), anchor="mt")
    return im
