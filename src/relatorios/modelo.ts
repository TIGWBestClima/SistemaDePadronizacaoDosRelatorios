import {z} from 'zod';
import {projetoSchema as qualidade} from './qualidade/modelo';
import {projetoObrasSchema} from './obras/modelo';
import {projetoCampoSchema} from './campo/modelo';
import {projetoAssessmentSchema} from './assessment/modelo';
import {projetoFinanceiroSchema} from './financeiro/modelo';
export const projetoSchema=z.union([qualidade,projetoObrasSchema,projetoCampoSchema,projetoAssessmentSchema,projetoFinanceiroSchema]);
export type Projeto=z.infer<typeof projetoSchema>;
export const modelos=['qualidade','obras','visita','fotografico','dutos','apontamento','assessment','financeiro'] as const;
// Modelos sem fotos: o projeto guarda apenas os dados.
export const semImagens=(modelo:string)=>modelo==='assessment'||modelo==='financeiro';
