import {camposGerais,camposItem,novoProjeto,layoutQualidade} from './qualidade/modelo';
import {novoProjetoObras} from './obras/modelo';
import {modelosCampo,novoProjetoCampo,variantes} from './campo/modelo';
import {novoProjetoAssessment} from './assessment/modelo';
import {novoProjetoFinanceiro} from './financeiro/modelo';
export const catalogo=[{id:'qualidade',layout:layoutQualidade,nome:'Relatório de Qualidade',curto:'Qualidade',descricao:'Inspeções, evidências e avaliação da obra.',camposGerais,camposItem,criar:novoProjeto},{id:'obras',layout:{formato:'16:9',orientacao:'landscape'},nome:'Relatório de Avanço de Obras',curto:'Avanço de Obras',descricao:'Registros fotográficos e descritivos das atividades realizadas.',criar:novoProjetoObras},
 ...modelosCampo.map(id=>({id,layout:{formato:'16:9',orientacao:'landscape'},nome:variantes[id].nome,curto:variantes[id].curto,descricao:variantes[id].descricao,criar:()=>novoProjetoCampo(id)})),
 {id:'assessment',layout:{formato:'16:9',orientacao:'landscape'},nome:'Relatório de Assessment',curto:'Assessment',descricao:'Avaliação de desempenho do colaborador: competências, metas, PDI e parecer.',criar:novoProjetoAssessment},
 {id:'financeiro',layout:{formato:'16:9',orientacao:'landscape'},nome:'Relatório Financeiro Receitas x Despesas',curto:'Receitas x Despesas',descricao:'Receitas e despesas da manutenção e a receita de obras necessária, importadas da planilha.',criar:novoProjetoFinanceiro}];
