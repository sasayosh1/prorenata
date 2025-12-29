import os
from utils.antigravity_paths import inbox_dir, unique_path

# Soft pastel color palette
COLORS = {
    'pink': '#FFE5EC',
    'lavender': '#E8DEF8',
    'mint': '#D4F1F4',
    'peach': '#FFE8D6',
    'light_blue': '#E3F2FD',
    'pink_accent': '#FFB3C6',
    'lavender_accent': '#C9A9E9',
    'mint_accent': '#90E0EF',
    'peach_accent': '#FFCBA4',
    'blue_accent': '#90CAF9',
    'teal_accent': '#4FD1C5',
    'text_dark': '#4A5568',
    'text_medium': '#718096',
    'text_light': '#A0AEC0',
}

def create_soft_comparison(title, subtitle, cards, filename):
    """Create a soft-style comparison diagram"""
    svg_content = f'''<svg width="1024" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{COLORS['light_blue']};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:{COLORS['lavender']};stop-opacity:0.3" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="3" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.15"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#softBg)" rx="20"/>
  <rect x="40" y="40" width="944" height="120" rx="20" fill="{COLORS['pink']}" opacity="0.7" filter="url(#softShadow)"/>
  <text x="512" y="90" font-family="Hiragino Sans, sans-serif" font-size="32" font-weight="600" text-anchor="middle" fill="{COLORS['text_dark']}">{title}</text>
  <text x="512" y="125" font-family="Hiragino Sans, sans-serif" font-size="16" text-anchor="middle" fill="{COLORS['text_medium']}">{subtitle}</text>
'''
    
    card_width = 280
    card_spacing = 40
    total_width = len(cards) * card_width + (len(cards) - 1) * card_spacing
    start_x = (1024 - total_width) // 2
    
    for i, card in enumerate(cards):
        x = start_x + i * (card_width + card_spacing)
        y = 200
        bg_color = COLORS.get(card.get('bg', 'pink'), COLORS['pink'])
        accent_color = COLORS.get(card.get('accent', 'pink_accent'), COLORS['pink_accent'])
        
        svg_content += f'''
  <g transform="translate({x}, {y})">
    <rect x="0" y="0" width="{card_width}" height="330" rx="20" fill="white" filter="url(#softShadow)"/>
    <rect x="0" y="0" width="{card_width}" height="60" rx="20" fill="{accent_color}" opacity="0.7"/>
    <text x="{card_width//2}" y="40" font-family="Hiragino Sans, sans-serif" font-size="20" font-weight="600" text-anchor="middle" fill="white">{card['title']}</text>
    <rect x="20" y="75" width="auto" height="28" rx="14" fill="{bg_color}"/>
    <text x="30" y="93" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{accent_color}">{card.get('tag', '')}</text>
'''
        feature_y = 120
        for feature in card.get('features', []):
            svg_content += f'''    <circle cx="25" cy="{feature_y}" r="4" fill="{accent_color}"/>
    <text x="40" y="{feature_y + 5}" font-family="Hiragino Sans, sans-serif" font-size="14" fill="{COLORS['text_dark']}">{feature}</text>
'''
            feature_y += 30
        
        svg_content += f'''    <rect x="20" y="250" width="{card_width-40}" height="60" rx="10" fill="{bg_color}" opacity="0.5"/>
    <text x="30" y="270" font-family="Hiragino Sans, sans-serif" font-size="12" font-weight="600" fill="{COLORS['text_medium']}">こんな人におすすめ</text>
    <text x="30" y="295" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{COLORS['text_dark']}">{card.get('recommendation', '')}</text>
  </g>
'''
    
    svg_content += f'''  <text x="512" y="575" font-family="Hiragino Sans, sans-serif" font-size="13" text-anchor="middle" fill="{COLORS['text_light']}">© ProReNata</text>
</svg>'''
    
    output_dir = inbox_dir("prorenata", "diagrams")
    output_path = unique_path(os.path.join(output_dir, filename))
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created: {output_path}")
    return True

