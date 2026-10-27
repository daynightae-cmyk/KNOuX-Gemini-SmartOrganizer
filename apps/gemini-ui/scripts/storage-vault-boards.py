from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
repo=Path(__file__).resolve().parents[3]
out=repo/'docs/evidence/storage-cleanup-wave2';source=out/'packaged'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
rows=[[(f'Packaged native / {theme} / {size}',f'treemap-{theme}-{size}.png') for theme,size in [('light',1366),('light',1672),('dark',1366),('dark',1672)]],[(label,file) for label,file in [('Exact plan / DAY','plan-light.png'),('Exact plan / NIGHT','plan-dark.png'),('Verified quarantine','quarantine-receipt.png'),('Verified restore & report','restored-report.png')]]]
board=Image.new('RGB',(2400,756),'#10172b');draw=ImageDraw.Draw(board)
for row,cells in enumerate(rows):
    for col,(label,file) in enumerate(cells):
        draw.text((600*col+10,378*row+8),label,font=font,fill='white')
        with Image.open(source/file) as frame:board.paste(frame.convert('RGB').resize((600,338)),(600*col,378*row+40))
board.save(out/'packaged-wave2-day-night.png')
board=Image.new('RGB',(2400,378),'#10172b');draw=ImageDraw.Draw(board)
for col,(section,theme) in enumerate([('storage','light'),('storage','dark'),('cleanup','light'),('cleanup','dark')]):
    draw.text((600*col+10,8),f'Preserved / {section} / {theme}',font=font,fill='white')
    with Image.open(source/f'preserved-{section}-{theme}.png') as frame:board.paste(frame.convert('RGB').resize((600,338)),(600*col,40))
board.save(out/'preserved-storage-cleanup.png')
print('Created boards from actual packaged Electron captures.')
