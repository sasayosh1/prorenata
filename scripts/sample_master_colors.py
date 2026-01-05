from PIL import Image
import collections

def sample_colors():
    img = Image.open("/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_base.jpg").convert("RGB")
    data = img.getdata()
    counts = collections.Counter(data)
    # Print top 20 colors to identify the blue
    for i, (color, count) in enumerate(counts.most_common(50)):
        print(f"#{i}: {color} - {count} pixels")

if __name__ == "__main__":
    sample_colors()
