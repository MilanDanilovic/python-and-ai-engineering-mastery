import test from 'node:test';
import assert from 'node:assert/strict';
import {milestones,milestoneById} from '../src/curriculum.js';
import {labs,labFor} from '../src/session-labs.js';
import {initializeLearning,recordChanges,planSession,createSession,dateKey,addDays,dueConcepts,scheduleRevision,markWeak,confidenceFlag,topicPerformance,completeSession,sessionRequirements,reflectionQuestions,architectureFields,independenceSummary,reviewPeriod,weeklySummary,mistakeSuggestions} from '../src/learning-engine.js';

const at=(day,hour=12)=>new Date(`2026-09-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:00:00`);
function base(day=1){return initializeLearning({done:[],mastery:{},checks:{},notes:[],mistakes:[],links:[],solutions:{},projects:[],activity:[]},at(day))}
function ready(day=1){let state=base();const s=createSession(state,at(day));s.tasks=s.tasks.map(t=>({...t,answer:'An implementation',evidence:'All checks passed locally',outcome:'passed'}));s.topics=s.topics.map(t=>({...t,confidence:4,explanation:'A concrete explanation',explanationPassed:true,roadmapComplete:true}));s.documentation={...s.documentation,answer:'Verified against the documentation',reference:'https://docs.python.org/3/library/copy.html#copy.copy',used:true};s.reflection=Object.fromEntries(Object.keys(reflectionQuestions).map(k=>[k,'None']));state.sessions=[s];state.architectures=[{id:s.architectureId,fields:Object.fromEntries(Object.keys(architectureFields).slice(0,7).map(k=>[k,'Concrete design'])),designCommittedAt:at(day,10).toISOString(),codingStartedAt:at(day,11).toISOString(),designedBeforeAI:true}];return state}

test('daily plan follows prerequisites and combines due revision with new work',()=>{
 let state=base();assert.deepEqual(planSession(state,at(1)).topics,[{id:'bindings',reason:'Next ready roadmap milestone'}]);
 state.done=[milestoneById.bindings.title];state.revisions.bindings={weak:true,dueDate:'2026-09-02'};
 assert.equal(dueConcepts(state,at(1)).length,0);
 const plan=planSession(state,at(2));assert.equal(plan.minutes,80);assert.deepEqual(plan.topics.map(t=>t.id),['bindings','mutability']);
 const session=createSession(state,at(2));assert.equal(session.tasks.filter(t=>t.kind==='exercise').length,3);assert.equal(session.tasks.filter(t=>t.kind==='memory').length,2);assert.equal(session.tasks.filter(t=>t.kind==='debugging').length,2);
 assert.ok(session.tasks.every(t=>!t.solutionRevealed&&t.hintsShown===0));
});

test('sessions resume across midnight and do not duplicate on repeated starts',()=>{
 const state=base();const session=createSession(state,at(1));state.sessions=[session];
 assert.equal(createSession(state,at(2)),session);
 session.status='completed';assert.equal(createSession(state,at(1)),session);
 assert.notEqual(createSession(state,at(2)).id,session.id);
});

test('revision expands through 1, 3, 7, 14, 30 days and resets after assistance or failure',()=>{
 let revision;let day='2026-09-01';
 for(const interval of [1,3,7,14,30,30]){revision=scheduleRevision(revision,{performance:1,confidence:4},day);assert.equal(revision.dueDate,addDays(day,interval));assert.equal(revision.weak,false);day=revision.dueDate}
 revision=scheduleRevision(revision,{performance:0.5,confidence:5},day);assert.equal(revision.dueDate,addDays(day,1));assert.equal(revision.flag,'False Confidence');
 revision=scheduleRevision(revision,{performance:1,confidence:4,assisted:true},day);assert.equal(revision.intervalIndex,0);
 assert.equal(markWeak(base(),'bindings',at(1)).revisions.bindings.dueDate,'2026-09-02');
});

test('confidence calibration needs measured attempts and uses documented thresholds',()=>{
 assert.equal(confidenceFlag(5,null),null);assert.equal(confidenceFlag(null,0),null);
 assert.equal(confidenceFlag(0,1),null);assert.equal(confidenceFlag('',1),null);
 assert.equal(confidenceFlag(4,0.5),'False Confidence');assert.equal(confidenceFlag(2,0.8),'Needs Reinforcement');assert.equal(confidenceFlag(3,1),null);
 const state=ready();state.sessions[0].tasks[0].outcome='partial';assert.ok(topicPerformance(state.sessions[0],'bindings')<1);
});

