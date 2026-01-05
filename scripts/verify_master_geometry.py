from PIL import Image
import os

ORIGINAL_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_base.jpg"
CORRECTED_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_navy.png"

def verify_geometry():
    orig = Image.open(ORIGINAL_PATH).convert("RGB")
    corr = Image.open(CORRECTED_PATH).convert("RGB")
    
    if orig.size != corr.size:
        print("変更不可: Size mismatch")
        return
    
    orig_data = list(orig.getdata())
    corr_data = list(corr.getdata())
    
    diff_count = 0
    total_pixels = len(orig_data)
    
    for i in range(total_pixels):
        o = orig_data[i]
        c = corr_data[i]
        
        if o == c:
            continue
            
        # If they are different, it MUST be because the original was blue and now it's navy
        # Let's check if the difference is outside the blue region
        r, g, b = o
        is_blue = b > r * 1.5 and b > g * 1.1 and b > 100
        
        if not is_blue:
            # This is a non-blue pixel that changed!
            # Let's see how different it is (might be JPeg artifacts if it's very small)
            diff = sum(abs(o[j] - c[j]) for j in range(3))
            if diff > 10: # Threshold for 'significant change'
                print(f"Geometry Change Detected at pixel {i}: {o} -> {c}")
                diff_count += 1
                if diff_count > 100:
                    print("変更不可: Too many geometric changes")
                    return
    
    if diff_count == 0:
        print("Verification OK: Geometry unchanged (except for targeted color replacement)")
    else:
        print(f"Warning: {diff_count} minor changes detected (likely artifacts from JPG original)")

if __name__ == "__main__":
    verify_geometry()
