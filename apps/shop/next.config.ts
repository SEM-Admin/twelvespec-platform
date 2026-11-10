import type { NextConfig } from 'next';
process.env.TWELVESPEC_APP??='shop';
process.env.APP_ORIGIN??='http://localhost:3000';
const config: NextConfig = { transpilePackages: ['@twelvespec/contracts'], poweredByHeader: false, devIndicators: false, experimental: { useTypeScriptCli: false } };
export default config;
