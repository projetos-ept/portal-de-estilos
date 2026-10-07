/* Catálogos locais são a única fonte de opções, textos e tokens. */
const arquivos = ['estilos', 'paletas', 'layouts', 'componentes', 'modificadores', 'prompt-modelos'];
const idValido = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const camposCatalogo = { estilo: 'estilos', layout: 'layouts', paleta: 'paletas', tipografia: 'tipografias', raio: 'raios', densidade: 'densidades', sombra: 'sombras', modo: 'modos', dispositivo: 'dispositivos', tamanhoPrompt: 'modelos' };
export function assert(condicao, mensagem) { if (!condicao) throw new Error(mensagem); }
export function catalogo(dados, campo) {
  const chave = camposCatalogo[campo];
  return dados[chave] || dados.modificadores[chave] || dados['prompt-modelos'][chave];
}
function texto(valor, local, max = 30000) { assert(typeof valor === 'string' && valor.trim().length > 0 && valor.length <= max, `${local}: informe um texto não vazio com até ${max} caracteres.`); }
function lista(valor, local) {
  assert(Array.isArray(valor) && valor.length > 0, `${local}: era esperada uma lista não vazia.`);
  const ids = new Set();
  valor.forEach((item, indice) => {
    assert(item && typeof item === 'object' && !Array.isArray(item), `${local}[${indice}]: registro inválido.`);
    assert(typeof item.id === 'string' && idValido.test(item.id) && !ids.has(item.id), `${local}[${indice}]: id inválido ou repetido.`);
    ids.add(item.id); texto(item.nome, `${local}[${indice}].nome`, 150);
  });
}
function tokens(obj, local) {
  assert(obj && typeof obj === 'object' && !Array.isArray(obj), `${local}: tokens deve ser um objeto.`);
  for (const [k, v] of Object.entries(obj)) {
    assert(/^--[a-z0-9-]+$/.test(k), `${local}: token ${k} inválido.`);
    assert(typeof v === 'string' && v.length < 1200 && !/[;{}<>]|url\s*\(|expression\s*\(|@import/i.test(v), `${local}.${k}: valor CSS não permitido.`);
  }
}
export function validarDados(d) {
  ['estilos','paletas','layouts','componentes'].forEach(k => lista(d[k], `${k}.json`));
  for (const s of d.estilos) {
    texto(s.descricao, `estilos.${s.id}.descricao`); texto(s.prompt, `estilos.${s.id}.prompt`); tokens(s.tokens, `estilos.${s.id}`);
    ['--raio','--sombra','--borda-espessura','--blur','--transicao'].forEach(k => assert(k in s.tokens, `estilos.${s.id}: token obrigatório ${k} ausente.`));
  }
  const cores = ['primaria','secundaria','destaque','fundo','superficie','texto','texto-secundario','borda','sucesso','alerta','erro'];
  for (const p of d.paletas) {
    texto(p.descricao, `paletas.${p.id}.descricao`); texto(p.prompt, `paletas.${p.id}.prompt`);
    for (const modo of ['claro','escuro']) {
      tokens(p.tokens?.[modo], `paletas.${p.id}.${modo}`);
      for (const cor of cores) assert(/^#[\da-f]{6}$/i.test(p.tokens[modo][`--${cor}`]), `paletas.${p.id}.${modo}: a cor ${cor} precisa de hexadecimal completo.`);
      for (const cor of ['primaria','secundaria','destaque','sucesso','alerta','erro']) assert(/^#[\da-f]{6}$/i.test(p.tokens[modo][`--sobre-${cor}`]), `paletas.${p.id}.${modo}: cor sobre-${cor} ausente.`);
    }
  }
  for (const c of d.componentes) {
    assert(/^partials\/componentes\/[a-z0-9-]+\.html$/.test(c.caminho), `componentes.${c.id}: caminho local inválido.`);
    texto(c.regras, `componentes.${c.id}.regras`); texto(c.estados, `componentes.${c.id}.estados`);
  }
  for (const l of d.layouts) {
    assert(/^partials\/layouts\/[a-z0-9-]+\.html$/.test(l.caminho), `layouts.${l.id}: caminho local inválido.`);
    for (const k of ['categoria','descricao','prompt','titulo','subtitulo']) texto(l[k], `layouts.${l.id}.${k}`);
    assert(Array.isArray(l.componentes) && l.componentes.length > 0 && new Set(l.componentes).size === l.componentes.length, `layouts.${l.id}: componentes ausentes ou repetidos.`);
    l.componentes.forEach(id => assert(d.componentes.some(c => c.id === id), `layouts.${l.id}: componente ${id} não encontrado.`));
  }
  assert(d.modificadores && typeof d.modificadores === 'object', 'modificadores.json: objeto inválido.');
  for (const chave of ['tipografias','raios','densidades','sombras','modos','dispositivos']) lista(d.modificadores[chave], `modificadores.${chave}`);
  for (const chave of ['tipografias','raios','densidades','sombras']) d.modificadores[chave].forEach(m => tokens(m.tokens, `modificadores.${chave}.${m.id}`));
  tokens(d.modificadores.tokensBase, 'modificadores.tokensBase');
  d.modificadores.dispositivos.forEach(v => assert(/^(100%|\d{2,4}px)$/.test(v.largura), `Largura inválida no dispositivo ${v.id}.`));
  lista(d['prompt-modelos']?.modelos, 'prompt-modelos.modelos');
  texto(d['prompt-modelos'].restricoes, 'prompt-modelos.restricoes');
  texto(d['prompt-modelos'].cssReferencia, 'prompt-modelos.cssReferencia');
  const chavesModelo = new Set(['resumo','estilo','layout','tipografia','cores','tokens','componentes','cssComponentes','restricoes','estiloResumido','componentesResumidos','tipografiaResumida']);
  for (const m of d['prompt-modelos'].modelos) {
    texto(m.template, `prompt-modelos.${m.id}.template`);
    for (const match of m.template.matchAll(/\{([^{}]+)\}/g)) assert(chavesModelo.has(match[1]), `Modelo ${m.id}: campo desconhecido {${match[1]}}.`);
  }
  for (const campo of Object.keys(camposCatalogo)) assert(catalogo(d, campo).some(i => i.id === d.modificadores.padrao?.[campo]), `modificadores.padrao.${campo}: opção padrão inválida.`);
  assert(['layouts','catalogo'].includes(d.modificadores.padrao.tela), 'Tela padrão inválida.');
  return d;
}
export async function carregarDados() {
  const entradas = await Promise.all(arquivos.map(async nome => {
    let resposta;
    try { resposta = await fetch(`data/${nome}.json`); }
    catch { throw new Error(`Não foi possível ler data/${nome}.json. Sirva o projeto por um servidor local; abrir por file: não permite carregar os arquivos.`); }
    assert(resposta.ok, `Não foi possível carregar data/${nome}.json (status ${resposta.status}).`);
    try { return [nome, await resposta.json()]; }
    catch { throw new Error(`data/${nome}.json contém JSON malformado. Confira vírgulas, aspas e o fechamento dos objetos.`); }
  }));
  return validarDados(Object.fromEntries(entradas));
}
