"""LOCAL DEMONSTRATION ONLY. Loopback HTTP, no authentication, not for actual secrets."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import sqlite3, json, uuid
from core import stage, margin_price, public_product
ROOT=Path(__file__).resolve().parent
DB=ROOT/'demo.db'

PROVIDERS=[
 {'id':'promostandards','name':'PromoStandards Direct','protocol':'SOAP/WSDL','mode':'mock','capabilities':['catalog','inventory','pricing_configuration','purchase_order']},
 {'id':'asi_smartlink','name':'ASI SmartLink (ESP+ catalog source)','protocol':'REST','mode':'license_required','capabilities':['catalog','media','supplier_search']},
 {'id':'custom_rest','name':'Custom supplier REST','protocol':'REST','mode':'mock','capabilities':['catalog']},
 {'id':'csv','name':'CSV file','protocol':'RFC 4180','mode':'local','capabilities':['catalog_import']},
 {'id':'xml','name':'XML file','protocol':'constrained XML','mode':'local','capabilities':['catalog_import']},
]

def connect():
    c=sqlite3.connect(DB)
    c.row_factory=sqlite3.Row
    c.execute('pragma foreign_keys=on')
    return c

def init():
    with connect() as c:
        c.executescript('''
        create table if not exists connections(id text primary key, provider_id text not null, name text not null, environment text not null check(environment='mock'), status text not null default 'simulated');
        create table if not exists batches(id text primary key, format text not null, content_hash text not null, raw_preview text not null, created_at text default current_timestamp, state text not null default 'staged');
        create table if not exists products(sku text primary key, name text not null, color text, size text, brand text, wholesale_cost text, sale_price text, origin_batch text not null, status text not null default 'draft');
        ''')

class H(BaseHTTPRequestHandler):
    def _out(self, obj, status=200):
        b=json.dumps(obj).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path=='/':
            b=(ROOT/'index.html').read_bytes()
            self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'"); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b); return
        if self.path=='/app.js':
            b=(ROOT/'app.js').read_bytes()
            self.send_response(200); self.send_header('Content-Type','application/javascript; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b); return
        if self.path=='/api/providers': return self._out(PROVIDERS)
        if self.path=='/api/connections':
            with connect() as c: return self._out([dict(r) for r in c.execute('select * from connections order by rowid desc')])
        if self.path=='/api/products':
            with connect() as c:
                rows=[public_product(dict(r)) for r in c.execute("select * from products where status='published' order by name")]
                return self._out(rows)
        if self.path=='/api/batches':
            with connect() as c: return self._out([{'id':r['id'],'format':r['format'],'state':r['state'],'data':json.loads(r['raw_preview'])} for r in c.execute('select * from batches order by created_at desc limit 10')])
        return self._out({'error':'Not found'},404)
    def do_POST(self):
        if not self.path.startswith('/api/'): return self._out({'error':'Not found'},404)
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<1 or size>2_800_000: raise ValueError('Request too large or empty')
            data=json.loads(self.rfile.read(size))
            if any(k in data for k in ('password','api_key','secret','token','credentials')): raise ValueError('Never enter real or synthetic credentials here; metadata-only demo')
            if self.path=='/api/connections':
                pid=data.get('provider_id')
                if pid not in ('promostandards','custom_rest','asi_smartlink'): raise ValueError('Unsupported demo provider')
                name=str(data.get('name','')).strip()[:120]
                if not name: raise ValueError('Connection label required')
                uid=str(uuid.uuid4())
                with connect() as c: c.execute('insert into connections(id,provider_id,name,environment,status) values(?,?,?,?,?)',(uid,pid,name,'mock','license_required' if pid=='asi_smartlink' else 'simulated'))
                return self._out({'id':uid,'status':'license_required' if pid=='asi_smartlink' else 'simulated','message':'Metadata saved; no external connection or credentials'},201)
            if self.path=='/api/imports/preview':
                fmt=data.get('format'); content=data.get('content','')
                if not isinstance(content,str): raise ValueError('Text file expected')
                result=stage(content,fmt,data.get('mapping'))
                uid=str(uuid.uuid4())
                with connect() as c: c.execute('insert into batches(id,format,content_hash,raw_preview) values(?,?,?,?)',(uid,fmt,result['source_hash'],json.dumps(result)))
                return self._out({'batch_id':uid,'data':result},201)
            if self.path.startswith('/api/imports/') and self.path.endswith('/publish'):
                uid=self.path.split('/')[3]
                with connect() as c:
                    batch=c.execute('select * from batches where id=?',(uid,)).fetchone()
                    if not batch: return self._out({'error':'Unknown batch'},404)
                    if batch['state']=='published': return self._out({'error':'Batch already published'},409)
                    result=json.loads(batch['raw_preview']); published=0; held=0
                    for row in result['rows']:
                        if not row['eligible']: held+=1; continue
                        product=row['mapped']; cost=product.get('cost',''); price=str(margin_price(cost)) if cost else ''
                        # No qualified cost -> quote-only, no instant checkout.
                        c.execute('''insert into products(sku,name,color,size,brand,wholesale_cost,sale_price,origin_batch,status)
                            values(?,?,?,?,?,?,?,?,?) on conflict(sku) do nothing''',(product['sku'],product['name'],product.get('color'),product.get('size'),product.get('brand'),cost,price,uid,'published'))
                        if c.execute('select changes()').fetchone()[0]: published+=1
                        else: held+=1
                    c.execute("update batches set state='published' where id=?",(uid,))
                return self._out({'published':published,'held':held,'note':'Local synthetic catalog only; prices shown are illustrative, not checkout-ready'})
            return self._out({'error':'Not found'},404)
        except (ValueError, KeyError, json.JSONDecodeError) as e: return self._out({'error':str(e)},400)
        except Exception: return self._out({'error':'Internal demo error'},500)

if __name__=='__main__':
    init()
    print('LOCAL DEMO ONLY — http://127.0.0.1:8765 (DO NOT ENTER REAL API SECRETS)')
    ThreadingHTTPServer(('127.0.0.1',8765),H).serve_forever()
