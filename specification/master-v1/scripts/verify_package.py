from pathlib import Path
import json,zipfile
root=Path(__file__).resolve().parents[1]
mods=json.loads((root/'contracts/module_registry.json').read_text()); missing=[m['code'] for m in mods if not (root/'modules'/f"{m['code']}.md").exists()]
print(f"{len(mods)} module contracts; {len(list((root/'docs').glob('*.md')))} design chapters; missing: {missing}")
assert not missing
