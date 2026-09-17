import type {Campo} from '../relatorios/qualidade/modelo';
import {escolherArquivo} from './arquivos';
export function Field({field,value,change}:{field:Campo;value:string;change:(value:string)=>void}){
  return <label className={field.type==='textarea'?'field wide':'field'}><span>{field.label}</span>{field.options?<select aria-label={field.label} value={value} onChange={e=>change(e.target.value)}>{field.options.map(v=><option key={v}>{v}</option>)}</select>:field.type==='textarea'?<textarea aria-label={field.label} rows={4} maxLength={100000} value={value} onChange={e=>change(e.target.value)}/>:<input aria-label={field.label} type={field.type||'text'} maxLength={140} value={value} onChange={e=>change(e.target.value)}/>}</label>;
}
export function Photo({label,value,change,error}:{label:string;value:string;change:(v:string)=>void;error:(v:string)=>void}){
  async function importar(file:File|null){
    if(!file)return;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use imagens PNG, JPG ou WebP.');
      if(file.size>10*1024*1024)throw new Error('Cada imagem pode ter até 10 MB.');
      const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
      const image=new Image();image.src=data;await image.decode();if(image.width*image.height>40_000_000)throw new Error('Use uma imagem com até 40 megapixels.');change(data);
    }catch(err){error(err instanceof Error?err.message:'Não foi possível abrir a imagem.');}
  }
  return <div className="photo-field"><span>{label}</span>{value&&<img src={value} alt={label}/>}<label className="upload" onClick={async e=>{
    if(window.desktop){e.preventDefault();try{await importar(await escolherArquivo('image'));}catch(err){error(err instanceof Error?err.message:'Não foi possível abrir a imagem.');}}
  }}>{value?'Substituir imagem':'＋ Selecionar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0]??null;e.target.value='';await importar(file);}}/></label>{value&&<button className="text-button" onClick={()=>change('')}>Remover imagem</button>}</div>;
}
