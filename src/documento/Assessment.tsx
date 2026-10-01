import type {ReactNode} from 'react';
import {Pagina,Texto,date,documentoBase} from './Campo';
import css from '../identidade/paineis.css?inline';
import {escala,grupos,media,nomeNota,type ProjetoAssessment,type Meta} from '../relatorios/assessment/modelo';
// Linhas por página nas tabelas (campos curtos têm altura limitada, então a divisão é fixa).
const POR_PAGINA={competencias:7,metas:7,pdi:9};
function partes<T>(lista:T[],tamanho:number){const r:T[][]=[];for(let i=0;i<lista.length;i+=tamanho)r.push(lista.slice(i,i+tamanho));return r;}
const decimal=(v:number)=>v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const iconeStatus:Record<Meta['status'],string>={'Atingida':'✓','Parcialmente atingida':'◐','Não atingida':'✕','Em andamento':'…'};
const classeStatus:Record<Meta['status'],string>={'Atingida':'good','Parcialmente atingida':'warning','Não atingida':'critical','Em andamento':'neutral'};
const Barra=({nota}:{nota:number})=><div className="score-track" aria-hidden="true">{[1,2,3,4,5].map(n=><span key={n} className="tick" style={{left:`${n*20}%`}}/>)}{nota>0&&<span className="score-fill" style={{width:`${nota*20}%`}}/>}</div>;
export function documentHtmlAssessment(p:ProjetoAssessment){
 const g=p.gerais,rodape=[g.colaborador,g.cargo].filter(Boolean).join(' · ');
 const geral=media(p.itens);
 const porGrupo=grupos.map(nome=>({nome,valor:media(p.itens.filter(i=>i.grupo===nome))})).filter(x=>p.itens.some(i=>i.grupo===x.nome));
 const pag=(key:string,classe:string,rotulo:string,titulo:string,children:ReactNode,sub=g.colaborador||'Colaborador')=><Pagina key={key} classe={classe} rotulo={rotulo} titulo={titulo} sub={sub} obra={rodape}>{children}</Pagina>;
 const dados:[string,string][]=[['Colaborador',g.colaborador],['Cargo',g.cargo],['Setor / área',g.setor],['Avaliador',g.avaliador],['Período avaliado',g.periodo],['Data da avaliação',date(g.data)],['Tipo de avaliação',g.tipo]];
 const paginas=[
  pag('resumo','rh-resumo','RESUMO DA AVALIAÇÃO','Visão geral',<>
   <dl className="dados">{dados.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'—'}</dd></div>)}</dl>
   <section className="score-card"><small>Média geral das competências</small><div className="hero">{geral===null?'—':decimal(geral)}<span> / 5</span></div><strong>{geral===null?'Nenhuma competência avaliada':nomeNota(Math.round(geral))}</strong>
    {p.classificacao!=='Não definida'&&<p className="classificacao">Classificação final: <b>{p.classificacao}</b></p>}
    <ul className="group-bars">{porGrupo.map(x=><li key={x.nome}><span>{x.nome}</span><Barra nota={x.valor??0}/><b>{x.valor===null?'—':decimal(x.valor)}</b></li>)}</ul>
    <p className="escala">Escala: {escala.map(e=>`${e.nota} ${e.nome}`).join(' · ')}</p>
   </section></>),
  ...partes(p.itens,POR_PAGINA.competencias).map((lista,k)=>pag('comp'+k,'rh-tabela','COMPETÊNCIAS','Avaliação por competência',<table className="rh-table competencias"><thead><tr><th>Competência</th><th>Nota</th><th>Desempenho</th><th>Comentário</th></tr></thead><tbody>{lista.map(c=><tr key={c.id}><td><strong>{c.nome||'Competência'}</strong><small>{c.grupo}</small></td><td><Barra nota={c.nota}/></td><td className="nota">{c.nota?<><b>{c.nota}</b> {nomeNota(c.nota)}</>:'Não avaliada'}</td><td>{c.comentario}</td></tr>)}</tbody></table>)),
  ...partes(p.metas,POR_PAGINA.metas).map((lista,k)=>pag('metas'+k,'rh-tabela','METAS E RESULTADOS','Metas do período',<table className="rh-table"><thead><tr><th>Meta</th><th>Indicador</th><th>Resultado</th><th>Status</th></tr></thead><tbody>{lista.map(m=><tr key={m.id}><td><strong>{m.descricao||'Meta'}</strong></td><td>{m.indicador}</td><td>{m.resultado}</td><td><span className={'status '+classeStatus[m.status]}><i aria-hidden="true">{iconeStatus[m.status]}</i>{m.status}</span></td></tr>)}</tbody></table>)),
  (p.pontosFortes||p.desenvolvimento)&&pag('desenv','campo-texto','DESENVOLVIMENTO','Pontos fortes e oportunidades',<section className="summary">{p.pontosFortes&&<Texto titulo="Pontos fortes" texto={p.pontosFortes}/>}{p.desenvolvimento&&<Texto titulo="Pontos a desenvolver" texto={p.desenvolvimento} destaque/>}</section>),
  ...partes(p.pdi,POR_PAGINA.pdi).map((lista,k)=>pag('pdi'+k,'rh-tabela','PLANO DE DESENVOLVIMENTO INDIVIDUAL','PDI',<table className="rh-table"><thead><tr><th>Ação de desenvolvimento</th><th>Prazo</th><th>Responsável</th></tr></thead><tbody>{lista.map(a=><tr key={a.id}><td><strong>{a.acao||'Ação'}</strong></td><td>{date(a.prazo)||'—'}</td><td>{a.responsavel}</td></tr>)}</tbody></table>)),
  (p.parecer||p.classificacao!=='Não definida')&&pag('parecer','campo-texto','ENCERRAMENTO','Parecer final',<section className="summary">{p.classificacao!=='Não definida'&&<div className="page-media classificacao-final">Classificação final: <b>{p.classificacao}</b>{geral!==null&&<span>Média {decimal(geral)} / 5</span>}</div>}<Texto titulo="Parecer do avaliador" texto={p.parecer}/></section>),
  pag('assinaturas','rh-assinaturas','CIÊNCIA','Assinaturas',<><p>Declaramos ciência do conteúdo desta avaliação{g.periodo?`, referente ao período ${g.periodo}`:''}.</p><div className="assinaturas">{[['Colaborador',g.colaborador],['Avaliador',g.avaliador],['Recursos Humanos','']].map(([papel,nome])=><div key={papel}><span className="linha"/><strong>{nome||' '}</strong><small>{papel}</small></div>)}</div><p className="data-assinatura">Data: ____ / ____ / ________</p></>),
 ];
 const meta=[g.cargo,g.setor,g.periodo&&'Período: '+g.periodo].filter((m):m is string=>!!m);
 return documentoBase({modelo:'assessment',titulo:g.colaborador||'Nome do colaborador',subtitulo:g.tipoRelatorio||'ASSESSMENT',meta,paginas,css});
}
