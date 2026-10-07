# Portal de Estilos — relatório de entrega e testes

Projeto concluído em 7 de outubro de 2026. São **99 arquivos de fonte**, sem build, framework, backend, login, APIs, CDN ou recursos externos em execução. O pacote está preparado para GitHub Pages; a publicação em uma conta/repositório não foi realizada.

## Resultado geral

**21 grupos automatizados aprovados**, mais a auditoria dos componentes renderizados. Não houve requisição externa nem exceção JavaScript no teste de integração.

| Item solicitado | Resultado observado |
|---|---|
| Estilos, layouts e paletas | 20 estilos, 30 layouts, 12 paletas; contador de 7.200 combinações derivado dos JSON. |
| Componentes por layout | 36 tipos presentes em cada um dos 30 parciais; pelo menos 31 tipos renderizados e não ocultos no estado inicial em dimensão celular. |
| Catálogo | 36 componentes isolados, carregados via htmx e usando a mesma combinação. |
| Ausência de recursos externos | Zero requisições para outras origens; nenhum atributo de recurso ou dependência remota no código da aplicação. |
| Offline após primeira visita | Recarga real com rede desativada, abertura dos 30 layouts e do catálogo. Todos passaram. |
| Cache de arquivos | Todos os 99 arquivos de fonte e a rota inicial estão no pré-cache. Parciais são descobertos pelos JSON. Evidências geradas de testes não são recursos da aplicação. |
| Atualização do PWA | Worker de teste instalado em espera, aviso exibido, ativação pelo botão e biblioteca preservada. A versão temporária foi restaurada; versão de entrega: 1.0.2. |
| Perfis | Criar, renomear, duplicar, excluir com confirmação, guardar, favoritar, aplicar e restaurar após recarga: aprovados. |
| Importação e exportação | Perfil, biblioteca e combinação avulsa; validação de versão e estrutura, erro legível, mesclagem sem duplicatas e substituição confirmada: aprovados. |
| Prompt, CSS e JSON | Saídas geradas do mesmo estado; três tamanhos de prompt completos, CSS de variáveis e JSON com todos os tokens. |
| Clipboard e arquivos | Conteúdo copiado igual à saída exibida; arquivo baixado com conteúdo correspondente. No Windows, finais de linha CRLF foram normalizados na comparação. |
| Trocas rápidas | Copiar fica desabilitado enquanto o layout solicitado não está pronto, inclusive quando estilo ou modo são alterados durante a requisição. |
| Subpasta | Aplicação, parciais, módulos, imagens, manifesto e service worker funcionaram em /portal-de-estilos/. |
| Responsividade | 30 layouts em prévia de 390px, sem transbordamento horizontal global; gaveta no portal móvel e foco contido. |
| Contraste | 576 pares de texto/ação/borda e 192 verificações adicionais nos extremos dos gradientes passaram nos limites aplicáveis. |
| Acessibilidade e movimento | Teclado em abas, diálogos, acordeões, menus e slider; retorno de foco do diálogo, IDs únicos no catálogo e movimento reduzido: aprovados. |

## O que foi criado

- `index.html`: laboratório com controles, miniaturas, filtros, prévia, saídas, perfis e gaveta móvel.
- `css/base.css`, `css/componentes.css`, `css/portal.css`: base acessível, sistema visual por tokens e interface do portal.
- Seis arquivos em `data/`: estilos, paletas, layouts, componentes, modificadores e modelos de prompt.
- Trinta parciais em `partials/layouts/` e 36 em `partials/componentes/`.
- Dez módulos em `js/`: dados, estado, tema, prompt, armazenamento, perfis, interface de perfis, componentes, utilitários e integração.
- htmx 2.0.11 e licença Zero-Clause BSD em `vendor/`.
- Três SVGs locais em `img/`: ícone instalável, paisagem e objeto de demonstração.
- `sw.js`, `manifest.webmanifest`, `.nojekyll`, `.gitignore`, documentação e dois scripts de testes reproduzíveis.

## Alcance dos testes

O navegador usado foi **Chromium 145.0.7632.6**, controlado por Playwright em modo headless. A interface foi inspecionada em desktop de 1440 × 1000 e celular de 390 × 844. A prévia também foi validada com largura de 390px. O servidor de teste foi o servidor estático do Python, acessado apenas localmente.

A lógica gerou e validou **14.400 combinações**: 20 estilos × 30 layouts × 12 paletas × 2 modos. O navegador renderizou os 30 layouts online e offline e aplicou 480 temas: 20 estilos × 12 paletas × 2 modos. A inspeção visual por captura foi feita em amostras representativas, incluindo o painel padrão, a gaveta móvel, Neobrutalism, Glassmorphism escuro e Editorial. Não se afirma que as 7.200 combinações foram inspecionadas visualmente uma a uma.

