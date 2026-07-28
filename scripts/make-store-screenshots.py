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
KR_SERIF = "/System/Library/Fonts/Supplemental/AppleMyungjo.ttf"

# 슬라이드 정의
#   ("shot", 파일, 제목, 부제)  → 기기 목업 슬라이드
#   ("quote", 인용문, 출처, 감정) → 텍스트 슬라이드 (기록 자체가 주인공)
#
# ⚠️ 순서는 "제품의 차별점 → 결과물" 흐름. 첫 장이 완성된 목록이면
#    "또 하나의 독서 기록 앱"으로 보이므로 6단계 질문을 앞에 둔다.
# ⚠️ 카피는 분위기어보다 행위를 먼저 말한다.
SLIDES = [
    ("shot", "s3-journal.png",
     "질문에 하나씩 답하면\n한 편의 기록이 완성됩니다",
     "빈 페이지 앞에서 막막하지 않게"),

    ("quote",
     "아름다움은 자주\n늦게 도착한다.",
     "『나의 완벽한 장례식』에 남긴 기록",
     "그리운"),

    ("shot", "s1-home.png",
     "책을 덮은 뒤,\n기억하고 싶은 문장을 남기세요",
     "그날의 감정과 함께 보관됩니다"),

    ("shot", "s4-map.png",
     "제목이 기억나지 않아도\n그날의 감정으로 찾습니다",
     "감정 · 작가 · 시기로 되짚는 내 서재"),

    ("shot", "s2-explore.png",
     "읽은 책을 찾아\n바로 기록으로",
     "국내외 도서를 검색해 표지와 함께"),
]


def font(size, index=1):
    """AppleSDGothicNeo.ttc — index 1 이 Bold 계열."""
    try:
        return ImageFont.truetype(KR_BOLD, size, index=index)
    except Exception:
        return ImageFont.truetype(KR_BOLD, size)


def serif(size):
    """인용문용 명조체 — 앱의 세리프 톤과 맞춘다."""
    return ImageFont.truetype(KR_SERIF, size)


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


def compose_quote(quote, source, emotion, canvas_size):
    """기록 자체가 주인공인 텍스트 슬라이드.

    5장이 모두 같은 문법(제목+기기)이면 리듬이 없어 한 장의 변주처럼 보인다.
    Butter 는 UI 보다 사용자가 남긴 문장이 더 매력적인 앱이므로 한 장은 문장을 앞세운다.
    """
    W, H = canvas_size
    scale = W / 1080
    canvas = gradient_bg((W, H))
    d = ImageDraw.Draw(canvas)

    f_quote = serif(int(74 * scale))
    f_src = font(int(28 * scale), index=0)
    f_emo = font(int(24 * scale), index=1)
    f_mark = serif(int(120 * scale))

    lines = quote.split("\n")
    gap = int(28 * scale)
    quote_h = sum(d.textbbox((0, 0), l, font=f_quote)[3] -
                  d.textbbox((0, 0), l, font=f_quote)[1] for l in lines) + gap * (len(lines) - 1)

    # 따옴표 · 구분선 · 출처 · 감정칩까지 포함한 전체 높이를 재서 세로 가운데 정렬한다.
    mark_h = int(90 * scale)
    trailing_h = int(70 * scale) + int(46 * scale) + int(34 * scale) + int(70 * scale)
    total_h = mark_h + quote_h + trailing_h
    top = (H - total_h) // 2

    # 여는 따옴표 — 인용문 위 가운데
    mb = d.textbbox((0, 0), '"', font=f_mark)
    d.text((W / 2 - (mb[0] + mb[2]) / 2, top), '"', font=f_mark, fill=PRIMARY)

    y = draw_multiline_centered(d, quote, f_quote, TEXT, W / 2, top + mark_h, gap)

    rule_y = y + int(70 * scale)
    d.line([(W * 0.34, rule_y), (W * 0.66, rule_y)], fill=(0, 0, 0, 30), width=max(1, int(scale)))

    y = draw_multiline_centered(d, source, f_src, MUTED, W / 2, rule_y + int(46 * scale), 0)

    l, t, r, b = d.textbbox((0, 0), emotion, font=f_emo)
    tw, th = r - l, b - t
    pad_x, pad_y = int(24 * scale), int(12 * scale)
    cx0 = W / 2 - tw / 2 - pad_x
    cy0 = y + int(34 * scale)
    d.rounded_rectangle(
        [cx0, cy0, cx0 + tw + pad_x * 2, cy0 + th + pad_y * 2],
        radius=int(4 * scale), outline=PRIMARY, width=max(1, int(1.5 * scale)),
    )
    d.text((W / 2 - (l + r) / 2, cy0 + pad_y), emotion, font=f_emo, fill=PRIMARY)

    return canvas.convert("RGB")


def main():
    os.makedirs(OUT_A, exist_ok=True)
    os.makedirs(OUT_I, exist_ok=True)

    for i, slide in enumerate(SLIDES, start=1):
        kind = slide[0]

        if kind == "quote":
            _, quote, source, emotion = slide
            a = compose_quote(quote, source, emotion, (1080, 1920))
            b = compose_quote(quote, source, emotion, (1320, 2868))
            label = quote.splitlines()[0]
        else:
            _, fname, title, sub = slide
            src = os.path.join(SRC, fname)
            if not os.path.exists(src):
                print(f"  !! 원본 없음: {fname}")
                continue
            a = compose(src, title, sub, (1080, 1920))
            # iOS 6.9" — 1320×2868 (iPhone 16 Pro Max)
            # ⚠️ App Store Connect 는 6.9" 를 요구하고 나머지 크기는 이걸로 자동 축소한다.
            b = compose(src, title, sub, (1320, 2868))
            label = title.splitlines()[0]

        a.save(os.path.join(OUT_A, f"{i:02d}.png"), "PNG")
        b.save(os.path.join(OUT_I, f"{i:02d}.png"), "PNG")
        print(f"  {i:02d}  [{kind:5}] {label:<24} android {a.size}  ios {b.size}")


if __name__ == "__main__":
    main()
    print("\n⚠️ Play Console 업로드 후 '용도' 드롭다운에서 '9:16 세로 모드'를 정확히 고를 것.")
