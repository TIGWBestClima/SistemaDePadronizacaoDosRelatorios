import {renderToStaticMarkup} from 'react-dom/server';
import type {Projeto} from '../relatorios/qualidade/modelo';
import {layoutQualidade} from '../relatorios/qualidade/modelo';
import css from '../identidade/documento.css?inline';
import {Avaliacao} from './Avaliacao';
import selo from '../identidade/selo-qualidade.png?inline';
const date=(s:string)=>s?s.split('-').reverse().join('/'):'—';
const value=(s:string)=>s||'—';
function chunks(text:string,length=350,maxLines=12){
  const result:string[]=[];let current='';let lines=0;
  for(const char of text){current+=char;if(char==='\n')lines++;if(current.length>=length||lines>=maxLines){result.push(current);current='';lines=0;}}
  if(current)result.push(current);return result.length?result:[''];
}
const columns=[['ITEM',4.85],['ETAPA',6.74],['DISCIPLINA',7.01],['TIPO',4.31],['LOCAL',7.28],['DESCRIÇÃO',10.92],['EVIDÊNCIA E DATA DE REGISTRO',15.23],['PRIORIDADE',7.82],['RESPONSÁVEL',8.49],['STATUS',7.28],['PRAZO',7.01],['EVIDÊNCIA E DATA DA CORREÇÃO',13.06]] as const;
const Evidence=({src,when,correction=false}:{src:string;when:string;correction?:boolean})=><div className="evidence">{src&&<img src={src} alt={correction?'Evidência da correção':'Evidência do registro'}/>}<span className={correction&&!when?'correction-pending':undefined}>{when?date(when):correction?'Correção não realizada até o momento':''}</span></div>;
export function documentHtml(p:Projeto){
  const blocks=renderToStaticMarkup(<>
    <section className="cover" data-cover="true">
      <div className="cover-left"/><h1 className="cover-title">RELATÓRIO DA QUALIDADE - OBRA</h1>
      {p.capa?<img className="cover-photo" src={p.capa} alt="Imagem da obra"/>:<div className="cover-photo cover-empty">Imagem da obra</div>}
      <img className="cover-logo" src={selo} alt="Engenharia da Qualidade · Best Clima · 20 anos"/>
      <div className="cover-client-label">CLIENTE</div><div className="cover-client">{p.gerais.cliente||'NOME DO CLIENTE'}</div>
      <div className="cover-project"><span>PROJETO</span><div>{p.gerais.obra||'NOME DO PROJETO'}</div></div>
      <div className="cover-data"><div>Relatório: {value(p.gerais.numero)} / {value(p.gerais.revisao)}</div><div>Data de Visita: {date(p.gerais.visita)}</div><div className="address"><span>Local: </span><span>{value(p.gerais.endereco)}</span></div><div>Emissão do Relatório: {date(p.gerais.emissao)}</div><div>Prazo de Retorno: {date(p.gerais.retorno)}</div><div>Responsável: {value(p.gerais.responsavel)}</div></div>
    </section>
    {p.itens.length>0?<table className="inspection-table" data-records="true"><colgroup>{columns.map(([name,width])=><col key={name} style={{width:`${width}%`}}/>)}</colgroup><thead><tr>{columns.map(([name])=><th key={name}>{name}</th>)}</tr></thead><tbody>{p.itens.flatMap((item,index)=>chunks(item.descricao).map((part,n)=><tr className={n===0?'record':'continuation'} key={`${item.id}-${n}`}>
      <td><span className="item-code">{String(index+1).padStart(3,'0')}</span>{n>0&&<small>continuação</small>}</td><td>{value(item.etapa)}</td><td>{value(item.disciplina)}</td><td>{value(item.tipo)}</td><td>{value(item.local)}</td>
      <td className="description"><p>{part||'—'}</p></td><td><Evidence src={n===0?item.foto:''} when={item.registro}/></td><td><span className="priority-label">{value(item.prioridade)}</span></td><td>{value(item.responsavel)}</td><td className={item.status==='Recusado'?'status-refused':item.status==='Aceito'?'status-accepted':''}><span className="status-label">{item.status}</span></td><td>{date(item.prazo)}</td><td><Evidence src={n===0?item.fotoCorrecao:''} when={item.correcao} correction/></td>
    </tr>))}</tbody></table>:<section className="block" data-break="true"><h2>Registros de inspeção</h2><p>Nenhum registro adicionado.</p></section>}
    {chunks(p.observacoes,450,7).map((part,i)=><section className="block observations" data-break={i===0?'true':undefined} key={`obs${i}`}><h2>LEGENDA &amp; OBSERVAÇÃO{i>0?' · continuação':''}</h2><h3>Observação</h3><p>{part||'Nenhuma observação informada.'}</p>{i===0&&<div className="legend"><h3>Legenda</h3><p>RNC: Registro de Não Conformidade</p></div>}</section>)}
    <Avaliacao avaliacao={p.avaliacao}/>
  </>);
  const header=renderToStaticMarkup(<header><div><small>ENGENHARIA DA QUALIDADE</small><h2>Relatório de Qualidade</h2><strong>{p.gerais.obra||'Projeto'}</strong></div><img src={selo} alt="Engenharia da Qualidade"/></header>);
  return `<!doctype html><html lang="pt-BR" data-orientation="${layoutQualidade.orientacao}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>${css}</style></head><body><div id="source">${blocks}</div><template id="page-template"><article class="page">${header}<div class="page-number"></div><main></main></article></template><div id="pages"></div></body></html>`;
}
export async function paginate(doc:Document){
  await doc.fonts.ready;
  await Promise.all([...doc.images].map(img=>img.decode().catch(()=>{throw new Error('Não foi possível carregar uma imagem do relatório.');})));
  const source=doc.getElementById('source')!;const pages=doc.getElementById('pages')!;
  const template=doc.getElementById('page-template') as HTMLTemplateElement;
  let current:HTMLElement;
  function addPage(kind='content-page'){
    const page=template.content.firstElementChild!.cloneNode(true) as HTMLElement;
    page.classList.add(kind);pages.append(page);current=page.querySelector('main')!;return current;
  }
  for(const block of [...source.children] as HTMLElement[]){
    if(block.dataset.cover){addPage('cover-page').append(block);continue;}
    if(block.dataset.records){
      const rows=[...block.querySelectorAll('tbody>tr')];let tbody:HTMLTableSectionElement;
      function addTable(){
        addPage('records-page');const table=block.cloneNode(false) as HTMLTableElement;table.removeAttribute('data-records');
        table.append(block.querySelector('colgroup')!.cloneNode(true),block.querySelector('thead')!.cloneNode(true));
        tbody=doc.createElement('tbody');table.append(tbody);current!.append(table);
      }
      addTable();
      for(const row of rows){
        if(tbody!.children.length>=layoutQualidade.itensPorPagina)addTable();
        tbody!.append(row);
        if(current!.scrollHeight>current!.clientHeight+1){
          if(tbody!.children.length>1){row.remove();addTable();tbody!.append(row);}
          if(current!.scrollHeight>current!.clientHeight+1)throw new Error('Um registro excedeu a área útil da página. Reduza seus campos extensos.');
        }
      }
      continue;
    }
    if(!current!||!current!.closest('.content-page')||(block.dataset.break&&current!.children.length))addPage();
    current!.append(block);
    if(current!.scrollHeight>current!.clientHeight+1){
      if(current!.children.length>1){block.remove();addPage();current!.append(block);}
      if(current!.scrollHeight>current!.clientHeight+1)throw new Error('Um bloco excedeu o espaço da página. Reduza os campos extensos.');
    }
  }
  source.remove();template.remove();
  [...pages.querySelectorAll('.page-number')].forEach((el,i)=>{el.textContent=`Página ${i+1} de ${pages.children.length}`;});
  return pages.children.length;
}
