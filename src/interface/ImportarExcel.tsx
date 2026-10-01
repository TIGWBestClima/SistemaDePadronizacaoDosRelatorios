import {useEffect,useRef,useState} from 'react';
import type {Projeto} from '../relatorios/modelo';
import type {RevisaoExcel} from '../projeto/planilha';
import {escolherArquivo} from './arquivos';
import {catalogo} from '../relatorios/catalogo';

export function ImportarExcel({project,apply,disabled,notify}:{project:Projeto;apply:(p:Projeto)=>void;disabled:boolean;notify:(s:string)=>void}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[message,setMessage]=useState('');
 const [review,setReview]=useState<RevisaoExcel|null>(null),[filename,setFilename]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 async function template(){
  setLoading(true);setMessage('');
  try{
   if(project.modelo==='assessment'||project.modelo==='financeiro')return;
   const {criarModeloExcel}=await import('../projeto/planilha');const bytes=await criarModeloExcel(project.modelo);
   if(window.desktop)await window.desktop.saveSpreadsheet(bytes,project.modelo);
   else{const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=`modelo-${project.modelo}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }catch(e){const message=e instanceof Error?e.message:'Falha ao gerar o modelo.';if(open)setMessage(message);else notify(message);}finally{setLoading(false);}
 }
 async function read(file:File|null){
  if(!file)return;setLoading(true);setReview(null);setMessage('');setFilename(file.name);
  try{if(!/\.xlsx$/i.test(file.name))throw new Error('Selecione um arquivo Excel .xlsx.');if(file.size>50*1024*1024)throw new Error('Use uma planilha de até 50 MB.');const {lerPlanilha}=await import('../projeto/planilha');setReview(await lerPlanilha(await file.arrayBuffer(),project));}
  catch(e){setMessage(e instanceof Error?e.message:'Não foi possível ler a planilha.');}finally{setLoading(false);}
 }
 async function choose(){if(window.desktop){try{await read(await escolherArquivo('spreadsheet'));}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível abrir o arquivo.');}}else input.current?.click();}
 return <><button type="button" disabled={disabled||loading} onClick={()=>{setReview(null);setMessage('');setOpen(true);}}>Importar Excel</button>
 <dialog ref={dialog} className="excel-dialog" aria-labelledby="excel-title" onCancel={e=>{e.preventDefault();if(!loading)setOpen(false);}}>
  <h2 id="excel-title">Importar Excel — {catalogo.find(m=>m.id===project.modelo)?.curto}</h2>
  <p>Use a planilha-modelo deste relatório. Os registros serão acrescentados aos {project.itens.length} já existentes.</p>
  <p className="excel-help">As informações gerais e a avaliação preenchidas na planilha atualizarão os respectivos campos. Campos vazios e fotos existentes serão preservados. Uma segunda importação da mesma planilha acrescenta os registros novamente.</p>
  <div className="excel-actions"><button disabled={loading} onClick={choose}>{review?'Escolher outra planilha':'Selecionar planilha Excel'}</button><button disabled={loading} onClick={template}>Baixar modelo Excel</button></div>
  <input ref={input} hidden type="file" accept=".xlsx" onChange={async e=>{const file=e.target.files?.[0]??null;e.target.value='';await read(file);}}/>
  {loading&&<p role="status">Processando planilha…</p>}{message&&<p className="excel-error" role="alert">{message}</p>}
  {review&&<div className="excel-review"><h3>{filename}</h3><p><strong>{review.quantidade} registro(s)</strong> e <strong>{review.fotos} foto(s)</strong> encontrados.</p>
   {review.campos.length>0&&<p>Campos que serão atualizados: {review.campos.join(', ')}.</p>}
   {review.erros.length>0&&<div role="alert" className="excel-error"><strong>Corrija os erros antes de importar. Nenhum dado foi aplicado.</strong><ul>{review.erros.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
   {review.avisos.length>0&&<details><summary>Avisos ({review.avisos.length})</summary><ul>{review.avisos.map((s,i)=><li key={i}>{s}</li>)}</ul></details>}
   {review.previa.length>0&&<><h3>Primeiros registros</h3><ul className="excel-preview">{review.previa.map((r,i)=><li key={i}><strong>{r.aba}, linha {r.linha}</strong><span>{r.resumo.slice(0,180)}</span></li>)}</ul></>}
  </div>}
  <div className="excel-actions excel-footer"><button disabled={loading} onClick={()=>setOpen(false)}>Cancelar</button><button className="primary" disabled={loading||!review||review.erros.length>0} onClick={()=>{if(review&&!review.erros.length){apply(review.projeto);setOpen(false);setReview(null);notify(`${review.quantidade} registro(s) importado(s) com sucesso.`);}}}>Confirmar importação</button></div>
 </dialog></>;
}
