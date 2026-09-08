import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const run=args=>{const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);};
for(const file of readdirSync('dist').filter(name=>/\.(?:mjs|js)$/.test(name)))run(['--check',`dist/${file}`]);
run(['--test',...readdirSync('tests').filter(name=>name.endsWith('.test.mjs')).map(name=>`tests/${name}`)]);
