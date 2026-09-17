# Best Clima · Gerador de relatórios

Protótipo 0.1.1 em TypeScript, React e Electron. O PDF de Qualidade enviado pelo usuário é uma referência de conteúdo, não o modelo visual definitivo.

## Executar

No Windows, a versão portátil é gerada em `release/0.1.1/Best Clima Relatórios 0.1.1.exe`. Abra esse arquivo para usar o aplicativo. O executável ainda utiliza o ícone padrão do Electron e não possui assinatura digital.

Com Node.js instalado, nesta pasta:

```powershell
npm.cmd install
node node_modules/electron/install.js
npm.cmd start
```

`npm.cmd run dev` abre um servidor de desenvolvimento local (o terminal informa o endereço). No navegador, a exportação usa a janela de impressão; no Electron, usa o diálogo de salvamento de PDF.

## Uso

1. Escolha **Relatório de Qualidade**.
2. Preencha os dados gerais e, se desejado, a foto da capa.
3. Adicione os registros de inspeção, descrições e fotos.
4. Preencha avaliação e observações.
5. Confira a pré-visualização e exporte o PDF.
6. Use **Salvar projeto** para guardar um `.bcrel`; **Abrir projeto** recupera dados e imagens.

Salvar o PDF não salva o projeto editável. O aplicativo sinaliza alterações não salvas e pede confirmação antes de descartá-las. Não há banco de dados, conta, servidor externo ou dependência de internet para o uso do aplicativo compilado.

## Estrutura

- `desktop/`: integração Electron, ponte restrita para salvar arquivos e exportar PDF.
- `src/interface/`: biblioteca, formulários e pré-visualização.
- `src/relatorios/`: catálogo e definição inicial do modelo de Qualidade.
- `src/documento/`: montagem e paginação do documento.
- `src/identidade/`: paleta, CSS e símbolo fornecido (`bc1.png` da pasta de trabalho).
- `src/projeto/`: validação e arquivo ZIP `.bcrel` com manifesto, JSON e fotos.
- `tests/`: testes de fluxo, imagens, paginação e recuperação do projeto.
- `docs/`: levantamento e decisões do protótipo.
- `scripts/analisar-pdf.mjs`: extração local do PDF de referência. Resultados em `referencias/`, excluída do Git e do aplicativo distribuído.

O catálogo é extensível. Nesta primeira versão, a tela e a montagem detalhada atendem apenas ao modelo de Qualidade. Ao adicionar o segundo modelo, o catálogo deverá receber também as funções de validação e renderização de cada modelo; não há editor visual de modelos nesta entrega.

## Verificar e empacotar

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run package:win
```

Os testes de interface usam Microsoft Edge em modo headless. A compilação do pacote Mac deve ser feita e validada em um Mac: `npm run package:mac`. Assinatura de distribuição e notarização não estão configuradas neste protótipo.

Para testar a integração nativa: `node scripts/testar-desktop.mjs`. Para testar o aplicativo empacotado: `node scripts/testar-desktop.mjs "release/win-unpacked/Best Clima Relatórios.exe"`. Esses testes usam janela oculta e salvam exemplos em `verificacao/`.

## Limites desta versão

- Proposta de layout A4 vertical com registros em blocos, observações e avaliação; não é reprodução da tabela horizontal do PDF original.
- Um arquivo de imagem por evidência e um por correção em cada registro, além da imagem de capa. PNG, JPG ou WebP, até 10 MB e 40 megapixels por imagem.
- Campos curtos: até 140 caracteres; descrição e observações: até 100 mil caracteres. Até 10 mil registros e projeto de até 200 MB compactado/250 MB descompactado, limites de proteção do protótipo.
- As descrições extensas continuam em blocos nas próximas páginas. Blocos que excedam a área útil impedem exportação e mostram um erro, em vez de cortar conteúdo silenciosamente.
- Não há salvamento automático, migração de versões antigas, nem integração com site.
- Revisão dos campos obrigatórios, opções dos campos, layout e aprovação da diretoria ainda pendentes. O protótipo permite exportar campos não preenchidos, indicados por um traço.
- Fonte do documento: Arial local. Uniformidade tipográfica entre sistemas ainda depende de validação no Mac; a distribuição de uma fonte licenciada junto do app pode ser definida posteriormente.

## Correção 0.1.1

A exportação de PDF carrega o documento por um arquivo HTML temporário local, removido ao terminar (inclusive em falhas). Isso evita o erro ERR_INVALID_URL em relatórios com imagens grandes. O formato .bcrel permanece compatível com a versão 0.1.0.
