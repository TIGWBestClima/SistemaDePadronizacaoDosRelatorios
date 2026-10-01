import type {Campo} from '../relatorios/qualidade/modelo';
import {escolherArquivo,escolherImagens} from './arquivos';
export function Field({field,value,change}:{field:Campo;value:string;change:(value:string)=>void}){
  return <label className={field.type==='textarea'?'field wide':'field'}><span>{field.label}</span>{field.options?<select aria-label={field.label} value={value} onChange={e=>change(e.target.value)}>{field.options.map(v=><option key={v}>{v}</option>)}</select>:field.type==='textarea'?<textarea aria-label={field.label} rows={4} maxLength={100000} value={value} onChange={e=>change(e.target.value)}/>:<input aria-label={field.label} type={field.type||'text'} maxLength={140} value={value} onChange={e=>change(e.target.value)}/>}</label>;
}
export async function lerImagem(file:File){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use imagens PNG, JPG ou WebP.');
  if(file.size>10*1024*1024)throw new Error('Cada imagem pode ter até 10 MB.');
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
  const image=new Image();image.src=data;await image.decode();if(image.width*image.height>40_000_000)throw new Error('Use uma imagem com até 40 megapixels.');
  return {src:data,largura:image.width,altura:image.height};
}
// Botão de seleção de imagens: diálogo nativo no aplicativo, input de arquivo no navegador.
export function ImagemBotao({label,multiple=false,escolher,error}:{label:string;multiple?:boolean;escolher:(files:File[])=>Promise<void>;error:(v:string)=>void}){
  const run=async(files:File[])=>{if(!files.length)return;try{await escolher(files);}catch(err){error(err instanceof Error?err.message:'Não foi possível abrir a imagem.');}};
  return <label className="upload" onClick={async e=>{
    if(window.desktop){e.preventDefault();try{await run(multiple?await escolherImagens():[await escolherArquivo('image')].filter((f):f is File=>!!f));}catch(err){error(err instanceof Error?err.message:'Não foi possível abrir a imagem.');}}
  }}>{label}<input type="file" multiple={multiple} accept="image/png,image/jpeg,image/webp" onChange={async e=>{const files=[...e.target.files??[]];e.target.value='';await run(files);}}/></label>;
}
export function Photo({label,value,change,error}:{label:string;value:string;change:(v:string)=>void;error:(v:string)=>void}){
  return <div className="photo-field"><span>{label}</span>{value&&<img src={value} alt={label}/>}<ImagemBotao label={value?'Substituir imagem':'＋ Selecionar imagem'} error={error} escolher={async([file])=>change((await lerImagem(file)).src)}/>{value&&<button className="text-button" onClick={()=>change('')}>Remover imagem</button>}</div>;
}
