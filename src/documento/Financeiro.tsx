import type {ReactNode} from 'react';
import {Pagina,Texto,date,documentoBase} from './Campo';
import css from '../identidade/paineis.css?inline';
import {calcular,moeda,moedaCurta,type Periodo,type ProjetoFinanceiro} from '../relatorios/financeiro/modelo';
// Escala linear com marcas "redondas" (1, 2, 2,5, 5 × 10ⁿ) cobrindo o intervalo e o zero.
function escala(min:number,max:number,passos=4){
 min=Math.min(0,min);max=Math.max(0,max);if(min===max)max=1;
 const bruto=(max-min)/passos,mag=10**Math.floor(Math.log10(bruto)),passo=[1,2,2.5,5,10].map(m=>m*mag).find(s=>s>=bruto)!;
 const ini=Math.floor(min/passo)*passo,fim=Math.ceil(max/passo)*passo,ticks:number[]=[];
 for(let v=ini;v<=fim+passo/2;v+=passo)ticks.push(Math.round(v/passo)*passo);
 return {ini,fim,ticks};
}
function quebrar(texto:string,max=16){const linhas:string[]=[];let atual='';for(const p of texto.split(' ')){if((atual+' '+p).trim().length>max&&atual){linhas.push(atual);atual=p;}else atual=(atual+' '+p).trim();}if(atual)linhas.push(atual);return linhas;}
type Degrau={nome:string;de:number;ate:number;tipo:'receita'|'despesa'|'total'|'necessaria'};
// Ponte (waterfall) do período: receitas sobem, despesas descem, o total mostra o resultado e a barra hachurada o que falta para zerar.
function Ponte({periodo}:{periodo:Periodo}){
 const c=calcular(periodo),a=periodo.receitaPreventiva,b=periodo.receitaCorretivaVm;
 const degraus:Degrau[]=[{nome:'Receita preventiva',de:0,ate:a,tipo:'receita'},{nome:'Receita corretiva + VM',de:a,ate:a+b,tipo:'receita'},{nome:'Despesa sem corretiva',de:a+b,ate:a+b-periodo.despesaSemCorretiva,tipo:'despesa'},{nome:'Despesa corretiva + VM',de:a+b-periodo.despesaSemCorretiva,ate:c.resultadoManutencao,tipo:'despesa'},{nome:'Resultado da manutenção',de:0,ate:c.resultadoManutencao,tipo:'total'}];
 if(periodo.receitaObrasRealizada!==null)degraus.push({nome:'Receita de obras realizada',de:c.resultadoManutencao,ate:c.resultadoFinal!,tipo:'receita'},{nome:'Resultado final',de:0,ate:c.resultadoFinal!,tipo:'total'});
 else if(c.obrasNecessaria>0)degraus.push({nome:'Receita de obras para zerar',de:c.resultadoManutencao,ate:0,tipo:'necessaria'});
 const W=660,H=290,esq=74,dir=8,topo=22,base=46,{ini,fim,ticks}=escala(Math.min(...degraus.flatMap(d=>[d.de,d.ate])),Math.max(...degraus.flatMap(d=>[d.de,d.ate])));
 const y=(v:number)=>topo+(fim-v)/(fim-ini)*(H-topo-base),faixa=(W-esq-dir)/degraus.length,largura=Math.min(64,faixa*0.62);
 return <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Ponte de receitas e despesas do período">
  <defs><pattern id="hachura" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e6f4f4"/><line x1="0" y1="0" x2="0" y2="6" stroke="#008f95" strokeWidth="2.5"/></pattern></defs>
  {ticks.map(t=><g key={t}><line className={t===0?'zero':'grid'} x1={esq} x2={W-dir} y1={y(t)} y2={y(t)}/><text className="axis" x={esq-8} y={y(t)+4} textAnchor="end">{moedaCurta(t)}</text></g>)}
  {degraus.map((d,i)=>{const x=esq+faixa*i+(faixa-largura)/2,y1=y(Math.max(d.de,d.ate)),h=Math.max(1,Math.abs(y(d.de)-y(d.ate))),valor=d.ate-d.de;const acima=d.ate>=d.de;
   return <g key={d.nome}>{i>0&&<line className="ponte" x1={x-(faixa-largura)} x2={x} y1={y(d.de)} y2={y(d.de)}/>}<rect className={'bar '+d.tipo} x={x} y={y1} width={largura} height={h} rx="3"/>
    <text className="value" x={x+largura/2} y={acima?y1-6:y1+h+13} textAnchor="middle">{(valor>0&&d.tipo!=='total'?'+':'')+moedaCurta(valor)}</text>
    {quebrar(d.nome).map((l,k)=><text key={k} className="label" x={x+largura/2} y={H-base+18+k*12} textAnchor="middle">{l}</text>)}</g>;})}
 </svg>;
}
// Comparação entre períodos: barras agrupadas de receita de manutenção e despesa total (mesmo eixo).
function Comparacao({periodos}:{periodos:Periodo[]}){
 const dados=periodos.map(p=>({p,c:calcular(p)}));
 const W=1110,H=180,esq=74,topo=16,base=26,{ini,fim,ticks}=escala(0,Math.max(...dados.flatMap(d=>[d.c.receitaManutencao,d.c.despesaTotal])),3);
 const y=(v:number)=>topo+(fim-v)/(fim-ini)*(H-topo-base),faixa=(W-esq)/dados.length,largura=Math.min(54,faixa*0.3);
 return <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Receita de manutenção e despesa total por período">
  {ticks.map(t=><g key={t}><line className={t===0?'zero':'grid'} x1={esq} x2={W} y1={y(t)} y2={y(t)}/><text className="axis" x={esq-8} y={y(t)+4} textAnchor="end">{moedaCurta(t)}</text></g>)}
  {dados.map(({p,c},i)=>{const centro=esq+faixa*i+faixa/2;return <g key={p.id}>{([['receita',c.receitaManutencao,-1],['despesa',c.despesaTotal,1]] as const).map(([tipo,v,lado])=>{const x=centro+(lado<0?-largura-1:1);return <g key={tipo}><rect className={'bar '+tipo} x={x} y={y(Math.max(0,v))} width={largura} height={Math.max(1,Math.abs(y(v)-y(0)))} rx="3"/><text className="value" x={x+largura/2} y={y(Math.max(0,v))-5} textAnchor="middle">{moedaCurta(v)}</text></g>;})}<text className="label" x={centro} y={H-6} textAnchor="middle">{p.nome||'Período '+(i+1)}</text></g>;})}
 </svg>;
}
const Legenda=({itens}:{itens:[string,string][]})=><div className="legend">{itens.map(([c,t])=><span key={t}><i className={'swatch-'+c}/>{t}</span>)}</div>;
const Sinal=({v}:{v:number})=><span className={v<0?'neg':'pos'}><i aria-hidden="true">{v<0?'▼':'▲'}</i> {moeda(v)}</span>;
export function documentHtmlFinanceiro(p:ProjetoFinanceiro){
 const g=p.gerais,rodape=[g.empresa,g.unidade].filter(Boolean).join(' · ');
 const pag=(key:string,classe:string,rotulo:string,titulo:string,sub:string,children:ReactNode)=><Pagina key={key} classe={classe} rotulo={rotulo} titulo={titulo} sub={sub} obra={rodape}>{children}</Pagina>;
 const paginas=[
  ...p.itens.map(periodo=>{const c=calcular(periodo);return pag(periodo.id,'fin-resumo','RESUMO DO PERÍODO',periodo.nome||'Período',[g.empresa,g.unidade].filter(Boolean).join(' · ')||'Receitas x Despesas',<>
   <div className="kpis"><div><small>Receita de manutenção</small><b>{moeda(c.receitaManutencao)}</b><span>Preventiva + corretiva + VM</span></div><div><small>Despesa total</small><b>{moeda(c.despesaTotal)}</b><span>Sem corretiva + corretiva + VM</span></div><div><small>Resultado da manutenção</small><b><Sinal v={c.resultadoManutencao}/></b><span>Receita − despesa total</span></div><div className="destaque"><small>Receita de obras para zerar</small><b>{moeda(c.obrasNecessaria)}</b><span>{c.obrasNecessaria?'Necessária para cobrir os gastos totais':'Manutenção já cobre os gastos'}</span></div></div>
   <div className="fin-body"><div><Legenda itens={[['receita','Receita'],['despesa','Despesa'],['total','Resultado'],...(periodo.receitaObrasRealizada===null&&c.obrasNecessaria>0?[['necessaria','Obras para zerar'] as [string,string]]:[])]}/><Ponte periodo={periodo}/></div>
    <table className="demonstrativo"><tbody>
     <tr><td>Receita de manutenção preventiva</td><td>{moeda(periodo.receitaPreventiva)}</td></tr><tr><td>Receita de manutenção corretiva + VM</td><td>{moeda(periodo.receitaCorretivaVm)}</td></tr><tr className="sub"><td>Receita de manutenção</td><td>{moeda(c.receitaManutencao)}</td></tr>
     <tr><td>Despesa sem corretiva</td><td>{moeda(-periodo.despesaSemCorretiva)}</td></tr><tr><td>Despesa de corretiva + VM</td><td>{moeda(-periodo.despesaCorretivaVm)}</td></tr><tr className="sub"><td>Despesa total</td><td>{moeda(-c.despesaTotal)}</td></tr>
     <tr className="sub"><td>Resultado da manutenção</td><td><Sinal v={c.resultadoManutencao}/></td></tr><tr><td>Resultado da corretiva (receita − despesa)</td><td><Sinal v={c.resultadoCorretiva}/></td></tr>
     <tr className="total"><td>Receita de obras para zerar</td><td>{moeda(c.obrasNecessaria)}</td></tr>
     {periodo.receitaObrasRealizada!==null&&<><tr><td>Receita de obras realizada{c.cobertura!==null&&` · ${(c.cobertura*100).toLocaleString('pt-BR',{maximumFractionDigits:0})}% da necessária`}</td><td>{moeda(periodo.receitaObrasRealizada)}</td></tr><tr className="total"><td>Resultado final</td><td><Sinal v={c.resultadoFinal!}/></td></tr></>}
    </tbody></table></div></>);}),
  ...(p.itens.length>1?Array.from({length:Math.ceil(p.itens.length/6)},(_,k)=>p.itens.slice(k*6,k*6+6)).map((lista,k)=>pag('evolucao'+k,'fin-evolucao','COMPARATIVO','Evolução por período',`${lista[0].nome} a ${lista[lista.length-1].nome}`,<>
   <Legenda itens={[['receita','Receita de manutenção'],['despesa','Despesa total']]}/><Comparacao periodos={lista}/>
   <table className="rh-table evolucao"><thead><tr><th>Período</th><th>Receita de manutenção</th><th>Despesa total</th><th>Resultado da manutenção</th><th>Obras para zerar</th><th>Obras realizada</th></tr></thead><tbody>{lista.map(per=>{const c=calcular(per);return <tr key={per.id}><td><strong>{per.nome||'Período'}</strong></td><td>{moeda(c.receitaManutencao)}</td><td>{moeda(c.despesaTotal)}</td><td><Sinal v={c.resultadoManutencao}/></td><td>{moeda(c.obrasNecessaria)}</td><td>{per.receitaObrasRealizada===null?'—':moeda(per.receitaObrasRealizada)}</td></tr>;})}</tbody></table></>)):[]),
  p.observacoes&&pag('obs','campo-texto','ANÁLISE','Análise e observações',g.responsavel||rodape||'Receitas x Despesas',<section className="summary"><Texto titulo="Observações" texto={p.observacoes}/></section>),
 ];
 const nomes=p.itens.map(i=>i.nome).filter(Boolean);
 const meta=[g.unidade,nomes.length?(nomes.length>1?`${nomes[0]} a ${nomes[nomes.length-1]}`:nomes[0]):'',g.data&&date(g.data),g.responsavel&&'Responsável: '+g.responsavel].filter((m):m is string=>!!m);
 return documentoBase({modelo:'financeiro',titulo:g.empresa||'Best Clima',subtitulo:g.tipoRelatorio||'RECEITAS X DESPESAS',meta,paginas,css});
}
