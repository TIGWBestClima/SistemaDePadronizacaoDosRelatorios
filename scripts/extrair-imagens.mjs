import fs from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdf=await getDocument({data:new Uint8Array(await fs.readFile(process.argv[2]))}).promise;
await fs.mkdir('referencias/imagens',{recursive:true});
for(const n of (process.argv.length > 3 ? process.argv.slice(3).map(Number) : [1,2])){
  const page=await pdf.getPage(n);const operators=await page.getOperatorList();
  for(let i=0;i<operators.fnArray.length;i++){
    if(operators.fnArray[i]!==OPS.paintImageXObject)continue;
    const id=operators.argsArray[i][0];const image=await new Promise(resolve=>page.objs.get(id,resolve));
    const canvas=createCanvas(image.width,image.height);const context=canvas.getContext('2d');
    if(image.bitmap)context.drawImage(image.bitmap,0,0);
    else{
      const pixels=context.createImageData(image.width,image.height);
      for(let p=0;p<image.width*image.height;p++){
        const channels=image.data.length/(image.width*image.height);
        if(channels!==3&&channels!==4)throw new Error('Formato não tratado: '+channels);
        for(let c=0;c<3;c++)pixels.data[p*4+c]=image.data[p*channels+c];
        pixels.data[p*4+3]=channels===4?image.data[p*4+3]:255;
      }
      context.putImageData(pixels,0,0);
    }
    const filename=`referencias/imagens/p${n}-${id}.png`;await fs.writeFile(filename,canvas.toBuffer('image/png'));
    console.log(JSON.stringify({filename,width:image.width,height:image.height}));
  }
}
