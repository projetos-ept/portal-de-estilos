/* A aparência inteira é uma composição de custom properties vindas dos JSON. */
export function gerarTokens(dados, estado) {
  const estilo = dados.estilos.find(s => s.id === estado.estilo);
  const paleta = dados.paletas.find(p => p.id === estado.paleta);
  const tokens = { ...dados.modificadores.tokensBase, ...paleta.tokens[estado.modo], ...estilo.tokens };
  for (const [campo, grupo] of Object.entries({ tipografia: 'tipografias', raio: 'raios', densidade: 'densidades', sombra: 'sombras' })) {
    Object.assign(tokens, dados.modificadores[grupo].find(item => item.id === estado[campo]).tokens);
  }
  tokens['--color-scheme'] = estado.modo === 'escuro' ? 'dark' : 'light';
  return tokens;
}
export function aplicarTokens(elemento, tokens) {
  /* Limpa propriedades antigas para que uma extensão de catálogo não vaze entre estilos. */
  for (const nome of Array.from(elemento.style)) if (nome.startsWith('--')) elemento.style.removeProperty(nome);
  for (const [nome, valor] of Object.entries(tokens)) elemento.style.setProperty(nome, valor);
}
export function tokensCSS(tokens) { return ':root {\n' + Object.entries(tokens).map(([k,v]) => `  ${k}: ${v};`).join('\n') + '\n}'; }
export function contraste(a, b) {
  const luminancia = hex => {
    const [r,g,bl] = hex.slice(1).match(/../g).map(x => parseInt(x,16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126*r + .7152*g + .0722*bl;
  };
  const [menor, maior] = [luminancia(a),luminancia(b)].sort((x,y) => x-y);
  return (maior + .05) / (menor + .05);
}
