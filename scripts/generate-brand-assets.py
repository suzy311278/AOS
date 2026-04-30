#!/usr/bin/env python3
"""
Generate Greentryst brand assets as PNG files.
Uses Pillow to create logos and LinkedIn banner.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Brand colors
COLORS = {
    'dark_bg': '#081C15',
    'white': '#FFFFFF',
    'leaf': '#52B788',
    'medium': '#2D6A4F',
    'charcoal': '#081C15',
    'light_bg': '#FAFBFA',
    'glow': '#52B788',
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def hex_to_rgba(hex_color, alpha=255):
    """Convert hex color to RGBA tuple."""
    rgb = hex_to_rgb(hex_color)
    return (*rgb, alpha)

# Output directory
OUTPUT_DIR = '/Users/knowprajjwal/LearningPlatform/public/brand'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Try to load Inter font, fall back to default
def get_font(size, bold=False):
    """Get font, trying Inter first, then system fonts."""
    font_paths = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf',
    ]

    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue

    # Fallback to default
    return ImageFont.load_default()

def create_logo_dark(width=400, height=80):
    """Create logo for dark backgrounds."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font = get_font(56, bold=True)

    # Draw "Green" in white
    green_text = "Green"
    draw.text((20, 10), green_text, font=font, fill=hex_to_rgb(COLORS['white']))

    # Get width of "Green" to position "tryst"
    green_bbox = draw.textbbox((20, 10), green_text, font=font)
    green_width = green_bbox[2] - green_bbox[0]

    # Draw "tryst" in leaf green
    draw.text((20 + green_width, 10), "tryst", font=font, fill=hex_to_rgb(COLORS['leaf']))

    img.save(os.path.join(OUTPUT_DIR, 'logo-dark.png'), 'PNG')
    print(f"Created: logo-dark.png ({width}x{height})")
    return img

def create_logo_light(width=400, height=80):
    """Create logo for light backgrounds."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font = get_font(56, bold=True)

    # Draw "Green" in charcoal
    green_text = "Green"
    draw.text((20, 10), green_text, font=font, fill=hex_to_rgb(COLORS['charcoal']))

    # Get width of "Green" to position "tryst"
    green_bbox = draw.textbbox((20, 10), green_text, font=font)
    green_width = green_bbox[2] - green_bbox[0]

    # Draw "tryst" in medium green
    draw.text((20 + green_width, 10), "tryst", font=font, fill=hex_to_rgb(COLORS['medium']))

    img.save(os.path.join(OUTPUT_DIR, 'logo-light.png'), 'PNG')
    print(f"Created: logo-light.png ({width}x{height})")
    return img

def create_logo_icon(size=200):
    """Create circular logo icon with G."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw dark circle background
    padding = 0
    draw.ellipse([padding, padding, size-padding, size-padding],
                 fill=hex_to_rgb(COLORS['dark_bg']))

    # Draw subtle glow circle
    glow_size = int(size * 0.6)
    glow_offset = (size - glow_size) // 2
    for i in range(20, 0, -2):
        alpha = int(15 * (i / 20))
        glow_color = hex_to_rgba(COLORS['glow'], alpha)
        offset = i * 2
        draw.ellipse([glow_offset - offset, glow_offset - offset,
                      glow_offset + glow_size + offset, glow_offset + glow_size + offset],
                     fill=glow_color)

    # Draw "G" in white
    font = get_font(int(size * 0.5), bold=True)
    text = "G"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)
    draw.text((x, y), text, font=font, fill=hex_to_rgb(COLORS['white']))

    # Draw accent dot
    dot_radius = int(size * 0.08)
    dot_x = int(size * 0.72)
    dot_y = int(size * 0.28)
    draw.ellipse([dot_x - dot_radius, dot_y - dot_radius,
                  dot_x + dot_radius, dot_y + dot_radius],
                 fill=hex_to_rgb(COLORS['leaf']))

    img.save(os.path.join(OUTPUT_DIR, 'logo-icon.png'), 'PNG')
    print(f"Created: logo-icon.png ({size}x{size})")
    return img

