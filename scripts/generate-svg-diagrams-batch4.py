import os
from utils.antigravity_paths import inbox_dir, unique_path

OUTPUT_DIR = inbox_dir("prorenata", "diagrams")

def create_svg_medical_terms(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e3f2fd" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1565c0">現場でよく使う医療用語・略語</text>
  
  <!-- Group 1 -->
  <g transform="translate(50, 90)">
    <rect x="0" y="0" width="220" height="140" rx="8" fill="white" stroke="#2196f3" stroke-width="2" />
    <text x="110" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">バイタルサイン</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#333">BP: 血圧</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#333">KT: 体温</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#333">P / HR: 脈拍</text>
  </g>

  <!-- Group 2 -->
  <g transform="translate(290, 90)">
    <rect x="0" y="0" width="220" height="140" rx="8" fill="white" stroke="#2196f3" stroke-width="2" />
    <text x="110" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">食事・排泄</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#333">エッセン: 食事</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#333">ウロ: 尿</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#333">ベン: 便</text>
  </g>

  <!-- Group 3 -->
  <g transform="translate(530, 90)">
    <rect x="0" y="0" width="220" height="140" rx="8" fill="white" stroke="#2196f3" stroke-width="2" />
    <text x="110" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">処置・検査</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#333">オペ: 手術</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#333">ムンテラ: 説明</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#333">アナムネ: 問診</text>
  </g>

  <!-- Tips Box -->
  <rect x="100" y="260" width="600" height="100" rx="10" fill="#bbdefb" />
  <text x="400" y="300" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#0d47a1">覚え方のコツ</text>
  <text x="400" y="330" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">まずは「よく耳にする言葉」からメモして覚えましょう。</text>
  <text x="400" y="350" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">分からない言葉はすぐに先輩に確認！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_communication_tips(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff3e0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#e65100">信頼されるコミュニケーションの基本</text>
  
  <!-- Circle 1 -->
  <circle cx="200" cy="180" r="90" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="200" y="160" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">報告・連絡・相談</text>
  <text x="200" y="190" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">（ホウレンソウ）</text>
  <text x="200" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">小さな変化も共有</text>

  <!-- Circle 2 -->
  <circle cx="600" cy="180" r="90" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="600" y="160" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">傾聴と共感</text>
  <text x="600" y="190" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">（うなずき・あいづち）</text>
  <text x="600" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">患者さんの心に寄り添う</text>

  <!-- Center Connection -->
  <rect x="320" y="160" width="160" height="40" rx="20" fill="#ffe0b2" />
  <text x="400" y="185" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#e65100">信頼関係</text>

  <rect x="100" y="320" width="600" height="60" rx="10" fill="white" stroke="#ffcc80" />
  <text x="400" y="355" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#ef6c00">「笑顔」と「挨拶」が全ての始まりです！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_night_shift(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eceff1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#37474f">夜勤を乗り切る！生活リズム調整法</text>
  
  <!-- Phase 1: Before -->
  <rect x="50" y="100" width="220" height="200" rx="10" fill="white" stroke="#546e7a" stroke-width="2" />
  <text x="160" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#37474f">夜勤入り前</text>
  <text x="160" y="180" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・遅めの起床</text>
  <text x="160" y="210" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・仮眠をとる</text>
  <text x="160" y="240" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">（90分程度）</text>
  <text x="160" y="270" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・消化の良い食事</text>

  <!-- Phase 2: During -->
  <rect x="290" y="100" width="220" height="200" rx="10" fill="white" stroke="#546e7a" stroke-width="2" />
  <text x="400" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#37474f">夜勤中</text>
  <text x="400" y="180" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・こまめな水分補給</text>
  <text x="400" y="210" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・休憩中の仮眠</text>
  <text x="400" y="240" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">（15-30分）</text>
  <text x="400" y="270" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・ストレッチ</text>

  <!-- Phase 3: After -->
  <rect x="530" y="100" width="220" height="200" rx="10" fill="white" stroke="#546e7a" stroke-width="2" />
  <text x="640" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#37474f">夜勤明け</text>
  <text x="640" y="180" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・朝日を浴びない</text>
  <text x="640" y="210" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">（サングラス活用）</text>
  <text x="640" y="240" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">・帰宅後すぐに寝る</text>
  <text x="640" y="270" font-family="sans-serif" font-size="15" text-anchor="middle" fill="#333">（3-4時間）</text>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#cfd8dc" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#263238">無理せず自分のペースを見つけましょう</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_certification_merit(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f1f8e9" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#33691e">看護助手資格取得の3大メリット</text>
  
  <!-- Merit 1 -->
  <g transform="translate(50, 100)">
    <polygon points="110,10 210,60 110,110 10,60" fill="white" stroke="#7cb342" stroke-width="2" />
    <text x="110" y="55" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#33691e">給与アップ</text>
    <text x="110" y="80" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">資格手当の支給</text>
  </g>

  <!-- Merit 2 -->
  <g transform="translate(290, 100)">
    <polygon points="110,10 210,60 110,110 10,60" fill="white" stroke="#7cb342" stroke-width="2" />
    <text x="110" y="55" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#33691e">採用有利</text>
    <text x="110" y="80" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">即戦力として評価</text>
  </g>

  <!-- Merit 3 -->
  <g transform="translate(530, 100)">
    <polygon points="110,10 210,60 110,110 10,60" fill="white" stroke="#7cb342" stroke-width="2" />
    <text x="110" y="55" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#33691e">自信がつく</text>
    <text x="110" y="80" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">正しい知識でケア</text>
  </g>

  <!-- Arrow Up -->
  <polygon points="400,230 450,300 350,300" fill="#8bc34a" />
  <rect x="375" y="300" width="50" height="50" fill="#8bc34a" />
  
  <text x="400" y="380" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#33691e">キャリアアップの第一歩！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_career_change_timing(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fffde7" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#fbc02d">転職にベストなタイミングは？</text>
  
  <!-- Timing 1 -->
  <rect x="50" y="100" width="220" height="200" rx="10" fill="white" stroke="#fdd835" stroke-width="2" />
  <text x="160" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#fbc02d">ボーナス後</text>
  <text x="160" y="180" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">7月・12月</text>
  <text x="160" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">賞与を受け取って</text>
  <text x="160" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">から退職</text>

  <!-- Timing 2 -->
  <rect x="290" y="100" width="220" height="200" rx="10" fill="white" stroke="#fdd835" stroke-width="2" />
  <text x="400" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#fbc02d">年度変わり</text>
  <text x="400" y="180" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">3月・4月</text>
  <text x="400" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">求人数が増加</text>
  <text x="400" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">心機一転スタート</text>

  <!-- Timing 3 -->
  <rect x="530" y="100" width="220" height="200" rx="10" fill="white" stroke="#fdd835" stroke-width="2" />
  <text x="640" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#fbc02d">資格取得後</text>
  <text x="640" y="180" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">随時</text>
  <text x="640" y="220" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">実務者研修など</text>
  <text x="640" y="240" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">資格を武器に</text>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#fff9c4" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57f17">退職の意思表示は「1〜2ヶ月前」がマナーです</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_svg_medical_terms(unique_path(os.path.join(OUTPUT_DIR, "medical_terms.svg")))
    create_svg_communication_tips(unique_path(os.path.join(OUTPUT_DIR, "communication_tips.svg")))
    create_svg_night_shift(unique_path(os.path.join(OUTPUT_DIR, "night_shift.svg")))
    create_svg_certification_merit(unique_path(os.path.join(OUTPUT_DIR, "certification_merit.svg")))
    create_svg_career_change_timing(unique_path(os.path.join(OUTPUT_DIR, "career_change_timing.svg")))
