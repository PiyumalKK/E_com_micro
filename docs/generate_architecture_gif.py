"""
ShopEase architecture GIF generator.

Professional fixed-layout A4 portrait composition:
- top half: delivery pipeline flowing left to right
- bridge: Azure Container Registry
- bottom half: runtime architecture flowing top to bottom
- real icons rendered from the diagrams library and cached locally
"""

import glob
import os
from typing import Dict, Iterable, List, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

os.environ["PATH"] = r"C:\Program Files\Graphviz\bin;" + os.environ.get("PATH", "")

from diagrams import Diagram
from diagrams.azure.compute import ContainerApps, ContainerRegistries
from diagrams.azure.database import CosmosDb
from diagrams.onprem.database import MongoDB
from diagrams.onprem.ci import GithubActions
from diagrams.onprem.client import Users
from diagrams.onprem.container import Docker
from diagrams.onprem.monitoring import Grafana
from diagrams.onprem.security import Vault
from diagrams.onprem.vcs import Git, Github
from diagrams.programming.framework import React
from diagrams.programming.language import Nodejs


BASE_DIR = os.path.dirname(__file__)
FRAME_DIR = os.path.join(BASE_DIR, "architecture_frames")
ICON_DIR = os.path.join(BASE_DIR, "icon_cache")
OUTPUT_GIF = os.path.join(BASE_DIR, "shopease_architecture.gif")

for folder in (FRAME_DIR, ICON_DIR):
    os.makedirs(folder, exist_ok=True)


A4_W = 1240
A4_H = 1754
TEXT = "#e6edf3"
SUBTEXT = "#8b949e"
WAIT = "#6e7681"
ACTIVE = "#f47067"
DONE = "#3fb950"
CARD_FILL = "#161b22"
CARD_BORDER = "#30363d"
H_FILL = "#3d2e00"
H_BORDER = "#d29922"
D_FILL = "#0d2818"
D_BORDER = "#3fb950"
SHADOW = (0, 0, 0, 50)
BG_COLOR = "#0d1117"

SECTION_STYLES = {
    "source": ("#151b23", "#2a3140"),
    "validation": ("#131a24", "#1f3154"),
    "registry": ("#101820", "#1a3050"),
    "runtime": ("#141c26", "#253550"),
    "data": ("#121a24", "#1f3154"),
}

ICON_MAP = {
    "internet": Users,
    "developer": Users,
    "git": Git,
    "github": Github,
    "actions": GithubActions,
    "build": Nodejs,
    "snyk": Vault,
    "sonar": Grafana,
    "docker": Docker,
    "acr": ContainerRegistries,
    "frontend": ContainerApps,
    "gateway": ContainerApps,
    "user": ContainerApps,
    "product": ContainerApps,
    "order": ContainerApps,
    "notification": ContainerApps,
    "mongodb": MongoDB,
}

CARD_META: Dict[str, Tuple[str, str]] = {
    "internet": ("External Users", "browser + mobile\npublic internet"),
    "developer": ("Developer", "code changes\nlocal workflow"),
    "git": ("Git", "commit\nbranch"),
    "github": ("GitHub", "repos\nPR flow"),
    "actions": ("GitHub Actions", "workflow\norchestration"),
    "build": ("Node.js Build", "install + compile\nall services"),
    "snyk": ("Snyk", "dependency\nscan"),
    "sonar": ("SonarCloud", "SAST\nreview"),
    "docker": ("Docker Build", "multi-stage\nimages"),
    "acr": ("Azure ACR", "6 images\nrelease source"),
    "frontend": ("Frontend", "Container App\nNode.js public UI"),
    "gateway": ("API Gateway", "Container App\nNode.js routing"),
    "user": ("User Service", "auth + RBAC\n:3001"),
    "product": ("Product Service", "catalog + stock\n:3002"),
    "order": ("Order Service", "orders + flow\n:3003"),
    "notification": ("Notification Svc", "alerts + email\n:3004"),
    "mongodb": ("MongoDB Atlas Cluster", "single shared cluster\nShopEase data"),
}

