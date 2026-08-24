import os
from PIL import Image

src_dir = r"d:\tuong-mask-vietnam\frontend\public\static\images"
files = [f for f in os.listdir(src_dir) if f.endswith(".png")]

total_png_size = 0
total_webp_size = 0

print(f"Converting {len(files)} PNG images to WebP...")

for f in files:
    png_path = os.path.join(src_dir, f)
    webp_path = os.path.join(src_dir, os.path.splitext(f)[0] + ".webp")
    
    png_size = os.path.getsize(png_path)
    total_png_size += png_size
    
    with Image.open(png_path) as img:
        img.save(webp_path, "WEBP", quality=88, method=6)
        
    webp_size = os.path.getsize(webp_path)
    total_webp_size += webp_size

print(f"\nDone!")
print(f"Original PNG size: {total_png_size / (1024*1024):.2f} MB")
print(f"Converted WebP size: {total_webp_size / (1024*1024):.2f} MB")
print(f"Saved: {(1 - total_webp_size/total_png_size) * 100:.1f}% bandwidth!")
