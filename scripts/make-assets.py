#!/usr/bin/env python3
"""
Butter 앱 아이콘 / 스플래시 소스 이미지 생성기.

@capacitor/assets 가 읽는 assets/*.png 와,
스토어 제출용 store-assets/*.png 를 만든다.

재생성:  python3 scripts/make-assets.py && npm run assets
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
STORE = os.path.join(ROOT, "store-assets")

# ── 브랜드 컬러 (src/index.css 의 archivist 테마와 일치) ──────────────────
CREAM = (250, 248, 244)       # 아이콘 글자·배너 텍스트용 (브랜드 크림)
WHITE = (255, 255, 255)       # 스플래시 배경 — 기본 테마(브루탈리스트)와 맞춤
PRIMARY = (107, 82, 0)        # --color-butter-primary #6b5200
GOLD_TOP = (125, 95, 0)       # 아이콘 배경 그라디언트 상단
GOLD_BOTTOM = (92, 70, 0)     # 아이콘 배경 그라디언트 하단

SERIF_ITALIC = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
SERIF_BOLD_ITALIC = "/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def draw_centered(img, text, fnt, fill, cx=None, cy=None, optical_dy=0.0):
    """글자를 잉크 경계(bounding box) 기준으로 정확히 중앙 정렬."""
    d = ImageDraw.Draw(img)
    cx = img.width / 2 if cx is None else cx
    cy = img.height / 2 if cy is None else cy
    l, t, r, b = d.textbbox((0, 0), text, font=fnt)
    x = cx - (l + r) / 2
    y = cy - (t + b) / 2 + optical_dy * img.height
    d.text((x, y), text, font=fnt, fill=fill)
    return img


def vertical_gradient(size, top, bottom):
    img = Image.new("RGB", (1, size[1]))
    px = img.load()
    for y in range(size[1]):
        f = y / max(1, size[1] - 1)
        px[0, y] = tuple(round(top[i] + (bottom[i] - top[i]) * f) for i in range(3))
    return img.resize(size, Image.BILINEAR)


# ── 1) 앱 아이콘 (풀블리드, 알파 없음) ────────────────────────────────────
def make_icon(size=1024):
    """골드 그라디언트 배경 + 크림색 세리프 이탤릭 B."""
    img = vertical_gradient((size, size), GOLD_TOP, GOLD_BOTTOM)
    fnt = font(SERIF_ITALIC, int(size * 0.62))
    # 이탤릭 'B' 는 시각 무게중심이 살짝 위쪽이라 아래로 미세 보정
    draw_centered(img, "B", fnt, CREAM, optical_dy=0.012)
    return img


# ── 2) 적응형 아이콘 (Android) ───────────────────────────────────────────
def make_icon_background(size=1024):
    return vertical_gradient((size, size), GOLD_TOP, GOLD_BOTTOM)


def make_icon_foreground(size=1024):
    """⚠️ Android 적응형 아이콘은 바깥 33% 가 잘림 → 가운데 66% 안에만 그림."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fnt = font(SERIF_ITALIC, int(size * 0.40))
    draw_centered(img, "B", fnt, CREAM + (255,), optical_dy=0.012)
    return img


# ── 3) 스플래시 (iOS / Android 11 이하) ──────────────────────────────────
def make_splash(size=2732):
    """흰 배경 + 중앙 워드마크. 어느 방향으로 잘려도 중앙은 살아남는 정사각.

    ⚠️ 배경은 기본 테마(브루탈리스트 #ffffff)와 맞춘다. 스플래시가 크림이면
       앱이 뜨는 순간 배경색이 바뀌어 깜빡이는 것처럼 보인다.
       워드마크의 골드는 브랜드 식별자라 테마와 무관하게 유지.
    """
    img = Image.new("RGB", (size, size), WHITE)
    fnt = font(SERIF_BOLD_ITALIC, int(size * 0.085))
    draw_centered(img, "Butter", fnt, PRIMARY)
    return img


# ── 4) Android 12+ 스플래시 아이콘 ───────────────────────────────────────
def make_android12_splash_icon(size=1152):
    """
    ⚠️ Android 12+ 는 1152 캔버스 중 가운데 원(지름 ~768)만 보인다.
    가로로 긴 워드마크는 양끝이 잘리므로 심볼(B)만 사용. (플레이북 4번)
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fnt = font(SERIF_ITALIC, int(size * 0.34))  # 안전원 768px 안에 여유있게
    draw_centered(img, "B", fnt, PRIMARY + (255,), optical_dy=0.012)
    return img


# ── 5) 스토어 제출용 ─────────────────────────────────────────────────────
def make_play_icon():
    """⚠️ Play 스토어 아이콘 512×512 — 알파 채널 금지, 정사각 풀블리드."""
    return make_icon(512).convert("RGB")


def make_feature_graphic():
    """Play 그래픽 이미지 1024×500 가로 배너 (필수 항목)."""
    w, h = 1024, 500
    img = vertical_gradient((w, h), GOLD_TOP, GOLD_BOTTOM)
    draw_centered(img, "Butter", font(SERIF_BOLD_ITALIC, 116), CREAM, cy=h * 0.42)
    draw_centered(
        img,
        "Read deeply. Reflect honestly.",
        font(SERIF_ITALIC, 34),
        (235, 228, 205),
        cy=h * 0.66,
    )
    return img


def save(img, path, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", **kw)
    print(f"  {os.path.relpath(path, ROOT):46s} {img.size[0]}x{img.size[1]} {img.mode}")


if __name__ == "__main__":
    print("assets/ (capacitor-assets 입력)")
    save(make_icon(), os.path.join(ASSETS, "icon-only.png"))
    save(make_icon_background(), os.path.join(ASSETS, "icon-background.png"))
    save(make_icon_foreground(), os.path.join(ASSETS, "icon-foreground.png"))
    save(make_splash(), os.path.join(ASSETS, "splash.png"))
    # Butter 는 밝은 테마만 있으므로 다크 스플래시도 동일하게 둔다
    save(make_splash(), os.path.join(ASSETS, "splash-dark.png"))
    save(make_android12_splash_icon(), os.path.join(ASSETS, "android12-splash-icon.png"))

    print("store-assets/ (스토어 제출용)")
    save(make_play_icon(), os.path.join(STORE, "play-icon-512.png"))
    save(make_feature_graphic(), os.path.join(STORE, "play-feature-graphic-1024x500.png"))
    save(make_icon(), os.path.join(STORE, "appstore-icon-1024.png"))
    print("\n다음: npm run assets   (네이티브 프로젝트로 아이콘/스플래시 생성)")
