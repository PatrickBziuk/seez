"""Die Hook als wiederkehrende Ansicht (Fabrik, Hexkarte, Würfelwelt) sowie Hof, Blockwelt, Zeichenfestung."""
from core import *
from s1 import cube, toast2

LABELS = ["ARBEIT", "FREUNDE", "ZEIT FÜR MICH"]


def hook_state(sec, t, base=((240, 98), (112, 204), (368, 204))):
    """Gemeinsame Logik: drei Ecken, zwei sind versorgt, eine bleibt leer."""
    ls = SEC[sec]
    k = cur_line(sec, t)
    b = int(beat_phase(t) - beat_phase(ls[0]["s"]))
    starved = (b // 4) % 3  # wandert alle vier Schläge
    W, H = 480, 270
    pos = [list(p) for p in base]
    # "Schieb ich eine näher ran, rutscht die nächste aus dem Bild"
    L = ls[2]
    f1 = ease((t - L["s"]) / 0.9) * (1 - ease((t - ls[3]["s"] - 0.4) / 1.2))
    f2 = ease((t - word_t(L, "rutscht")) / 0.8) * (1 - ease((t - ls[3]["s"] - 0.4) / 1.2))
    pos[1][0] += 70 * f1; pos[1][1] -= 50 * f1
    pos[2][0] += 190 * f2; pos[2][1] += 40 * f2
    calm = 0.0
    if sec == "hook3":  # am Ende darf eine Ecke ruhen
        calm = ease((t - ls[5]["s"]) / 2.0)
        if calm > 0.5:
            starved = 2
    lit = [0 if i == starved else 1 for i in range(3)]
    # Die Ecken werden erst genannt, dann gezeigt
    L1 = ls[1]
    vis = [1, 1, 1]
    if k < 1:
        vis = [0, 0, 0]
    elif k == 1:
        vis = [t >= word_t(L1, "Arbeit"), t >= word_t(L1, "Freunde"), t >= word_t(L1, "Zeit")]
    return dict(ls=ls, k=k, pos=pos, lit=lit, starved=starved, vis=vis, calm=calm, b=b)


def lyric_block(d, st, t, font, x, y, w, fill, shadow=None, lh=None, anchor="m", bg=None, pad=6, dim=None):
    k = st["k"]
    if k < 0:
        return
    L = st["ls"][k]
    lines, nfull = wrap_full(L, t, font, w)
    lh = lh or font.size + 4
    if bg is not None:
        full = wrap(L["text"], font, w)
        mw = max(font.getlength(l) for l in full)
        d.rectangle([x - mw / 2 - pad, y - pad, x + mw / 2 + pad, y + nfull * lh + pad - 2], fill=bg[0], outline=bg[1])
    full = wrap(L["text"], font, w)
    for j, l in enumerate(lines):
        x0 = x - font.getlength(full[j]) / 2
        if shadow is not None:
            d.text((x0 + 1, y + j * lh + 1), l, font=font, fill=shadow)
        d.text((x0, y + j * lh), l, font=font, fill=fill)


# ================= Hook 1: Fabrik =================
def belt(d, a, b, t, col, on=True, w=8):
    ax, ay = a; bx, by = b
    L = math.hypot(bx - ax, by - ay)
    if L < 1:
        return
    ux, uy = (bx - ax) / L, (by - ay) / L
    nx, ny = -uy, ux
    d.line([ax, ay, bx, by], fill=hx("2a2a2a"), width=w + 2)
    d.line([ax, ay, bx, by], fill=hx("55524c"), width=w)
    sp = 26 if on else 0
    off = (t * sp) % 10
    n = int(L // 10) + 1
    for i in range(n):
        s = i * 10 + off
        if s > L - 2:
            continue
        cx, cy = ax + ux * s, ay + uy * s
        d.line([cx - ux * 2 + nx * 3, cy - uy * 2 + ny * 3, cx + ux * 2, cy + uy * 2], fill=col)
        d.line([cx - ux * 2 - nx * 3, cy - uy * 2 - ny * 3, cx + ux * 2, cy + uy * 2], fill=col)
    if on:
        for i in range(int(L // 22)):
            s = (i * 22 + t * sp) % L
            cx, cy = ax + ux * s, ay + uy * s
            d.rectangle([cx - 2, cy - 2, cx + 2, cy + 2], fill=hx("ffe9a0"), outline=hx("3a2a10"))


def scene_hook_factory(t):
    W, H = 480, 270
    st = hook_state("hook1", t)
    im, d = new(W, H, hx("3b3226"))
    r = rnd("dirt")
    for i in range(700):
        x, y = r.randrange(W), r.randrange(H)
        d.point((x, y), fill=mix(hx("3b3226"), hx("5a4a38"), r.random()))
    for (ox, oy, c) in [(40, 60, "8a5a3a"), (420, 90, "6a7a8a"), (60, 230, "b08a4a")]:
        for i in range(60):
            a, rr = r.random() * 6.28, r.random() * 26
            d.point((ox + rr * math.cos(a), oy + rr * math.sin(a) * .6), fill=hx(c))
    P = st["pos"]
    src = (240, 166)
    # Strommasten und Leitung
    for i in range(3):
        if st["vis"][i]:
            belt(d, src, P[i], t, hx("e3b23c"), on=st["lit"][i])
    # Quelle: "ich"
    d.rectangle([src[0] - 13, src[1] - 13, src[0] + 13, src[1] + 13], fill=hx("6e6e6e"), outline=hx("1e1e1e"))
    d.rectangle([src[0] - 10, src[1] - 10, src[0] + 10, src[1] + 10], fill=hx("313031"))
    sprite(d, src[0], src[1] + 8, PAL_LUME, s=1)
    for i in range(3):
        if not st["vis"][i]:
            continue
        x, y = P[i]
        on = st["lit"][i]
        p = pulse(t) if on else 0
        body = hx("6e6e6e") if on else hx("4a4644")
        d.rectangle([x - 22, y - 16, x + 22, y + 20], fill=hx("2a2a2a"))
        d.rectangle([x - 22, y - 20, x + 22, y + 16], fill=body, outline=hx("1e1e1e"))
        d.rectangle([x - 16, y - 14, x + 16, y + 6], fill=hx("313031"), outline=hx("1e1e1e"))
        # eigenes Zeichen je Ecke
        ic = [hx("f08a24"), hx("5fae7a"), hx("9ad0f5")][i] if on else hx("5a5654")
        if i == 0:
            d.rectangle([x - 8, y - 8, x + 8, y + 2], fill=ic); d.rectangle([x - 3, y - 11, x + 3, y - 8], outline=ic)
        elif i == 1:
            d.ellipse([x - 10, y - 10, x - 2, y - 2], fill=ic); d.ellipse([x + 2, y - 10, x + 10, y - 2], fill=ic); d.rectangle([x - 10, y - 1, x + 10, y + 3], fill=ic)
        else:
            d.ellipse([x - 8, y - 11, x + 8, y + 5], outline=ic, width=2); d.line([x, y - 3, x, y - 8], fill=ic); d.line([x, y - 3, x + 4, y - 1], fill=ic)
        d.rectangle([x - 16, y + 9, x + 16, y + 12], fill=hx("1e1e1e"))
        d.rectangle([x - 16, y + 9, x - 16 + int(32 * ((t * 1.3 + i * .3) % 1)) if on else x - 16, y + 12], fill=hx("6bd425") if on else hx("1e1e1e"))
        lamp = hx("6bd425") if on else (hx("e03c31") if int(t * 4) % 2 else hx("601810"))
        d.ellipse([x + 15 - 2, y - 19, x + 15 + 3, y - 14], fill=lamp)
        if on and p > .3:
            d.ellipse([x - 20, y - 30 - p * 4, x - 14, y - 24 - p * 4], fill=hx("8a8680"))
        f = F("dvb", 10)
        w = f.getlength(LABELS[i])
        d.rectangle([x - w / 2 - 3, y + 23, x + w / 2 + 3, y + 36], fill=hx("313031"), outline=hx("f08a24") if on else hx("7a3028"))
        d.text((x, y + 30), LABELS[i], font=f, fill=hx("ffe9a0") if on else hx("b06058"), anchor="mm")
    # Leiste unten
    qx = 150
    d.rectangle([qx - 4, H - 30, qx + 184, H - 2], fill=hx("313031"), outline=hx("1e1e1e"))
    for i in range(10):
        d.rectangle([qx + i * 18, H - 27, qx + i * 18 + 16, H - 6], fill=hx("1e1e1e"), outline=hx("4a4a4a"))
        if i < 3:
            c = [hx("f08a24"), hx("5fae7a"), hx("9ad0f5")][i]
            d.rectangle([qx + i * 18 + 4, H - 22, qx + i * 18 + 12, H - 12], fill=c)
    n_ok = sum(l and v for l, v in zip(st["lit"], st["vis"]))
    d.rectangle([W - 76, 4, W - 4, 56], fill=hx("313031"), outline=hx("1e1e1e"))
    for i in range(3):
        if st["vis"][i]:
            bx, by = W - 76 + (st["pos"][i][0]) * 72 / 480, 4 + st["pos"][i][1] * 52 / 270
            d.rectangle([bx - 2, by - 2, bx + 2, by + 2], fill=hx("6bd425") if st["lit"][i] else hx("e03c31"))
    d.text((W - 40, 64), f"{n_ok} von 3", font=F("dvb", 10), fill=hx("f08a24"), anchor="mm")
    lyric_block(d, st, t, F("sansx", 17), 240, 8, 330, (255, 255, 255), bg=(hx("313031"), hx("f08a24")), lh=20)
    toast2(d, W, "Alter 22 · neu: Fließband", t - 49.0, y=H - 58, H=H, f=F("dvb", 10))
    return im


# ================= Hook 2: Hexkarte =================
def hexpts(cx, cy, r):
    return [(cx + r * math.cos(math.radians(60 * i - 30)), cy + r * math.sin(math.radians(60 * i - 30)) * .9) for i in range(6)]


def scene_hook_hex(t):
    W, H = 480, 270
    st = hook_state("hook2", t)
    im, d = new(W, H, hx("1e4e7a"), aa=True)
    R = 15
    P = st["pos"]
    for row in range(-1, 13):
        for col in range(-1, 20):
            cx = col * R * 1.732 + (R * .866 if row % 2 else 0)
            cy = row * R * 1.35
            r = rnd(row, col, 7)
            land = math.hypot((cx - 240) / 1.5, cy - 135) < 118 + 30 * math.sin(col * 1.3 + row)
            if land:
                v = r.random()
                c = hx("6e9a3a") if v < .55 else hx("b8a35a") if v < .8 else hx("8c7a4a")
            else:
                c = hx("3d82a8") if math.hypot((cx - 240) / 1.5, cy - 135) < 150 else hx("1e4e7a")
            own = None
            for i in range(3):
                rad = (52 if st["lit"][i] else 22) * (1 if st["vis"][i] else 0)
                if math.hypot(cx - P[i][0], cy - P[i][1]) < rad:
                    own = i
            if own is not None and land:
                c = mix(c, [hx("e0a030"), hx("50c070"), hx("70b0f0")][own], .28)
            d.polygon(hexpts(cx, cy, R), fill=c, outline=mix(c, (0, 0, 0), .22))
            if land and v > .86:
                d.polygon([(cx - 6, cy + 4), (cx, cy - 6), (cx + 6, cy + 4)], fill=hx("7a6a4a"), outline=hx("4a3f2a"))
            elif land and v < .12:
                d.ellipse([cx - 5, cy - 5, cx + 1, cy + 1], fill=hx("3f6a2a")); d.ellipse([cx, cy - 2, cx + 6, cy + 4], fill=hx("3f6a2a"))
    # Einheit "ich" pendelt zwischen den versorgten Ecken
    tgt = [P[i] for i in range(3) if st["lit"][i]]
    ph = (math.sin(beat_phase(t) * math.pi / 2) + 1) / 2
    ux, uy = lerp(tgt[0][0], tgt[1][0], ph), lerp(tgt[0][1], tgt[1][1], ph)
    if st["k"] >= 1:
        d.ellipse([ux - 9, uy - 9, ux + 9, uy + 9], fill=hx("10202c"), outline=hx("c8a250"), width=2)
        sprite(d, int(ux), int(uy) + 7, PAL_LUME, s=1)
    brass, pan = hx("c8a250"), hx("10202c")
    f = F("sansb", 10)
    for i in range(3):
        if not st["vis"][i]:
            continue
        x, y = P[i]
        on = st["lit"][i]
        col = [hx("e0a030"), hx("50c070"), hx("70b0f0")][i]
        for j, (dx, dz) in enumerate([(-8, 10), (0, 16), (8, 8)]):
            c = mix(hx("d8d0c0"), (0, 0, 0), 0 if on else .45)
            d.rectangle([x + dx - 4, y - dz, x + dx + 4, y + 2], fill=c, outline=hx("3a3a3a"))
            if on and (int(t * 2) + j) % 3:
                d.point((x + dx, y - dz + 4), fill=hx("ffe080"))
        w = f.getlength(LABELS[i]) + 34
        bx, by = x - w / 2, y - 36
        d.rounded_rectangle([bx, by, bx + w, by + 14], radius=7, fill=col if on else hx("4a4f55"), outline=pan)
        d.ellipse([bx + 1, by + 1, bx + 13, by + 13], fill=pan)
        d.text((bx + 7, by + 7), str(8 if on else 1), font=f, fill=(255, 255, 255), anchor="mm")
        d.text((bx + w / 2 + 4, by + 7), LABELS[i], font=f, fill=pan if on else hx("b0b4b8"), anchor="mm")
        if not on:
            d.text((x, y + 12), "hungert", font=F("sans", 9), fill=hx("ff8070"), anchor="mm")
    # Kopfleiste
    d.rectangle([0, 0, W, 13], fill=pan); d.line([0, 13, W, 13], fill=brass)
    fs = F("sans", 9)
    ys = [("ARBEIT", hx("e0a030")), ("FREUNDE", hx("50c070")), ("ZEIT", hx("70b0f0"))]
    for i, (n, c) in enumerate(ys):
        v = "+12" if st["lit"][i] else "−4"
        d.ellipse([8 + i * 78, 3, 15 + i * 78, 10], fill=c)
        d.text((19 + i * 78, 7), f"{n} {v}", font=fs, fill=c if st["lit"][i] else hx("ff8070"), anchor="lm")
    turn = 300 + st["b"]
    d.text((W - 6, 7), f"RUNDE {turn}  ·  2026 n. Chr.", font=fs, fill=brass, anchor="rm")
    # Runde beenden
    d.ellipse([W - 62, H - 62, W - 6, H - 6], fill=pan, outline=brass, width=2)
    d.text((W - 34, H - 38), "NÄCHSTE", font=F("sansb", 8), fill=brass, anchor="mm")
    d.text((W - 34, H - 28), "RUNDE", font=F("sansb", 8), fill=brass, anchor="mm")
    # Textband
    k = st["k"]
    if k >= 0:
        d.rectangle([64, H - 52, W - 74, H - 6], fill=pan, outline=brass)
        d.line([68, H - 48, W - 78, H - 48], fill=brass); d.line([68, H - 10, W - 78, H - 10], fill=brass)
        lyric_block(d, st, t, F("sansb", 15), (64 + W - 74) // 2, H - 45, 320, hx("f4e8c8"), lh=17)
    toast2(d, W, "Alter 28 · neu: Rundenplanung", t - 108.7, y=20, H=H, f=F("sansb", 10), bg=pan, fg=brass)
    return im


# ================= Hook 3: Würfelwelt =================
def island(d, x, y, on, kind, t, sink=0.0):
    g_t, g_l, g_r = hx("6aaa40"), hx("866043"), hx("6a4a32")
    if not on:
        g_t, g_l, g_r = mix(g_t, hx("505860"), .6), mix(g_l, hx("404850"), .6), mix(g_r, hx("303840"), .6)
    y = y + int(sink)
    for (dx, dy, z) in [(0, -16, 0), (-16, -8, 0), (16, -8, 0), (0, 0, 0), (-32, 0, 0), (32, 0, 0), (-16, 8, 0), (16, 8, 0), (0, 16, 0)]:
        cube(d, x + dx, y + dy - 8, 32, 32, 10, g_t, g_l, g_r, outline=mix(g_l, (0, 0, 0), .4))
    for (dx, dy) in [(0, 26), (-16, 18), (16, 18)]:
        cube(d, x + dx, y + dy - 8, 32, 32, 8, g_l, mix(g_l, (0, 0, 0), .2), mix(g_r, (0, 0, 0), .2))
    dim = (lambda c: c) if on else (lambda c: mix(c, hx("404850"), .6))
    if kind == 0:  # Ofen-Turm
        for z in (0, 12, 24):
            cube(d, x, y - 24 - z, 24, 24, 12, dim(hx("9a9a9a")), dim(hx("7d7d7d")), dim(hx("5d5d5d")), outline=hx("3a3a3a"))
        if on:
            d.rectangle([x - 8, y - 20, x - 3, y - 15], fill=hx("ff9a2a") if int(t * 6) % 2 else hx("ffd060"))
    elif kind == 1:  # Lagerfeuer mit Sitzklötzen
        for dx, dy in [(-20, -6), (20, -6), (0, 6)]:
            cube(d, x + dx, y + dy - 14, 12, 12, 6, dim(hx("8a6a43")), dim(hx("6b5233")), dim(hx("4b3a23")))
        if on:
            fl = int(4 * abs(math.sin(t * 9)))
            d.polygon([(x - 5, y - 6), (x, y - 16 - fl), (x + 5, y - 6)], fill=hx("ff9a2a")); d.polygon([(x - 2, y - 6), (x, y - 11 - fl), (x + 2, y - 6)], fill=hx("ffe080"))
        else:
            d.rectangle([x - 4, y - 9, x + 4, y - 6], fill=hx("3a3a3a"))
    else:  # Baum und Bett
        cube(d, x - 12, y - 30, 10, 10, 20, dim(hx("7b6243")), dim(hx("6b5233")), dim(hx("4b3a23")))
        for dz in (0, 10):
            cube(d, x - 12, y - 56 - dz + (4 if dz else 0), 30 - dz, 30, 12, dim(hx("4f9a3a")), dim(hx("3f7a2a")), dim(hx("2f5a1a")))
        cube(d, x + 14, y - 12, 18, 18, 5, dim(hx("d9b8ef")), dim(hx("b28fd6")), dim(hx("8a6fb0")))


def scene_hook_voxel(t, sec="hook3"):
    W, H = 480, 270
    st = hook_state(sec, t, base=((240, 104), (104, 176), (376, 176)))
    ls = st["ls"]
    dusk = clamp((t - ls[4]["s"]) / 14.0)
    late = ease((t - 197.5) / 7.5)
    top = mix(mix(hx("7ba4ff"), hx("3a3f7a"), dusk), hx("101638"), late)
    bot = mix(mix(hx("cfe3ff"), hx("ffae6a"), dusk), hx("3a2f6a"), late)
    im, d = new(W, H)
    for y in range(H):
        d.line([0, y, W, y], fill=mix(top, bot, y / H))
    sx, sy = 380 - dusk * 40, 40 + dusk * 150 + late * 120
    d.rectangle([sx - 14, sy - 14, sx + 14, sy + 14], fill=mix(hx("fff8c0"), hx("ffb060"), dusk))
    for i in range(5):
        cx = (i * 130 + t * 5) % (W + 120) - 60
        cy = 58 + (i * 37) % 70
        d.rectangle([cx, cy, cx + 50, cy + 8], fill=mix((255, 255, 255), bot, .3)); d.rectangle([cx + 12, cy - 6, cx + 38, cy], fill=mix((255, 255, 255), bot, .3))
    P = st["pos"]
    calm = st["calm"]
    order = sorted(range(3), key=lambda i: P[i][1])
    lume_at = [i for i in range(3) if st["lit"][i]]
    ph = (math.sin(beat_phase(t) * math.pi / 2) + 1) / 2
    for i in order:
        if not st["vis"][i]:
            continue
        x, y = P[i]
        x = lerp(x, 240 + (x - 240) * .78, calm); y = lerp(y, 140 + (y - 140) * .8, calm)
        on = st["lit"][i]
        resting = (not on) and calm > .5
        sink = 0 if on or resting else 6 + 3 * math.sin(t * 5)
        bob = 2 * math.sin(t * 1.4 + i * 2)
        island(d, int(x), int(y + bob), on or resting, i, t, sink)
        f = F("uni", 16)
        lab = LABELS[i]
        text(d, (x, y + 46 + bob), lab, f, (255, 255, 255) if on else (hx("ffe9a0") if resting else hx("c0c8d0")), shadow=hx("3f3f3f"), anchor="mt")
        if resting:
            for q in range(3):
                a = (t * .5 + q * .33) % 1
                text(d, (x + 26 + a * 14, y - 30 - a * 26), "z", F("uni", 16), mix((255, 255, 255), top, a), anchor="mm")
    if st["k"] >= 1 and len(lume_at) >= 2:
        a, b = P[lume_at[0]], P[lume_at[1]]
        if calm > .5:
            ph = 0.5 + 0.5 * math.sin(t * .8) * (1 - calm) if False else ph * (1 - calm) + .5 * calm
        ux, uy = lerp(a[0], b[0], ph), lerp(a[1], b[1], ph) - 30 * math.sin(ph * math.pi) * (1 - calm)
        ux = lerp(ux, 240 + (ux - 240) * .78, calm)
        sprite(d, int(ux), int(uy) - 4, PAL_LUME, s=2, frame=0 if calm > .8 else 1 + int(t * 6) % 2)
    # Herzen und Leiste
    hbx = 150
    d.rectangle([hbx - 2, H - 24, hbx + 182, H - 2], fill=hx("8b8b8b"), outline=hx("202020"))
    for i in range(9):
        d.rectangle([hbx + i * 20, H - 22, hbx + i * 20 + 19, H - 4], fill=hx("6a6a6a"), outline=hx("373737"))
    sel = st["starved"] if calm < .5 else 2
    for i in range(3):
        c = [hx("9a9a9a"), hx("ff9a2a"), hx("d9b8ef")][i]
        d.rectangle([hbx + i * 20 + 5, H - 17, hbx + i * 20 + 14, H - 8], fill=c, outline=mix(c, (0, 0, 0), .4))
    lit2 = [i for i in range(3) if st["lit"][i]]
    for i in lit2:
        d.rectangle([hbx + i * 20 - 1, H - 23, hbx + i * 20 + 20, H - 3], outline=(255, 255, 255))
    full = 6 + int(4 * calm)
    for i in range(10):
        hx0 = hbx + i * 9
        c = hx("e0303a") if i < full else hx("402024")
        d.rectangle([hx0 + 1, H - 34, hx0 + 3, H - 32], fill=c); d.rectangle([hx0 + 5, H - 34, hx0 + 7, H - 32], fill=c)
        d.rectangle([hx0, H - 33, hx0 + 8, H - 30], fill=c); d.rectangle([hx0 + 2, H - 30, hx0 + 6, H - 28], fill=c); d.point((hx0 + 4, H - 27), fill=c)
    lyric_block(d, st, t, F("uni", 16), 240, 6, 400, (255, 255, 255), shadow=hx("3f3f3f"), lh=17)
    if sec == "hook3":
        toast2(d, W, "Alter 29 · neu: dritte Dimension", t - 174.0, y=46, H=H, f=F("uni", 16), bg=hx("202020"), fg=(255, 255, 255))
    return im


# ================= Verse 2a: Hof und Dorf =================
PARCH, INK, WOOD = hx("f6d78c"), hx("4a2a12"), hx("b5651d")


def wood_box(d, box, fill=PARCH):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=4, fill=hx("6a3a12"))
    d.rounded_rectangle([x0 + 1, y0 + 1, x1 - 1, y1 - 1], radius=3, fill=WOOD)
    d.rectangle([x0 + 4, y0 + 4, x1 - 4, y1 - 4], fill=fill, outline=hx("8a4a16"))


def house(d, x, y, wall, roof, open_=False, light=False):
    d.rectangle([x, y, x + 47, y + 30], fill=wall, outline=INK)
    d.polygon([(x - 4, y + 2), (x + 8, y - 16), (x + 39, y - 16), (x + 51, y + 2)], fill=roof, outline=INK)
    for i in range(3):
        d.line([x - 2 + i * 2, y - 2 - i * 5, x + 49 - i * 2, y - 2 - i * 5], fill=mix(roof, (0, 0, 0), .25))
    d.rectangle([x + 18, y + 12, x + 29, y + 30], fill=hx("2a1a10") if open_ else hx("7a4a26"), outline=INK)
    d.rectangle([x + 5, y + 10, x + 13, y + 18], fill=hx("ffe9a0") if light else hx("7aa8d0"), outline=INK)
    d.rectangle([x + 34, y + 10, x + 42, y + 18], fill=hx("ffe9a0") if light else hx("7aa8d0"), outline=INK)
    d.point((x + 31, y + 16), fill=hx("ffe080"))


def scene_farm(t):
    W, H = 384, 216
    ls = SEC["v2a"]
    k = cur_line("v2a", t)
    im, d = new(W, H, hx("6daa2c"))
    for ty in range(0, H, 16):
        for tx in range(0, W, 16):
            r = rnd(tx, ty, 11)
            v = r.random()
            if v < .25:
                d.rectangle([tx, ty, tx + 15, ty + 15], fill=hx("62a028"))
            if v > .82:
                d.line([tx + 4, ty + 10, tx + 5, ty + 6], fill=hx("3e7a2a")); d.line([tx + 8, ty + 11, tx + 10, ty + 7], fill=hx("3e7a2a"))
            if v > .97:
                d.rectangle([tx + 6, ty + 5, tx + 7, ty + 6], fill=hx("ffd0e0"))
    d.rectangle([0, 96, W, 119], fill=hx("d9b877"))
    for i in range(60):
        r = rnd("p", i)
        d.point((r.randrange(W), 97 + r.randrange(22)), fill=hx("b89858"))
    hs = [(40, 58, hx("e8d8b8"), hx("b8483c")), (150, 58, hx("d8e0e8"), hx("4878a8")), (262, 58, hx("e8e0c8"), hx("6a9a4a"))]
    early = t < ls[1]["s"]
    tk = word_t(ls[0], "geklingelt")
    ti = word_t(ls[0], "irgendwer")
    for i, (x, y, wc, rc) in enumerate(hs):
        op = early and t > ti + i * .12
        house(d, x, y, wc, rc, open_=op, light=early)
        if op:
            fy = int(lerp(y + 30, y + 44, ease((t - ti - i * .12) / .4)))
            sprite(d, x + 24, fy, pal_friend(i), s=1)
        # Zaun und Beet
        for q in range(4):
            d.rectangle([x + 54 + q * 7, y + 22, x + 56 + q * 7, y + 30], fill=hx("c8a070"), outline=INK)
    for q in range(6):
        d.rectangle([20 + q * 14, 140, 30 + q * 14, 150], fill=hx("5c3a1e"))
        d.line([25 + q * 14, 146, 25 + q * 14, 141 - (q % 3)], fill=hx("3e9a2a"))
    # LUME geht zur Tür und klingelt
    lx = int(lerp(-10, 174, ease((t - 78.6) / 2.4)))
    walking = t < 81.0
    sprite(d, lx, 112, PAL_LUME, s=1, frame=(1 + int(t * 7) % 2) if walking else 0)
    if tk <= t < tk + .8:
        for q in range(3):
            a = (t - tk) / .8
            d.arc([lx + 4 - q * 3 - a * 6, 84 - q * 3 - a * 6, lx + 16 + q * 3 + a * 6, 96 + q * 3 + a * 6], 280, 20, fill=hx("fff0a0"))
    # Abendtönung ab der zweiten Zeile
    if not early:
        tint = Image.new("RGB", (W, H), hx("ff9a4a"))
        im = Image.blend(im, tint, 0.22 * ease((t - ls[1]["s"]) / 1.5))
        d = ImageDraw.Draw(im); d.fontmode = "1"
    fu = F("uni", 16)
    # Kalenderbrett
    if k >= 1:
        a = ease((t - ls[1]["s"]) / .35)
        cx0, cy0 = 60, int(lerp(-140, 8, a))
        wood_box(d, [cx0, cy0, cx0 + 196, cy0 + 136])
        month = int(clamp((t - word_t(ls[1], "nächste")) / 1.0) * 6) if t > word_t(ls[1], "nächste") else 0
        mn = ["Frühling", "Frühling", "Sommer", "Sommer", "Herbst", "Herbst", "Winter"][month]
        d.text((cx0 + 98, cy0 + 8), mn, font=fu, fill=INK, anchor="mt")
        d.text((cx0 + 186, cy0 + 10), f"+{month} Mon." if month else "", font=F("dvb", 8), fill=hx("8a4a16"), anchor="rt")
        for i, wdn in enumerate(["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]):
            d.text((cx0 + 20 + i * 26, cy0 + 28), wdn, font=F("dvb", 8), fill=hx("8a4a16"), anchor="mt")
        marks = {}
        L2 = ls[2]
        if k >= 2:
            if t >= word_t(L2, "freitags"): marks[4] = hx("d9624f")
            if t >= word_t(L2, "samstags"): marks[5] = hx("9ad0f5")
            if t >= word_t(L2, "sieben"): marks[6] = hx("8a8a99")
        for row in range(4):
            for c in range(7):
                x, y = cx0 + 8 + c * 26, cy0 + 38 + row * 23
                d.rectangle([x, y, x + 24, y + 21], fill=hx("fbe6a8"), outline=hx("c89a50"))
                d.text((x + 2, y + 1), str(row * 7 + c + 1), font=F("dv", 7), fill=hx("8a4a16"))
                if row == 1 and c in marks:
                    d.ellipse([x + 7, y + 7, x + 18, y + 18], fill=marks[c], outline=INK)
                    if c == 6:
                        d.text((x + 13, y + 12), "7", font=F("dvb", 8), fill=(255, 255, 255), anchor="mm")
                if row == 1 and len(marks) == 3 and c in (4, 5, 6):
                    d.line([x + 3, y + 3, x + 21, y + 18], fill=hx("b02020"))
                if month == 6 and row == 3 and c == 5 and k == 1:
                    d.rectangle([x + 6, y + 7, x + 18, y + 17], fill=hx("ffe9a0"), outline=INK)
        # Briefkasten-Nachricht
        if k >= 3:
            L3 = ls[3]
            if t >= word_t(L3, "Nachricht"):
                d.rectangle([cx0 + 210, cy0 + 30, cx0 + 250, cy0 + 56], fill=hx("fbe6a8"), outline=INK)
                d.line([cx0 + 210, cy0 + 30, cx0 + 230, cy0 + 45], fill=INK); d.line([cx0 + 250, cy0 + 30, cx0 + 230, cy0 + 45], fill=INK)
                d.ellipse([cx0 + 244, cy0 + 24, cx0 + 256, cy0 + 36], fill=hx("e0303a")); d.text((cx0 + 250, cy0 + 30), "1", font=F("dvb", 8), fill=(255, 255, 255), anchor="mm")
    # Uhrkasten
    wood_box(d, [W - 70, 4, W - 4, 44])
    hour = 15 if early else 19 + min(3, k)
    d.text((W - 37, 9), "Fr. 13" if early else "So. 28", font=F("dvb", 9), fill=INK, anchor="mt")
    d.text((W - 37, 24), f"{hour}:{(int(t * 4) % 6) * 10:02d}", font=F("dvb", 10), fill=INK, anchor="mt")
    # Energieleiste
    e = clamp(1 - (t - 80) / 26)
    d.rounded_rectangle([W - 16, 60, W - 5, 136], radius=3, fill=WOOD, outline=hx("6a3a12"))
    d.rectangle([W - 13, 64, W - 8, 132], fill=hx("4a2a12"))
    d.rectangle([W - 13, 132 - int(68 * e), W - 8, 132], fill=mix(hx("e0303a"), hx("5fd13f"), e))
    d.text((W - 10, 52), "E", font=F("dvb", 8), fill=(255, 255, 255), anchor="mm")
    # Dialogkasten
    if k >= 0:
        L = ls[k]
        by = H - 62
        wood_box(d, [6, by, W - 7, H - 5])
        d.rectangle([W - 62, by + 6, W - 13, H - 11], fill=hx("e8c070"), outline=hx("8a4a16"))
        pal = dict(PAL_LUME); pal["bg"] = hx("cfe0b0")
        portrait(d, W - 54, by + 9, 2, pal)
        lines, nfull = wrap_full(L, t, fu, W - 92)
        for j, l in enumerate(lines[-3:] if nfull > 3 else lines):
            d.text((14, by + 7 + j * 16), l, font=fu, fill=INK)
    toast2(d, W, "Alter 24 · neu: Feierabend", t - 79.0, y=50, H=H, f=F("dvb", 9), bg=WOOD, fg=PARCH) if t < 80.4 else None
    return im


# ================= Verse 2b: Blockwelt mit Spielrunde =================
def scene_blocks(t):
    W, H = 480, 270
    ls = SEC["v2b"]
    k = cur_line("v2b", t)
    night = clamp((t - 92) / 10)
    im, d = new(W, H)
    top, bot = mix(hx("6b9be8"), hx("0a0f2a"), night), mix(hx("bcd8ff"), hx("2a2f5a"), night)
    for y in range(100):
        d.line([0, y, W, y], fill=mix(top, bot, y / 100))
    for i in range(40):
        r = rnd("st", i)
        if night > .4:
            d.point((r.randrange(W), r.randrange(90)), fill=mix(top, (255, 255, 255), night * r.random()))
    for layer, (c, amp, base) in enumerate([("5a7ab0", 18, 62), ("3f6a5a", 12, 78)]):
        pts = [(0, 110)]
        for x in range(0, W + 8, 8):
            pts.append((x, base + amp * math.sin(x * .02 * (layer + 1) + layer * 2)))
        pts.append((W, 110))
        d.polygon(pts, fill=mix(hx(c), (10, 14, 30), night * .7))
    S = 10
    # Fackeln und Lichtkarte
    leaves = []
    if k >= 1 and t >= word_t(ls[1], "los"):
        leaves.append((0, word_t(ls[1], "los")))
    if k >= 2 and t >= word_t(ls[2], "früh"):
        leaves.append((2, word_t(ls[2], "früh")))
    if k >= 3:
        leaves.append((1, ls[3]["s"] + .4))
    gone = {i: tt for i, tt in leaves}
    torches = [(150, 136), (330, 136)]
    tl = [1.0, 1.0]
    if 0 in gone: tl[0] = 1 - ease((t - gone[0]) / 1.2) * .35
    if 2 in gone: tl[1] = 1 - ease((t - gone[2]) / 1.2) * .6
    if 1 in gone:
        f = ease((t - gone[1]) / 1.5); tl = [max(.62, tl[0] * (1 - .2 * f)), max(.4, tl[1] * (1 - .4 * f))]

    def lightv(x, y):
        v = 0.0
        if y < 110:
            v = 1 - night * .75
        for (tx, ty), s in zip(torches, tl):
            dd = math.hypot(x - tx, y - ty)
            v = max(v, s * clamp(1.3 - dd / 120) * (.92 + .08 * math.sin(t * 11 + tx)))
        return clamp(v, .16, 1)
    for gy in range(9, H // S + 1):
        for gx in range(W // S):
            x, y = gx * S, gy * S
            r = rnd(gx, gy, 5)
            room = 9 <= gx <= 38 and 11 <= gy <= 16
            if gy == 9:
                c = hx("2ea82e")
            elif gy < 11:
                c = hx("976b4b")
            else:
                c = hx("808080") if r.random() < .8 else hx("6a6a70")
                if r.random() < .03: c = hx("e8c840")
            if room:
                c = hx("3a2f2a") if gy < 16 else hx("a97d5d")
            if gy in (9, 10) and 22 <= gx <= 24:
                c = hx("3a2f2a")
            lv = lightv(x + 5, y + 5)
            d.rectangle([x, y, x + S - 1, y + S - 1], fill=mix((6, 6, 12), c, lv))
            if not room and gy > 9 and r.random() < .25:
                d.point((x + r.randrange(S), y + r.randrange(S)), fill=mix((6, 6, 12), mix(c, (0, 0, 0), .3), lv))
    # Baum
    d.rectangle([64, 50, 71, 90], fill=mix(hx("7a5a3a"), (10, 10, 20), night * .7)); d.ellipse([44, 20, 92, 62], fill=mix(hx("2e8a2e"), (10, 16, 20), night * .7))
    # Tisch, Karten, Runde
    lv = lightv(240, 150)
    d.rectangle([200, 144, 280, 148], fill=mix((6, 6, 12), hx("c89a6a"), lv)); d.rectangle([206, 148, 210, 159], fill=mix((6, 6, 12), hx("8a6a4a"), lv)); d.rectangle([270, 148, 274, 159], fill=mix((6, 6, 12), hx("8a6a4a"), lv))
    if k >= 0:
        nc = min(7, int((t - ls[0]["s"]) * 3))
        for i in range(nc):
            d.rectangle([212 + i * 9, 139, 218 + i * 9, 144], fill=mix((6, 6, 12), [hx("f8f8f0"), hx("e0303a"), hx("3c5ae6")][i % 3], lv), outline=mix((6, 6, 12), (40, 40, 40), lv))
    seats = [(180, 159), (300, 159), (330, 159)]
    names = ["Mo", "Kim", "Jo"]
    laugh = k == 0 and t >= word_t(ls[0], "lachen")
    for i, (sx, sy) in enumerate(seats):
        x = sx
        if i in gone:
            dtm = t - gone[i]
            x = sx + (-1 if i == 0 else 1) * dtm * 60
            if abs(x - sx) > 200: continue
        j = int(3 * abs(math.sin(t * 14 + i))) if laugh else 0
        pal = {kk: mix((6, 6, 12), v, lightv(x, sy - 10)) for kk, v in pal_friend(i).items()}
        sprite(d, int(x), sy - j, pal, s=2, frame=(1 + int(t * 8) % 2) if i in gone else 0, flip=(i == 0) == (i in gone))
    j = int(3 * abs(math.sin(t * 14 + 2))) if laugh else 0
    pal = {kk: mix((6, 6, 12), v, lightv(240, 140)) for kk, v in PAL_LUME.items()}
    sprite(d, 240, 159 - j, pal, s=2)
    for (tx, ty), s in zip(torches, tl):
        if s > .3:
            d.rectangle([tx - 1, ty - 4, tx + 1, ty + 5], fill=hx("7a5a3a")); d.rectangle([tx - 2, ty - 8 - int(2 * abs(math.sin(t * 13))), tx + 2, ty - 4], fill=hx("ffb030")); d.point((tx, ty - 6), fill=hx("fff0a0"))
    # Leiste oben links, Herzen oben rechts
    for i in range(10):
        d.rectangle([6 + i * 19, 14, 6 + i * 19 + 17, 31], fill=hx("3a4a9a"), outline=hx("8a9ae8") if i == 0 else hx("26306a"))
    for i, c in enumerate(["f8f8f0", "e8c840", "a97d5d", "e0303a"]):
        d.rectangle([11 + i * 19, 19, 18 + i * 19, 26], fill=hx(c))
    fu = F("uni", 16)
    text(d, (8, -1), "Spielkarten", F("dvb", 9), (255, 255, 255), shadow=(0, 0, 0))
    energy = 10 - int(clamp((t - 92) / 10.5) * 7)
    for i in range(10):
        c = hx("e0303a") if i < energy else hx("3a1a20")
        x = W - 12 - i * 13
        d.ellipse([x - 5, 6, x, 11], fill=c); d.ellipse([x - 1, 6, x + 4, 11], fill=c); d.polygon([(x - 5, 9), (x + 4, 9), (x, 15)], fill=c)
    hh = 20 + int(clamp((t - 92) / 10.8) * 4)
    text(d, (W - 8, 20), f"{hh % 24:02d}:{(int((t - 92) * 22) % 60):02d}", F("dvb", 10), (255, 255, 255), shadow=(0, 0, 0), anchor="rt")
    # Chat: die Zeilen des Songs und wer geht
    rows = []
    for i in range(0, k + 1):
        L = ls[i]
        lines, _ = wrap_full(L, t, fu, W - 150)
        for l in lines:
            rows.append((l, (255, 255, 255) if i == k else hx("b0b8c8")))
        for gi, gt in leaves:
            own = {0: 1, 2: 2, 1: 3}[gi]
            if own == i and t >= gt + .3:
                rows.append((f"{names[gi]} hat die Welt verlassen.", hx("ffe65a")))
    y = H - 8 - len(rows[-4:]) * 17
    for l, c in rows[-4:]:
        text(d, (8, y), l, fu, c, shadow=(0, 0, 0))
        y += 17
    toast2(d, W, "Alter 26 · neu: Mehrspieler", t - 92.1, y=40, H=H, f=F("dvb", 10), bg=hx("26306a"), fg=(255, 255, 255))
    return im


# ================= Pre-Hook 2: Zeichenfestung =================
C16 = [hx(c) for c in "000000 000080 008000 008080 800000 800080 808000 c0c0c0 808080 0000ff 00ff00 00ffff ff0000 ff00ff ffff00 ffffff".split()]
MAP = [
    "╔══════════╗      ╔══════════╗      ╔══════════╗ ",
    "║..........║ ♣  ' ║..........║  ♠ ' ║..........║ ",
    "║..Θ.......║   '  ║.......Θ..║ '    ║...Θ......║ ",
    "║..........╟──────╢..........╟──────╢..........║ ",
    "║......≡...║ '  ♣ ║..≡.......║   '  ║.....≡....║ ",
    "║..........║  '   ║..........║ ♣    ║..........║ ",
    "╚════╤═════╝ '    ╚════╤═════╝   '  ╚════╤═════╝ ",
    "  '  │   ♠    '     ♣  │    '   ♠     '  │  '    ",
    " ♣   └─────────────────┼─────────────────┘    ♣  ",
    "   '     '   ♣     ╔═══╧═══╗    '    ♠      '    ",
    " '    ♠        '   ║.......║  '         '     ♠  ",
    "    '      '       ║...π...║     ♣   '           ",
    "  ♣     ≈≈≈≈   '   ║.......║ '          ♠   '    ",
    "      ≈≈≈≈≈≈≈      ╚═══════╝      '          ♣   ",
]


def scene_ascii(t):
    W, H = 640, 360
    ls = SEC["pre2"]
    k = cur_line("pre2", t)
    im, d = new(W, H, (0, 0, 0))
    f = F("uni", 16)
    tick = int(t * 4)
    cw, ch = 8, 16
    ox, oy = 8, 22
    for j, row in enumerate(MAP):
        for i, c in enumerate(row):
            if c == " ":
                continue
            col = C16[7]
            if c in "♣♠": col = C16[2] if c == "♣" else C16[10]
            elif c == "'": col = C16[2]
            elif c == ".": col = C16[8]
            elif c == "≈":
                col = C16[9] if (i + tick) % 2 else C16[11]
                c = "≈" if (i + tick) % 2 else "~"
            elif c == "Θ": col = C16[6]
            elif c == "≡": col = C16[14]
            elif c == "π": col = C16[14]
            d.text((ox + i * cw, oy + j * ch), c, font=f, fill=col)
    # Vier Leben in vier Kammern, jeder für sich; die Mitte bleibt leer
    ppl = [(5, 3, C16[11]), (24, 2, C16[12]), (42, 4, C16[10]), (0, 0, C16[13])]
    for n, (bx, by, col) in enumerate(ppl[:3]):
        r = rnd(n, tick // 2)
        x = bx + r.randrange(-2, 3); y = by + r.randrange(-1, 2)
        d.rectangle([ox + x * cw, oy + y * ch, ox + x * cw + cw - 1, oy + y * ch + ch - 1], fill=(0, 0, 0))
        d.text((ox + x * cw, oy + y * ch), "☺", font=f, fill=col)
    lx, ly = 23, 11
    if tick % 2:
        d.rectangle([ox + lx * cw, oy + ly * ch, ox + lx * cw + cw - 1, oy + ly * ch + ch - 1], fill=C16[3])
    d.text((ox + lx * cw, oy + ly * ch), "☺", font=f, fill=C16[15])
    # Kopfzeile
    d.rectangle([0, 0, W, 17], fill=C16[8])
    d.text((8, 1), "RESTLICHTHEIM", font=f, fill=C16[15])
    d.text((W - 8, 1), "Später Herbst, Jahr 29", font=f, fill=C16[0], anchor="ra")
    # Seitenleiste
    sx = 424
    d.line([sx - 8, 18, sx - 8, 246], fill=C16[8])
    menu = [("a", "Arbeit"), ("f", "Freunde"), ("z", "Zeit für mich"), ("p", "Pflicht"), ("s", "Schlaf")]
    vals = ["100%", " 12%", "  3%", "100%", " 41%"]
    for i, ((key, lab), v) in enumerate(zip(menu, vals)):
        d.text((sx, 26 + i * 18), key, font=f, fill=C16[10]); d.text((sx + 8, 26 + i * 18), ": " + lab, font=f, fill=C16[7])
        d.text((W - 8, 26 + i * 18), v, font=f, fill=C16[12] if "100" in v else C16[8], anchor="ra")
    d.text((sx, 132), "Gemeinsame Zeit:", font=f, fill=C16[7])
    n = max(0, 5 - int(clamp((t - 102.9) / 4.5) * 5))
    d.text((sx, 150), "█" * n + "░" * (10 - n), font=f, fill=C16[14] if n > 1 else C16[12])
    d.text((sx, 186), "Müßiggänger: 0", font=f, fill=C16[8])
    # Meldungen: der Songtext
    d.line([0, 248, W, 248], fill=C16[8])
    y = 254
    for i in range(0, k + 1):
        L = ls[i]
        lines, _ = wrap_full(L, t, f, W - 20)
        for l in lines:
            d.text((8, y), l, font=f, fill=C16[15] if i == k else C16[7])
            y += 18
    if k >= 0 and int(t * 3) % 2:
        d.text((8, y), "_", font=f, fill=C16[14])
    if t < 106.4:
        s = "Alter 27 · neu: nur noch Zeichen"
        d.rectangle([150, 108, 150 + len(s) * 8 + 16, 132], fill=C16[1], outline=C16[15])
        d.text((158, 112), s, font=f, fill=C16[14])
    return im
