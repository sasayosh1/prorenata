import os
from utils.antigravity_paths import inbox_dir, unique_path

OUTPUT_DIR = inbox_dir("prorenata", "diagrams")

def create_svg_resume_motivation(filename):
    svg_content = """<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3e5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#6a1b9a">志望動機の黄金構成テンプレート</text>
  
  <!-- Block 1: Conclusion -->
  <rect x="150" y="100" width="500" height="80" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="180" y="130" font-family="sans-serif" font-size="18" font-weight="bold" fill="#6a1b9a">1. 結論（書き出し）</text>
  <text x="180" y="160" font-family="sans-serif" font-size="14" fill="#333">「貴院の〇〇という理念に共感し、志望いたしました」</text>
  
  <!-- Arrow -->
  <polygon points="400,190 420,210 380,210" fill="#8e24aa" />

  <!-- Block 2: Experience -->
  <rect x="150" y="220" width="500" height="80" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="180" y="250" font-family="sans-serif" font-size="18" font-weight="bold" fill="#6a1b9a">2. 経験・エピソード</text>
  <text x="180" y="280" font-family="sans-serif" font-size="14" fill="#333">「前職の接客業では、常にお客様の立場で考えることを...」</text>

  <!-- Arrow -->
  <polygon points="400,310 420,330 380,330" fill="#8e24aa" />

  <!-- Block 3: Contribution -->
  <rect x="150" y="340" width="500" height="80" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="180" y="370" font-family="sans-serif" font-size="18" font-weight="bold" fill="#6a1b9a">3. 入社後の貢献</text>
  <text x="180" y="400" font-family="sans-serif" font-size="14" fill="#333">「この経験を活かし、患者様に寄り添ったケアで貢献したいです」</text>

  <text x="400" y="470" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_interview_qa(filename):
    svg_content = """<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff3e0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#e65100">よくある質問と回答のポイント</text>
  
  <!-- Q1 -->
  <g transform="translate(50, 100)">
    <rect x="0" y="0" width="340" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
    <text x="20" y="35" font-family="sans-serif" font-size="16" font-weight="bold" fill="#e65100">Q. なぜ看護助手ですか？</text>
    <line x1="20" y1="50" x2="320" y2="50" stroke="#ffe0b2" stroke-width="2" />
    <text x="20" y="80" font-family="sans-serif" font-size="14" fill="#333">Good: 「人の役に立つ仕事がしたい」</text>
    <text x="20" y="100" font-family="sans-serif" font-size="14" fill="#333">　　　 「医療現場を支えたい」</text>
    <text x="20" y="130" font-family="sans-serif" font-size="14" fill="#d32f2f">NG: 「楽そうだから」「資格がいらないから」</text>
  </g>

  <!-- Q2 -->
  <g transform="translate(410, 100)">
    <rect x="0" y="0" width="340" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
    <text x="20" y="35" font-family="sans-serif" font-size="16" font-weight="bold" fill="#e65100">Q. 前職の退職理由は？</text>
    <line x1="20" y1="50" x2="320" y2="50" stroke="#ffe0b2" stroke-width="2" />
    <text x="20" y="80" font-family="sans-serif" font-size="14" fill="#333">Good: 「ステップアップのため」</text>
    <text x="20" y="100" font-family="sans-serif" font-size="14" fill="#333">　　　 「新しい分野への挑戦」</text>
    <text x="20" y="130" font-family="sans-serif" font-size="14" fill="#d32f2f">NG: 「人間関係が悪かった」「給料が安い」</text>
  </g>

  <!-- Q3 -->
  <g transform="translate(50, 270)">
    <rect x="0" y="0" width="340" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
    <text x="20" y="35" font-family="sans-serif" font-size="16" font-weight="bold" fill="#e65100">Q. 体力に自信はありますか？</text>
    <line x1="20" y1="50" x2="320" y2="50" stroke="#ffe0b2" stroke-width="2" />
    <text x="20" y="80" font-family="sans-serif" font-size="14" fill="#333">Good: 「部活で鍛えていました」</text>
    <text x="20" y="100" font-family="sans-serif" font-size="14" fill="#333">　　　 「前職も立ち仕事でした」</text>
    <text x="20" y="130" font-family="sans-serif" font-size="14" fill="#d32f2f">NG: 「あまりありません」「腰痛持ちです」</text>
  </g>

  <!-- Tips -->
  <g transform="translate(410, 270)">
    <rect x="0" y="0" width="340" height="150" rx="10" fill="#ffe0b2" />
    <text x="170" y="40" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#e65100">ポイント</text>
    <text x="170" y="80" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">ネガティブな内容も</text>
    <text x="170" y="110" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">ポジティブに言い換える！</text>
  </g>

  <text x="400" y="470" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_wheelchair_transfer(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e8f5e9" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#2e7d32">車椅子への移乗手順（ベッド→車椅子）</text>
  
  <!-- Step 1 -->
  <g transform="translate(50, 100)">
    <rect x="0" y="0" width="160" height="200" rx="8" fill="white" stroke="#4caf50" stroke-width="2" />
    <text x="80" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">1. 準備</text>
    <text x="80" y="70" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">車椅子をベッドの</text>
    <text x="80" y="90" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">健側に置く</text>
    <text x="80" y="120" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#d32f2f">★ブレーキ確認</text>
    <text x="80" y="140" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#d32f2f">★フットレスト上げる</text>
  </g>

  <!-- Step 2 -->
  <g transform="translate(230, 100)">
    <rect x="0" y="0" width="160" height="200" rx="8" fill="white" stroke="#4caf50" stroke-width="2" />
    <text x="80" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">2. 端座位</text>
    <text x="80" y="70" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">ベッドの端に</text>
    <text x="80" y="90" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">座ってもらう</text>
    <text x="80" y="120" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">足裏が床に</text>
    <text x="80" y="140" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">ついているか確認</text>
  </g>

  <!-- Step 3 -->
  <g transform="translate(410, 100)">
    <rect x="0" y="0" width="160" height="200" rx="8" fill="white" stroke="#4caf50" stroke-width="2" />
    <text x="80" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">3. 移乗</text>
    <text x="80" y="70" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">患者さんの腰を持ち</text>
    <text x="80" y="90" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">回転させるように</text>
    <text x="80" y="120" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">車椅子へ座らせる</text>
    <text x="80" y="140" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#555">（お辞儀の姿勢で）</text>
  </g>

  <!-- Step 4 -->
  <g transform="translate(590, 100)">
    <rect x="0" y="0" width="160" height="200" rx="8" fill="white" stroke="#4caf50" stroke-width="2" />
    <text x="80" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">4. 整える</text>
    <text x="80" y="70" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">深く座れているか確認</text>
    <text x="80" y="100" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">フットレストに</text>
    <text x="80" y="120" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#333">足を乗せる</text>
  </g>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#c8e6c9" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1b5e20">「声かけ」を忘れずに、患者さんのペースで！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_nurse_study_schedule_weekly(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e3f2fd" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1565c0">働きながら学ぶ！1週間のスケジュール例</text>
  
  <!-- Weekdays -->
  <rect x="50" y="100" width="450" height="200" rx="10" fill="white" stroke="#2196f3" stroke-width="2" />
  <text x="275" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#1565c0">平日（月〜金）</text>
  
  <line x1="100" y1="170" x2="400" y2="170" stroke="#bbdefb" stroke-width="2" />
  <text x="100" y="200" font-family="sans-serif" font-size="16" fill="#333">08:30 - 12:30</text>
  <text x="220" y="200" font-family="sans-serif" font-size="16" font-weight="bold" fill="#333">病院勤務（午前）</text>
  
  <line x1="100" y1="220" x2="400" y2="220" stroke="#bbdefb" stroke-width="2" />
  <text x="100" y="250" font-family="sans-serif" font-size="16" fill="#333">13:30 - 16:30</text>
  <text x="220" y="250" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1565c0">看護学校（授業）</text>
  
  <line x1="100" y1="270" x2="400" y2="270" stroke="#bbdefb" stroke-width="2" />
  <text x="100" y="300" font-family="sans-serif" font-size="16" fill="#333">18:00 - 20:00</text>
  <text x="220" y="300" font-family="sans-serif" font-size="16" fill="#555">自習・課題</text>

  <!-- Weekend -->
  <rect x="530" y="100" width="220" height="200" rx="10" fill="white" stroke="#f44336" stroke-width="2" />
  <text x="640" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#c62828">土日・祝日</text>
  <text x="640" y="180" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">完全オフ</text>
  <text x="640" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">または</text>
  <text x="640" y="240" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">アルバイト</text>
  <text x="640" y="270" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">（試験前は勉強）</text>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#bbdefb" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#0d47a1">半日勤務＋半日学校のスタイルが一般的です</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_clean_unclean_area(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f2f1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#00695c">手術室の「清潔・不潔」エリアマップ</text>
  
  <!-- Unclean Area (Outer) -->
  <rect x="50" y="100" width="700" height="300" rx="10" fill="#cfd8dc" stroke="#546e7a" stroke-width="2" />
  <text x="100" y="130" font-family="sans-serif" font-size="20" font-weight="bold" fill="#37474f">不潔エリア（外回り）</text>
  <text x="100" y="160" font-family="sans-serif" font-size="14" fill="#333">・床</text>
  <text x="100" y="180" font-family="sans-serif" font-size="14" fill="#333">・麻酔器周辺</text>
  <text x="100" y="200" font-family="sans-serif" font-size="14" fill="#333">・ゴミ箱</text>
  <text x="100" y="220" font-family="sans-serif" font-size="14" fill="#333">・看護助手の主な居場所</text>

  <!-- Clean Area (Inner) -->
  <rect x="250" y="150" width="450" height="200" rx="10" fill="#e0f7fa" stroke="#00bcd4" stroke-width="3" stroke-dasharray="5,5" />
  <text x="475" y="180" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#006064">清潔エリア（術野）</text>
  <text x="475" y="210" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#d32f2f">立ち入り禁止！</text>
  
  <rect x="300" y="230" width="100" height="80" fill="#80deea" stroke="#00838f" />
  <text x="350" y="275" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#006064">器械台</text>

  <rect x="450" y="230" width="200" height="80" fill="#80deea" stroke="#00838f" />
  <text x="550" y="275" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#006064">手術台（患者様）</text>

  <!-- Warning -->
  <rect x="250" y="370" width="450" height="40" rx="5" fill="#ffcdd2" stroke="#e53935" />
  <text x="475" y="395" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#b71c1c">清潔なものには絶対に触れない！近づかない！</text>

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_svg_resume_motivation(unique_path(os.path.join(OUTPUT_DIR, "resume_motivation.svg")))
    create_svg_interview_qa(unique_path(os.path.join(OUTPUT_DIR, "interview_qa.svg")))
    create_svg_wheelchair_transfer(unique_path(os.path.join(OUTPUT_DIR, "wheelchair_transfer.svg")))
    create_svg_nurse_study_schedule_weekly(unique_path(os.path.join(OUTPUT_DIR, "nurse_study_schedule_weekly.svg")))
    create_svg_clean_unclean_area(unique_path(os.path.join(OUTPUT_DIR, "clean_unclean_area.svg")))
