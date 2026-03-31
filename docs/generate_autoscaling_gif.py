"""
Traffic surge and Azure Container Apps autoscaling animation.

Generates a separate A4 portrait GIF that visualizes:
- external traffic increasing
- requests flowing through frontend and gateway
- autoscaling decisions inside Azure Container Apps
- replicas scaling out and load redistributing
"""

import glob
import os
from typing import Dict, Iterable, List, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

os.environ["PATH"] = r"C:\Program Files\Graphviz\bin;" + os.environ.get("PATH", "")

from diagrams import Diagram
from diagrams.azure.compute import ContainerApps
from diagrams.azure.database import CosmosDb
from diagrams.onprem.client import Users
from diagrams.programming.language import Nodejs


BASE_DIR = os.path.dirname(__file__)
FRAME_DIR = os.path.join(BASE_DIR, "autoscaling_frames")
ICON_DIR = os.path.join(BASE_DIR, "autoscaling_icon_cache")
OUTPUT_GIF = os.path.join(BASE_DIR, "container_apps_autoscaling.gif")

for folder in (FRAME_DIR, ICON_DIR):
    os.makedirs(folder, exist_ok=True)


A4_W = 1240
A4_H = 1754
TEXT = "#162033"
SUBTEXT = "#607086"
PANEL_FILL = "#ffffff"
PANEL_BORDER = "#d6deea"
PANEL_SOFT = "#f5f8fc"
AZURE_FILL = "#edf5ff"
AZURE_BORDER = "#9fc2f3"
GOOD = "#23925b"
ACTIVE = "#e1545f"
CALM = "#7ea9d6"
SHADOW = (18, 30, 54, 18)


def safe_font(name: str, size: int):
    try:
        return ImageFont.truetype(name, size)
    except Exception:
        return ImageFont.load_default()


TITLE_FONT = safe_font("arialbd.ttf", 36)
SUBTITLE_FONT = safe_font("arial.ttf", 18)
SECTION_FONT = safe_font("arialbd.ttf", 19)
BODY_FONT = safe_font("arial.ttf", 14)
CARD_TITLE_FONT = safe_font("arialbd.ttf", 16)
CARD_BODY_FONT = safe_font("arial.ttf", 13)
METRIC_FONT = safe_font("arialbd.ttf", 28)
SMALL_FONT = safe_font("arial.ttf", 12)


def add_shadow(base: Image.Image, box: Tuple[int, int, int, int], radius: int = 28) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    sx0, sy0, sx1, sy1 = box[0] + 7, box[1] + 10, box[2] + 7, box[3] + 10
    shadow_draw.rounded_rectangle((sx0, sy0, sx1, sy1), radius=radius, fill=SHADOW)
    base.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)))


def rounded(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], radius: int, fill, outline, width: int) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def render_icon(name: str, icon_cls) -> str:
    path = os.path.join(ICON_DIR, f"{name}.png")
    if os.path.exists(path):
        return path

    temp = os.path.join(ICON_DIR, f"_{name}")
    with Diagram("", filename=temp, show=False, outformat="png", graph_attr={"bgcolor": "transparent", "pad": "0.0", "dpi": "220"}):
        icon_cls(" ")

    temp_png = temp + ".png"
    image = Image.open(temp_png).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    cropped = image.crop(bbox) if bbox else image
    cropped.save(path)
    os.remove(temp_png)
    return path


USERS_ICON = lambda: render_icon("users", Users)
ACA_ICON = lambda: render_icon("aca", ContainerApps)
NODE_ICON = lambda: render_icon("node", Nodejs)
DB_ICON = lambda: render_icon("mongo", CosmosDb)


def paste_icon(base: Image.Image, icon_path: str, box: Tuple[int, int, int, int]) -> None:
    icon = Image.open(icon_path).convert("RGBA")
    x0, y0, x1, y1 = box
    width = x1 - x0
    height = y1 - y0
    scale = min(width / icon.width, height / icon.height)
    resized = icon.resize((max(1, int(icon.width * scale)), max(1, int(icon.height * scale))), Image.LANCZOS)
    x = x0 + (width - resized.width) // 2
    y = y0 + (height - resized.height) // 2
    base.alpha_composite(resized, (x, y))


