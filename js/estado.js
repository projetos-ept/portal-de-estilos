import { camposCatalogo, catalogo } from './dados.js';
/* Somente IDs conhecidos entram no estado. Valores de URL nunca viram HTML. */
export function validarEstado(entrada, dados, estrito = false) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    if (estrito) throw new Error('A combinação precisa conter um objeto de variáveis.');
    entrada = {};
  }
  const estado = { ...dados.modificadores.padrao };
  for (const campo of Object.keys(camposCatalogo)) {
    const valor = entrada[campo];
    if (catalogo(dados, campo).some(item => item.id === valor)) estado[campo] = valor;
    else if (estrito) throw new Error(`Variável "${campo}" ausente ou desconhecida: ${String(valor)}.`);
  }
  if (['layouts','catalogo'].includes(entrada.tela)) estado.tela = entrada.tela;
  else if (estrito) throw new Error('A tela precisa ser "layouts" ou "catalogo".');
  return estado;
}
export function lerHash(hash, dados) {
  if (!hash.includes('=')) return null;
  const raw = Object.fromEntries(new URLSearchParams(hash.replace(/^#/, '')));
  return validarEstado(raw, dados, true);
}
export function hashEstado(estado) { return '#' + new URLSearchParams(estado).toString(); }
export function criarEstado(dados, inicial) {
  let atual = validarEstado(inicial, dados);
  const ouvintes = new Set();
  return {
    get: () => ({ ...atual }),
    set(parcial, origem = 'interface') {
      const anterior = atual;
      atual = validarEstado({ ...atual, ...parcial }, dados, true);
      if (JSON.stringify(anterior) !== JSON.stringify(atual)) ouvintes.forEach(fn => fn({ ...atual }, { ...anterior }, origem));
    },
    ouvir(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    reset() { this.set(dados.modificadores.padrao); },
    aleatorio() {
      const escolher = lista => lista[Math.floor(Math.random() * lista.length)].id;
      this.set({ estilo: escolher(dados.estilos), layout: escolher(dados.layouts), paleta: escolher(dados.paletas) });
    }
  };
}
