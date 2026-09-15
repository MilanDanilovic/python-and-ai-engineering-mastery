import {executableFor} from './execution/exercises.js';
import {milestones,milestoneById,milestoneByTitle} from './curriculum.js';
import {labFor} from './session-labs.js';

export const intervals=[1,3,7,14,30];
export const sessionStages=[['review','Concept Review',10],['memory','Coding From Memory',10],['exercises','Exercises',15],['debugging','Debugging',10],['documentation','Documentation Practice',10],['practical','Practical Engineering Challenge',20],['reflection','Reflection',5]];
export const reflectionQuestions={learned:'What did you learn today?',surprised:'What surprised you?',forgot:'What did you forget?',mistake:'What mistake did you make?',previousAI:'What would you have asked an AI agent previously?',independent:'Could you now solve it yourself?'};
export const beforeAIQuestions=['Have I read the error?','Have I reproduced the issue?','Have I inspected the inputs?','Have I checked the documentation?','Have I created a smaller example?','Can I explain what I think is happening?'];
export const architectureFields={problem:'Problem',architecture:'My proposed architecture',dataFlow:'Data flow',abstractions:'Important abstractions',failures:'Potential failure modes',alternatives:'Alternatives considered',rationale:'Why I selected this solution',aiAfter:'What AI suggested afterward',changes:'What I would change'};
export function dateKey(date=new Date()){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function addDays(key,n){const [y,m,d]=key.split('-').map(Number);return dateKey(new Date(y,m-1,d+n,12))}
export function daysBetween(a,b){const parse=k=>Date.UTC(...k.split('-').map((v,i)=>Number(v)-(i===1?1:0)));return Math.round((parse(b)-parse(a))/86400000)}
export function initializeLearning(saved,now=new Date()){
 return {...saved,sessions:saved.sessions||[],revisions:saved.revisions||{},architectures:saved.architectures||[],learningEvents:saved.learningEvents||[],dismissedSuggestions:saved.dismissedSuggestions||[],weeklyReviews:saved.weeklyReviews||{},learningStartedAt:saved.learningStartedAt||dateKey(now),learningBaseline:saved.learningBaseline||{done:[...saved.done],mastery:{...saved.mastery},projects:[...saved.projects]}};
}
export function recordChanges(previous,next,now=new Date()){
 const events=[];const at=new Date(now).toISOString();
 for(const title of next.done)if(!previous.done.includes(title)&&milestoneByTitle[title])events.push({kind:'completed',conceptId:milestoneByTitle[title].id,at});
 for(const title of previous.done)if(!next.done.includes(title)&&milestoneByTitle[title])events.push({kind:'uncompleted',conceptId:milestoneByTitle[title].id,at});
 for(const [title,value] of Object.entries(next.mastery))if(value!==previous.mastery[title]&&milestoneByTitle[title])events.push({kind:'mastery',conceptId:milestoneByTitle[title].id,value,at});
 if(JSON.stringify(next.projects)!==JSON.stringify(previous.projects))events.push({kind:'projects',value:[...next.projects],at});
 for(const [id,revision] of Object.entries(next.revisions||{}))if(JSON.stringify(revision)!==JSON.stringify(previous.revisions?.[id])){const {history,...value}=revision;events.push({kind:'revision',conceptId:id,value,at})}
 return events.length?{...next,learningEvents:[...(next.learningEvents||[]),...events]}:next;
}
export function isWeak(saved,m){const rev=saved.revisions[m.id];return rev?.weak??((saved.mastery[m.title]||0)>0&&saved.mastery[m.title]<4)}
export function dueConcepts(saved,now=new Date()){
 const today=dateKey(now);
 return milestones.filter(m=>saved.revisions[m.id]?.dueDate?saved.revisions[m.id].dueDate<=today:isWeak(saved,m)).sort((a,b)=>(saved.revisions[a.id]?.dueDate||today).localeCompare(saved.revisions[b.id]?.dueDate||today));
}
export function planSession(saved,now=new Date()){
 const due=dueConcepts(saved,now),next=milestones.find(m=>!saved.done.includes(m.title)&&m.prerequisites.every(id=>saved.done.includes(milestoneById[id].title)));
 const topics=[];
 if(due[0])topics.push({id:due[0].id,reason:isWeak(saved,due[0])?'Weak-area revision':'Scheduled revision'});
 if(next&&!topics.some(t=>t.id===next.id))topics.push({id:next.id,reason:'Next ready roadmap milestone'});
 if(!topics.length){const practice=milestones.filter(m=>saved.done.includes(m.title)).sort((a,b)=>(saved.mastery[a.title]||0)-(saved.mastery[b.title]||0))[0]||milestones[0];topics.push({id:practice.id,reason:'Independent practice'})}
 if(topics.length<2&&due[1]&&!topics.some(t=>t.id===due[1].id))topics.push({id:due[1].id,reason:'Scheduled revision'});
 return {topics:topics.slice(0,2),minutes:80,dueCount:due.length};
}
function task(id,topicId,kind,content){
 const executable=['memory','debugging'].includes(kind)?executableFor(topicId,kind):null;
 return {id,topicId,kind,...content,...(executable?{executionExerciseId:executable.id,title:executable.title,prompt:executable.description,solution:executable.solution,hints:executable.hints,checks:[...executable.tests,...executable.hiddenTests].map(t=>t.name).join('; ')}:{}),answer:executable?.starterCode||'',outcome:'',evidence:'',aiUsed:false,hintsShown:0,solutionRevealed:false};
}
export function createSession(saved,now=new Date()){
 const active=saved.sessions.find(s=>s.status==='active');if(active)return active;
 const today=dateKey(now),existing=saved.sessions.find(s=>s.date===today);if(existing)return existing;
 const plan=planSession(saved,now),primary=plan.topics.find(t=>t.reason==='Next ready roadmap milestone')||plan.topics[0],secondary=plan.topics.find(t=>t.id!==primary.id);
 const topics=plan.topics.map(t=>({...t,confidence:null,explanation:'',explanationPassed:false}));
 const labs=Object.fromEntries(topics.map(t=>[t.id,labFor(milestoneById[t.id])]));
 const tasks=[...topics.map(t=>task(`memory-${t.id}`,t.id,'memory',labs[t.id].memory)),...labs[primary.id].exercises.map((ex,i)=>{const concept=i===1&&secondary?secondary.id:primary.id;return task(`exercise-${i}`,concept,'exercise',concept===primary.id?ex:labs[concept].exercises[i])}),...topics.map(t=>task(`debug-${t.id}`,t.id,'debugging',labs[t.id].debugging)),task('practical',primary.id,'practical',labs[primary.id].practical)];
 return {id:`session-${today}`,date:today,createdAt:new Date(now).toISOString(),status:'active',topics,tasks,minutes:80,stage:'review',stagesDone:[],documentation:{topicId:primary.id,problem:labs[primary.id].documentation,answer:'',reference:'',used:false,aiUsed:false},reflection:{},beforeAI:{},aiConsultedAt:null,architectureId:`architecture-session-${today}`};
}
export function updateSession(saved,id,updater){return {...saved,sessions:saved.sessions.map(s=>s.id===id?updater(s):s)}}
export function confidenceFlag(confidence,performance){if(performance==null||!Number.isFinite(performance)||![1,2,3,4,5].includes(Number(confidence)))return null;if(confidence>=4&&performance<0.6)return 'False Confidence';if(confidence<=2&&performance>=0.8)return 'Needs Reinforcement';return null}
export function topicPerformance(session,id){const attempts=session.tasks.filter(t=>t.topicId===id&&t.outcome);if(!attempts.length)return null;return attempts.reduce((n,t)=>n+(t.executionExerciseId&&t.coding?.totalTests?t.coding.testsPassed/t.coding.totalTests:t.outcome==='passed'?1:t.outcome==='partial'?0.5:0),0)/attempts.length}
export function scheduleRevision(previous,{performance,confidence,assisted=false},today){
 const independentPass=performance>=0.8&&confidence>=3&&!assisted;
 const index=independentPass?Math.min((previous?.intervalIndex??-1)+1,intervals.length-1):0;
 return {...previous,intervalIndex:index,dueDate:addDays(today,intervals[index]),lastReviewed:today,weak:!independentPass,confidence,performance,flag:confidenceFlag(confidence,performance),history:[...(previous?.history||[]),{date:today,performance,confidence,assisted,intervalDays:intervals[index]}]};
}
export function markWeak(saved,id,now=new Date()) {return {...saved,revisions:{...saved.revisions,[id]:{...saved.revisions[id],weak:true,intervalIndex:0,markedAt:new Date(now).toISOString(),dueDate:addDays(dateKey(now),1)}}}}
export function officialReferenceUsed(session){
 try{const raw=session.documentation.reference.match(/https:\/\/[^\s]+/)?.[0];if(!raw)return false;const url=new URL(raw);const concept=milestoneById[session.documentation.topicId];const hosts=[new URL(concept.officialDocumentation).hostname,new URL(labFor(concept).docs).hostname,'docs.python.org','docs.pydantic.dev','pydantic.dev','ai.pydantic.dev','docs.pytest.org','fastapi.tiangolo.com','modelcontextprotocol.io','py.sdk.modelcontextprotocol.io','docs.dbos.dev','www.postgresql.org','learn.microsoft.com','www.elastic.co','opentelemetry.io'];return hosts.includes(url.hostname)&&url.protocol==='https:'}catch{return false}
}
export function sessionRequirements(session,architecture){
 const missing=[];
 if(session.topics.some(t=>!t.explanation.trim()))missing.push(['review','Explain both reviewed concepts in your own words.']);
 for(const [kind,stage] of [['memory','memory'],['exercise','exercises'],['debugging','debugging'],['practical','practical']])if(session.tasks.some(t=>t.kind===kind&&(!['passed','partial','failed'].includes(t.outcome)||!t.answer.trim()||!t.evidence.trim())))missing.push([stage,'Record your attempt, result, and verification evidence for each task.']);
 if(!session.documentation.answer.trim()||!officialReferenceUsed(session)||!session.documentation.used)missing.push(['documentation','Record your answer, an official documentation URL, and confirm that you read it.']);
 if(!architecture?.designCommittedAt||Object.keys(architectureFields).slice(0,7).some(k=>!architecture.fields?.[k]?.trim()))missing.push(['practical','Save your architecture decision before finishing the practical challenge.']);
 if(session.topics.some(t=>!t.confidence)||Object.keys(reflectionQuestions).some(k=>!session.reflection[k]?.trim()))missing.push(['reflection','Rate each concept and answer the six reflection questions.']);
 return missing;
}
export function completeSession(saved,id,now=new Date()){
 const session=saved.sessions.find(s=>s.id===id);if(!session||session.status==='completed')return saved;
 const architecture=saved.architectures.find(a=>a.id===session.architectureId);
 if(sessionRequirements(session,architecture).length)return saved;
 const completed={...session,status:'completed',completedAt:new Date(now).toISOString(),stagesDone:sessionStages.map(s=>s[0]),projectSnapshot:[...saved.projects],architectureSnapshot:architecture};
 const revisions={...saved.revisions};for(const topic of session.topics){const attempts=session.tasks.filter(t=>t.topicId===topic.id);revisions[topic.id]=scheduleRevision(revisions[topic.id],{performance:topicPerformance(session,topic.id),confidence:Number(topic.confidence),assisted:attempts.some(t=>t.aiUsed||t.hintsShown||t.solutionRevealed)},dateKey(now))}
 return {...saved,done:[...new Set([...saved.done,...session.topics.filter(t=>t.roadmapComplete).map(t=>milestoneById[t.id].title)])],sessions:saved.sessions.map(s=>s.id===id?completed:s),revisions,activity:[...new Set([...saved.activity,dateKey(now)])]};
}
export function independenceSummary(sessions,codingExercises={}){
 const finished=sessions.filter(s=>s.status==='completed');const tasks=finished.flatMap(s=>s.tasks).filter(t=>t.outcome);const browserTasks=Object.values(codingExercises).filter(s=>s.testAttempts||s.predictionSubmitted&&s.attempts).map(s=>({kind:s.type==='Debugging'?'debugging':'exercise',outcome:s.completed?'passed':'failed',aiUsed:s.aiUsed,hintsShown:s.hintsUsed||0,solutionRevealed:s.solutionRevealed}));tasks.push(...browserTasks);const exercises=tasks.filter(t=>t.kind==='exercise'||t.kind==='memory');const debugging=tasks.filter(t=>t.kind==='debugging');const explanations=finished.flatMap(s=>s.topics);const docs=finished.map(s=>s.documentation);const designs=finished.map(s=>s.architectureSnapshot).filter(Boolean);
 const unassisted=t=>t.outcome==='passed'&&!t.aiUsed&&!t.hintsShown&&!t.solutionRevealed;
 const metrics=[['Exercises completed without AI',exercises.filter(unassisted).length,exercises.length],['Attempts without hints',tasks.filter(t=>!t.hintsShown).length,tasks.length],['Attempts without revealed solutions',tasks.filter(t=>!t.solutionRevealed).length,tasks.length],['Documentation used without AI',docs.filter(d=>d.used&&!d.aiUsed).length,docs.length],['Debugging completed independently',debugging.filter(unassisted).length,debugging.length],['Architecture decided before consulting AI',designs.filter(d=>d.designCommittedAt&&(!d.aiConsultedAt||d.designCommittedAt<d.aiConsultedAt)&&(!d.referenceConsultedAt||d.designCommittedAt<d.referenceConsultedAt)&&(!d.codingStartedAt||d.designCommittedAt<=d.codingStartedAt)&&d.designedBeforeAI).length,designs.length],['Concept explanations verified',explanations.filter(t=>t.explanationPassed&&t.explanation.trim()).length,explanations.length]];
 const observed=metrics.filter(m=>m[2]>0);
 return {score:observed.length?Math.round(observed.reduce((n,m)=>n+m[1]/m[2],0)/observed.length*100):null,metrics,hints:tasks.reduce((n,t)=>n+t.hintsShown,0),revealed:tasks.filter(t=>t.solutionRevealed).length,sessions:finished.length,attempts:tasks.length};
}
export function reviewPeriod(saved,now=new Date()){
 const elapsed=Math.max(0,daysBetween(saved.learningStartedAt,dateKey(now))),index=Math.max(0,Math.floor(elapsed/7)-1),start=addDays(saved.learningStartedAt,index*7),end=addDays(start,7);
 return {key:start,start,end,due:dateKey(now)>=end,index:index+1};
}
export function weeklySummary(saved,period){
 const within=at=>{const d=dateKey(at);return d>=period.start&&d<period.end};const sessions=saved.sessions.filter(s=>s.status==='completed'&&within(s.completedAt));const prior=saved.sessions.filter(s=>s.status==='completed'&&dateKey(s.completedAt)>=addDays(period.start,-7)&&dateKey(s.completedAt)<period.start);const events=saved.learningEvents.filter(e=>within(e.at));
 const unique=items=>[...new Set(items)];
 const eventsBeforeEnd=saved.learningEvents.filter(e=>dateKey(e.at)<period.end);
 const revisionsAtEnd={};const masteryAtEnd={...saved.learningBaseline.mastery};
 for(const e of eventsBeforeEnd){if(e.kind==='revision')revisionsAtEnd[e.conceptId]=e.value;if(e.kind==='mastery')masteryAtEnd[milestoneById[e.conceptId].title]=e.value}
 const stateAtEnd={...saved,revisions:revisionsAtEnd,mastery:masteryAtEnd};
 const weak=milestones.filter(m=>isWeak(stateAtEnd,m));
 const projectsBefore=eventsBeforeEnd.filter(e=>e.kind==='projects'&&dateKey(e.at)<period.start).at(-1)?.value||saved.learningBaseline.projects;
 const projectsAtEnd=eventsBeforeEnd.filter(e=>e.kind==='projects').at(-1)?.value||saved.learningBaseline.projects;
 const mistakes=saved.mistakes.filter(m=>m.createdAt?within(m.createdAt):m.date&&!Number.isNaN(Date.parse(m.date))&&within(m.date));
 const repeated=Object.entries(mistakes.reduce((acc,m)=>{const key=m.conceptId?milestoneById[m.conceptId]?.title||m.topic:m.topic;acc[key]=(acc[key]||0)+1;return acc},{})).filter(([,count])=>count>1);
 const performance=milestones.map(m=>{const scores=sessions.filter(s=>s.topics.some(t=>t.id===m.id)).map(s=>topicPerformance(s,m.id)).filter(x=>x!=null);return {id:m.id,score:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null}}).filter(x=>x.score!=null).sort((a,b)=>a.score-b.score);
 const current=independenceSummary(sessions),previous=independenceSummary(prior);
 return {sessions,completed:unique(events.filter(e=>e.kind==='completed').map(e=>e.conceptId)),mastered:unique(events.filter(e=>e.kind==='mastery'&&e.value===6).map(e=>e.conceptId)),weak,repeated,difficult:performance.filter(p=>p.score<0.8).slice(0,5),revealed:sessions.flatMap(s=>s.tasks.filter(t=>t.solutionRevealed).map(t=>({...t,sessionDate:s.date}))),revision:milestones.filter(m=>revisionsAtEnd[m.id]?.dueDate&&revisionsAtEnd[m.id].dueDate<=period.end),projectsAtEnd,projectsAdded:projectsAtEnd.filter(id=>!projectsBefore.includes(id)),projectsRemoved:projectsBefore.filter(id=>!projectsAtEnd.includes(id)),current,previous,change:current.score!=null&&previous.score!=null?current.score-previous.score:null,recommendations:unique([...weak.map(m=>m.id),...performance.filter(p=>p.score<0.8).map(p=>p.id)]).slice(0,4)};
}
export function mistakeSuggestions(saved){
 return saved.sessions.flatMap(s=>['mistake','forgot','surprised'].filter(field=>s.reflection[field]?.trim()&&!/^(none|nothing|n\/a|no mistakes)[.! ]*$/i.test(s.reflection[field].trim())).map(field=>{const m=milestoneById[s.topics[0].id];return {id:`${s.id}-${field}`,sessionId:s.id,conceptId:m.id,topic:m.week<4?'Python':m.week===4?'Async':m.week===5?'Pydantic AI':m.week===6?'Tools':m.week===7?'RAG':'Production AI',title:field==='forgot'?`Revisit: ${m.title}`:field==='surprised'?`Unexpected: ${m.title}`:`Practice note: ${m.title}`,expected:s.reflection.previousAI||'',actual:s.reflection[field],why:'',model:s.reflection.learned||'',code:s.tasks.find(t=>t.kind==='debugging')?.answer||'',revise:'Yes'};})).filter(d=>!saved.dismissedSuggestions.includes(d.id)&&!saved.mistakes.some(m=>m.sourceId===d.id));
}