def draw_background(base: Image.Image) -> None:
    draw = ImageDraw.Draw(base)
    draw.rectangle((0, 0, A4_W, A4_H), fill=(255, 255, 255))


def draw_header(draw: ImageDraw.ImageDraw, subtitle: str) -> None:
    draw.text((36, 36), "ShopEase Traffic Surge and ACA Autoscaling", fill=TEXT, font=TITLE_FONT)
    draw.text((36, 82), subtitle, fill=SUBTEXT, font=SUBTITLE_FONT)
    draw.text((914, 44), "Azure Container Apps", fill="#6f7f95", font=SECTION_FONT)


def draw_panel(base: Image.Image, draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, fill, border, accent: str = "#ffffff") -> None:
    add_shadow(base, box)
    rounded(draw, box, 28, fill, border, 2)
    accent_box = (box[0] + 18, box[1] + 18, box[0] + 250, box[1] + 58)
    rounded(draw, accent_box, 16, accent, border, 1)
    draw.text((box[0] + 32, box[1] + 27), title, fill=TEXT, font=SECTION_FONT)


def draw_card(base: Image.Image, draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, body: str, icon_path: str, badge_path: str | None = None, fill=PANEL_FILL, border=PANEL_BORDER) -> None:
    add_shadow(base, box, radius=24)
    rounded(draw, box, 24, fill, border, 2)
    paste_icon(base, icon_path, (box[0] + 18, box[1] + 14, box[0] + 92, box[1] + 88))
    if badge_path:
        badge = Image.open(badge_path).convert("RGBA")
        badge_scale = min(34 / badge.width, 34 / badge.height)
        badge = badge.resize((max(1, int(badge.width * badge_scale)), max(1, int(badge.height * badge_scale))), Image.LANCZOS)
        bx = box[2] - badge.width - 18
        by = box[1] + 18
        draw.ellipse((bx - 7, by - 7, bx + badge.width + 7, by + badge.height + 7), fill=(255, 255, 255), outline=border, width=1)
        base.alpha_composite(badge, (bx, by))
    draw.text((box[0] + 104, box[1] + 22), title, fill=TEXT, font=CARD_TITLE_FONT)
    line_y = box[1] + 48
    for line in body.split("\n")[:3]:
        draw.text((box[0] + 104, line_y), line, fill=SUBTEXT, font=CARD_BODY_FONT)
        line_y += 16


def draw_replica(base: Image.Image, draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, util: int, active: bool) -> None:
    fill = "#fff4d8" if active else PANEL_FILL
    border = "#ef9a4b" if active else PANEL_BORDER
    draw_card(base, draw, box, title, f"Node.js service\nCPU {util}%", ACA_ICON(), NODE_ICON(), fill=fill, border=border)
    util_box = (box[0] + 22, box[3] - 26, box[2] - 22, box[3] - 16)
    rounded(draw, util_box, 5, "#edf2f8", "#edf2f8", 1)
    filled = util_box[0] + int((util_box[2] - util_box[0]) * min(util, 100) / 100)
    rounded(draw, (util_box[0], util_box[1], filled, util_box[3]), 5, ACTIVE if util >= 80 else GOOD if util < 60 else "#f0b44d", ACTIVE if util >= 80 else GOOD if util < 60 else "#f0b44d", 1)


