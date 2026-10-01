import {renderToStaticMarkup} from 'react-dom/server';
import type {ReactNode} from 'react';
import {variantes,type Mapa,type ProjetoCampo,type RegistroCampo} from '../relatorios/campo/modelo';
import {Contornos,classeCor} from './Planta';
import logo from '../identidade/simbolo.png?inline';
import css from '../identidade/obras.css?inline';
import cssCampo from '../identidade/campo.css?inline';
export const n2=(n:number)=>String(n).padStart(2,'0');
export const date=(s:string)=>s?s.split('-').reverse().join('/'):'';
// Área útil do mapa na página 16:9 (altura do main menos o espaçamento superior); a planta é encaixada mantendo a proporção.
const MAPA={largura:790,altura:410},MINI={largura:410,altura:170};
// Cliente é a identificação principal; a obra aparece junto quando informada.
const identificacao=(p:ProjetoCampo)=>[p.gerais.cliente,p.gerais.obra].filter(Boolean).join(' · ');
export function Pagina({classe,rotulo,titulo,sub,obra,children}:{classe:string;rotulo:string;titulo:string;sub:string;obra:string;children:ReactNode}){
 return <article className={'page record-page '+classe}><header><div><small>{rotulo}</small><h2>{titulo}</h2><h3>{sub}</h3></div><img src={logo} alt="Best Clima"/></header><main>{children}</main><footer><span>{obra}</span><span className="page-number"/></footer></article>;
}
export const Texto=({titulo,texto,destaque=false}:{titulo:string;texto:string;destaque?:boolean})=><div className={destaque?'text-block destaque':'text-block'}><h4>{titulo}</h4><p className="activity-text">{texto}</p></div>;
const Foto=({src,alt,legenda}:{src:string;alt:string;legenda?:string})=><figure>{src?<img src={src} alt={legenda||alt}/>:<div className="photo-empty">{alt}</div>}{legenda!==undefined&&<figcaption>{legenda}</figcaption>}</figure>;
function Planta({p,mapa,caixa,item}:{p:ProjetoCampo;mapa:Mapa;caixa:{largura:number;altura:number};item?:string}){
 const largo=mapa.proporcao>caixa.largura/caixa.altura;
 const largura=largo?caixa.largura:Math.round(caixa.altura*mapa.proporcao),altura=largo?Math.round(caixa.largura/mapa.proporcao):caixa.altura;
 const numero=(id:string)=>p.itens.findIndex(i=>i.id===id)+1;
 const marcadores=mapa.marcadores.filter(m=>numero(m.item)>0&&(!item||m.item===item));
 return <div className="map-frame" style={{width:largura,height:altura}}><img src={mapa.imagem} alt={mapa.nome||'Planta'}/><Contornos marcadores={marcadores}/>{marcadores.map(m=><span className={'pin '+classeCor(m)} key={m.id} style={{left:m.x+'%',top:m.y+'%'}}>{n2(numero(m.item))}</span>)}</div>;
}
function PaginaMapa({p,mapa}:{p:ProjetoCampo;mapa:Mapa}){
 const pontos=p.itens.map((item,n)=>({item,n:n+1})).filter(({item})=>mapa.marcadores.some(m=>m.item===item.id));
 return <Pagina classe="map-page" rotulo="MAPA DE LIMPEZA" titulo={mapa.nome||'Planta'} sub={identificacao(p)||'Cliente'} obra={identificacao(p)}>
  <div className="map-area"><Planta p={p} mapa={mapa} caixa={MAPA}/></div>
  <aside className={pontos.length>10?'map-legend compacta':'map-legend'}><h4>Pontos de limpeza</h4>{pontos.length?<ol>{pontos.map(({item,n})=><li key={item.id}><b className={'pin static '+classeCor(mapa.marcadores.find(m=>m.item===item.id)!)}>{n2(n)}</b><span><strong>{item.titulo||'Ponto '+n2(n)}</strong>{item.local&&<small>{item.local}</small>}</span></li>)}</ol>:<p>Nenhum ponto marcado nesta planta.</p>}</aside>
 </Pagina>;
}
function paginas(p:ProjetoCampo){
 const v=variantes[p.modelo];
 const conclusao=v.secoes.final&&p.conclusao?<Pagina key="conclusao" classe="campo-texto" rotulo="ENCERRAMENTO" titulo={tituloConclusao(p)} sub={p.gerais.responsavel||v.curto} obra={identificacao(p)}><section className="summary"><Texto titulo="Conclusão" texto={p.conclusao}/></section></Pagina>:null;
 return [...conteudo(p),conclusao];
}
export const tituloConclusao=(p:{modelo:string})=>p.modelo==='visita'?'Conclusão e recomendações':'Conclusão';
function conteudo(p:ProjetoCampo){
 const v=variantes[p.modelo],obra=identificacao(p);
 const registro=(i:RegistroCampo,n:number,children:ReactNode)=><Pagina key={i.id} classe={'campo-'+p.modelo} rotulo={v.registro+' '+n2(n+1)} titulo={i.titulo||v.item[0].label} sub={i.local||'Local não informado'} obra={obra}>{children}</Pagina>;
 if(p.modelo==='fotografico'){
  const porPagina=Number(p.gerais.fotosPorPagina),grupos:RegistroCampo[][]=[];
  for(let i=0;i<p.itens.length;i+=porPagina)grupos.push(p.itens.slice(i,i+porPagina));
  return grupos.map((g,k)=>{const inicio=k*porPagina+1;return <Pagina key={g[0].id} classe={'photo-page grid-'+porPagina} rotulo="REGISTRO FOTOGRÁFICO" titulo={p.gerais.cliente||p.gerais.obra||'Registro fotográfico'} sub={g.length>1?`Fotos ${n2(inicio)} a ${n2(inicio+g.length-1)} de ${n2(p.itens.length)}`:`Foto ${n2(inicio)} de ${n2(p.itens.length)}`} obra={obra}>{g.map((i,n)=><figure key={i.id}>{i.foto?<img src={i.foto} alt={i.legenda||'Foto'}/>:<div className="photo-empty">Foto</div>}<figcaption><b>{n2(inicio+n)}</b> {i.legenda}{i.local&&<small>{i.local}</small>}</figcaption></figure>)}</Pagina>;});
 }
 if(p.modelo==='visita')return [
  p.gerais.objetivo&&<Pagina key="objetivo" classe="campo-texto" rotulo="DADOS DA VISITA" titulo="Objetivo da visita" sub={[date(p.gerais.data),p.gerais.responsavel,p.gerais.acompanhante&&'Acompanhado por '+p.gerais.acompanhante].filter(Boolean).join(' · ')||'Visita técnica'} obra={obra}><section className="summary"><Texto titulo="Objetivo" texto={p.gerais.objetivo}/></section></Pagina>,
  ...p.itens.map((i,n)=>registro(i,n,<>{i.foto&&<div className="page-media compact"><Foto src={i.foto} alt="Foto da constatação" legenda={i.legenda}/></div>}<section className="summary"><Texto titulo="Descrição" texto={i.descricao}/>{i.recomendacao&&<Texto titulo="Recomendação" texto={i.recomendacao} destaque/>}</section></>)),
 ];
 if(p.modelo==='dutos')return [
  ...p.mapas.map(m=><PaginaMapa key={m.id} p={p} mapa={m}/>),
  ...p.itens.map((i,n)=>registro(i,n,<><div className="page-media before-after"><Foto src={i.foto} alt="Foto não adicionada" legenda="Antes da limpeza"/><Foto src={i.fotoDepois} alt="Foto não adicionada" legenda="Depois da limpeza"/></div><section className="summary">{(m=>m&&<div className="page-media location"><h4>Localização · {m.nome||'Planta'}</h4><div className="mini-map"><Planta p={p} mapa={m} caixa={MINI} item={i.id}/></div></div>)(p.mapas.find(m=>m.marcadores.some(k=>k.item===i.id)))}<Texto titulo="Descrição do serviço" texto={i.descricao}/></section></>)),
 ];
 return p.itens.map((i,n)=>registro(i,n,<><div className="page-media"><Foto src={i.foto} alt="Foto do apontamento" legenda={i.legenda}/></div><section className="summary"><Texto titulo="Descrição do apontamento" texto={i.descricao}/></section></>));
}
// Documento 16:9 da Best Clima: capa, contracapa e páginas de conteúdo paginadas por paginateCampo.
export function documentoBase({modelo,titulo,subtitulo,meta,paginas,css:extra=''}:{modelo:string;titulo:string;subtitulo:string;meta:string[];paginas:ReactNode;css?:string}){
 const body=renderToStaticMarkup(<><article className="page cover"><div className="brand-card"><img src={logo} alt="Best Clima"/></div></article><article className="page title-page"><div className="title-wave"><h1>{titulo}</h1></div><h2>{subtitulo}</h2>{meta.length>0&&<div className="title-meta">{meta.map((m,i)=><span key={i}>{m}</span>)}</div>}</article><div id="source">{paginas}</div></>);
 return '<!doctype html><html lang="pt-BR" data-modelo="'+modelo+'"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:; style-src &#39;unsafe-inline&#39;"><style>'+css+cssCampo+extra+'</style></head><body><div id="pages">'+body+'</div></body></html>';
}
export function documentHtmlCampo(p:ProjetoCampo){
 const v=variantes[p.modelo];
 const meta=[p.gerais.obra&&'Obra: '+p.gerais.obra,p.gerais.local,p.gerais.data&&date(p.gerais.data),p.gerais.responsavel&&'Responsável: '+p.gerais.responsavel].filter((m):m is string=>!!m);
 return documentoBase({modelo:p.modelo,titulo:p.gerais.cliente||p.gerais.obra||'Nome do cliente',subtitulo:p.gerais.tipoRelatorio||v.tipoRelatorio,meta,paginas:paginas(p)});
}
// Distribui os blocos de texto de cada página de origem, continuando nas páginas seguintes sem cortar conteúdo.
export async function paginateCampo(doc:Document){
 await doc.fonts.ready;await Promise.all([...doc.images].map(i=>i.decode().catch(()=>{throw new Error('Não foi possível carregar uma imagem do relatório.');})));
 const source=doc.getElementById('source')!,pages=doc.getElementById('pages')!;
 const cabe=(main:HTMLElement)=>main.scrollHeight<=main.clientHeight+1;
 for(const original of [...source.children] as HTMLElement[]){
  const restante=[...original.querySelectorAll('.activity-text')].map(t=>t.textContent||'');
  if(!restante.length){const page=original.cloneNode(true) as HTMLElement;pages.append(page);if(!cabe(page.querySelector('main')!))throw new Error('O conteúdo de uma página excedeu a área útil. Reduza os textos, as legendas ou a quantidade de pontos na planta.');continue;}
  let atual=0,parte=0,continuando=false;
  do{
   const page=original.cloneNode(true) as HTMLElement;pages.append(page);
   if(parte++){page.classList.add('continuation');page.querySelector('h3')!.append(' · continuação');page.querySelectorAll('.page-media').forEach(m=>m.remove());}
   const main=page.querySelector('main') as HTMLElement;
   const blocos=[...page.querySelectorAll<HTMLElement>('.text-block')],destinos=blocos.map(b=>b.parentElement!);
   blocos.forEach(b=>b.remove());
   let colocados=0;
   while(atual<restante.length){
    const bloco=blocos[atual],texto=bloco.querySelector('.activity-text') as HTMLElement;
    if(continuando)bloco.querySelector('h4')!.append(' (continuação)');
    destinos[atual].append(bloco);texto.textContent=restante[atual];
    if(cabe(main)){atual++;colocados++;continuando=false;continue;}
    let low=0,high=restante[atual].length;
    while(low<high){const mid=Math.ceil((low+high)/2);texto.textContent=restante[atual].slice(0,mid);if(cabe(main))low=mid;else high=mid-1;}
    // Keep surrogate pairs intact at a continuation boundary.
    if(low&&/[\uD800-\uDBFF]/.test(restante[atual][low-1]))low--;
    if(!low){if(!colocados)throw new Error('O conteúdo do registro excedeu a área útil da página.');bloco.remove();break;}
    texto.textContent=restante[atual].slice(0,low);restante[atual]=restante[atual].slice(low);continuando=true;break;
   }
  }while(atual<restante.length);
 }
 source.remove();return pages.querySelectorAll('.page').length;
}
