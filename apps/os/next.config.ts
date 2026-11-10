import type { NextConfig } from 'next';
process.env.TWELVESPEC_APP??='os';
process.env.APP_ORIGIN??='http://localhost:3001';
const config:NextConfig={devIndicators:false,experimental:{externalDir:true,useTypeScriptCli:false},async headers(){return [{source:'/website/preview/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Frame-Options',value:'SAMEORIGIN'}]}];}};
export default config;
