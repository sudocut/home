import json, os, segno
D = json.load(open("card.json"))
INK, COBALT, PAPER, PANEL = "#24292c", "#1f55ff", "#f1f1ec", "#fbfaf5"
RED, YELLOW = "#ff3b2f", "#ffd523"
FONTS = "../../../public/fonts"

TRIM_W, TRIM_H, BLEED = 85.0, 55.0, 3.0
ART_W, ART_H = TRIM_W + 2*BLEED, TRIM_H + 2*BLEED
MARGIN = BLEED + 5.0
URL = "https://www.sudo-cut.com/"

# ---- QR ----
qr = segno.make(URL, error="q")          # Q = 25% recovery, survives a scuffed card
mat = [list(r) for r in qr.matrix]
N = len(mat)
QUIET = 4
MODULE = 0.55                            # mm — above the 0.5mm print floor for reliable scanning
QR_SIDE = (N + 2*QUIET) * MODULE
print(f"QR: version={qr.version} {N}x{N} modules, module={MODULE}mm, tile={QR_SIDE:.2f}mm")

QR_X = ART_W - MARGIN - QR_SIDE
QR_Y = (ART_H - QR_SIDE)/2 + 2.0

def qr_svg(x, y):
    out = [f'<rect x="{x:.3f}" y="{y:.3f}" width="{QR_SIDE:.3f}" height="{QR_SIDE:.3f}" fill="{PANEL}"/>']
    ox, oy = x + QUIET*MODULE, y + QUIET*MODULE
    # merge horizontal runs into single rects: fewer objects, crisper RIP output
    for r in range(N):
        c = 0
        while c < N:
            if mat[r][c]:
                s = c
                while c < N and mat[r][c]: c += 1
                out.append(f'<rect x="{ox+s*MODULE:.3f}" y="{oy+r*MODULE:.3f}" '
                           f'width="{(c-s)*MODULE:.3f}" height="{MODULE:.3f}" fill="{INK}"/>')
            else:
                c += 1
    return "".join(out)

def grid(pitch=5.0):
    ls = []
    n_v, n_h = int(ART_W/pitch)+1, int(ART_H/pitch)+1
    for i in range(n_v): ls.append(f'<line x1="{i*pitch}" y1="0" x2="{i*pitch}" y2="{ART_H}"/>')
    for i in range(n_h): ls.append(f'<line x1="0" y1="{i*pitch}" x2="{ART_W}" y2="{i*pitch}"/>')
    return f'<g stroke="{INK}" stroke-width="0.1" opacity="0.30">' + "".join(ls) + "</g>"

# shapes, quoting the live poster: cobalt disc, red bar, panel square
DISC_R = 13.5
shapes = (
  f'<circle cx="{MARGIN+3.0:.2f}" cy="{ART_H+4.0:.2f}" r="{DISC_R}" fill="{COBALT}"/>'
  f'<g transform="rotate(-24 {MARGIN+10:.2f} {ART_H-11:.2f})">'
  f'<rect x="{MARGIN-4:.2f}" y="{ART_H-13.4:.2f}" width="30" height="4.6" fill="{RED}" '
  f'stroke="{INK}" stroke-width="0.4"/></g>'
)

CSS = f"""
@font-face{{font-family:'Jost';src:url('{FONTS}/Jost-Variable.ttf')format('truetype');font-weight:100 900;}}
@font-face{{font-family:'SUIT';src:url('{FONTS}/SUIT-Variable.woff2')format('woff2');font-weight:100 900;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:{ART_W}mm {ART_H}mm;margin:0}}
html,body{{width:{ART_W}mm;height:{ART_H}mm}}
.card{{position:relative;width:{ART_W}mm;height:{ART_H}mm;background:{YELLOW};overflow:hidden}}
svg.bg{{position:absolute;inset:0;width:{ART_W}mm;height:{ART_H}mm}}
.l{{position:absolute}}
.head{{font-family:'Jost',sans-serif;font-weight:820;font-size:6.6mm;line-height:.88;
      letter-spacing:-0.06em;color:{INK};text-transform:uppercase}}
.head b{{font-weight:820;color:{COBALT}}}
.kick{{font-family:'SUIT',sans-serif;font-weight:640;font-size:1.85mm;letter-spacing:0.15em;
      text-transform:uppercase;color:{INK}}}
.url{{font-family:'SUIT',sans-serif;font-weight:600;font-size:1.95mm;letter-spacing:0.06em;
      color:{INK};text-align:center;width:{QR_SIDE}mm}}
"""

body = (f"<svg class='bg' viewBox='0 0 {ART_W} {ART_H}'>{grid()}{shapes}{qr_svg(QR_X, QR_Y)}</svg>"
        f"<div class='l kick' style='left:{MARGIN}mm;top:{MARGIN+1.0}mm'>Less footage. More story.</div>"
        f"<div class='l head' style='left:{MARGIN}mm;top:{MARGIN+5.4}mm'>Remove the<br><b>Boring parts.</b></div>"
        f"<div class='l url'  style='left:{QR_X}mm;top:{QR_Y+QR_SIDE+1.3}mm'>sudo-cut.com</div>")

html = f"<!doctype html><meta charset='utf-8'><style>{CSS}</style><div class='card'>{body}</div>"
os.makedirs("out/namecard", exist_ok=True)
open("out/namecard/back-c.html","w").write(html)
print(f"QR tile at x={QR_X:.2f} y={QR_Y:.2f}  (safe area ends x={ART_W-BLEED-3:.2f})")
print("wrote back-c.html")
