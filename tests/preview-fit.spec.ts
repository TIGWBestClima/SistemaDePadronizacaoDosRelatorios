import {test,expect} from '@playwright/test';
for(const name of ['Relatório de Qualidade','Relatório de Avanço de Obras'])test('prévia ajusta largura: '+name,async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:new RegExp('MODELO DISPONÍVEL.*'+name)}).click();
 await expect(page.getByRole('button',{name:/Exportar PDF/})).toBeEnabled();
 const natural=await page.frameLocator('iframe').locator('.page').first().evaluate(n=>n.getBoundingClientRect().width);
 for(const width of [1024,1366,1920,900]){
  await page.setViewportSize({width,height:768});
  for(const expanded of [false,true]){
   if(expanded)await page.getByRole('button',{name:'Ampliar',exact:true}).click();
   await expect.poll(()=>page.locator('.paper-scroller').evaluate(n=>{const f=n.querySelector('iframe')!;return Math.abs(f.getBoundingClientRect().width-n.clientWidth)<2&&n.scrollWidth<=n.clientWidth+1;})).toBe(true);
   expect(await page.frameLocator('iframe').locator('.page').first().evaluate(n=>n.getBoundingClientRect().width)).toBeCloseTo(natural,0);
   expect(await page.locator('iframe').evaluate(f=>f.contentDocument!.documentElement.scrollWidth<=f.contentDocument!.documentElement.clientWidth+1)).toBe(true);
   if(expanded)await page.getByRole('button',{name:'Voltar à edição',exact:true}).click();
  }
 }
});
