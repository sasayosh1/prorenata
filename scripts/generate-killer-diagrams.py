import os
import sys

# Soft pastel color palette (Re-defining here as we are in a new script execution context if needed, 
# but usually we import. For simplicity in a single file runner, I'll include the function logic or import)

# To ensure consistency, I will use the same creating functions. 
# Assuming generate_soft_diagrams.py exists and functions are reusable or I'll redefine them lightly.

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
    <text x="30" y="270" font-family="Hiragino Sans, sans-serif" font-size="12" font-weight="600" fill="{COLORS['text_medium']}">おすすめポイント</text>
    <text x="30" y="295" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{COLORS['text_dark']}">{card.get('recommendation', '')}</text>
  </g>
'''
    
    svg_content += f'''  <text x="512" y="575" font-family="Hiragino Sans, sans-serif" font-size="13" text-anchor="middle" fill="{COLORS['text_light']}">© ProReNata</text>
</svg>'''
    
    output_dir = "public/images/chibichara/diagrams"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created: {output_path}")
    return True


print("Generating service comparison diagrams for Killer Pages 2026...\n")

# 1. Retirement Agencies Comparison (Killer Page 1)
# Data based on general market knowledge for these services + typical strengths
create_soft_comparison(
    title="退職代行3社 徹底比較",
    subtitle="あなたの状況に合ったサービスは？",
    cards=[
        {'title': '弁護士法人みやび', 'tag': '弁護士対応', 'bg': 'lavender', 'accent': 'lavender_accent',
         'features': ['金銭請求・交渉が可能', '有給消化の交渉も確実', 'トラブル対応に強い'],
         'recommendation': '会社と揉める可能性がある方'},
        {'title': '退職代行 即ヤメ', 'tag': 'コスパ・スピード', 'bg': 'mint', 'accent': 'mint_accent',
         'features': ['24,000円〜の低価格', '後払いOKで安心', 'LINEで即日対応'],
         'recommendation': '費用を抑えてすぐ辞めたい方'},
        {'title': 'ガイア法律事務所', 'tag': '弁護士対応', 'bg': 'peach', 'accent': 'peach_accent',
         'features': ['弁護士による直接交渉', '損害賠償請求も対応', '絶対的な安心感'],
         'recommendation': '確実性を最優先したい方'}
    ],
    filename="resignation-agency-comparison-2026.svg"
)

# 2. Job Change Services Comparison (Killer Page 2)
# Data based on user sheet and typical service strengths
create_soft_comparison(
    title="看護助手 転職サービス比較",
    subtitle="働き方や目的に合わせて選ぼう",
    cards=[
        {'title': 'ヒューマンライフケア', 'tag': '大手グループ', 'bg': 'light_blue', 'accent': 'blue_accent',
         'features': ['全国の求人に強い', '資格取得支援制度あり', '教育体制が充実'],
         'recommendation': '安定した大手で働きたい方'},
        {'title': 'リニューケア', 'tag': '関西・都市部特化', 'bg': 'pink', 'accent': 'pink_accent',
         'features': ['地域密着の濃い情報', '好条件・高給与求人', '手厚いサポート'],
         'recommendation': '関西圏で給与UPしたい方'},
        {'title': 'かいご畑', 'tag': '無資格・未経験', 'bg': 'mint', 'accent': 'teal_accent',
         'features': ['0円で資格が取れる', '未経験OK求人多数', '働きながらステップUP'],
         'recommendation': 'これから資格を取りたい方'}
    ],
    filename="job-service-comparison-2026.svg"
)

print("\n✓ Successfully generated 2 comparison diagrams for 2026 Killer Pages!")
