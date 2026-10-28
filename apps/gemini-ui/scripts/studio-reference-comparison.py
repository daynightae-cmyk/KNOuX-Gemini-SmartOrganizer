"""Compare immutable owner PNGs with real Electron captures; never score acceptance."""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[3]
actual = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'docs/evidence/studio-domain/golden-packaged'
output = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else root / 'docs/evidence/studio-domain/comparisons'
output.mkdir(parents=True, exist_ok=True)
reference_root = root / 'missions/VISUAL_REDESIGN_DAY_NIGHT_20261027'
manifest = json.loads((reference_root / 'REFERENCES_MANIFEST.json').read_text(encoding='utf-8-sig'))
proof = json.loads((actual / 'proof.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 19)
rows = []
for theme, light in [('day', 'light'), ('night', 'dark')]:
    entry = next(row for row in manifest['images'] if row.get('section') == 'Organization Studio' and row['theme'] == theme)
    source = reference_root / entry['file']
    original_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    assert original_hash == entry['sha256']
    reference = Image.open(source).convert('RGB')
    assert reference.size == (entry['width'], entry['height']) == (1672, 941)
    for scene in ['overview'] + [f'stage-{i}' for i in range(1, 10)]:
        file = actual / f'{scene}-{light}.png'
        capture = Image.open(file).convert('RGB')
        assert capture.size == reference.size, (str(file), capture.size)
        w, h = capture.size
        paired = Image.new('RGB', (2*w, h+38), '#11182b')
        draw = ImageDraw.Draw(paired)
        draw.text((15, 6), f'APPROVED {theme.upper()} REFERENCE', font=font, fill='white')
        draw.text((w+15, 6), f'ACTUAL PACKAGED ELECTRON | {scene} | {proof["sourceCommit"][:12]} | REVIEW REQUIRED', font=font, fill='white')
        paired.paste(reference, (0, 38))
        paired.paste(capture, (w, 38))
        outputs = {}
        for suffix, image in [('side-by-side', paired), ('overlay-50pct', Image.blend(reference, capture, .5)), ('difference', ImageChops.difference(reference, capture))]:
            target = output / f'{scene}-{theme}-{suffix}.png'
            image.save(target)
            outputs[suffix] = {'file': str(target.relative_to(root)), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        rows.append({'scene': scene, 'theme': theme, 'referenceSha256': original_hash, 'actualSha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'outputs': outputs})
    assert hashlib.sha256(source.read_bytes()).hexdigest() == original_hash
(output / 'manifest.json').write_text(json.dumps({'sourceCommit': proof['sourceCommit'], 'acceptance': 'OWNER_REVIEW_REQUIRED', 'method': 'Exact-size side-by-side, 50 percent overlay and absolute pixel difference. Differences include legitimate Native data; no synthetic similarity score.', 'comparisons': rows}, indent=2), encoding='utf-8')
print(json.dumps({'screensCompared': len(rows), 'artifacts': len(rows)*3, 'sourceCommit': proof['sourceCommit'], 'acceptance': 'OWNER_REVIEW_REQUIRED'}))
