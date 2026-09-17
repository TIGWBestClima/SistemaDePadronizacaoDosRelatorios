import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const doc = await getDocument({data: new Uint8Array(fs.readFileSync(process.argv[2]))}).promise;
fs.mkdirSync('referencias', {recursive:true});
let output = '';
for(let i=1; i<=doc.numPages; i++) {
  const page = await doc.getPage(i);
  const text = await page.getTextContent();
  output += `\nPÁGINA ${i}\n${text.items.map(x=>x.str).join(' ')}\n`;
  const viewport = page.getViewport({scale:1});
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'), viewport}).promise;
  fs.writeFileSync(`referencias/pagina-${i}.png`, canvas.toBuffer('image/png'));
}
fs.writeFileSync('referencias/conteudo.txt', output);
console.log(output);
