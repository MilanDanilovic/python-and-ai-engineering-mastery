import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto('http://127.0.0.1:5188');
 await page.locator('nav').getByRole('button',{name:'Roadmap',exact:true}).click();
 await page.getByRole('button',{name:'Names, bindings, and references',exact:true}).click();
 const tasks=page.locator('.milestone-exercises>section');
 await expect(tasks).toHaveCount(4);
 for(const task of await tasks.all()){
  await expect(task.locator('.solution-reveal .monaco-editor')).toHaveCount(0);
  await task.getByRole('button',{name:'Reveal Solution',exact:true}).click();
  await expect(task.locator('.solution-reveal .monaco-editor')).toHaveCount(1);
  await expect(task.getByRole('button',{name:'Hide Solution',exact:true})).toBeVisible();
 }
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mastery-v1')));
 expect(Object.keys(saved.milestoneReveals.bindings)).toHaveLength(4);
 await page.reload();await page.locator('nav').getByRole('button',{name:'Roadmap',exact:true}).click();
 await page.getByRole('button',{name:'Names, bindings, and references',exact:true}).click();
 await expect(page.locator('.solution-reveal .monaco-editor')).toHaveCount(0);
 expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('mastery-v1')))).done).not.toContain('Names, bindings, and references');
 await page.setViewportSize({width:375,height:812});
 await tasks.first().getByRole('button',{name:'Reveal Solution',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);console.log('All four milestone references are hidden, reveal on confirmation in Monaco, and persist assistance without completing the milestone.');
}finally{await browser.close();}
