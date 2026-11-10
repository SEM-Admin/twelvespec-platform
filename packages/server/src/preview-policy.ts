import {fail,type Input} from '../../kernel/src';
export function enforcePreviewPolicy(module:string,action:string,input:Input,enabled=process.env.TWELVESPEC_PREVIEW==='1'){
 if(!enabled)return;
 if(module==='supplier'&&action==='create_connection'&&input.environment!==undefined&&input.environment!=='mock')fail('PREVIEW_MOCK_CONNECTIONS_ONLY',403);
 if(module==='supplier'&&action==='save_secret'&&(typeof input.secret!=='string'||!/^((demo|mock)[_-])/i.test(input.secret)))fail('PREVIEW_SYNTHETIC_CREDENTIALS_ONLY',403);
 if(action.startsWith('live_'))fail('PREVIEW_EXTERNAL_WRITES_BLOCKED',403);
}
