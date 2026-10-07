# Portal de Estilos

Um laboratório de direção visual totalmente estático, em português do Brasil. Combine 20 estilos, 30 layouts e 12 paletas: 7.200 combinações básicas, antes de contar os modificadores. A prévia e as três saídas — prompt, CSS e tokens JSON — usam a mesma composição de dados.

## Executar localmente

Não é necessário instalar pacotes, compilar ou configurar um backend. Na pasta deste projeto, execute:

```sh
python -m http.server 8000
```

Abra `localhost:8000` no navegador. Para testar como subpasta, execute o mesmo comando na pasta imediatamente acima e abra `localhost:8000/portal-de-estilos/`.

Abrir `index.html` pelo protocolo `file:` não funciona: os navegadores bloqueiam a leitura de JSON e parciais por esse protocolo. Use um servidor estático local. O servidor é apenas uma ferramenta de desenvolvimento; não existe backend de aplicação.

## Publicar no GitHub Pages

1. Crie um repositório e coloque o conteúdo desta pasta na raiz dele, incluindo `.nojekyll`, `vendor`, `data` e todos os parciais. Não envie a pasta acima com outros projetos.
2. Envie os arquivos para a branch principal do repositório.
3. No GitHub, abra **Settings → Pages → Build and deployment**.
4. Escolha **Deploy from a branch**, selecione sua branch e a pasta **/(root)**. Salve.
5. Aguarde a publicação e abra o endereço mostrado pelo GitHub Pages.
6. Aguarde a indicação **Todos os estilos disponíveis offline** antes de testar sem conexão.

Todos os caminhos de execução são relativos à pasta do `index.html`. O service worker e o manifesto têm escopo `./`; o projeto funciona em uma subpasta sem alterar caminhos. Nenhuma conta, chave, login ou API é necessária para usar o portal.

O projeto está pronto para publicação, mas criar ou publicar um repositório não faz parte dos arquivos locais entregues. A publicação depende do repositório e da conta escolhidos por você.

## Usar o portal

- Escolha **Estilo**, **Layout** ou **Paleta** no painel da esquerda. Há busca por nome e filtro de categoria na seleção de layouts.
- Ajuste modo, fonte do sistema, raio, densidade e sombra. “Do estilo” preserva a decisão original de raio e sombra; um valor explícito a substitui.
- Experimente as dimensões desktop, tablet e celular. O conteúdo responde à largura disponível do preview com container queries; em uma janela pequena, o tamanho é limitado ao espaço visível.
- Alterne entre a composição e **Componentes**. O catálogo carrega cada um dos 36 parciais isoladamente.
- Copie ou baixe a saída selecionada. A cópia fica habilitada somente quando a prévia termina de carregar, para evitar divergência entre o que está visível e o que é copiado.
- O hash representa todas as escolhas, inclusive tela, dispositivo e tamanho do prompt. O botão de link copia a combinação. Perfis, notas e nomes privados não entram no link.
- **Aleatório** sorteia estilo, layout e paleta. **Resetar** restaura os padrões declarados no JSON.
- Em celulares, o botão **Personalizar combinação** abre a gaveta inferior. Escape fecha a gaveta; o foco fica contido enquanto ela está aberta.

As ações ilustrativas da prévia operam somente na sessão e podem ser reiniciadas ao trocar o layout. Chat, feed, carrinho, acesso e escolha de plano são demonstrações locais. Não há autenticação, compra, pagamento ou envio a terceiros.

## Estrutura

```text
index.html
css/
  base.css
  componentes.css
  portal.css
data/
  estilos.json
  paletas.json
  layouts.json
  componentes.json
  modificadores.json
  prompt-modelos.json
partials/
  layouts/        30 fragmentos de estrutura
  componentes/   36 fragmentos de componentes
js/
  dados.js       carregamento e validação dos catálogos
  estado.js      estado validado, aleatório e hash
  tema.js        composição de tokens e cálculo de contraste
  prompt.js      templates e exportações de tema
  armazenamento.js
  perfis.js      validação, mesclagem e operações da biblioteca
  perfis-ui.js   interface de perfis
  componentes.js interações das demonstrações
  util.js        diálogos, arquivos e clipboard
  app.js         integração e interface do portal
vendor/
  htmx.min.js
  LICENSE-htmx.txt
img/
  icon.svg
  paisagem.svg
  objeto.svg
tests/
sw.js
manifest.webmanifest
.nojekyll
README.md
RELATORIO-TESTES.md
```

htmx 2.0.11 está incluído localmente, com sua licença original Zero-Clause BSD. Origem: repositório oficial `bigskysoftware/htmx`, tag `v2.0.11`, arquivo `dist/htmx.min.js`. Não existe chamada a CDN em execução. As fontes são do sistema; nenhuma pasta de fontes é necessária. Os SVGs de demonstração foram criados para este projeto.

