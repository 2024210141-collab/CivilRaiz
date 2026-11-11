"""Regenera la versión de un archivo y sincroniza los recursos Android. Python estándar."""
from pathlib import Path
import base64
import json
import re
import shutil

root = Path(__file__).resolve().parent
web = root / 'web'
experience = web / 'experience.js'
art = {p.stem: 'data:image/svg+xml;base64,' + base64.b64encode(p.read_bytes()).decode('ascii')
       for p in (web / 'imagenes').glob('*.svg')}
source = experience.read_text(encoding='utf-8')
source = re.sub(r'const ART_DATA = .*?;\nlet chartMode=',
                lambda _: 'const ART_DATA = ' + json.dumps(art) + ';\nlet chartMode=',
                source, flags=re.S)
experience.write_text(source, encoding='utf-8')
html = (web / 'index.html').read_text(encoding='utf-8')
for name in ['styles.css', 'experience.css']:
    html = html.replace(f'<link rel="stylesheet" href="{name}">',
                        '<style>\n' + (web / name).read_text(encoding='utf-8') + '\n</style>')
for name in ['core.js', 'app.js', 'experience.js']:
    script = (web / name).read_text(encoding='utf-8')
    script = script.replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + script + '\n</script>')
(root / 'ABRIR_CIVILRAIZ.html').write_text(html, encoding='utf-8')
assets = root / 'android/app/src/main/assets'
assets.mkdir(parents=True, exist_ok=True)
for file in web.iterdir():
    if file.is_file() and file.suffix in ('.html', '.css', '.js'):
        shutil.copy2(file, assets / file.name)
shutil.copytree(web / 'imagenes', assets / 'imagenes', dirs_exist_ok=True)
print('HTML único generado y recursos Android sincronizados.')
