import {Field} from './Campos';
import {classificacoes,escala,grupos,media,nomeNota,novaAcao,novaCompetencia,novaMeta,statusMeta,tiposAvaliacao,type ProjetoAssessment} from '../relatorios/assessment/modelo';
type Props={project:ProjetoAssessment;tab:string;edit:(p:ProjetoAssessment)=>void;confirmar:(s:string)=>Promise<boolean>};
type Lista='itens'|'metas'|'pdi';
const LIMITE=60;
export function AssessmentEditor({project,tab,edit,confirmar}:Props){
 const g=project.gerais,geral=(key:keyof ProjetoAssessment['gerais'])=>(value:string)=>edit({...project,gerais:{...g,[key]:value}});
 // Atualiza um item de uma das listas (competências, metas ou PDI).
 function alterar<K extends Lista>(lista:K,id:string,patch:Partial<ProjetoAssessment[K][number]>){edit({...project,[lista]:(project[lista] as {id:string}[]).map(i=>i.id===id?{...i,...patch}:i)});}
 async function remover(lista:Lista,id:string,nome:string){if(await confirmar(`Remover ${nome}?`))edit({...project,[lista]:(project[lista] as {id:string}[]).filter(i=>i.id!==id)});}
 const adicionar=(lista:Lista,item:{id:string})=>{if(project[lista].length<LIMITE)edit({...project,[lista]:[...project[lista],item]});};
 if(tab==='gerais')return <><div className="hint">A capa utiliza o símbolo da Best Clima. O nome do colaborador aparece como título da contracapa.</div><div className="fields">
  <Field field={{key:'colaborador',label:'Colaborador'}} value={g.colaborador} change={geral('colaborador')}/><Field field={{key:'cargo',label:'Cargo'}} value={g.cargo} change={geral('cargo')}/>
  <Field field={{key:'setor',label:'Setor / área'}} value={g.setor} change={geral('setor')}/><Field field={{key:'avaliador',label:'Avaliador (gestor)'}} value={g.avaliador} change={geral('avaliador')}/>
  <Field field={{key:'periodo',label:'Período avaliado'}} value={g.periodo} change={geral('periodo')}/><Field field={{key:'data',label:'Data da avaliação',type:'date'}} value={g.data} change={geral('data')}/>
  <Field field={{key:'tipo',label:'Tipo de avaliação',options:tiposAvaliacao}} value={g.tipo} change={geral('tipo')}/><Field field={{key:'tipoRelatorio',label:'Tipo de relatório'}} value={g.tipoRelatorio} change={geral('tipoRelatorio')}/>
 </div></>;
 if(tab==='itens'){const m=media(project.itens);return <>
  <div className="hint">Escala: {escala.map(e=>`${e.nota} — ${e.nome}`).join(' · ')}. Competências sem nota não entram na média.</div>
  <div className="item-tools"><strong>{project.itens.length} competência(s) · média {m===null?'—':m.toLocaleString('pt-BR',{maximumFractionDigits:1})}</strong><button className="primary" disabled={project.itens.length>=LIMITE} onClick={()=>adicionar('itens',novaCompetencia())}>＋ Adicionar competência</button></div>
  {project.itens.map((c,n)=><section className="list-card" key={c.id}>
   <div className="fields"><Field field={{key:'nome',label:`Competência ${n+1}`}} value={c.nome} change={nome=>alterar('itens',c.id,{nome})}/><Field field={{key:'grupo',label:`Grupo da competência ${n+1}`,options:grupos}} value={c.grupo} change={grupo=>alterar('itens',c.id,{grupo:grupo as typeof grupos[number]})}/></div>
   <div className="nota-escolha" role="group" aria-label={`Nota de ${c.nome||'competência '+(n+1)}`}>{escala.map(e=><button type="button" key={e.nota} title={e.nome} aria-pressed={c.nota===e.nota} className={c.nota===e.nota?'active':undefined} onClick={()=>alterar('itens',c.id,{nota:c.nota===e.nota?0:e.nota})}>{e.nota}</button>)}<span>{nomeNota(c.nota)}</span></div>
   <Field field={{key:'comentario',label:`Comentário da competência ${n+1}`}} value={c.comentario} change={comentario=>alterar('itens',c.id,{comentario})}/>
   <button type="button" className="text-button remove" onClick={()=>remover('itens',c.id,'esta competência')}>Remover competência</button>
  </section>)}</>;}
 if(tab==='metas')return <><div className="item-tools"><strong>{project.metas.length} meta(s)</strong><button className="primary" disabled={project.metas.length>=LIMITE} onClick={()=>adicionar('metas',novaMeta())}>＋ Adicionar meta</button></div>
  {project.metas.length?project.metas.map((m,n)=><section className="list-card" key={m.id}><div className="fields">
   <Field field={{key:'descricao',label:`Meta ${n+1}`}} value={m.descricao} change={descricao=>alterar('metas',m.id,{descricao})}/><Field field={{key:'indicador',label:`Indicador da meta ${n+1}`}} value={m.indicador} change={indicador=>alterar('metas',m.id,{indicador})}/>
   <Field field={{key:'resultado',label:`Resultado da meta ${n+1}`}} value={m.resultado} change={resultado=>alterar('metas',m.id,{resultado})}/><Field field={{key:'status',label:`Status da meta ${n+1}`,options:statusMeta}} value={m.status} change={status=>alterar('metas',m.id,{status:status as typeof statusMeta[number]})}/>
  </div><button type="button" className="text-button remove" onClick={()=>remover('metas',m.id,'esta meta')}>Remover meta</button></section>):<div className="empty">Sem metas, a página de metas não aparece no relatório.</div>}</>;
 if(tab==='desenvolvimento')return <>
  <Field field={{key:'pontosFortes',label:'Pontos fortes',type:'textarea'}} value={project.pontosFortes} change={pontosFortes=>edit({...project,pontosFortes})}/>
  <Field field={{key:'desenvolvimento',label:'Pontos a desenvolver',type:'textarea'}} value={project.desenvolvimento} change={desenvolvimento=>edit({...project,desenvolvimento})}/>
  <div className="item-tools pdi-tools"><strong>PDI · {project.pdi.length} ação(ões)</strong><button className="primary" disabled={project.pdi.length>=LIMITE} onClick={()=>adicionar('pdi',novaAcao())}>＋ Adicionar ação</button></div>
  {project.pdi.map((a,n)=><section className="list-card" key={a.id}><Field field={{key:'acao',label:`Ação de desenvolvimento ${n+1}`}} value={a.acao} change={acao=>alterar('pdi',a.id,{acao})}/><div className="fields">
   <Field field={{key:'prazo',label:`Prazo da ação ${n+1}`,type:'date'}} value={a.prazo} change={prazo=>alterar('pdi',a.id,{prazo})}/><Field field={{key:'responsavel',label:`Responsável pela ação ${n+1}`}} value={a.responsavel} change={responsavel=>alterar('pdi',a.id,{responsavel})}/>
  </div><button type="button" className="text-button remove" onClick={()=>remover('pdi',a.id,'esta ação')}>Remover ação</button></section>)}</>;
 return <><Field field={{key:'classificacao',label:'Classificação final',options:classificacoes}} value={project.classificacao} change={classificacao=>edit({...project,classificacao:classificacao as typeof classificacoes[number]})}/>
  <Field field={{key:'parecer',label:'Parecer do avaliador',type:'textarea'}} value={project.parecer} change={parecer=>edit({...project,parecer})}/>
  <div className="hint">A última página traz as linhas de assinatura do colaborador, do avaliador e do RH.</div></>;
}
