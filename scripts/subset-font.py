"""Optional local font rebuild: python scripts/subset-font.py path/to/NotoSerifSC.ttf.
Requires fonttools and brotli. The already-subsetted OFL font ships with the game.
"""
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / '.sites-runtime/font-tools'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / '.sites-runtime/NotoSerifSC-full.ttf'
files = [p for folder in ['app', 'components/game', 'lib/game']
         for p in (root / folder).rglob('*') if p.suffix in ['.ts', '.tsx']]
text = ''.join(p.read_text(encoding='utf-8-sig') for p in files)
font = TTFont(source)
options = subset.Options()
options.flavor = 'woff2'
options.desubroutinize = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font = instantiateVariableFont(font, {'wght': 400}, inplace=True)
font.flavor = 'woff2'
target = root / 'public/fonts/noto-serif-sc.woff2'
font.save(target)
print(f'Subset {len(files)} source files: {target.stat().st_size} bytes')