## Dados como fonte única

Os seletores, nomes, descrições, contagem de combinações e prompt são derivados dos JSON. Não há enumerações de estilos, layouts ou paletas no código de interface. Os caminhos dos parciais são lidos dos catálogos e aplicados em `hx-get`, `hx-target` e `hx-swap`. O htmx realiza as requisições e trocas de HTML; JavaScript puro mantém estado, aplica tokens, valida os arquivos e implementa interações que exigem estado local.

- `estilos.json`: `id`, `nome`, `descricao`, `tokens`, `prompt`. Os tokens contêm raio, sombras, borda, opacidade, blur, pesos, transição, textura e gradiente.
- `paletas.json`: `id`, `nome`, `descricao`, `tokens.claro`, `tokens.escuro`, `prompt`. Além das onze cores semânticas, há tokens `--sobre-*` para texto sobre cores de ação e status.
- `layouts.json`: `id`, `nome`, `categoria`, `caminho`, `descricao`, `prompt`, `componentes`, `titulo`, `subtitulo`.
- `componentes.json`: `id`, `nome`, `caminho`, `regras`, `estados`.
- `modificadores.json`: opções de tipografia, raios, densidades, sombras, modos e dispositivos; `tokensBase` e `padrao`.
- `prompt-modelos.json`: `versao`, `restricoes`, `modelos` e `cssReferencia`.

IDs precisam ser únicos, em minúsculas, com letras, números e hífens. Cores devem usar hexadecimal de seis dígitos. Caminhos de parciais são relativos e restritos a `partials/layouts/` ou `partials/componentes/`. A validação rejeita JSON inválido, IDs repetidos, referências inexistentes e CSS com recursos externos ou instruções executáveis.

### Acrescentar uma opção

Um estilo ou uma paleta exige apenas um registro no JSON correspondente. Copie um registro completo como base e ajuste seus valores; não é necessário editar HTML ou JavaScript.

Um layout exige um registro em `layouts.json` e um parcial. O parcial pode conter regiões semânticas e slots no formato:

```html
<div class="component-slot" data-component="campo-texto" data-rotulo="Nome da ideia"></div>
```

O ID vem de `componentes.json`; o código resolve seu caminho automaticamente. `data-rotulo` é opcional e adapta os textos marcados com esse atributo dentro do componente. Use pelo menos 25 tipos de componente e liste os IDs usados no registro do layout. O checklist verifica se a lista e os slots do parcial concordam.

Um componente novo exige um registro e seu parcial; aparece automaticamente no catálogo. Não coloque scripts no parcial. Use as classes e variáveis existentes; adicione comportamento delegado somente se o novo componente exigir uma interação inédita.

As opções novas entram automaticamente nos seletores e no contador. O cache de parciais também é descoberto pelos JSON. Na publicação de qualquer nova versão, altere `VERSAO` em `sw.js`, para os visitantes que já possuem cache receberem um aviso de atualização. Isso é manutenção de versão, não uma lista adicional de estilos ou arquivos parciais.

## Precedência e contraste

A composição segue esta ordem: tokens básicos → paleta do modo escolhido → estilo → tipografia → raio → densidade → sombra. Nenhuma classe CSS identifica um estilo ou uma paleta. Classes de layout definem apenas organização espacial; o visual depende dos tokens.

Os testes de contraste percorrem todas as paletas nos dois modos. São verificados texto principal, texto secundário, cores de ação e status contra fundo e superfície (mínimo 4,5:1); cada `--sobre-*` contra sua cor (mínimo 4,5:1); borda contra fundo e superfície (mínimo 3:1). Há margem no ajuste das cores. Texto comum fica sobre superfícies legíveis, inclusive nos estilos com gradiente e translucidez. Gráficos e decoração não carregam informação essencial exclusivamente pela cor.

Elementos interativos têm hover, foco, ativo e desabilitado. Elementos estáticos, como divisor, skeleton, imagem informativa e tipografia, não recebem tabulação ou estado de botão artificial. Existem exemplos visuais desabilitados; indisponibilidade usa também semântica nativa. Movimento respeita `prefers-reduced-motion`.

Os pares verificados não equivalem a uma certificação formal de acessibilidade de qualquer aplicação gerada a partir do prompt. O relatório distingue cálculos, inspeção visual e verificações de comportamento.

## Biblioteca e formato de perfis

Dados persistem na chave `portal-de-estilos:v1` do `localStorage`. O portal mantém a última combinação e o perfil ativo. Cada perfil também mantém sua combinação recente; ao trocar de perfil, ela é restaurada. Favoritos aparecem primeiro. Duplicar um perfil cria novos IDs para o perfil e suas combinações.

Exportações usam `versao: 1`. São aceitos três envelopes:

