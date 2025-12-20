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
    'teal_accent': '#4FD1C5',
    'text_dark': '#4A5568',
    'text_medium': '#718096',
    'text_light': '#A0AEC0',
}

def create_soft_step_flow(title, subtitle, steps, filename):
    """
    Create a soft-style step flow diagram
    steps: list of dicts with 'number', 'title', 'description', 'detail' (optional)
    """
    svg_content = f'''<svg width="900\" height=\"700\" xmlns=\"http://www.w3.org/2000/svg\">
  <defs>
    <linearGradient id=\"softBg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">
      <stop offset=\"0%\" style=\"stop-color:{COLORS['mint']};stop-opacity:0.2\" />
      <stop offset=\"100%\" style=\"stop-color:{COLORS['lavender']};stop-opacity:0.2\" />
    </linearGradient>
    
    <filter id=\"softShadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">
      <feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"3\"/>
      <feOffset dx=\"0\" dy=\"2\" result=\"offsetblur\"/>
      <feComponentTransfer>
        <feFuncA type=\"linear\" slope=\"0.12\"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in=\"SourceGraphic\"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width=\"100%\" height=\"100%\" fill=\"url(#softBg)\" rx=\"20\"/>
  
  <!-- Title area -->
  <rect x=\"60\" y=\"40\" width=\"780\" height=\"100\" rx=\"18\" fill=\"{COLORS['teal_accent']}\" opacity=\"0.15\" filter=\"url(#softShadow)\"/>
  <text x=\"450\" y=\"80\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"28\" font-weight=\"600\" text-anchor=\"middle\" fill=\"{COLORS['text_dark']}\">{title}</text>
  <text x=\"450\" y=\"115\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"15\" text-anchor=\"middle\" fill=\"{COLORS['text_medium']}\">{subtitle}</text>
'''
    
    start_y = 180
    step_height = 90
    
    for i, step in enumerate(steps):
        y = start_y + i * step_height
        is_last = i == len(steps) - 1
        
        # Determine color based on step index
        colors = [
            ('teal_accent', 'mint'),
            ('pink_accent', 'pink'),
            ('lavender_accent', 'lavender'),
            ('peach_accent', 'peach'),
            ('blue_accent', 'light_blue')
        ]
        accent_color, bg_color = colors[i % len(colors)]
        accent = COLORS[accent_color]
        bg = COLORS[bg_color]
        
        # Step number circle
        svg_content += f'''
  <g transform=\"translate(100, {y})\">
    <circle cx=\"0\" cy=\"30\" r=\"28\" fill=\"{accent}\" opacity=\"0.9\" filter=\"url(#softShadow)\"/>
    <text x=\"0\" y=\"38\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"20\" font-weight=\"700\" text-anchor=\"middle\" fill=\"white\">{step['number']}</text>
  </g>
  
  <!-- Step content card -->
  <rect x=\"160\" y=\"{y}\" width=\"660\" height=\"70\" rx=\"15\" fill=\"white\" filter=\"url(#softShadow)\"/>
  <rect x=\"160\" y=\"{y}\" width=\"8\" height=\"70\" rx=\"4\" fill=\"{accent}\" opacity=\"0.8\"/>
  <text x=\"185\" y=\"{y + 30}\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"17\" font-weight=\"600\" fill=\"{COLORS['text_dark']}\">{step['title']}</text>
  <text x=\"185\" y=\"{y + 52}\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"13\" fill=\"{COLORS['text_medium']}\">{step['description']}</text>
'''
        
        # Arrow to next step (unless last step)
        if not is_last:
            arrow_y = y + 75
            svg_content += f'''
  <path d=\"M 450 {arrow_y} L 450 {arrow_y + 10}\" stroke=\"{COLORS['text_light']}\" stroke-width=\"2\" stroke-dasharray=\"4,4\" opacity=\"0.5\"/>
  <polygon points=\"450,{arrow_y + 15} 445,{arrow_y + 8} 455,{arrow_y + 8}\" fill=\"{COLORS['text_light']}\" opacity=\"0.5\"/>
'''
        
        # Special styling for last step (completion)
        if is_last:
            svg_content += f'''
  <circle cx=\"820\" cy=\"{y + 35}\" r=\"12\" fill=\"{accent}\" opacity=\"0.3\"/>
  <path d=\"M 813 {y + 35} L 817 {y + 40} L 827 {y + 30}\" stroke=\"{accent}\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\"/>
'''
    
    # Footer note
    svg_content += f'''
  <rect x=\"60\" y=\"620\" width=\"780\" height=\"50\" rx=\"12\" fill=\"{COLORS['light_blue']}\" opacity=\"0.3\"/>
  <text x=\"450\" y=\"650\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"{COLORS['text_medium']}\">各ステップを確実に進めることで、スムーズに完了できます</text>
  
  <text x=\"450\" y=\"685\" font-family=\"Hiragino Sans, sans-serif\" font-size=\"12\" text-anchor=\"middle\" fill=\"{COLORS['text_light']}\">© ProReNata</text>
</svg>'''
    
    output_dir = "public/images/chibichara/diagrams"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, filename)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created soft step flow: {output_path}")
    return True

# Example usage
if __name__ == "__main__":
    sample_steps = [
        {
            'number': '1',
            'title': '登録・申し込み',
            'description': 'Webフォームまたは電話で簡単に登録できます'
        },
        {
            'number': '2',
            'title': 'ヒアリング',
            'description': '希望条件や不安なことを丁寧にお聞きします'
        },
        {
            'number': '3',
            'title': '求人紹介',
            'description': 'あなたに合った職場を厳選してご紹介'
        },
        {
            'number': '4',
            'title': '見学・面接',
            'description': '実際の職場を見学し、雰囲気を確認できます'
        },
        {
            'number': '5',
            'title': '入職サポート',
            'description': '初日のサポートから定着まで安心フォロー'
        }
    ]
    
    create_soft_step_flow(
        title="転職の流れ",
        subtitle="登録から入職までをサポートします",
        steps=sample_steps,
        filename="sample_soft_step_flow.svg"
    )
