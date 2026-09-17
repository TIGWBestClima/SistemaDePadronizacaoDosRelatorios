import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {novoProjeto,novoItem} from '../src/relatorios/qualidade/modelo.ts';
const output=path.resolve('verificacao/layout-horizontal');await fs.mkdir(output,{recursive:true});
const project=novoProjeto();
project.gerais={cliente:'IDEA EMPREENDIMENTOS 30 LTDA',obra:'RFM - DAMATA',numero:'01',revisao:'R00',visita:'2026-07-22',emissao:'2026-08-11',retorno:'2026-08-20',responsavel:'Denis Muniz dos Santos',endereco:'Rua Da Mata, 80 – Itaim Bibi\nSão Paulo/SP – Cep 04531-020'};
project.capa='imagens/1.png';
project.itens=['Rede de dutos desalinhada na passagem pela alvenaria. Rede elétrica e frigorífica sem suportes e válvulas do tipo GBC próxima a alvenaria','Rede de dutos com aberturas na chapa','Rede de dutos desalinhada na passagem pela alvenaria'].map((descricao,index)=>({...novoItem(),descricao,disciplina:index===0?'Rede de dutos, elétrica e frigorífica':'Rede de Dutos',local:'Pavimento Tipo',prioridade:'Alta',responsavel:'Cyro Rodrigues das Neves',status:'Recusado',prazo:'2026-08-20',foto:`imagens/${index+2}.png`}));
project.avaliacao={Atendimento:'Regular',Prazo:'Regular',Segurança:'Bom',Qualidade:'Regular',Limpeza:'Bom',Desperdício:'Bom'};
project.itens[1].correcao='2026-08-19';
const zip=new JSZip();zip.file('manifesto.json',JSON.stringify({formato:1,modelo:'qualidade',versaoModelo:1}));zip.file('dados.json',JSON.stringify(project));
const names=['p1-img_p0_2.png','p2-img_p1_2.png','p2-img_p1_3.png','p2-img_p1_4.png'];
for(let i=0;i<names.length;i++)zip.file(`imagens/${i+1}.png`,await fs.readFile('referencias/imagens/'+names[i]));
const projectPath=path.join(output,'exemplo-qualidade.bcrel');await fs.writeFile(projectPath,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>key!=='ELECTRON_RUN_AS_NODE'));
const app=await electron.launch({args:['.','--headless'],env:environment,timeout:30000});
try{
  const page=await app.firstWindow();await page.locator('input[accept=".bcrel"]').setInputFiles(projectPath);
  await expect(page.getByRole('button',{name:'Exportar PDF'})).toBeEnabled({timeout:30000});
  const frame=page.frameLocator('iframe');await expect(frame.locator('.records-page')).toHaveCount(1);
  await expect(frame.locator('.records-page tbody tr')).toHaveCount(3);
  await expect(frame.locator('.inspection-table th')).toHaveCount(12);
  await expect(frame.locator('.criterion-icon')).toHaveCount(6);
  await expect(frame.locator('.assessment-table .rating-face')).toHaveCount(6);
  await expect(frame.locator('.rating-scale .rating-face')).toHaveCount(4);
  await expect(frame.locator('.correction-pending')).toHaveCount(2);
  await expect(frame.locator('.correction-pending').first()).toHaveText('Correção não realizada até o momento');
  await expect(frame.locator('.record').nth(1).locator('td:last-child .evidence span')).toHaveText('19/08/2026');
  const pageCount=await frame.locator('.page').count();assert.equal(pageCount,5);
  assert(await frame.locator('.page').first().evaluate(el=>el.clientWidth>el.clientHeight));
  assert.equal(await frame.locator('.page main').evaluateAll(nodes=>nodes.some(n=>n.scrollHeight>n.clientHeight+1)),false);
  await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:output+'/qualidade-horizontal.pdf'});},output);
  await page.getByRole('button',{name:'Exportar PDF'}).click();await expect(page.getByRole('status')).toContainText('PDF exportado',{timeout:30000});
  const pdf=await getDocument({data:new Uint8Array(await fs.readFile(path.join(output,'qualidade-horizontal.pdf')))}).promise;
  assert.equal(pdf.numPages,pageCount);
  for(let i=1;i<=pdf.numPages;i++){
    const p=await pdf.getPage(i);const viewport=p.getViewport({scale:1.333333});assert(viewport.width>viewport.height);
    if(i<=2||i===pdf.numPages-1){const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;await fs.writeFile(path.join(output,i===1?'capa.png':i===2?'itens.png':'avaliacao.png'),canvas.toBuffer('image/png'));}
  }
  const content=await (await pdf.getPage(2)).getTextContent();for(const word of ['001','002','003','Recusado'])assert(content.items.some(v=>v.str.includes(word)));
  assert(content.items.map(v=>v.str).join(' ').includes('Correção não realizada até o momento'));
  assert(content.items.map(v=>v.str).join(' ').includes('19/08/2026'));
  const assessmentText=(await (await pdf.getPage(pdf.numPages-1)).getTextContent()).items.map(v=>v.str).join(' ');
  for(const label of ['LEGENDA','Ruim','Regular','Bom','Ótimo','Não avaliado'])assert(assessmentText.includes(label));
  console.log('Avaliação e correção validadas: seis ícones, carinhas, legenda e data/ausência de correção no PDF.');
  console.log('Layout validado: A4 horizontal em todas as páginas, capa com selo, 12 colunas e 3 registros por página. PDF e prévia com 5 páginas.');
}finally{for(const page of await app.windows())await page.evaluate(()=>window.desktop?.setDirty(false)).catch(()=>{});await app.close();}
