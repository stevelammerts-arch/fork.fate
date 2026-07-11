import os, sys
from rembg import remove, new_session
from PIL import Image

PUB = "/app/frontend/public"
BAK = "/app/scripts/orig_backup"
os.makedirs(BAK, exist_ok=True)

files = [
    "winter-tree.png","winter-decor.png","spring-tree.png","spring-decor.png",
    "summer-tree.png","summer-decor.png","summer-seagull.png","fall-tree.png",
    "fall-pumpkins.png","fall-jackolanterns.png","summer-sun.png","summer-ball.png",
    "summer-icecream.png","leaf-red.png","leaf-orange.png","leaf-yellow.png",
    "leaf-brown.png","flake-blue.png","flake-white.png","flake-silver.png",
    "blossom-pink.png","blossom-white.png","petal-coral.png",
]

session = new_session("u2net")
for f in files:
    src = os.path.join(PUB, f)
    if not os.path.exists(src):
        print("MISSING", f, flush=True); continue
    bak = os.path.join(BAK, f)
    if not os.path.exists(bak):
        Image.open(src).save(bak)
    im = Image.open(bak).convert("RGBA")
    out = remove(im, session=session, post_process_mask=True)
    out.save(src)
    a0 = sum(1 for c in out.getdata() if c[3] < 10)
    w, h = out.size
    print("DONE", f, "transp%%=%.1f" % (100 * a0 / (w * h)), flush=True)
print("ALL_DONE", flush=True)
