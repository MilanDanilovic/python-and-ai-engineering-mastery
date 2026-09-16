import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:5188');
 await page.locator('nav').getByRole('button',{name:'Roadmap',exact:true}).click();
 await page.getByRole('button',{name:'Names, bindings, and references',exact:true}).click();
 await expect(page.getByRole('link',{name:'Official documentation: Binding of names',exact:true})).toHaveAttribute('href',/executionmodel\.html#binding-of-names$/);
 await expect(page.locator('.guided-reading')).toContainText('Read how assignment binds names');
 await expect(page.locator('.learning-guide .monaco-editor')).toHaveCount(1);
 await expect(page.locator('.guide-output')).toContainText("['apple', 'pear']");
 await expect(page.locator('.guide-pitfall')).toContainText('An assignment does not copy');
 await page.locator('.learning-guide').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/learning-guide-desktop.png'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mastery-v1')));
 expect(saved.milestoneReveals?.bindings).toBeUndefined();
 await page.getByRole('button',{name:'Jump to questions'}).click();
 await expect(page.getByLabel('Practice questions',{exact:true})).toBeFocused();
 const results=await page.evaluate(async()=>{
  const {guides}=await import('/src/learning-guides/index.js');
  const {PyodideExecutionProvider}=await import('/src/execution/PyodideExecutionProvider.js');
  const results=[];
  for(const id of ['bindings','strings','generators','dataclasses','coroutines','gather','cancellation','locks','base-model','nested-models','discriminators','hybrid']){
   const g=guides[id],provider=new PyodideExecutionProvider();
   const result=await provider.execute(g.code,{allowedPackages:g.packages});
   results.push({id,ok:result.success&&result.stdout.trim()===g.output.trim(),error:result.error,actual:result.stdout});
   provider.dispose();
  }
  return results;
 });
 expect(results.filter(r=>!r.ok)).toEqual([]);
 await page.setViewportSize({width:375,height:812});
 await page.locator('.learning-guide').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/learning-guide-mobile.png'});
 expect(errors).toEqual([]);
 console.log('Guided readings, independent examples, 12 real browser executions, saved progress, and mobile layout passed.');
}finally{await browser.close();}
