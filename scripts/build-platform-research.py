"""Build the readable report, local research viewer and downloadable workbook.

Run from the repository with Python 3 and xlsxwriter==3.2.9. No network, account
credentials, application services or database writes are used by this build.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import csv
import hashlib
import html
import json
import math
import runpy
import zipfile
import xlsxwriter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/business-research'
for stale_report in ['VALIDATION.md','validation-results.json']:
    (OUT/stale_report).unlink(missing_ok=True)
for script in ['curate-platform-research.py','curate-research-model.py']:
    runpy.run_path(str(ROOT/'scripts'/script))
D=json.loads((OUT/'research.json').read_text())
M=json.loads((OUT/'data-model.json').read_text())
P=json.loads((ROOT/'docs/planning/gap-backlog.json').read_text())
T=json.loads((ROOT/'docs/planning/requirements-to-work.json').read_text())
S={s['id']:s for s in D['sources']}
C={c['id']:c for c in D['companies']}
F={f['id']:f for f in D['features']}

def md(value):
    return str(value).replace('|','\\|').replace('\n',' ')

def write(name,text):
    (OUT/name).write_text(text.strip()+'\n')

def refs(keys):
    return ', '.join(f'[{k}: {S[k]["title"]}]({S[k]["url"]})' for k in keys)

def feature_refs(items):
    return ', '.join(f'[{f["id"]}](FEATURE_PACKS.md#{f["id"].lower()})' for f in items)

def local_refs(paths):
    return ', '.join(f'[{p}](../../{p})' for p in paths)

def table(headers,rows):
    return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join('---' for _ in headers)+' |']+
                     ['| '+' | '.join(md(v) for v in row)+' |' for row in rows])

companies=['# Company feature research','',
 'Reviewed November 6, 2026 (America/Chicago). Public behavior is the evidence; proposed TwelveSpec designs are original. All authenticated integrations remain **NOT_TESTED**. See the [software blueprint](SOFTWARE_BLUEPRINT.md) for the combined design and the [source register](SOURCES.md) for access limitations.','',
 table(['Company','Role in this research','Related feature packs'],[
     [c['name'],c['role'],feature_refs([f for f in D['features'] if c['id'] in f['inspiration']])] for c in D['companies']]),'']
for c in D['companies']:
    companies += [f'## {c["name"]}','',f'**Documented behavior.** {c["publicFacts"]} {refs(c["sources"])}','',
                  f'**Pattern to learn.** {c["featureLesson"]}','',f'**Original TwelveSpec design.** {c["twelveSpecDesign"]}','',
                  f'**Boundary.** {c["boundary"]}','',f'**Unverified information.** {c["unknown"]}','',
                  '**Related designs:** '+feature_refs([f for f in D['features'] if c['id'] in f['inspiration']])+'.','']
write('COMPANY_PROFILES.md','\n'.join(companies))

sources=['# Public source register','',
 'Reviewed November 6, 2026 in America/Chicago. Sources support public behavior only. No supplier, commerce or ERP account was authenticated or tested. Search excerpts and fetch failures are labeled rather than represented as full-page reviews. Source dates are not proof that vendor plans or contracts will remain unchanged.','',
 table(['ID','Company/source','Title','Evidence access','Limit or note'],[
     [s['id'],s['company'],f'[{s["title"]}]({s["url"]})',s['access'],s['note'] or s['proves']] for s in D['sources']]),'',
 '## Collection limits','',
 '- Official pages/documentation were used for technical claims. Promotional claims are not independent performance measurements.',
 '- No authenticated competitor UI audit, private source-code review, real checkout, account enrollment or vendor contact was performed.',
 '- No wholesale catalog, proprietary customer artwork or vendor source code was copied into the dataset.',
 '- PCNA direct main-site access and SinaLite direct page access were limited. Exact current protocols and entitlements need authorized documentation.',
 '- No integration is declared SANDBOX_VERIFIED or LIVE_VERIFIED based on this research.',
 '- PSRESTful search results were excluded; it is not a source, dependency or proposed integration.']
write('SOURCES.md','\n'.join(sources))

features=['# Original feature implementation packs','',
 f'{len(F)} feature packs, {sum(len(f["proposedTests"]) for f in F.values())} proposed behavior tests. **All are design work; none is newly implemented or test-passed by this research.** Existing code and test paths are starting points. Conceptual commands/events require alignment with the existing server and event registry before implementation.','',
 table(['ID','Feature','Priority','Scope','Gap work'],[
     [f'[{f["id"]}](#{f["id"].lower()})',f['title'],f['priority'],f['scope'],', '.join(f['gaps'])] for f in F.values()]),'']
test_rows=[]
for f in F.values():
    features += [f'<a id="{f["id"].lower()}"></a>',f'## {f["id"]} — {f["title"]}','',
                 f'**Scope:** {f["scope"]}. **Status:** {f["status"]}.','',
                 '**Public inspiration:** '+(', '.join(C[c]['name'] for c in f['inspiration']) or 'Controlling TwelveSpec architecture and observed repository gaps')+'.',
                 ('**Sources:** '+refs(f['sources'])+'.') if f['sources'] else '**Basis:** the handoff and existing persistence/security/recovery gap audit.',
                 '',f'**Customer flow:** {f["customerFlow"]}','',f'**Operator flow:** {f["operatorFlow"]}','',
                 '**Logical records:** '+', '.join('`'+r+'`' for r in f['records'])+'.','',
                 '**Required rules and edge handling:**','']
    features += ['- '+r for r in f['invariants']]
    features += ['','**Proposed commands:** '+(', '.join('`'+c+'`' for c in f['proposedCommands']) or 'None; reserved commands remain denied')+'.',
                 '**Proposed events:** '+(', '.join('`'+e+'`' for e in f['proposedEvents']) or 'None')+'.','',
                 '**Behavioral acceptance additions — NOT RUN:**','']
    for n,test in enumerate(f['proposedTests'],1):
        key=f'{f["id"]}-T{n:02}'
        features += [f'- **{key}:** {test}']
        test_rows.append(dict(id=key,feature=f['id'],assertion=test,status='PROPOSED_NOT_RUN',modules=f['modules'],gaps=f['gaps']))
    features += ['','**Existing code to extend:** '+local_refs(f['currentCode'])+'.','',
                 '**Existing tests to extend:** '+local_refs(f['existingTests'])+'.','',
                 '**Gap work:** '+', '.join(f['gaps'])+'. **Modules:** '+', '.join(f['modules'])+'.',
                 '**Original acceptance dependencies:** '+', '.join(f['acceptance'])+'.','']
write('FEATURE_PACKS.md','\n'.join(features))
write('proposed-tests.json',json.dumps(test_rows,indent=2))

model=['# Logical data model for the feature designs','',
       f'{len(M["entities"])} logical entities and {M["fieldCount"]} named field definitions. These are original software requirements, not extracted competitor schemas or applied database migrations. No operational values are supplied. Common scope fields apply to all relevant records; relationships require normalized, scoped foreign keys.','',
       M['commonScopeRule'],'',M['privacyRule'],'',
       table(['Logical entity','Owning module','Lifecycle','Features'],[
           [e['name'],e['module'],e['lifecycle'],', '.join(e['features'])] for e in M['entities']]),'']
for e in M['entities']:
    model += [f'## {e["name"]}','',f'**Authority:** {e["owner"]}. **Lifecycle:** {e["lifecycle"]}.','',
              f'**Integrity rule:** {e["constraint"]}','',
              table(['Field','Proposed type','Meaning'],[[f['name'],f['proposedType'],f['definition']] for f in e['fields']]),'']
write('DATA_MODEL.md','\n'.join(model))

module_rows=[]
for m in P['modules']:
    linked=[f for f in F.values() if m['code'] in f['modules']]
    module_rows.append(dict(module=m['code'],title=m['title'],availability=m['availability'],
                            features=[f['id'] for f in linked],currentCode=m['currentSource'],
                            existingTest=m.get('existingTest'),acceptance='OPEN_NOT_NEWLY_VERIFIED'))
acceptance_rows=[]
for a in T['acceptance']:
    linked=[f for f in F.values() if set(f['gaps'])&set(a['workItems'])]
    acceptance_rows.append(dict(id=a['id'],journey=a['journey'],requiredAssertion=a['requiredAssertion'],
                                 features=[f['id'] for f in linked],gaps=a['workItems'],status='ORIGINAL_SCENARIO_OPEN'))
requirements_rows=[]
for r in T['requirements']:
    linked=[f for f in F.values() if r['module'] in f['modules'] and set(r['workItems'])&set(f['gaps'])]
    requirements_rows.append(dict(id=r['id'],module=r['module'],kind=r['kind'],requirement=r['requirement'],
                                   features=[f['id'] for f in linked],gaps=r['workItems'],status='DESIGN_LINK_NOT_IMPLEMENTATION_ACCEPTANCE'))
traces=dict(modules=module_rows,requirements=requirements_rows,acceptance=acceptance_rows,
            mappingRule='Module and work-package intersection gives a planning dependency, not proof that a feature implements an entire original scenario.')
write('traceability.json',json.dumps(traces,indent=2))
tracem=['# Research-to-code-to-test traceability','',
        f'This design overlay preserves all {len(module_rows)} modules, {len(requirements_rows)} inventory entries and {len(acceptance_rows)} original acceptance scenarios. All application acceptance remains open. A planning intersection is a dependency to review, not evidence of implementation.','',
        'The full [machine-readable trace](traceability.json) retains each module/screen/command entry, its gap IDs and related feature packs. The workbook exposes the same inventory and proposed tests.','',
        '## Module coverage','',table(['Module','Availability','Feature packs','Existing source'],[
            [m['module'],m['availability'],', '.join(m['features']),f'[{m["currentCode"]}](../../{m["currentCode"]})'] for m in module_rows]),'',
        '## Original acceptance dependencies','',table(['ID','Journey','Gap work','Feature dependency'],[
            [a['id'],a['journey'],', '.join(a['gaps']),', '.join(a['features'])] for a in acceptance_rows]),'',
        '## Evidence boundaries','',
        '- Existing source paths and tests have been checked for existence; their presence does not satisfy a feature or scenario.',
        '- Feature-pack test assertions are proposed and explicitly NOT RUN. They supplement the original suite.',
        '- No original acceptance requirement, Coming Soon boundary or external activation requirement was removed.']
write('TRACEABILITY.md','\n'.join(tracem))

activation=[
 dict(id='R-01',area='Core feature development',status='CAN_IMPLEMENT_WITH_SYNTHETIC_DATA',needed='Implement the original designs, regression tests and complete UI paths in the existing repository.',approval='Routine engineering; no vendor account required.'),
 dict(id='R-02',area='Persistent development database',status='EXISTING_BLOCKER_RECORDED',needed='Approved development connection needs its trusted certificate chain; current preview demo database is temporary.',approval='Credential/certificate material through the approved secure channel; no production connection.'),
 dict(id='R-03',area='Private assets and secrets',status='FOUNDATION_IMPLEMENTATION_OPEN',needed='Durable private artwork and managed secret broker with verified recovery.',approval='Any new paid service or account infrastructure change requires approval.'),
 dict(id='R-04',area='Direct supplier/POD adapters',status='PUBLIC_BEHAVIOR_RESEARCHED_NOT_INTEGRATION_VERIFIED',needed='Authorized current schemas, sandbox access, scoped credentials, account pricing, permitted media and operation-level tests.',approval='Credentials, licensing and any financial commitment when ready for account testing.'),
 dict(id='R-05',area='ASI SmartLink and ESP interfaces',status='LICENSED_CONTRACT_REQUIRED',needed='Keep interfaces separate; obtain official entitled schemas, media/redistribution rights and developer credentials.',approval='Licensing and credentials; PSRESTful is prohibited.'),
 dict(id='R-06',area='Real payments, shipping and accounting',status='SIMULATED_OR_REFERENCE_ONLY',needed='Verified adapters and financial/legal policies; use isolated sandbox outcomes before live writes.',approval='Financial approval and provider credentials; no real charges or labels in research.'),
 dict(id='R-07',area='Source publication and CI',status='SOURCE_DELIVERY_GAP_RECORDED',needed='The existing audit found a public GitHub remote with only its initial commit. Review repository privacy and publication scope before uploading the implementation/handoff.',approval='Source publication/privacy decision is separate from local work; no push performed.'),
 dict(id='R-08',area='New deployment',status='NOT_PERFORMED_BY_RESEARCH',needed='Build reviewable changes and verify locally first; retain separate protected preview URLs.',approval='Deployment authorization for the concrete changes.'),
 dict(id='R-09',area='Future modules',status='COMING_SOON',needed='Research only for reserved capabilities; server and UI controls remain disabled.',approval='A later scope/activation decision; no implicit activation from competitive research.')]
write('activation-requirements.json',json.dumps(activation,indent=2))
write('ACTIVATION_REQUIREMENTS.md','\n'.join(['# What can be built now and what needs later access','',
 'No credentials or approvals are requested by this research packet. Most workflow logic can be built and tested with synthetic data now. Request account material only when a specific integration is ready for authorized testing.','',
 table(['ID','Area','Current evidence/status','Needed next','Approval boundary'],[
     [a['id'],a['area'],a['status'],a['needed'],a['approval']] for a in activation]),'',
 'No existing production TwelveSpec system, supplier account, payment processor or customer dataset was accessed or changed for this research.']))

def csv_out(name,headers,rows):
    with (OUT/name).open('w',newline='') as file:
        writer=csv.writer(file,lineterminator='\n');writer.writerow(headers)
        for row in rows:
            # Neutralize spreadsheet execution if future curated values begin with formula prefixes.
            writer.writerow([("'"+v if isinstance(v,str) and v[:1] in ('=','+','-','@') else v) for v in row])

csv_out('companies.csv',['company_id','company','research_role','lesson','original_design','unknown','sources','integration_verification'],[
    [c['id'],c['name'],c['role'],c['featureLesson'],c['twelveSpecDesign'],c['unknown'],';'.join(c['sources']),c['integrationVerification']] for c in C.values()])
csv_out('features.csv',['feature_id','title','priority','scope','status','modules','inspiration','gaps','records','sources'],[
    [f['id'],f['title'],f['priority'],f['scope'],f['status'],';'.join(f['modules']),';'.join(f['inspiration']),';'.join(f['gaps']),';'.join(f['records']),';'.join(f['sources'])] for f in F.values()])
csv_out('data-fields.csv',['field_id','logical_entity','module','proposed_type','definition','integrity_rule','value_status'],[
    [f['id'],e['name'],e['module'],f['proposedType'],f['definition'],e['constraint'],f['valueStatus']] for e in M['entities'] for f in e['fields']])
csv_out('proposed-tests.csv',['test_id','feature','assertion','status','gaps'],[
    [t['id'],t['feature'],t['assertion'],t['status'],';'.join(t['gaps'])] for t in test_rows])
csv_out('sources.csv',['source_id','company','title','url','reviewed_on','timezone','access','note'],[
    [s['id'],s['company'],s['title'],s['url'],s['reviewedOn'],s['timezone'],s['access'],s['note']] for s in S.values()])

workbook_path=OUT/'TwelveSpec_Feature_Research.xlsx'
wb=xlsxwriter.Workbook(workbook_path,{'strings_to_formulas':False,'strings_to_urls':False})
wb.set_properties({'title':'TwelveSpec original feature research','subject':'Public feature patterns to original data, workflow and tests','author':'TwelveSpec research','comments':'No authenticated vendor integrations or new application implementation are claimed.'})
fmt_header=wb.add_format({'bold':True,'font_color':'#FFFFFF','bg_color':'#173D31','text_wrap':True,'valign':'top'})
fmt_text=wb.add_format({'text_wrap':True,'valign':'top','font_size':10})
fmt_title=wb.add_format({'bold':True,'font_size':20,'font_color':'#173D31'})
fmt_note=wb.add_format({'text_wrap':True,'font_color':'#525D59','valign':'top'})
fmt_link=wb.add_format({'text_wrap':True,'valign':'top','font_color':'#195CA8','underline':1})
fmt_input=wb.add_format({'font_color':'#195CA8','bg_color':'#EDF5FF','num_format':'0.0000'})
fmt_money=wb.add_format({'num_format':'0.00','bg_color':'#EFF8F1'})
fmt_formula=wb.add_format({'text_wrap':True,'valign':'top','bg_color':'#EFF8F1'})
fmt_percent=wb.add_format({'num_format':'0.00%'})
sheet_counts={}

def sheet(name,headers,rows,widths=None):
    ws=wb.add_worksheet(name);ws.set_default_row(54);ws.set_row(0,32)
    ws.freeze_panes(1,1);ws.autofilter(0,0,len(rows),len(headers)-1)
    for col,key in enumerate(headers):
        ws.write(0,col,key,fmt_header);ws.set_column(col,col,(widths or {}).get(col,32),fmt_text)
    for ri,row in enumerate(rows,1):
        max_lines=max(math.ceil(len(str(val))/(max(12,(widths or {}).get(ci,32))*.82)) for ci,val in enumerate(row))
        ws.set_row(ri,min(300,max(42,14*max_lines+10)))
        for ci,val in enumerate(row):
            if isinstance(val,(list,tuple)): val='; '.join(str(x) for x in val)
            ws.write(ri,ci,val,fmt_text)
        if name=='Sources': ws.write_url(ri,3,row[3],fmt_link,string=row[3])
    ws.set_landscape();ws.fit_to_pages(1,0);ws.repeat_rows(0);ws.set_header('&LTwelveSpec feature research&RNovember 6, 2026 (Chicago)')
    ws.set_footer('&LDesign work; integration not tested&RPage &P of &N')
    sheet_counts[name]=len(rows)
    return ws

intro=wb.add_worksheet('Start Here');intro.set_column('A:A',30);intro.set_column('B:B',105)
intro.write('A1','TwelveSpec',fmt_title);intro.write('B1','Original software feature research',fmt_title)
intro_rows=[
 ('Purpose','Use public feature patterns from the 17 requested companies to design TwelveSpec’s own software.'),
 ('Research date','November 6, 2026 · America/Chicago'),
 ('Coverage',f'17 companies · 39 sources · 35 feature packs · 104 proposed tests · {M["fieldCount"]} field definitions'),
 ('Controlling scope','Master Engineering Handoff v1; 20 modules, 205 inventory entries and 95 original scenarios retained.'),
 ('Implementation status','Design and research only. New feature packs and tests are NOT implemented or passed by this workbook.'),
 ('Integration status','All authenticated vendor integrations remain NOT_TESTED by this research. Public documentation is not account verification.'),
 ('Workbook order','Companies → Features → Rules → Test Designs → Data Fields → Modules/Inventory/Acceptance → Access Needs.'),
 ('Blue cells','Synthetic scenario inputs in Logic Lab, editable for understanding calculations. They are not vendor prices or real business balances.'),
 ('Green cells','Formula outputs with cached values. Real workflow concurrency and approval must be enforced by the application/database.'),
 ('Safety of scope','No production TwelveSpec access, supplier spend, account creation, external messages, new deployment or source publication.'),
 ('Future capabilities','Coming Soon stays disabled. Competitive research does not activate AI, 3D, CAD, SaaS, GL/payroll, enterprise MRP or autonomous procurement.'),
 ('Source limitations','PCNA and SinaLite have identified fetch limits. GotPrint terms are conditional; Printful v2 is Open Beta; plan/API behavior is version-specific.'),
 ('Reproduction','In the repository: install scripts/research-requirements.txt, run npm run research:build, then npm run check:research.'),
 ('Readable documents','Open README.md, SOFTWARE_BLUEPRINT.md and FEATURE_PACKS.md in the same research directory. index.html is an offline filterable viewer.')]
for row,(label,value) in enumerate(intro_rows,3):
    intro.write(row,0,label,fmt_header);intro.write(row,1,value,fmt_text);intro.set_row(row,45)
sheet('Companies',['Company','Research role','Documented behavior','Lesson','Original TwelveSpec design','Boundary','Unverified information','Source IDs','Integration status'],[
    [c['name'],c['role'],c['publicFacts'],c['featureLesson'],c['twelveSpecDesign'],c['boundary'],c['unknown'],c['sources'],c['integrationVerification']] for c in C.values()],{2:50,3:48,4:75,5:65,6:65})
sheet('Features',['ID','Feature','Priority','Scope','Status','Customer flow','Operator flow','Modules','Gap work','Inspiration','Sources','Current code','Existing test references'],[
    [f['id'],f['title'],f['priority'],f['scope'],f['status'],f['customerFlow'],f['operatorFlow'],f['modules'],f['gaps'],f['inspiration'],f['sources'],f['currentCode'],f['existingTests']] for f in F.values()],{0:10,1:48,5:70,6:80,11:70,12:70})
sheet('Rules',['Rule ID','Feature','Business invariant','Status'],[
    [f'{f["id"]}-R{n:02}',f['id'],rule,'DESIGN_REQUIREMENT'] for f in F.values() for n,rule in enumerate(f['invariants'],1)],{0:16,2:115})
sheet('Commands and Events',['Feature','Kind','Proposed name','Status'],[
    [f['id'],kind,value,'CONCEPTUAL_NOT_AN_EXISTING_ROUTE_CLAIM'] for f in F.values() for kind,values in [('COMMAND',f['proposedCommands']),('EVENT',f['proposedEvents'])] for value in values],{2:48,3:60})
sheet('Test Designs',['Test ID','Feature','Behavioral assertion','Execution status','Gap work'],[
    [t['id'],t['feature'],t['assertion'],t['status'],t['gaps']] for t in test_rows],{0:18,1:12,2:110,3:28,4:65})
sheet('Data Fields',['Field ID','Logical entity','Module','Proposed type','Definition','Authority','Lifecycle','Integrity rule','Related features','Value status'],[
    [f['id'],e['name'],e['module'],f['proposedType'],f['definition'],e['owner'],e['lifecycle'],e['constraint'],e['features'],f['valueStatus']] for e in M['entities'] for f in e['fields']],{0:55,1:28,4:80,7:100,9:60})
sheet('Modules',['Module','Title','Availability','Feature packs','Existing source','Acceptance'],[
    [m['module'],m['title'],m['availability'],m['features'],m['currentCode'],m['acceptance']] for m in module_rows],{1:45,3:80,4:65})
sheet('Inventory',['Requirement ID','Module','Kind','Requirement','Feature dependencies','Gap work','Status'],[
    [r['id'],r['module'],r['kind'],r['requirement'],r['features'],r['gaps'],r['status']] for r in requirements_rows],{0:70,3:55,4:90,5:80})
sheet('Original Acceptance',['Scenario','Journey','Required assertion','Feature dependencies','Gap work','Status'],[
    [a['id'],a['journey'],a['requiredAssertion'],a['features'],a['gaps'],a['status']] for a in acceptance_rows],{1:45,2:105,3:100,4:70})
sheet('Sources',['ID','Company/source','Title','URL','Reviewed','Timezone','Access evidence','Limit or note'],[
    [s['id'],s['company'],s['title'],s['url'],s['reviewedOn'],s['timezone'],s['access'],s['note']] for s in S.values()],{2:55,3:100,6:55,7:100})
sheet('Access Needs',['ID','Area','Current status','Needed next','Approval boundary'],[
    [a['id'],a['area'],a['status'],a['needed'],a['approval']] for a in activation],{1:40,2:65,3:110,4:100})

lab=wb.add_worksheet('Logic Lab');lab.set_column('A:A',52);lab.set_column('B:B',22);lab.set_column('C:C',95)
lab.write('A1','Synthetic logic examples',fmt_title);lab.merge_range('A2:C2','Illustrations for software requirements. No vendor price, actual budget, payment or production result is represented.',fmt_note)
lab.write_row('A4',['Precision example','Value','Meaning'],fmt_header)
lab.write('A5','Supplier unit cost');lab.write_number('B5',0.025,fmt_input);lab.write('C5','Synthetic source unit cost; preserve precision before extension.')
lab.write('A6','Quantity');lab.write_number('B6',1000,fmt_input)
lab.write('A7','Correct extension');lab.write_formula('B7','=ROUND(B5*B6,2)',fmt_money,25)
lab.write('A8','Early rounding example');lab.write_formula('B8','=ROUND(B5,2)*B6',fmt_money,30)
lab.write('A9','Overstatement from early rounding');lab.write_formula('B9','=B8-B7',fmt_money,5)
lab.write_row('A12',['Margin example','Value','Meaning'],fmt_header)
lab.write('A13','Complete direct cost');lab.write_number('B13',1000,fmt_input)
lab.write('A14','Target gross margin');lab.write_number('B14',.4,fmt_percent);lab.write('C14','Handoff default; configurable policy rather than vendor performance.')
lab.write('A15','Target revenue');lab.write_formula('B15','=ROUND(B13/(1-B14),2)',fmt_money,1666.67)
lab.write('A16','40% markup example');lab.write_formula('B16','=ROUND(B13*(1+B14),2)',fmt_money,1400)
lab.write('A17','Gross margin from that markup');lab.write_formula('B17','=(B16-B13)/B16',fmt_percent,float(Decimal(400)/Decimal(1400)))
lab.write_row('A20',['Budget example','Value','Meaning'],fmt_header)
lab.write('A21','Remaining allowance');lab.write_number('B21',100,fmt_input)
lab.write('A22','First requested commitment');lab.write_number('B22',60,fmt_input)
lab.write('A23','Second requested commitment');lab.write_number('B23',60,fmt_input)
lab.write('A24','Both fit at once?');lab.write_formula('B24','=IF(B22+B23<=B21,"YES","NO")',fmt_formula,'NO');lab.write('C24','The application must lock and reserve atomically; this sheet is only the arithmetic illustration.')
lab.write('A25','Balance after one reservation');lab.write_formula('B25','=B21-B22',fmt_money,40)
lab.write('A26','Can the second reserve now?');lab.write_formula('B26','=IF(B23<=B25,"YES","NO")',fmt_formula,'NO')
lab.write_row('A29',['Unknown evidence example','Value','Meaning'],fmt_header)
lab.write('A30','Freight cost');lab.write_blank('B30',None,fmt_input);lab.write('C30','Blank means unknown. Entering zero is an explicit assertion that freight is free/not applicable.')
lab.write('A31','Commercial readiness');lab.write_formula('B31','=IF(COUNT(B30)=0,"QUOTE ONLY","REVIEW COST")',fmt_formula,'QUOTE ONLY')
lab.data_validation('B5',{'validate':'decimal','criteria':'>=','value':0})
lab.data_validation('B6',{'validate':'integer','criteria':'>=','value':1})
lab.data_validation('B14',{'validate':'decimal','criteria':'between','minimum':0,'maximum':0.99})
lab.freeze_panes(4,1);lab.set_landscape();lab.fit_to_pages(1,1)
wb.close()
write('workbook-manifest.json',json.dumps(dict(sheets=sheet_counts,logicCachedCells={'B7':25,'B8':30,'B9':5,'B15':1666.67,'B16':1400,'B17':float(Decimal(400)/Decimal(1400)),'B24':'NO','B25':40,'B26':'NO','B31':'QUOTE ONLY'},logicSheet='Logic Lab',workbook=workbook_path.name),indent=2))

viewer_data={'companies':D['companies'],'features':D['features'],'entities':M['entities'],'sources':D['sources']}
viewer_json=json.dumps(viewer_data,ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
viewer='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>TwelveSpec · Feature research</title><style>
:root{font-family:system-ui,sans-serif;color:#182f27;background:#f4f6f2;line-height:1.6}*{box-sizing:border-box}body{margin:0}header{background:#173d31;color:white;padding:2rem max(1rem,calc((100vw - 1160px)/2))}h1{line-height:1.15;max-width:900px;font-size:clamp(1.8rem,4vw,3rem)}main{max-width:1200px;padding:1rem 1.25rem 4rem;margin:auto}a{color:#125b43}header a{color:#d8f6e4}.stats{display:flex;gap:1rem;flex-wrap:wrap}.stats span{padding:.6rem 1rem;background:#245640;border-radius:.4rem}.notice{border-left:5px solid #b87524;padding:.8rem 1rem;background:#fff5df;color:#4a361a}.filters{display:flex;gap:1rem;flex-wrap:wrap;align-items:end;position:sticky;top:0;background:#f4f6f2;padding:1rem 0;border-bottom:1px solid #cbd7cc;z-index:2}label{display:grid;gap:.25rem;font-weight:600}input,select{font:inherit;padding:.6rem;border:1px solid #7f978a;border-radius:.3rem;max-width:100%}input{min-width:260px}article{background:white;border:1px solid #cdd8cc;border-radius:.5rem;padding:1.2rem;margin:1rem 0;box-shadow:0 2px 6px #13302506}article h2{margin:.1rem 0;font-size:1.3rem}.tag{display:inline-block;font-size:.8rem;border-radius:1rem;background:#edf2ec;padding:.1rem .6rem;margin:.3rem .4rem .3rem 0}.muted{color:#53655c}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem}.grid p{margin:.3rem 0}summary{cursor:pointer;font-weight:600;padding:.5rem 0}li{margin:.4rem 0}.links{display:flex;gap:1rem;flex-wrap:wrap}.count{font-weight:600}code{word-break:break-word;background:#edf2ec;padding:.1rem .25rem}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #d6dfd6;vertical-align:top}th{background:#edf2ec}.table-wrap{overflow:auto}:focus-visible{outline:3px solid #c48030;outline-offset:3px}[hidden]{display:none!important}@media(max-width:700px){.grid{grid-template-columns:1fr}.filters{position:static}.filters label{width:100%}input{min-width:0;width:100%}}@media print{.filters,.links{display:none}article{break-inside:avoid}header{background:white;color:black}.stats span{background:#eee}}
</style></head><body><header><p>TwelveSpec / original software research</p><h1>Useful patterns. Explicit rules. One connected platform.</h1><p>17 companies researched · November 6, 2026 · America/Chicago</p><div class="stats"><span>35 feature designs</span><span>104 proposed tests</span><span>30 logical entities</span><span>292 field definitions</span></div></header><main>
<p class="notice"><strong>Research and implementation design.</strong> These features are planned, proposed tests are unexecuted, and authenticated vendor integrations were not tested. Coming Soon capabilities remain disabled. This offline viewer is a research artifact.</p>
<nav class="links" aria-label="Research documents"><a href="SOFTWARE_BLUEPRINT.md">Engineering blueprint</a><a href="TwelveSpec_Feature_Research.xlsx" download>Download workbook</a><a href="FEATURE_PACKS.md">Detailed feature packs</a><a href="SOURCES.md">Source register</a></nav>
<section class="filters" aria-label="Research filters"><label>Explore<select id="view" aria-label="Explore"><option value="features">Feature designs</option><option value="companies">Company patterns</option><option value="entities">Logical data model</option></select></label><label>Module<select id="module" aria-label="Module"><option value="">All modules</option></select></label><label>Search<input id="search" aria-label="Search" type="search" placeholder="Proof, budgets, supplier, company name…"></label></section>
<p id="count" class="count" role="status" aria-live="polite"></p><div id="results"></div><p id="empty" hidden>No matching research. Clear the search or choose another module.</p>
<script id="research-data" type="application/json">__DATA__</script><script>
'use strict';const d=JSON.parse(document.querySelector('#research-data').textContent),sources=Object.fromEntries(d.sources.map(s=>[s.id,s])),companies=Object.fromEntries(d.companies.map(c=>[c.id,c]));
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tags=xs=>xs.map(x=>'<span class="tag">'+escapeText(x)+'</span>').join('');
const list=xs=>'<ul>'+xs.map(x=>'<li>'+escapeText(x)+'</li>').join('')+'</ul>';
const refs=ids=>ids.map(id=>{let s=sources[id];return '<a target="_blank" rel="noopener noreferrer" href="'+escapeText(s.url)+'">'+escapeText(id+': '+s.title)+'</a>'}).join(' · ');
const modules=[...new Set(d.features.flatMap(f=>f.modules))].sort();for(const m of modules){const o=document.createElement('option');o.value=m;o.textContent=m;document.querySelector('#module').append(o)}
function draw(){const view=document.querySelector('#view').value,module=document.querySelector('#module').value,q=document.querySelector('#search').value.trim().toLowerCase();const rows=d[view].filter(r=>{const ms=r.modules||[r.module];return (!module||ms.includes(module))&&(!q||JSON.stringify(r).toLowerCase().includes(q)||((r.inspiration||[]).some(id=>companies[id].name.toLowerCase().includes(q))))});document.querySelector('#count').textContent=rows.length+' '+(view==='features'?'feature designs':view==='companies'?'companies':'logical entities')+' shown';document.querySelector('#empty').hidden=rows.length!==0;
document.querySelector('#results').innerHTML=rows.map(r=>{if(view==='companies')return '<article><h2>'+escapeText(r.name)+'</h2>'+tags([r.role,'Integration: NOT_TESTED'])+'<p><strong>Public evidence:</strong> '+escapeText(r.publicFacts)+'</p><p>'+refs(r.sources)+'</p><div class="grid"><p><strong>Pattern to learn</strong><br>'+escapeText(r.featureLesson)+'</p><p><strong>Original TwelveSpec design</strong><br>'+escapeText(r.twelveSpecDesign)+'</p></div><details><summary>Boundaries and unknowns</summary><p>'+escapeText(r.boundary)+'</p><p>'+escapeText(r.unknown)+'</p></details></article>';
if(view==='entities')return '<article><h2>'+escapeText(r.name)+'</h2>'+tags([r.module,...r.features])+'<p>'+escapeText(r.lifecycle)+'</p><p><strong>Integrity:</strong> '+escapeText(r.constraint)+'</p><details><summary>'+r.fields.length+' field definitions</summary><div class="table-wrap"><table><thead><tr><th>Field</th><th>Proposed type</th><th>Meaning</th></tr></thead><tbody>'+r.fields.map(f=>'<tr><td>'+escapeText(f.name)+'</td><td>'+escapeText(f.proposedType)+'</td><td>'+escapeText(f.definition)+'</td></tr>').join('')+'</tbody></table></div></details></article>';
return '<article><h2>'+escapeText(r.id+' · '+r.title)+'</h2>'+tags([r.priority,r.scope,...r.modules])+'<p class="muted">Design only · '+escapeText(r.inspiration.map(id=>companies[id].name).join(', ')||'TwelveSpec architecture and observed gaps')+'</p><div class="grid"><p><strong>Customer flow</strong><br>'+escapeText(r.customerFlow)+'</p><p><strong>Operator flow</strong><br>'+escapeText(r.operatorFlow)+'</p></div><details><summary>Rules, edge cases and proposed tests</summary><h3>Required rules</h3>'+list(r.invariants)+'<h3>Proposed behavioral tests — NOT RUN</h3>'+list(r.proposedTests)+'</details><details><summary>Data, code and gap mapping</summary><p><strong>Records:</strong> '+escapeText(r.records.join(', '))+'</p><p><strong>Conceptual commands:</strong> '+escapeText(r.proposedCommands.join(', ')||'None; Coming Soon')+'</p><p><strong>Current code:</strong> '+escapeText(r.currentCode.join(', '))+'</p><p><strong>Gap work:</strong> '+escapeText(r.gaps.join(', '))+'</p><p>Original acceptance dependencies: '+escapeText(r.acceptance.join(', '))+'</p></details><p>'+refs(r.sources)+'</p></article>'}).join('');}
for(const id of ['view','module','search'])document.querySelector('#'+id).addEventListener(id==='search'?'input':'change',draw);draw();
</script></main></body></html>'''.replace('__DATA__',viewer_json)
write('index.html',viewer)

write('README.md',f'''# TwelveSpec feature research and original software blueprint

**Purpose:** adapt useful features and workflows from all 17 requested companies into TwelveSpec's own software. Reviewed **November 6, 2026 (America/Chicago)**. Research completion is separate from implementation acceptance.

Start with the [engineering blueprint](SOFTWARE_BLUEPRINT.md), the [filterable offline research viewer](index.html), or the [downloadable workbook](TwelveSpec_Feature_Research.xlsx).

## The main findings

1. Build one commercial and production workflow: exact product/variant → shared design → proof/prepress → agreement → approved purchase requirements → jobs/QC → packages → reconciled actual costs.
2. Adapt interaction patterns from Custom Ink, Imprint.com, 4imprint and VistaPrint, program controls from OrderMyGear, B2B identity from Shopify/BigCommerce, print workflow interfaces from PrintNow/trade printers, and approval/task patterns from Oracle NetSuite and Fusion separately. See [company analysis](COMPANY_PROFILES.md).
3. Keep company-store membership, brand rules, budgets and kit composition through the actual cart and acceptance path. A separate widget does not enforce the workflow.
4. Treat source catalogs, credentials, price evidence, artwork and transactional capabilities as independently governed records. Direct PromoStandards remains supported; PSRESTful remains prohibited.
5. Prioritize the observed precision, context-loss, proof-binding and approval-role defects before broader UI additions. Build against synthetic fixtures while account-specific integration evidence is pending.

## Deliverables

| Artifact | Contents |
|---|---|
| [Company profiles](COMPANY_PROFILES.md) | All 17 companies: public behavior, original design lessons, boundaries and unknowns |
| [Feature packs](FEATURE_PACKS.md) | 35 designs with customer/operator flows, logical records, business rules, conceptual commands/events, code paths and 104 proposed tests |
| [Engineering blueprint](SOFTWARE_BLUEPRINT.md) | Five end-to-end journeys, transaction/approval logic, architecture, data authority and ordered implementation waves |
| [Data model](DATA_MODEL.md) | {len(M['entities'])} logical entities and {M['fieldCount']} fields, ownership, lifecycle and integrity rules |
| [Traceability](TRACEABILITY.md) | All 20 modules, 205 original inventory entries and 95 acceptance scenarios retained |
| [Source register](SOURCES.md) | 39 official vendor/standards sources, review date, evidence level and access limits |
| [Activation requirements](ACTIVATION_REQUIREMENTS.md) | Work possible now; credentials/licensing/financial/deployment needs for later |
| [Workbook](TwelveSpec_Feature_Research.xlsx) | Filterable companies/features/rules/tests/fields/inventory/acceptance/source sheets and a synthetic logic lab |
| [Offline viewer](index.html) | Search and filter companies, features and entities; no account or external script needed |
| [Research packet ZIP](TwelveSpec_Feature_Research_Packet.zip) | Portable copy of the research documents, data and workbook |

Machine-readable inputs/exports: [research](research.json), [data model](data-model.json), [test designs](proposed-tests.json), [trace map](traceability.json), [features CSV](features.csv), [fields CSV](data-fields.csv), [companies CSV](companies.csv), [sources CSV](sources.csv) and [test CSV](proposed-tests.csv).

## Status, accurately separated

- **Research delivered:** 17-company comparison, 35 original feature designs, 104 proposed tests and the logical data requirements.
- **Existing implementation:** remains at the recorded repository baseline. This research does not implement new application features or change the previews.
- **Simulated functionality:** existing application fixtures remain synthetic; the workbook logic lab also uses labeled synthetic values.
- **Verified integrations:** none newly authenticated or verified. Public documentation and indexed excerpts are labeled evidence, not successful API tests.
- **Outstanding application failures:** existing [gap audit](../planning/GAP_AUDIT.md) remains open, including cost precision, program/kit context, proof binding, production review, event consistency and full acceptance.
- **Remaining activation:** [access requirements](ACTIVATION_REQUIREMENTS.md). No account creation, purchase, external messages, production connection, public source upload or deployment occurred.

## Rebuild and validate

From the repository, use Python 3 and the pinned optional research export dependency in `scripts/research-requirements.txt`, then run:

```sh
npm run research:build
npm run check:research
npm run check:research:browser
npm run check:plan
npm run check:spec
```

The exporter uses curated inputs in `scripts/curate-platform-research.py` and `scripts/curate-research-model.py`. It does not perform network calls. The validator checks coverage, source references, code paths, workbook structure/formula caches and snapshot/Coming Soon status. The optional browser check uses installed Chromium (`CHROMIUM_PATH` can select another executable) and a temporary loopback-only HTTP server; it makes no external requests. Browser-viewer verification is recorded separately in the validation report. Application A/T/E tests and the proposed feature tests are not claimed to have run as part of documentation validation.
''')

files=sorted(p for p in OUT.iterdir() if p.is_file() and p.name not in ['BUILD_MANIFEST.json','VALIDATION.md','validation-results.json','TwelveSpec_Feature_Research_Packet.zip'])
manifest=dict(schemaVersion=1,researchDate='2026-11-06',timezone='America/Chicago',
              purpose=D['purpose'],counts=dict(companies=len(C),sources=len(S),features=len(F),proposedTests=len(test_rows),entities=len(M['entities']),fields=M['fieldCount'],modules=len(module_rows),inventoryEntries=len(requirements_rows),originalScenarios=len(acceptance_rows)),
              files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
write('BUILD_MANIFEST.json',json.dumps(manifest,indent=2))
packet=OUT/'TwelveSpec_Feature_Research_Packet.zip'
with zipfile.ZipFile(packet,'w',zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(OUT.iterdir()):
        if file.is_file() and file.name not in [packet.name,'VALIDATION.md','validation-results.json']:
            archive.write(file,arcname='TwelveSpec_Feature_Research/'+file.name)
print(f'Built research reports, workbook, CSV exports, offline viewer and {packet.name}.')
