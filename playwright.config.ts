import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const browserExecutable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??(!process.env.CI&&existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
export default defineConfig({testDir:'./tests/e2e',workers:1,timeout:45000,expect:{timeout:10000},use:{browserName:'chromium',headless:true,launchOptions:{executablePath:browserExecutable,args:['--no-sandbox']},trace:'retain-on-failure',screenshot:'only-on-failure'},reporter:[['list'],['html',{open:'never'}]],webServer:{command:'npm run dev',url:'http://localhost:3000/api/health',reuseExistingServer:!process.env.CI,timeout:120000}});
