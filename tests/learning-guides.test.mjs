import test from 'node:test';
import assert from 'node:assert/strict';
import {milestones} from '../src/curriculum.js';
import {guides} from '../src/learning-guides/index.js';
import {readings,readingRows} from '../src/learning-guides/reading.js';
import {solutions} from '../src/solutions/index.js';

test('every milestone has a distinct teaching example and focused section reading',()=>{
 assert.equal(Object.keys(guides).length,milestones.length);
 assert.equal(readingRows.length,milestones.length);
 for(const m of milestones){
  const g=guides[m.id],r=readings[m.id];
  for(const field of ['code','output','walkthrough','pitfall','experiment'])assert.ok(g[field]?.trim(),`${m.id}: ${field}`);
  assert.ok(!solutions[m.id].includes(g.code),`${m.id}: exercise answer reused as teaching example`);
  assert.ok(new URL(r.url).hash.length>1,`${m.id}: missing section anchor`);
  assert.ok(r.title&&r.focus);
  assert.equal(m.officialDocumentation,r.url);
  assert.notEqual(m.additionalReading.url,r.url);
 }
});
