from PIL import Image
import os

# Configuration
INPUT_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_base.jpg"
OUTPUT_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_navy.png"
# Target Navy: Dark Blue
NAVY_COLOR = (30, 45, 90) # #1E2D5A

def apply_color_correction():
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found")
        return
    
    img = Image.open(INPUT_PATH).convert("RGB")
    data = img.getdata()
    
    new_data = []
    # Detected blue range from sampler: around (81, 143, 204)
    # We will use a wide enough range to catch shading but narrow enough to miss lines or skin
    
    for item in data:
        r, g, b = item
        
        # Check if the pixel is 'blueish'
        # Rule: B is dominant and significantly higher than R
        # And R, G are in the mid-range
        if b > r * 1.5 and b > g * 1.1 and b > 100:
            # This is a blue accent pixel. Replace with Navy.
            # To preserve shading, we can scale the navy, but user said "don't change color by shadow"
            # Let's try a flat navy first as requested.
            new_data.append(NAVY_COLOR)
        else:
            new_data.append(item)
            
    # Create final image
    out_img = Image.new("RGB", img.size)
    out_img.putdata(new_data)
    
    # Save as PNG
    out_img.save(OUTPUT_PATH)
    print(f"Master Correction Saved: {OUTPUT_PATH}")

if __name__ == "__main__":
    apply_color_correction()
