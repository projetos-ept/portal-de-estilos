import { gerarTokens, tokensCSS } from './tema.js';
import { promptContexto, resolverContexto } from './contexto.js';
/* Templates e conteúdo editorial são dados; a substituição nunca executa código. */
export function gerarSaidas(dados, estado) {
  const estilo = dados.estilos.find(s => s.id === estado.estilo);
  const layout = dados.layouts.find(l => l.id === estado.layout);
  const paleta = dados.paletas.find(p => p.id === estado.paleta);
  const tokens = gerarTokens(dados, estado);
  const css = tokensCSS(tokens);
  const m = dados.modificadores;
  const componenteIds = estado.tela === 'catalogo' ? dados.componentes.map(c => c.id) : layout.componentes;
  const nomeMod = (grupo, campo) => m[grupo].find(x => x.id === estado[campo]).nome;
  const campos = {
    adaptacao: dados['prompt-modelos'].adaptacao,
    estiloResumido: estilo.prompt,
    componentesResumidos: componenteIds.map(id => dados.componentes.find(c => c.id === id)).map(c => `${c.nome}: ${c.regras}`).join('\n'),
    tipografiaResumida: `Família ${tokens['--fonte']}, títulos com peso ${tokens['--peso-titulo']}, corpo ${tokens['--peso-corpo']}; use a escala, a entrelinha e o espaçamento dos tokens. Densidade ${nomeMod('densidades','densidade')}.`,
    resumo: `Aplique o estilo ${estilo.nome} e a paleta ${paleta.nome}, modo ${estado.modo}, usando o layout ${layout.nome} como referência adaptável ao conteúdo real.`,
    estilo: `${estilo.descricao}\n${estilo.prompt}\nRaio: ${tokens['--raio']}; borda: ${tokens['--borda-espessura']} ${tokens['--borda-estilo']}; sombra: ${tokens['--sombra']}; blur: ${tokens['--blur']}; opacidade da superfície: ${tokens['--opacidade-superficie']}; transições: ${tokens['--transicao']} ${tokens['--easing']}; textura: ${tokens['--textura']}.`,
    layout: (estado.tela === 'catalogo' ? 'A tela do portal mostra um catálogo de exemplos isolados; isso não solicita criar um catálogo no destino. ' : '') + 'Exemplo de composição, com seções e quantidades opcionais: ' + layout.prompt,
    tipografia: `Família: ${tokens['--fonte']}. Perfil: ${nomeMod('tipografias','tipografia')}. Escala: corpo ${tokens['--escala-base']}, h1 ${tokens['--escala-h1']}, h2 ${tokens['--escala-h2']}, h3 ${tokens['--escala-h3']}, h4 ${tokens['--escala-h4']}. Pesos: corpo ${tokens['--peso-corpo']}, títulos ${tokens['--peso-titulo']}, ações ${tokens['--peso-acao']}. Entrelinha ${tokens['--entrelinha']}; tracking ${tokens['--tracking']}. Densidade ${nomeMod('densidades','densidade')}: espaço ${tokens['--espaco']}, altura de controle ${tokens['--altura-controle']}. Raio ${nomeMod('raios','raio')}; sombra ${nomeMod('sombras','sombra')}.`,
    cores: paleta.prompt + '\n' + Object.entries(paleta.tokens[estado.modo]).map(([k,v]) => `${k}: ${v}`).join('; '),
    tokens: '```css\n' + css + '\n```',
    componentes: componenteIds.map(id => dados.componentes.find(c => c.id === id)).map(c => `${c.nome}: ${c.regras} Estados: ${c.estados}`).join('\n\n'),
    cssComponentes: '```css\n' + dados['prompt-modelos'].cssReferencia + '\n```',
    restricoes: dados['prompt-modelos'].restricoes
  };
  const modelo = dados['prompt-modelos'].modelos.find(x => x.id === estado.tamanhoPrompt);
  const prompt = modelo.template.replace(/\{([^{}]+)\}/g, (_,chave) => campos[chave]) + promptContexto(dados, estado) + (estado.pwa === true ? dados['prompt-modelos'].pwa.prompt : '');
  const contexto = resolverContexto(dados, estado);
  const json = JSON.stringify({ versao: 1, combinacao: { ...estado }, tokens, ...(contexto ? { contexto: { segmento: contexto.segmento.nome, aplicacao: contexto.aplicacao.nome, visao: contexto.visao.nome, descricao: contexto.aplicacao.descricao } } : {}) }, null, 2);
  return { prompt, css, json, tokens, resumo: campos.resumo, estilo, layout, paleta };
}
