import {test,expect} from '@playwright/test';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import {criarModeloExcel,lerPlanilha} from '../src/projeto/planilha';
import {novoProjeto} from '../src/relatorios/qualidade/modelo';
import {novoProjetoObras} from '../src/relatorios/obras/modelo';

const buffer=async(wb:ExcelJS.Workbook)=>Buffer.from(await wb.xlsx.writeBuffer());
function set(ws:ExcelJS.Worksheet,row:number,label:string,value:ExcelJS.CellValue){let col=0;ws.getRow(1).eachCell((c,n)=>{if(c.text===label)col=n;});if(!col)throw Error(label);ws.getCell(row,col).value=value;}
for(const model of ['qualidade','obras'] as const)test('Excel: importar, conferir e preservar '+model,async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:model==='qualidade'?/MODELO DISPONÍVEL.*Relatório de Qualidade/:/MODELO DISPONÍVEL.*Relatório de Avanço/}).click();
 await page.getByLabel(model==='qualidade'?'Projeto / obra':'Nome da obra',{exact:true}).fill('Obra preservada');
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar modelo Excel',exact:true}).click();const download=await downloading;await download.saveAs('test-results/modelo-'+model+'.xlsx');await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();
 const wb=new ExcelJS.Workbook();await wb.xlsx.readFile('test-results/modelo-'+model+'.xlsx');
 if(model==='qualidade'){
  await page.getByRole('button',{name:/02.*Registros de inspeção/}).click();await page.getByRole('button',{name:/Adicionar item/}).click();await page.getByLabel('Descrição',{exact:true}).fill('Item já existente');
  const sheet=wb.getWorksheet('Itens')!;
  for(let row=2;row<=26;row++){set(sheet,row,'Descrição','Inspeção importada '+row);set(sheet,row,'Local','Subsolo');set(sheet,row,'Prioridade','alta');set(sheet,row,'Prazo','18/09/2026');}
  set(sheet,2,'Data do registro',new Date('2026-09-17T00:00:00Z'));
  set(sheet,2,'Data da correção','');
  const image=wb.addImage({buffer:await fs.readFile('src/identidade/simbolo.png'),extension:'png'});sheet.addImage(image,{tl:{col:12,row:1},ext:{width:80,height:40}});
  set(wb.getWorksheet('Avaliação')!,2,'Qualidade','Ótimo');
 }else{
  for(let row=2;row<=5;row++){set(wb.getWorksheet('Fotográficos')!,row,'Serviço realizado','Dutos '+row);set(wb.getWorksheet('Fotográficos')!,row,'Pavimento','Térreo');}
  set(wb.getWorksheet('Descritivos')!,2,'Serviço realizado','Medição');set(wb.getWorksheet('Descritivos')!,2,'Tipo de descrição','Financeiro');set(wb.getWorksheet('Descritivos')!,2,'Resumo/Descrição das atividades realizadas','Atividades concluídas');
 }
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.locator('input[accept=".xlsx"]').setInputFiles({name:'preenchida.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await buffer(wb)});
 await expect(dialog.getByRole('button',{name:'Confirmar importação'})).toBeEnabled();
 await expect(dialog).toContainText(model==='qualidade'?'25 registro(s)':'5 registro(s)');
 await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
 // Cancelar não altera o relatório. Aguarda a prévia terminar de montar antes de contar (no CI ela pode estar sendo refeita).
 await expect(page.getByRole('button',{name:/Exportar PDF/})).toBeEnabled();
 await expect(page.frameLocator('iframe').locator('.record')).toHaveCount(model==='qualidade'?1:0);
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();
 await dialog.locator('input[accept=".xlsx"]').setInputFiles({name:'preenchida.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await buffer(wb)});
 await expect(dialog.getByRole('button',{name:'Confirmar importação'})).toBeEnabled();await dialog.getByRole('button',{name:'Confirmar importação'}).click();
 await expect(page.getByRole('button',{name:/Exportar PDF/})).toBeEnabled();
 if(model==='qualidade'){
  await expect(page.frameLocator('iframe').locator('.record')).toHaveCount(26);
  await expect(page.frameLocator('iframe').locator('.record').nth(1).locator('.evidence img')).toHaveCount(1);
  await expect(page.frameLocator('iframe').locator('.record').nth(1)).toContainText('18/09/2026');
 }else{await expect(page.frameLocator('iframe').locator('.fotografico')).toHaveCount(4);await expect(page.frameLocator('iframe').locator('.descritivo')).toHaveCount(1);}
 await page.getByRole('button',{name:model==='qualidade'?/01.*Informações gerais/:/01.*Capa e contracapa/}).click();await expect(page.getByLabel(model==='qualidade'?'Projeto / obra':'Nome da obra',{exact:true})).toHaveValue('Obra preservada');
 // Invalid input cannot replace existing work.
 const invalid=wb.getWorksheet(model==='qualidade'?'Itens':'Fotográficos')!;invalid.getCell('A1').value='Descrição';invalid.getCell('B1').value='Descrição';
 await page.getByRole('button',{name:'Importar Excel',exact:true}).click();await dialog.locator('input[accept=".xlsx"]').setInputFiles({name:'invalida.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await buffer(wb)});
 await expect(dialog.getByRole('alert')).toBeVisible();await expect(dialog.getByRole('button',{name:'Confirmar importação'})).toBeDisabled();await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
 await expect(page.getByLabel(model==='qualidade'?'Projeto / obra':'Nome da obra',{exact:true})).toHaveValue('Obra preservada');
});

test('Excel: datas, fórmulas, listas e modelo incompatível',async()=>{
 const wb=new ExcelJS.Workbook();await wb.xlsx.load(await criarModeloExcel('qualidade') as unknown as ExcelJS.Buffer);const ws=wb.getWorksheet('Itens')!;
 set(ws,2,'Descrição','Registro válido');set(ws,2,'Prazo',46282);set(ws,2,'Status','aceito');
 let result=await lerPlanilha(new Uint8Array(await buffer(wb)).buffer,novoProjeto());expect(result.erros).toEqual([]);if(result.projeto.modelo!=='qualidade')throw Error();expect(result.projeto.itens[0].prazo).toMatch(/^2026-/);expect(result.projeto.itens[0].status).toBe('Aceito');
 set(ws,2,'Prazo','31/02/2026');set(ws,2,'Status','Finalizado');set(ws,2,'Descrição',{formula:'1+1',result:2});
 result=await lerPlanilha(new Uint8Array(await buffer(wb)).buffer,novoProjeto());expect(result.erros.join(' ')).toContain('data inválida');expect(result.erros.join(' ')).toContain('Status');expect(result.erros.join(' ')).toContain('fórmula');
 await expect(lerPlanilha(new Uint8Array(await buffer(wb)).buffer,novoProjetoObras())).rejects.toThrow('Avanço de Obras');
});
