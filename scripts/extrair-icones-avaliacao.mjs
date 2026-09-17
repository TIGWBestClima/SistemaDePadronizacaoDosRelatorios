import fs from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const doc=await getDocument({data:new Uint8Array(await fs.readFile(process.argv[2]))}).promise;
const page=await doc.getPage(25);const scale=3;const viewport=page.getViewport({scale});
const regions=[['atendimento',176,168,49,48],['prazo',284,168,55,48],['seguranca',396,166,49,50],['qualidade',502,168,62,48],['limpeza',611,166,62,51],['desperdicio',721,168,55,48]];
await fs.mkdir('src/identidade/avaliacao',{recursive:true});
for(const [name,x,y,width,height] of regions){
  // Render original vector artwork from its region in the PDF; no redesign.
  const canvas=createCanvas(width*scale,height*scale);
  await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[1,0,0,1,-x*scale,-y*scale],background:'white'}).promise;
  await fs.writeFile(`src/identidade/avaliacao/${name}.png`,canvas.toBuffer('image/png'));
}
for(const [name,n] of [['ruim',3],['regular',4],['bom',5],['otimo',6]])await fs.copyFile(`referencias/imagens/p25-img_p24_${n}.png`,`src/identidade/avaliacao/${name}.png`);
console.log('Seis ícones e quatro carinhas extraídos do PDF original.');
