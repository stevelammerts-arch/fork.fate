import numpy as np
from PIL import Image
from scipy import ndimage

def dechecker(inp, outp):
    im = Image.open(inp).convert("RGBA")
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    diff = mx - mn
    checker = (diff <= 18) & (mx >= 158)
    lbl, n = ndimage.label(checker)
    h, w = checker.shape
    border_ids = set(np.unique(np.concatenate([
        lbl[0, :], lbl[-1, :], lbl[:, 0], lbl[:, -1]])))
    border_ids.discard(0)
    # component sizes; remove border-connected OR sizeable enclosed neutral gaps
    sizes = ndimage.sum(np.ones_like(lbl), lbl, index=np.arange(1, n + 1))
    remove_ids = set(int(i + 1) for i, s in enumerate(sizes) if s >= 250)
    remove_ids |= {int(i) for i in border_ids}
    bg = np.isin(lbl, list(remove_ids))
    alpha = a[..., 3].astype(np.float32)
    alpha[bg] = 0
    grow = ndimage.binary_dilation(bg, iterations=2) & ~bg
    halo = grow & (diff <= 26) & (mx >= 150)
    alpha[halo] = alpha[halo] * 0.25
    alpha = alpha.clip(0, 255)
    out = np.stack([r, g, b, alpha.astype(np.int16)], -1).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(outp)
    a0 = int((out[..., 3] < 10).sum())
    print("DECHECK", outp, "transp%%=%.1f" % (100 * a0 / (w * h)), flush=True)

BAK = "/app/scripts/orig_backup"
PUB = "/app/frontend/public"
for name in ["fall-tree.png", "spring-tree.png", "summer-tree.png"]:
    dechecker(f"{BAK}/{name}", f"{PUB}/{name}")
print("DONE", flush=True)