Os 36 tipos aparecem em todos os layouts. Alguns controles ficam dentro das etapas futuras do wizard ou são ocultados em cabeçalhos móveis; mesmo nessas situações o mínimo solicitado de 25 elementos é superado. Elementos informativos como divisor e skeleton não recebem estados de botão artificiais.

### Grupos de teste aprovados

- PASSOU — Quantidades e catálogos completos.
- PASSOU — Cada layout possui 36 tipos de componente e caminhos locais existentes.
- PASSOU — Contraste AA nas 12 paletas, em ambos os modos.
- PASSOU — Texto principal e secundário nos extremos dos gradientes de estilo.
- PASSOU — 7.200 combinações em cada modo: 14.400 temas e prompts coerentes.
- PASSOU — Modificadores, precedência, catálogo e três tamanhos de prompt.
- PASSOU — Validação rejeita catálogos, referências, tokens e estados inválidos.
- PASSOU — Perfis: criar, renomear, duplicar, salvar, favorito, exportar, importar, mesclar e excluir.
- PASSOU — Persistência e erros de armazenamento indisponível, cheio ou malformado.
- PASSOU — Sem dependências ou recursos de rede externos.
- PASSOU — Inicialização em subpasta, htmx local e pré-cache completo.
- PASSOU — Seletores, busca, filtro, modificadores, saídas e clipboard sincronizados.
- PASSOU — Catálogo completo e interações acessíveis: carrossel, diálogo, abas, menu, toast e tabela.
- PASSOU — Perfis pela interface: persistência, CRUD, favorito, arquivos, mesclar e substituir.
- PASSOU — Todos os 30 layouts renderizados online e na dimensão celular.
- PASSOU — Comportamentos próprios: wizard, kanban, chat, calendário e feed.
- PASSOU — Temas renderizados, modificadores, movimento reduzido e responsividade do portal.
- PASSOU — Offline real: recarga, 30 layouts nunca dependem de rede e catálogo disponível.
- PASSOU — Aviso de atualização, ativação da nova versão e preservação do perfil.
- PASSOU — Falhas legíveis de JSON e armazenamento bloqueado.
- PASSOU — Nenhuma requisição externa ou exceção JavaScript.

## Contagem e lista completa por layout

A coluna “renderizados” conta tipos com caixa visível no DOM em dimensão celular, incluindo conteúdo que pode exigir rolagem. Ela exclui componentes ocultos por etapas ou regras responsivas. A numeração dos tipos está no catálogo abaixo.

| Layout | Tipos presentes | Renderizados | Lista completa de tipos |
|---|---:|---:|---|
| Sidebar fixa + conteúdo | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Topbar + conteúdo | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Dashboard de cards | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Bento grid | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Holy grail | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Split screen | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Hero + seções | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Landing de rolagem longa | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Masonry | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Grid de galeria | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Lista + detalhe | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Kanban | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Tabela de dados com filtros | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Formulário em etapas (wizard) | 36 | 31 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Formulário de coluna única | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Feed/timeline | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Chat | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Calendário | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Configurações com abas | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Login centralizado | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Login split | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Página de preços | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Blog/artigo | 36 | 36 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Documentação com índice lateral | 36 | 36 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Perfil de usuário | 36 | 36 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| E-commerce (grade de produtos) | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Página de produto | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Painel administrativo com KPIs | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Mobile com bottom nav | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Erro/estado vazio | 36 | 35 | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 |

### Catálogo dos 36 tipos

1. **Botão primário** — `botao-primario`.
2. **Botão secundário/outline** — `botao-secundario`.
3. **Botão de ícone** — `botao-icone`.
4. **Grupo segmentado** — `segmentado`.
5. **Campo de texto** — `campo-texto`.
6. **Área de texto** — `area-texto`.
7. **Lista suspensa** — `select`.
8. **Checkbox** — `checkbox`.
9. **Radio** — `radio`.
10. **Toggle/switch** — `switch`.
11. **Slider/range** — `slider`.
12. **Campo de busca** — `busca`.
13. **Card** — `card`.
14. **Carrossel** — `carrossel`.
15. **Molduras de imagem** — `moldura`.
16. **Bloco decorativo** — `bloco`.
17. **Avatar** — `avatar`.
18. **Badge/etiqueta** — `badge`.
19. **Chip/tag removível** — `chip`.
20. **Alerta/banner** — `alerta`.
21. **Toast/notificação** — `toast`.
22. **Modal/diálogo** — `modal`.
23. **Tooltip** — `tooltip`.
24. **Abas** — `abas`.
25. **Acordeão** — `acordeao`.
26. **Menu dropdown** — `dropdown`.
27. **Barra de navegação** — `navegacao`.
28. **Breadcrumb** — `breadcrumb`.
29. **Paginação** — `paginacao`.
30. **Tabela** — `tabela`.
31. **Lista com ícones** — `lista`.
32. **Barra de progresso** — `progresso`.
33. **Skeleton/carregamento** — `skeleton`.
34. **Divisor** — `divisor`.
35. **Tipografia** — `tipografia`.
36. **Rodapé** — `rodape`.

