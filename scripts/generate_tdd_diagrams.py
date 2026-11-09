from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "tdd-assets"
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Verdana.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"

INK = "#0f172a"
MUTED = "#475569"
GREEN = "#047857"
GREEN_SOFT = "#d1fae5"
AMBER = "#b45309"
AMBER_SOFT = "#fef3c7"
BLUE = "#1d4ed8"
BLUE_SOFT = "#dbeafe"
PURPLE = "#6d28d9"
PURPLE_SOFT = "#ede9fe"
SLATE = "#334155"
SLATE_SOFT = "#f1f5f9"
WHITE = "#ffffff"
LINE = "#cbd5e1"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rounded_box(draw, xy, fill=WHITE, outline=LINE, radius=24, width=3):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def center_text(draw, xy, title, detail=None, accent=GREEN, title_size=34, detail_size=23):
    x1, y1, x2, y2 = xy
    title_font = font(title_size, True)
    detail_font = font(detail_size)
    title_box = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_box[2] - title_box[0]
    detail_lines = []
    if detail:
        line_width = max(24, int((x2 - x1) / (detail_size * 0.62)))
        for segment in detail.splitlines():
            detail_lines.extend(wrap(segment, width=line_width) or [""])
    total_h = title_size + (len(detail_lines) * (detail_size + 8) + 18 if detail_lines else 0)
    y = y1 + ((y2 - y1) - total_h) / 2
    draw.text(((x1 + x2 - title_w) / 2, y), title, font=title_font, fill=accent)
    y += title_size + 18
    for line in detail_lines:
        box = draw.textbbox((0, 0), line, font=detail_font)
        line_w = box[2] - box[0]
        draw.text(((x1 + x2 - line_w) / 2, y), line, font=detail_font, fill=MUTED)
        y += detail_size + 8


def arrow(draw, start, end, color=SLATE, width=5):
    draw.line((start, end), fill=color, width=width)
    x, y = end
    if abs(end[1] - start[1]) >= abs(end[0] - start[0]):
        points = [(x, y), (x - 12, y - 18), (x + 12, y - 18)] if y > start[1] else [(x, y), (x - 12, y + 18), (x + 12, y + 18)]
    else:
        points = [(x, y), (x - 18, y - 12), (x - 18, y + 12)] if x > start[0] else [(x, y), (x + 18, y - 12), (x + 18, y + 12)]
    draw.polygon(points, fill=color)


def header(draw, title, subtitle, width):
    draw.text((80, 54), title, font=font(42, True), fill=INK)
    draw.text((80, 112), subtitle, font=font(24), fill=MUTED)
    draw.line((80, 156, width - 80, 156), fill=LINE, width=3)


def architecture():
    width, height = 1800, 1220
    image = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(image)
    header(draw, "System architecture", "One deployable Next.js application with durable PostgreSQL state and reviewable AI", width)

    layers = [
        ((110, 205, 1690, 345), GREEN_SOFT, GREEN, "Users and channels", "Mobile travellers • Admin • Editor • Consultant • Web, WhatsApp, email and phone intake"),
        ((110, 405, 1690, 575), BLUE_SOFT, BLUE, "Next.js 16 application", "Server-rendered public packages and blogs • CMS preview and versioning • Enquiry inbox • Quote views"),
        ((110, 635, 1690, 785), SLATE_SOFT, SLATE, "Route handlers and security boundary", "Signed sessions and role checks • Input validation • Consent enforcement • Rate limiting • Legacy redirects"),
        ((110, 845, 1080, 1090), PURPLE_SOFT, PURPLE, "AI triage service", "PII redaction, then Gemini, OpenRouter and deterministic local fallback\nHuman review required; package ranking and prices remain database-backed"),
        ((1140, 845, 1690, 1090), AMBER_SOFT, AMBER, "Neon PostgreSQL", "Packages • Seasonal prices • Versions • Enquiries • Quotes • Blogs • Users • Audit log"),
    ]
    for xy, fill, accent, title, detail in layers:
        rounded_box(draw, xy, fill=fill, outline=accent, radius=26, width=4)
        center_text(draw, xy, title, detail, accent=accent, title_size=34, detail_size=23)

    for y1, y2 in ((345, 405), (575, 635), (785, 845)):
        arrow(draw, (900, y1 + 10), (900, y2 - 10), color=GREEN)
    arrow(draw, (1080, 968), (1128, 968), color=AMBER)
    image.save(OUT / "architecture.png", quality=95)


