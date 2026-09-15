import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {milestones} from '../src/curriculum.js';
import {solutions,solutionFor,taskIndexes} from '../src/solutions/index.js';

test('every roadmap exercise resolves to an authored reference',()=>{
 assert.equal(Object.keys(solutions).length,milestones.length);
 for(const milestone of milestones){
  assert.equal(solutions[milestone.id].length,4);
  for(const task of Object.keys(taskIndexes)){
   const code=solutionFor(milestone.id,task);
   assert.ok(typeof code==='string'&&code.trim().length>35,`${milestone.id}/${task}`);
   assert.ok(!code.includes('TODO'),`${milestone.id}/${task} contains a placeholder`);
  }
 }
});
test('all 608 reference snippets parse as Python 3.11+',()=>{
 const command=process.env.PYTHON|| (process.platform==='win32'?'py':'python');
 const args=process.platform==='win32'&&!process.env.PYTHON?['-3.12']:[];
 const result=spawnSync(command,[...args,'tests/python-solutions.py'],{input:JSON.stringify(solutions),encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr+String(result.error||''));
});
