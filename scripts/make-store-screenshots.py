#!/usr/bin/env python3
"""
스토어 제출용 스크린샷 합성기.

기기 캡처(1080×2400 등)를 그대로 올리면 Play 가 "자르기 필요"로 거부한다.
⚠️ 그래서 처음부터 9:16(1080×1920) 캔버스에 마케팅 프레임을 얹어 만든다.
   (배포 플레이북 6번 — 실제로 가장 많이 걸린 함정)

입력 : scripts/screenshot-src/*.png  (기기 원본 캡처)
출력 : store-assets/screenshots/android/*.png  (1080×1920)
       store-assets/screenshots/ios-6.9/*.png  (1320×2868)

재생성: python3 scripts/make-store-screenshots.py
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "screenshot-src")
OUT_A = os.path.join(ROOT, "store-assets", "screenshots", "android")
OUT_I = os.path.join(ROOT, "store-assets", "screenshots", "ios-6.9")

# ── 브랜드 컬러 ───────────────────────────────────────────────────────────
CREAM = (250, 248, 244)
SURFACE = (245, 242, 235)
PRIMARY = (107, 82, 0)
TEXT = (28, 26, 23)
MUTED = (94, 87, 79)

KR_BOLD = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# 각 화면의 헤드라인 — 한 줄에 하나씩
SLIDES = [
    ("s1-home.png",      "읽은 것을 잊지 않게",        "감정과 문장을 함께 남기는 독서 기록"),
    ("s3-journal.png",   "6단계 가이드가\n대신 물어봅니다", "무엇을 써야 할지 막막하지 않게"),
    ("s2-explore.png",   "오늘 읽을 책을 고르고",      "바로 기록으로 이어지게"),
    ("s5-wordcloud.png", "내 독서의 언어",            "자주 쓴 단어로 보는 나의 취향"),
    ("s4-map.png",       "감정으로 다시 찾는 책",      "무슨 기분이었는지로 기억하기"),
]


def font(size, index=1):
    """AppleSDGothicNeo.ttc — index 1 이 Bold 계열."""
    try:
        return ImageFont.truetype(KR_BOLD, size, index=index)
    except Exception:
        return ImageFont.truetype(KR_BOLD, size)


def rounded(img, radius):
    """이미지에 둥근 모서리 마스크 적용."""
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0], img.size[1]], radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def shadow_behind(canvas, box, radius, blur=28, alpha=52):
    """기기 이미지 뒤에 부드러운 그림자."""
    x, y, w, h = box
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle([x, y + 10, x + w, y + h + 10], radius, fill=(0, 0, 0, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(layer)


def gradient_bg(size):
    """크림 → 살짝 더 진한 크림 세로 그라디언트."""
    w, h = size
    g = Image.new("RGB", (1, h))
    px = g.load()
    for y in range(h):
        f = y / max(1, h - 1)
        px[0, y] = tuple(round(CREAM[i] + (SURFACE[i] - CREAM[i]) * f) for i in range(3))
    return g.resize(size, Image.BILINEAR).convert("RGBA")


def draw_multiline_centered(d, text, fnt, fill, cx, top, line_gap):
    """여러 줄 텍스트를 가운데 정렬로 그리고, 마지막 y 를 돌려준다."""
    y = top
    for line in text.split("\n"):
        l, t, r, b = d.textbbox((0, 0), line, font=fnt)
        d.text((cx - (l + r) / 2, y), line, font=fnt, fill=fill)
        y += (b - t) + line_gap
    return y


def compose(shot_path, title, subtitle, canvas_size):
    W, H = canvas_size
    scale = W / 1080  # 1080 기준으로 디자인한 값을 다른 해상도로 환산

    canvas = gradient_bg((W, H))
    d = ImageDraw.Draw(canvas)

    # ── 헤드라인 ──
    f_title = font(int(62 * scale), index=1)
    f_sub = font(int(30 * scale), index=0)

    y = draw_multiline_centered(
        d, title, f_title, TEXT, W / 2, int(120 * scale), int(26 * scale)
    )
    y = draw_multiline_centered(
        d, subtitle, f_sub, MUTED, W / 2, y + int(18 * scale), int(10 * scale)
    )

    # ── 기기 캡처 ──
    shot = Image.open(shot_path).convert("RGB")
    # 상태바(시계/배터리)와 하단 제스처 바는 잘라내 마케팅 이미지답게 정리.
    # ⚠️ 덜 자르면 상태바 아이콘이 잘린 채 남아 지저분해 보인다.
    shot = shot.crop(
        (0, int(shot.height * 0.048), shot.width, int(shot.height * 0.985))
    )

    top = y + int(70 * scale)
    avail_h = H - top - int(90 * scale)
    dev_h = avail_h
    dev_w = int(shot.width * (dev_h / shot.height))
    # 폰 가로폭은 캔버스의 72% — 이보다 좁으면 앱 화면 글씨가 안 읽힌다.
    # (실제 통과한 Voyage 스크린샷과 동일 비율)
    max_w = int(W * 0.72)
    if dev_w > max_w:
        dev_w = max_w
        dev_h = int(shot.height * (dev_w / shot.width))

    shot = shot.resize((dev_w, dev_h), Image.LANCZOS)
    x = (W - dev_w) // 2
    radius = int(34 * scale)

    shadow_behind(canvas, (x, top, dev_w, dev_h), radius)
    canvas.alpha_composite(rounded(shot, radius), (x, top))

    return canvas.convert("RGB")


def main():
    os.makedirs(OUT_A, exist_ok=True)
    os.makedirs(OUT_I, exist_ok=True)

    for i, (fname, title, sub) in enumerate(SLIDES, start=1):
        src = os.path.join(SRC, fname)
        if not os.path.exists(src):
            print(f"  !! 원본 없음: {fname}")
            continue

        # Android — ⚠️ 반드시 9:16 (1080×1920)
        a = compose(src, title, sub, (1080, 1920))
        pa = os.path.join(OUT_A, f"{i:02d}.png")
        a.save(pa, "PNG")

        # iOS 6.9" — 1320×2868 (iPhone 16 Pro Max)
        # ⚠️ App Store Connect 는 6.9" 를 요구하고 나머지 크기는 이걸로 자동 축소한다.
        #    6.7"(1290×2796) 로 만들면 6.9" 칸을 채우지 못한다.
        b = compose(src, title, sub, (1320, 2868))
        pb = os.path.join(OUT_I, f"{i:02d}.png")
        b.save(pb, "PNG")

        print(f"  {i:02d}  {title.splitlines()[0]:<18} → android {a.size}  ios {b.size}")


if __name__ == "__main__":
    main()
    print("\n⚠️ Play Console 업로드 후 '용도' 드롭다운에서 '9:16 세로 모드'를 정확히 고를 것.")
