# Releases pelo GitHub

O workflow `.github/workflows/release.yml` gera Windows x64 (`.exe` portátil), Mac Intel (`mac-x64.dmg`) e Mac Apple Silicon (`mac-arm64.dmg`).

## Nova versão

1. Atualize a versão no `package.json`, `package-lock.json` e na identificação da interface.
2. Faça commit e push das mudanças.
3. Crie e envie uma tag correspondente, por exemplo:

```sh
git tag v0.2.0
git push origin v0.2.0
```

4. Acompanhe **Actions → Gerar aplicativos**.
5. Quando as três compilações terminarem, confira o rascunho em **Releases**. Teste os aplicativos nos sistemas correspondentes e publique o rascunho.

Versões anteriores continuam disponíveis em Releases. Não reutilize tags já publicadas.

## Gerar para teste

Em **Actions → Gerar aplicativos → Run workflow**, selecione a branch. Essa execução disponibiliza os arquivos em **Artifacts** por 30 dias, sem criar uma release quando executada em uma branch.

## Assinatura do Mac

O fluxo inicial usa assinatura ad-hoc e não exige certificado Apple, mas não faz notarização. O macOS pode exigir aprovação em Privacidade e Segurança. A distribuição com assinatura Developer ID e notarização requer configurar os certificados e credenciais Apple como secrets do repositório. Não coloque certificados ou senhas no código.

Os testes de relatórios são executados no Windows; a compilação no Mac não substitui um teste de abertura, importação e PDF em um Mac real.
