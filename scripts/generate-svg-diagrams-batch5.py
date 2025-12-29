import os
from utils.antigravity_paths import inbox_dir, unique_path

OUTPUT_DIR = inbox_dir("prorenata", "diagrams")

def create_svg_career_vision(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f2f1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#00695c">看護助手のキャリアステップ</text>
  
  <!-- Step 1 -->
  <rect x="50" y="250" width="200" height="100" rx="5" fill="white" stroke="#26a69a" stroke-width="2" />
  <text x="150" y="290" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#00695c">未経験・新人</text>
  <text x="150" y="320" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">業務を覚える</text>
  <text x="150" y="340" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">環境に慣れる</text>

  <!-- Arrow 1 -->
  <polygon points="260,300 290,300 290,200 320,200 275,170 230,200 260,200" fill="#4db6ac" />

  <!-- Step 2 -->
  <rect x="300" y="150" width="200" height="100" rx="5" fill="white" stroke="#26a69a" stroke-width="2" />
  <text x="400" y="190" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#00695c">中堅・リーダー</text>
  <text x="400" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">新人指導</text>
  <text x="400" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">業務改善</text>

  <!-- Arrow 2 -->
  <polygon points="510,200 540,200 540,100 570,100 525,70 480,100 510,100" fill="#4db6ac" />

  <!-- Step 3 -->
  <rect x="550" y="50" width="200" height="100" rx="5" fill="white" stroke="#26a69a" stroke-width="2" />
  <text x="650" y="90" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#00695c">スペシャリスト</text>
  <text x="650" y="120" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">介護福祉士取得</text>
  <text x="650" y="140" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">看護師へ挑戦</text>

  <rect x="100" y="380" width="600" height="50" rx="5" fill="#b2dfdb" />
  <text x="400" y="410" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#004d40">目標を持つことで、日々の業務にやりがいが生まれます！</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_characteristics(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff3e0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#ef6c00">看護助手に向いている人の3つの特徴</text>
  
  <!-- Char 1 -->
  <circle cx="150" cy="180" r="90" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="150" y="160" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#ef6c00">気配り上手</text>
  <text x="150" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">患者さんの変化に</text>
  <text x="150" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">すぐ気づける</text>

  <!-- Char 2 -->
  <circle cx="400" cy="180" r="90" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="400" y="160" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#ef6c00">体力がある</text>
  <text x="400" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">立ち仕事や</text>
  <text x="400" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">移送介助も多い</text>

  <!-- Char 3 -->
  <circle cx="650" cy="180" r="90" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="650" y="160" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#ef6c00">聞き上手</text>
  <text x="650" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">患者さんの話を</text>
  <text x="650" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">優しく聞ける</text>

  <rect x="100" y="330" width="600" height="60" rx="10" fill="#ffe0b2" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#e65100">特別な資格よりも「人柄」が重視される仕事です</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_salary_comparison(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3e5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#7b1fa2">看護助手の平均給与比較（月収）</text>
  
  <!-- Bar 1 -->
  <rect x="100" y="250" width="100" height="100" fill="#ce93d8" />
  <text x="150" y="240" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">約20万円</text>
  <text x="150" y="370" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">常勤</text>
  <text x="150" y="390" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">（無資格）</text>

  <!-- Bar 2 -->
  <rect x="250" y="220" width="100" height="130" fill="#ba68c8" />
  <text x="300" y="210" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">約22万円</text>
  <text x="300" y="370" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">常勤</text>
  <text x="300" y="390" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">（有資格）</text>

  <!-- Bar 3 -->
  <rect x="400" y="180" width="100" height="170" fill="#9c27b0" />
  <text x="450" y="170" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">約25万円</text>
  <text x="450" y="370" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">夜勤あり</text>
  <text x="450" y="390" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">（月4回）</text>

  <!-- Bar 4 -->
  <rect x="550" y="300" width="100" height="50" fill="#e1bee7" />
  <text x="600" y="290" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">時給1100円~</text>
  <text x="600" y="370" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">パート</text>
  <text x="600" y="390" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">（地域による）</text>

  <line x1="50" y1="350" x2="750" y2="350" stroke="#333" stroke-width="2" />

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">※地域や病院規模により異なります © ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_terminology_guide(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e1f5fe" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#0277bd">看護助手の用語マスターマップ</text>
  
  <!-- Center -->
  <circle cx="400" cy="225" r="70" fill="white" stroke="#03a9f4" stroke-width="3" />
  <text x="400" y="230" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#0277bd">基本用語</text>

  <!-- Branch 1 -->
  <rect x="100" y="100" width="180" height="80" rx="10" fill="white" stroke="#03a9f4" />
  <text x="190" y="130" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ADL</text>
  <text x="190" y="155" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">日常生活動作</text>
  <line x1="280" y1="140" x2="350" y2="190" stroke="#03a9f4" stroke-width="2" />

  <!-- Branch 2 -->
  <rect x="520" y="100" width="180" height="80" rx="10" fill="white" stroke="#03a9f4" />
  <text x="610" y="130" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">QOL</text>
  <text x="610" y="155" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">生活の質</text>
  <line x1="520" y1="140" x2="450" y2="190" stroke="#03a9f4" stroke-width="2" />

  <!-- Branch 3 -->
  <rect x="100" y="270" width="180" height="80" rx="10" fill="white" stroke="#03a9f4" />
  <text x="190" y="300" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">バイタル</text>
  <text x="190" y="325" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">生命兆候</text>
  <line x1="280" y1="310" x2="350" y2="260" stroke="#03a9f4" stroke-width="2" />

  <!-- Branch 4 -->
  <rect x="520" y="270" width="180" height="80" rx="10" fill="white" stroke="#03a9f4" />
  <text x="610" y="300" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">カンファレンス</text>
  <text x="610" y="325" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">会議・打ち合わせ</text>
  <line x1="520" y1="310" x2="450" y2="260" stroke="#03a9f4" stroke-width="2" />

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_operating_room(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e8f5e9" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1b5e20">手術室看護助手の主な業務フロー</text>
  
  <!-- Step 1 -->
  <rect x="50" y="150" width="150" height="150" rx="10" fill="white" stroke="#43a047" stroke-width="2" />
  <text x="125" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1b5e20">術前準備</text>
  <text x="125" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・器械出し</text>
  <text x="125" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・部屋の清掃</text>
  <text x="125" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・物品補充</text>

  <!-- Arrow 1 -->
  <polygon points="210,225 240,225 240,200 270,225 240,250 240,225" fill="#66bb6a" />

  <!-- Step 2 -->
  <rect x="280" y="150" width="150" height="150" rx="10" fill="white" stroke="#43a047" stroke-width="2" />
  <text x="355" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1b5e20">術中サポート</text>
  <text x="355" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・検体搬送</text>
  <text x="355" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・環境整備</text>
  <text x="355" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・外回り補助</text>

  <!-- Arrow 2 -->
  <polygon points="440,225 470,225 470,200 500,225 470,250 470,225" fill="#66bb6a" />

  <!-- Step 3 -->
  <rect x="510" y="150" width="150" height="150" rx="10" fill="white" stroke="#43a047" stroke-width="2" />
  <text x="585" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1b5e20">術後片付け</text>
  <text x="585" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・器械洗浄</text>
  <text x="585" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・ゴミ回収</text>
  <text x="585" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・次症例準備</text>

  <rect x="100" y="350" width="600" height="50" rx="5" fill="#c8e6c9" />
  <text x="400" y="380" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#1b5e20">清潔・不潔の区別が最も重要なポイントです！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_svg_career_vision(unique_path(os.path.join(OUTPUT_DIR, "career_vision.svg")))
    create_svg_characteristics(unique_path(os.path.join(OUTPUT_DIR, "characteristics.svg")))
    create_svg_salary_comparison(unique_path(os.path.join(OUTPUT_DIR, "salary_comparison.svg")))
    create_svg_terminology_guide(unique_path(os.path.join(OUTPUT_DIR, "terminology_guide.svg")))
    create_svg_operating_room(unique_path(os.path.join(OUTPUT_DIR, "operating_room.svg")))
