import os

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
    'text_dark': '#4A5568',
    'text_medium': '#718096',
    'text_light': '#A0AEC0',
}

# Create soft rounded comparisons
def create_soft_comparison(title, subtitle, cards, filename):
    """
    Create a soft-style comparison diagram
    cards: list of dicts with 'title', 'accent', 'features', 'recommendation'
    """
    svg_content = f'''<svg width="1024" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Soft gradient background -->
  <defs>
    <linearGradient id="softBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{COLORS['light_blue']};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:{COLORS['lavender']};stop-opacity:0.3" />
    </linearGradient>
    
    <!-- Soft shadow filter -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="3" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.15"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#softBg)" rx="20"/>
  
  <!-- Title area with gentle gradient -->
  <rect x="40" y="40" width="944" height="120" rx="20" fill="{COLORS['pink']}" opacity="0.7" filter="url(#softShadow)"/>
  <text x="512" y="90" font-family="Hiragino Sans, sans-serif" font-size="32" font-weight="600" text-anchor="middle" fill="{COLORS['text_dark']}">{title}</text>
  <text x="512" y="125" font-family="Hiragino Sans, sans-serif" font-size="16" text-anchor="middle" fill="{COLORS['text_medium']}">{subtitle}</text>
'''
    
    # Calculate card positions
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
  <!-- Card {i+1} -->
  <g transform="translate({x}, {y})">
    <rect x="0" y="0" width="{card_width}" height="330" rx="20" fill="white" filter="url(#softShadow)"/>
    <rect x="0" y="0" width="{card_width}" height="60" rx="20" fill="{accent_color}" opacity="0.7"/>
    <text x="{card_width//2}" y="40" font-family="Hiragino Sans, sans-serif" font-size="20" font-weight="600" text-anchor="middle" fill="white">{card['title']}</text>
    
    <!-- Tag -->
    <rect x="20" y="75" width="auto" height="28" rx="14" fill="{bg_color}"/>
    <text x="30" y="93" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{accent_color}">{card.get('tag', '')}</text>
'''
        
        # Features
        feature_y = 120
        for feature in card.get('features', []):
            svg_content += f'''
    <circle cx="25" cy="{feature_y}" r="4" fill="{accent_color}"/>
    <text x="40" y="{feature_y + 5}" font-family="Hiragino Sans, sans-serif" font-size="14" fill="{COLORS['text_dark']}">{feature}</text>
'''
            feature_y += 30
        
        # Recommendation
        svg_content += f'''
    <rect x="20" y="250" width="{card_width-40}" height="60" rx="10" fill="{bg_color}" opacity="0.5"/>
    <text x="30" y="270" font-family="Hiragino Sans, sans-serif" font-size="12" font-weight="600" fill="{COLORS['text_medium']}">おすすめの方</text>
    <text x="30" y="295" font-family="Hiragino Sans, sans-serif" font-size="13" fill="{COLORS['text_dark']}">{card.get('recommendation', '')}</text>
  </g>
'''
    
    svg_content += f'''
  <!-- Footer -->
  <text x="512" y="575" font-family="Hiragino Sans, sans-serif" font-size="13" text-anchor="middle" fill="{COLORS['text_light']}">© ProReNata</text>
</svg>'''
    
    output_dir = "public/images/chibichara/diagrams"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created soft diagram: {output_path}")
    return True

# Example: Create a sample comparison
if __name__ == "__main__":
    sample_cards = [
        {
            'title': 'サービスA',
            'tag': '全国対応',
            'bg': 'pink',
            'accent': 'pink_accent',
            'features': ['24時間対応', 'LINEで相談OK', '実績豊富'],
            'recommendation': '初めての方におすすめ'
        },
        {
            'title': 'サービスB',
            'tag': 'スピード重視',
            'bg': 'lavender',
            'accent': 'lavender_accent',
            'features': ['即日対応可能', '手続き簡単', '費用明確'],
            'recommendation': 'すぐに対応したい方'
        },
        {
            'title': 'サービスC',
            'tag': '安心サポート',
            'bg': 'mint',
            'accent': 'mint_accent',
            'features': ['丁寧なヒアリング', 'アフターケア充実', '返金保証あり'],
            'recommendation': 'じっくり相談したい方'
        }
    ]
    
    create_soft_comparison(
        title="サービス比較",
        subtitle="自分に合ったサービスを選びましょう",
        cards=sample_cards,
        filename="sample_soft_comparison.svg"
    )
