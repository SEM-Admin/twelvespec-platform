import {z} from 'zod';

/** Shared authoring contracts. Never import database/auth code into this module. */
export const WEBSITE_SCHEMA_VERSION=1;
export const SITE_CAPABILITIES=['EDIT','PUBLISH','MERCHANDISE','MEDIA'] as const;
export type WebsiteCapability=typeof SITE_CAPABILITIES[number];
export const PALETTES={
 'neutral-vermilion':{canvas:'#FFFFFF',subtle:'#F5F6F7',ink:'#17191B',muted:'#545B64',accent:'#FF3F1A',accentInk:'#17191B'},
 'neutral-blue':{canvas:'#FFFFFF',subtle:'#F5F6F7',ink:'#17191B',muted:'#545B64',accent:'#D7E8FF',accentInk:'#17191B'},
 'neutral-slate':{canvas:'#FFFFFF',subtle:'#F5F6F7',ink:'#17191B',muted:'#545B64',accent:'#DDE1E6',accentInk:'#17191B'},
} as const;
export type PaletteId=keyof typeof PALETTES;
export type WebsiteLink={label:string;kind:'WORKFLOW'|'PAGE'|'COLLECTION'|'STORE'|'EXTERNAL_HTTPS';href?:string;targetId?:string};
export function safeWebsiteHref(value:string,external=false):boolean{
 if(!value||value.length>2048||/[\u0000-\u0020\\<>"']/.test(value))return false;
 if(value.startsWith('#'))return /^#[A-Za-z][A-Za-z0-9_-]*$/.test(value);
 if(value.startsWith('/')&&!value.startsWith('//')){
  try{const decoded=decodeURIComponent(value);return !decoded.includes('..')&&!/[\\\u0000-\u0020<>"']/.test(decoded)&&!decoded.startsWith('//')&&!/^\/(api|_next)(\/|$)/i.test(decoded);}catch{return false;}
 }
 if(!external)return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&!/^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|10\..*|192\.168\..*|169\.254\..*|\[.*\])$/i.test(u.hostname);}catch{return false;}
}
export const websiteLinkSchema=z.object({label:z.string().max(80),kind:z.enum(['WORKFLOW','PAGE','COLLECTION','STORE','EXTERNAL_HTTPS']),href:z.string().max(2048).optional(),targetId:z.uuid().optional()}).strict().superRefine((v,ctx)=>{
 if(v.kind==='WORKFLOW'||v.kind==='EXTERNAL_HTTPS'){
  if(!v.href||!safeWebsiteHref(v.href,v.kind==='EXTERNAL_HTTPS')||(v.kind==='EXTERNAL_HTTPS'&&!v.href.startsWith('https:'))||v.targetId)ctx.addIssue({code:'custom',message:'Choose a safe link target.'});
 }else if(!v.targetId||v.href)ctx.addIssue({code:'custom',message:'Choose an existing scoped record.'});
});
export type RichNode={type:'paragraph'|'heading'|'list'|'list_item'|'text'|'link';text?:string;level?:number;marks?:('strong'|'emphasis')[];link?:WebsiteLink;children?:RichNode[]};
const richNode:z.ZodType<RichNode>=z.lazy(()=>z.object({type:z.enum(['paragraph','heading','list','list_item','text','link']),text:z.string().max(4000).optional(),level:z.number().int().min(2).max(4).optional(),marks:z.array(z.enum(['strong','emphasis'])).max(2).optional(),link:websiteLinkSchema.optional(),children:z.array(richNode).max(30).optional()}).strict());
export const richTextSchema=z.array(richNode).max(40).superRefine((nodes,ctx)=>{
 let count=0;
 const visit=(node:RichNode,depth:number)=>{
  count++;if(depth>8||count>300)ctx.addIssue({code:'custom',message:'Rich text is too deeply nested or too long.'});
  if(node.type==='text'&&(!node.text||node.children||node.link||node.level))ctx.addIssue({code:'custom',message:'Invalid text node.'});
  if(node.type==='link'&&(!node.link||node.text||node.level))ctx.addIssue({code:'custom',message:'Invalid link node.'});
  if(node.type==='heading'&&!node.level)ctx.addIssue({code:'custom',message:'Heading level required.'});
  if(depth<10)node.children?.forEach(child=>visit(child,depth+1));
 };
 nodes.forEach(node=>visit(node,0));
});
export const plainRichText=(value:string):RichNode[]=>value?[{type:'paragraph',children:[{type:'text',text:value}]}]:[];
export const richTextPlain=(nodes:RichNode[]):string=>nodes.map(n=>n.text??richTextPlain(n.children??[])).join('\n');
const short=z.string().max(120),body=z.string().max(2000),ids=z.array(z.uuid()).max(24),keys=z.array(z.string().max(100)).max(24);
const media={imageAssetId:z.uuid().optional(),builtInImage:z.string().regex(/^\/products\/TS-\d{4}-[0-2]\.svg$/).optional(),imageAlt:z.string().max(300).default(''),focalX:z.number().min(0).max(1).default(.5),focalY:z.number().min(0).max(1).default(.5)};
type FieldKind='text'|'textarea'|'image'|'link'|'collection'|'collections'|'products'|'taxonomy'|'richtext'|'faq'|'gallery'|'testimonials'|'pages'|'stores'|'brandKit'|'store'|'boolean'|'number'|'select';
export type WebsiteField={key:string;label:string;kind:FieldKind;options?:string[];help?:string};
export type ComponentDefinition={type:string;label:string;category:string;variants:string[];enabled:boolean;reason?:string;organizationOnly?:boolean;fields:WebsiteField[]};
const field=(key:string,label:string,kind:FieldKind='text',options?:string[]):WebsiteField=>({key,label,kind,...(options?{options}:{})});
export const WEBSITE_COMPONENTS:ComponentDefinition[]=[
 {type:'hero',label:'Hero',category:'Introduction',variants:['split','centered','image-led'],enabled:true,fields:[field('eyebrow','Eyebrow'),field('heading','Headline'),field('body','Supporting copy','textarea'),field('imageAssetId','Approved image','image'),field('imageAlt','Image description'),field('primaryLink','Primary action','link'),field('secondaryLink','Secondary action','link')]},
 {type:'promotion_banner',label:'Promotional banner',category:'Campaign',variants:['inline','compact','full-width'],enabled:true,fields:[field('message','Message','textarea'),field('link','Action','link'),field('tone','Tone','select',['neutral','accent'])]},
 {type:'product_carousel',label:'Product carousel',category:'Catalog',variants:['standard','compact'],enabled:true,fields:[field('heading','Heading'),field('collectionId','Canonical collection','collection'),field('limit','Products to show','number'),field('showSwatches','Show compatible colors','boolean')]},
 {type:'featured_collections',label:'Featured collections',category:'Catalog',variants:['cards','editorial'],enabled:true,fields:[field('heading','Heading'),field('collectionIds','Collections in order','collections')]},
 {type:'category_grid',label:'Category grid',category:'Catalog',variants:['tiles','compact'],enabled:true,fields:[field('heading','Heading'),field('categoryIds','Canonical categories','taxonomy')]},
 {type:'brand_showcase',label:'Brand showcase',category:'Catalog',variants:['logos','text'],enabled:true,fields:[field('heading','Heading'),field('brandIds','Approved catalog brands','taxonomy')]},
 {type:'image_gallery',label:'Image gallery',category:'Media',variants:['grid','editorial'],enabled:true,fields:[field('heading','Heading'),field('items','Approved images and descriptions','gallery'),field('captions','Show captions','boolean')]},
 {type:'testimonials',label:'Testimonials',category:'Editorial',variants:['cards','quote'],enabled:true,fields:[field('heading','Heading'),field('entries','Approved statements and consent evidence','testimonials')]},
 {type:'video',label:'Video',category:'Media',variants:['inline','wide'],enabled:false,reason:'Video processing, captions and file safety verification are not activated.',fields:[]},
 {type:'solution_cards',label:'Solution cards',category:'Editorial',variants:['cards','feature-grid'],enabled:true,fields:[field('heading','Heading'),field('solutionPageIds','Published solution pages','pages')]},
 {type:'cta',label:'Call to action',category:'Editorial',variants:['split','centered','compact'],enabled:true,fields:[field('heading','Heading'),field('body','Supporting copy','textarea'),field('primaryLink','Primary action','link'),field('secondaryLink','Secondary action','link'),field('tone','Tone','select',['neutral','accent'])]},
 {type:'faq',label:'FAQ',category:'Editorial',variants:['accordion','expanded'],enabled:true,fields:[field('heading','Heading'),field('entries','Questions and answers','faq')]},
 {type:'rich_text_image',label:'Rich text and image',category:'Editorial',variants:['image-left','image-right','text-only'],enabled:true,fields:[field('heading','Heading'),field('body','Text','richtext'),field('imageAssetId','Approved image','image'),field('imageAlt','Image description')]},
 {type:'project_inquiry',label:'Project inquiry',category:'Commerce',variants:['project','compact'],enabled:true,fields:[field('heading','Heading'),field('intro','Introduction','textarea'),field('ctaLabel','Quote action label')]},
 {type:'download_resources',label:'Downloadable resources',category:'Media',variants:['cards','list'],enabled:false,reason:'File scanning, accessible document export and resource rights checks are not activated.',fields:[]},
 {type:'store_grid',label:'Organization stores',category:'Programs',variants:['cards','compact'],enabled:true,fields:[field('heading','Heading'),field('storeIds','Permitted stores in order','stores')]},
 {type:'organization_hero',label:'Organization hero',category:'Programs',variants:['split','centered'],enabled:true,organizationOnly:true,fields:[field('heading','Heading'),field('body','Supporting copy','textarea'),field('imageAssetId','Approved banner','image'),field('imageAlt','Image description'),field('approvedBrandKitId','Authorized brand kit','brandKit'),field('link','Action','link')]},
 {type:'campaign_window_notice',label:'Program window notice',category:'Programs',variants:['inline','compact'],enabled:true,organizationOnly:true,fields:[field('storeId','Existing program','store'),field('beforeText','Before ordering opens'),field('openText','While ordering is open'),field('closedText','After ordering closes')]},
];
export const WEBSITE_GLOBAL_COMPONENTS=[{type:'site_header',label:'Shared header / navigation'},{type:'site_footer',label:'Shared footer'}] as const;
const schemas={
 hero:z.object({heading:short,eyebrow:short.default(''),body,...media,primaryLink:websiteLinkSchema,secondaryLink:websiteLinkSchema.optional()}).strict(),
 promotion_banner:z.object({message:body,link:websiteLinkSchema.optional(),tone:z.enum(['neutral','accent']).default('neutral'),campaignId:z.uuid().optional()}).strict(),
 product_carousel:z.object({heading:short,collectionId:z.uuid().optional(),limit:z.number().int().min(1).max(12).default(8),showSwatches:z.boolean().default(true)}).strict(),
 featured_collections:z.object({heading:short,collectionIds:ids}).strict(),
 category_grid:z.object({heading:short,categoryIds:keys}).strict(),
 brand_showcase:z.object({heading:short,brandIds:keys}).strict(),
 image_gallery:z.object({heading:short,items:z.array(z.object({assetId:z.uuid(),alt:z.string().max(300),caption:z.string().max(360).default('')}).strict()).max(12),captions:z.boolean().default(true)}).strict(),
 testimonials:z.object({heading:short,entries:z.array(z.object({quote:z.string().max(1200),publicAttribution:short,consentEvidenceId:z.uuid()}).strict()).max(8)}).strict(),
 video:z.object({title:short,videoAssetId:z.uuid(),posterAssetId:z.uuid(),transcript:z.string().max(40000),captionsAssetId:z.uuid()}).strict(),
 solution_cards:z.object({heading:short,solutionPageIds:ids}).strict(),
 cta:z.object({heading:short,body:body.default(''),primaryLink:websiteLinkSchema,secondaryLink:websiteLinkSchema.optional(),tone:z.enum(['neutral','accent']).default('neutral')}).strict(),
 faq:z.object({heading:short,entries:z.array(z.object({question:z.string().max(200),answer:richTextSchema}).strict()).max(20)}).strict(),
 rich_text_image:z.object({heading:short.default(''),body:richTextSchema,...media}).strict(),
 project_inquiry:z.object({heading:short,intro:body.default(''),formPreset:z.literal('AUTHENTICATED_RFQ'),ctaLabel:z.string().max(40)}).strict(),
 download_resources:z.object({heading:short,resources:z.array(z.object({title:short,assetId:z.uuid()}).strict()).max(12)}).strict(),
 store_grid:z.object({heading:short,storeIds:ids}).strict(),
 organization_hero:z.object({heading:short,body,...media,approvedBrandKitId:z.uuid().optional(),link:websiteLinkSchema.optional()}).strict(),
 campaign_window_notice:z.object({storeId:z.uuid().optional(),beforeText:short,openText:short,closedText:short}).strict(),
};
export type SectionType=keyof typeof schemas;
export type WebsiteSection={id:string;type:SectionType;visible:boolean;variant:string;content:Record<string,unknown>};
const sectionSchema=z.object({id:z.uuid(),type:z.enum(Object.keys(schemas) as [SectionType,...SectionType[]]),visible:z.boolean(),variant:z.string().max(30),content:z.record(z.string(),z.unknown())}).strict().transform((value,ctx):WebsiteSection=>{
 const definition=WEBSITE_COMPONENTS.find(c=>c.type===value.type)!;
 if(!definition.variants.includes(value.variant)){ctx.addIssue({code:'custom',message:'Unsupported layout.'});return z.NEVER;}
 const parsed=schemas[value.type].safeParse(value.content);
 if(!parsed.success){for(const issue of parsed.error.issues)ctx.addIssue({code:'custom',path:['content',...issue.path],message:issue.message});return z.NEVER;}
 return {...value,content:parsed.data};
});
export type MenuItem={id:string;label:string;link:WebsiteLink;children:MenuItem[];featuredAssetId?:string};
const menuItem:z.ZodType<MenuItem>=z.lazy(()=>z.object({id:z.uuid(),label:z.string().max(80),link:websiteLinkSchema,children:z.array(menuItem).max(15),featuredAssetId:z.uuid().optional()}).strict());
const common={schemaVersion:z.literal(WEBSITE_SCHEMA_VERSION),siteId:z.uuid(),title:z.string().max(160)};
export const websiteDocumentSchema=z.discriminatedUnion('documentType',[
 z.object({...common,documentType:z.literal('WEBSITE_PAGE'),path:z.string().max(240),seo:z.object({title:z.string().max(70),description:z.string().max(180),noIndex:z.boolean()}).strict(),campaignId:z.uuid().optional(),sections:z.array(sectionSchema).max(40)}).strict(),
 z.object({...common,documentType:z.literal('WEBSITE_NAVIGATION'),logoVariantId:z.literal('CURRENT_WORDMARK'),searchEnabled:z.boolean(),items:z.array(menuItem).max(12)}).strict(),
 z.object({...common,documentType:z.literal('WEBSITE_FOOTER'),groups:z.array(z.object({id:z.uuid(),heading:short,links:z.array(websiteLinkSchema).max(12)}).strict()).max(6),supportCopy:z.string().max(240),legalLinks:z.array(websiteLinkSchema).max(10),socialLinks:z.array(websiteLinkSchema).max(8)}).strict(),
 z.object({...common,documentType:z.literal('WEBSITE_THEME'),paletteId:z.enum(['neutral-vermilion','neutral-blue','neutral-slate']),fontPresetId:z.enum(['existing-ui-sans','system-sans']),buttonStyleId:z.enum(['charcoal-primary','accent-charcoal-label']),spacingPresetId:z.enum(['compact','standard','roomy']),logoVariantId:z.literal('CURRENT_WORDMARK'),approvedBrandKitId:z.uuid().optional()}).strict(),
]);
export type WebsiteDocument=z.infer<typeof websiteDocumentSchema>;
export type PageDocument=Extract<WebsiteDocument,{documentType:'WEBSITE_PAGE'}>;
export type ThemeDocument=Extract<WebsiteDocument,{documentType:'WEBSITE_THEME'}>;
export type NavigationDocument=Extract<WebsiteDocument,{documentType:'WEBSITE_NAVIGATION'}>;
export type FooterDocument=Extract<WebsiteDocument,{documentType:'WEBSITE_FOOTER'}>;
export function normalizeWebsitePath(value:string){
 let path:string;try{path=decodeURIComponent(value).toLowerCase().replace(/\/+$/,'')||'/';}catch{throw new Error('WEBSITE_PATH_INVALID');}
 if(!/^\/[a-z0-9/_-]*$/.test(path)||path.includes('//')||path.length>240)throw new Error('WEBSITE_PATH_INVALID');
 if(/^\/(api|auth|_next|products|create|cart|account|bundles|stores|coming-soon|catalog|collections)(\/|$)/.test(path))throw new Error('WEBSITE_PATH_RESERVED');
 return path;
}
export function parseWebsiteDocument(value:unknown):WebsiteDocument{
 if(JSON.stringify(value).length>250000)throw new Error('WEBSITE_DOCUMENT_TOO_LARGE');
 const doc=websiteDocumentSchema.parse(value);
 if(doc.documentType==='WEBSITE_PAGE'){
  doc.path=normalizeWebsitePath(doc.path);
  if(new Set(doc.sections.map(s=>s.id)).size!==doc.sections.length)throw new Error('WEBSITE_SECTION_IDS_DUPLICATED');
 }
 if(doc.documentType==='WEBSITE_NAVIGATION'){
  const ids=new Set<string>();let count=0;
  const visit=(items:MenuItem[],depth:number)=>{if(depth>3)throw new Error('WEBSITE_MENU_DEPTH');for(const item of items){count++;if(ids.has(item.id)||count>100)throw new Error('WEBSITE_MENU_INVALID');ids.add(item.id);visit(item.children,depth+1);}};
  visit(doc.items,1);
 }
 return doc;
}
const defaultLink:WebsiteLink={label:'Start a project',kind:'WORKFLOW',href:'/account'};
export function newWebsiteSection(type:SectionType):WebsiteSection{
 const definition=WEBSITE_COMPONENTS.find(c=>c.type===type);if(!definition?.enabled)throw new Error('WEBSITE_COMPONENT_NOT_ACTIVE');
 const defaults:Record<string,Record<string,unknown>>={
  hero:{heading:'Make your next big idea tangible.',eyebrow:'GOOD THINGS. MADE YOURS.',body:'Custom print, merchandise and coordinated projects. Start with an idea. We’ll help shape the rest.',builtInImage:'/products/TS-0008-0.svg',imageAlt:'Synthetic apparel illustration',primaryLink:{label:'Find your next great thing',kind:'WORKFLOW',href:'#catalog-grid'}},
  promotion_banner:{message:'Bring your next project to life.',tone:'neutral'},product_carousel:{heading:'Find your next canvas.',limit:8,showSwatches:true},featured_collections:{heading:'Thoughtfully curated.',collectionIds:[]},category_grid:{heading:'Make something great.',categoryIds:[]},brand_showcase:{heading:'Brands with character.',brandIds:[]},image_gallery:{heading:'A little inspiration.',items:[],captions:true},testimonials:{heading:'Made for real people.',entries:[]},solution_cards:{heading:'Shop the outcome.',solutionPageIds:[]},cta:{heading:'Let’s put it together.',body:'Products, artwork and quantities in one connected project.',primaryLink:defaultLink,tone:'neutral'},faq:{heading:'A little guidance.',entries:[]},rich_text_image:{heading:'Your next project.',body:plainRichText('Start with a product or share your idea.')},project_inquiry:{heading:'Tell us what you’re making.',intro:'Gather products, quantities and artwork in a private quote request.',formPreset:'AUTHENTICATED_RFQ',ctaLabel:'Start a quote project'},store_grid:{heading:'Made for your people.',storeIds:[]},organization_hero:{heading:'Made for our team.',body:'An approved collection for your program.'},campaign_window_notice:{beforeText:'Ordering opens soon.',openText:'Your order window is open.',closedText:'This ordering window has closed.'},
 };
 return {id:crypto.randomUUID(),type,visible:true,variant:definition.variants[0],content:defaults[type]??{}};
}
export type PublicWebsiteProduct={id:string;title:string;description:string;category:string;brand:string;minimumQuantity:number;image:string|null;variants:{id:string;color:string;hex:string;size:string;image:string|null}[]};
export type PublicWebsiteCollection={id:string;title:string;description:string;slug:string;products:PublicWebsiteProduct[]};
export type ResolvedWebsite={site:{id:string;title:string;storeId:string|null;timezone:string;private:boolean};releaseId:string|null;generation:number;page:PageDocument|null;theme:ThemeDocument;navigation:NavigationDocument;footer:FooterDocument;links:Record<string,string>;media:Record<string,{url:string;alt:string;width:number;height:number}>;collections:Record<string,PublicWebsiteCollection>;pages:Record<string,{id:string;title:string;path:string;description:string}>;stores:Record<string,{id:string;title:string;description:string;startsAt:string|null;closesAt:string|null}>;taxonomy:{categories:string[];brands:string[]};preview:boolean};
