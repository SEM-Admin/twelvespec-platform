"""Validate research coverage and artifact integrity without accepting app features.

Standard library only. Proposed behavioral tests stay unexecuted. This validates
the design packet, not supplier APIs or TwelveSpec cross-module acceptance.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlparse, unquote
from zoneinfo import ZoneInfo
from datetime import datetime
import argparse
import csv
import hashlib
import json
import math
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/business-research'
parser=argparse.ArgumentParser()
parser.add_argument('--write-report',action='store_true')
parser.add_argument('--browser-evidence',type=Path)
args=parser.parse_args()
checks=[]

def check(condition,message):
    if not condition: raise AssertionError(message)
    checks.append(message)

def read(name): return json.loads((OUT/name).read_text())
def unique(rows,key='id'):
    values=[r[key] for r in rows]
    check(len(values)==len(set(values)),f'Unique {key} values across {len(rows)} records')
    return set(values)

d=read('research.json');m=read('data-model.json');t=read('traceability.json')
plan=json.loads((ROOT/'docs/planning/gap-backlog.json').read_text())
original=json.loads((ROOT/'docs/planning/requirements-to-work.json').read_text())
expected_companies={'custom-ink','pcna','sanmar','imprint','4imprint','printify','ordermygear','printnow','vistaprint','printful','shopify','bigcommerce','oracle','smartpress','sinalite','4over','gotprint'}
companies=unique(d['companies']);sources=unique(d['sources']);features=unique(d['features'])
modules={x['code'] for x in plan['modules']};gaps={x['id'] for x in plan['workItems']}
check(companies==expected_companies,'All 17 user-requested companies are represented exactly')
check(len(sources)==39,'39 primary vendor/standards source records retained')
check(len(features)==35,'35 original feature packs retained')
check(d['timezone']=='America/Chicago' and d['researchDate']=='2026-11-06','Research date uses the client business timezone')
official_domains={'customink.com','pcna.com','sanmar.com','imprint.com','4imprint.com','printify.com','ordermygear.com','printnow.com','vistaprint.com','printful.com','shopify.com','shopify.dev','bigcommerce.com','oracle.com','smartpress.com','sinalite.com','4over.com','gotprint.com','promostandards.org'}
for s in d['sources']:
    u=urlparse(s['url']);host=u.hostname or ''
    check(u.scheme=='https' and any(host==x or host.endswith('.'+x) for x in official_domains),s['id']+' uses an official HTTPS source')
    check(not u.username and not u.password and 'psrestful' not in host.lower(),s['id']+' has no credential-bearing/prohibited source URL')
    check(s['access'] in {'PRIMARY_PAGE_REVIEWED','FETCH_BLOCKED_403','OFFICIAL_DOC_SEARCH_REVIEWED','PRIMARY_SEARCH_EXCERPT_ONLY_FETCH_403','PRIMARY_SEARCH_EXCERPT_REVIEWED'},s['id']+' evidence access is classified')
for c in d['companies']:
    check(bool(c['sources']) and set(c['sources'])<=sources,c['id']+' has valid source references')
    check(c['integrationVerification']=='NOT_TESTED',c['id']+' does not imply authenticated verification')
    check(all(c[k] for k in ['featureLesson','twelveSpecDesign','boundary','unknown']),c['id']+' separates evidence/design/boundary/unknown')
    check(set(c['modules'])<=modules,c['id']+' references valid modules')
for f in d['features']:
    check(set(f['sources'])<=sources and set(f['inspiration'])<=companies,f['id']+' has valid evidence/inspiration references')
    check(bool(f['modules']) and set(f['modules'])<=modules,f['id']+' references valid modules')
    check(bool(f['gaps']) and set(f['gaps'])<=gaps,f['id']+' references existing work packages')
    check(len(f['proposedTests'])>=2 and bool(f['invariants']),f['id']+' includes behavioral and failure requirements')
    check(f['status']=='DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH' and f['testExecution']=='NOT_RUN_DESIGN_ONLY',f['id']+' preserves design-only status')
    for path in f['currentCode']+f['existingTests']:
        check((ROOT/path).is_file(),f['id']+' existing path resolves: '+path)
future=[f for f in d['features'] if 'future' in f['modules']]
check(len(future)==1 and future[0]['scope']=='COMING_SOON_ONLY' and not future[0]['proposedCommands'] and not future[0]['proposedEvents'],'Future capabilities have no proposed active transaction commands')
check({x['module'] for x in t['modules']}==modules,'All 20 module contracts covered by design overlay')
check({x['id'] for x in t['requirements']}=={x['id'] for x in original['requirements']} and len(t['requirements'])==205,'All 205 original inventory entries retained')
check({x['id'] for x in t['acceptance']}=={x['id'] for x in original['acceptance']} and len(t['acceptance'])==95,'All 95 original A/T/E scenarios retained')
for kind in ['modules','requirements','acceptance']:
    for row in t[kind]: check(bool(row['features']) and set(row['features'])<=features,kind+' mapping retains feature dependencies for '+row.get('id',row.get('module','?')))
tests=read('proposed-tests.json');unique(tests)
check(len(tests)==104 and all(x['status']=='PROPOSED_NOT_RUN' for x in tests),'104 proposed behavior tests remain explicitly unexecuted')
unique(m['entities'],'name')
fields=[f for e in m['entities'] for f in e['fields']];unique(fields)
check(len(m['entities'])==30 and len(fields)==m['fieldCount']==292,'30 logical entities and 292 field definitions accounted for')
for e in m['entities']:
    check(e['module'] in modules and set(e['features'])<=features and bool(e['constraint']),e['name']+' has authority, feature and integrity mapping')
    check(all(f['valueStatus']=='DEFINITION_ONLY_NO_OPERATIONAL_VALUES_COLLECTED' for f in e['fields']),e['name']+' contains definitions without fabricated operational values')

manifest=read('BUILD_MANIFEST.json')
for name,digest in manifest['files'].items():
    file=OUT/name
    check(file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest()==digest,'Artifact hash matches '+name)
for file in OUT.glob('*.md'):
    for target in re.findall(r'\]\(([^)]+)\)',file.read_text()):
        if target.startswith(('https://','http://','#','mailto:')): continue
        target=unquote(target.split('#',1)[0].strip('<>'))
        if target: check((file.parent/target).resolve().exists(),'Local document link resolves: '+file.name+' → '+target)
check('290-ish' not in (OUT/'SOFTWARE_BLUEPRINT.md').read_text(),'Blueprint uses an exact field inventory count')

w=read('workbook-manifest.json')
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
with zipfile.ZipFile(OUT/w['workbook']) as archive:
    check(archive.testzip() is None,'Workbook ZIP container integrity passes')
    check(not any('externalLinks/' in x for x in archive.namelist()),'Workbook contains no external data connection')
    book=ET.fromstring(archive.read('xl/workbook.xml'))
    rels=ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
    paths={r.attrib['Id']:'xl/'+r.attrib['Target'] for r in rels}
    sheets={s.attrib['name']:paths[s.attrib['{'+ns['r']+'}id']] for s in book.find('m:sheets',ns)}
    check(set(sheets)=={'Start Here','Logic Lab',*w['sheets'].keys()},'Workbook sheet inventory matches the artifact manifest')
    for name,count in w['sheets'].items():
        root=ET.fromstring(archive.read(sheets[name]));rows=root.findall('m:sheetData/m:row',ns)
        check(len(rows)==count+1,name+' workbook row count matches structured research')
        check(root.find('m:autoFilter',ns) is not None and root.find('m:sheetViews/m:sheetView/m:pane',ns) is not None,name+' has filtering and frozen headers')
    logic=ET.fromstring(archive.read(sheets['Logic Lab']))
    cells={c.attrib['r']:c for c in logic.findall('.//m:c',ns)}
    for address,expected in w['logicCachedCells'].items():
        cell=cells[address];actual=cell.find('m:v',ns).text
        check(cell.find('m:f',ns) is not None,'Logic Lab '+address+' contains a real spreadsheet formula')
        good=actual==expected if isinstance(expected,str) else math.isclose(float(actual),expected,rel_tol=1e-12,abs_tol=1e-12)
        check(good,'Logic Lab '+address+' cached output matches independent expected result')
    check(cells['B30'].find('m:v',ns) is None,'Unknown freight example is blank rather than a fabricated zero')
q=lambda x:Decimal(x).quantize(Decimal('0.01'),rounding=ROUND_HALF_UP)
check(q(Decimal('0.0250')*1000)==Decimal('25.00') and q('0.0250')*1000==Decimal('30.00'),'Independent Decimal calculation reproduces the precision failure and required result')
check(q(Decimal('1000')/(1-Decimal('0.40')))==Decimal('1666.67'),'Independent Decimal target-margin calculation matches the logic lab')

packet=OUT/'TwelveSpec_Feature_Research_Packet.zip'
csv_counts={'companies.csv':17,'features.csv':35,'data-fields.csv':292,'proposed-tests.csv':104,'sources.csv':39}
for name,count in csv_counts.items():
    check(b'\r' not in (OUT/name).read_bytes(),name+' uses consistent LF line endings')
    with (OUT/name).open(newline='') as file: rows=list(csv.reader(file))
    check(len(rows)==count+1,name+' preserves every expected structured row')
    check(all(not cell.startswith(('=','+','-','@')) for row in rows for cell in row),name+' contains no executable spreadsheet formula cell')
with zipfile.ZipFile(packet) as archive:
    check(archive.testzip() is None,'Download packet ZIP integrity passes')
    names={Path(x).name for x in archive.namelist()}
    check(set(manifest['files'])<=names and 'BUILD_MANIFEST.json' in names,'Download packet retains all reports, data, viewer and workbook')
    check(not any('/.local/' in x or '/.env' in x for x in archive.namelist()),'Download packet excludes environment files and credential storage')

browser=None
if args.browser_evidence:
    browser=json.loads(args.browser_evidence.read_text())
    check(browser['status']=='PASS' and browser['networkRequests']==0 and browser['consoleErrors']==[],'Offline viewer browser checks passed without external requests/errors')
    check(browser['assertionsPassed']>=10,'Offline viewer has meaningful filtering, reset and data-detail assertions')
    check(browser['artifactSha256']==manifest['files']['index.html'],'Browser verification matches the current research viewer bytes')
if args.write_report:
    when=datetime.now(ZoneInfo('America/Chicago')).isoformat(timespec='seconds')
    report=dict(status='PASS',checkedAt=when,timezone='America/Chicago',scope='RESEARCH_ARTIFACT_VALIDATION_ONLY',
                checksPassed=len(checks),counts=manifest['counts'],browser=browser,
                applicationTests='NOT_RUN_NO_APPLICATION_CODE_CHANGED',proposedFeatureTests='104_PROPOSED_NOT_RUN',
                vendorIntegrations='NOT_AUTHENTICATED_OR_TESTED',originalAcceptance='OPEN_NOT_ACCEPTED_BY_THIS_RESEARCH',
                checks=checks)
    (OUT/'validation-results.json').write_text(json.dumps(report,indent=2)+'\n')
    (OUT/'VALIDATION.md').write_text(f'''# Research artifact verification

Checked {when} ({report['timezone']}). **PASS: {len(checks)} artifact checks.**

- All 17 requested companies, 39 sources and 35 original feature packs accounted for.
- All 20 modules, 205 original inventory entries and 95 original acceptance scenarios retained.
- 30 logical entities and 292 field definitions have ownership and integrity requirements.
- 104 proposed behavior tests are explicitly **NOT RUN**.
- Existing code/test paths, local document links, generated artifact hashes and packet integrity validated.
- Workbook sheet counts, filters, frozen headers, formulas and cached results validated. Decimal calculations independently confirm the precision and target-margin examples.
- Browser viewer: **{browser['status'] if browser else 'NOT_EXECUTED_IN_THIS_RUN'}**; {browser['assertionsPassed'] if browser else 0} assertions. {browser['networkRequests'] if browser else 'Unknown'} external requests.
- Application suites: **NOT RUN** for this research/documentation change. No new application feature or original acceptance scenario is declared passed.
- Vendor account/API verification: **NOT AUTHENTICATED OR TESTED**.

See [machine-readable evidence](validation-results.json). Application gaps and Coming Soon boundaries remain unchanged.
''')
    # Reports are excluded from the content manifest so verification does not hash itself.
    report_names={'VALIDATION.md','validation-results.json'}
    replacement=packet.with_suffix('.tmp')
    with zipfile.ZipFile(packet) as old, zipfile.ZipFile(replacement,'w',zipfile.ZIP_DEFLATED) as archive:
        for member in old.infolist():
            if Path(member.filename).name not in report_names:
                archive.writestr(member,old.read(member.filename))
        for name in sorted(report_names):
            archive.write(OUT/name,arcname='TwelveSpec_Feature_Research/'+name)
    replacement.replace(packet)
print(f'PASS: {len(checks)} research artifact checks; application acceptance and 104 proposed tests remain open.')