test('completion requires evidence, documentation and design, and never infers mastery',()=>{
 const empty=base();const incomplete=createSession(empty,at(1));empty.sessions=[incomplete];assert.equal(completeSession(empty,incomplete.id,at(1)),empty);
 const state=ready();const session=state.sessions[0];assert.equal(sessionRequirements(session,state.architectures[0]).length,0);
 const completed=completeSession(state,session.id,at(1));assert.equal(completed.sessions[0].status,'completed');assert.equal(completed.revisions.bindings.dueDate,'2026-09-02');assert.equal(completed.done.includes(milestoneById.bindings.title),true);assert.deepEqual(completed.mastery,{});assert.equal(completeSession(completed,session.id,at(2)),completed);
 session.documentation.reference='https://docs.python.org.evil.example/';assert.ok(sessionRequirements(session,state.architectures[0]).some(([stage])=>stage==='documentation'));
});

test('independence is based on completed evidence and retains assistance penalties',()=>{
 assert.equal(independenceSummary([]).score,null);
 const state=ready();let completed=completeSession(state,state.sessions[0].id,at(1));assert.equal(independenceSummary(completed.sessions).score,100);
 const assisted=ready();assisted.sessions[0].tasks[0]={...assisted.sessions[0].tasks[0],hintsShown:2,solutionRevealed:true,aiUsed:true};assisted.architectures[0].aiConsultedAt=at(1,9).toISOString();
 completed=completeSession(assisted,assisted.sessions[0].id,at(1));const score=independenceSummary(completed.sessions);assert.ok(score.score<100);assert.equal(score.hints,2);assert.equal(score.revealed,1);assert.equal(score.metrics[5][1],0);assert.equal(completed.revisions.bindings.intervalIndex,0);
 const reference=ready();reference.architectures[0].referenceConsultedAt=at(1,9).toISOString();assert.equal(independenceSummary(completeSession(reference,reference.sessions[0].id,at(1)).sessions).metrics[5][1],0);
});

test('weekly reviews use date windows, actual changes, and retained project snapshots',()=>{
 let state=base();assert.equal(reviewPeriod(state,at(7)).due,false);assert.equal(reviewPeriod(state,at(8)).due,true);
 state=recordChanges(state,{...state,done:[milestoneById.bindings.title],projects:[0]},at(2));
 state=recordChanges(state,{...state,mastery:{[milestoneById.bindings.title]:6},projects:[0,1]},at(3));
 state=recordChanges(state,{...state,projects:[0,1,2]},at(10));
 const period=reviewPeriod(state,at(8));const review=weeklySummary(state,period);assert.deepEqual(review.completed,['bindings']);assert.deepEqual(review.mastered,['bindings']);assert.deepEqual(review.projectsAtEnd,[0,1]);assert.deepEqual(review.projectsAdded,[0,1]);assert.equal(review.change,null);
 const second=weeklySummary(state,{start:'2026-09-08',end:'2026-09-15'});assert.deepEqual(second.projectsAdded,[2]);
 const unchanged=recordChanges(state,{...state},at(11));assert.equal(unchanged.learningEvents.length,state.learningEvents.length);
});

test('weekly scores compare separate weeks and identify repeated mistakes',()=>{
 const a=ready(1);let state=completeSession(a,a.sessions[0].id,at(1));
 const b=ready(8);b.sessions[0].tasks.forEach(t=>{t.aiUsed=true});const second=completeSession(b,b.sessions[0].id,at(8));state.sessions.push(...second.sessions);
 state.mistakes=[{createdAt:at(8).toISOString(),conceptId:'bindings',topic:'Python'},{createdAt:at(9).toISOString(),conceptId:'bindings',topic:'Python'}];
 const summary=weeklySummary(state,{start:'2026-09-08',end:'2026-09-15'});assert.ok(summary.change<0);assert.equal(summary.repeated[0][1],2);
});

test('reflection drafts are suggestions and can be dismissed or accepted without duplication',()=>{
 const state=ready();state.sessions[0].reflection.mistake='I mutated shared defaults.';state.sessions[0].reflection.forgot='I forgot to copy nested values.';state.sessions[0].reflection.surprised='None';
 const suggestions=mistakeSuggestions(state);assert.equal(suggestions.length,2);assert.equal(state.mistakes.length,0);
 state.dismissedSuggestions=[suggestions[0].id];assert.equal(mistakeSuggestions(state).length,1);
 state.mistakes=[{sourceId:suggestions[1].id}];assert.equal(mistakeSuggestions(state).length,0);
});

test('every milestone has complete practice material, broken code, hints, and hidden references',()=>{
 for(const m of milestones){const content=labFor(m);assert.ok(content.docs.startsWith('https://'));assert.equal(content.exercises.length,3);assert.ok(content.debugging.broken.length>20);for(const task of [content.memory,...content.exercises,content.debugging,content.practical]){assert.ok(task.prompt&&task.solution&&task.checks,m.id);assert.equal(task.hints.length,2)}}
 for(const name of ['bindings','imports','async','exceptions','typing','pydantic','database','agents','tools','concurrency'])assert.ok(labs[name].debugging.broken);
 assert.equal(dateKey(new Date(2026,8,1,23,59)),'2026-09-01');assert.equal(addDays('2026-12-31',1),'2027-01-01');
});
