import os
from utils.antigravity_paths import inbox_dir, unique_path

OUTPUT_DIR = inbox_dir("prorenata", "diagrams")

def create_svg_stress_relationships(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff5f5" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#c62828">人間関係ストレス対処の3ステップ</text>
  
  <!-- Step 1 -->
  <g transform="translate(50, 100)">
    <rect x="0" y="0" width="220" height="250" rx="10" fill="white" stroke="#e57373" stroke-width="2" />
    <circle cx="110" cy="40" r="25" fill="#e57373" />
    <text x="110" y="50" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">1</text>
    <text x="110" y="85" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">状況を整理</text>
    <text x="110" y="120" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・何が辛いのか</text>
    <text x="110" y="145" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・誰との関係か</text>
    <text x="110" y="170" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・いつ起こるか</text>
    <text x="110" y="210" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#888">紙に書き出すと</text>
    <text x="110" y="230" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#888">頭が整理されます</text>
  </g>

  <!-- Step 2 -->
  <g transform="translate(290, 100)">
    <rect x="0" y="0" width="220" height="250" rx="10" fill="white" stroke="#e57373" stroke-width="2" />
    <circle cx="110" cy="40" r="25" fill="#e57373" />
    <text x="110" y="50" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">2</text>
    <text x="110" y="85" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">距離を取る</text>
    <text x="110" y="120" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・必要最低限の</text>
    <text x="110" y="145" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">　会話にする</text>
    <text x="110" y="170" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・休憩時間は</text>
    <text x="110" y="195" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">　別の場所で</text>
  </g>

  <!-- Step 3 -->
  <g transform="translate(530, 100)">
    <rect x="0" y="0" width="220" height="250" rx="10" fill="white" stroke="#e57373" stroke-width="2" />
    <circle cx="110" cy="40" r="25" fill="#e57373" />
    <text x="110" y="50" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">3</text>
    <text x="110" y="85" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#c62828">相談・記録</text>
    <text x="110" y="120" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・信頼できる</text>
    <text x="110" y="145" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">　先輩に相談</text>
    <text x="110" y="170" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">・日時と内容を</text>
    <text x="110" y="195" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">　メモに残す</text>
  </g>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_nurse_route(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e8f5e9" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#2e7d32">看護助手から看護師への3つのルート</text>
  
  <!-- Route 1 -->
  <rect x="50" y="100" width="220" height="280" rx="10" fill="white" stroke="#66bb6a" stroke-width="2" />
  <rect x="50" y="100" width="220" height="50" rx="10" fill="#66bb6a" />
  <text x="160" y="132" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">正看護師ルート</text>
  <text x="160" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">看護学校（3年）</text>
  <text x="160" y="205" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">↓</text>
  <text x="160" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">国家試験合格</text>
  <text x="160" y="260" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#2e7d32">期間: 3年</text>
  <text x="160" y="285" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">費用: 200-300万円</text>
  <text x="160" y="310" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">（奨学金利用可）</text>

  <!-- Route 2 -->
  <rect x="290" y="100" width="220" height="280" rx="10" fill="white" stroke="#66bb6a" stroke-width="2" />
  <rect x="290" y="100" width="220" height="50" rx="10" fill="#66bb6a" />
  <text x="400" y="132" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">准看護師ルート</text>
  <text x="400" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">准看護学校（2年）</text>
  <text x="400" y="205" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">↓</text>
  <text x="400" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">都道府県試験合格</text>
  <text x="400" y="260" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#2e7d32">期間: 2年</text>
  <text x="400" y="285" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">費用: 100-200万円</text>
  <text x="400" y="310" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">（働きながら可）</text>

  <!-- Route 3 -->
  <rect x="530" y="100" width="220" height="280" rx="10" fill="white" stroke="#66bb6a" stroke-width="2" />
  <rect x="530" y="100" width="220" height="50" rx="10" fill="#66bb6a" />
  <text x="640" y="132" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">通信制ルート</text>
  <text x="640" y="180" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">准看護師取得後</text>
  <text x="640" y="205" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">↓</text>
  <text x="640" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">通信制（2年）</text>
  <text x="640" y="260" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#2e7d32">期間: 2年</text>
  <text x="640" y="285" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">費用: 80-150万円</text>
  <text x="640" y="310" font-family="sans-serif" font-size="13" text-anchor="middle" fill="#666">（働きながら）</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_essentials_checklist(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff8e1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#f57c00">看護助手の必須持ち物チェックリスト</text>
  
  <!-- Category 1 -->
  <g transform="translate(50, 90)">
    <rect x="0" y="0" width="340" height="140" rx="8" fill="white" stroke="#ffb74d" stroke-width="2" />
    <text x="170" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57c00">基本アイテム</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#555">✓ 腕時計（秒針付き）</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#555">✓ ボールペン（黒・赤）</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#555">✓ メモ帳・ポケットノート</text>
  </g>

  <!-- Category 2 -->
  <g transform="translate(410, 90)">
    <rect x="0" y="0" width="340" height="140" rx="8" fill="white" stroke="#ffb74d" stroke-width="2" />
    <text x="170" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57c00">衛生用品</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#555">✓ ハンドクリーム</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#555">✓ リップクリーム</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#555">✓ マスク（予備）</text>
  </g>

  <!-- Category 3 -->
  <g transform="translate(50, 250)">
    <rect x="0" y="0" width="340" height="140" rx="8" fill="white" stroke="#ffb74d" stroke-width="2" />
    <text x="170" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57c00">快適グッズ</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#555">✓ 着圧ソックス</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#555">✓ ポケットティッシュ</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#555">✓ 小銭入れ</text>
  </g>

  <!-- Category 4 -->
  <g transform="translate(410, 250)">
    <rect x="0" y="0" width="340" height="140" rx="8" fill="white" stroke="#ffb74d" stroke-width="2" />
    <text x="170" y="30" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#f57c00">夜勤追加</text>
    <text x="20" y="60" font-family="sans-serif" font-size="15" fill="#555">✓ 軽食・飲み物</text>
    <text x="20" y="85" font-family="sans-serif" font-size="15" fill="#555">✓ 目薬</text>
    <text x="20" y="110" font-family="sans-serif" font-size="15" fill="#555">✓ 歯ブラシセット</text>
  </g>

  <text x="400" y="430" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_nurse_scholarship(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e3f2fd" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1565c0">奨学金活用の3つのポイント</text>
  
  <!-- Point 1 -->
  <rect x="50" y="100" width="220" height="280" rx="10" fill="white" stroke="#42a5f5" stroke-width="2" />
  <circle cx="160" cy="140" r="25" fill="#42a5f5" />
  <text x="160" y="150" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">1</text>
  <text x="160" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">病院奨学金</text>
  <text x="160" y="225" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">卒業後、その病院で</text>
  <text x="160" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">一定期間働けば</text>
  <text x="160" y="275" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">返済免除</text>
  <text x="160" y="310" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#1565c0">月5-10万円</text>
  <text x="160" y="335" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">（3年勤務で免除が多い）</text>

  <!-- Point 2 -->
  <rect x="290" y="100" width="220" height="280" rx="10" fill="white" stroke="#42a5f5" stroke-width="2" />
  <circle cx="400" cy="140" r="25" fill="#42a5f5" />
  <text x="400" y="150" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">2</text>
  <text x="400" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">自治体奨学金</text>
  <text x="400" y="225" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">都道府県・市町村が</text>
  <text x="400" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">看護師確保のため</text>
  <text x="400" y="275" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">支給</text>
  <text x="400" y="310" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#1565c0">月3-5万円</text>
  <text x="400" y="335" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">（地域により異なる）</text>

  <!-- Point 3 -->
  <rect x="530" y="100" width="220" height="280" rx="10" fill="white" stroke="#42a5f5" stroke-width="2" />
  <circle cx="640" cy="140" r="25" fill="#42a5f5" />
  <text x="640" y="150" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">3</text>
  <text x="640" y="190" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1565c0">併用可能</text>
  <text x="640" y="225" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">病院奨学金と</text>
  <text x="640" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">自治体奨学金は</text>
  <text x="640" y="275" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">併用できる場合も</text>
  <text x="640" y="310" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#1565c0">最大月15万円</text>
  <text x="640" y="335" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">（要確認）</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_svg_stress_relationships(unique_path(os.path.join(OUTPUT_DIR, "stress_relationships.svg")))
    create_svg_nurse_route(unique_path(os.path.join(OUTPUT_DIR, "nurse_route.svg")))
    create_svg_essentials_checklist(unique_path(os.path.join(OUTPUT_DIR, "essentials_checklist.svg")))
    create_svg_nurse_scholarship(unique_path(os.path.join(OUTPUT_DIR, "nurse_scholarship.svg")))
