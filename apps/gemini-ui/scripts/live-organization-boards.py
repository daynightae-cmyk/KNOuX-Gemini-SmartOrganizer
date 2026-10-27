from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
repo=Path(__file__).resolve().parents[3]
out=repo/'docs/evidence/live-organization'
source=out/'electron'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
def board(name,rows):
    image=Image.new('RGB',(2400,len(rows)*378),'#10172b'); draw=ImageDraw.Draw(image)
    for y,row in enumerate(rows):
        for x,(label,file) in enumerate(row):
            draw.text((600*x+10,378*y+8),label,font=font,fill='white')
            with Image.open(source/file) as frame: image.paste(frame.convert('RGB').resize((600,338)),(600*x,378*y+40))
    image.save(out/name)
board('live-preview-day-night.png',[[(f'Native fixture / {theme} / {size}',f'preview-{theme}-{size}.png') for theme,size in [('light',1366),('light',1672),('dark',1366),('dark',1672)]]])
board('preserved-files-studio.png',[[(f'{section} / {theme} / {size}',f'preserved-{section}-{theme}-{size}.png') for theme,size in [('light',1366),('light',1672),('dark',1366),('dark',1672)]] for section in ['files','studio']])
print('Created DAY/NIGHT native fixture evidence boards.')
