import {writeFile,mkdir} from 'node:fs/promises';
import {readings} from '../src/learning-guides/reading.js';

// Optional network audit: validate fragments as well as HTTP status.
const pages=[...new Set(Object.values(readings).map(r=>r.url.split('#')[0]))];
const results=new Map();
let cursor=0;
await Promise.all(Array.from({length:8},async()=>{
 while(cursor<pages.length){
  const url=pages[cursor++];
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0'}});
   const html=await response.text();
   const anchors=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
   results.set(url,{ok:response.ok,status:response.status,url:response.url,anchors});
  }catch(error){results.set(url,{ok:false,error:error.message});}
 }
}));
const report=Object.entries(readings).map(([id,reading])=>{
 const [page,fragment]=reading.url.split('#'),result=results.get(page);
 const found=!!fragment&&(result.anchors||[]).some(a=>a===decodeURIComponent(fragment)||a===`user-content-${fragment}`);
 return {id,url:reading.url,resolvedUrl:result.url,status:result.status,ok:result.ok&&found,error:result.error||(!found?'Section anchor not found':undefined)};
});
await mkdir('test-results',{recursive:true});
await writeFile('test-results/documentation-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),report,pages:Object.fromEntries(results)},null,2));
for(const item of report.filter(r=>!r.ok))console.error(`${item.id}: ${item.error||item.status} (${item.url})`);
console.log(`${report.filter(r=>r.ok).length}/${report.length} topic-specific documentation links verified, including section anchors.`);
if(process.argv.includes('--record')&&report.every(r=>r.ok))await writeFile('docs/documentation-link-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),links:report},null,2)+'\n');
if(report.some(r=>!r.ok))process.exitCode=1;
