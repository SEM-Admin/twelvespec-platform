import type { Metadata } from 'next';
import './globals.css';
import './workbenches.css';
export const metadata:Metadata={title:'TwelveSpec Commerce OS',description:'Synthetic development workspace for the TwelveSpec platform',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
