#!/usr/bin/env python3
"""Prepare a private catalog source bundle from already-retrieved supplier evidence.

No network calls, credentials, guessed prices/options or automatic publication.
"""
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
import argparse, collections, datetime, hashlib, json, re, xml.etree.ElementTree as ET, zipfile

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.suppressed=0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.suppressed+=1
        if tag in ('li','p','br','div'): self.parts.append(' ')
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.suppressed=max(0,self.suppressed-1)
        if tag in ('li','p','div'): self.parts.append(' ')
    def handle_data(self, value):
        if not self.suppressed: self.parts.append(value)

def plain(value):
    parser=PlainText(); parser.feed(unescape(str(value or '')))
    return re.sub(r'\s+',' ',' '.join(parser.parts)).strip()[:10000]

def workbook(path):
    ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as z:
        def xml(name):
            if z.getinfo(name).file_size>40*1024*1024: raise ValueError('Workbook XML exceeds bounded input limit')
            return ET.fromstring(z.read(name))
        strings=[''.join(si.itertext()) for si in xml('xl/sharedStrings.xml').findall('s:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
        header=None
        for row in xml('xl/worksheets/sheet1.xml').findall('.//s:row',ns):
            cells={}
            for c in row.findall('s:c',ns):
                column=re.sub(r'\d','',c.attrib['r']); v=c.find('s:v',ns)
                value=v.text if v is not None else ''.join(c.itertext())
                cells[column]=strings[int(value)] if c.attrib.get('t')=='s' and value else value or ''
            if header is None: header=cells
            else: yield {header.get(k,k):v for k,v in cells.items()}

def observed(path):
    return datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat()

def prepare(evidence):
    sources=[]; inputs=[]
    styles=evidence/'open-downloads/Styles.xlsx'
    if styles.exists():
        inputs.append(styles)
        apparel={'T-Shirts','Polos/Knits','Polos','Wovens','Sweatshirts','Headwear','Jackets','Pants','Shorts','Outerwear','Fleece','Activewear'}
        for r in workbook(styles):
            image=r.get('styleImage','')
            sources.append({'supplier':'S&S Activewear','externalId':r['styleID'],'brand':r.get('brandName',''),'model':r.get('styleName',''),
                'title':' '.join(filter(None,[r.get('brandName'),r.get('styleName'),plain(r.get('title'))]))[:500],
                'description':plain(r.get('description')),'category':'APPAREL' if r.get('baseCategory') in apparel else None,
                'sourceCategory':r.get('baseCategory',''),'sourceUrl':'https://www.ssactivewear.com/marketing/edi',
                'imageUrl':'https://www.ssactivewear.com/'+image if re.fullmatch(r'Images/Style/[A-Za-z0-9_-]+\.(?:jpg|png|webp)',image) else None,
                'environment':'PUBLIC_CATALOG','observedAt':observed(styles)})
    catalog=evidence/'staging-check/sinalite-public-sandbox-catalog.json'
    if catalog.exists():
        inputs.append(catalog)
        for r in json.loads(catalog.read_text()):
            sources.append({'supplier':'SinaLite','externalId':str(r['id']),'model':r.get('sku',''),'title':plain(r['name']),
                'description':'','sourceCategory':r.get('category',''),'sourceEnabled':bool(r.get('enabled')),
                'category':None,'sourceUrl':'https://api.sinaliteuppy.com/product','environment':'STAGING','observedAt':observed(catalog)})
    product=evidence/'staging-check/getProduct-response.redacted.xml'
    if product.exists():
        inputs.append(product)
        root=ET.parse(product)
        node=next((n for n in root.iter() if n.tag.split('}')[-1]=='Product' and any(c.tag.split('}')[-1]=='productName' for c in n)),None)
        if node is not None:
            def field(name):
                return next((c.text or '' for c in node if c.tag.split('}')[-1]==name),'')
            sources.append({'supplier':'PCNA','externalId':field('productId'),'model':field('productId'),'title':plain(field('productName')),
                'description':plain(field('description')),'brand':plain(field('productBrand')),'category':'PROMO',
                'sourceUrl':'https://psproductdata200-stg.pcna.online/psProductData.svc','imageUrl':'https://assets.pcna.com/Images/0600-10BL_B_FR-2.jpg' if field('productId')=='0600-10' else None,
                'environment':'STAGING','observedAt':observed(product)})
    if not sources: raise ValueError('No previously retrieved supplier evidence found')
    keys=[(s['supplier'],s['externalId']) for s in sources]
    if len(set(keys))!=len(keys): raise ValueError('Duplicate supplier source identity; review before staging')
    return {'classification':'PRIVATE_CATALOG_SOURCE_CANDIDATES','sources':sources,'counts':dict(collections.Counter(s['supplier'] for s in sources)),
        'inputHashes':{str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},
        'constraints':['No prices, MOQ, variant/color/size or production geometry inferred.','Staging records are not current supplier inventory or prices.','Source media references do not establish publication rights.','This bundle must remain outside public assets and source control.']}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--evidence',type=Path,default=Path('.local/supplier-access-review'));parser.add_argument('--output',type=Path,default=Path('.local/owned-catalog/source-candidates.json'));args=parser.parse_args()
    result=prepare(args.evidence);args.output.parent.mkdir(parents=True,exist_ok=True);args.output.parent.chmod(0o700)
    args.output.write_text(json.dumps(result,ensure_ascii=False));args.output.chmod(0o600)
    print(json.dumps({'counts':result['counts'],'total':len(result['sources']),'output':str(args.output),'published':0}))