def create_soft_step_flow(title, subtitle, steps, filename):
    """Create a soft-style step flow diagram"""
    svg_content = f'''<svg width="900" height="700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{COLORS['mint']};stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:{COLORS['lavender']};stop-opacity:0.2" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.12"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#softBg)" rx="20"/>
  <rect x="60" y="40" width="780" height="100" rx="18" fill="{COLORS['teal_accent']}" opacity="0.15" filter="url(#softShadow)"/>
  <text x="450" y="80" font-family="Hiragino Sans, sans-serif" font-size="28" font-weight="600" text-anchor="middle" fill="{COLORS['text_dark']}">{title}</text>
  <text x="450" y="115" font-family="Hiragino Sans, sans-serif" font-size="15" text-anchor="middle" fill="{COLORS['text_medium']}">{subtitle}</text>
'''
    
    start_y = 180
    step_height = 90
    colors = [('teal_accent', 'mint'), ('pink_accent', 'pink'), ('lavender_accent', 'lavender'), ('peach_accent', 'peach'), ('blue_accent', 'light_blue')]
    
    for i, step in enumerate(steps):
        y = start_y + i * step_height
        is_last = i == len(steps) - 1
        accent_color, bg_color = colors[i % len(colors)]
        accent = COLORS[accent_color]
        
        svg_content += f'''  <g transform="translate(100, {y})">
    <circle cx="0" cy="30" r="28" fill="{accent}" opacity="0.9" filter="url(#softShadow)"/>
    <text x="0" y="38" font-family="Hiragino Sans, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="white">{step['number']}</text>
  </g>
  <rect x="160" y="{y}" width="660" height="70" rx="15" fill="white" filter="url(#softShadow)"/>
  <rect x="160" y="{y}" width="8" height="70" rx="4" fill="{accent}" opacity="0.8"/>
  <text x="185" y="{y + 30}" font-family="Hiragino Sans, sans-serif" font-size="17" font-weight="600" fill="{COLORS['text_dark']}">{step['title']}</text>
  <text x="185" y="{y + 52}" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{COLORS['text_medium']}">{step['description']}</text>
'''
        if not is_last:
            arrow_y = y + 75
            svg_content += f'''  <path d="M 450 {arrow_y} L 450 {arrow_y + 10}" stroke="{COLORS['text_light']}" stroke-width="2" stroke-dasharray="4,4" opacity="0.5"/>
  <polygon points="450,{arrow_y + 15} 445,{arrow_y + 8} 455,{arrow_y + 8}" fill="{COLORS['text_light']}" opacity="0.5"/>
'''
        else:
            svg_content += f'''  <circle cx="820" cy="{y + 35}" r="12" fill="{accent}" opacity="0.3"/>
  <path d="M 813 {y + 35} L 817 {y + 40} L 827 {y + 30}" stroke="{accent}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
'''
    
    svg_content += f'''  <rect x="60" y="620" width="780" height="50" rx="12" fill="{COLORS['light_blue']}" opacity="0.3"/>
  <text x="450" y="650" font-family="Hiragino Sans, sans-serif" font-size="13" text-anchor="middle" fill="{COLORS['text_medium']}">ポイントを押さえて、確実にステップアップ</text>
  <text x="450" y="685" font-family="Hiragino Sans, sans-serif" font-size="12" text-anchor="middle" fill="{COLORS['text_light']}">© ProReNata</text>
</svg>'''
    
    output_dir = inbox_dir("prorenata", "diagrams")
    output_path = unique_path(os.path.join(output_dir, filename))
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created: {output_path}")
    return True

# Batch 2: Next 5 priority articles
print("Generating diagrams for Batch 2 (next 5 priority articles)...\n")

# 1. ICU Emergency Duties - Step flow
create_soft_step_flow(
    title="ICU・救急での看護助手業務",
    subtitle="緊張感のある現場で求められる動き",
    steps=[
        {'number': '1', 'title': '環境整備と物品管理', 'description': '常に清潔を保ち、必要物品を補充'},
        {'number': '2', 'title': '患者搬送のサポート', 'description': '検査や処置への移動を安全に介助'},
        {'number': '3', 'title': '看護師の補助業務', 'description': 'バイタル測定、記録入力のサポート'},
        {'number': '4', 'title': '家族対応のサポート', 'description': '面会案内、待合室の環境整備'},
        {'number': '5', 'title': '緊急時の連携', 'description': 'スタッフ間の連絡調整、物品準備'}
    ],
    filename="nursing-assistant-icu-duties.svg"
)

