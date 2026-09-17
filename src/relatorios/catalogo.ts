import {camposGerais,camposItem,novoProjeto,layoutQualidade} from './qualidade/modelo';
import {novoProjetoObras} from './obras/modelo';
export const catalogo=[{id:'qualidade',layout:layoutQualidade,nome:'Relatório de Qualidade',descricao:'Inspeções, evidências e avaliação da obra.',camposGerais,camposItem,criar:novoProjeto},{id:'obras',layout:{formato:'16:9',orientacao:'landscape'},nome:'Relatório de Avanço de Obras',descricao:'Registros fotográficos e descritivos das atividades realizadas.',criar:novoProjetoObras}];
