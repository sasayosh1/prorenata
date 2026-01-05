from PIL import Image
import collections

def sample_blue_colors():
    img = Image.open("/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_base.jpg").convert("RGB")
    data = img.getdata()
    counts = collections.Counter(data)
    # Target colors where B is significantly higher than R and G
    blue_candidates = []
    for color, count in counts.items():
        r, g, b = color
        if b > r * 1.5 and b > g: # Typical blue logic
            blue_candidates.append((color, count))
    
    blue_candidates.sort(key=lambda x: x[1], reverse=True)
    for i, (color, count) in enumerate(blue_candidates[:20]):
        print(f"Blue Candidate #{i}: {color} - {count} pixels")

if __name__ == "__main__":
    sample_blue_colors()