def draw_arrow(draw: ImageDraw.ImageDraw, points: List[Tuple[int, int]], color: str, width: int, label: str = "") -> None:
    for start, end in zip(points, points[1:]):
        draw.line([start, end], fill=color, width=width)
    tail = points[-2]
    head = points[-1]
    if head[0] == tail[0]:
        direction = 1 if head[1] > tail[1] else -1
        arrow = [(head[0], head[1]), (head[0] - 8, head[1] - 14 * direction), (head[0] + 8, head[1] - 14 * direction)]
    else:
        direction = 1 if head[0] > tail[0] else -1
        arrow = [(head[0], head[1]), (head[0] - 14 * direction, head[1] - 8), (head[0] - 14 * direction, head[1] + 8)]
    draw.polygon(arrow, fill=color)
    if label:
        lx = (points[0][0] + points[-1][0]) // 2
        ly = (points[0][1] + points[-1][1]) // 2 - 20
        box = draw.textbbox((0, 0), label, font=SMALL_FONT)
        tw = box[2] - box[0]
        th = box[3] - box[1]
        draw.rounded_rectangle((lx - tw // 2 - 8, ly - 4, lx + tw // 2 + 8, ly + th + 4), radius=12, fill=(255, 255, 255))
        draw.text((lx - tw // 2, ly), label, fill=color, font=SMALL_FONT)


def draw_traffic_bars(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], levels: List[int], highlight_index: int) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=18, fill="#fbfdff", outline="#d6deea", width=2)
    draw.text((x0 + 18, y0 + 14), "Traffic", fill=TEXT, font=SECTION_FONT)
    base_y = y1 - 26
    bar_w = 40
    gap = 18
    start_x = x0 + 28
    for index, level in enumerate(levels):
        bx0 = start_x + index * (bar_w + gap)
        bx1 = bx0 + bar_w
        by0 = base_y - level
        color = ACTIVE if index == highlight_index else CALM
        draw.rounded_rectangle((bx0, by0, bx1, base_y), radius=10, fill=color, outline=color, width=1)


def draw_metric(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, value: str, status: str, color: str) -> None:
    draw.rounded_rectangle(box, radius=22, fill="#ffffff", outline="#d6deea", width=2)
    draw.text((box[0] + 18, box[1] + 16), title, fill=SUBTEXT, font=BODY_FONT)
    draw.text((box[0] + 18, box[1] + 44), value, fill=TEXT, font=METRIC_FONT)
    draw.text((box[0] + 18, box[1] + 84), status, fill=color, font=BODY_FONT)


def draw_scale_badge(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], title: str, detail: str, active: bool) -> None:
    fill = "#fff4d8" if active else PANEL_SOFT
    border = "#ef9a4b" if active else PANEL_BORDER
    draw.rounded_rectangle(box, radius=22, fill=fill, outline=border, width=2)
    draw.text((box[0] + 18, box[1] + 16), title, fill=TEXT, font=CARD_TITLE_FONT)
    draw.text((box[0] + 18, box[1] + 44), detail, fill=SUBTEXT, font=BODY_FONT)


FRAMES = [
    {
        "subtitle": "Low traffic - one replica handles the current load",
        "traffic": [24, 28, 26, 30, 34],
        "highlight": 4,
        "rps": "120 req/s",
        "cpu": "38% avg CPU",
        "decision": "No scale event",
        "decision_detail": "Min replicas = 1",
        "replicas": [38],
        "active": 0,
        "traffic_burst": 4,
        "status": "Stable",
    },
    {
        "subtitle": "Traffic begins rising from external users",
        "traffic": [24, 32, 44, 58, 72],
        "highlight": 4,
        "rps": "420 req/s",
        "cpu": "66% avg CPU",
        "decision": "Watching metrics",
        "decision_detail": "Threshold: 70% CPU",
        "replicas": [66],
        "active": 0,
        "traffic_burst": 7,
        "status": "Rising",
    },
    {
        "subtitle": "Traffic spike hits the API layer",
        "traffic": [28, 46, 68, 92, 126],
        "highlight": 4,
        "rps": "860 req/s",
        "cpu": "88% avg CPU",
        "decision": "Scale rule triggered",
        "decision_detail": "CPU > 70%, queue depth rising",
        "replicas": [88],
        "active": 0,
        "traffic_burst": 10,
        "status": "Critical",
    },
    {
        "subtitle": "Azure Container Apps adds a second replica",
        "traffic": [28, 46, 68, 92, 126],
        "highlight": 4,
        "rps": "860 req/s",
        "cpu": "52% avg CPU",
        "decision": "Scale out to 2",
        "decision_detail": "Load split across replicas",
        "replicas": [56, 48],
        "active": 1,
        "traffic_burst": 10,
        "status": "Scaling",
    },
    {
        "subtitle": "Demand keeps climbing, more replicas are added",
        "traffic": [40, 58, 86, 118, 148],
        "highlight": 4,
        "rps": "1250 req/s",
        "cpu": "58% avg CPU",
        "decision": "Scale out to 3",
        "decision_detail": "Autoscaler keeps latency low",
        "replicas": [62, 55, 49],
        "active": 2,
        "traffic_burst": 13,
        "status": "Scaling",
    },
    {
        "subtitle": "Burst traffic peaks and four replicas distribute the load",
        "traffic": [56, 82, 112, 146, 176],
        "highlight": 4,
        "rps": "1680 req/s",
        "cpu": "54% avg CPU",
        "decision": "Scale out to 4",
        "decision_detail": "Healthy response under heavy load",
        "replicas": [56, 53, 49, 51],
        "active": 3,
        "traffic_burst": 16,
        "status": "Healthy",
    },
    {
        "subtitle": "Traffic stabilizes and the service stays responsive",
        "traffic": [48, 72, 96, 118, 126],
        "highlight": 4,
        "rps": "1220 req/s",
        "cpu": "46% avg CPU",
        "decision": "Hold at 4 replicas",
        "decision_detail": "Cool-down window active",
        "replicas": [48, 44, 46, 45],
        "active": 0,
        "traffic_burst": 11,
        "status": "Stable",
    },
    {
        "subtitle": "After the peak, Azure Container Apps can later scale back down",
        "traffic": [24, 28, 34, 42, 56],
        "highlight": 4,
        "rps": "280 req/s",
        "cpu": "32% avg CPU",
        "decision": "Future scale-in",
        "decision_detail": "Scale-to-idle policy can reduce cost",
        "replicas": [32, 28],
        "active": 1,
        "traffic_burst": 5,
        "status": "Optimized",
    },
]


def draw_request_stream(draw: ImageDraw.ImageDraw, amount: int, color: str) -> None:
    base_y = 1116
    start_x = 218
    for index in range(amount):
        offset = index * 42
        draw.line([(start_x + offset, base_y), (start_x + 18 + offset, base_y)], fill=color, width=5)
        draw.polygon([(start_x + 18 + offset, base_y), (start_x + 6 + offset, base_y - 7), (start_x + 6 + offset, base_y + 7)], fill=color)


def build_frame(frame_index: int, spec: Dict[str, object]) -> str:
    base = Image.new("RGBA", (A4_W, A4_H), (255, 255, 255, 255))
    draw_background(base)
    draw = ImageDraw.Draw(base)
    draw_header(draw, str(spec["subtitle"]))

    draw_panel(base, draw, (28, 126, 1212, 420), "Traffic Input and Runtime Entry", PANEL_SOFT, PANEL_BORDER)
    draw_panel(base, draw, (28, 454, 1212, 1356), "Azure Container Apps Autoscaling", AZURE_FILL, AZURE_BORDER, accent="#ffffff")
    draw_panel(base, draw, (28, 1392, 1212, 1700), "Data and Scaling Outcome", PANEL_SOFT, PANEL_BORDER)

    draw_traffic_bars(draw, (54, 184, 378, 390), spec["traffic"], int(spec["highlight"]))
    draw_metric(draw, (408, 184, 646, 302), "Incoming traffic", str(spec["rps"]), str(spec["status"]), ACTIVE if spec["status"] in {"Critical", "Rising"} else GOOD)
    draw_metric(draw, (664, 184, 902, 302), "Replica load", str(spec["cpu"]), str(spec["decision"]), GOOD if "No scale" in str(spec["decision"]) or "Hold" in str(spec["decision"]) else ACTIVE)
    draw_scale_badge(draw, (920, 184, 1178, 302), "Autoscale decision", str(spec["decision_detail"]), "Scale" in str(spec["decision"]) or "Future" in str(spec["decision"]))

    draw_card(base, draw, (432, 326, 654, 404), "External Users", "Web and mobile\ntraffic surge", USERS_ICON())

    draw_card(base, draw, (96, 530, 240, 676), "Frontend", "Container App\nNode.js UI", ACA_ICON(), NODE_ICON(), fill="#ffffff", border=AZURE_BORDER)
    draw_card(base, draw, (278, 530, 240 + 182, 676), "API Gateway", "Container App\nNode.js routing", ACA_ICON(), NODE_ICON(), fill="#ffffff", border=AZURE_BORDER)

    draw.rounded_rectangle((500, 520, 1168, 1268), radius=30, fill="#ffffff", outline=AZURE_BORDER, width=2)
    draw.text((526, 542), "Order Service Autoscaling Group", fill=TEXT, font=SECTION_FONT)
    draw.text((526, 574), "Scale rule: CPU > 70% or sustained request surge", fill=SUBTEXT, font=BODY_FONT)

    replica_boxes = [
        (532, 630, 816, 770),
        (852, 630, 1136, 770),
        (532, 818, 816, 958),
        (852, 818, 1136, 958),
    ]
    replicas = spec["replicas"]
    active_index = int(spec["active"])
    for index, box in enumerate(replica_boxes):
        if index < len(replicas):
            draw_replica(base, draw, box, f"Replica {index + 1}", int(replicas[index]), index == active_index)
        else:
            draw.rounded_rectangle(box, radius=24, fill="#f6f8fb", outline="#dfe6ef", width=2)
            draw.text((box[0] + 68, box[1] + 42), "Standby slot", fill="#95a1b3", font=CARD_TITLE_FONT)
            draw.text((box[0] + 68, box[1] + 68), "Created when scale-out happens", fill="#95a1b3", font=BODY_FONT)

    draw_scale_badge(draw, (532, 1016, 820, 1134), "Replica count", f"Live replicas: {len(replicas)}", len(replicas) > 1)
    draw_scale_badge(draw, (848, 1016, 1136, 1134), "Load outcome", "Requests spread across active replicas", len(replicas) > 1)

    draw_card(base, draw, (454, 1458, 786, 1612), "MongoDB Atlas Cluster", "Single cluster\nshared persistence layer", DB_ICON(), fill="#ffffff", border=PANEL_BORDER)
    draw_scale_badge(draw, (812, 1458, 1154, 1612), "Result", "Autoscaling protects latency and availability", True)

    draw_arrow(draw, [(544, 404), (544, 446), (168, 446), (168, 530)], CALM, 4, "traffic")
    draw_arrow(draw, [(240, 603), (278, 603)], CALM, 4, "static + API")
    draw_arrow(draw, [(460, 603), (500, 603), (500, 700), (532, 700)], ACTIVE if int(spec["traffic_burst"]) > 9 else CALM, 5, "orders")
    draw_request_stream(draw, int(spec["traffic_burst"]), ACTIVE if int(spec["traffic_burst"]) > 9 else CALM)

    if len(replicas) >= 2:
        draw_arrow(draw, [(676, 782), (676, 794), (996, 794), (996, 770)], GOOD, 4, "scale out")
    if len(replicas) >= 3:
        draw_arrow(draw, [(676, 782), (676, 808), (676, 818)], GOOD, 4, "")
    if len(replicas) >= 4:
        draw_arrow(draw, [(996, 782), (996, 808), (996, 818)], GOOD, 4, "")

    for x in (674, 996):
        if x == 996 and len(replicas) < 2:
            continue
        draw_arrow(draw, [(x, 958), (x, 1348), (620, 1348), (620, 1458)], CALM, 3, "")
    if len(replicas) >= 3:
        draw_arrow(draw, [(674, 958), (674, 1328), (620, 1328), (620, 1458)], CALM, 3, "")
    if len(replicas) >= 4:
        draw_arrow(draw, [(996, 958), (996, 1308), (620, 1308), (620, 1458)], CALM, 3, "")

    out_path = os.path.join(FRAME_DIR, f"frame{frame_index:02d}.png")
    base.convert("RGB").save(out_path, "PNG")
    return out_path


def create_gif() -> None:
    print("\n  Generating Azure Container Apps autoscaling GIF...\n")

    for old_file in glob.glob(os.path.join(FRAME_DIR, "frame*.png")):
        os.remove(old_file)

    for index, spec in enumerate(FRAMES, start=1):
        build_frame(index, spec)
        print(f"  [OK] Frame {index:2d}: {spec['subtitle']}")

    frame_paths = sorted(glob.glob(os.path.join(FRAME_DIR, "frame*.png")))
    if not frame_paths:
        raise RuntimeError("No autoscaling frames were generated.")

    frames = [Image.open(path).convert("RGB") for path in frame_paths]
    durations = [2200, 1800, 1800, 2000, 2000, 2200, 2600, 2800]

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