import {z} from 'zod';
// Assessment de RH: avaliação de desempenho por competências, metas, plano de desenvolvimento (PDI) e parecer.
export const tiposAvaliacao=['Avaliação do gestor (90°)','Autoavaliação','Avaliação 180°','Avaliação 360°'] as const;
export const grupos=['Comportamental','Técnica','Liderança'] as const;
export const escala=[{nota:1,nome:'Insatisfatório'},{nota:2,nome:'Abaixo do esperado'},{nota:3,nome:'Atende ao esperado'},{nota:4,nome:'Acima do esperado'},{nota:5,nome:'Excepcional'}] as const;
export const statusMeta=['Em andamento','Atingida','Parcialmente atingida','Não atingida'] as const;
export const classificacoes=['Não definida','Abaixo do esperado','Atende parcialmente','Atende ao esperado','Supera o esperado'] as const;
const short=z.string().max(140);
const long=z.string().max(100000);
const date=z.string().refine(v=>v===''||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),'Data inválida');
const id=z.string().min(1);
export const competenciaSchema=z.object({id,nome:short,grupo:z.enum(grupos),nota:z.number().int().min(0).max(5),comentario:short});
export const metaSchema=z.object({id,descricao:short,indicador:short,resultado:short,status:z.enum(statusMeta)});
export const acaoSchema=z.object({id,acao:short,prazo:date,responsavel:short});
export const projetoAssessmentSchema=z.object({formato:z.literal(1),modelo:z.literal('assessment'),versaoModelo:z.literal(1),
 gerais:z.object({colaborador:short,cargo:short,setor:short,avaliador:short,periodo:short,data:date,tipo:z.enum(tiposAvaliacao),tipoRelatorio:short}),
 itens:z.array(competenciaSchema).max(60),metas:z.array(metaSchema).max(60),pdi:z.array(acaoSchema).max(60),
 pontosFortes:long,desenvolvimento:long,parecer:long,classificacao:z.enum(classificacoes)});
export type ProjetoAssessment=z.infer<typeof projetoAssessmentSchema>;
export type Competencia=ProjetoAssessment['itens'][number];
export type Meta=ProjetoAssessment['metas'][number];
export type Acao=ProjetoAssessment['pdi'][number];
const padrao:[string,typeof grupos[number]][]=[['Comunicação','Comportamental'],['Trabalho em equipe','Comportamental'],['Proatividade','Comportamental'],['Comprometimento','Comportamental'],['Organização e planejamento','Comportamental'],['Conhecimento técnico','Técnica'],['Qualidade do trabalho','Técnica'],['Segurança do trabalho (SST)','Técnica'],['Resolução de problemas','Técnica'],['Relacionamento com o cliente','Comportamental']];
export const novaCompetencia=(nome='',grupo:typeof grupos[number]='Comportamental'):Competencia=>({id:crypto.randomUUID(),nome,grupo,nota:0,comentario:''});
export const novaMeta=():Meta=>({id:crypto.randomUUID(),descricao:'',indicador:'',resultado:'',status:'Em andamento'});
export const novaAcao=():Acao=>({id:crypto.randomUUID(),acao:'',prazo:'',responsavel:''});
export const novoProjetoAssessment=():ProjetoAssessment=>({formato:1,modelo:'assessment',versaoModelo:1,gerais:{colaborador:'',cargo:'',setor:'',avaliador:'',periodo:'',data:'',tipo:tiposAvaliacao[0],tipoRelatorio:'ASSESSMENT · AVALIAÇÃO DE DESEMPENHO'},itens:padrao.map(([n,g])=>novaCompetencia(n,g)),metas:[],pdi:[],pontosFortes:'',desenvolvimento:'',parecer:'',classificacao:'Não definida'});
// Média das competências avaliadas (nota 0 = não avaliada).
export function media(itens:Competencia[]){const notas=itens.filter(i=>i.nota>0).map(i=>i.nota);return notas.length?notas.reduce((a,b)=>a+b,0)/notas.length:null;}
export const nomeNota=(nota:number)=>escala.find(e=>e.nota===nota)?.nome||'Não avaliada';
