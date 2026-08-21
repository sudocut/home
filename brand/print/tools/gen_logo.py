import json, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

INK, COBALT, PAPER = "#24292c", "#1f55ff", "#f1f1ec"
JOST = "../../../public/fonts/Jost-Variable.ttf"

def load(path, wght):
    inst = instantiateVariableFont(TTFont(path), {"wght": wght}, inplace=False)
    return inst, inst.getGlyphSet(), inst.getBestCmap(), inst['head'].unitsPerEm, inst['hmtx']

inst, gs, cmap, upem, hmtx = load(JOST, 400)
CAP = inst['OS/2'].sCapHeight
DESC = abs(inst['hhea'].descent)

def layout(text, size, track):
    scale = size / upem
    items, x = [], 0.0
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs); gs[g].draw(pen)
        items.append((ch, pen.getCommands(), x, scale))
        x += hmtx[g][0] * scale + track
    return items, x - track

SIZE, TRACK = 58.0, -1.6
GLYPHS, WW = layout("sudocut", SIZE, TRACK)
CAP_PX = CAP * SIZE / upem
DESC_PX = DESC * SIZE / upem
SPLIT = 4  # "sudo" | "cut"

def word_svg(baseline_y, x0, ink=INK, accent=COBALT):
    out = []
    for i, (ch, d, x, s) in enumerate(GLYPHS):
        fill = ink if i < SPLIT else accent
        out.append(f'    <path transform="translate({x0+x:.3f} {baseline_y}) scale({s:.6f} {-s:.6f})" '
                   f'fill="{fill}" d="{d}"/>')
    return "\n".join(out)

def mark_svg(x0, y0, w, ink=INK, accent=COBALT):
    u = w / 72.0
    h = 88 * u
    return "\n".join([
        f'    <rect x="{x0:.3f}" y="{y0:.3f}" width="{22*u:.3f}" height="{h:.3f}" fill="{ink}"/>',
        f'    <rect x="{x0+34*u:.3f}" y="{y0:.3f}" width="{4*u:.3f}" height="{h:.3f}" fill="{accent}"/>',
        f'    <rect x="{x0+50*u:.3f}" y="{y0:.3f}" width="{22*u:.3f}" height="{h:.3f}" fill="{ink}"/>',
    ])

HDR = ('<?xml version="1.0" encoding="UTF-8"?>\n'
       "<!--\n  SudoCut {name}.\n"
       "  Geometry: unit x = bar/22; bar 22x, gap 12x, line 4x; 72x wide, 88x tall.\n"
       "  Clear space 22x on all four sides. Minimum 8mm wide in print.\n"
       "  Wordmark: Jost 400, tracking -1.6 at 58px, CONVERTED TO OUTLINES -\n"
       "  no font is required to render this file.\n"
       "  Colors are literal hex for print. Ink {ink} / cobalt {cobalt}.\n-->\n")

os.makedirs("out/logo", exist_ok=True)

def write(fn, name, vb, body):
    w, h = vb[2], vb[3]
    svg = (HDR.format(name=name, ink=INK, cobalt=COBALT) +
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb[2]:.3f} {vb[3]:.3f}" '
           f'width="{w:.3f}" height="{h:.3f}" role="img" aria-label="SudoCut">\n'
           f'  <title>SudoCut</title>\n{body}\n</svg>\n')
    open(f"out/logo/{fn}", "w").write(svg)
    print(f"  {fn}  {w:.2f} x {h:.2f}")

# 1. mark alone
write("mark.svg", "mark - the cut point", (0,0,72,88), mark_svg(0,0,72))
# 2. mark, single ink
write("mark-mono.svg", "mark, single ink", (0,0,72,88), mark_svg(0,0,72,ink=INK,accent=INK))
# 3. wordmark alone
write("wordmark.svg", "wordmark, outlined", (0,0,WW,CAP_PX+DESC_PX), word_svg(CAP_PX, 0))
# 4. horizontal lockup: mark 0-72, wordmark at 94 (72 + 22 clear space)
X0 = 94.0
base = 88 - (88 - CAP_PX)/2          # optically centre caps against the 88-tall mark
write("lockup-horizontal.svg", "primary lockup, horizontal", (0,0,X0+WW,88),
      mark_svg(0,0,72) + "\n" + word_svg(base, X0))
# 5. stacked lockup
mx = (WW - 72)/2
sb = 88 + 22 + CAP_PX
write("lockup-stacked.svg", "stacked lockup", (0,0,WW,sb+DESC_PX),
      mark_svg(mx,0,72) + "\n" + word_svg(sb, 0))
# 6. reversed on ink
write("lockup-horizontal-reversed.svg", "primary lockup, reversed on ink", (0,0,X0+WW,88),
      mark_svg(0,0,72,ink=PAPER) + "\n" + word_svg(base, X0, ink=PAPER))

json.dump({"wordmark_width": WW, "cap_px": CAP_PX, "desc_px": DESC_PX,
           "glyphs": [{"ch":c,"d":d,"x":x,"s":s} for c,d,x,s in GLYPHS], "split": SPLIT},
          open("wordmark.json","w"))
print(f"\ncap={CAP_PX:.2f} desc={DESC_PX:.2f} wordmark_width={WW:.2f}")
