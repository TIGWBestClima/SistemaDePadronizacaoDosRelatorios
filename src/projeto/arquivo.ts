import JSZip from 'jszip';
import {modelos,projetoSchema,semImagens,type Projeto} from '../relatorios/modelo';
export async function salvarProjeto(projeto:Projeto){
  const p=structuredClone(projetoSchema.parse(projeto));
  const zip=new JSZip();
  let n=0;
  const store=(data:string)=>{
    if(!data)return '';
    const [header,bytes]=data.split(','); const ext=header.includes('jpeg')?'jpeg':header.includes('webp')?'webp':'png';
    const name=`imagens/${++n}.${ext}`; zip.file(name,bytes,{base64:true});return name;
  };
  if(p.modelo==='qualidade'){p.capa=store(p.capa);p.itens.forEach(i=>{i.foto=store(i.foto);i.fotoCorrecao=store(i.fotoCorrecao);});}else if(p.modelo==='obras')p.itens.forEach(i=>{i.foto=store(i.foto);});
  else if(p.modelo!=='assessment'&&p.modelo!=='financeiro'){p.itens.forEach(i=>{i.foto=store(i.foto);i.fotoDepois=store(i.fotoDepois);});p.mapas.forEach(m=>{m.imagem=store(m.imagem);});}
  zip.file('manifesto.json',JSON.stringify({formato:1,modelo:p.modelo,versaoModelo:p.versaoModelo}));
  zip.file('dados.json',JSON.stringify(p));
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}
export async function abrirProjeto(bytes:ArrayBuffer):Promise<Projeto>{
  if(bytes.byteLength>200*1024*1024)throw new Error('O projeto excede 200 MB.');
  const zip=await JSZip.loadAsync(bytes);
  // Check declared uncompressed sizes before extracting a project archive.
  let size=0;
  for(const file of Object.values(zip.files)){
    size+=(file as unknown as {_data?:{uncompressedSize:number}})._data?.uncompressedSize??0;
    if(size>250*1024*1024)throw new Error('Conteúdo descompactado excede 250 MB.');
  }
  const manifest=JSON.parse(await zip.file('manifesto.json')?.async('string')??'null');
  if(manifest?.formato!==1||!(modelos as readonly string[]).includes(manifest?.modelo)||manifest?.versaoModelo!==1)throw new Error('Formato ou modelo incompatível com esta versão.');
  const raw=JSON.parse(await zip.file('dados.json')?.async('string')??'null');
  if(!raw||!Array.isArray(raw.itens)||raw.modelo!==manifest.modelo||raw.formato!==manifest.formato||raw.versaoModelo!==manifest.versaoModelo)throw new Error('Projeto inválido.');
  const restore=async(name:unknown)=>{
    if(name==='')return '';
    if(typeof name!=='string'||!/^imagens\/\d+\.(png|jpeg|webp)$/.test(name))throw new Error('Referência de imagem inválida.');
    const file=zip.file(name);if(!file)throw new Error('Imagem ausente no projeto.');
    return `data:image/${name.split('.').pop()};base64,${await file.async('base64')}`;
  };
  if(semImagens(raw.modelo))return projetoSchema.parse(raw);
  if(raw.modelo==='qualidade')raw.capa=await restore(raw.capa);
  for(const item of raw.itens){item.foto=await restore(item.foto);if(raw.modelo==='qualidade')item.fotoCorrecao=await restore(item.fotoCorrecao);else if(raw.modelo!=='obras')item.fotoDepois=await restore(item.fotoDepois);}
  if(raw.modelo!=='qualidade'&&raw.modelo!=='obras'){if(!Array.isArray(raw.mapas))throw new Error('Projeto inválido.');for(const mapa of raw.mapas)mapa.imagem=await restore(mapa.imagem);}
  return projetoSchema.parse(raw);
}
