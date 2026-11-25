"""Epochen 1-4: Taschenspiel, Browserspiel, Transport-Iso, Kolonie-Tabelle."""
from core import *

# ================= 1. Taschenspiel, vier Grünstufen =================
GB = [hx("0f380f"), hx("306230"), hx("8bac0f"), hx("9bbc0f")]
COL8 = dict(grass=hx("5cb850"), grass2=hx("3f9440"), path=hx("e0c890"), tree=hx("1f6f3a"), trunk=hx("7a4a26"),
            wall=hx("e8e0d0"), roof=hx("c8503c"), door=hx("5a3a22"), water=hx("3c84d8"), ink=hx("20203a"),
            box=hx("f8f8f0"))
ROLE_GB = dict(grass=GB[2], grass2=GB[1], path=GB[3], tree=GB[1], trunk=GB[0], wall=GB[3], roof=GB[1],
               door=GB[0], water=GB[1], ink=GB[0], box=GB[3])


def gb_lume_pal(color):
    if color:
        return PAL_LUME
    m = dict(h=GB[2], H=GB[1], s=GB[3], g=GB[1], e=GB[0], p=GB[3], P=GB[2], a=GB[3], l=GB[1], f=GB[3], o=GB[0])
    return m


def gb_box(d, W, H, lines, C, more=False, t=0):
    y0 = H - 46
    d.rectangle([2, y0, W - 3, H - 3], fill=C["box"], outline=C["ink"])
    d.rectangle([4, y0 + 2, W - 5, H - 5], outline=C["ink"])
    f = F("uni", 16)
    for i, l in enumerate(lines[-2:]):
        d.text((10, y0 + 5 + i * 17), l, font=f, fill=C["ink"])
    if more and int(t * 3) % 2:
        d.polygon([(W - 16, H - 12), (W - 10, H - 12), (W - 13, H - 8)], fill=C["ink"])


