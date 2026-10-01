import {endereco,posicao} from './celulas';
// Fórmulas no estilo do Excel em português para os campos importados: =C3+'Outra aba'!D5*2, =SOMA(C3:C9;-C12).
// Avaliação própria (sem eval): números, referências, intervalos dentro de funções, + - * / % e parênteses.
export type Ref={aba:string;linha:number;coluna:number};
export type Resultado={valor:number}|{erro:string};
type Leitor=(aba:string,linha:number,coluna:number)=>{texto:string;numero:number|null};
type Token={t:'num';v:number}|{t:'ref';aba:string|null;de:string;ate?:string}|{t:'fn';v:string}|{t:'op';v:string};
const funcoes:Record<string,(v:number[])=>number>={
 SOMA:v=>v.reduce((a,b)=>a+b,0),SUM:v=>v.reduce((a,b)=>a+b,0),
 'MÉDIA':v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0,MEDIA:v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0,AVERAGE:v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0,
 'MÍNIMO':v=>v.length?Math.min(...v):0,MINIMO:v=>v.length?Math.min(...v):0,MIN:v=>v.length?Math.min(...v):0,
 'MÁXIMO':v=>v.length?Math.max(...v):0,MAXIMO:v=>v.length?Math.max(...v):0,MAX:v=>v.length?Math.max(...v):0,
 ABS:v=>Math.abs(v[0]??0),
};
const CELULA=/^\$?([A-Za-z]{1,3})\$?([1-9]\d{0,6})/;
// Nome de aba sem aspas aceito pelo Excel; os demais vão entre aspas simples.
export const refAba=(aba:string)=>/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*$/.test(aba)?aba:`'${aba.replace(/'/g,"''")}'`;
function tokens(formula:string):Token[]{
 const r:Token[]=[];let s=formula.trim().replace(/^=/,'');
 while(s.length){
  const espaco=s.match(/^\s+/);if(espaco){s=s.slice(espaco[0].length);continue;}
  let aba:string|null=null,resto=s;
  const citada=resto.match(/^'((?:[^']|'')+)'!/),simples=!citada&&resto.match(/^([A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*)!/);
  if(citada){aba=citada[1].replace(/''/g,"'");resto=resto.slice(citada[0].length);}else if(simples){aba=simples[1];resto=resto.slice(simples[0].length);}
  const fn=!aba&&resto.match(/^([A-Za-zÀ-ÿ]+)\s*\(/);
  if(fn&&funcoes[fn[1].toUpperCase()]){r.push({t:'fn',v:fn[1].toUpperCase()});s=resto.slice(fn[0].length-1);continue;}
  const cel=resto.match(CELULA);
  if(cel&&!/^[A-Za-z0-9_]/.test(resto.slice(cel[0].length))||cel&&resto[cel[0].length]===':'){
   const de=(cel[1]+cel[2]).toUpperCase();resto=resto.slice(cel[0].length);let ate:string|undefined;
   const fim=resto.match(/^:\$?([A-Za-z]{1,3})\$?([1-9]\d{0,6})/);if(fim){ate=(fim[1]+fim[2]).toUpperCase();resto=resto.slice(fim[0].length);}
   r.push({t:'ref',aba,de,ate});s=resto;continue;
  }
  if(aba)throw new Error('Depois do nome da aba e de "!", informe uma célula, como C3.');
  const num=s.match(/^\d+(?:[.,]\d+)?/);if(num){r.push({t:'num',v:Number(num[0].replace(',','.'))});s=s.slice(num[0].length);continue;}
  if('+-*/()%;'.includes(s[0])){r.push({t:'op',v:s[0]});s=s.slice(1);continue;}
  throw new Error(`Não entendi “${s.slice(0,12)}”. Use células (C3), números e + - * / ( ).`);
 }
 return r;
}
function celulas(t:Extract<Token,{t:'ref'}>,abaPadrao:string):Ref[]{
 const aba=t.aba??abaPadrao,a=posicao(t.de)!,b=t.ate?posicao(t.ate)!:a;
 const [l1,l2]=[Math.min(a.linha,b.linha),Math.max(a.linha,b.linha)],[c1,c2]=[Math.min(a.coluna,b.coluna),Math.max(a.coluna,b.coluna)];
 if((l2-l1+1)*(c2-c1+1)>10000)throw new Error('Use intervalos de até 10.000 células.');
 const r:Ref[]=[];for(let l=l1;l<=l2;l++)for(let c=c1;c<=c2;c++)r.push({aba,linha:l,coluna:c});return r;
}
// Células usadas pela fórmula (para destacar na grade); fórmulas inválidas não destacam nada.
export function referencias(formula:string,abaPadrao:string):Ref[]{try{return tokens(formula).flatMap(t=>t.t==='ref'?celulas(t,abaPadrao):[]);}catch{return [];}}
export function avaliar(formula:string,abaPadrao:string,ler:Leitor,abas:string[]):Resultado{
 if(!formula.trim()||formula.trim()==='=')return {erro:'Fórmula vazia.'};
 if(formula.length>1000)return {erro:'Use fórmulas de até 1.000 caracteres.'};
 try{
  const lista=tokens(formula);let i=0;
  const valorDe=(ref:Ref,nome:string)=>{if(!abas.includes(ref.aba))throw new Error(`A aba “${ref.aba}” não existe nesta planilha.`);const v=ler(ref.aba,ref.linha,ref.coluna);if(v.numero!==null)return v.numero;if(!v.texto)return 0;throw new Error(`${nome} não contém um número (“${v.texto.slice(0,40)}”).`);};
  const nomeRef=(t:Extract<Token,{t:'ref'}>)=>(t.aba?refAba(t.aba)+'!':'')+t.de+(t.ate?':'+t.ate:'');
  const op=(v:string)=>{const t=lista[i];if(t?.t==='op'&&t.v===v){i++;return true;}return false;};
  function expr():number{let v=termo();for(;;){if(op('+'))v+=termo();else if(op('-'))v-=termo();else return v;}}
  function termo():number{let v=fator();for(;;){if(op('*'))v*=fator();else if(op('/')){const d=fator();if(d===0)throw new Error('Divisão por zero.');v/=d;}else return v;}}
  function fator():number{if(op('-'))return -fator();if(op('+'))return fator();let v=primario();while(op('%'))v/=100;return v;}
  function primario():number{
   const t=lista[i++];
   if(!t)throw new Error('A fórmula terminou antes do esperado.');
   if(t.t==='num')return t.v;
   if(t.t==='ref'){if(t.ate)throw new Error(`Use o intervalo ${nomeRef(t)} dentro de uma função, como SOMA(${nomeRef(t)}).`);const [ref]=celulas(t,abaPadrao);return valorDe(ref,nomeRef(t));}
   if(t.t==='fn'){
    if(!op('('))throw new Error(`Abra parênteses após ${t.v}.`);const valores:number[]=[];
    if(!op(')')){do{const a=lista[i],b=lista[i+1];if(a?.t==='ref'&&a.ate&&(!b||b.t==='op'&&(b.v===';'||b.v===')'))){i++;for(const ref of celulas(a,abaPadrao)){if(!abas.includes(ref.aba))throw new Error(`A aba “${ref.aba}” não existe nesta planilha.`);const v=ler(ref.aba,ref.linha,ref.coluna);if(v.numero!==null)valores.push(v.numero);}}else valores.push(expr());}while(op(';'));if(!op(')'))throw new Error(`Feche os parênteses de ${t.v}. Separe os argumentos com ponto e vírgula.`);}
    return funcoes[t.v](valores);
   }
   if(t.v==='('){const v=expr();if(!op(')'))throw new Error('Feche os parênteses.');return v;}
   throw new Error(`Operador “${t.v}” fora de lugar.`);
  }
  const valor=expr();
  if(i<lista.length)throw new Error(`Operador ou valor inesperado: “${(lista[i] as {v?:unknown}).v??'célula'}”.`);
  if(!Number.isFinite(valor)||Math.abs(valor)>1e13)return {erro:'Resultado fora do limite.'};
  return {valor:Math.round(valor*100)/100};
 }catch(e){return {erro:e instanceof Error?e.message:'Fórmula inválida.'};}
}
// Clicar numa célula: após um operador, acrescenta a referência (como no Excel); senão, substitui a fórmula.
export function inserirReferencia(formula:string,abaPadrao:string,aba:string,linha:number,coluna:number){
 const ref=(aba===abaPadrao?'':refAba(aba)+'!')+endereco(linha,coluna),f=formula.trim().replace(/^=/,'');
 return /[+\-*/(;:]\s*$/.test(f)?{formula:f+ref,acrescentou:true}:{formula:ref,acrescentou:false};
}
