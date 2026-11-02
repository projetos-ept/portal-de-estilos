import { camposCatalogo, catalogo } from './dados.js';
import { estadoPadrao, validarContexto } from './contexto.js';
/* Somente IDs conhecidos entram no estado. Valores de URL nunca viram HTML. */
export function validarEstado(entrada, dados, estrito = false) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    if (estrito) throw new Error('A combinação precisa conter um objeto de variáveis.');
    entrada = {};
  }
  const estado = estadoPadrao(dados);
  for (const campo of Object.keys(camposCatalogo)) {
    const valor = entrada[campo];
    if (catalogo(dados, campo).some(item => item.id === valor)) estado[campo] = valor;
    else if (estrito) throw new Error(`Variável "${campo}" ausente ou desconhecida: ${String(valor)}.`);
  }
  if (['layouts','catalogo'].includes(entrada.tela)) estado.tela = entrada.tela;
  else if (estrito) throw new Error('A tela precisa ser "layouts" ou "catalogo".');
  // Ausência em links e bibliotecas anteriores significa opção desligada.
  if (Object.hasOwn(entrada, 'pwa')) {
    if (typeof entrada.pwa !== 'boolean') throw new Error('A opção PWA precisa ser true ou false.');
    estado.pwa = entrada.pwa;
  }
  return Object.assign(estado, validarContexto(entrada, dados));
}
export function lerHash(hash, dados) {
  if (!hash.includes('=')) return null;
  const raw = Object.fromEntries(new URLSearchParams(hash.replace(/^#/, '')));
  if (Object.hasOwn(raw, 'pwa')) {
    if (!['true','false'].includes(raw.pwa)) throw new Error('A opção PWA do link precisa ser true ou false.');
    raw.pwa = raw.pwa === 'true';
  }
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
    reset() { this.set(estadoPadrao(dados)); },
    aleatorio() {
      const escolher = lista => lista[Math.floor(Math.random() * lista.length)].id;
      this.set({ estilo: escolher(dados.estilos), layout: escolher(dados.layouts), paleta: escolher(dados.paletas) });
    }
  };
}
