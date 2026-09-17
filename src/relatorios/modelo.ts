import {z} from 'zod';
import {projetoSchema as qualidade} from './qualidade/modelo';
import {projetoObrasSchema} from './obras/modelo';
export const projetoSchema=z.union([qualidade,projetoObrasSchema]);
export type Projeto=z.infer<typeof projetoSchema>;
