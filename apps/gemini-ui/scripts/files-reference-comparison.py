"""Diagnostic screenshot comparisons only; no generated/replaced UI pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

repo = Path(__file__).resolve().parents[3]
evidence = repo / 'docs/evidence/files-owner-pilot'
refs = repo / 'missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references'
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 24)
for theme, reference_theme in [('light', 'day'), ('dark', 'night')]:
    reference = Image.open(refs / reference_theme / '02_files-instant-search.png').convert('RGB')
    actual = Image.open(evidence / 'after' / f'{theme}-en-1672x941-z1.png').convert('RGB')
    pair = Image.new('RGB', (3344, 1001), '#10172c')
    draw = ImageDraw.Draw(pair)
    draw.text((20, 16), 'OWNER REFERENCE / ' + reference_theme.upper(), fill='white', font=font)
    draw.text((1692, 16), 'ACTUAL FILES / renderer fixture, not owner data', fill='white', font=font)
    pair.paste(reference, (0, 60)); pair.paste(actual, (1672, 60))
    pair.save(evidence / f'{theme}-reference-vs-actual.png')
    Image.blend(reference, actual, .5).save(evidence / f'{theme}-overlay-50.png')
    native_path=evidence/'electron'/f'{theme}-1672x941.png'
    if native_path.exists():
        native=Image.open(native_path).convert('RGB')
        native_pair=Image.new('RGB',(3344,1001),'#10172c')
        native_label=ImageDraw.Draw(native_pair)
        native_label.text((20,16),'OWNER REFERENCE / '+reference_theme.upper(),fill='white',font=font)
        native_label.text((1692,16),'ACTUAL ELECTRON / 40 disposable files, real IPC',fill='white',font=font)
        native_pair.paste(reference,(0,60));native_pair.paste(native,(1672,60))
        native_pair.save(evidence/f'{theme}-native-reference-vs-actual.png')
    for width,height in [(1366,768),(1672,941)]:
        before=Image.open(evidence/'before'/f'{theme}-en-{width}x{height}-z1.png').convert('RGB')
        after=Image.open(evidence/'after'/f'{theme}-en-{width}x{height}-z1.png').convert('RGB')
        comparison=Image.new('RGB',(width*2,height+60),'#10172c')
        label=ImageDraw.Draw(comparison)
        label.text((20,16),'BEFORE / 9eaa161',fill='white',font=font)
        label.text((width+20,16),'AFTER / Files owner pilot',fill='white',font=font)
        comparison.paste(before,(0,60));comparison.paste(after,(width,60))
        comparison.save(evidence/f'{theme}-before-after-{width}x{height}.png')
print('Created reference/actual pairs, 50% overlays, and before/after pairs.')
