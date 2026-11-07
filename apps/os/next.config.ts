import type { NextConfig } from 'next';
process.env.TWELVESPEC_APP??='os';
process.env.APP_ORIGIN??='http://localhost:3001';
const config:NextConfig={devIndicators:false,experimental:{externalDir:true,useTypeScriptCli:false}};
export default config;
