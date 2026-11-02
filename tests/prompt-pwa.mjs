/* Regressões do escopo adaptável e da opção PWA, sem navegador ou dependências. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validarDados } from '../js/dados.js';
import { estadoPadrao } from '../js/contexto.js';
import { validarEstado, lerHash, hashEstado, criarEstado } from '../js/estado.js';
import { gerarSaidas } from '../js/prompt.js';
import { novaBiblioteca, criarPerfis, validarBiblioteca, validarImportacao } from '../js/perfis.js';

const arquivos = ['estilos','paletas','layouts','componentes','modificadores','prompt-modelos','contextos'];
const dados = validarDados(Object.fromEntries(arquivos.map(nome => [nome, JSON.parse(fs.readFileSync(new URL(`../data/${nome}.json`, import.meta.url), 'utf8'))])));
const padrao = estadoPadrao(dados);
const modelos = dados['prompt-modelos'];
const banco = { ...padrao, segmento:'educacao', aplicacao:'banco-de-questoes', visao:'administracao' };
const escola = { ...padrao, segmento:'educacao', aplicacao:'gestao-escolar', visao:'administracao' };
const resultado = { data:new Date().toISOString(), testes:[], prompts:0 };
function teste(nome, fn) { fn(); resultado.testes.push({ nome, status:'PASSOU' }); console.log('PASSOU:', nome); }
const semPwa = estado => { const antigo = { ...estado }; delete antigo.pwa; return antigo; };

teste('Os três modelos adaptam o conteúdo real e mantêm o contexto genérico sem especialização', () => {
  assert.equal(typeof modelos.adaptacao, 'string');
  assert.ok(modelos.adaptacao.trim().length > 0);
  assert.match(modelos.adaptacao, /conteúdo/i);
  assert.match(modelos.adaptacao, /componentes/i);
  assert.match(modelos.adaptacao, /tokens/i);
  for (const modelo of modelos.modelos) for (const tela of ['layouts','catalogo']) {
    const saida = gerarSaidas(dados, { ...padrao, tamanhoPrompt:modelo.id, tela });
    assert.ok(saida.prompt.includes(modelos.adaptacao), `${modelo.id}/${tela}: regra de adaptação ausente`);
    assert.ok(!saida.prompt.includes('CONTEXTO DO PROJETO'), `${modelo.id}/${tela}: Genérico recebeu contexto`);
    assert.ok(!saida.prompt.includes('undefined'));
    assert.ok(saida.prompt.includes(saida.estilo.nome));
    assert.ok(saida.prompt.includes(saida.paleta.nome));
    assert.ok(saida.prompt.includes(saida.css));
    resultado.prompts++;
  }
});

teste('Contextos específicos preservam a orientação de adaptação nos três modelos', () => {
  for (const estado of [banco, escola]) for (const modelo of modelos.modelos) {
    const saida = gerarSaidas(dados, { ...estado, tamanhoPrompt:modelo.id });
    assert.ok(saida.prompt.includes(modelos.adaptacao));
    assert.ok(saida.prompt.includes('CONTEXTO DO PROJETO'));
    const contexto = JSON.parse(saida.json).contexto;
    assert.ok(saida.prompt.includes(contexto.aplicacao));
    assert.ok(saida.prompt.includes(contexto.segmento));
    assert.ok(saida.prompt.includes(contexto.visao));
    if (estado.aplicacao === 'banco-de-questoes') assert.ok(saida.prompt.includes('Enunciado'));
    assert.ok(!saida.prompt.includes('undefined'));
    resultado.prompts++;
  }
});

teste('PWA acrescenta somente seu bloco ao final e não altera o tema', () => {
  assert.equal(dados.modificadores.padrao.pwa, false);
  for (const campo of ['rotulo','ajuda','prompt']) {
    assert.equal(typeof modelos.pwa[campo], 'string');
    assert.ok(modelos.pwa[campo].trim().length > 0);
  }
  for (const base of [padrao, banco, escola]) for (const modelo of modelos.modelos) {
    const estado = { ...base, tamanhoPrompt:modelo.id };
    const desligado = gerarSaidas(dados, { ...estado, pwa:false });
    const ligado = gerarSaidas(dados, { ...estado, pwa:true });
    assert.ok(!desligado.prompt.includes(modelos.pwa.prompt));
    assert.equal(ligado.prompt, desligado.prompt + modelos.pwa.prompt);
    assert.equal(ligado.css, desligado.css);
    assert.deepEqual(ligado.tokens, desligado.tokens);
    assert.equal(JSON.parse(ligado.json).combinacao.pwa, true);
    assert.equal(JSON.parse(desligado.json).combinacao.pwa, false);
    const semOpcao = gerarSaidas(dados, semPwa(estado));
    assert.equal(semOpcao.prompt, desligado.prompt);
    resultado.prompts += 3;
  }
});

teste('Estado PWA aceita booleanos, migra ausência e rejeita valores ambíguos', () => {
  assert.equal(padrao.pwa, false);
  for (const pwa of [false, true]) assert.equal(validarEstado({ ...banco, pwa }, dados, true).pwa, pwa);
  assert.deepEqual(validarEstado(semPwa(banco), dados, true), { ...banco, pwa:false });
  for (const pwa of ['true','false','',1,0,null,undefined,[],{}]) {
    for (const estrito of [false,true]) assert.throws(() => validarEstado({ ...padrao, pwa }, dados, estrito), `valor PWA inválido: ${String(pwa)}`);
  }
  const store = criarEstado(dados, banco);
  store.set({ pwa:true });
  assert.equal(store.get().pwa, true);
  assert.throws(() => store.set({ pwa:'false' }));
  assert.equal(store.get().pwa, true);
  store.reset();
  assert.deepEqual(store.get(), padrao);
});

teste('Links serializam PWA sem confundir false com true e preservam links antigos', () => {
  for (const pwa of [false,true]) {
    const estado = { ...escola, pwa };
    assert.deepEqual(lerHash(hashEstado(estado), dados), estado);
    assert.equal(new URLSearchParams(hashEstado(estado).slice(1)).get('pwa'), String(pwa));
  }
  assert.deepEqual(lerHash(hashEstado(semPwa(escola)), dados), { ...escola, pwa:false });
  for (const valor of ['','1','0','TRUE','False','null','undefined','sim']) {
    const params = new URLSearchParams(hashEstado(padrao).slice(1));
    params.set('pwa', valor);
    assert.throws(() => lerHash('#' + params, dados), `hash PWA inválido: ${valor}`);
  }
});

teste('Salvar, aplicar, exportar e importar preserva PWA em ambas as posições', () => {
  for (const pwa of [false,true]) {
    const estado = { ...banco, pwa };
    let persistido;
    const perfis = criarPerfis(dados, novaBiblioteca(dados), b => { persistido = structuredClone(b); });
    perfis.atualizarEstado(estado);
    const perfilId = perfis.ativo().id;
    const id = perfis.guardar('Banco de questões', 'Configuração com PWA opcional', estado);
    const guardada = perfis.ativo().combinacoes.find(c => c.id === id);
    const store = criarEstado(dados, padrao);
    store.set(guardada.variaveis, 'perfil');
    assert.deepEqual(store.get(), estado);
    const avulsa = perfis.exportar('combinacao', id);
    assert.deepEqual(validarImportacao(avulsa, dados).combinacao.variaveis, estado);
    for (const tipo of ['perfil','perfis']) {
      const exportada = perfis.exportar(tipo);
      const receptor = criarPerfis(dados, novaBiblioteca(dados), () => {});
      assert.deepEqual(receptor.importar(exportada, 'substituir'), estado);
      assert.deepEqual(receptor.ativo().combinacoes[0].variaveis, estado);
    }
    const receptor = criarPerfis(dados, novaBiblioteca(dados), () => {});
    assert.deepEqual(receptor.importar(avulsa, 'substituir'), estado);
    assert.deepEqual(receptor.ativo().combinacoes[0].variaveis, estado);
    perfis.criar('Outro projeto');
    perfis.atualizarEstado({ ...estado, pwa:!pwa });
    assert.deepEqual(perfis.ativar(perfilId), estado);
    assert.deepEqual(validarBiblioteca(persistido, dados).ultimaCombinacao, estado);
  }
});

teste('Combinações e perfis v1 sem PWA migram para desligado sem perder escolhas', () => {
  const perfis = criarPerfis(dados, novaBiblioteca(dados), () => {});
  const estado = { ...escola, pwa:true };
  perfis.atualizarEstado(estado);
  const id = perfis.guardar('Escola antiga', 'Nota mantida', estado);
  const antiga = perfis.exportar('combinacao', id);
  delete antiga.combinacao.variaveis.pwa;
  const importada = validarImportacao(antiga, dados).combinacao;
  assert.deepEqual(importada.variaveis, { ...escola, pwa:false });
  assert.equal(importada.id, id);
  assert.equal(importada.nota, 'Nota mantida');
  const perfil = perfis.exportar('perfil');
  delete perfil.perfil.ultimaCombinacao.pwa;
  for (const c of perfil.perfil.combinacoes) delete c.variaveis.pwa;
  const migrado = validarImportacao(perfil, dados).biblioteca;
  assert.equal(migrado.perfilAtivo, perfil.perfil.id);
  assert.deepEqual(migrado.ultimaCombinacao, { ...escola, pwa:false });
  assert.deepEqual(migrado.perfis[0].combinacoes[0].variaveis, { ...escola, pwa:false });
  const biblioteca = perfis.exportar('perfis');
  delete biblioteca.ultimaCombinacao.pwa;
  for (const p of biblioteca.perfis) {
    delete p.ultimaCombinacao.pwa;
    for (const c of p.combinacoes) delete c.variaveis.pwa;
  }
  const completa = validarBiblioteca(biblioteca, dados);
  assert.deepEqual(completa.ultimaCombinacao, { ...escola, pwa:false });
  assert.equal(completa.perfis[0].ultimaCombinacao.pwa, false);
  assert.equal(completa.perfis[0].combinacoes[0].variaveis.pwa, false);
});

teste('Importação rejeita PWA malformado em vez de ativá-lo por coerção', () => {
  const perfis = criarPerfis(dados, novaBiblioteca(dados), () => {});
  const id = perfis.guardar('Teste', '', banco);
  for (const pwa of ['false','true',1,null]) {
    const arquivo = perfis.exportar('combinacao', id);
    arquivo.combinacao.variaveis.pwa = pwa;
    assert.throws(() => validarImportacao(arquivo, dados));
    const perfil = perfis.exportar('perfil');
    perfil.perfil.ultimaCombinacao.pwa = pwa;
    assert.throws(() => validarImportacao(perfil, dados));
  }
});

fs.mkdirSync(new URL('../test-results/', import.meta.url), { recursive:true });
fs.writeFileSync(new URL('../test-results/prompt-pwa.json', import.meta.url), JSON.stringify(resultado, null, 2));
console.log(`${resultado.testes.length} grupos; ${resultado.prompts} prompts verificados.`);
