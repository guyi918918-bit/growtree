#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

SRC = '/Users/mianmian/.workbuddy/clipboard-images/clipboard-2026-08-13T02-26-52-242Z-5de93f7f.png'
OUT_DIR = '/Users/mianmian/WorkBuddy/2026-08-09-16-35-36/workbench'

def rounded_mask(size, radius_ratio=0.22):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask

def make_icon(src_path, size, padding_ratio=0.08):
    img = Image.open(src_path).convert('RGBA')
    # 居中裁成正方形
    w, h = img.size
    s = min(w, h)
    left = (w - s) // 2
    top = (h - s) // 2
    square = img.crop((left, top, left + s, top + s))
    # 创建带圆角的方形画布
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    mask = rounded_mask(size)
    # 先把原图缩放并贴入圆角蒙版
    padding = int(size * padding_ratio)
    content_size = size - padding * 2
    scaled = square.resize((content_size, content_size), Image.Resampling.LANCZOS)
    # 给内容也加圆角（内容本身不带签名，不需要严格圆角，但这样更协调）
    content_mask = rounded_mask(content_size)
    content = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    content.paste(scaled, (padding, padding), content_mask)
    # 再整体应用外圆角
    canvas.paste(content, (0, 0), mask)
    return canvas

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 192x192 / 512x512 PWA 图标
    icon192 = make_icon(SRC, 192)
    icon192.save(os.path.join(OUT_DIR, 'icon-192x192.png'))

    icon512 = make_icon(SRC, 512)
    icon512.save(os.path.join(OUT_DIR, 'icon-512x512.png'))

    # Apple touch icon（无透明，使用背景色）
    icon180 = make_icon(SRC, 180)
    # 补成不透明背景（暖白/米黄），避免 Safari 显示黑底
    bg = Image.new('RGBA', (180, 180), (255, 250, 240, 255))
    bg.paste(icon180, (0, 0), icon180)
    bg.convert('RGB').save(os.path.join(OUT_DIR, 'apple-touch-icon.png'))

    # favicon.ico 多尺寸
    sizes = [(16, 16), (32, 32), (48, 48)]
    imgs = [make_icon(SRC, s).convert('RGBA') for s in [16, 32, 48]]
    imgs[0].save(
        os.path.join(OUT_DIR, 'favicon.ico'),
        format='ICO',
        sizes=sizes,
        append_images=imgs[1:]
    )

    print('Icons generated:', OUT_DIR)

if __name__ == '__main__':
    main()
