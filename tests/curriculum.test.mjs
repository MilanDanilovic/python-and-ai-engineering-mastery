import test from 'node:test';
import assert from 'node:assert/strict';
import {milestones,milestoneById,searchMilestones,ancestors,prerequisiteStatus,migrateCurriculum} from '../src/curriculum.js';

test('152 complete, independently identified outcomes across eight weeks',()=>{
 assert.equal(milestones.length,152);
 assert.equal(new Set(milestones.map(m=>m.id)).size,152);
 assert.equal(new Set(milestones.map(m=>m.title)).size,152);
 assert.deepEqual(Array.from({length:8},(_,i)=>milestones.filter(m=>m.week===i+1).length),[30,20,18,24,16,14,14,16]);
 for(const m of milestones){
  for(const field of ['title','explanation','why','difficulty','interviewQuestion','explainQuestion'])assert.ok(m[field]?.length>5,`${m.id}: ${field}`);
  assert.ok(m.officialDocumentation.startsWith('https://'));
  assert.ok(m.additionalReading.url.startsWith('https://'));
  assert.equal(m.exercises.simple.length,2);
  assert.ok(m.exercises.simple.every(x=>typeof x==='string'&&x.length>20),m.id);
  assert.notEqual(...m.exercises.simple);
  assert.ok(m.exercises.practical.length>20);
  assert.ok(m.exercises.debugging.length>20);
  assert.ok(m.checklist.length>=5);
  assert.ok(m.tags.length&&m.codeConcepts.length);
  assert.equal(m.masteryLevel,0);
  assert.equal(m.notes,'');
 }
});

test('prerequisites form a valid acyclic graph ordered within the curriculum',()=>{
 const visiting=new Set(),visited=new Set();
 function visit(id){assert.ok(!visiting.has(id),`Cycle at ${id}`);if(visited.has(id))return;visiting.add(id);for(const pre of milestoneById[id].prerequisites){assert.ok(milestoneById[pre],`${id}: missing ${pre}`);assert.ok(milestones.indexOf(milestoneById[pre])<milestones.indexOf(milestoneById[id]),`${pre} must precede ${id}`);visit(pre)}visiting.delete(id);visited.add(id)}
 milestones.forEach(m=>visit(m.id));assert.equal(visited.size,152);
 for(const [later,earlier] of [['decorators','define'],['decorators','function-objects'],['iterators','iterables'],['generators','iterators'],['tasks','coroutines'],['fastapi-routing','event-loop'],['pydantic-agent','base-model'],['mcp-roles','tool-schemas'],['vector-search','embeddings'],['hybrid','vector-search'],['hybrid','full-text'],['reranking','basic-rag'],['agent-evaluation','agent-tools'],['dbos-workflows','workflow-concepts']])assert.ok(ancestors(later).has(earlier),`${earlier} before ${later}`);
});

test('search finds requested concepts with week context and combined filters',()=>{
 for(const [term,id] of [['decorator','decorators'],['generator','generators'],['MCP','mcp-roles'],['DBOS','dbos-workflows'],['Protocol','protocol'],['asyncio','tasks'],['reranking','reranking']])assert.ok(searchMilestones(term).some(m=>m.id===id));
 assert.ok(searchMilestones('Protocol',{week:3,tag:'typing'}).some(m=>m.id==='protocol'));
 assert.equal(searchMilestones('Protocol',{week:1,tag:'typing'}).length,0);
 assert.equal(searchMilestones('no-such-concept-991').length,0);
});

test('readiness follows direct completion, independently of mastery',()=>{
 const m=milestoneById.hybrid;
 assert.equal(prerequisiteStatus(m,[]).ready,false);
 assert.equal(prerequisiteStatus(m,['Vector search with pgvector']).ready,false);
 assert.equal(prerequisiteStatus(m,['Vector search with pgvector','PostgreSQL full-text search']).ready,true);
});

test('migration retains prior work without marking decomposed categories complete',()=>{
 const original={done:['Variables','Functions','Mutability'],mastery:{Variables:4,Functions:6},checks:{'VariablesI read the concept':true},notes:[{body:'Keep this note'}],solutions:{'reflection:Variables':'Keep this answer'},projects:[0]};
 const migrated=migrateCurriculum(original);
 assert.ok(migrated.done.includes('Names, bindings, and references'));
 assert.ok(migrated.done.includes('Functions'));
 assert.ok(!migrated.done.includes('Defining functions'));
 assert.equal(migrated.mastery['Names, bindings, and references'],4);
 assert.deepEqual(migrated.notes,original.notes);
 assert.deepEqual(migrated.solutions,original.solutions);
 assert.equal(migrated.milestoneChecks.bindings['I read the concept'],true);
 assert.match(migrated.milestoneNotes.bindings,/Keep this answer/);
 assert.deepEqual(migrateCurriculum(migrated),migrated);
 assert.deepEqual(original.done,['Variables','Functions','Mutability']);
});
