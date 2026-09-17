import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const output=path.resolve('verificacao/obras');await fs.mkdir(output,{recursive:true});
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>key!=='ELECTRON_RUN_AS_NODE'));
const executablePath=process.argv[2]?path.resolve(process.argv[2]):undefined;
const app=await electron.launch({executablePath,args:executablePath?['--headless']:['.','--headless'],env:environment,timeout:30000});
try{
  const page=await app.firstWindow();
  await page.getByRole('button',{name:/MODELO DISPONÍVEL.*Relatório de Avanço/}).click();
  await page.getByLabel('Nome da obra',{exact:true}).fill('Obra Damata');
  await page.getByRole('button',{name:/02.*Registros fotográficos/}).click();
  await page.getByRole('button',{name:/Adicionar registro fotográfico/}).click();
  await page.getByLabel('Serviço realizado',{exact:true}).fill('Instalação de dutos');
  await page.getByLabel('Pavimento',{exact:true}).fill('3º Subsolo');
  await page.getByLabel('Resumo/Descrição das atividades realizadas',{exact:true}).fill('Instalação de 25 metros de dutos de exaustão.');
  await expect(page.getByRole('button',{name:'Exportar PDF'})).toBeEnabled();
  const expected=await page.frameLocator('iframe').locator('.page').count();
  await app.evaluate(({dialog},output)=>{
    dialog.showSaveDialog=async(...args)=>{const options=args.at(-1);return {canceled:false,filePath:output+'/'+options.defaultPath};};
  },output);
  await page.getByRole('button',{name:/Salvar projeto/}).click();
  await expect(page.getByRole('status')).toContainText('Arquivo de projeto salvo');
  await page.getByRole('button',{name:'Exportar PDF'}).click();
  await expect(page.getByRole('status')).toContainText('PDF exportado');
  const bytes=await fs.readFile(path.join(output,'relatorio.pdf'));
  const pdf=await getDocument({data:new Uint8Array(bytes)}).promise;
  const first=await pdf.getPage(1);if(Math.abs(first.view[2]/first.view[3]-16/9)>0.01)throw new Error('Proporção incorreta no PDF');
  if(pdf.numPages!==expected)throw new Error(`PDF: ${pdf.numPages}; prévia: ${expected}`);
  if(process.env.CAPTURAR_TELA==='1')await page.screenshot({path:path.join(output,'prototipo-desktop.png')});
  console.log(`Electron validado: projeto salvo e PDF com ${pdf.numPages} páginas, igual à pré-visualização.`);
}finally{const pages=await app.windows();for(const page of pages)await page.evaluate(()=>window.desktop?.setDirty(false)).catch(()=>{});await app.close();}
