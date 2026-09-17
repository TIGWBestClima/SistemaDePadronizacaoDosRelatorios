import type {Tabela} from '../relatorios/obras/modelo';
export function colarTabelas(html:string,text:string):{tabelas:Tabela[];texto:string}|null{
 if(html.length+text.length>5_000_000)throw new Error('Cole uma tabela menor, com até 5 MB de conteúdo.');
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,style,iframe,object,img,svg,template').forEach(n=>n.remove());
 const tables=[...doc.querySelectorAll('table')].filter(t=>!t.parentElement?.closest('table'));
 const result:Tabela[]=[];
 const clean=(n:Element)=>{const copy=n.cloneNode(true) as Element;copy.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));return (copy.textContent||'').trim();};
 for(const table of tables){
  const grid:string[][]=[];
  const rows=[...table.rows];if(rows.length>2000)throw new Error('Cada tabela pode ter até 2.000 linhas.');
  rows.forEach((row,r)=>{grid[r]??=[];let c=0;for(const cell of [...row.cells]){
   while(grid[r][c]!==undefined)c++;
   const colspan=Math.max(1,cell.colSpan),rowspan=Math.max(1,cell.rowSpan);
   if(c+colspan>40||r+rowspan>2000)throw new Error('Use tabelas com até 40 colunas e 2.000 linhas.');
   for(let dr=0;dr<rowspan;dr++){grid[r+dr]??=[];for(let dc=0;dc<colspan;dc++)grid[r+dr][c+dc]=dr===0&&dc===0?clean(cell):'';}
   c+=colspan;
  }});
  const width=Math.max(0,...grid.map(r=>r.length));
  if(width)result.push({id:crypto.randomUUID(),linhas:grid.map(r=>Array.from({length:width},(_,c)=>r[c]??''))});
  table.remove();
 }
 if(result.length)return {tabelas:result,texto:(doc.body.textContent||'').trim()};
 if(!text.includes('\t'))return null;
 // Parse spreadsheet TSV including quoted cells containing line breaks or tabs.
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'&&(quoted||cell==='')){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(ch==='\t'||ch==='\n'||ch==='\r')){row.push(cell);cell='';if(ch!=='\t'){rows.push(row);row=[];if(ch==='\r'&&text[i+1]==='\n')i++;}}else cell+=ch;}
 if(cell||row.length){row.push(cell);rows.push(row);}
 const width=Math.max(0,...rows.map(r=>r.length));
 if(rows.length>2000||width>40)throw new Error('Use tabelas com até 40 colunas e 2.000 linhas.');
 return {tabelas:[{id:crypto.randomUUID(),linhas:rows.map(r=>Array.from({length:width},(_,c)=>r[c]??''))}],texto:''};
}