def scene_gb(t):
    W, H = 240, 135
    C = ROLE_GB
    im, d = new(W, H, GB[3])
    if t < 0.9:  # Einschaltbild
        y = int(lerp(-10, 52, ease(t / 0.6)))
        text(d, (W // 2, y), "SEEZ TASCHE", F("uni", 16), GB[0], anchor="mt")
        return im
    # Kinderzimmer
    for y in range(0, H, 16):
        for x in range(0, W, 16):
            d.rectangle([x, y, x + 15, y + 15], fill=GB[3] if (x // 16 + y // 16) % 2 else GB[2])
    d.rectangle([0, 0, W, 26], fill=GB[1])
    d.line([0, 26, W, 26], fill=GB[0])
    d.rectangle([24, 6, 56, 22], fill=GB[3], outline=GB[0]); d.line([40, 6, 40, 22], fill=GB[0])  # Fenster
    d.rectangle([150, 30, 206, 58], fill=GB[2], outline=GB[0]); d.rectangle([150, 30, 166, 58], fill=GB[3], outline=GB[0])  # Bett
    d.rectangle([84, 10, 116, 34], fill=GB[0]); d.rectangle([88, 13, 112, 29], fill=GB[2] if int(t * 4) % 2 else GB[3])  # Röhre
    d.rectangle([92, 36, 108, 40], fill=GB[1], outline=GB[0])  # Konsole
    d.rectangle([12, 44, 30, 62], fill=GB[1], outline=GB[0]); d.ellipse([15, 34, 27, 46], fill=GB[2], outline=GB[0])  # Pflanze
    bob = 1 if pulse(t) > .5 else 0
    sprite(d, 100, 78 - bob, gb_lume_pal(False), s=2, kid=True)
    # Uhr, tickt
    d.ellipse([200, 6, 216, 22], fill=GB[3], outline=GB[0])
    a = beat_i(t) * math.pi / 6
    d.line([208, 14, 208 + 6 * math.sin(a), 14 - 6 * math.cos(a)], fill=GB[0])
    k = cur_line("intro", t)
    if k >= 0:
        L = SEC["intro"][k]
        ls, _ = wrap_full(L, t, F("uni", 16), W - 24)
        gb_box(d, W, H, ls, C, more=t > L["e"], t=t)
    return im


def scene_walk(t):
    """Zwischenspiel: raus aus dem Haus, die Welt bekommt Farbe."""
    W, H = 240, 135
    f = clamp((t - 14.2) / 1.6)
    im, d = new(W, H)
    cam = (t - 10.6) * 22
    px = im.load()
    for layer in (0, 1):
        colored = layer == 1
        C = COL8 if colored else ROLE_GB
        lim = int(W * ease(f))  # Farbe läuft von links ins Bild
        im2, d2 = new(W, H, C["grass"])
        for ty in range(0, H, 16):
            for tx in range(-16, W + 16, 16):
                wx = int(tx + cam) // 16
                x = wx * 16 - int(cam)
                r = rnd(wx, ty)
                if ty in (64, 80):
                    d2.rectangle([x, ty, x + 15, ty + 15], fill=C["path"])
                elif ty < 32 or ty >= 112:
                    d2.rectangle([x, ty, x + 15, ty + 15], fill=C["grass2"])
                    d2.ellipse([x + 1, ty, x + 14, ty + 12], fill=C["tree"], outline=C["ink"])
                    d2.rectangle([x + 6, ty + 11, x + 9, ty + 15], fill=C["trunk"])
                elif r.random() < .3:
                    for q in range(3):
                        d2.line([x + 3 + q * 4, ty + 12, x + 5 + q * 4, ty + 6], fill=C["grass2"])
                if wx == 2 and ty == 32:
                    d2.rectangle([x, ty - 6, x + 47, ty + 31], fill=C["wall"], outline=C["ink"])
                    d2.polygon([(x - 3, ty - 4), (x + 24, ty - 20), (x + 50, ty - 4)], fill=C["roof"], outline=C["ink"])
                    d2.rectangle([x + 18, ty + 12, x + 29, ty + 31], fill=C["door"])
                if wx == 14 and ty == 96:
                    d2.rectangle([x + 5, ty - 2, x + 11, ty + 9], fill=C["box"], outline=C["ink"]); d2.rectangle([x + 7, ty + 9, x + 8, ty + 14], fill=C["ink"])
        fr = 1 + int(t * 6) % 2
        sprite(d2, 96, 92, gb_lume_pal(colored), s=2, kid=t < 16.8, frame=fr)
        if layer == 0:
            im = im2
        elif lim > 0:
            im.paste(im2.crop((0, 0, lim, H)), (0, 0))
            d = ImageDraw.Draw(im); d.line([lim, 0, lim, H], fill=(255, 255, 255))
    d = ImageDraw.Draw(im); d.fontmode = "1"
    if 14.2 < t < 18.5:
        toast(d, W, "Alter 11 · neu: Farbe", ROLE_GB if f < 1 else COL8, t - 14.2)
    return im


def toast(d, W, s, C, age, f=None, y=6):
    f = f or F("uni", 16)
    w = int(f.getlength(s)) + 12
    yy = int(lerp(-22, y, ease(age / .3))) if age < 3.6 else int(lerp(y, -22, ease((age - 3.6) / .3)))
    d.rectangle([W // 2 - w // 2, yy, W // 2 + w // 2, yy + 20], fill=C["box"], outline=C["ink"])
    d.text((W // 2, yy + 2), s, font=f, fill=C["ink"], anchor="mt")


# ================= 2. Browserspiel: Imperium aus Tabellen =================
def scene_browser(t):
    W, H = 640, 360
    im, d = new(W, H, hx("000814"), aa=True)
    r = rnd("stars")
    for i in range(140):
        x, y = r.randrange(W), r.randrange(H)
        c = r.choice([90, 130, 200])
        d.point((x, y), fill=(c, c, c + 30))
    fb, fs, fh = F("dvb", 11), F("dv", 10), F("dvb", 15)
    body, head, border, txt, gold = hx("1b2a4a"), hx("344566"), hx("415680"), hx("cdd7f8"), hx("f2c14e")
    ls = SEC["v1a"]
    k = cur_line("v1a", t)
    # linkes Menü
    d.rectangle([8, 8, 104, H - 9], fill=body, outline=border)
    d.rectangle([8, 8, 104, 26], fill=head, outline=border)
    d.text((56, 17), "STERNENAMT", font=fb, fill=gold, anchor="mm")
    for i, m in enumerate(["Übersicht", "Gebäude", "Forschung", "Werft", "Flotte", "Nachrichten"]):
        sel = m == "Nachrichten"
        d.text((18, 36 + i * 17), m, font=fb if sel else fs, fill=gold if sel else txt)
    d.text((18, H - 40), "Serverzeit", font=fs, fill=hx("8090b8"))
    sec = int(t * 60) % 60
    hour = 7 if t < ls[1]["s"] + 1.5 else 19
    d.text((18, H - 26), f"{hour:02d}:{int((t - 20) * 5) % 60:02d}:{sec:02d}", font=fb, fill=txt)
    # Rohstoffkopf: drei Konten und Energie
    d.rectangle([112, 8, W - 9, 52], fill=body, outline=border)
    d.ellipse([122, 14, 152, 44], fill=hx("6a8fd8")); d.ellipse([128, 18, 144, 34], fill=hx("8fb0ee")); d.arc([122, 14, 152, 44], 20, 200, fill=hx("2a4a90"), width=3)
    tt = t - 20.6
    lost = clamp((t - ls[3]["s"]) / 2.6) if k >= 3 else 0
    res = [("Arbeit", 41200 + int(tt * 870), txt), ("Geld", 2300 + int(max(0, t - ls[2]["s"]) * 310), txt),
           ("Freizeit", int(3600 * (1 - lost) * max(.2, 1 - tt / 30)), hx("e03c31") if k >= 3 else hx("6bd425")),
           ("Energie", 100 - int(tt * 4), hx("e03c31") if tt > 6 else txt)]
    for i, (n, v, c) in enumerate(res):
        x = 220 + i * 100
        d.text((x, 20), n, font=fb, fill=gold, anchor="mm")
        d.text((x, 38), f"{v:,}".replace(",", "."), font=fb, fill=c, anchor="mm")
    # Nachrichtentabelle: jede Zeile des Songs ist eine Nachricht
    x0, y0 = 112, 60
    d.rectangle([x0, y0, W - 9, y0 + 20], fill=head, outline=border)
    d.text((x0 + 10, y0 + 10), "Nachrichten", font=fb, fill=txt, anchor="lm")
    d.text((W - 20, y0 + 10), f"{max(0, k + 1)} neu", font=fs, fill=gold, anchor="rm")
    f = F("dvb", 19)
    yy = y0 + 20
    stamps = ["07:00", "07:01", "18:30", "19:45"]
    for i in range(4):
        hgt = 52
        cur = i == k
        d.rectangle([x0, yy, W - 9, yy + hgt], fill=mix(body, head, .35) if cur else body, outline=border)
        if i <= k:
            L = ls[i]
            d.text((x0 + 10, yy + 9), stamps[i], font=fs, fill=gold)
            lines, _ = wrap_full(L, t, f, W - x0 - 80)
            for j, l in enumerate(lines[:2]):
                d.text((x0 + 56, yy + 5 + j * 22), l, font=f, fill=(255, 255, 255) if cur else txt)
        yy += hgt
    # Bauschleife
    yy += 6
    d.rectangle([x0, yy, W - 9, yy + 18], fill=head, outline=border)
    d.text((x0 + 10, yy + 9), "Bauschleife", font=fb, fill=txt, anchor="lm")
    yy += 18
    L2, L3 = ls[2], ls[3]
    rows = [("Job", word_t(L2, "Job"), None), ("Plan", word_t(L2, "Plan"), None), ("Geld", word_t(L2, "Geld"), None),
            ("Freizeit", L3["s"], word_t(L3, "fällt"))]
    for i, (n, ts, tx) in enumerate(rows):
        cx = x0 + i * 130
        d.rectangle([cx, yy, cx + 129 if i < 3 else W - 9, yy + 44], fill=body, outline=border)
        if t < ts:
            continue
        d.rectangle([cx + 6, yy + 6, cx + 36, yy + 36], fill=[hx("7a5a3a"), hx("3a6a8a"), hx("b89a2a"), hx("3a8a5a")][i], outline=border)
        d.text((cx + 42, yy + 8), n, font=fb, fill=gold)
        if tx and t >= tx:
            d.text((cx + 42, yy + 24), "abgebrochen", font=fb, fill=hx("e03c31"))
            d.line([cx + 6, yy + 6, cx + 36, yy + 36], fill=hx("e03c31"), width=2)
        elif tx:
            rem = max(0, tx - t)
            d.text((cx + 42, yy + 24), f"0h 00m {int(rem * 20):02d}s", font=fs, fill=txt)
        else:
            d.text((cx + 42, yy + 24), "fertig" if t > ts + .25 else "…", font=fb, fill=hx("6bd425"))
    if t < 24.2:
        toast2(d, W, "Alter 13 · neu: Internet", t - 20.4)
    return im


def toast2(d, W, s, age, y=None, H=360, f=None, bg=hx("10141c"), fg=hx("ffe9a0")):
    f = f or F("dvb", 12)
    w = int(f.getlength(s)) + 24
    hgt = f.size + 12
    y = H - hgt - 10 if y is None else y
    a = ease(age / .3) if age < 3.2 else 1 - ease((age - 3.2) / .3)
    if a <= 0:
        return
    x = int(lerp(W + 4, W - w - 10, a))
    d.rectangle([x, y, x + w, y + hgt], fill=bg, outline=fg)
    d.text((x + 12, y + hgt // 2), s, font=f, fill=fg, anchor="lm")


# ================= 3. Transport-Iso =================
def iso(tx, ty, ox, oy, tw=32, th=16):
    return ox + (tx - ty) * tw // 2, oy + (tx + ty) * th // 2


def cube(d, x, y, w, h, z, top, left, right, outline=None):
    """Quader auf der Rautenkachel, (x, y) ist die obere Ecke der Grundraute."""
    hw, hh = w // 2, w // 4
    t = [(x, y - z), (x + hw, y + hh - z), (x, y + 2 * hh - z), (x - hw, y + hh - z)]
    d.polygon([(x - hw, y + hh - z), (x, y + 2 * hh - z), (x, y + 2 * hh), (x - hw, y + hh)], fill=left, outline=outline)
    d.polygon([(x + hw, y + hh - z), (x, y + 2 * hh - z), (x, y + 2 * hh), (x + hw, y + hh)], fill=right, outline=outline)
    d.polygon(t, fill=top, outline=outline)


def scene_tycoon(t):
    W, H = 480, 270
    im, d = new(W, H, hx("2c5c9c"))
    ls = SEC["v1b"]
    k = cur_line("v1b", t)
    ox, oy = 240, -40
    g1, g2 = hx("4c7c2c"), hx("3c5c1c")
    N = 22
    for ty in range(N):
        for tx in range(N):
            x, y = iso(tx, ty, ox, oy)
            if not (-40 < x < W + 40 and -20 < y < H + 20):
                continue
            r = rnd(tx, ty, 3)
            water = (tx + ty > 30) or (tx < 3 and ty > 14)
            if water:
                c = hx("3c74b4") if (tx + ty + int(t * 3)) % 4 == 0 else hx("2c5c9c")
            else:
                c = g1 if r.random() < .8 else g2
            d.polygon([(x, y), (x + 16, y + 8), (x, y + 16), (x - 16, y + 8)], fill=c)
            if water:
                continue
            if ty == 11:  # Gleis
                d.line([x - 12, y + 6, x + 4, y + 14], fill=hx("8c6c4c"), width=5)
                d.line([x - 14, y + 5, x + 2, y + 13], fill=hx("c8c8c8"))
                d.line([x - 10, y + 7, x + 6, y + 15], fill=hx("c8c8c8"))
            elif r.random() < .16 and ty not in (10, 12):
                d.polygon([(x, y - 6), (x + 4, y + 8), (x - 4, y + 8)], fill=hx("2c5c1c"), outline=hx("1c3c0c"))
    # Stadt
    for (tx, ty, z, c) in [(6, 7, 14, "c8a078"), (7, 8, 22, "b0b0c0"), (8, 7, 10, "d8c090"), (6, 9, 12, "c07860"), (9, 8, 16, "a8b8a0"),
                           (15, 14, 12, "c8a078"), (16, 13, 18, "b0b0c0"), (17, 14, 9, "c07860")]:
        x, y = iso(tx, ty, ox, oy)
        col = hx(c)
        cube(d, x, y, 22, 22, z, mix(col, (255, 255, 255), .25), mix(col, (0, 0, 0), .15), mix(col, (0, 0, 0), .4))
    # Bahnhof mit wartender Fracht (verschweißte Spiele, liegengebliebene Arbeit)
    sx, sy = iso(11, 10, ox, oy)
    cube(d, sx, sy, 60, 60, 3, hx("a8a8a8"), hx("7c7c7c"), hx("5c5c5c"))
    cube(d, sx - 8, sy + 2, 30, 30, 16, hx("c84c3c"), hx("d8d0c0"), hx("a8a090"))
    n = 0
    if k >= 0:
        n = int(clamp((t - ls[0]["s"]) / 10.5) * 18) + (2 if pulse(t) > .6 else 0)
    cols = [hx("e8a83c"), hx("5c9cd8"), hx("d85c8c"), hx("7cc85c")]
    for i in range(min(n, 20)):
        cx = sx + 14 + (i % 3) * 9 - (i % 3) * 0
        cy = sy + 14 + (i % 3) * 4
        z = (i // 3) * 7
        cube(d, cx, cy - z, 10, 10, 6, mix(cols[i % 4], (255, 255, 255), .3), cols[i % 4], mix(cols[i % 4], (0, 0, 0), .35), outline=hx("202020"))
    # Zug
    p = ((t - 31.5) * 2.4) % 26 - 2
    for cidx in range(4):
        q = p - cidx * .8
        x, y = iso(q, 11, ox, oy)
        col = hx("c83c2c") if cidx == 0 else hx("5c5c6c")
        cube(d, x - 2, y + 2, 14, 14, 7, mix(col, (255, 255, 255), .3), col, mix(col, (0, 0, 0), .4))
        if cidx == 0:
            for s in range(3):
                a = (t * 2 + s * .33) % 1
                d.ellipse([x - 2 - a * 6, y - 8 - a * 14, x + 2 + a * 2, y - 4 - a * 12], fill=mix(hx("e8e8e8"), hx("4c7c2c"), a))
    # Werkzeugleiste
    grey, lt, dk = hx("a8a8a8"), hx("e0e0e0"), hx("5c5c5c")
    bevel(d, [0, 0, W - 1, 15], grey, lt, dk)
    for i in range(18):
        x = 2 + i * 15 + (6 if i > 4 else 0) + (6 if i > 11 else 0)
        bevel(d, [x, 1, x + 13, 14], grey, lt, dk)
        r = rnd("ic", i)
        c = [hx("3c5c1c"), hx("2c5c9c"), hx("8c6c4c"), hx("fcfc54"), hx("c83c2c")][i % 5]
        if i % 3 == 0:
            d.rectangle([x + 4, 4, x + 9, 10], fill=c)
        elif i % 3 == 1:
            d.line([x + 3, 11, x + 10, 4], fill=c, width=2)
        else:
            d.ellipse([x + 4, 4, x + 10, 10], fill=c)
    # Statusleiste
    bevel(d, [0, H - 14, W - 1, H - 1], grey, lt, dk)
    fs = F("dvb", 9)
    day = 1 + int((t - 31.9) * 2.8)
    wd = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][day % 7]
    d.text((6, H - 7), f"{wd} {day:02d}. Mär 2026", font=fs, fill=(0, 0, 0), anchor="lm")
    d.text((W - 6, H - 7), f"{12400 + int((t - 31.9) * 913):,} €".replace(",", "."), font=fs, fill=(0, 0, 0), anchor="rm")
    d.text((W // 2, H - 7), f"Fracht wartet: {min(n, 20)}", font=fs, fill=hx("801010") if n > 8 else (0, 0, 0), anchor="mm")
    # Nachrichtenfenster mit der Songzeile
    if k >= 0:
        L = ls[k]
        f = F("dvb", 15)
        lines, nfull = wrap_full(L, t, f, 300)
        bx0, by0, bx1 = 86, 178, 394
        by1 = by0 + 16 + nfull * 19 + 8
        a = ease((t - L["s"] + .15) / .2)
        off = int((1 - a) * 80)
        bevel(d, [bx0, by0 + off, bx1, by1 + off], hx("e8e4d8"), (255, 255, 255), hx("5c5c5c"))
        d.rectangle([bx0 + 1, by0 + 1 + off, bx1 - 1, by0 + 12 + off], fill=hx("7c4c2c") if k % 2 else hx("2c4c8c"))
        d.text(((bx0 + bx1) // 2, by0 + 7 + off), "Nachricht", font=fs, fill=(255, 255, 255), anchor="mm")
        d.rectangle([bx0 + 2, by0 + 2 + off, bx0 + 11, by0 + 11 + off], fill=grey, outline=dk); d.line([bx0 + 4, by0 + 4 + off, bx0 + 9, by0 + 9 + off], fill=(0, 0, 0)); d.line([bx0 + 9, by0 + 4 + off, bx0 + 4, by0 + 9 + off], fill=(0, 0, 0))
        for j, l in enumerate(lines):
            d.text((bx0 + 8, by0 + 17 + j * 19 + off), l, font=f, fill=(0, 0, 0))
    if t < 35.6:
        toast2(d, W, "Alter 15 · neu: Schrägsicht", t - 31.9, y=22, H=H, f=F("dvb", 10))
    return im


# ================= 4. Kolonie: der Arbeitsplan =================
def pawn(d, x, y, col, s=1, carry=None):
    d.ellipse([x - 5 * s, y + 3 * s, x + 5 * s, y + 6 * s], fill=(0, 0, 0, 60) if False else hx("3a3a30"))
    d.rounded_rectangle([x - 4 * s, y - 6 * s, x + 4 * s, y + 5 * s], radius=3 * s, fill=col, outline=hx("1a1a1a"))
    d.ellipse([x - 4 * s, y - 13 * s, x + 4 * s, y - 5 * s], fill=hx("f6d5bd"), outline=hx("1a1a1a"))
    d.pieslice([x - 5 * s, y - 14 * s, x + 5 * s, y - 4 * s], 180, 360, fill=hx("9ad0f5"), outline=hx("1a1a1a"))
    if carry:
        d.rectangle([x + 3 * s, y - 4 * s, x + 8 * s, y + 1 * s], fill=carry, outline=hx("1a1a1a"))


def scene_colony(t):
    W, H = 480, 270
    im, d = new(W, H, hx("5e6b3a"), aa=True)
    ls = SEC["pre1"]
    k = cur_line("pre1", t)
    r = rnd("soil")
    for i in range(240):
        x, y = r.randrange(W), r.randrange(110)
        d.rectangle([x, y, x + r.randrange(2, 9), y + r.randrange(1, 4)], fill=mix(hx("5e6b3a"), hx("6b5b3e"), r.random()))
    # Räume
    for (x0, y0, x1, y1) in [(40, 22, 150, 92), (150, 22, 250, 92), (300, 30, 420, 96)]:
        d.rectangle([x0, y0, x1, y1], fill=hx("4a3b2a"))
        d.rectangle([x0, y0, x1, y1], outline=hx("8a8a80"), width=5)
        d.rectangle([x0, y0, x1, y1], outline=hx("2a2a28"))
    d.rectangle([146, 50, 154, 64], fill=hx("6b4a2a"))
    d.rectangle([56, 36, 84, 54], fill=hx("7a8fb0"), outline=hx("1a1a1a"))  # Bett
    d.rectangle([170, 34, 228, 50], fill=hx("6a5a48"), outline=hx("1a1a1a"))  # Werkbank
    d.rectangle([316, 44, 404, 84], fill=hx("3a5a7a"), outline=hx("9bd36a"))  # Lagerzone
    ph = (t - 43) * 1.1
    px = 110 + 110 * (0.5 + 0.5 * math.sin(ph))
    pawn(d, px, 70 + int(2 * abs(math.sin(ph * 6))), hx("d9b8ef"), carry=hx("e8c547"))
    # Fenster "Arbeit"
    panel, row, txt, hi = hx("1f2328"), hx("3a3f45"), hx("d9d9d9"), hx("e8c547")
    d.rectangle([0, 104, W, H - 15], fill=panel, outline=row)
    f = F("sansb", 18)
    if k >= 0:
        L = ls[k]
        lines, _ = wrap_full(L, t, f, W - 24)
        for j, l in enumerate(lines[:2]):
            d.text((12, 108 + j * 20), l, font=f, fill=(255, 255, 255))
    cols = ["Arbeit", "Mails", "Haushalt", "Einkauf", "Freunde", "Schlaf", "Spielen", "Ich"]
    days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    fs = F("sans", 9)
    gx, gy, cw, rh = 64, 178, 50, 11
    for i, c in enumerate(cols):
        d.text((gx + i * cw + cw // 2, gy - (16 if i % 2 else 7)), c, font=fs, fill=txt, anchor="mm")
        d.line([gx + i * cw + cw // 2, gy - (11 if i % 2 else 2), gx + i * cw + cw // 2, gy], fill=row)
    nb = beat_phase(t) - beat_phase(43.0)
    filled = int(clamp(nb / 9.5) * 56) if k >= 0 else 0
    pc = {1: hx("3fd13f"), 2: hx("c8d13f"), 3: hx("d19a3f"), 4: hx("8a8a8a")}
    n = 0
    for j, dn in enumerate(days):
        y = gy + j * rh
        d.rectangle([8, y, W - 9, y + rh - 1], fill=row if j % 2 else panel)
        d.text((14, y + rh // 2), dn, font=fs, fill=txt, anchor="lm")
        d.text((34, y + rh // 2), "24 h", font=fs, fill=hx("8a8f96"), anchor="lm")
        for i in range(8):
            cx = gx + i * cw + cw // 2
            d.rectangle([cx - 8, y + 1, cx + 8, y + rh - 2], outline=hx("50565e"))
            if n < filled:
                v = [1, 1, 2, 3, 3, 2, 4, 4][i]
                if j >= 5 and i == 0:
                    v = 2
                if i >= 6 and not (j == 6 and k >= 1 and i == 7):
                    v = None
                if v:
                    d.text((cx, y + rh // 2), str(v), font=F("sansb", 9), fill=pc[v], anchor="mm")
            n += 1
    # untere Reiterleiste
    tabs = ["Architekt", "Arbeit", "Zeitplan", "Zuweisen", "Tiere", "Forschung", "Welt", "Verlauf", "Menü"]
    tw = W / len(tabs)
    for i, tb in enumerate(tabs):
        sel = tb == ("Zeitplan" if k >= 1 else "Arbeit")
        d.rectangle([i * tw, H - 15, (i + 1) * tw - 1, H - 1], fill=hx("4a5058") if sel else hx("2a2e34"), outline=hx("14161a"))
        d.text((i * tw + tw / 2, H - 8), tb, font=fs, fill=hi if sel else txt, anchor="mm")
    toast2(d, W, "Alter 19 · neu: Arbeitsplan", t - 43.0, y=6, H=H, f=F("sansb", 10))
    return im
