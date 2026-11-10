"""Local-only educational connector lab: no live credentials and no external calls."""
from __future__ import annotations
import csv, io, re, hashlib, json
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

MAX_BYTES = 2_000_000
MAX_ROWS = 5000
MAX_FIELD = 4000
MAX_DEPTH = 8
COLUMNS = {'sku': ('sku','itemnumber','item_no','productid','id'), 'name': ('name','productname','title','description'), 'cost': ('cost','wholesale','unitcost','suppliercost'), 'color': ('color','colour'), 'size': ('size',), 'brand': ('brand','manufacturer')}


def normalize_key(key: str) -> str:
    return re.sub(r'[^a-z0-9]', '', (key or '').lower())


def guess_mapping(fields):
    lookup = {normalize_key(f): f for f in fields}
    return {dest: next((lookup[a] for a in aliases if a in lookup), None) for dest, aliases in COLUMNS.items()}


def _check_size(text):
    if len(text.encode('utf-8')) > MAX_BYTES:
        raise ValueError('File too large (2 MB demo limit)')
    if '\x00' in text:
        raise ValueError('NUL byte not permitted')


def parse_rows(text: str, format: str):
    _check_size(text)
    if format == 'csv':
        reader = csv.DictReader(io.StringIO(text.lstrip('\ufeff'), newline=''))
        if not reader.fieldnames or len(reader.fieldnames) > 100:
            raise ValueError('CSV must contain 1–100 headers')
        items = []
        for row in reader:
            if len(items) >= MAX_ROWS: raise ValueError('Row limit exceeded')
            if None in row or any(v is None for v in row.values()):
                raise ValueError('CSV row has inconsistent field count')
            items.append(row)
        return items
    if format == 'xml':
        # ElementTree does not fetch external resources; reject all DTD/entities anyway.
        if re.search(r'<!\s*(DOCTYPE|ENTITY)\b', text, re.I):
            raise ValueError('DTD/entities are forbidden')
        root = ET.fromstring(text)
        def inspect(node, depth=0):
            if depth > MAX_DEPTH: raise ValueError('XML depth limit exceeded')
            if len(node.attrib) > 32: raise ValueError('Too many XML attributes')
            for child in node: inspect(child, depth+1)
        inspect(root)
        nodes = [c for c in root if c.tag.lower().split('}')[-1] in ('product','item','row')]
        if not nodes: raise ValueError('Expected <product>, <item>, or <row> elements')
        if len(nodes) > MAX_ROWS: raise ValueError('Row limit exceeded')
        rows = []
        for node in nodes:
            row = {ch.tag.split('}')[-1]: (ch.text or '').strip() for ch in node}
            if len(row) > 100: raise ValueError('Too many fields')
            rows.append(row)
        return rows
    raise ValueError('Allowed formats: csv, xml')


def stage(text: str, format: str, mapping: dict | None = None):
    rows = parse_rows(text,format)
    fields = list(rows[0].keys()) if rows else []
    mapping = mapping or guess_mapping(fields)
    staged=[]; seen=set()
    for i, raw in enumerate(rows,1):
        warnings=[]; errors=[]
        if any(len(str(v)) > MAX_FIELD for v in raw.values()):
            errors.append('Field exceeds 4000 characters')
        mapped={key: (raw.get(source) or '').strip() if source else '' for key,source in mapping.items()}
        if not mapped.get('sku'): errors.append('SKU missing')
        if not mapped.get('name'): errors.append('Name missing')
        if mapped.get('sku') in seen: errors.append('Duplicate SKU in batch')
        if mapped.get('sku'): seen.add(mapped['sku'])
        if mapped.get('cost'):
            try:
                amount=Decimal(mapped['cost'].replace('$','').replace(',',''))
                if not amount.is_finite() or amount < 0: errors.append('Invalid cost')
                else: mapped['cost']=str(amount.quantize(Decimal('0.0001')))
            except InvalidOperation: errors.append('Invalid cost')
        else: warnings.append('No validated cost; quote-only')
        staged.append({'row':i,'source':raw,'mapped':mapped,'errors':errors,'warnings':warnings,'eligible':not errors})
    return {'format':format, 'source_hash':hashlib.sha256(text.encode()).hexdigest(), 'mapping':mapping, 'rows':staged, 'accepted':sum(r['eligible'] for r in staged), 'rejected':sum(not r['eligible'] for r in staged)}


def margin_price(cost: str, margin='0.40'):
    c,m=Decimal(cost),Decimal(margin)
    if not c.is_finite() or c < 0 or not Decimal('0') <= m < Decimal('1'): raise ValueError('Invalid pricing input')
    return (c/(1-m)).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)


def public_product(row: dict):
    """Never emit raw source, wholesale costs, supplier codes or internal notes."""
    return {k: row[k] for k in ('sku','name','color','size','brand','sale_price') if k in row}