def create_linkedin_banner():
    """Create LinkedIn banner (1584x396)."""
    width, height = 1584, 396
    img = Image.new('RGB', (width, height), hex_to_rgb(COLORS['dark_bg']))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Draw subtle gradient glows - positioned away from text
    for glow in [
        {'x': -100, 'y': -100, 'r': 350, 'color': COLORS['leaf'], 'alpha': 15},
        {'x': width + 50, 'y': height + 100, 'r': 300, 'color': COLORS['medium'], 'alpha': 18},
        {'x': int(width * 0.7), 'y': -150, 'r': 250, 'color': COLORS['leaf'], 'alpha': 10},
    ]:
        for i in range(glow['r'], 0, -8):
            alpha = int(glow['alpha'] * (i / glow['r']) * 0.5)
            color = hex_to_rgba(glow['color'], alpha)
            draw.ellipse([glow['x'] - i, glow['y'] - i, glow['x'] + i, glow['y'] + i], fill=color)

    # Draw subtle dot grid
    for x in range(0, width, 32):
        for y in range(0, height, 32):
            draw.ellipse([x, y, x+1, y+1], fill=hex_to_rgba(COLORS['white'], 12))

    # Draw logo
    font_large = get_font(64, bold=True)
    font_medium = get_font(28, bold=False)
    font_small = get_font(14, bold=False)
    font_stat = get_font(36, bold=True)

    x_start = 80
    y_logo = 80

    # "Green" in white
    green_text = "Green"
    draw.text((x_start, y_logo), green_text, font=font_large, fill=hex_to_rgb(COLORS['white']))
    green_bbox = draw.textbbox((x_start, y_logo), green_text, font=font_large)
    green_width = green_bbox[2] - green_bbox[0]

    # "tryst" in leaf
    tryst_x = x_start + green_width
    draw.text((tryst_x, y_logo), "tryst", font=font_large, fill=hex_to_rgb(COLORS['leaf']))

    # Get position of "tryst" to align content underneath (between y and s)
    tryst_bbox = draw.textbbox((tryst_x, y_logo), "tryst", font=font_large)
    tryst_width = tryst_bbox[2] - tryst_bbox[0]
    # Position content to start under the middle of "tryst" (between y and s)
    x_content = tryst_x + int(tryst_width * 0.5)
    y_tagline = y_logo + 80
    draw.text((x_content, y_tagline), "The professional operating system for",
              font=font_medium, fill=hex_to_rgba(COLORS['white'], 180))
    draw.text((x_content, y_tagline + 36), "sustainability.",
              font=font_medium, fill=hex_to_rgb(COLORS['leaf']))

    # Platform dimensions - pills (40px to the right of logo)
    y_dims = y_tagline + 90
    dimensions = [
        "Courses",
        "Tools",
        "Jobs",
        "Regulations",
        "SustainIQ",
    ]

    font_dim = get_font(16, bold=True)
    x_dim = x_content
    pill_height = 36
    pill_gap = 12

    for dim in dimensions:
        bbox = draw.textbbox((0, 0), dim, font=font_dim)
        text_width = bbox[2] - bbox[0]
        pill_width = text_width + 28

        # Draw pill background
        draw.rounded_rectangle([x_dim, y_dims, x_dim + pill_width, y_dims + pill_height],
                               radius=18, fill=hex_to_rgba(COLORS['leaf'], 30),
                               outline=hex_to_rgba(COLORS['leaf'], 70))

        # Draw text
        draw.text((x_dim + 14, y_dims + 8), dim, font=font_dim, fill=hex_to_rgb(COLORS['leaf']))

        x_dim += pill_width + pill_gap

    # Right side - stats in 2 horizontal rows
    stats_row1 = [
        ("22+", "Courses"),
        ("470+", "Lessons"),
        ("530+", "Source Docs"),
        ("100%", "Sourced"),
    ]

    stats_row2 = [
        ("120+", "Regulations"),
        ("1000+", "Jobs"),
        ("50+", "Countries"),
        ("6", "Pro Tools"),
    ]

    font_stat_value = get_font(25, bold=True)
    font_stat_label = get_font(13, bold=False)

    x_start_stats = width - 580
    col_width = 135
    y_row1 = 100
    y_row2 = 210

    # Row 1
    for i, (value, label) in enumerate(stats_row1):
        x = x_start_stats + i * col_width
        draw.text((x, y_row1), value, font=font_stat_value, fill=hex_to_rgb(COLORS['white']))
        draw.text((x, y_row1 + 26), label.upper(), font=font_stat_label, fill=hex_to_rgba(COLORS['white'], 120))

    # Row 2
    for i, (value, label) in enumerate(stats_row2):
        x = x_start_stats + i * col_width
        draw.text((x, y_row2), value, font=font_stat_value, fill=hex_to_rgb(COLORS['white']))
        draw.text((x, y_row2 + 26), label.upper(), font=font_stat_label, fill=hex_to_rgba(COLORS['white'], 120))

    img.save(os.path.join(OUTPUT_DIR, 'linkedin-banner.png'), 'PNG')
    print(f"Created: linkedin-banner.png ({width}x{height})")
    return img

def create_favicon(size=32):
    """Create favicon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw dark circle
    draw.ellipse([0, 0, size, size], fill=hex_to_rgb(COLORS['dark_bg']))

    # Draw "G"
    font = get_font(int(size * 0.6), bold=True)
    text = "G"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 2
    draw.text((x, y), text, font=font, fill=hex_to_rgb(COLORS['white']))

    # Accent dot
    dot_r = 3
    draw.ellipse([size - 10, 6, size - 4, 12], fill=hex_to_rgb(COLORS['leaf']))

    img.save(os.path.join(OUTPUT_DIR, 'favicon.png'), 'PNG')
    print(f"Created: favicon.png ({size}x{size})")
    return img

if __name__ == '__main__':
    print("Generating Greentryst brand assets...\n")

    create_logo_dark()
    create_logo_light()
    create_logo_icon()
    create_logo_icon(400)  # Larger version
    create_favicon()
    create_linkedin_banner()

    print(f"\nAll assets saved to: {OUTPUT_DIR}")
