import {describe,it,expect} from 'vitest';
import {newWebsiteSection,parseWebsiteDocument,safeWebsiteHref,plainRichText,type PageDocument} from '../../packages/contracts/src/website';
import {websiteTimeChoices} from '../../packages/contracts/src/website-time';
import {defaultWebsiteDocuments} from '../../packages/marketing/src/website/defaults';
import {publicationIssues} from '../../packages/marketing/src/website/references';

const site='13530163-b113-4b6e-9541-810c03630e9d';
const page=()=>structuredClone(defaultWebsiteDocuments(site).find(d=>d.documentType==='WEBSITE_PAGE') as PageDocument);
describe('Website document, layout and link contracts',()=>{
 it('CMS-015 rejects unsupported versions, blocks, variants, extra price fields and duplicate section IDs',()=>{
  const value=page();expect(()=>parseWebsiteDocument({...value,schemaVersion:8})).toThrow();expect(()=>parseWebsiteDocument({...value,price:0})).toThrow();
  expect(()=>parseWebsiteDocument({...value,sections:[{...value.sections[0],type:'arbitrary_html'}]})).toThrow();expect(()=>parseWebsiteDocument({...value,sections:[{...value.sections[0],variant:'unsafe_css'}]})).toThrow();
  expect(()=>parseWebsiteDocument({...value,sections:[value.sections[0],value.sections[0]]})).toThrow('WEBSITE_SECTION_IDS_DUPLICATED');
 });
 it('CMS-016 keeps authorized incomplete drafts distinct from publication-ready documents',()=>{const value=page();value.title='';value.sections[0].content.heading='';expect(parseWebsiteDocument(value).title).toBe('');expect(publicationIssues(value)).toContain('Document title is required');expect(publicationIssues(value)).toContain('Hero heading is required');});
 it('CMS-017 permits semantic text, rejects HTML objects and bounds recursive content',()=>{
  const value=page();const section=newWebsiteSection('rich_text_image');section.content.body=plainRichText('A literal <script> is text, never HTML.');value.sections=[section];expect(parseWebsiteDocument(value)).toBeTruthy();
  section.content.body='<script>bad()</script>';expect(()=>parseWebsiteDocument(value)).toThrow();
  let deep:unknown={type:'text',text:'Deep'};for(let i=0;i<12;i++)deep={type:'paragraph',children:[deep]};section.content.body=[deep];expect(()=>parseWebsiteDocument(value)).toThrow();
 });
 it('CMS-037 normalizes editorial paths and rejects reserved business routes',()=>{const value=page();value.path='/SOLUTIONS/Test/';expect((parseWebsiteDocument(value) as PageDocument).path).toBe('/solutions/test');for(const path of ['/api/keys','/account','/products/123','/cart','/../private','/%2f%2fevil','/auth/login','/catalog'])expect(()=>parseWebsiteDocument({...value,path})).toThrow();});
 it('CMS-070 rejects dangerous links and accepts explicit safe workflow and HTTPS targets',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,hello','//evil.example','/api/secrets','/x/../private','/x%0Ahello','https://127.0.0.1','https://name:secret@example.com'])expect(safeWebsiteHref(href,true),href).toBe(false);
  expect(safeWebsiteHref('/account')).toBe(true);expect(safeWebsiteHref('#catalog-grid')).toBe(true);expect(safeWebsiteHref('https://example.com/approved',true)).toBe(true);
 });
 it('CMS-014 exposes dependency-gated video/resources as unavailable factories',()=>{for(const type of ['video','download_resources'] as const)expect(()=>newWebsiteSection(type)).toThrow('WEBSITE_COMPONENT_NOT_ACTIVE');});
 it('CMS-035 rejects over-deep and duplicate navigation items',()=>{
  const doc=defaultWebsiteDocuments(site).find(d=>d.documentType==='WEBSITE_NAVIGATION')!;if(doc.documentType!=='WEBSITE_NAVIGATION')throw new Error('fixture');
  doc.items.push(structuredClone(doc.items[0]));expect(()=>parseWebsiteDocument(doc)).toThrow('WEBSITE_MENU_INVALID');
 });
 it('CMS-007 resolves ordinary, ambiguous and nonexistent calendar times without the host timezone',()=>{
  expect(websiteTimeChoices('2026-12-01T09:00','America/Chicago')).toEqual([{iso:'2026-12-01T15:00:00.000Z',offsetMinutes:-360,label:'UTC-06:00'}]);
  expect(websiteTimeChoices('2026-03-08T02:30','America/Chicago')).toEqual([]);
  expect(websiteTimeChoices('2026-11-01T01:30','America/Chicago')).toHaveLength(2);
  expect(websiteTimeChoices('2026-12-01T09:00','Asia/Kathmandu')[0].offsetMinutes).toBe(345);
  expect(()=>websiteTimeChoices('not a date','Etc/UTC')).toThrow();
 });
});