LAYOUT: Dict[str, Tuple[int, int, int, int]] = {
    "developer": (66, 176, 130, 132),
    "git": (226, 176, 130, 132),
    "github": (402, 176, 150, 132),
    "actions": (606, 176, 170, 132),
    "build": (76, 486, 200, 132),
    "snyk": (320, 486, 170, 132),
    "sonar": (534, 486, 170, 132),
    "docker": (760, 472, 270, 146),
    "acr": (370, 748, 500, 144),
    "internet": (46, 1088, 198, 146),
    "frontend": (336, 992, 236, 156),
    "gateway": (640, 992, 236, 156),
    "user": (324, 1258, 200, 146),
    "product": (548, 1258, 200, 146),
    "order": (772, 1258, 200, 146),
    "notification": (996, 1258, 200, 146),
    "mongodb": (360, 1526, 520, 132),
}

STEP_KEYS = {
    1: {"developer", "git"},
    2: {"git", "github"},
    3: {"github", "actions"},
    4: {"actions", "build"},
    5: {"snyk", "sonar"},
    6: {"docker"},
    7: {"acr"},
    8: {"acr", "frontend", "gateway", "user", "product", "order", "notification"},
    9: {"internet", "frontend", "gateway"},
    10: {"gateway", "user", "product", "order", "notification"},
    11: {"user", "product", "order", "notification", "mongodb"},
}


def safe_font(name: str, size: int):
    try:
        return ImageFont.truetype(name, size)
    except Exception:
        return ImageFont.load_default()


TITLE_FONT = safe_font("arialbd.ttf", 34)
SUBTITLE_FONT = safe_font("arial.ttf", 17)
SECTION_FONT = safe_font("arialbd.ttf", 18)
CARD_TITLE_FONT = safe_font("arialbd.ttf", 16)
CARD_BODY_FONT = safe_font("arial.ttf", 13)
LABEL_FONT = safe_font("arial.ttf", 12)


def hex_rgb(color: str) -> Tuple[int, int, int]:
    color = color.lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))


BRIGHTEN_ICONS = {"internet", "developer", "github"}
HIGH_BRIGHTEN_ICONS = {"internet", "developer", "github"}


def panel_colors(section: str) -> Tuple[str, str, int]:
    fill, border = SECTION_STYLES[section]
    return fill, border, 2


def card_colors() -> Tuple[str, str, int]:
    return CARD_FILL, CARD_BORDER, 2


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> List[str]:
    words = text.split()
    if not words:
        return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        attempt = f"{current} {word}"
        if draw.textlength(attempt, font=font) <= max_width:
            current = attempt
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def add_shadow(base: Image.Image, box: Tuple[int, int, int, int], radius: int) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sx0, sy0, sx1, sy1 = box[0] + 7, box[1] + 10, box[2] + 7, box[3] + 10
    d.rounded_rectangle((sx0, sy0, sx1, sy1), radius=radius, fill=SHADOW)
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(16)))


def rounded(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], radius: int, fill: str, outline: str, width: int) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def brighten_icon(img: Image.Image, factor: float = 1.8) -> Image.Image:
    """Boost brightness of dark icons so they are visible on dark backgrounds."""
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Brightness(img)
    bright = enhancer.enhance(factor)
    # Restore original alpha channel
    r, g, b, a = bright.split()
    _, _, _, orig_a = img.split()
    return Image.merge("RGBA", (r, g, b, orig_a))


def render_snyk_icon() -> str:
    """Render the custom Snyk SVG logo to a brightened PNG."""
    path = os.path.join(ICON_DIR, "snyk.png")
    if os.path.exists(path):
        return path
    import cairosvg
    svg_path = os.path.join(ICON_DIR, "snyk_logo.svg")
    tmp_png = os.path.join(ICON_DIR, "_snyk_svg.png")
    cairosvg.svg2png(url=svg_path, write_to=tmp_png, output_width=400)
    img = Image.open(tmp_png).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    cropped = img.crop(bbox) if bbox else img
    cropped = brighten_icon(cropped, factor=3.5)
    cropped.save(path)
    os.remove(tmp_png)
    return path


def render_icon(key: str) -> str:
    path = os.path.join(ICON_DIR, f"{key}.png")
    if os.path.exists(path):
        return path

    if key == "snyk":
        return render_snyk_icon()

    cls = ICON_MAP[key]
    temp = os.path.join(ICON_DIR, f"_{key}")
    with Diagram("", filename=temp, show=False, outformat="png", graph_attr={"bgcolor": "transparent", "pad": "0.0", "dpi": "220"}):
        cls(" ")

    temp_png = temp + ".png"
    img = Image.open(temp_png).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    cropped = img.crop(bbox) if bbox else img
    if key in HIGH_BRIGHTEN_ICONS:
        cropped = brighten_icon(cropped, factor=3.5)
    elif key in BRIGHTEN_ICONS:
        cropped = brighten_icon(cropped, factor=2.8)
    cropped.save(path)
    os.remove(temp_png)
    return path