def data_model():
    width, height = 1800, 1320
    image = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(image)
    header(draw, "Core data model", "Relational records preserve pricing integrity, version history and traceable enquiry decisions", width)

    boxes = {
        "packages": (650, 230, 1150, 520, GREEN_SOFT, GREEN, ["id (PK)", "slug (unique)", "status", "current_version", "destinations_json"]),
        "seasonal_prices": (90, 220, 520, 500, BLUE_SOFT, BLUE, ["id (PK)", "package_id (FK)", "season_name", "standard / deluxe / luxury", "gst_percent"]),
        "itinerary_days": (90, 590, 520, 860, SLATE_SOFT, SLATE, ["id (PK)", "package_id (FK)", "day_number", "title", "description"]),
        "package_versions": (650, 650, 1150, 930, PURPLE_SOFT, PURPLE, ["id (PK)", "package_id (FK)", "version_number", "snapshot_json", "change_summary"]),
        "enquiries": (1280, 220, 1710, 550, AMBER_SOFT, AMBER, ["id (PK)", "package_id (FK)", "raw_message", "AI extracted fields", "suggestions + draft", "review status"]),
        "quotes": (1280, 660, 1710, 930, GREEN_SOFT, GREEN, ["id (PK)", "enquiry_id (FK)", "selected_tier", "subtotal / GST", "grand_total"]),
        "supporting": (420, 1030, 1380, 1260, SLATE_SOFT, SLATE, ["users and roles", "blogs and related packages", "activity_logs", "redirects", "enquiry_rate_limits"]),
    }

    for name, (x1, y1, x2, y2, fill, accent, fields) in boxes.items():
        rounded_box(draw, (x1, y1, x2, y2), fill=fill, outline=accent, radius=22, width=4)
        draw.text((x1 + 28, y1 + 22), name, font=font(30, True), fill=accent)
        draw.line((x1 + 24, y1 + 68, x2 - 24, y1 + 68), fill=accent, width=2)
        y = y1 + 88
        columns = 2 if name == "supporting" else 1
        if columns == 2:
            for index, field in enumerate(fields):
                col = index % 2
                row = index // 2
                draw.text((x1 + 30 + col * 450, y + row * 45), "• " + field, font=font(22), fill=INK)
        else:
            for field in fields:
                draw.text((x1 + 30, y), "• " + field, font=font(22), fill=INK)
                y += 38

    arrow(draw, (650, 340), (535, 340), color=BLUE)
    draw.text((548, 300), "1:N", font=font(21, True), fill=BLUE)
    arrow(draw, (650, 450), (520, 690), color=SLATE)
    draw.text((548, 535), "1:N", font=font(21, True), fill=SLATE)
    arrow(draw, (900, 520), (900, 635), color=PURPLE)
    draw.text((920, 555), "1:N", font=font(21, True), fill=PURPLE)
    arrow(draw, (1150, 355), (1265, 355), color=AMBER)
    draw.text((1175, 315), "1:N", font=font(21, True), fill=AMBER)
    arrow(draw, (1495, 550), (1495, 645), color=GREEN)
    draw.text((1515, 570), "1:0..N", font=font(21, True), fill=GREEN)
    arrow(draw, (900, 930), (900, 1015), color=SLATE)
    image.save(OUT / "data-model.png", quality=95)


def ai_pipeline():
    width, height = 1800, 930
    image = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(image)
    header(draw, "AI enquiry triage with deterministic guardrails", "External models extract intent; the application owns ranking, pricing and approval", width)

    steps = [
        ((80, 245, 400, 620), GREEN_SOFT, GREEN, "1  Intake", "Store original message\nRedact direct identifiers\nValidate consent and limits"),
        ((500, 245, 820, 620), PURPLE_SOFT, PURPLE, "2  Extract", "Gemini primary\nOpenRouter fallback\nLocal deterministic fallback\nSchema + confidence checks"),
        ((920, 245, 1240, 620), BLUE_SOFT, BLUE, "3  Rank", "Score seeded packages\nCheck destination and fit\nFetch seasonal tariffs\nNever accept AI pricing"),
        ((1340, 245, 1720, 620), AMBER_SOFT, AMBER, "4  Review", "Show fields beside source\nConsultant corrects values\nDraft remains unsent\nApproval creates audit event"),
    ]
    for xy, fill, accent, title, detail in steps:
        rounded_box(draw, xy, fill=fill, outline=accent, radius=24, width=4)
        center_text(draw, xy, title, detail, accent=accent, title_size=32, detail_size=22)
    for x in (400, 820, 1240):
        arrow(draw, (x + 12, 432), (x + 76, 432), color=SLATE)

    rounded_box(draw, (230, 710, 1570, 835), fill=SLATE_SOFT, outline=SLATE, radius=20, width=3)
    center_text(draw, (230, 710, 1570, 835), "Non-negotiable safety rule", "Nothing is sent or published until a human accepts it; every quoted price comes from seasonal_prices.", accent=SLATE, title_size=29, detail_size=22)
    image.save(OUT / "ai-pipeline.png", quality=95)


if __name__ == "__main__":
    architecture()
    data_model()
    ai_pipeline()
    print(f"Created TDD diagrams in {OUT}")
