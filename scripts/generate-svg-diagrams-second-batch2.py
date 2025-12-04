import os

def create_svg_stress_relief_ranking(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff3e0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#e65100">看護助手のストレス解消法ランキング TOP5</text>
  
  <!-- Rank 1 -->
  <rect x="50" y="100" width="700" height="50" rx="5" fill="#ffcc80" />
  <text x="80" y="135" font-family="sans-serif" font-size="24" font-weight="bold" fill="#e65100">1位</text>
  <text x="150" y="135" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">美味しいものを食べる・飲む</text>
  <rect x="550" y="110" width="180" height="30" fill="#ffe0b2" />
  <rect x="550" y="110" width="160" height="30" fill="#ff9800" />
  <text x="740" y="132" font-family="sans-serif" font-size="14" fill="#333">45%</text>

  <!-- Rank 2 -->
  <rect x="50" y="160" width="700" height="50" rx="5" fill="#ffe0b2" />
  <text x="80" y="195" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ef6c00">2位</text>
  <text x="150" y="195" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">睡眠・休息をたっぷりとる</text>
  <rect x="550" y="170" width="180" height="30" fill="#fff3e0" />
  <rect x="550" y="170" width="120" height="30" fill="#ffb74d" />
  <text x="740" y="192" font-family="sans-serif" font-size="14" fill="#333">30%</text>

  <!-- Rank 3 -->
  <rect x="50" y="220" width="700" height="50" rx="5" fill="#fff3e0" />
  <text x="80" y="255" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f57c00">3位</text>
  <text x="150" y="255" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">趣味に没頭する（推し活など）</text>
  <rect x="550" y="230" width="180" height="30" fill="#fff8e1" />
  <rect x="550" y="230" width="80" height="30" fill="#ffcc80" />
  <text x="740" y="252" font-family="sans-serif" font-size="14" fill="#333">15%</text>

  <!-- Rank 4 -->
  <text x="150" y="300" font-family="sans-serif" font-size="18" fill="#555">4位：友人と話す・愚痴る</text>
  <!-- Rank 5 -->
  <text x="150" y="330" font-family="sans-serif" font-size="18" fill="#555">5位：運動・マッサージ</text>

  <rect x="100" y="360" width="600" height="50" rx="5" fill="#ffecb3" />
  <text x="400" y="395" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#f57f17">「オンオフの切り替え」が長く続けるコツです！</text>

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_useful_goods(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e1f5fe" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#0277bd">看護助手の「あると便利な神グッズ」5選</text>
  
  <!-- Item 1 -->
  <g transform="translate(50, 100)">
    <circle cx="60" cy="60" r="50" fill="white" stroke="#03a9f4" stroke-width="2" />
    <text x="60" y="55" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">着圧</text>
    <text x="60" y="75" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ソックス</text>
    <text x="60" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">むくみ防止</text>
  </g>

  <!-- Item 2 -->
  <g transform="translate(190, 100)">
    <circle cx="60" cy="60" r="50" fill="white" stroke="#03a9f4" stroke-width="2" />
    <text x="60" y="55" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ハンド</text>
    <text x="60" y="75" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">クリーム</text>
    <text x="60" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">手荒れ対策</text>
  </g>

  <!-- Item 3 -->
  <g transform="translate(330, 100)">
    <circle cx="60" cy="60" r="50" fill="white" stroke="#03a9f4" stroke-width="2" />
    <text x="60" y="55" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ナース</text>
    <text x="60" y="75" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ウォッチ</text>
    <text x="60" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">点滴確認等</text>
  </g>

  <!-- Item 4 -->
  <g transform="translate(470, 100)">
    <circle cx="60" cy="60" r="50" fill="white" stroke="#03a9f4" stroke-width="2" />
    <text x="60" y="55" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ペン</text>
    <text x="60" y="75" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ライト</text>
    <text x="60" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">夜勤の必需品</text>
  </g>

  <!-- Item 5 -->
  <g transform="translate(610, 100)">
    <circle cx="60" cy="60" r="50" fill="white" stroke="#03a9f4" stroke-width="2" />
    <text x="60" y="55" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">印鑑</text>
    <text x="60" y="75" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#0277bd">ホルダー</text>
    <text x="60" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">紛失防止</text>
  </g>

  <rect x="100" y="280" width="600" height="100" rx="10" fill="white" stroke="#0288d1" stroke-width="2" />
  <text x="400" y="310" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#0277bd">選ぶポイント</text>
  <text x="400" y="340" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">「軽量」「壊れにくい」「清潔に保てる」</text>
  <text x="400" y="360" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">この3点を重視しましょう！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_salary_simulation(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3e5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#7b1fa2">年収アップシミュレーション（例）</text>
  
  <!-- Axis -->
  <line x1="100" y1="350" x2="700" y2="350" stroke="#333" stroke-width="2" />
  <line x1="100" y1="350" x2="100" y2="100" stroke="#333" stroke-width="2" />

  <!-- Bar 1: Start -->
  <rect x="150" y="250" width="100" height="100" fill="#e1bee7" />
  <text x="200" y="240" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">280万円</text>
  <text x="200" y="380" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">1年目</text>
  <text x="200" y="400" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">無資格</text>

  <!-- Arrow -->
  <polygon points="270,300 310,300 310,280 340,300 310,320 310,300" fill="#ab47bc" />

  <!-- Bar 2: 3 Years -->
  <rect x="350" y="200" width="100" height="150" fill="#ba68c8" />
  <text x="400" y="190" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">320万円</text>
  <text x="400" y="380" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">3年目</text>
  <text x="400" y="400" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">介護福祉士</text>

  <!-- Arrow -->
  <polygon points="470,270 510,270 510,250 540,270 510,290 510,270" fill="#ab47bc" />

  <!-- Bar 3: Nurse -->
  <rect x="550" y="100" width="100" height="250" fill="#8e24aa" />
  <text x="600" y="90" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#4a148c">450万円~</text>
  <text x="600" y="380" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">5年目以降</text>
  <text x="600" y="400" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">看護師資格</text>

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">※金額は目安です © ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_aptitude_check_reverse(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffebee" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#c62828">向いていないかも？逆引きチェックと対策</text>
  
  <!-- Check 1 -->
  <rect x="50" y="100" width="340" height="120" rx="10" fill="white" stroke="#ef5350" stroke-width="2" />
  <text x="220" y="130" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">潔癖症である</text>
  <line x1="70" y1="145" x2="370" y2="145" stroke="#ffcdd2" stroke-width="2" />
  <text x="220" y="170" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">対策：手袋・マスクの着用徹底</text>
  <text x="220" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">「仕事」と割り切る意識</text>

  <!-- Check 2 -->
  <rect x="410" y="100" width="340" height="120" rx="10" fill="white" stroke="#ef5350" stroke-width="2" />
  <text x="580" y="130" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">体力に自信がない</text>
  <line x1="430" y1="145" x2="730" y2="145" stroke="#ffcdd2" stroke-width="2" />
  <text x="580" y="170" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">対策：ボディメカニクスの活用</text>
  <text x="580" y="190" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">無理せず周囲に協力依頼</text>

  <!-- Check 3 -->
  <rect x="50" y="240" width="340" height="120" rx="10" fill="white" stroke="#ef5350" stroke-width="2" />
  <text x="220" y="270" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">コミュニケーションが苦手</text>
  <line x1="70" y1="285" x2="370" y2="285" stroke="#ffcdd2" stroke-width="2" />
  <text x="220" y="310" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">対策：まずは「挨拶」から</text>
  <text x="220" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">聞き役に徹するのもOK</text>

  <!-- Check 4 -->
  <rect x="410" y="240" width="340" height="120" rx="10" fill="white" stroke="#ef5350" stroke-width="2" />
  <text x="580" y="270" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">不規則な生活が辛い</text>
  <line x1="430" y1="285" x2="730" y2="285" stroke="#ffcdd2" stroke-width="2" />
  <text x="580" y="310" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">対策：日勤のみの求人を探す</text>
  <text x="580" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">外来・クリニックを選ぶ</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_night_shift_schedule(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e8eaf6" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1a237e">夜勤のタイムスケジュール例（16時間夜勤）</text>
  
  <!-- Timeline Line -->
  <line x1="100" y1="100" x2="100" y2="400" stroke="#3949ab" stroke-width="4" />

  <!-- Event 1 -->
  <circle cx="100" cy="120" r="10" fill="#3949ab" />
  <text x="130" y="125" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1a237e">16:30 申し送り・業務開始</text>
  <text x="130" y="145" font-family="sans-serif" font-size="14" fill="#555">日勤からの引き継ぎ、夕食配膳準備</text>

  <!-- Event 2 -->
  <circle cx="100" cy="180" r="10" fill="#3949ab" />
  <text x="130" y="185" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1a237e">18:00 夕食介助・下膳</text>
  <text x="130" y="205" font-family="sans-serif" font-size="14" fill="#555">口腔ケア、就寝準備</text>

  <!-- Event 3 -->
  <circle cx="100" cy="240" r="10" fill="#3949ab" />
  <text x="130" y="245" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1a237e">21:00 消灯・巡回</text>
  <text x="130" y="265" font-family="sans-serif" font-size="14" fill="#555">ナースコール対応、オムツ交換</text>

  <!-- Event 4 -->
  <circle cx="100" cy="300" r="10" fill="#f44336" />
  <text x="130" y="305" font-family="sans-serif" font-size="16" font-weight="bold" fill="#c62828">01:00 仮眠休憩（2時間）</text>
  <text x="130" y="325" font-family="sans-serif" font-size="14" fill="#555">看護師と交代で休憩</text>

  <!-- Event 5 -->
  <circle cx="100" cy="360" r="10" fill="#3949ab" />
  <text x="130" y="365" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1a237e">06:00 起床・朝食準備</text>
  <text x="130" y="385" font-family="sans-serif" font-size="14" fill="#555">採血補助、申し送り、09:00終了</text>

  <rect x="500" y="250" width="250" height="100" rx="10" fill="white" stroke="#3949ab" stroke-width="2" />
  <text x="625" y="280" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1a237e">ポイント</text>
  <text x="625" y="310" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">夜間はスタッフが少ないため</text>
  <text x="625" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">報告・連絡・相談が重要！</text>

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    os.makedirs("generated_diagrams", exist_ok=True)
    create_svg_stress_relief_ranking("generated_diagrams/stress_relief_ranking.svg")
    create_svg_useful_goods("generated_diagrams/useful_goods.svg")
    create_svg_salary_simulation("generated_diagrams/salary_simulation.svg")
    create_svg_aptitude_check_reverse("generated_diagrams/aptitude_check_reverse.svg")
    create_svg_night_shift_schedule("generated_diagrams/night_shift_schedule.svg")
