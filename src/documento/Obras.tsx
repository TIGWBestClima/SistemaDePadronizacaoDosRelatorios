import {renderToStaticMarkup} from 'react-dom/server';
import type {ProjetoObras} from '../relatorios/obras/modelo';
import logo from '../identidade/simbolo.png?inline';
import css from '../identidade/obras.css?inline';
const numericCell=(value:string)=>/^(?:R\$\s*)?-?\s*\d[\d.,]*(?:\s*%)?$/.test(value.trim());
const displayCell=(value:string)=>numericCell(value)?value.trim().replace(/\s+/g,'\u00a0'):value;
export function documentHtmlObras(p:ProjetoObras){
 const body=renderToStaticMarkup(<><article className="page cover"><div className="brand-card"><img src={logo} alt="Best Clima"/></div></article><article className="page title-page"><div className="title-wave"><h1>{p.gerais.obra||'Nome da obra'}</h1></div><h2>{p.gerais.tipoRelatorio||'Tipo de relatório'}</h2></article><div id="source">{['fotografico','descritivo'].flatMap(tipo=>p.itens.filter(i=>i.tipo===tipo)).map(i=><article className={'page record-page '+i.tipo} key={i.id}><header><div><small>{i.tipo==='fotografico'?'REGISTRO FOTOGRÁFICO':'REGISTRO DESCRITIVO'}</small><h2>{i.servico||'Serviço realizado'}</h2><h3>{i.tipo==='fotografico'?(i.pavimento||'Pavimento'):(i.tipoDescricao||'Tipo de descrição')}</h3></div><img src={logo} alt="Best Clima"/></header><main>{i.tipo==='fotografico'&&<figure>{i.foto?<img src={i.foto} alt={i.legenda||'Registro fotográfico'}/>:<div className="photo-empty">Registro fotográfico</div>}<figcaption>{i.legenda}</figcaption></figure>}<section className="summary"><h4>Resumo das atividades realizadas</h4><p className="activity-text">{i.descricao}</p>{i.tipo==='descritivo'&&i.tabelas?.map(t=><table className="activity-table" key={t.id}><thead><tr>{t.linhas[0].map((c,n)=><th key={n}>{c}</th>)}</tr></thead><tbody>{t.linhas.slice(1).map((r,n)=><tr key={n}>{r.map((c,k)=><td key={k} className={numericCell(c)?'numeric-cell':undefined}>{displayCell(c)}</td>)}</tr>)}</tbody></table>)}</section></main><footer><span>{p.gerais.obra}</span><span className="page-number"/></footer></article>)}</div></>);
 return '<!doctype html><html lang="pt-BR" data-modelo="obras"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:; style-src &#39;unsafe-inline&#39;"><style>'+css+'</style></head><body><div id="pages">'+body+'</div></body></html>';
}
export async function paginateObras(doc:Document){
 await doc.fonts.ready;await Promise.all([...doc.images].map(i=>i.decode()));
 const source=doc.getElementById('source')!,pages=doc.getElementById('pages')!;
 for(const original of [...source.children] as HTMLElement[]){
  const tables=[...original.querySelectorAll<HTMLTableElement>('.activity-table')];tables.forEach(t=>t.remove());
  const text=original.querySelector('.activity-text')!.textContent||'';
  let remaining=text,part=0;
  if(text||!tables.length)do{
   const page=original.cloneNode(true) as HTMLElement;pages.append(page);
   if(part++){page.classList.add('continuation');page.querySelector('h3')!.append(' · continuação');}
   const paragraph=page.querySelector('.activity-text') as HTMLElement;
   const main=page.querySelector('main') as HTMLElement;
   paragraph.textContent=remaining;
   if(main.scrollHeight>main.clientHeight+1){
    let low=0,high=remaining.length;
    while(low<high){const mid=Math.ceil((low+high)/2);paragraph.textContent=remaining.slice(0,mid);if(main.scrollHeight<=main.clientHeight+1)low=mid;else high=mid-1;}
    if(!low)throw new Error('O conteúdo do registro excedeu a área útil da página.');
    // Keep surrogate pairs intact at a continuation boundary.
    if(low<remaining.length&&/[\uD800-\uDBFF]/.test(remaining[low-1]))low--;
    paragraph.textContent=remaining.slice(0,low);remaining=remaining.slice(low);
   }else remaining='';
  }while(remaining);
  for(const table of tables){
   let main:HTMLElement,tbody:HTMLTableSectionElement;
   function addTablePage(){
    const page=original.cloneNode(true) as HTMLElement;pages.append(page);
    if(part++){page.classList.add('continuation');page.querySelector('h3')!.append(' · continuação');}
    page.querySelector('.activity-text')!.remove();
    const copy=table.cloneNode(false) as HTMLTableElement;
    copy.append(table.querySelector('thead')!.cloneNode(true));tbody=doc.createElement('tbody');copy.append(tbody);
    page.querySelector('.summary')!.append(copy);main=page.querySelector('main')!;
    if(main.scrollHeight>main.clientHeight+1)throw new Error('O cabeçalho da tabela é muito extenso. Reduza o texto do cabeçalho.');
   }
   addTablePage();
   for(const originalRow of [...table.tBodies[0].rows]){
    let values=[...originalRow.cells].map(c=>c.textContent||'');
    do{
     let row=originalRow.cloneNode(true) as HTMLTableRowElement;[...row.cells].forEach((c,n)=>{c.textContent=values[n];});tbody!.append(row);
     if(main!.scrollHeight>main!.clientHeight+1&&tbody!.rows.length>1){row.remove();addTablePage();tbody!.append(row);}
     if(main!.scrollHeight<=main!.clientHeight+1){values=[];break;}
     // Split an oversized row by cell content, preserving every character.
     const rest:string[]=[];
     [...row.cells].forEach(c=>{c.textContent='';});
     for(let c=0;c<values.length;c++){
      let lo=0,hi=values[c].length;
      while(lo<hi){const mid=Math.ceil((lo+hi)/2);row.cells[c].textContent=values[c].slice(0,mid);if(main!.scrollHeight<=main!.clientHeight+1)lo=mid;else hi=mid-1;}
      if(lo<values[c].length&&/[\uD800-\uDBFF]/.test(values[c][lo-1]||''))lo--;
      row.cells[c].textContent=values[c].slice(0,lo);rest.push(values[c].slice(lo));
     }
     if(rest.every((v,n)=>v===values[n]))throw new Error('A linha da tabela não cabe na página. Reduza o número de colunas.');
     values=rest;if(values.some(Boolean))addTablePage();
    }while(values.some(Boolean));
   }
  }
 }
 source.remove();const all=[...pages.querySelectorAll('.page')];all.forEach((p,i)=>{const n=p.querySelector('.page-number');if(n)n.textContent='Página '+(i+1)+' de '+all.length;});return all.length;
}
