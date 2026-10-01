import {z} from 'zod';
// Receitas x Despesas: cada período traz os valores lidos da planilha (ou digitados) e os indicadores calculados.
export const camposValor=[
 {key:'receitaPreventiva',label:'Receita de manutenção preventiva',tipo:'receita',obrigatorio:true},
 {key:'receitaCorretivaVm',label:'Receita de manutenção corretiva + VM',tipo:'receita',obrigatorio:true},
 {key:'despesaSemCorretiva',label:'Despesa sem corretiva',tipo:'despesa',obrigatorio:true},
 {key:'despesaCorretivaVm',label:'Despesa de corretiva + VM',tipo:'despesa',obrigatorio:true},
 {key:'receitaObrasRealizada',label:'Receita de obras realizada (opcional)',tipo:'receita',obrigatorio:false},
] as const;
export type CampoValor=typeof camposValor[number]['key'];
const short=z.string().max(140);
const date=z.string().refine(v=>v===''||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),'Data inválida');
const valor=z.number().finite().min(-1e13).max(1e13);
// Origem de um campo: fórmula (C3, C3+D5, SOMA(C3:C9)…) e a aba das referências sem nome de aba.
// Projetos antigos guardavam só a célula; ela vira uma fórmula de uma referência.
const celula=z.union([z.object({aba:z.string().max(200),formula:z.string().min(1).max(1000)}),z.object({aba:z.string().max(200),celula:z.string().regex(/^[A-Z]{1,3}[1-9]\d{0,6}$/)}).transform(c=>({aba:c.aba,formula:c.celula}))]);
export const periodoSchema=z.object({id:z.string().min(1),nome:short,receitaPreventiva:valor,receitaCorretivaVm:valor,despesaSemCorretiva:valor,despesaCorretivaVm:valor,receitaObrasRealizada:valor.nullable(),origem:z.string().max(400),celulas:z.record(z.string(),celula).default({})});
export const projetoFinanceiroSchema=z.object({formato:z.literal(1),modelo:z.literal('financeiro'),versaoModelo:z.literal(1),
 gerais:z.object({empresa:short,unidade:short,tipoRelatorio:short,responsavel:short,data:date}),
 itens:z.array(periodoSchema).max(60),observacoes:z.string().max(100000),
 mapeamento:z.record(z.string(),celula)}).refine(p=>new Set(p.itens.map(i=>i.id)).size===p.itens.length,'Identificadores repetidos');
export type ProjetoFinanceiro=z.infer<typeof projetoFinanceiroSchema>;
export type Periodo=ProjetoFinanceiro['itens'][number];
export type Mapeamento=ProjetoFinanceiro['mapeamento'];
export type Origem=Mapeamento[string];
export const novoPeriodo=(nome=''):Periodo=>({id:crypto.randomUUID(),nome,receitaPreventiva:0,receitaCorretivaVm:0,despesaSemCorretiva:0,despesaCorretivaVm:0,receitaObrasRealizada:null,origem:'',celulas:{}});
export const novoProjetoFinanceiro=():ProjetoFinanceiro=>({formato:1,modelo:'financeiro',versaoModelo:1,gerais:{empresa:'Best Clima',unidade:'',tipoRelatorio:'RECEITAS X DESPESAS',responsavel:'',data:''},itens:[],observacoes:'',mapeamento:{}});
// Receita de obras necessária: quanto as obras precisam faturar para zerar os gastos totais (despesas + corretivas) não cobertos pela manutenção.
export function calcular(p:Periodo){
 const receitaManutencao=p.receitaPreventiva+p.receitaCorretivaVm;
 const despesaTotal=p.despesaSemCorretiva+p.despesaCorretivaVm;
 const resultadoManutencao=receitaManutencao-despesaTotal;
 const obrasNecessaria=Math.max(0,-resultadoManutencao);
 const resultadoCorretiva=p.receitaCorretivaVm-p.despesaCorretivaVm;
 const resultadoFinal=p.receitaObrasRealizada===null?null:resultadoManutencao+p.receitaObrasRealizada;
 const cobertura=p.receitaObrasRealizada===null||!obrasNecessaria?null:p.receitaObrasRealizada/obrasNecessaria;
 return {receitaManutencao,despesaTotal,resultadoManutencao,obrasNecessaria,resultadoCorretiva,resultadoFinal,cobertura};
}
export const moeda=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function moedaCurta(v:number){const a=Math.abs(v),s=v<0?'−':'';if(a>=1e6)return `${s}R$ ${(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})} mi`;if(a>=1e3)return `${s}R$ ${(a/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0})} mil`;return `${s}R$ ${a.toLocaleString('pt-BR',{maximumFractionDigits:0})}`;}
