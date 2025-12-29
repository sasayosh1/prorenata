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
  <rect x="40" y="40" width="944" height="120" rx="20" fill="{COLORS['pink']}" opacity="0.7" filter="url(#soft Shadow)"/>
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
    <text x="30" y="270" font-family="Hiragino Sans, sans-serif" font-size="12" font-weight="600" fill="{COLORS['text_medium']}">おすすめの方</text>
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
  <text x="450" y="650" font-family="Hiragino Sans, sans-serif" font-size="13" text-anchor="middle" fill="{COLORS['text_medium']}">各ステップを確実に進めることで、スムーズに完了できます</text>
  <text x="450" y="685" font-family="Hiragino Sans, sans-serif" font-size="12" text-anchor="middle" fill="{COLORS['text_light']}">© ProReNata</text>
</svg>'''
    
    output_dir = inbox_dir("prorenata", "diagrams")
    output_path = unique_path(os.path.join(output_dir, filename))
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created: {output_path}")
    return True

# Generate 5 diagrams
print("Generating diagrams for top 5 priority articles...")

# 1. Salary comparison
create_soft_comparison(
    title="看護助手の職場別給与比較",
    subtitle="自分に合った働き方を見つけましょう",
    cards=[
        {'title': '病院', 'tag': '安定重視', 'bg': 'light_blue', 'accent': 'blue_accent',
         'features': ['月給 18-22万円', '夜勤手当あり', '福利厚生が充実'],
         'recommendation': '安定した環境で働きたい方'},
        {'title': '介護施設', 'tag': 'ワークバランス', 'bg': 'mint', 'accent': 'mint_accent',
         'features': ['月給 17-20万円', '日勤中心', '比較的ゆったり'],
         'recommendation': 'プライベート重視の方'},
        {'title': 'クリニック', 'tag': '働きやすさ', 'bg': 'peach', 'accent': 'peach_accent',
         'features': ['時給 1,100-1,400円', '日曜休み', '予定が立てやすい'],
         'recommendation': '規則正しく働きたい方'}
    ],
    filename="nursing-assistant-salary-comparison.svg"
)

# 2. Daily schedule
create_soft_step_flow(
    title="看護助手の1日の流れ",
    subtitle="日勤の基本的なスケジュール",
    steps=[
        {'number': '1', 'title': '朝の準備（8:00-8:30）', 'description': '申し送り、ベッドメイキング、環境整備'},
        {'number': '2', 'title': '午前の業務（8:30-12:00）', 'description': '食事介助、入浴介助、移動のサポート'},
        {'number': '3', 'title': '昼休憩（12:00-13:00）', 'description': '休憩時間で体を休めましょう'},
        {'number': '4', 'title': '午後の業務（13:00-16:30）', 'description': 'リハビリ補助、記録業務、検査介助'},
        {'number': '5', 'title': '終業準備（16:30-17:00）', 'description': '申し送り、片付け、翌日の準備'}
    ],
    filename="nursing-assistant-daily-schedule.svg"
)

# 3. Resignation steps
create_soft_step_flow(
    title="看護助手の円満退職の流れ",
    subtitle="スムーズに次のステップへ進むために",
    steps=[
        {'number': '1', 'title': '退職の意思決定', 'description': '自分の気持ちを整理し、理由を明確にする'},
        {'number': '2', 'title': '上司への相談（1-2ヶ月前）', 'description': '直属の上司に直接話し、退職の意思を伝える'},
        {'number': '3', 'title': '退職届の提出', 'description': '正式な書類を作成し、人事部門へ提出'},
        {'number': '4', 'title': '引き継ぎ業務', 'description': '後任者への丁寧な引き継ぎを行う'},
        {'number': '5', 'title': '退職手続き完了', 'description': '保険証返却、離職票受領、最終日の挨拶'}
    ],
    filename="nursing-assistant-resignation-steps.svg"
)

# 4. Career path to nurse
create_soft_step_flow(
    title="看護助手から看護師へのルート",
    subtitle="働きながらステップアップを目指す",
    steps=[
        {'number': '1', 'title': '看護助手として経験を積む', 'description': '医療現場の基礎知識と実務経験を身につける'},
        {'number': '2', 'title': '准看護学校に入学', 'description': '働きながら2年間学べる学校を選ぶ'},
        {'number': '3', 'title': '准看護師資格を取得', 'description': '都道府県知事試験に合格する'},
        {'number': '4', 'title': '看護師養成所で学ぶ（任意）', 'description': '正看護師を目指す場合は2-3年学習'},
        {'number': '5', 'title': '正看護師資格を取得', 'description': '国家試験に合格し、キャリアアップ'}
    ],
    filename="nursing-assistant-to-nurse-path.svg"
)

# 5. Career options
create_soft_comparison(
    title="看護助手のキャリアビジョン",
    subtitle="経験を活かした次のステップを考えましょう",
    cards=[
        {'title': 'スキルアップ', 'tag': '現在の職場', 'bg': 'lavender', 'accent': 'lavender_accent',
         'features': ['リーダー的役割', '専門性を深める', '後輩の指導'],
         'recommendation': '今の環境で成長したい方'},
        {'title': '転職', 'tag': '環境を変える', 'bg': 'pink', 'accent': 'pink_accent',
         'features': ['給与アップ', '新しい分野へ', 'ワークバランス改善'],
         'recommendation': '新しい環境で働きたい方'},
        {'title': '資格取得', 'tag': 'キャリアチェンジ', 'bg': 'mint', 'accent': 'mint_accent',
         'features': ['介護福祉士', '准看護師', '正看護師'],
         'recommendation': '長期的なキャリアアップ希望の方'}
    ],
    filename="nursing-assistant-career-options.svg"
)

print("\n✓ Successfully generated 5 diagrams for priority articles!")
print("\nGenerated files:")
print("  - nursing-assistant-salary-comparison.svg")
print("  - nursing-assistant-daily-schedule.svg")
print("  - nursing-assistant-resignation-steps.svg")
print("  - nursing-assistant-to-nurse-path.svg")
print("  - nursing-assistant-career-options.svg")
