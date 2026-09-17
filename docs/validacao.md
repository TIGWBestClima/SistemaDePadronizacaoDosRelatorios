# Validação do protótipo — 15/09/2026

## Verificações concluídas

- Compilação TypeScript da interface e do Electron, e geração dos arquivos de produção pelo Vite.
- Três testes automatizados de interface passaram no Microsoft Edge headless no Windows.
- Preenchimento de dados, inserção de imagem, salvamento em `.bcrel` e reabertura com preservação de campos, status e imagem.
- Descrição longa dividida em continuações, conferindo igualdade de todo o texto após paginação.
- Quantidade de páginas de um PDF gerado por Chromium igual à quantidade de páginas da pré-visualização.
- Importação de arquivo inválido sem substituir o relatório em edição.
- Importação de projeto com 66 registros, conferência da presença de todos e da numeração final.
- Observações com muitas quebras de linha preservadas integralmente, sem extrapolar a área útil das páginas.
- Execução no Electron e na versão Windows empacotada (`release/win-unpacked`), com salvamento nativo do arquivo de projeto e exportação de PDF de três páginas, igual à prévia.
- Inspeção visual de captura da interface.

## Limites da verificação

Não foi executado em macOS. Os testes de exportação não constituem aprovação editorial ou técnica dos relatórios, nem abrangem todas as combinações de imagens, comprimentos e fontes. O exemplo fornecido pelo usuário serviu para mapear os campos; as ocorrências reais não são dados padrão do aplicativo.

A instalação/distribuição assinada e a aprovação da diretoria permanecem fora desta entrega de protótipo.

## Correção 0.1.1 — exportação com imagem grande

- Erro ERR_INVALID_URL reproduzido no executável 0.1.0 com PNG de 3.652.467 bytes e HTML de 5.004.485 caracteres.
- O documento passou a ser carregado de um arquivo temporário local, sem serializar o conteúdo em uma URL de navegação.
- Teste nativo da correção: PDF com três páginas, descrição e evidência preservadas.
- Limpeza dos arquivos temporários e da janela de impressão verificada tanto após sucesso como após falha de gravação.
- Novo teste de regressão: `node scripts/testar-pdf-grande.mjs`.
- Arquivos .bcrel da versão 0.1.0 continuam compatíveis; o formato de dados não foi alterado.
