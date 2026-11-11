"""Gemeinsame Bausteine: Daten, Schrift, Text, Figur."""
import json, math, random, bisect, os
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "data.json"), encoding="utf8"))
LINES, BEATS, RMS = D["lines"], D["beats"], D["rms"]
END = 223.99
for L in LINES:
    L["s"], L["e"] = L["t"][0][0], min(L["t"][-1][1], END)
SEC = {}
for L in LINES:
    SEC.setdefault(L["sec"], []).append(L)

FONTS = {
    "uni": "/usr/share/fonts/opentype/unifont/unifont.otf",
    "sans": "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
    "sansb": "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
    "sansx": "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
    "dv": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "dvb": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "monob": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "serif": "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    "serifi": "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf",
}


@lru_cache(None)
def F(name, size):
    return ImageFont.truetype(FONTS[name], size)


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, f):
    return a + (b - a) * f


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def mix(c1, c2, f):
    f = clamp(f)
    return tuple(int(round(lerp(a, b, f))) for a, b in zip(c1, c2))


def hx(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def beat_i(t):
    return bisect.bisect_right(BEATS, t) - 1


def pulse(t, k=6.0):
    """1.0 auf dem Schlag, klingt danach ab."""
    i = beat_i(t)
    if i < 0:
        return 0.0
    return math.exp(-k * (t - BEATS[i]))


def beat_phase(t):
    """Fortlaufender Schlagzähler mit Nachkommaanteil."""
    i = beat_i(t)
    if i < 0:
        return 0.0
    if i >= len(BEATS) - 1:
        return float(i)
    return i + (t - BEATS[i]) / (BEATS[i + 1] - BEATS[i])


def loud(t):
    i = int(t * 30)
    return RMS[i] if 0 <= i < len(RMS) else 0.0


def rnd(*key):
    return random.Random(hash(key) & 0xFFFFFFFF)


# ---------- Songtext ----------
def cur_line(sec, t, hold=0.0):
    """Index der Zeile des Abschnitts, die zur Zeit t läuft (oder zuletzt lief)."""
    ls = SEC[sec]
    k = -1
    for i, L in enumerate(ls):
        if t >= L["s"] - hold:
            k = i
    return k


def shown(L, t, typed=True):
    """Bisher gesungener Teil der Zeile; das laufende Wort wird getippt."""
    out = []
    for w, (s, e) in zip(L["words"], L["t"]):
        if t >= e or (not typed and t >= s):
            out.append(w)
        elif t >= s:
            n = max(1, int(math.ceil(len(w) * (t - s) / max(0.05, e - s))))
            out.append(w[:n])
            break
        else:
            break
    return " ".join(out)


def nwords(L, t):
    return sum(1 for s, e in L["t"] if t >= s)


def word_t(L, frag):
    """Startzeit des ersten Worts, das frag enthält."""
    for w, (s, e) in zip(L["words"], L["t"]):
        if frag.lower() in w.lower():
            return s
    return L["s"]


def wrap(text, font, width):
    lines, cur = [], ""
    for w in text.split(" "):
        test = (cur + " " + w).strip()
        if font.getlength(test) <= width or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def wrap_full(L, t, font, width, typed=True):
    """Umbruch nach der ganzen Zeile, damit Wörter nicht springen."""
    full = wrap(L["text"].replace(" – ", " – "), font, width)
    part = shown(L, t, typed)
    out, n = [], len(part)
    pos = 0
    for fl in full:
        if pos >= n:
            break
        out.append(part[pos:pos + len(fl)])
        pos += len(fl) + 1
    return out, len(full)


def text(d, xy, s, font, fill, shadow=None, anchor="la", off=1):
    if shadow is not None:
        d.text((xy[0] + off, xy[1] + off), s, font=font, fill=shadow, anchor=anchor)
    d.text(xy, s, font=font, fill=fill, anchor=anchor)


def new(w, h, col=(0, 0, 0), aa=False):
    im = Image.new("RGB", (w, h), col)
    d = ImageDraw.Draw(im)
    if not aa:
        d.fontmode = "1"
    return im, d


# ---------- LUME als Pixelfigur ----------
# h Haar  H Haar dunkel  s Haut  g Brille  e Auge  p Hoodie  P Hoodie dunkel
# a Amulett  l Hose  f Schuh  o Kontur
LUME_ROWS = [
    "....oooo....",
    "...ohhhho...",
    "..ohhhhhho..",
    "..ohhhhhho..",
    ".ohhsssshho.",
    ".ohgegsgeho.",
    ".ohgggsggho.",
    ".ohhssssHho.",
    ".oHhpppphHo.",
    ".oHppaapPHo.",
    ".oHppppPPHo.",
    "..oppppPPo..",
    "..ollllllo..",
    "..oll..llo..",
    "..off..ffo..",
    "............",
]
LUME_WALK = ["..oll..llo..", "..ollo.off..", "..off..ffo.."]
LUME_WALK2 = ["..oll..llo..", "..off.ollo..", "......off..."]

PAL_LUME = dict(h=hx("9ad0f5"), H=hx("6aa6dc"), s=hx("f6d5bd"), g=hx("e9b949"), e=hx("3a2f4a"),
                p=hx("d9b8ef"), P=hx("b28fd6"), a=hx("ffe9a0"), l=hx("5a5f8f"), f=hx("f3f0ff"),
                o=hx("2a2140"))


def pal_friend(i):
    hair = [hx("c96a3b"), hx("3b3b46"), hx("e6c65a"), hx("6b3f7a"), hx("3f8a5a")][i % 5]
    top = [hx("5fae7a"), hx("d9624f"), hx("4f7fd0"), hx("e0a13c"), hx("8a8a99")][i % 5]
    p = dict(PAL_LUME)
    p.update(h=hair, H=mix(hair, (0, 0, 0), .3), g=p["s"], p=top, P=mix(top, (0, 0, 0), .3),
             a=top, l=hx("3d4159"))
    return p


def pal_map(fn):
    return {k: fn(v) for k, v in PAL_LUME.items()}


def sprite(d, x, y, pal, s=1, frame=0, kid=False, flip=False, rows=None):
    """Zeichnet die Figur; (x, y) ist unten Mitte."""
    rows = list(rows or LUME_ROWS)
    if frame == 1:
        rows[12:15] = LUME_WALK
    elif frame == 2:
        rows[12:15] = LUME_WALK2
    if kid:
        rows = rows[:8] + rows[10:15]
    h = len([r for r in rows if r.strip(".")])
    x0 = x - 6 * s
    y0 = y - h * s
    for j, r in enumerate(rows[:h]):
        if flip:
            r = r[::-1]
        for i, c in enumerate(r):
            if c != ".":
                col = pal.get(c)
                if col is not None:
                    d.rectangle([x0 + i * s, y0 + j * s, x0 + i * s + s - 1, y0 + j * s + s - 1], fill=col)


def portrait(d, x, y, s, pal, mood=0):
    """Kleines Porträt, 16x16 Zellen."""
    P = [
        "bbbbhhhhhhhhbbbb",
        "bbbhhhhhhhhhhbbb",
        "bbhhhhhhhhhhhhbb",
        "bhhhhhssssshhhhb",
        "bhhhsssssssshhhb",
        "bhhssssssssssHhb",
        "bhhggggsggggsHhb",
        "bhhgwegsgwegsHhb",
        "bhhggggsggggsHhb",
        "bhhssssssssssHhb",
        "bhHsssmmmssssHhb",
        "bhHhssssssssHHhb",
        "bhHHhppppppHHHhb",
        "bhHHpppaappPHHhb",
        "bhHppppaapppPHhb",
        "bHHppppppppPPHHb",
    ]
    for j, r in enumerate(P):
        for i, c in enumerate(r):
            col = {"b": pal.get("bg"), "w": pal.get("w", (255, 255, 255)), "m": pal.get("m", hx("b9686c"))}.get(c, pal.get(c))
            if mood == 1 and c == "w":
                col = pal["s"]
            if col is not None:
                d.rectangle([x + i * s, y + j * s, x + i * s + s - 1, y + j * s + s - 1], fill=col)


def bevel(d, box, face, light, dark, w=1):
    x0, y0, x1, y1 = box
    d.rectangle(box, fill=face)
    for i in range(w):
        d.line([x0 + i, y0 + i, x1 - i, y0 + i], fill=light)
        d.line([x0 + i, y0 + i, x0 + i, y1 - i], fill=light)
        d.line([x0 + i, y1 - i, x1 - i, y1 - i], fill=dark)
        d.line([x1 - i, y0 + i, x1 - i, y1 - i], fill=dark)
