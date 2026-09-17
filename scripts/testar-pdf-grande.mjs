import {_electron as electron,expect} from '@playwright/test';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=path.resolve('verificacao/pdf-grande');await fs.mkdir(output,{recursive:true});
const executableArgument=process.argv.slice(2).find(v=>!v.startsWith('--'));
const baseline=process.argv.includes('--expect-url-error');
const executablePath=executableArgument?path.resolve(executableArgument):undefined;
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>key!=='ELECTRON_RUN_AS_NODE'));
// Deterministic noise is a test fixture: a valid PNG large enough to exercise the bug.
const canvas=createCanvas(1024,1024);const context=canvas.getContext('2d');
const pixels=context.createImageData(1024,1024);let seed=42;
for(let i=0;i<pixels.data.length;i+=4){for(let j=0;j<3;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels.data[i+j]=seed>>>24;}pixels.data[i+3]=255;}
context.putImageData(pixels,0,0);const png=canvas.toBuffer('image/png');
assert(png.length>2*1024*1024);
const app=await electron.launch({executablePath,args:executablePath?['--headless']:['.','--headless'],env:environment,timeout:30000});
try{
  const page=await app.firstWindow();
  await page.getByRole('button',{name:/MODELO DISPONÍVEL.*Relatório de Qualidade/}).click();
  await page.getByLabel('Cliente',{exact:true}).fill('Teste de exportação com imagem grande');
  await page.getByRole('button',{name:'Continuar para registros'}).click();
  await page.getByRole('button',{name:'Adicionar item'}).click();
  await page.getByLabel('Descrição',{exact:true}).fill('REGISTRO DE TESTE COM IMAGEM GRANDE');
  await page.locator('.photo-field input').first().setInputFiles({name:'imagem-teste.png',mimeType:'image/png',buffer:png});
  await expect(page.locator('.photo-field img')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Exportar PDF'})).toBeEnabled({timeout:30000});
  const frame=page.frameLocator('iframe');
  const htmlSize=await frame.locator('html').evaluate(el=>el.outerHTML.length);assert(htmlSize>2*1024*1024);
  const expected=await frame.locator('.page').count();
  const temporaryRoot=await app.evaluate(({app})=>app.getPath('temp'));
  const tempList=async()=> (await fs.readdir(temporaryRoot)).filter(v=>v.startsWith('best-clima-pdf-')).sort();
  const initialTemp=await tempList();
  await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:output+'/relatorio-grande.pdf'});},output);
  await page.getByRole('button',{name:'Exportar PDF'}).click();
  if(baseline){
    await expect.poll(async()=> (await page.getByRole('status').textContent())?.includes('ERR_INVALID_URL'),{timeout:30000}).toBe(true);
    console.log('Erro original reproduzido com PNG de '+png.length+' bytes e HTML de '+htmlSize+' caracteres.');
  }else{
    await expect(page.getByRole('status')).toHaveText(/PDF exportado/,{timeout:60000});
    const pdf=await getDocument({data:new Uint8Array(await fs.readFile(path.join(output,'relatorio-grande.pdf')))}).promise;
    assert.equal(pdf.numPages,expected);
    const recordPage=await pdf.getPage(2);const text=await recordPage.getTextContent();
    assert(text.items.map(v=>v.str).join(' ').includes('REGISTRO DE TESTE COM IMAGEM GRANDE'));
    const operators=await recordPage.getOperatorList();
    assert(operators.fnArray.filter(v=>v===OPS.paintImageXObject).length>=2,'Logo e evidência devem aparecer no PDF');
    assert.deepEqual(await tempList(),initialTemp,'Temporários devem ser removidos após sucesso');
    // Destination failure must also close the print window and clean temporary HTML.
    const windows=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length);
    await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:output});},output);
    await page.getByRole('button',{name:'Exportar PDF'}).click();
    await expect.poll(async()=> (await page.getByRole('status').textContent())?.includes("Error invoking remote method 'export-pdf'"),{timeout:60000}).toBe(true);
    assert.deepEqual(await tempList(),initialTemp,'Temporários devem ser removidos após falha');
    assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),windows);
    console.log('Correção validada: PDF com imagem de '+png.length+' bytes; '+pdf.numPages+' páginas; texto e imagens preservados; temporários removidos em sucesso e falha.');
  }
}finally{for(const page of await app.windows())await page.evaluate(()=>window.desktop?.setDirty(false)).catch(()=>{});await app.close();}
