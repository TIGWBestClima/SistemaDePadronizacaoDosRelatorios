import ExcelJS from 'exceljs';
import JSZip from 'jszip';
// Leitura livre de uma planilha para o usuário escolher células (importação do Receitas x Despesas).
// Em células mescladas, só a célula principal exibe o texto; as demais têm `mesclada` e o valor da principal.
export type Leitura={texto:string;numero:number|null;mesclada?:boolean};
export type Pasta={abas:{nome:string;oculta:boolean;linhas:number;colunas:number}[];ler:(aba:string,linha:number,coluna:number)=>Leitura;buscar:(aba:string,termo:string)=>{linha:number;coluna:number}[]};
import {endereco,letra,posicao} from './celulas';
export {endereco,letra,posicao};
// Aceita "R$ 1.234,56", "-1.234,56", "(1.234,56)", "1234.56" e "12%".
export function numeroDeTexto(texto:string):number|null{
 let t=texto.trim().replace(/^R\$\s*/i,'').replace(/\s/g,'');let negativo=false;
 if(/^\(.*\)$/.test(t)){negativo=true;t=t.slice(1,-1);}
 const pct=t.endsWith('%');if(pct)t=t.slice(0,-1);
 if(!/^-?[\d.,]+$/.test(t))return null;
 if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');else if((t.match(/\./g)||[]).length>1)t=t.replace(/\./g,'');
 const n=Number(t);if(!Number.isFinite(n))return null;
 return (negativo?-n:n)/(pct?100:1);
}
function normalizar(v:ExcelJS.CellValue,formato:string):Leitura{
 if(v==null||v==='')return {texto:'',numero:null};
 if(typeof v==='number')return {texto:formato.includes('%')?(v*100).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%':v.toLocaleString('pt-BR',{maximumFractionDigits:2}),numero:v};
 if(typeof v==='boolean')return {texto:v?'VERDADEIRO':'FALSO',numero:null};
 if(v instanceof Date)return {texto:v.toLocaleDateString('pt-BR',{timeZone:'UTC'}),numero:null};
 if(typeof v==='string')return {texto:v,numero:numeroDeTexto(v)};
 if('result' in v)return v.result===undefined?{texto:'(fórmula sem valor salvo)',numero:null}:normalizar(v.result as ExcelJS.CellValue,formato);
 if('formula' in v||'sharedFormula' in v)return {texto:'(fórmula sem valor salvo)',numero:null};
 if('error' in v)return {texto:String(v.error),numero:null};
 if('richText' in v){const texto=v.richText.map(p=>p.text).join('');return {texto,numero:numeroDeTexto(texto)};}
 if('text' in v)return {texto:String(v.text),numero:null};
 return {texto:'',numero:null};
}
export async function abrirPasta(bytes:ArrayBuffer):Promise<Pasta>{
 if(bytes.byteLength>50*1024*1024)throw new Error('Use uma planilha de até 50 MB.');
 const zip=await JSZip.loadAsync(bytes).catch(()=>{throw new Error('Não foi possível abrir a planilha. Salve o arquivo no formato Excel .xlsx, sem senha.');});
 let expandido=0;
 for(const f of Object.values(zip.files)){expandido+=(f as unknown as {_data?:{uncompressedSize:number}})._data?.uncompressedSize??0;if(expandido>300*1024*1024)throw new Error('O conteúdo da planilha excede 300 MB.');}
 if(!zip.file('xl/workbook.xml'))throw new Error('O arquivo não é uma planilha Excel .xlsx.');
 const wb=new ExcelJS.Workbook();
 try{await wb.xlsx.load(bytes as unknown as ExcelJS.Buffer);}catch{throw new Error('Não foi possível ler a planilha. Salve uma cópia em .xlsx, sem senha, e tente novamente.');}
 const aba=(nome:string)=>{const ws=wb.worksheets.find(w=>w.name===nome);if(!ws)throw new Error(`A aba “${nome}” não existe nesta planilha.`);return ws;};
 return {
  abas:wb.worksheets.map(ws=>({nome:ws.name,oculta:ws.state!=='visible',linhas:ws.rowCount,colunas:ws.columnCount})),
  ler(nome,linha,coluna){
   const ws=aba(nome),row=ws.findRow(linha),existente=row?.findCell(coluna);
   if(!existente)return {texto:'',numero:null};
   const origem=existente.isMerged?existente.master:existente;
   return {...normalizar(origem.value,origem.numFmt||''),mesclada:origem!==existente};
  },
  buscar(nome,termo){
   const ws=aba(nome),alvo=termo.trim().toLocaleLowerCase('pt-BR'),achados:{linha:number;coluna:number}[]=[];
   if(!alvo)return achados;
   ws.eachRow((row,linha)=>row.eachCell((cell,coluna)=>{if(achados.length<500&&!(cell.isMerged&&cell.master!==cell)&&normalizar(cell.value,cell.numFmt||'').texto.toLocaleLowerCase('pt-BR').includes(alvo))achados.push({linha,coluna});}));
   return achados;
  },
 };
}
