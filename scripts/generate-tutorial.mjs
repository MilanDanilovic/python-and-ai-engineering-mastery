import {mkdir,writeFile} from 'node:fs/promises';
import {milestones,milestoneById} from '../src/curriculum.js';
import {solutionFor,taskIndexes} from '../src/solutions/index.js';
await mkdir('docs/curriculum',{recursive:true});
let index='# Curriculum and worked exercises\n\n152 milestones · 608 exercises with hidden reference answers. Try each exercise before opening its answer. Code examples target Python 3.11+; see [example setup](../EXAMPLES.md).\n\n';
for(let week=1;week<=8;week++){
 const selected=milestones.filter(m=>m.week===week);
 index+=`- [Week ${week}: ${selected.length} milestones](week-${week}.md)\n`;
 let text=`# Week ${week}\n\n[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)\n\n`;
 for(const m of selected){
  text+=`<a id="${m.id}"></a>\n\n## ${m.title}\n\n${m.explanation}\n\n**Why it matters:** ${m.why}\n\n**Prerequisites:** ${m.prerequisites.length?m.prerequisites.map(id=>`[${milestoneById[id].title}](week-${milestoneById[id].week}.md#${id})`).join(', '):'None'}\n\n**Difficulty:** ${m.difficulty} · **Code concepts:** ${m.codeConcepts.join(', ')}\n\n[Official documentation](${m.officialDocumentation}) · [Additional reading](${m.additionalReading.url})\n\n`;
  const prompts=[...m.exercises.simple,m.exercises.practical,m.exercises.debugging];
  for(const [task,i] of Object.entries(taskIndexes))text+=`### ${['Simple exercise 1','Simple exercise 2','Practical exercise','Debugging exercise'][i]}\n\n${prompts[i]}\n\n<details>\n<summary>Reveal reference solution</summary>\n\n\`\`\`python\n${solutionFor(m.id,task)}\n\`\`\`\n\n</details>\n\n`;
  text+=`**Interview question:** ${m.interviewQuestion}\n\n**Explain in your own words:** ${m.explainQuestion}\n\n`;
 }
 await writeFile(`docs/curriculum/week-${week}.md`,text);
}
await writeFile('docs/curriculum/README.md',index);
