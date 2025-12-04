import os

def create_svg_resume_checklist(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
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

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_interview_flow(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fffaf0" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">面接当日の流れとポイント</text>
  
  <!-- Step 1 -->
  <rect x="50" y="150" width="200" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
  <text x="150" y="180" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#ff9800">到着・受付</text>
  <text x="150" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">10分前到着</text>
  <text x="150" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">コートは脱ぐ</text>
  <text x="150" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">スマホはオフ</text>

  <!-- Arrow 1 -->
  <polygon points="260,225 290,225 290,215 310,235 290,255 290,245 260,245" fill="#ffcc80" />

  <!-- Step 2 -->
  <rect x="320" y="150" width="200" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
  <text x="420" y="180" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#ff9800">入室・面接</text>
  <text x="420" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">ノックは3回</text>
  <text x="420" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">「失礼します」</text>
  <text x="420" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">笑顔でハキハキ</text>

  <!-- Arrow 2 -->
  <polygon points="530,225 560,225 560,215 580,235 560,255 560,245 530,245" fill="#ffcc80" />

  <!-- Step 3 -->
  <rect x="590" y="150" width="160" height="150" rx="10" fill="white" stroke="#ff9800" stroke-width="2" />
  <text x="670" y="180" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#ff9800">退室</text>
  <text x="670" y="210" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">お礼を言う</text>
  <text x="670" y="230" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">ドア前で一礼</text>
  <text x="670" y="250" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">静かに閉める</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

def create_svg_transfer_safety(filename):
    svg_content = """<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f2f1" />
  <text x="400" y="50" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#00695c">ストレッチャー移送の安全3原則</text>
  
  <g transform="translate(50, 100)">
    <circle cx="100" cy="100" r="80" fill="white" stroke="#009688" stroke-width="3" />
    <text x="100" y="80" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#00695c">足側から進む</text>
    <text x="100" y="110" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">患者さんの</text>
    <text x="100" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">恐怖心を軽減</text>
  </g>

  <g transform="translate(280, 100)">
    <circle cx="100" cy="100" r="80" fill="white" stroke="#009688" stroke-width="3" />
    <text x="100" y="80" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#00695c">声かけ確認</text>
    <text x="100" y="110" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">「動きますね」</text>
    <text x="100" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">「曲がります」</text>
  </g>

  <g transform="translate(510, 100)">
    <circle cx="100" cy="100" r="80" fill="white" stroke="#009688" stroke-width="3" />
    <text x="100" y="80" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#00695c">スピード注意</text>
    <text x="100" y="110" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">歩く速度より</text>
    <text x="100" y="130" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">少しゆっくり</text>
  </g>
  
  <rect x="100" y="320" width="600" height="60" rx="5" fill="#b2dfdb" />
  <text x="400" y="355" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#004d40">安全第一！無理せず2人で対応しましょう</text>

  <text x="400" y="420" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">© ProReNata</text>
</svg>"""
    with open(filename, "w") as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    os.makedirs("generated_diagrams", exist_ok=True)
    create_svg_resume_checklist("generated_diagrams/resume_checklist.svg")
    create_svg_interview_flow("generated_diagrams/interview_flow.svg")
    create_svg_transfer_safety("generated_diagrams/transfer_safety.svg")
