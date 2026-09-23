import {_electron as electron,expect} from '@playwright/test';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('verificacao/excel');await fs.mkdir(output,{recursive:true});
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>key!=='ELECTRON_RUN_AS_NODE'));
const executablePath=process.argv[2]?path.resolve(process.argv[2]):undefined;
const app=await electron.launch({executablePath,args:executablePath?['--headless']:['.','--headless'],env:environment,timeout:30000});
try{
 const page=await app.firstWindow();
 await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async(...args)=>({canceled:false,filePath:output+'/'+args.at(-1).defaultPath});},output);
 await page.getByRole('button',{name:/MODELO DISPONÍVEL.*Relatório de Qualidade/}).click();
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();
 await page.getByRole('button',{name:'Baixar modelo Excel',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true})).toBeEnabled();
 await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();
 const file=path.join(output,'modelo-qualidade.xlsx');
 await expect.poll(async()=>{try{return (await fs.stat(file)).size>0;}catch{return false;}}).toBe(true);
 const wb=new ExcelJS.Workbook();await wb.xlsx.readFile(file);const ws=wb.getWorksheet('Itens');ws.getCell('E2').value='Item importado pelo diálogo nativo';ws.getCell('J2').value='18/09/2026';await wb.xlsx.writeFile(path.join(output,'preenchida.xlsx'));
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path.join(output,'preenchida.xlsx'));
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();const modal=page.getByRole('dialog');await modal.getByRole('button',{name:'Selecionar planilha Excel'}).click();try{await expect(modal.getByRole('button',{name:'Confirmar importação'})).toBeEnabled({timeout:15000});}catch(e){console.log(await modal.innerText());throw e;}await modal.getByRole('button',{name:'Confirmar importação'}).click();
 await page.getByLabel('Cliente',{exact:true}).pressSequentially('Teclado funcionando');await expect(page.getByLabel('Cliente',{exact:true})).toHaveValue('Teclado funcionando');
 await expect(page.getByRole('button',{name:/Exportar PDF/})).toBeEnabled();await expect(page.frameLocator('iframe').locator('.record')).toHaveCount(1);
 await page.getByRole('button',{name:/Salvar projeto/}).click();await expect(page.locator('.notice[role=status]')).toContainText('Arquivo de projeto salvo');
 await page.getByRole('button',{name:/Exportar PDF/}).click();await expect(page.locator('.notice[role=status]')).toContainText('PDF exportado');
 console.log('Excel no Electron validado: modelo salvo, planilha importada, teclado ativo, projeto e PDF exportados.');
}finally{for(const p of await app.windows())await p.evaluate(()=>window.desktop?.setDirty(false)).catch(()=>{});await app.close();}
