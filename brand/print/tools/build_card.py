import json, re, pathlib, os
D = json.load(open("card.json"))
FLOOD = os.environ.get("FLOOD", "1") != "0"
SUF = "" if FLOOD else "-stock"
W = json.load(open("wordmark.json"))
INK, COBALT, PAPER, MUTED = "#24292c", "#1f55ff", "#f1f1ec", "#666c70"
LINE = "rgba(36,41,44,0.20)"
FONTS = "../../../public/fonts"

# ---- card geometry, mm ----
TRIM_W, TRIM_H = 85.0, 55.0     # ohprint 글로벌 / OPM
BLEED = 3.0
ART_W, ART_H = TRIM_W + 2*BLEED, TRIM_H + 2*BLEED   # 91 x 61
SAFE = 3.0                       # inside trim
MARGIN = BLEED + 5.0             # 5mm inside trim -> 8mm from artboard edge
MARK_W = 8.5                     # >= 8mm print minimum
GRID = 5.0

def mark(x, y, w, ink=INK, accent=COBALT):
    u = w/72.0
    return (f'<rect x="{x:.3f}" y="{y:.3f}" width="{22*u:.3f}" height="{88*u:.3f}" fill="{ink}"/>'
            f'<rect x="{x+34*u:.3f}" y="{y:.3f}" width="{4*u:.3f}" height="{88*u:.3f}" fill="{accent}"/>'
            f'<rect x="{x+50*u:.3f}" y="{y:.3f}" width="{22*u:.3f}" height="{88*u:.3f}" fill="{ink}"/>')

def wordmark(x, baseline, size_px_to_mm, ink=INK, accent=COBALT):
    """size_px_to_mm scales the 58px design space into mm."""
    out = []
    for i, g in enumerate(W["glyphs"]):
        fill = ink if i < W["split"] else accent
        s = g["s"] * size_px_to_mm
        out.append(f'<path transform="translate({x + g["x"]*size_px_to_mm:.4f} {baseline:.4f}) '
                   f'scale({s:.6f} {-s:.6f})" fill="{fill}" d="{g["d"]}"/>')
    return "".join(out)

def lockup(x, y, mark_w, ink=INK, accent=COBALT):
    """horizontal lockup: mark 0-72u, wordmark at 94u. Returns svg + total width."""
    u = mark_w/72.0
    k = u                                   # design px -> mm
    cap = W["cap_px"]*k
    base = y + (88*u + cap)/2               # optically centre caps against the mark
    total = (94 + W["wordmark_width"])*u
    return mark(x, y, mark_w, ink, accent) + wordmark(x + 94*u, base, k, ink, accent), total, 88*u

def grid(op=0.55):
    """Hairline graph-paper texture, the print analogue of the 76px web grid.
    0.1mm at 20% ink x op -> roughly a 10% tint, which digital presses hold."""
    n_v = int(ART_W/GRID)+1; n_h = int(ART_H/GRID)+1
    ls = []
    for i in range(n_v):
        ls.append(f'<line x1="{i*GRID}" y1="0" x2="{i*GRID}" y2="{ART_H}"/>')
    for i in range(n_h):
        ls.append(f'<line x1="0" y1="{i*GRID}" x2="{ART_W}" y2="{i*GRID}"/>')
    return (f'<g stroke="{LINE}" stroke-width="0.1" opacity="{op}">' + "".join(ls) + "</g>")