# 2. Suitable Person Characteristics - Comparison
create_soft_comparison(
    title="看護助手に向いている人の特徴",
    subtitle="あなたはどのタイプ？",
    cards=[
        {'title': 'サポート型', 'tag': '協調性重視', 'bg': 'mint', 'accent': 'mint_accent',
         'features': ['チームワークが得意', '細やかな気配りができる', '人の役に立ちたい'],
         'recommendation': '誰かを支えることが好きな方'},
        {'title': '学習型', 'tag': '成長志向', 'bg': 'lavender', 'accent': 'lavender_accent',
         'features': ['医療に興味がある', '新しいことを学びたい', '資格取得を目指す'],
         'recommendation': 'キャリアアップしたい方'},
        {'title': '安定型', 'tag': 'ワークライフ', 'bg': 'peach', 'accent': 'peach_accent',
         'features': ['規則正しい生活', 'プライベート重視', '長く続けたい'],
         'recommendation': '安定した働き方を求める方'}
    ],
    filename="nursing-assistant-suitable-types.svg"
)

# 3. Vital Signs Support - Step flow
create_soft_step_flow(
    title="バイタルサイン測定のサポート",
    subtitle="正確な測定をアシストする流れ",
    steps=[
        {'number': '1', 'title': '準備', 'description': '測定機器の確認、患者への声かけ'},
        {'number': '2', 'title': '体温測定', 'description': '体温計の準備、測定部位の確認'},
        {'number': '3', 'title': '血圧測定', 'description': '血圧計のセット、患者の姿勢確認'},
        {'number': '4', 'title': '脈拍・呼吸', 'description': '測定のサポート、患者の安楽確保'},
        {'number': '5', 'title': '記録・報告', 'description': 'データ入力、看護師への報告'}
    ],
    filename="nursing-assistant-vital-signs.svg"
)

# 4. EMR System Changes - Comparison
create_soft_comparison(
    title="電子カルテ導入前後の変化",
    subtitle="業務効率はどう変わった？",
    cards=[
        {'title': '導入前', 'tag': '紙カルテ', 'bg': 'light_blue', 'accent': 'blue_accent',
         'features': ['手書き記録', 'カルテ運搬が必要', '情報共有に時間'],
         'recommendation': 'アナログ作業に慣れた環境'},
        {'title': '導入直後', 'tag': '移行期', 'bg': 'peach', 'accent': 'peach_accent',
         'features': ['操作に慣れが必要', '二重記録の期間', '研修が増える'],
         'recommendation': '学習期間として割り切る'},
        {'title': '定着後', 'tag': 'デジタル化', 'bg':'mint', 'accent': 'mint_accent',
         'features': ['業務効率アップ', '情報共有が迅速', 'ペーパーレス'],
         'recommendation': '慣れれば快適な環境'}
    ],
    filename="nursing-assistant-emr-changes.svg"
)

# 5. Uniform Selection - Comparison  
create_soft_comparison(
    title="看護助手のユニフォーム選び",
    subtitle="快適に働くための選択ポイント",
    cards=[
        {'title': '機能性重視', 'tag': '動きやすさ', 'bg': 'mint', 'accent': 'mint_accent',
         'features': ['ストレッチ素材', 'ポケット充実', '速乾性'],
         'recommendation': '体を動かす業務が多い方'},
        {'title': 'デザイン重視', 'tag': '見た目', 'bg': 'pink', 'accent': 'pink_accent',
         'features': ['スタイリッシュ', '豊富なカラー', 'スリムシルエット'],
         'recommendation': 'おしゃれも楽しみたい方'},
        {'title': 'コスパ重視', 'tag': '経済的', 'bg': 'peach', 'accent': 'peach_accent',
         'features': ['手頃な価格', '耐久性が高い', '洗濯しやすい'],
         'recommendation': '複数枚揃えたい方'}
    ],
    filename="nursing-assistant-uniform-selection.svg"
)

print("\n✓ Successfully generated 5 diagrams for Batch 2!")
print("\nGenerated files:")
print("  - nursing-assistant-icu-duties.svg")
print("  - nursing-assistant-suitable-types.svg")
print("  - nursing-assistant-vital-signs.svg")
print("  - nursing-assistant-emr-changes.svg")
print("  - nursing-assistant-uniform-selection.svg")
