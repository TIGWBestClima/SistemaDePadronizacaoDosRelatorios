import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {Contornos,classeCor,posicaoNumero} from '../documento/Planta';
import {tituloConclusao} from '../documento/Campo';
import {Field,ImagemBotao,Photo,lerImagem} from './Campos';
import {coresMarcador,novoRegistroCampo,variantes,type Mapa,type Marcador,type ProjetoCampo,type RegistroCampo} from '../relatorios/campo/modelo';
type Props={project:ProjetoCampo;edit:(p:ProjetoCampo)=>void;error:(s:string)=>void;confirmar:(s:string)=>Promise<boolean>};
const n2=(n:number)=>String(n).padStart(2,'0');
export function CampoEditor({project,tab,edit,error,confirmar}:Props&{tab:string}){
 const v=variantes[project.modelo];
 const [selected,setSelected]=useState('');
 const item=project.itens.find(i=>i.id===selected)||project.itens[0];
 const update=(patch:Partial<RegistroCampo>)=>edit({...project,itens:project.itens.map(i=>i.id===item?.id?{...i,...patch}:i)});
 if(tab==='gerais')return <><div className="hint">A capa utiliza o símbolo da Best Clima. Os campos abaixo aparecem na contracapa.</div><div className="fields">{v.gerais.map(f=><Field key={f.key} field={f} value={project.gerais[f.key as keyof ProjetoCampo['gerais']]} change={value=>edit({...project,gerais:{...project.gerais,[f.key]:value}})}/>)}</div></>;
 if(tab==='final')return <><Field field={{key:'conclusao',label:tituloConclusao(project),type:'textarea'}} value={project.conclusao} change={conclusao=>edit({...project,conclusao})}/><div className="hint">A conclusão aparece na última página do relatório. Deixe vazio para omiti-la.</div></>;
 if(tab==='mapas')return <MapasEditor project={project} edit={edit} error={error} confirmar={confirmar}/>;
 async function adicionarFotos(files:File[]){
  if(project.itens.length+files.length>10000)throw new Error('O relatório pode ter até 10.000 registros.');
  const novos:RegistroCampo[]=[];const falhas:string[]=[];
  for(const file of files){try{novos.push({...novoRegistroCampo(),foto:(await lerImagem(file)).src});}catch(err){falhas.push(`${file.name}: ${err instanceof Error?err.message:'imagem inválida.'}`);}}
  if(novos.length){edit({...project,itens:[...project.itens,...novos]});setSelected(novos[0].id);}
  if(falhas.length)error(`${novos.length} foto(s) adicionada(s). Não foi possível adicionar: ${falhas.slice(0,5).join(' ')}${falhas.length>5?` e mais ${falhas.length-5}.`:''}`);
 }
 const curtos=v.item.filter(f=>f.type!=='textarea'),longos=v.item.filter(f=>f.type==='textarea');
 return <><div className="item-tools"><strong>{project.itens.length} registro(s)</strong><button className="primary" onClick={()=>{const i=novoRegistroCampo();edit({...project,itens:[...project.itens,i]});setSelected(i.id);}}>＋ {v.novo}</button></div>
  {project.modelo==='fotografico'&&<div className="multi-photo"><ImagemBotao multiple label="＋ Adicionar várias fotos de uma vez" error={error} escolher={adicionarFotos}/></div>}
  {item?<><label className="field"><span>Registro em edição</span><select value={item.id} onChange={e=>setSelected(e.target.value)}>{project.itens.map((i,n)=><option key={i.id} value={i.id}>{n2(n+1)} · {i.titulo||i.legenda||i.local||'Sem identificação'}</option>)}</select></label>
   <div className="fields">{curtos.map(f=><Field key={f.key} field={f} value={item[f.key as keyof RegistroCampo]} change={value=>update({[f.key]:value})}/>)}</div>
   <div className={v.fotos.length>1?'photo-grid':undefined}>{v.fotos.map(f=><Photo key={f.key} label={f.label} value={item[f.key]} change={value=>update({[f.key]:value})} error={error}/>)}</div>
   {longos.map(f=><Field key={f.key} field={f} value={item[f.key as keyof RegistroCampo]} change={value=>update({[f.key]:value})}/>)}
   <div className="record-actions"><button onClick={()=>move(-1)} disabled={project.itens[0].id===item.id}>↑ Mover para cima</button><button onClick={()=>move(1)} disabled={project.itens.at(-1)!.id===item.id}>↓ Mover para baixo</button></div>
   <button className="danger" onClick={async()=>{if(await confirmar('Remover este registro e suas imagens?'))edit({...project,itens:project.itens.filter(i=>i.id!==item.id),mapas:project.mapas.map(m=>({...m,marcadores:m.marcadores.filter(k=>k.item!==item.id)}))});}}>Remover registro</button></>
  :<div className="empty">Adicione um registro para começar.</div>}</>;
 function move(delta:number){const itens=[...project.itens],from=itens.findIndex(i=>i.id===item.id),to=from+delta;if(to<0||to>=itens.length)return;[itens[from],itens[to]]=[itens[to],itens[from]];edit({...project,itens});}
}
type Cor=typeof coresMarcador[number];
const nomesCor:Record<Cor,string>={clara:'Clara',media:'Média',escura:'Escura'};
function MapasEditor({project,edit,error,confirmar}:Props){
 const [selected,setSelected]=useState(''),[aberto,setAberto]=useState(false);
 const mapa=project.mapas.find(m=>m.id===selected)||project.mapas[0];
 const numero=(id:string)=>project.itens.findIndex(i=>i.id===id)+1;
 const updateMapa=(patch:Partial<Mapa>)=>edit({...project,mapas:project.mapas.map(m=>m.id===mapa.id?{...m,...patch}:m)});
 async function adicionar([file]:File[]){
  if(project.mapas.length>=50)throw new Error('O relatório pode ter até 50 plantas.');
  const img=await lerImagem(file);const novo={id:crypto.randomUUID(),nome:file.name.replace(/\.[^.]+$/,'').slice(0,140),imagem:img.src,proporcao:Math.min(20,Math.max(0.05,img.largura/img.altura)),marcadores:[]};
  edit({...project,mapas:[...project.mapas,novo]});setSelected(novo.id);
 }
 const visiveis=mapa?mapa.marcadores.filter(m=>numero(m.item)>0):[];
 return <><div className="hint">Adicione a planta como imagem (PNG, JPG ou WebP) e clique nela para abrir a marcação. Na janela de marcação, escolha o ponto de limpeza, o tipo (ponto ou contorno) e a cor.</div>
  <div className="item-tools"><strong>{project.mapas.length} planta(s)</strong></div><ImagemBotao label="＋ Adicionar planta" error={error} escolher={adicionar}/>
  {mapa?<><label className="field map-select"><span>Planta em edição</span><select value={mapa.id} onChange={e=>setSelected(e.target.value)}>{project.mapas.map((m,n)=><option key={m.id} value={m.id}>{n+1} · {m.nome||'Planta'}</option>)}</select></label>
   <Field field={{key:'nome',label:'Nome da planta'}} value={mapa.nome} change={nome=>updateMapa({nome})}/>
   <button type="button" className="map-thumb map-surface" aria-label="Abrir planta para marcação" onClick={()=>setAberto(true)}><img src={mapa.imagem} alt="" draggable={false}/><Contornos marcadores={visiveis}/>{visiveis.map(m=><span className={'pin '+classeCor(m)} key={m.id} style={{left:m.x+'%',top:m.y+'%'}}>{n2(numero(m.item))}</span>)}<span className="map-thumb-label">⤢ Clique para marcar</span></button>
   <p className="table-help">{mapa.marcadores.filter(m=>!m.contorno).length} ponto(s) e {mapa.marcadores.filter(m=>m.contorno).length} contorno(s) nesta planta.</p>
   <button className="danger" onClick={async()=>{if(await confirmar('Remover esta planta e seus marcadores?'))edit({...project,mapas:project.mapas.filter(m=>m.id!==mapa.id)});}}>Remover planta</button>
   {aberto&&<MarcacaoPlanta project={project} mapa={mapa} updateMapa={updateMapa} error={error} fechar={()=>setAberto(false)}/>}</>
  :<div className="empty">Nenhuma planta adicionada.</div>}</>;
}
// Janela ampliada da planta: escolha do ponto, do tipo e da cor, e marcação por clique ou contorno.
function MarcacaoPlanta({project,mapa,updateMapa,error,fechar}:{project:ProjetoCampo;mapa:Mapa;updateMapa:(p:Partial<Mapa>)=>void;error:(s:string)=>void;fechar:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [ponto,setPonto]=useState(''),[modo,setModo]=useState<'ponto'|'contorno'>('ponto'),[cor,setCor]=useState<Cor>('escura');
 const [rascunho,setRascunho]=useState<[number,number][]|null>(null);const desenhando=useRef<[number,number][]|null>(null);
 useEffect(()=>{const d=dialog.current!;d.showModal();return()=>d.close();},[]);
 const alvo=project.itens.find(i=>i.id===ponto)||project.itens[0];
 const numero=(id:string)=>project.itens.findIndex(i=>i.id===id)+1;
 const visiveis=mapa.marcadores.filter(m=>numero(m.item)>0);
 const coordenada=(e:PointerEvent<HTMLDivElement>):[number,number]=>{const r=e.currentTarget.getBoundingClientRect();return [Math.min(100,Math.max(0,(e.clientX-r.left)/r.width*100)),Math.min(100,Math.max(0,(e.clientY-r.top)/r.height*100))];};
 function marcar(m:Omit<Marcador,'id'|'item'|'cor'>){if(!alvo)return;if(mapa.marcadores.length>=2000){error('Cada planta pode ter até 2.000 marcadores.');return;}updateMapa({marcadores:[...mapa.marcadores,{id:crypto.randomUUID(),item:alvo.id,cor,...m}]});}
 // Contorno à mão livre: amostra o traço a cada ~0,6% de deslocamento e fecha a forma ao soltar.
 function iniciar(e:PointerEvent<HTMLDivElement>){if(!alvo||e.button!==0||(e.target as HTMLElement).closest('.pin'))return;const c=coordenada(e);if(modo==='ponto'){marcar({x:c[0],y:c[1]});return;}e.currentTarget.setPointerCapture(e.pointerId);desenhando.current=[c];setRascunho([c]);}
 function mover(e:PointerEvent<HTMLDivElement>){const pts=desenhando.current;if(!pts)return;const c=coordenada(e),u=pts[pts.length-1];if(Math.hypot(c[0]-u[0],c[1]-u[1])<0.6||pts.length>=500)return;pts.push(c);setRascunho([...pts]);}
 function concluir(){const pts=desenhando.current;desenhando.current=null;setRascunho(null);if(!pts)return;const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);if(pts.length<3||Math.max(...xs)-Math.min(...xs)+Math.max(...ys)-Math.min(...ys)<2){error('Contorno muito pequeno. Arraste o mouse em volta do duto.');return;}const [x,y]=posicaoNumero(pts);marcar({x,y,contorno:pts.map(([a,b])=>[Math.round(a*100)/100,Math.round(b*100)/100])});}
 // A área de marcação mantém a proporção da planta e cabe na janela.
 const altura=`min(calc(94vh - 260px), calc((min(1400px, 94vw) - 44px) / ${mapa.proporcao}))`;
 return <dialog ref={dialog} className="map-dialog" aria-labelledby="map-dialog-title" onCancel={e=>{e.preventDefault();fechar();}}>
  <div className="map-dialog-head"><div><small>MARCAÇÃO DA PLANTA</small><h2 id="map-dialog-title">{mapa.nome||'Planta'}</h2></div><div className="actions"><button type="button" disabled={!mapa.marcadores.length} onClick={()=>updateMapa({marcadores:mapa.marcadores.slice(0,-1)})}>↶ Desfazer última</button><button type="button" className="primary" onClick={fechar}>Concluir</button></div></div>
  {alvo?<div className="map-dialog-tools">
   <label className="field"><span>Ponto de limpeza</span><select aria-label="Ponto a marcar" value={alvo.id} onChange={e=>setPonto(e.target.value)}>{project.itens.map((i,n)=><option key={i.id} value={i.id}>{n2(n+1)} · {i.titulo||i.local||'Ponto sem identificação'}</option>)}</select></label>
   <div className="tool-group"><span>Tipo de marcação</span><div className="mode-toggle" role="group" aria-label="Tipo de marcação"><button type="button" aria-pressed={modo==='ponto'} className={modo==='ponto'?'active':undefined} onClick={()=>setModo('ponto')}>● Ponto</button><button type="button" aria-pressed={modo==='contorno'} className={modo==='contorno'?'active':undefined} onClick={()=>setModo('contorno')}>✎ Contornar duto</button></div></div>
   <div className="tool-group"><span>Cor · {nomesCor[cor]}</span><div className="swatches" role="group" aria-label="Cor da marcação">{coresMarcador.map(c=><button type="button" key={c} className={`swatch cor-${c}${cor===c?' active':''}`} aria-pressed={cor===c} aria-label={'Cor '+nomesCor[c].toLowerCase()} title={nomesCor[c]} onClick={()=>setCor(c)}/>)}</div></div>
  </div>:<div className="map-dialog-tools"><div className="empty">Cadastre os pontos de limpeza para marcá-los na planta.</div></div>}
  <div className="map-dialog-body"><div className={'map-editor map-surface'+(alvo?' marking':'')} style={{height:altura,aspectRatio:String(mapa.proporcao)}} aria-label="Planta para marcação" onPointerDown={iniciar} onPointerMove={mover} onPointerUp={concluir} onPointerCancel={()=>{desenhando.current=null;setRascunho(null);}}>
   <img src={mapa.imagem} alt={mapa.nome||'Planta'} draggable={false}/><Contornos marcadores={visiveis} rascunho={rascunho||undefined}/>{visiveis.map(m=><button type="button" className={'pin '+classeCor(m)} key={m.id} style={{left:m.x+'%',top:m.y+'%'}} title={m.contorno?'Remover contorno':'Remover marcador'} aria-label={'Remover marcador '+n2(numero(m.item))} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();updateMapa({marcadores:mapa.marcadores.filter(k=>k.id!==m.id)});}}>{n2(numero(m.item))}</button>)}
  </div></div>
 </dialog>;
}
