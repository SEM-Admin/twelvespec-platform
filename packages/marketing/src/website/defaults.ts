import {newWebsiteSection,type WebsiteDocument,type WebsiteLink} from '../../../contracts/src/website';

const link=(label:string,href:string):WebsiteLink=>({label,kind:'WORKFLOW',href});
/** Bootstrap values only. Once stored, routine content never comes from source. */
export function defaultWebsiteDocuments(siteId:string,store?:{id:string;title:string;brandKitId?:string}):WebsiteDocument[]{
 const hero=newWebsiteSection(store?'organization_hero':'hero');hero.content.heading=store?.title??'Your brand. A world of possibilities.';
 if(store?.brandKitId)hero.content.approvedBrandKitId=store.brandKitId;
 const sections=[hero];
 if(store){const notice=newWebsiteSection('campaign_window_notice');notice.content.storeId=store.id;sections.push(notice);}
 else sections.push(newWebsiteSection('product_carousel'));
 sections.push(newWebsiteSection('cta'));
 return [
  {schemaVersion:1,documentType:'WEBSITE_THEME',siteId,title:'Website brand',paletteId:'neutral-vermilion',fontPresetId:'existing-ui-sans',buttonStyleId:'charcoal-primary',spacingPresetId:'standard',logoVariantId:'CURRENT_WORDMARK',...(store?.brandKitId?{approvedBrandKitId:store.brandKitId}:{})},
  {schemaVersion:1,documentType:'WEBSITE_NAVIGATION',siteId,title:'Main navigation',logoVariantId:'CURRENT_WORDMARK',searchEnabled:true,items:[
   {id:crypto.randomUUID(),label:'Shop all',link:link('Shop all','/catalog'),children:[{id:crypto.randomUUID(),label:'Apparel & headwear',link:link('Apparel & headwear','/catalog?category=APPAREL'),children:[]},{id:crypto.randomUUID(),label:'Promotional products',link:link('Promotional products','/catalog?category=PROMO'),children:[]},{id:crypto.randomUUID(),label:'Print & packaging',link:link('Print & packaging','/catalog?category=PRINT'),children:[]},{id:crypto.randomUUID(),label:'Signs & events',link:link('Signs & events','/catalog?category=SIGNAGE'),children:[]}]},
   {id:crypto.randomUUID(),label:'Solutions',link:link('Solutions','/solutions'),children:[]},
   {id:crypto.randomUUID(),label:'Build a bundle',link:link('Build a bundle','/bundles'),children:[]},
   {id:crypto.randomUUID(),label:'Company stores',link:link('Company stores','/stores'),children:[]},
  ]},
  {schemaVersion:1,documentType:'WEBSITE_FOOTER',siteId,title:'Shared footer',groups:[{id:crypto.randomUUID(),heading:'Make something',links:[link('Shop all products','/catalog'),link('Build a bundle','/bundles'),link('Company stores','/stores')]},{id:crypto.randomUUID(),heading:'Your projects',links:[link('Quote cart','/cart'),link('Quotes & orders','/account'),link('Artwork & proofs','/account')]},{id:crypto.randomUUID(),heading:'What’s next',links:[link('Coming Soon','/coming-soon')]}],supportCopy:'Good things. Made yours.',legalLinks:[],socialLinks:[]},
  {schemaVersion:1,documentType:'WEBSITE_PAGE',siteId,title:store?.title??'Homepage',path:'/',seo:{title:store?.title??'TwelveSpec — Make it yours',description:'Custom print, promotional products and connected creative projects. Request a reviewed quote for your next idea.',noIndex:true},sections},
 ];
}
