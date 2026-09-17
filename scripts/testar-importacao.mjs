import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import {novoProjeto,novoItem} from '../src/relatorios/qualidade/modelo.ts';
const output=path.resolve('verificacao/importacao');await fs.mkdir(output,{recursive:true});
const project=novoProjeto();project.gerais.cliente='Cliente importado';project.itens=[{...novoItem(),descricao:'Descrição importada'}];
const zip=new JSZip();zip.file('manifesto.json',JSON.stringify({formato:1,modelo:'qualidade',versaoModelo:1}));zip.file('dados.json',JSON.stringify(project));
const projectPath=path.join(output,'teste.bcrel');await fs.writeFile(projectPath,await zip.generateAsync({type:'nodebuffer'}));
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>key!=='ELECTRON_RUN_AS_NODE'));
const app=await electron.launch({args:['.','--headless'],env:environment,timeout:30000});
try{
  const page=await app.firstWindow();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const nativeDialogs=[];page.on('dialog',dialog=>{nativeDialogs.push(dialog.type());dialog.dismiss();});
  async function choose(file){await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async(parent)=>{
    if(!parent?.webContents)throw new Error('O seletor precisa de uma janela proprietária.');
    return {canceled:file===null,filePaths:file?[file]:[]};
  };},file);}
  async function append(label,suffix){const field=page.getByLabel(label,{exact:true});const value=await field.inputValue();await field.click();await field.press('End');await field.pressSequentially(suffix,{delay:20});await expect(field).toHaveValue(value+suffix);await field.press('Backspace');await expect(field).toHaveValue((value+suffix).slice(0,-1));await field.pressSequentially('z');await expect(field).toHaveValue((value+suffix).slice(0,-1)+'z');}
  await page.getByRole('button',{name:/MODELO DISPONÍVEL.*Relatório de Qualidade/}).click();
  await page.getByLabel('Cliente',{exact:true}).pressSequentially('Trabalho atual');
  await choose(projectPath);await page.getByRole('button',{name:'Abrir projeto',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();
  await expect(page.getByLabel('Cliente',{exact:true})).toHaveValue('Trabalho atual');
  await append('Cliente',' abc');
  await page.getByRole('button',{name:'Abrir projeto',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Confirmar',exact:true}).click();
  await expect(page.getByLabel('Cliente',{exact:true})).toHaveValue('Cliente importado');
  await append('Cliente',' novo');
  await page.getByRole('button',{name:/Registros de inspeção/}).click();
  await append('Descrição',' texto');
  await choose(path.resolve('src/identidade/simbolo.png'));
  await page.locator('.photo-field .upload').first().click();
  await expect(page.locator('.photo-field img')).toHaveCount(1);
  await append('Descrição',' foto');
  await choose(null);await page.locator('.photo-field .upload').first().click();
  await append('Descrição',' cancelado');
  await page.getByRole('button',{name:'Remover registro',exact:true}).click();
  await page.getByRole('dialog').press('Escape');
  await append('Descrição',' mantido');
  const invalid=path.join(output,'invalido.bcrel');await fs.writeFile(invalid,'inválido');
  await choose(invalid);await page.getByRole('button',{name:'Abrir projeto',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Confirmar',exact:true}).click();
  await expect(page.getByRole('status')).toBeVisible();
  await append('Descrição',' recuperado');
  expect(nativeDialogs).toEqual([]);expect(errors).toEqual([]);
  const result='Digitação por teclas validada após importar projeto, adicionar imagem, cancelar seleção, cancelar confirmação e recusar arquivo inválido. Nenhum window.confirm acionado.';
  await fs.writeFile(path.join(output,'resultado.txt'),result);console.log(result);
}finally{for(const page of await app.windows())await page.evaluate(()=>window.desktop?.setDirty(false)).catch(()=>{});await app.close();}