def render_badge(icon_cls, name: str) -> str:
    path = os.path.join(ICON_DIR, f"badge_{name}.png")
    if os.path.exists(path):
        return path

    temp = os.path.join(ICON_DIR, f"_badge_{name}")
    with Diagram("", filename=temp, show=False, outformat="png", graph_attr={"bgcolor": "transparent", "pad": "0.0", "dpi": "220"}):
        icon_cls(" ")

    temp_png = temp + ".png"
    img = Image.open(temp_png).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    cropped = img.crop(bbox) if bbox else img
    cropped.save(path)
    os.remove(temp_png)
    return path


def draw_background(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    draw.rectangle((0, 0, A4_W, A4_H), fill=BG_COLOR)


def section_sets(current: int, completed: Iterable[int]) -> Tuple[set, set]:
    phase_to_sections = {
        1: {"source"},
        2: {"source"},
        3: {"source"},
        4: {"validation"},
        5: {"validation"},
        6: {"validation"},
        7: {"registry"},
        8: {"runtime"},
        9: {"runtime"},
        10: {"runtime"},
        11: {"data"},
    }
    active = phase_to_sections.get(current, set())
    done = set()
    for step in completed:
        done.update(phase_to_sections.get(step, set()))
    return active, done


def draw_flow_band(base: Image.Image, draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, section: str, direction: str) -> None:
    fill, border, width = panel_colors(section)
    add_shadow(base, box, radius=28)
    rounded(draw, box, 28, fill, border, width)
    accent_box = (box[0] + 16, box[1] + 16, box[0] + 230, box[1] + 56)
    rounded(draw, accent_box, 16, "#1c2128", border, 1)
    draw.text((box[0] + 30, box[1] + 24), title, fill=TEXT, font=SECTION_FONT)


def draw_card(base: Image.Image, draw: ImageDraw.ImageDraw, key: str) -> None:
    x, y, w, h = LAYOUT[key]
    box = (x, y, x + w, y + h)
    fill, border, width = card_colors()
    add_shadow(base, box, radius=26)
    rounded(draw, box, 26, fill, border, width)

    icon = Image.open(render_icon(key)).convert("RGBA")
    icon_box = int(min(w * 0.42, h * 0.38))
    scale = min(icon_box / icon.width, icon_box / icon.height)
    icon = icon.resize((max(1, int(icon.width * scale)), max(1, int(icon.height * scale))), Image.LANCZOS)
    ix = x + (w - icon.width) // 2
    iy = y + 12
    base.alpha_composite(icon, (ix, iy))

    if key in {"frontend"}:
        badge = Image.open(render_badge(Nodejs, "nodejs")).convert("RGBA")
        badge_scale = min(40 / badge.width, 40 / badge.height)
        badge = badge.resize((max(1, int(badge.width * badge_scale)), max(1, int(badge.height * badge_scale))), Image.LANCZOS)
        bx = x + w - badge.width - 14
        by = y + 14
        badge_back = (bx - 6, by - 6, bx + badge.width + 6, by + badge.height + 6)
        draw.ellipse(badge_back, fill=CARD_FILL, outline=border, width=1)
        base.alpha_composite(badge, (bx, by))

    title, body = CARD_META[key]
    title_y = iy + icon.height + 8
    title_w = draw.textbbox((0, 0), title, font=CARD_TITLE_FONT)[2]
    draw.text((x + (w - title_w) // 2, title_y), title, fill=TEXT, font=CARD_TITLE_FONT)

    body_y = title_y + 24
    body_lines: List[str] = []
    for paragraph in body.split("\n"):
        body_lines.extend(wrap_text(draw, paragraph, CARD_BODY_FONT, w - 24))
    for line in body_lines[:3]:
        line_w = draw.textbbox((0, 0), line, font=CARD_BODY_FONT)[2]
        draw.text((x + (w - line_w) // 2, body_y), line, fill=SUBTEXT, font=CARD_BODY_FONT)
        body_y += 16


def mid_left(key: str) -> Tuple[int, int]:
    x, y, _, h = LAYOUT[key]
    return x, y + h // 2


def mid_right(key: str) -> Tuple[int, int]:
    x, y, w, h = LAYOUT[key]
    return x + w, y + h // 2


def top_center(key: str) -> Tuple[int, int]:
    x, y, w, _ = LAYOUT[key]
    return x + w // 2, y


def bottom_center(key: str) -> Tuple[int, int]:
    x, y, w, h = LAYOUT[key]
    return x + w // 2, y + h


def draw_dashed_line(draw: ImageDraw.ImageDraw, start: Tuple[int, int], end: Tuple[int, int],
                     color: str, width: int, dash_len: int = 18, gap_len: int = 12, offset: int = 0) -> None:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = (dx**2 + dy**2) ** 0.5
    if length == 0:
        return
    ux, uy = dx / length, dy / length
    cycle = dash_len + gap_len
    pos = (offset % cycle) - cycle
    while pos < length:
        d_start = max(pos, 0)
        d_end = min(pos + dash_len, length)
        if d_end > d_start:
            draw.line([(start[0] + ux * d_start, start[1] + uy * d_start),
                       (start[0] + ux * d_end, start[1] + uy * d_end)],
                      fill=color, width=width)
        pos += cycle


def draw_arrow(draw: ImageDraw.ImageDraw, points: List[Tuple[int, int]], color: str, width: int,
               label: str = "", animated: bool = False, dash_offset: int = 0) -> None:
    for start, end in zip(points, points[1:]):
        if animated:
            draw_dashed_line(draw, start, end, color, width, offset=dash_offset)
        else:
            draw.line([start, end], fill=color, width=width)
    tail = points[-2]
    head = points[-1]
    if head[0] == tail[0]:
        direction = 1 if head[1] > tail[1] else -1
        tip = [(head[0], head[1]), (head[0] - 8, head[1] - 14 * direction), (head[0] + 8, head[1] - 14 * direction)]
    else:
        direction = 1 if head[0] > tail[0] else -1
        tip = [(head[0], head[1]), (head[0] - 14 * direction, head[1] - 8), (head[0] - 14 * direction, head[1] + 8)]
    draw.polygon(tip, fill=color)
    if label:
        box = draw.textbbox((0, 0), label, font=LABEL_FONT)
        tw = box[2] - box[0]
        th = box[3] - box[1]
        lx = (points[0][0] + points[-1][0]) // 2
        ly = (points[0][1] + points[-1][1]) // 2 - 18
        draw.rounded_rectangle((lx - tw // 2 - 8, ly - 4, lx + tw // 2 + 8, ly + th + 4), radius=12, fill="#1c2128")
        draw.text((lx - tw // 2, ly), label, fill=color, font=LABEL_FONT)


def draw_routes(draw: ImageDraw.ImageDraw, current: int, completed: Iterable[int], dash_offset: int = 0) -> None:
    routes = [
        (1, [mid_right("developer"), mid_left("git")], "commit"),
        (2, [mid_right("git"), mid_left("github")], "push"),
        (3, [mid_right("github"), mid_left("actions")], "trigger"),
        (4, [bottom_center("actions"), (691, 432), (176, 432), top_center("build")], "build"),
        (5, [mid_right("build"), mid_left("snyk")], "scan"),
        (5, [mid_right("snyk"), mid_left("sonar")], "SAST"),
        (6, [mid_right("sonar"), (740, 552), (740, 545), mid_left("docker")], "build"),
        (7, [bottom_center("docker"), (895, 684), (620, 684), top_center("acr")], "push images"),
        (8, [bottom_center("acr"), (620, 940)], "deploy"),
        (9, [mid_right("internet"), (290, 1161), (290, 1070), mid_left("frontend")], "HTTPS"),
        (9, [mid_right("frontend"), mid_left("gateway")], "/api/*"),
        (10, [bottom_center("gateway"), (758, 1188), (424, 1188), (424, 1258), top_center("user")], "/auth"),
        (10, [bottom_center("gateway"), (758, 1206), (648, 1206), (648, 1258), top_center("product")], "/products"),
        (10, [bottom_center("gateway"), (758, 1224), (872, 1224), (872, 1258), top_center("order")], "/orders"),
        (10, [bottom_center("gateway"), (758, 1180), (1096, 1180), (1096, 1258), top_center("notification")], "/notifications"),
        (11, [bottom_center("user"), (424, 1490), (440, 1490), (440, 1526)], ""),
        (11, [bottom_center("product"), (648, 1490), (540, 1490), (540, 1526)], ""),
        (11, [bottom_center("order"), (872, 1490), (700, 1490), (700, 1526)], ""),
        (11, [bottom_center("notification"), (1096, 1490), (800, 1490), (800, 1526)], ""),
    ]

    ARROW_COLOR = "#58a6ff"
    ARROW_WIDTH = 4
    for phase, points, label in routes:
        draw_arrow(draw, points, ARROW_COLOR, ARROW_WIDTH, label, animated=True, dash_offset=dash_offset)


def draw_frame(frame_no: int, subtitle: str, dash_offset: int = 0) -> str:
    base = Image.new("RGBA", (A4_W, A4_H), hex_rgb(BG_COLOR) + (255,))
    draw_background(base)
    draw = ImageDraw.Draw(base)

    draw.text((36, 34), "ShopEase E-Commerce Platform", fill=TEXT, font=TITLE_FONT)
    draw.text((36, 78), subtitle, fill=SUBTEXT, font=SUBTITLE_FONT)
    draw.text((926, 42), "Minimal Architecture View", fill="#8b949e", font=SECTION_FONT)

    bands = [
        ((24, 122, 1216, 340), "1. Source Control", "source", "right"),
        ((24, 372, 1216, 660), "2. Validation and Packaging", "validation", "left"),
        ((56, 692, 1184, 914), "3. Registry Release", "registry", "right"),
        ((24, 936, 270, 1432), "4A. External Access", "runtime", "left"),
        ((304, 936, 1216, 1432), "4B. Azure Container Apps", "runtime", "left"),
        ((24, 1474, 1216, 1696), "5. Single MongoDB Atlas Cluster", "data", "right"),
    ]
    for box, title, section, direction in bands:
        draw_flow_band(base, draw, box, title, section, direction)

    for key in CARD_META:
        draw_card(base, draw, key)

    draw_routes(draw, 0, [], dash_offset)

    out_path = os.path.join(FRAME_DIR, f"frame{frame_no:02d}.png")
    base.convert("RGB").save(out_path, "PNG")
    return out_path


def create_gif() -> None:
    print("\n  Generating full-page professional A4 architecture GIF...\n")

    for old in glob.glob(os.path.join(FRAME_DIR, "frame*.png")):
        os.remove(old)

    subtitles = [
        "Overview - Full architecture and delivery pipeline",
        "Step 1 - Developer commits locally",
        "Step 2 - Code is pushed to GitHub",
        "Step 3 - GitHub triggers CI/CD workflows",
        "Step 4 - Node.js builds all services",
        "Step 5 - Snyk and SonarCloud perform security checks",
        "Step 6 - Docker builds hardened images",
        "Step 7 - Images are pushed to Azure Container Registry",
        "Step 8 - Azure Container Apps deploys the platform",
        "Step 9 - Frontend traffic enters through the gateway",
        "Step 10 - The gateway fans out across microservices",
        "Step 11 - Each service persists to its own datastore",
        "Delivery complete - platform healthy and live",
        "Scale to zero when idle - cost optimized runtime",
    ]

    ANIM_SUB = 4
    DASH_CYCLE = 30

    frame_idx = 0
    for spec_idx, subtitle in enumerate(subtitles):
        for sub in range(ANIM_SUB):
            frame_idx += 1
            offset = int(sub * DASH_CYCLE / ANIM_SUB)
            draw_frame(frame_idx, subtitle, dash_offset=offset)
            print(f"  [OK] Frame {frame_idx:2d}: {subtitle} (sub {sub+1}/{ANIM_SUB})")

    frame_paths = sorted(glob.glob(os.path.join(FRAME_DIR, "frame*.png")))
    if not frame_paths:
        raise RuntimeError("No frames were generated.")

    frames = [Image.open(path).convert("RGB") for path in frame_paths]
    durations = []
    for spec_idx in range(len(subtitles)):
        durations.extend([450] * ANIM_SUB)

    frames[0].save(
        OUTPUT_GIF,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
    )

    size_mb = os.path.getsize(OUTPUT_GIF) / (1024 * 1024)
    print(f"\n  GIF saved: {OUTPUT_GIF}")
    print(f"  {len(frames)} frames | {A4_W}x{A4_H} (A4 portrait) | {size_mb:.1f} MB")


if __name__ == "__main__":
    create_gif()
