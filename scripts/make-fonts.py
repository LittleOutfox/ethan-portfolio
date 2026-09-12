"""Instances and subsets the self-hosted fonts to exactly what the page uses.

Requires: pip install fonttools brotli
Run from the repo root after `npm install`: python scripts/make-fonts.py
"""
import subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules" / "@fontsource-variable"
OUT = ROOT / "public" / "fonts"
UNICODES = "U+0000-00FF,U+2010-2027,U+2030-205E,U+2212,U+2215,U+00D7,U+2192,U+2197,U+FEFF,U+FFFD"

# (source file, output name, axis limits): a range keeps a partial variable font, a single
# value makes a static instance
FONTS = [
    ("newsreader/files/newsreader-latin-standard-normal.woff2", "newsreader.woff2", ["wght=400:520", "opsz=6:72"]),
    ("newsreader/files/newsreader-latin-wght-italic.woff2", "newsreader-italic.woff2", ["wght=400"]),
    ("schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2", "schibsted-grotesk-wght.woff2", ["wght=400:500"]),
    ("azeret-mono/files/azeret-mono-latin-wght-normal.woff2", "azeret-mono-wght.woff2", ["wght=400"]),
]

def run(*args):
    subprocess.run([sys.executable, "-m", *args], check=True)

with tempfile.TemporaryDirectory() as tmp:
    for src, name, axes in FONTS:
        inst = Path(tmp) / (name + ".ttf")
        run("fontTools.varLib.instancer", str(SRC / src), *axes, "-o", str(inst))
        run("fontTools.subset", str(inst), f"--unicodes={UNICODES}", "--layout-features=*", "--flavor=woff2", "--no-hinting", f"--output-file={OUT / name}")
        print(name, (OUT / name).stat().st_size, "bytes")
