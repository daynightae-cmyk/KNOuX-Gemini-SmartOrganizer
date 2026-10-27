from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

repo = Path(__file__).resolve().parents[3]
out = repo / 'docs/evidence/visual-checkpoint-20261027'
refs = repo / 'missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references'
old = repo / 'docs/evidence/canvas-rollout'
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
names = {'home':'00_home-command-center', 'studio':'01_organization-studio', 'files':'02_files-instant-search', 'smart_scan':'03_smart-scan', 'applications':'04_applications', 'storage':'05_storage', 'cleanup':'06_cleanup', 'startup':'07_startup', 'system':'08_system', 'repair':'09_repair', 'services':'10_services'}

def board(filename, rows):
    img = Image.new('RGB', (2400, len(rows)*378), '#10172b')
    draw = ImageDraw.Draw(img)
    for row, cells in enumerate(rows):
        for col, (label, source) in enumerate(cells):
            draw.text((col*600+10, row*378+8), label, font=font, fill='white')
            if source.exists():
                with Image.open(source) as frame:
                    img.paste(frame.convert('RGB').resize((600,338)), (col*600,row*378+40))
            else:
                draw.text((col*600+10,row*378+120),'REFERENCE NOT SUPPLIED',font=font,fill='#d8c4ff')
    img.save(out / filename)

for group in [['home','repair','smart_scan'], ['applications','system','services'], ['storage','cleanup','startup'], ['automation','studio','files']]:
    rows = []
    for section in group:
        rows.append([(f'{section} / {theme} / {kind}', refs / ('day' if theme=='light' else 'night') / (names.get(section,'missing')+'.png') if kind=='reference' else out/f'{section}-{theme}-1672.png') for theme,kind in [('light','reference'),('light','actual'),('dark','reference'),('dark','actual')]])
    board('reference-'+'-'.join(group)+'.png', rows)

board('final-polish-before-after.png', [[(f'{section} / {theme} / {phase}', old/f'{section}-{theme}.png' if phase=='before' else out/f'{section}-{theme}-1672.png') for theme,phase in [('light','before'),('light','after'),('dark','before'),('dark','after')]] for section in ['home','repair','system','services']])
board('intro-day-night-sizes.png', [[(f'Intro / {theme} / {size}',out/f'intro-{theme}-{size}.png') for theme,size in [('light',1366),('light',1672),('dark',1366),('dark',1672)]]])
print('Created checkpoint boards without modifying previous evidence.')