PAPERBG = PAPER if FLOOD else "transparent"
CSS = f"""
@font-face{{font-family:'Hahmlet';src:url('{FONTS}/Hahmlet-Variable.ttf')format('truetype');font-weight:100 900;}}
@font-face{{font-family:'SUIT';src:url('{FONTS}/SUIT-Variable.woff2')format('woff2');font-weight:100 900;}}
@font-face{{font-family:'Jost';src:url('{FONTS}/Jost-Variable.ttf')format('truetype');font-weight:100 900;}}
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:{ART_W}mm {ART_H}mm;margin:0}}
html,body{{width:{ART_W}mm;height:{ART_H}mm}}
.card{{position:relative;width:{ART_W}mm;height:{ART_H}mm;background:{PAPERBG};overflow:hidden}}
svg.bg{{position:absolute;inset:0;width:{ART_W}mm;height:{ART_H}mm}}
.l{{position:absolute}}
.name{{font-family:'Hahmlet',serif;font-weight:590;font-size:4.4mm;color:{INK};
      letter-spacing:-0.015em;line-height:1}}
.ko{{font-family:'SUIT',sans-serif;font-weight:450;font-size:2.4mm;color:{MUTED};
      letter-spacing:0.02em;line-height:1}}
.role{{font-family:'SUIT',sans-serif;font-weight:640;font-size:1.95mm;color:{INK};
      letter-spacing:0.14em;text-transform:uppercase;line-height:1}}
.c{{font-family:'SUIT',sans-serif;font-weight:450;font-size:2.3mm;color:{INK};line-height:1;
      font-variant-numeric:tabular-nums;text-align:right}}
.c.m{{color:{MUTED}}}
.tag{{font-family:'Hahmlet',serif;font-weight:600;font-size:5.0mm;color:{INK};letter-spacing:-0.015em}}
.tag em{{font-style:normal;color:{COBALT}}}
.rule{{position:absolute;background:{LINE};height:0.15mm}}
"""

def page(body, extra=""):
    return (f"<!doctype html><meta charset='utf-8'><style>{CSS}{extra}</style>"
            f"<div class='card'>{body}</div>")

# ---------- FRONT ----------
# The front carries information only. No grid: the paper stock supplies the warmth
# that the 76px hairline grid supplies on screen, so printing one here is decoration.
LK_Y = 11.0
lk, lkw, lkh = lockup(MARGIN, LK_Y, MARK_W)
RX = ART_W - MARGIN                      # right column edge
Y_NAME, Y_KO, Y_ROLE = 40.0, 45.4, 49.8  # baseline-top anchors, mm from artboard top
front = page(
    f"<svg class='bg' viewBox='0 0 {ART_W} {ART_H}'>{lk}</svg>"
    f"<div class='l name' style='left:{MARGIN}mm;top:{Y_NAME}mm'>{D['name_en']}</div>"
    f"<div class='l ko'   style='left:{MARGIN}mm;top:{Y_KO}mm'>{D['name_ko']}</div>"
    f"<div class='l role' style='left:{MARGIN}mm;top:{Y_ROLE}mm'>{D['role']}</div>"
    f"<div class='l c'    style='right:{ART_W-RX}mm;top:{Y_KO}mm'>{D['email']}</div>"
    + (f"<div class='l c m' style='right:{ART_W-RX}mm;top:{Y_ROLE}mm'>{D['phone']}</div>"
       f"<div class='l c m' style='right:{ART_W-RX}mm;top:{Y_ROLE+4.2}mm'>{D['web']}</div>"
       if D['phone'] else
       f"<div class='l c m' style='right:{ART_W-RX}mm;top:{Y_ROLE}mm'>{D['web']}</div>")
)

# ---------- BACK A : tagline, 'rm' is the one point colour ----------
backA = page(
    f"<svg class='bg' viewBox='0 0 {ART_W} {ART_H}'>{grid()}</svg>"
    f"<div class='l tag' style='left:{MARGIN}mm;top:50%;transform:translateY(-50%)'>"
    f"sudo <em>rm</em> the boring parts.</div>"
)

# ---------- BACK B : mark alone, kit-strict ----------
bmw = 13.0
u = bmw/72.0
bx, by = (ART_W-bmw)/2, (ART_H-88*u)/2
backB = page(
    f"<svg class='bg' viewBox='0 0 {ART_W} {ART_H}'>{grid()}{mark(bx,by,bmw)}</svg>"
)

pathlib.Path("out/namecard").mkdir(parents=True, exist_ok=True)
for fn, html in [(f"front{SUF}.html", front), (f"back-a{SUF}.html", backA), (f"back-b{SUF}.html", backB)]:
    open(f"out/namecard/{fn}", "w").write(html)
    print(" wrote", fn)
print(f"\nartboard {ART_W} x {ART_H} mm  (trim {TRIM_W} x {TRIM_H}, bleed {BLEED})")
print(f"lockup {lkw:.2f} x {lkh:.2f} mm   mark {MARK_W} mm wide (min 8)")
