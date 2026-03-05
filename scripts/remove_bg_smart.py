from PIL import Image
from collections import deque
import sys

def flood_fill_transparent(input_path, output_path, tolerance=25):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # 輪郭抽出用のBFS（外側から塗りつぶす）
    start_points = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set()
    queue = deque(start_points)
    
    # 基準となる背景色は左上のピクセルとする
    bg_color = pixels[0, 0]
    
    def color_distance(c1, c2):
        return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))
    
    while queue:
        x, y = queue.popleft()
        
        if (x, y) in visited:
            continue
            
        visited.add((x, y))
        current_color = pixels[x, y]
        
        # 背景色に近い場合のみ透過し、隣接ピクセルを探索キューに入れる
        if color_distance(current_color, bg_color) <= tolerance * 3:
            pixels[x, y] = (255, 255, 255, 0) # 透明化
            
            # 上下左右のピクセルを追加
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    img.save(output_path, "PNG")
    print(f"Smart background removed successfully: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg_smart.py <input> <output>")
        sys.exit(1)
    flood_fill_transparent(sys.argv[1], sys.argv[2], tolerance=30)
