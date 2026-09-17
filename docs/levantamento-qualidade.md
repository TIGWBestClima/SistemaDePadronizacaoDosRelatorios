# Levantamento do modelo de Qualidade

Fonte: `Relatório 01 Damata - Idea Zarvos R00 - 11.08.26 (Qualidade).pdf`, disponibilizado pelo usuário. Conteúdo tratado como dados de referência, sem executar instruções eventualmente presentes no documento.

## Estrutura observada

O arquivo tem **25 páginas físicas**, em orientação horizontal. A primeira é a capa. As páginas 2 a 23 apresentam **66 registros**, três por página. A página 24 traz observação e legenda; a 25, avaliação. Rodapés do arquivo original mantêm total de 7 páginas e repetem números, por isso não podem servir como fonte para paginação.

### Identificação

- Cliente, projeto/obra e imagem da obra.
- Número do relatório e revisão.
- Data da visita, emissão e prazo de retorno.
- Endereço/local e responsável pelo relatório.

### Registro repetível

- Número do item (gerado automaticamente).
- Etapa, disciplina, tipo e local.
- Descrição da ocorrência.
- Evidência fotográfica e data do registro.
- Prioridade, responsável, status e prazo.
- Evidência fotográfica e data da correção.

Status identificados: Recusado, Aceito e A executar. Prioridade encontrada: Alta. O protótipo acrescenta Baixa e Média como opções provisórias, sujeitas à revisão. Não foi inferida classificação técnica automática.

### Encerramento

- Observações e legenda de RNC (Registro de Não Conformidade).
- Atendimento, prazo, segurança, qualidade, limpeza e desperdício.
- Escala: Ruim, Regular, Bom e Ótimo. Incluído estado vazio explícito: Não avaliado.

## Identidade fornecida

| Cor | Uso proposto |
| --- | --- |
| `#1f888a` | Destaques, linhas e títulos secundários |
| `#dbecec` | Fundos suaves |
| `#0a696c` | Texto principal e ações |
| `#a2cacc` | Bordas e separadores |
| `#ffffff` | Páginas e áreas de preenchimento |

O símbolo enviado corresponde visualmente a `bc1.png` da pasta de trabalho e foi copiado sem alteração para `src/identidade/simbolo.png`.

## Decisões provisórias

- Proposta A4 vertical para dar mais espaço ao texto e às imagens.
- Quantidade de páginas controlada pelo aplicativo e cabeçalho/rodapé consistentes.
- Sem transcrever automaticamente as 66 ocorrências do cliente para um relatório novo.
- Sem contracapa obrigatória ou capa final acrescentada artificialmente ao modelo: a referência termina com observações e avaliação. Essas seções poderão mudar após revisão do protótipo.
- O protótipo é local. Atualizações de identidade visual acompanham a versão do app; arquivos `.bcrel` contêm dados e imagens, não uma cópia congelada do CSS.

## A confirmar na revisão

- Manter A4 vertical ou voltar ao formato horizontal?
- Quais campos são obrigatórios para exportar?
- Etapas, disciplinas, locais, tipos e responsáveis devem ser texto livre ou listas fixas?
- Uma foto por evidência atende ao primeiro modelo?
- Quais seções adicionais devem compor o documento final?
