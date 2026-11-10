import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'prototype'))
from core import stage,parse_rows,margin_price,public_product
class CoreTests(unittest.TestCase):
 def test_csv_quotes_and_duplicate(self):
  d=stage('SKU,Name,Cost\na,"Hat, Navy",12.5\na,Hat,12.5','csv')
  self.assertEqual(d['accepted'],1);self.assertEqual(d['rejected'],1)
  self.assertEqual(d['rows'][0]['mapped']['name'],'Hat, Navy')
 def test_xml_basic(self):
  d=stage('<products><product><sku>x</sku><name>Mug</name></product></products>','xml')
  self.assertEqual(d['accepted'],1)
 def test_xxe_rejection(self):
  with self.assertRaisesRegex(ValueError,'DTD/entities'):
   parse_rows('<!DOCTYPE products [<!ENTITY x SYSTEM "file:///etc/passwd">]><products/>','xml')
 def test_invalid_cost(self):
  d=stage('SKU,Name,Cost\nx,Hat,-1\ny,Mug,NaN','csv')
  self.assertEqual(d['rejected'],2)
 def test_margin_not_markup(self):
  self.assertEqual(str(margin_price('60')),'100.00')
 def test_missing_name(self):
  self.assertEqual(stage('SKU,Name\na,','csv')['rejected'],1)
 def test_public_filter(self):
  x=public_product({'sku':'a','name':'Hat','wholesale_cost':'3.00','supplier_name':'SECRET','sale_price':'12.00'})
  self.assertNotIn('supplier_name',x);self.assertNotIn('wholesale_cost',x)
 def test_xml_depth(self):
  xml='<products><product>'+('<x>'*10)+'<sku>a</sku>'+('</x>'*10)+'</product></products>'
  with self.assertRaisesRegex(ValueError,'depth'):parse_rows(xml,'xml')
 def test_bad_csv_width(self):
  with self.assertRaises(ValueError):parse_rows('SKU,Name\na','csv')
 def test_file_limit(self):
  with self.assertRaisesRegex(ValueError,'large'):parse_rows('a'*(2_000_001),'csv')
if __name__=='__main__': unittest.main()
