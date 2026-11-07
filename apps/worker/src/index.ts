import {loadEnv} from '../../../scripts/env';loadEnv();
async function main(){const {tick}=await import('./tick');console.log('TwelveSpec local worker running: mock integrations only.');let active=true;process.on('SIGTERM',()=>{active=false});process.on('SIGINT',()=>{active=false});while(active){try{await tick()}catch{console.error('Worker tick failed (redacted); next safe poll scheduled.')}await new Promise(r=>setTimeout(r,1500));}}
main();
