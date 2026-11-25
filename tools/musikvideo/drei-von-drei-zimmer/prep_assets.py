"""Schneidet Lumes Figurenblätter (Notion) in einzelne Ausschnitte mit Transparenz."""
from PIL import Image
import numpy as np
from scipy import ndimage
A = "assets/"; O = "tex/"
import os; os.makedirs(O, exist_ok=True)

def trim(im, pad=6):
    a = np.array(im)[..., 3] > 24
    ys, xs = np.where(a)
    return im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad)))

def save(im, name, h=None):
    im = trim(im)
    if h and im.height > h:
        im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    im.save(O + name + ".png"); print(name, im.size)

s1 = Image.open(A + "lume-01.png").convert("RGBA")
save(s1.crop((0, 0, 768, 1024)), "front", 1000); save(s1.crop((768, 0, 1536, 1024)), "back", 1000)
save(Image.open(A + "lume-02.png").convert("RGBA"), "side", 1000)
save(Image.open(A + "lume-03.png").convert("RGBA"), "hold", 1000)
s4 = Image.open(A + "lume-04.png").convert("RGBA")
for i, (x, y) in enumerate([(0, 0), (768, 0), (0, 512), (768, 512)]):
    save(s4.crop((x, y, x + 768, y + 512)), f"face{i}", 700)
s5 = Image.open(A + "lume-05.png").convert("RGBA")
a = np.array(s5)[..., 3] > 40
lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
objs = ndimage.find_objects(lab)
k = 0
for i, sl in enumerate(objs):
    h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
    if h * w < 20000: continue
    im = s5.crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    m = Image.fromarray(((lab[sl] == i + 1) * 255).astype("uint8"))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m)
    print("prop", k, sl[1].start, sl[0].start, w, h); save(out, f"prop{k}", 700); k += 1

def rows(im, name, minh=80):
    """Teilt ein Blatt an leeren Zeilen."""
    a = (np.array(im)[..., 3] > 40).sum(axis=1) > 3
    segs, start = [], None
    for y, v in enumerate(a):
        if v and start is None: start = y
        if not v and start is not None:
            if y - start > minh: segs.append((start, y))
            start = None
    if start is not None: segs.append((start, len(a)))
    for i, (y0, y1) in enumerate(segs):
        save(im.crop((0, y0, im.width, y1)), f"{name}{i}", 600)
rows(Image.open(O + "prop0.png"), "p0_"); rows(Image.open(O + "prop1.png"), "p1_")
