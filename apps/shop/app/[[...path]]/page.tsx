import Storefront from '../../components/storefront';
import {notFound,redirect} from 'next/navigation';
import {publishedWebsite} from '../website-data';
type Props={params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
const websitePath=(path:string[])=>path[0]==='stores'&&path[1]?{path:'/'+path.slice(2).join('/'),storeId:path[1]}:{path:'/'+path.join('/')};
export async function generateMetadata({params}:Props){const {path=[]}=await params,scope=websitePath(path),website=await publishedWebsite(scope.path,scope.storeId);return {title:website?.page?.seo.title??'TwelveSpec — Make it yours',description:website?.page?.seo.description??'Configure your project and request a reviewed quote.',robots:{index:false,follow:false}};}
export default async function Page({params,searchParams}:Props) {
 const {path=[]}=await params,scope=websitePath(path),website=await publishedWebsite(scope.path,scope.storeId);
 if(website?.redirectTo)redirect(scope.storeId?`/stores/${scope.storeId}${website.redirectTo}`:website.redirectTo);
 if(path[0]&&!['products','create','cart','account','bundles','stores','coming-soon','catalog','collections','inquiry'].includes(path[0])&&!website?.page)notFound();
 const query=Object.fromEntries(Object.entries(await searchParams).flatMap(([key,value])=>typeof value==='string'?[[key,value]]:[]));
 return <Storefront path={path} initialWebsite={website} catalogQuery={query}/>;
}
