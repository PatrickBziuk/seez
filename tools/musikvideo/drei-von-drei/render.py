"""DREI VON DREI · LUME · Musikvideo. Jedes Bild folgt allein aus der Zeit."""
import sys, subprocess, os
from multiprocessing import Pool
from PIL import Image
import s1, s2, s3
from core import clamp

FPS, W, H, TOTAL = 30, 1920, 1080, 229.0
CUTS = [
    (0.0, s1.scene_gb, 0), (10.6, s1.scene_walk, 0), (20.45, s1.scene_browser, 0), (31.92, s1.scene_tycoon, 0),
    (42.98, s1.scene_colony, 0), (48.85, s2.scene_hook_factory, 0), (78.6, s2.scene_farm, 0), (92.1, s2.scene_blocks, 0),
    (102.85, s2.scene_ascii, 0), (108.6, s2.scene_hook_hex, 0), (130.75, s3.scene_library, 1), (150.6, s3.scene_paper, 1),
    (162.7, s3.scene_box, 0), (173.85, s2.scene_hook_voxel, 0), (205.4, s3.scene_outro, 0),
]


def frame(t):
    i = max(k for k, c in enumerate(CUTS) if t >= c[0])
    t0, fn, smooth = CUTS[i]
    im = fn(t).resize((W, H), Image.BICUBIC if smooth else Image.NEAREST)
    if i > 0:
        a = 1 - (t - t0) / 0.2
        if a > 0:
            col = (16, 22, 56) if fn is s3.scene_outro else (255, 255, 255)
            im = Image.blend(im, Image.new("RGB", (W, H), col), clamp(a) * (1.0 if fn is s3.scene_outro else .75))
    if t > TOTAL - 1.0:
        im = Image.blend(im, Image.new("RGB", (W, H), (0, 0, 0)), clamp((t - TOTAL + 1.0)))
    return im


def part(args):
    idx, f0, f1 = args
    out = f"part{idx}.mp4"
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(frame(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    return out


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "sheet":
        ts = [float(x) for x in sys.argv[2:]]
        cols = 4
        sh = Image.new("RGB", (cols * 480, ((len(ts) + cols - 1) // cols) * 270))
        for i, t in enumerate(ts):
            sh.paste(frame(t).resize((480, 270), Image.BILINEAR), ((i % cols) * 480, (i // cols) * 270))
        sh.save("sheet.png"); sys.exit()
    n = int(TOTAL * FPS); N = 4
    jobs = [(i, n * i // N, n * (i + 1) // N) for i in range(N)]
    with Pool(N) as pool:
        parts = pool.map(part, jobs)
    open("parts.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-i", "parts.txt", "-i", "song.mp3", "-map", "0:v", "-map", "1:a",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-t", str(TOTAL), "-movflags", "+faststart", "DREI_VON_DREI_LUME_1080p.mp4"])
