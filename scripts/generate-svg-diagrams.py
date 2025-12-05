import os
import base64

# Configuration
# Source for chibi assets
CHIBI_DIR = "画像/chibi chara"
# Output for generated diagrams
OUTPUT_DIR = "画像/diagram"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_base64_image(filename):
    path = os.path.join(CHIBI_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: Image not found at {path}")
        return ""
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def create_svg_resume_checklist(filename, base64_img):
    img_tag = f'<image href="data:image/png;base64,{base64_img}" x="650" y="300" height="150" width="150" />' if base64_img else ""
    svg_content = f"""<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f7ff" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">履歴書作成の重要チェックポイント</text>
  
  <!-- Box 1 -->
  <rect x="50" y="80" width="700" height="80" rx="10" fill="white" stroke="#4a90e2" stroke-width="2" />
  <circle cx="90" cy="120" r="20" fill="#4a90e2" />
  <text x="90" y="128" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">1</text>
  <text x="130" y="115" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">志望動機の一貫性</text>
  <text x="130" y="140" font-family="sans-serif" font-size="16" fill="#666">「なぜこの病院か」「なぜ看護助手か」が繋がっているか確認</text>
  
  <!-- Box 2 -->
  <rect x="50" y="180" width="700" height="80" rx="10" fill="white" stroke="#4a90e2" stroke-width="2" />
  <circle cx="90" cy="220" r="20" fill="#4a90e2" />
  <text x="90" y="228" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">2</text>
  <text x="130" y="215" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">丁寧な文字と修正ゼロ</text>
  <text x="130" y="240" font-family="sans-serif" font-size="16" fill="#666">修正液はNG。黒のボールペンで丁寧に記入しましょう</text>

  <!-- Box 3 -->
  <rect x="50" y="280" width="700" height="80" rx="10" fill="white" stroke="#4a90e2" stroke-width="2" />
  <circle cx="90" cy="320" r="20" fill="#4a90e2" />
  <text x="90" y="328" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">3</text>
  <text x="130" y="315" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">写真は清潔感を最優先</text>
  <text x="130" y="340" font-family="sans-serif" font-size="16" fill="#666">スーツ着用、髪型を整えて。第一印象が決まります</text>

  {img_tag}

  <text x="400" y="430" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">© ProReNata</text>
</svg>"""
    with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
        f.write(svg_content)
    print(f"Created {os.path.join(OUTPUT_DIR, filename)}")

def create_svg_interview_flow(filename, base64_img):
    img_tag = f'<image href="data:image/png;base64,{base64_img}" x="650" y="50" height="120" width="120" />' if base64_img else ""
    svg_content = f"""<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff5f5" />
  <text x="400" y="40" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">面接当日の流れ</text>
  
  <!-- Step 1 -->
  <circle cx="100" cy="100" r="40" fill="#ff7f7f" />
  <text x="100" y="108" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">到着</text>
  <text x="100" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">10分前には到着</text>
  
  <!-- Arrow -->
  <path d="M150 100 L200 100" stroke="#333" stroke-width="2" marker-end="url(#arrow)" />
  
  <!-- Step 2 -->
  <circle cx="250" cy="100" r="40" fill="#ff7f7f" />
  <text x="250" y="108" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">受付</text>
  <text x="250" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">明るく挨拶</text>

  <!-- Arrow -->
  <path d="M300 100 L350 100" stroke="#333" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Step 3 -->
  <circle cx="400" cy="100" r="40" fill="#ff7f7f" />
  <text x="400" y="108" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">待機</text>
  <text x="400" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">スマホは見ない</text>

  <!-- Arrow -->
  <path d="M450 100 L500 100" stroke="#333" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Step 4 -->
  <circle cx="550" cy="100" r="40" fill="#ff7f7f" />
  <text x="550" y="108" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">入室</text>
  <text x="550" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">ノックは3回</text>

  <!-- Main Content Box -->
  <rect x="50" y="200" width="700" height="250" rx="10" fill="white" stroke="#ff7f7f" stroke-width="2" />
  <text x="400" y="230" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#333">面接中のポイント</text>
  
  <text x="80" y="270" font-family="sans-serif" font-size="18" fill="#333">• 結論から話す</text>
  <text x="80" y="310" font-family="sans-serif" font-size="18" fill="#333">• 相手の目を見て話す（アイコンタクト）</text>
  <text x="80" y="350" font-family="sans-serif" font-size="18" fill="#333">• 質問には具体的に答える</text>
  <text x="80" y="390" font-family="sans-serif" font-size="18" fill="#333">• 最後まで気を抜かない（退室までが面接）</text>

  {img_tag}

  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#333" />
    </marker>
  </defs>
  
  <text x="400" y="480" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">© ProReNata</text>
</svg>"""
    with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
        f.write(svg_content)
    print(f"Created {os.path.join(OUTPUT_DIR, filename)}")

def create_svg_transfer_safety(filename, base64_img):
    img_tag = f'<image href="data:image/png;base64,{base64_img}" x="650" y="250" height="150" width="150" />' if base64_img else ""
    svg_content = f"""<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f2f1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#00695c">移乗介助の安全確認フロー</text>
  
  <circle cx="400" cy="150" r="100" fill="white" stroke="#00695c" stroke-width="4" />
  <text x="400" y="130" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">準備</text>
  <text x="400" y="160" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#666">麻痺側の確認</text>
  <text x="400" y="180" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#666">環境整備</text>
  
  <path d="M400 250 L400 300" stroke="#00695c" stroke-width="4" marker-end="url(#arrow)" />
  
  <rect x="200" y="300" width="400" height="100" rx="10" fill="white" stroke="#00695c" stroke-width="2" />
  <text x="400" y="330" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">実施</text>
  <text x="400" y="360" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#333">声かけ・ボディメカニクス活用</text>
  
  <rect x="50" y="100" width="200" height="100" rx="5" fill="#b2dfdb" />
  <text x="150" y="130" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#004d40">歩く速度より</text>
  <text x="150" y="160" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#004d40">少しゆっくり</text>

  <rect x="50" y="250" width="250" height="60" rx="5" fill="#80cbc4" />
  <text x="175" y="290" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#004d40">無理をしましょう</text>

  {img_tag}

  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#00695c" />
    </marker>
  </defs>
  
  <text x="400" y="430" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle">© ProReNata</text>
</svg>"""
    with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
        f.write(svg_content)
    print(f"Created {os.path.join(OUTPUT_DIR, filename)}")

if __name__ == "__main__":
    # Load base64 image
    sera_img = get_base64_image("sera_thinking.png")
    
    create_svg_resume_checklist("resume_checklist.svg", sera_img)
    create_svg_interview_flow("interview_flow.svg", sera_img)
    create_svg_transfer_safety("transfer_safety.svg", sera_img)
