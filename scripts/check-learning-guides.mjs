import {spawnSync} from 'node:child_process';
import {guides} from '../src/learning-guides/index.js';
const command=process.env.PYTHON||(process.platform==='win32'?'py':'python');
const args=process.platform==='win32'&&!process.env.PYTHON?['-3.12']:[];
const result=spawnSync(command,[...args,'tests/python-learning-guides.py'],{input:JSON.stringify(guides),encoding:'utf8'});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
if(result.error)console.error(result.error);
process.exit(result.status??1);