## Contraste das paletas

O mínimo de texto inclui corpo, texto secundário, cores de ação/status sobre fundo e superfície e tokens de texto sobre ação. Texto comum exige 4,5:1; bordas de controles exigem 3:1. Os valores abaixo são os menores de cada conjunto, arredondados apenas para apresentação. Os testes usam a precisão integral.

| Paleta | Modo | Menor contraste de texto | Menor contraste de borda | Resultado |
|---|---|---:|---:|---|
| Azul oceano | claro | 4.760:1 | 3.147:1 | PASSOU |
| Azul oceano | escuro | 4.731:1 | 3.118:1 | PASSOU |
| Verde esmeralda | claro | 4.766:1 | 3.147:1 | PASSOU |
| Verde esmeralda | escuro | 4.705:1 | 3.118:1 | PASSOU |
| Roxo violeta | claro | 4.756:1 | 3.147:1 | PASSOU |
| Roxo violeta | escuro | 4.714:1 | 3.118:1 | PASSOU |
| Laranja solar | claro | 4.758:1 | 3.147:1 | PASSOU |
| Laranja solar | escuro | 4.702:1 | 3.118:1 | PASSOU |
| Rosa magenta | claro | 4.755:1 | 3.147:1 | PASSOU |
| Rosa magenta | escuro | 4.729:1 | 3.118:1 | PASSOU |
| Vermelho rubi | claro | 4.788:1 | 3.147:1 | PASSOU |
| Vermelho rubi | escuro | 4.723:1 | 3.118:1 | PASSOU |
| Teal/ciano | claro | 4.738:1 | 3.147:1 | PASSOU |
| Teal/ciano | escuro | 4.703:1 | 3.118:1 | PASSOU |
| Âmbar/terra | claro | 4.750:1 | 3.147:1 | PASSOU |
| Âmbar/terra | escuro | 4.703:1 | 3.118:1 | PASSOU |
| Cinza neutro | claro | 4.788:1 | 3.147:1 | PASSOU |
| Cinza neutro | escuro | 4.731:1 | 3.118:1 | PASSOU |
| Pastel suave | claro | 4.719:1 | 3.147:1 | PASSOU |
| Pastel suave | escuro | 4.712:1 | 3.118:1 | PASSOU |
| Neon | claro | 4.712:1 | 3.147:1 | PASSOU |
| Neon | escuro | 4.701:1 | 3.118:1 | PASSOU |
| Preto e branco | claro | 4.788:1 | 3.147:1 | PASSOU |
| Preto e branco | escuro | 4.731:1 | 3.118:1 | PASSOU |

Também foram testados texto principal e secundário sobre os extremos de mistura usados pelos gradientes, nos dois modos. A auditoria identificou a necessidade de escurecer o texto secundário claro; os valores foram corrigidos no JSON e todos os casos passaram. O breadcrumb atual usa o token de texto principal para manter contraste em fundos atmosféricos.

## Busca por referências de rede

A busca textual por `http` encontra somente referências técnicas: comando `python -m http.server`, diretiva `http-equiv`, endereço local do teste, expressão de auditoria de URLs e namespace SVG. A URI de namespace dos três SVGs identifica o formato e não dispara uma conexão. Nenhuma fonte, imagem, script, estilo, parcial ou JSON é solicitado a uma origem externa.

## Evidências e reprodução

- `tests/verificar.mjs`: catálogos, parciais, contrastes, todas as combinações, templates, perfis e falhas de armazenamento.
- `tests/navegador.cjs`: integração real em subpasta, componentes, perfis, downloads, clipboard, dimensões, offline e atualização.
- `test-results/estrutura.json`: resultados estruturados da validação e IDs completos de cada layout.
- `test-results/navegador.json`: integração, arquivos de cache, layouts e registro de erros/requisições externas.
- `test-results/auditoria-visual.json`: versão do navegador e quantidade renderizada por layout.
- Capturas locais em `test-results/`: desktop, celular, gaveta, Neobrutalism, Glassmorphism e Editorial.

Os arquivos de `test-results/` são evidências locais geradas, ignoradas pelo Git e excluídas do ZIP de publicação. O pacote de fonte contém os testes para reproduzi-las. Consulte o README para executar, publicar e estender os catálogos.

SHA-256 do htmx vendorizado: `d6fdc75f204e6bdefa99b69bf1e6d4ac69b8a364f77929f45c13476b4000f717`.

A cobertura automatizada e a inspeção descritas não são uma certificação formal de acessibilidade. O funcionamento foi verificado no Chromium informado; outros navegadores devem oferecer módulos JavaScript, container queries, color-mix, dialog e service workers.
