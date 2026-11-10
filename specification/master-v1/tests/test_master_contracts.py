import json, unittest
from pathlib import Path
from contracts.pricing import price_for_target_margin, gross_margin
ROOT=Path(__file__).resolve().parents[1]
class TestMasterContracts(unittest.TestCase):
 def test_every_module_has_documentation(self):
  for m in json.loads((ROOT/'contracts/module_registry.json').read_text()):
   self.assertTrue((ROOT/'modules'/(m['code']+'.md')).exists(),m['code'])
 def test_future_is_marked_coming_soon(self):
  m=json.loads((ROOT/'contracts/module_registry.json').read_text()); self.assertEqual([x['status'] for x in m if x['code']=='future'],['COMING_SOON'])
 def test_no_broker_provider(self):
  obj=json.loads((ROOT/'contracts/provider_capabilities.json').read_text());self.assertEqual(obj['prohibited_dependencies'],['PSRESTful']);self.assertNotIn('PSRESTful',[x['type'] for x in obj['provider_types']])
 def test_direct_promostandards_present(self):
  types=[x['type'] for x in json.loads((ROOT/'contracts/provider_capabilities.json').read_text())['provider_types']];self.assertIn('PROMOSTANDARDS_SOAP',types)
 def test_file_imports(self):
  types=[x['type'] for x in json.loads((ROOT/'contracts/provider_capabilities.json').read_text())['provider_types']];self.assertIn('XML',types);self.assertIn('CSV',types)
 def test_margin_math(self):
  self.assertEqual(str(price_for_target_margin('60','0.40')),'100.00');self.assertEqual(str(gross_margin('60','100')),'0.4')
 def test_invalid_margins(self):
  for m in ['1','-0.1']:
   with self.assertRaises(ValueError):price_for_target_margin('10',m)
 def test_every_domain_covered(self):
  s={x['code'] for x in json.loads((ROOT/'contracts/module_registry.json').read_text())};self.assertTrue({'commerce','supplier','creative','orders','procurement','fulfillment','finance','marketing','workflow','stores','byob','crm','catalog','today','analytics','future'}.issubset(s))
 def test_quote_states(self):
  s=json.loads((ROOT/'contracts/states.json').read_text());self.assertIn('APPROVAL_REQUIRED',s['quote']);self.assertIn('UNKNOWN_OUTCOME',s['supplier_po'])
 def test_no_live_secret_in_examples(self):
  obj=json.loads((ROOT/'contracts/provider_capabilities.json').read_text());self.assertFalse(any('password' in str(x).lower() for x in obj['provider_types']))
if __name__=='__main__':unittest.main()
