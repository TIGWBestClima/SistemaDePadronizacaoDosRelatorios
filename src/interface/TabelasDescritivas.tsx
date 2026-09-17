import type {ClipboardEvent} from 'react';
import type {RegistroObras,Tabela} from '../relatorios/obras/modelo';
import {colarTabelas} from './colarTabelas';
export function TabelasDescritivas({item,update,error,confirmar}:{item:RegistroObras;update:(p:Partial<RegistroObras>)=>void;error:(s:string)=>void;confirmar:(s:string)=>Promise<boolean>}){
 const tabelas=item.tabelas||[];
 function paste(e:ClipboardEvent<HTMLTextAreaElement>){
  try{const data=colarTabelas(e.clipboardData.getData('text/html'),e.clipboardData.getData('text/plain'));if(!data)return;e.preventDefault();
   if(tabelas.length+data.tabelas.length>50)throw new Error('Cada registro pode ter até 50 tabelas.');
   const field=e.currentTarget;const descricao=item.descricao.slice(0,field.selectionStart)+data.texto+item.descricao.slice(field.selectionEnd);
   if(descricao.length>100000||data.tabelas.some(t=>t.linhas.some(r=>r.some(c=>c.length>100000))))throw new Error('O texto excede o limite de 100.000 caracteres por campo.');
   update({descricao,tabelas:[...tabelas,...data.tabelas]});
  }catch(err){e.preventDefault();error(err instanceof Error?err.message:'Não foi possível colar a tabela.');}
 }
 function change(table:Tabela,r:number,c:number,value:string){update({tabelas:tabelas.map(t=>t.id===table.id?{...t,linhas:t.linhas.map((row,i)=>i===r?row.map((cell,j)=>j===c?value:cell):row)}:t)});}
 return <><label className="field"><span>Resumo/Descrição das atividades realizadas</span><textarea aria-label="Resumo/Descrição das atividades realizadas" rows={5} maxLength={100000} value={item.descricao} onChange={e=>update({descricao:e.target.value})} onPaste={paste}/></label><p className="table-help">Escreva o resumo ou cole uma tabela aqui (Ctrl+V / ⌘V). As tabelas aparecem abaixo do texto. A primeira linha será usada como cabeçalho.</p>{tabelas.map((table,n)=><section className="table-editor" key={table.id}><div className="item-tools"><strong>Tabela {n+1}</strong><button type="button" onClick={async()=>{if(await confirmar('Remover esta tabela?'))update({tabelas:tabelas.filter(t=>t.id!==table.id)});}}>Remover tabela {n+1}</button></div><div className="table-scroll"><table><tbody>{table.linhas.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c}><textarea aria-label={'Tabela '+(n+1)+', linha '+(r+1)+', coluna '+(c+1)} value={cell} maxLength={100000} rows={2} onChange={e=>change(table,r,c,e.target.value)}/></td>)}</tr>)}</tbody></table></div></section>)}</>;
}
