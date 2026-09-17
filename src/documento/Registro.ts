import type {Projeto} from '../relatorios/modelo';
import {documentHtml as qualidade,paginate as paginarQualidade} from './Documento';
import {documentHtmlObras,paginateObras} from './Obras';
import logo from '../identidade/simbolo.png?inline';
import seloQualidade from '../identidade/selo-qualidade.png?inline';
export const documentHtml=(p:Projeto)=>p.modelo==='qualidade'?qualidade(p):documentHtmlObras(p);
export async function paginate(doc:Document){
 await (doc.documentElement.dataset.modelo==='obras'?paginateObras(doc):paginarQualidade(doc));
 const pages=doc.getElementById('pages')!;
 const cover=doc.createElement('article');
 cover.className='page closing-cover';
 cover.setAttribute('aria-label','Capa final');
 cover.style.cssText='display:flex;align-items:center;justify-content:center;background:#fff';
 const symbol=doc.createElement('img');
 const obras=doc.documentElement.dataset.modelo==='obras';
 symbol.src=obras?logo:seloQualidade;symbol.alt=obras?'Best Clima':'Best Clima Qualidade';
 symbol.style.cssText='width:36%;height:42%;object-fit:contain';
 cover.append(symbol);pages.append(cover);
 await symbol.decode();
 const all=[...pages.querySelectorAll('.page')];
 all.forEach((page,i)=>{const number=page.querySelector('.page-number');if(number)number.textContent=`Página ${i+1} de ${all.length}`;});
 return all.length;
}