import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 511
CX = 640
CELL_W, CELL_H = 8, 11
GOLD_RGB = (250, 204, 21)

img = Image.new('RGB', (W, H), (0, 0, 0))
draw = ImageDraw.Draw(img)

# 1. Background binary rain
random.seed(42)
font_mono = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 10)

for x in range(4, W, 16):
    col_y = random.uniform(0, H)
    col_len = random.randint(6, 22)
    for i in range(col_len):
        y = int(col_y - i * CELL_H)
        if 0 <= y < H:
            alpha = (0.28 if i == 0 else 0.14) * (1.0 - i / col_len)
            c = (int(GOLD_RGB[0] * alpha), int(GOLD_RGB[1] * alpha), int(GOLD_RGB[2] * alpha))
            ch = '1' if random.random() < 0.5 else '0'
            draw.text((x, y), ch, font=font_mono, fill=c)

# 2. Robot Silhouette mask
sil = Image.new('L', (W, H), 0)
sil_draw = ImageDraw.Draw(sil)
def rrect(d, xy, r, fill=255): d.rounded_rectangle(xy, radius=r, fill=fill)

rrect(sil_draw, [540, 70, 740, 230], 40)    # head
rrect(sil_draw, [522, 120, 544, 180], 8)    # left ear
rrect(sil_draw, [736, 120, 758, 180], 8)    # right ear
sil_draw.rectangle([636, 34, 644, 72], fill=255) # antenna stem
sil_draw.ellipse([628, 14, 652, 38], fill=255)   # antenna ball
sil_draw.rectangle([612, 226, 668, 256], fill=255) # neck
rrect(sil_draw, [498, 252, 782, 530], 46)  # torso
sil_draw.rectangle([478, 272, 522, 310], fill=255) # left shoulder
sil_draw.rectangle([758, 272, 802, 310], fill=255) # right shoulder
rrect(sil_draw, [436, 268, 492, 438], 26)  # left arm
rrect(sil_draw, [788, 268, 844, 438], 26)  # right arm
sil_draw.ellipse([436, 424, 492, 480], fill=255) # left hand
sil_draw.ellipse([788, 424, 844, 480], fill=255) # right hand

# Details mask
det = Image.new('L', (W, H), 0)
det_draw = ImageDraw.Draw(det)
det_draw.rounded_rectangle([562, 118, 718, 186], radius=30, outline=255, width=3) # visor
det_draw.rounded_rectangle([560, 300, 720, 412], radius=18, outline=255, width=3) # chest panel
det_draw.ellipse([614, 330, 666, 382], outline=255, width=3) # chest core ring
det_draw.line([498, 446, 782, 446], fill=255, width=3) # belt
det_draw.line([436, 352, 492, 352], fill=255, width=3) # left elbow
det_draw.line([788, 352, 844, 352], fill=255, width=3) # right elbow
det_draw.line([612, 240, 668, 240], fill=255, width=3) # neck ring
det_draw.line([604, 207, 676, 207], fill=255, width=4)
for mx in range(614, 667, 13):
    det_draw.line([mx, 200, mx, 214], fill=255, width=2)

visor = Image.new('L', (W, H), 0)
ImageDraw.Draw(visor).rounded_rectangle([562, 118, 718, 186], radius=30, fill=255)

# 3. Draw Robot matrix code digits
draw_robot = ImageDraw.Draw(img)
for gy in range(0, H, CELL_H):
    for gx in range(0, W, CELL_W):
        sx, sy = gx + CELL_W // 2, gy + CELL_H // 2
        if sx >= W or sy >= H: continue
        if sil.getpixel((sx, sy)) < 128: continue

        is_edge = (
            sil.getpixel((max(0, sx - CELL_W), sy)) < 128 or
            sil.getpixel((min(W - 1, sx + CELL_W), sy)) < 128 or
            sil.getpixel((sx, max(0, sy - CELL_H))) < 128 or
            sil.getpixel((sx, min(H - 1, sy + CELL_H))) < 128
        )
        is_detail = det.getpixel((sx, sy)) > 60
        in_visor = visor.getpixel((sx, sy)) > 128

        if is_edge or is_detail:
            alpha = 0.95
        elif in_visor:
            alpha = 0.12
        else:
            horiz = 1.0 - min(1.0, abs(sx - CX) / 300.0)
            vert = 1.0 - min(1.0, (sy - 40) / 470.0)
            alpha = 0.22 + 0.25 * horiz + 0.14 * vert + random.uniform(0.0, 0.1)

        alpha = min(1.0, alpha)
        color = (int(GOLD_RGB[0] * alpha), int(GOLD_RGB[1] * alpha), int(GOLD_RGB[2] * alpha))
        ch = '1' if random.random() < 0.5 else '0'
        draw_robot.text((gx + 1, gy), ch, font=font_mono, fill=color)

# 4. Glowing Eyes, Antenna & Chest Core
glow_el = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_el_draw = ImageDraw.Draw(glow_el)
for ex in [598, 682]:
    glow_el_draw.ellipse([ex - 20, 152 - 18, ex + 20, 152 + 18], fill=(250, 204, 21, 255))
    glow_el_draw.ellipse([ex - 8, 152 - 8, ex + 4, 152 + 4], fill=(255, 250, 225, 255)) # highlight

glow_el_draw.ellipse([640 - 10, 26 - 10, 640 + 10, 26 + 10], fill=(250, 204, 21, 255)) # antenna
glow_el_draw.ellipse([640 - 15, 356 - 15, 640 + 15, 356 + 15], fill=(250, 204, 21, 230)) # core

b1 = glow_el.filter(ImageFilter.GaussianBlur(radius=16))
b2 = glow_el.filter(ImageFilter.GaussianBlur(radius=6))
img.paste(b1, (0, 0), b1)
img.paste(b2, (0, 0), b2)
img.paste(glow_el, (0, 0), glow_el)

img.save('home-hero.jpg', 'JPEG', quality=98)
print("home-hero.jpg saved successfully without text.")