1. **Todos os perfis:** `tipo: "perfis"`, `perfilAtivo`, `ultimaCombinacao`, `perfis` e `exportadoEm`.
2. **Um perfil:** `tipo: "perfil"`, `perfil` e `exportadoEm`.
3. **Uma combinação:** `tipo: "combinacao"`, `combinacao` e `exportadoEm`.

Exemplo completo de uma combinação exportada:

```json
{
  "versao": 1,
  "tipo": "combinacao",
  "exportadoEm": "2026-10-07T12:00:00.000Z",
  "combinacao": {
    "id": "exemplo-combinacao",
    "nome": "Workspace essencial",
    "nota": "Direção visual do painel da equipe.",
    "criadaEm": "2026-10-07T12:00:00.000Z",
    "atualizadaEm": "2026-10-07T12:00:00.000Z",
    "favorita": true,
    "variaveis": {
      "estilo": "minimalista-suico",
      "layout": "dashboard",
      "paleta": "verde-esmeralda",
      "modo": "claro",
      "tipografia": "geometrica",
      "raio": "estilo",
      "densidade": "confortavel",
      "sombra": "estilo",
      "dispositivo": "desktop",
      "tela": "layouts",
      "tamanhoPrompt": "completo-css"
    }
  }
}
```

Um perfil contém `id`, `nome`, `criadoEm`, `atualizadoEm`, `ultimaCombinacao` e `combinacoes`. `ultimaCombinacao` tem o mesmo formato de `variaveis`; `combinacoes` é uma lista de objetos como `combinacao` do exemplo. Datas são ISO 8601. Nomes têm até 120 caracteres, notas até 4.000, arquivos de importação até 5 MB. A biblioteca admite até 300 perfis e 3.000 combinações por perfil.

**Mesclar** compara IDs de perfis e combinações. Novos IDs são adicionados; combinações com o mesmo ID usam a versão com `atualizadaEm` mais recente. Importar o mesmo arquivo novamente não cria duplicatas. O perfil ativo atual é preservado. Uma combinação avulsa entra no perfil ativo.

**Substituir** usa a biblioteca importada e seu perfil ativo. Um perfil avulso passa a ser toda a biblioteca. Uma combinação avulsa cria uma biblioteca nova com um perfil contendo essa combinação. A estrutura é validada antes da confirmação; cancelar não altera dados. Excluir perfil ou combinação também exige confirmação.

Erros de acesso, limite de quota, JSON malformado ou versão incompatível produzem mensagens legíveis. Se a persistência falhar, a sessão continua em memória; exporte o JSON antes de fechar. Não há sincronização entre dispositivos nem cópia em nuvem.

## Offline e atualizações

O service worker faz pré-cache de toda a aplicação, dos seis JSON, dos 30 layouts, dos 36 componentes, dos SVGs e do htmx local. A instalação só é concluída após todos os recursos terem sido guardados. Não é necessário visitar cada layout individualmente antes de ficar offline. A primeira visita precisa terminar a instalação; confirme o indicador no rodapé.

O nome do cache inclui o caminho da subpasta e a versão, evitando interferência entre instalações em repositórios diferentes. O worker novo aguarda; o portal mostra um aviso para atualizar. **Atualizar agora** ativa a versão pronta e recarrega a interface. As escolhas e a biblioteca ficam no armazenamento local. A ativação limpa apenas caches antigos desta instalação.

Não há dependências remotas em execução. Ao buscar a palavra `http`, são esperadas apenas referências técnicas: nomes do servidor estático, a diretiva `http-equiv` de segurança, URIs de namespace SVG e literais internos da biblioteca htmx original. Namespaces SVG identificam o formato e não geram requisições. A auditoria também verifica atributos de recursos, regras CSS, origem das requisições no navegador e o funcionamento offline.

O navegador pode remover caches de qualquer PWA por falta de espaço ou políticas de privacidade. Nesse caso é necessário voltar online para recarregar os arquivos. A instalação como aplicativo depende do suporte do navegador a manifestos e ícones SVG; o uso no navegador continua disponível.

## Reexecutar o checklist

O site não depende de Node nem Playwright; eles são ferramentas opcionais de teste.

```sh
node tests/verificar.mjs
```

Esse teste valida JSON, quantidades, slots de todos os layouts, caminhos, contraste, 14.400 composições incluindo os dois modos, estados, prompts, perfis, importação, mesclagem, armazenamento indisponível e ausência de recursos remotos. O teste de navegador usa Playwright:

```sh
python -m http.server 8000
node tests/navegador.cjs
```

Configure `PORTAL_TEST_URL` se usar outra porta ou testar a partir da pasta superior. Configure `PLAYWRIGHT_MODULE` com o caminho do pacote Playwright caso ele não esteja disponível no ambiente padrão. O teste grava evidências na pasta ignorada `test-results`. Consulte `RELATORIO-TESTES.md` para os resultados desta entrega.
