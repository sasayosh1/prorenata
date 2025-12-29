import os
from utils.antigravity_paths import inbox_dir, unique_path

OUTPUT_DIR = inbox_dir("prorenata", "diagrams")

def create_svg_aptitude_test(filename):
    svg_content = """<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3e5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#7b1fa2">看護助手適性チェックフローチャート</text>
  
  <!-- Q1 -->
  <rect x="300" y="80" width="200" height="60" rx="10" fill="white" stroke="#ab47bc" stroke-width="2" />
  <text x="400" y="115" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">人と話すのが好き？</text>
  
  <!-- Lines -->
  <line x1="300" y1="110" x2="200" y2="160" stroke="#ab47bc" stroke-width="2" />
  <line x1="500" y1="110" x2="600" y2="160" stroke="#ab47bc" stroke-width="2" />
  
  <!-- Yes/No -->
  <text x="240" y="130" font-family="sans-serif" font-size="14" fill="#ab47bc">YES</text>
  <text x="540" y="130" font-family="sans-serif" font-size="14" fill="#ab47bc">NO</text>

  <!-- Q2 Left -->
  <rect x="100" y="160" width="200" height="60" rx="10" fill="white" stroke="#ab47bc" stroke-width="2" />
  <text x="200" y="195" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">体力に自信がある？</text>

  <!-- Q2 Right -->
  <rect x="500" y="160" width="200" height="60" rx="10" fill="white" stroke="#ab47bc" stroke-width="2" />
  <text x="600" y="195" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">細かい作業が得意？</text>

  <!-- Results -->
  <rect x="50" y="300" width="180" height="120" rx="10" fill="#e1bee7" />
  <text x="140" y="330" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#4a148c">病棟勤務向き</text>
  <text x="140" y="360" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">患者さんと接する</text>
  <text x="140" y="380" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">機会が多い現場へ</text>

  <rect x="310" y="300" width="180" height="120" rx="10" fill="#e1bee7" />
  <text x="400" y="330" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#4a148c">外来・クリニック向き</text>
  <text x="400" y="360" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">テキパキとした</text>
  <text x="400" y="380" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">対応が求められます</text>

  <rect x="570" y="300" width="180" height="120" rx="10" fill="#e1bee7" />
  <text x="660" y="330" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#4a148c">洗浄・滅菌向き</text>
  <text x="660" y="360" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">裏方として医療を</text>
  <text x="660" y="380" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#333">支えるスペシャリスト</text>

  <text x="400" y="470" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_daily_schedule(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f7fa" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#006064">看護助手の1日（日勤例）</text>
  
  <!-- Timeline Line -->
  <line x1="100" y1="100" x2="700" y2="100" stroke="#00bcd4" stroke-width="4" />
  
  <!-- 8:30 -->
  <circle cx="100" cy="100" r="10" fill="#00bcd4" />
  <text x="100" y="80" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#006064">8:30</text>
  <rect x="50" y="120" width="100" height="80" rx="5" fill="white" stroke="#00bcd4" />
  <text x="100" y="145" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">申し送り</text>
  <text x="100" y="165" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">環境整備</text>
  <text x="100" y="180" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">配茶</text>

  <!-- 10:00 -->
  <circle cx="250" cy="100" r="10" fill="#00bcd4" />
  <text x="250" y="80" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#006064">10:00</text>
  <rect x="200" y="120" width="100" height="80" rx="5" fill="white" stroke="#00bcd4" />
  <text x="250" y="145" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">ケア業務</text>
  <text x="250" y="165" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">入浴介助</text>
  <text x="250" y="180" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">シーツ交換</text>

  <!-- 12:00 -->
  <circle cx="400" cy="100" r="10" fill="#00bcd4" />
  <text x="400" y="80" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#006064">12:00</text>
  <rect x="350" y="120" width="100" height="80" rx="5" fill="white" stroke="#00bcd4" />
  <text x="400" y="145" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">昼食・休憩</text>
  <text x="400" y="165" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">配膳・下膳</text>
  <text x="400" y="180" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">食事介助</text>

  <!-- 14:00 -->
  <circle cx="550" cy="100" r="10" fill="#00bcd4" />
  <text x="550" y="80" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#006064">14:00</text>
  <rect x="500" y="120" width="100" height="80" rx="5" fill="white" stroke="#00bcd4" />
  <text x="550" y="145" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">検査出し</text>
  <text x="550" y="165" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">患者移送</text>
  <text x="550" y="180" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">検体搬送</text>

  <!-- 17:00 -->
  <circle cx="700" cy="100" r="10" fill="#00bcd4" />
  <text x="700" y="80" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#006064">17:00</text>
  <rect x="650" y="120" width="100" height="80" rx="5" fill="white" stroke="#00bcd4" />
  <text x="700" y="145" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#333">業務終了</text>
  <text x="700" y="165" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">記録記入</text>
  <text x="700" y="180" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#555">申し送り</text>

  <rect x="100" y="250" width="600" height="100" rx="10" fill="#b2ebf2" />
  <text x="400" y="290" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#006064">ポイント</text>
  <text x="400" y="320" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">患者さんの生活リズムに合わせたケアが中心です。</text>
  <text x="400" y="340" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#333">看護師と連携しながら動くことが大切です。</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_interview_tips(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff3e0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#e65100">面接官が見ている3つのポイント</text>
  
  <!-- Point 1 -->
  <circle cx="150" cy="150" r="80" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="150" y="130" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">清潔感</text>
  <text x="150" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">髪型・爪・服装</text>
  <text x="150" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">医療現場に</text>
  <text x="150" y="200" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">ふさわしいか</text>

  <!-- Point 2 -->
  <circle cx="400" cy="150" r="80" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="400" y="130" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">協調性</text>
  <text x="400" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">チーム医療の</text>
  <text x="400" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">一員として</text>
  <text x="400" y="200" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">働けるか</text>

  <!-- Point 3 -->
  <circle cx="650" cy="150" r="80" fill="white" stroke="#ff9800" stroke-width="3" />
  <text x="650" y="130" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#e65100">意欲</text>
  <text x="650" y="160" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">なぜ看護助手か</text>
  <text x="650" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">長く続けられ</text>
  <text x="650" y="200" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">そうか</text>

  <rect x="100" y="280" width="600" height="80" rx="10" fill="#ffe0b2" />
  <text x="400" y="325" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#e65100">「一緒に働きたい」と思われることが合格への近道！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_care_guide(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e8f5e9" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#2e7d32">ボディメカニクスの基本姿勢</text>
  
  <!-- Principle 1 -->
  <rect x="50" y="100" width="220" height="200" rx="10" fill="white" stroke="#4caf50" stroke-width="2" />
  <text x="160" y="140" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">支持基底面を広く</text>
  <text x="160" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">足を肩幅に開く</text>
  <text x="160" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">安定感が増し</text>
  <text x="160" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">ふらつき防止</text>

  <!-- Principle 2 -->
  <rect x="290" y="100" width="220" height="200" rx="10" fill="white" stroke="#4caf50" stroke-width="2" />
  <text x="400" y="140" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">重心を低く</text>
  <text x="400" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">膝を曲げて腰を落とす</text>
  <text x="400" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">腰への負担を</text>
  <text x="400" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">軽減します</text>

  <!-- Principle 3 -->
  <rect x="530" y="100" width="220" height="200" rx="10" fill="white" stroke="#4caf50" stroke-width="2" />
  <text x="640" y="140" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#2e7d32">対象に近づく</text>
  <text x="640" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">患者さんに密着</text>
  <text x="640" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">てこの原理で</text>
  <text x="640" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">小さな力で動く</text>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#c8e6c9" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1b5e20">腰痛予防のためにも、正しい姿勢を意識しましょう！</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_study_schedule(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3e5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#6a1b9a">働きながら合格！勉強スケジュール</text>
  
  <!-- Morning -->
  <rect x="50" y="100" width="220" height="200" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="160" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#6a1b9a">朝のスキマ時間</text>
  <text x="160" y="170" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">15分</text>
  <text x="160" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・単語帳チェック</text>
  <text x="160" y="235" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・前日の復習</text>
  <text x="160" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・アプリで1問</text>

  <!-- Commute -->
  <rect x="290" y="100" width="220" height="200" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="400" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#6a1b9a">通勤・休憩中</text>
  <text x="400" y="170" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">30分</text>
  <text x="400" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・動画講義視聴</text>
  <text x="400" y="235" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・音声学習</text>
  <text x="400" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・過去問アプリ</text>

  <!-- Night -->
  <rect x="530" y="100" width="220" height="200" rx="10" fill="white" stroke="#8e24aa" stroke-width="2" />
  <text x="640" y="140" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#6a1b9a">帰宅後・休日</text>
  <text x="640" y="170" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">60分〜</text>
  <text x="640" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・テキスト精読</text>
  <text x="640" y="235" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・模擬試験</text>
  <text x="640" y="260" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・ノートまとめ</text>

  <rect x="100" y="330" width="600" height="60" rx="5" fill="#e1bee7" />
  <text x="400" y="365" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#4a148c">「ちりつも」が合格への鍵！無理なく続けましょう</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_svg_aptitude_test(unique_path(os.path.join(OUTPUT_DIR, "aptitude_test.svg")))
    create_svg_daily_schedule(unique_path(os.path.join(OUTPUT_DIR, "daily_schedule.svg")))
    create_svg_interview_tips(unique_path(os.path.join(OUTPUT_DIR, "interview_tips.svg")))
    create_svg_care_guide(unique_path(os.path.join(OUTPUT_DIR, "care_guide.svg")))
    create_svg_study_schedule(unique_path(os.path.join(OUTPUT_DIR, "study_schedule.svg")))
