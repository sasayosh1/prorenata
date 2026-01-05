import os
import base64

# Configuration
CHIBI_DIR = "public/挿絵"
OUTPUT_DIR = "generated_diagrams"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_base64_image(filename):
    path = os.path.join(CHIBI_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: Image not found at {path}")
        return ""
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def create_svg_interview_mindset(filename, base64_img):
    img_tag = f'<image href="data:image/png;base64,{base64_img}" x="620" y="280" height="150" width="150" />' if base64_img else ""
    svg_content = f"""<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with soft gradient feel -->
  <rect width="100%" height="100%" fill="#fff9f9" />
  <rect width="100%" height="80" fill="#ff7f7f" />
  <text x="400" y="52" font-family="sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="white">看護助手・面接突破の3か条</text>
  
  <!-- Box 1: Preparation -->
  <rect x="50" y="110" width="550" height="90" rx="15" fill="white" stroke="#ff7f7f" stroke-width="3" />
  <text x="80" y="145" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ff4f4f">1. 「なぜ看護助手か」を言語化する</text>
  <text x="80" y="175" font-family="sans-serif" font-size="16" fill="#666">自身の経験（家族の介護、接客業など）と繋げて話せる準備を。</text>
  
  <!-- Box 2: Appearance -->
  <rect x="50" y="220" width="550" height="90" rx="15" fill="white" stroke="#ff7f7f" stroke-width="3" />
  <text x="80" y="255" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ff4f4f">2. 清潔感こそが最大の自己PR</text>
  <text x="80" y="285" font-family="sans-serif" font-size="16" fill="#666">髪型、爪、服装のシワ。医療従事者としての適性を見られています。</text>
  
  <!-- Box 3: Attitude -->
  <rect x="50" y="330" width="550" height="90" rx="15" fill="white" stroke="#ff7f7f" stroke-width="3" />
  <text x="80" y="365" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ff4f4f">3. 「聞き上手」であることを示す</text>
  <text x="80" y="395" font-family="sans-serif" font-size="16" fill="#666">笑顔でハキハキと受け答え。コミュニケーション能力が重視されます。</text>

  {img_tag}
  
  <!-- Footer -->
  <text x="400" y="440" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">© ProReNata | 看護助手のための情報サイト</text>
</svg>"""
    out_path = os.path.join(OUTPUT_DIR, filename)
    with open(out_path, "w") as f:
        f.write(svg_content)
    print(f"Created {out_path}")

if __name__ == "__main__":
    # Try multiple possible filenames for the chibi image
    possible_images = ["sera_chibi_thinking.png", "sera_chibi.png", "chibi_sera.png"]
    sera_img = ""
    for img_name in possible_images:
        sera_img = get_base64_image(img_name)
        if sera_img:
            print(f"Using image: {img_name}")
            break
            
    create_svg_interview_mindset("interview_mindset.svg", sera_img)
