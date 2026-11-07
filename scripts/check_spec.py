from pathlib import Path
import json,hashlib,sys
root=Path(__file__).resolve().parents[1]
spec=root/'specification/master-v1'
manifest=json.loads((root/'docs/specification-inventory.json').read_text())
for f in manifest:
 p=spec/f['path']
 assert p.exists(),f['path']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],'Specification changed: '+f['path']
registry=json.loads((spec/'contracts/module_registry.json').read_text())
trace=json.loads((root/'docs/module-inventory.json').read_text())
assert {m['code'] for m in registry}=={m['code'] for m in trace if 'screens'in m}
assert len(registry)==20 and sum(m['status']=='ACTIVE_V1_SPEC' for m in registry)==19
for m in registry:
 assert (spec/'modules'/(m['code']+'.md')).exists()
print(f'{len(manifest)} original files intact; all 20 module contracts inventoried (19 active, 1 Coming Soon).')
