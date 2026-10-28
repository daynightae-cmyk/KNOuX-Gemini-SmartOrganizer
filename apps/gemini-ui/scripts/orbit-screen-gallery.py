"""Contact sheets and a linked gallery made only from real Electron captures."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, html

base=Path(__file__).resolve().parents[3]/'docs/evidence/shared-orbit'
out=base/'owner-gallery'
out.mkdir(exist_ok=True)
sections=[('home','Home'),('intro','Cinematic Intro'),('smart_scan','Smart Scan'),('studio','Organization Studio'),('workspace','Google Workspace'),('applications','Applications'),('files','Files'),('storage','Storage'),('cleanup','Cleanup'),('startup','Startup'),('system','System'),('repair','Repair'),('services','Services'),('automation','Automation'),('settings','Settings')]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
manifest=[]
def source(key,theme):
    return (out if key in ('home','intro') else base/'packaged-domains')/f'{key}-{theme}.png'
for theme in ('light','dark'):
    board=Image.new('RGB',(1200,8*374+60),'#eff2fb' if theme=='light' else '#071021')
    draw=ImageDraw.Draw(board); ink='#121c42' if theme=='light' else '#e9edff'
    draw.text((18,15),f'KNOuX | {"DAY" if theme=="light" else "NIGHT"} | Packaged Electron | 1672 x 941',font=font,fill=ink)
    for i,(key,title) in enumerate(sections):
        p=source(key,theme)
        with Image.open(p) as img:
            assert img.size==(1672,941),(p,img.size)
            thumb=img.convert('RGB');thumb.thumbnail((580,327))
            x=10+(i%2)*600;y=60+(i//2)*374
            draw.text((x,y),f'{i+1:02d}  {title}',font=font,fill=ink);board.paste(thumb,(x,y+30))
        manifest.append({'section':key,'theme':theme,'path':p.relative_to(base).as_posix(),'width':1672,'height':941,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    board.save(out/f'all-screens-{theme}.jpg',quality=91)
cards=[]
for key,title in sections:
    views=[]
    for theme in ('light','dark'):
        p=source(key,theme);relative=('../'+p.relative_to(base).as_posix()) if p.parent!=out else p.name
        views.append(f'<a href="{relative}"><b>{"DAY" if theme=="light" else "NIGHT"}</b><img loading="lazy" src="{relative}" alt="{html.escape(title)} {theme}" width="1672" height="941"></a>')
    cards.append(f'<section id="{key}"><h2>{html.escape(title)}</h2><div class="pair">'+''.join(views)+'</div></section>')
nav=' '.join(f'<a href="#{key}">{html.escape(title)}</a>' for key,title in sections)
document='''<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>KNOuX — actual DAY / NIGHT captures</title><style>body{margin:24px;background:#091124;color:#ecf0ff;font:16px system-ui}header,section{max-width:1800px;margin:0 auto 36px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#bac9ff}h2{border-bottom:1px solid #465075;padding-bottom:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;direction:ltr}.pair a{background:#18213c;padding:8px;border-radius:12px;text-decoration:none}.pair b{display:block;margin:4px}img{width:100%;height:auto;display:block}p{line-height:1.8}@media(max-width:900px){.pair{grid-template-columns:1fr}}</style><header><h1>KNOuX — جميع الشاشات الحالية DAY / NIGHT</h1><p>لقطات فعلية من Packaged Electron بحجم 1672×941. اضغط الصورة لفتح الأصل. هذا توثيق للحالة الحالية؛ القبول البصري النهائي معلق حتى مراجعة المالك. بيانات Organization في Home من عملية نقل واستعادة حقيقية على ملفات مؤقتة، وقياسات الجهاز من Native providers. حالات عدم توفر البيانات لم تُستبدل بأرقام تجريبية.</p><nav>'''+nav+'</nav></header>'+''.join(cards)+'</html>'
(out/'index.html').write_text(document,encoding='utf-8')
(out/'screenshots-manifest.json').write_text(json.dumps({'sourceCommit':json.loads((out/'capture-proof.json').read_text())['sourceCommit'],'visualAcceptance':'BLOCKED_OWNER_SIGNOFF','screens':15,'captures':manifest},indent=2),encoding='utf-8')
print('Created 15 DAY/NIGHT pairs, two contact sheets, and SHA-256 manifest.')
