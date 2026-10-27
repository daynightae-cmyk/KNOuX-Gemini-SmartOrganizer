from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import shutil
repo=Path(__file__).resolve().parents[3]
folder=repo/'docs/evidence/canvas-rollout'
refs=repo/'missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references'
before=folder/'fidelity-before'; before.mkdir(exist_ok=True)
names={'home':'00_home-command-center','smart_scan':'03_smart-scan','applications':'04_applications','storage':'05_storage','cleanup':'06_cleanup','startup':'07_startup','system':'08_system','repair':'09_repair','services':'10_services','studio':'01_organization-studio','files':'02_files-instant-search'}
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
groups=[['applications','system','services'],['storage','cleanup','startup'],['home','repair','smart_scan'],['automation','studio','files']]
for group in groups:
    board=Image.new('RGB',(2400,3*378),'#10172b');draw=ImageDraw.Draw(board)
    for row,route in enumerate(group):
        for col,(theme,kind) in enumerate([('light','reference'),('light','actual'),('dark','reference'),('dark','actual')]):
            if kind=='reference':
                f=refs/('day' if theme=='light' else 'night')/(names.get(route,'missing')+'.png')
            else:
                f=folder/f'{route}-{theme}.png'
                if f.exists() and not (before/f.name).exists(): shutil.copy2(f,before/f.name)
            draw.text((col*600+10,row*378+8),f'{route} / {theme} / {kind}',font=font,fill='white')
            if f.exists(): board.paste(Image.open(f).convert('RGB').resize((600,338)),(col*600,row*378+40))
            else: draw.text((col*600+10,row*378+120),'NO INSTALLED REFERENCE',font=font,fill='#d8c4ff')
    board.save(folder/('reference-review-'+'-'.join(group)+'.png'))
    changes=Image.new('RGB',(2400,3*378),'#10172b');labels=ImageDraw.Draw(changes)
    for row,route in enumerate(group):
        for col,(theme,phase) in enumerate([('light','before'),('light','after'),('dark','before'),('dark','after')]):
            f=(before if phase=='before' else folder)/f'{route}-{theme}.png'
            labels.text((col*600+10,row*378+8),f'{route} / {theme} / {phase}',font=font,fill='white')
            if f.exists():changes.paste(Image.open(f).convert('RGB').resize((600,338)),(col*600,row*378+40))
    changes.save(folder/('fidelity-'+'-'.join(group)+'.png'))
print('Preserved current screenshots and created reference review boards.')
