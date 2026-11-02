import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validarDados } from '../js/dados.js';
import { validarEstado, lerHash, hashEstado, criarEstado } from '../js/estado.js';
import { estadoPadrao, resolverContexto, camposContexto } from '../js/contexto.js';
import { gerarSaidas } from '../js/prompt.js';
import { novaBiblioteca, criarPerfis, validarImportacao, validarBiblioteca } from '../js/perfis.js';
const dados=validarDados(Object.fromEntries(['estilos','paletas','layouts','componentes','modificadores','prompt-modelos','contextos'].map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'))])));
const padrao=estadoPadrao(dados), banco={...padrao,segmento:'educacao',aplicacao:'banco-de-questoes',visao:'administracao'};
const result={data:new Date().toISOString(),testes:[],contextos:0};
function teste(nome,fn){fn();result.testes.push({nome,status:'PASSOU'});console.log('PASSOU:',nome);}
teste('Genérico conserva a direção visual e não recebe sugestões de domínio',()=>{
  for(const modelo of dados['prompt-modelos'].modelos){
    const estado={...padrao,tamanhoPrompt:modelo.id};
    const saida=gerarSaidas(dados,estado);
    assert.equal(resolverContexto(dados,estado),null);
    assert.ok(!saida.prompt.includes('CONTEXTO DO PROJETO'));
    assert.ok(saida.prompt.includes(dados['prompt-modelos'].adaptacao));
    assert.ok(saida.prompt.includes(saida.css));
    assert.equal(gerarSaidas(dados,{...estado,contextoNome:'Outro projeto',contextoDescricao:'Outro domínio'}).prompt,saida.prompt);
  }
});
teste('Links e perfis antigos migram para Genérico sem perder dados',()=>{
  assert.deepEqual(lerHash(hashEstado(dados.modificadores.padrao),dados),padrao);
  const b=novaBiblioteca(dados);for(const v of [b.ultimaCombinacao,b.perfis[0].ultimaCombinacao])for(const k of camposContexto)delete v[k];
  const r=validarBiblioteca(b,dados);assert.equal(r.perfilAtivo,b.perfilAtivo);assert.deepEqual(r.ultimaCombinacao,padrao);
});
teste('Todos os segmentos, aplicações e visões geram prompt e hash consistentes',()=>{
  for(const s of dados.contextos.segmentos)for(const a of s.aplicacoes)for(const v of a.visoes){
    const estado=validarEstado({...padrao,segmento:s.id,aplicacao:a.id,visao:v},dados,true);
    assert.deepEqual(lerHash(hashEstado(estado),dados),estado);
    for(const m of dados['prompt-modelos'].modelos){const out=gerarSaidas(dados,{...estado,tamanhoPrompt:m.id});assert.ok(out.prompt.includes(a.nome)&&out.prompt.includes(s.nome));assert.ok(!out.prompt.includes('undefined'));assert.equal(out.css,gerarSaidas(dados,padrao).css);}
    const c=resolverContexto(dados,estado);assert.equal(c.visao.id,v);assert.ok(c.conteudo.registros.every(r=>r.length===c.conteudo.colunas.length));result.contextos++;
  }
});
teste('Combinações de contexto inválidas e dados malformados são rejeitados',()=>{
  for(const change of [{segmento:'x'},{aplicacao:'loja-virtual'},{visao:'x'},{segmento:'generico'},{segmento:'gestao-e-operacoes',aplicacao:'usuarios-e-permissoes',visao:'publica'}])assert.throws(()=>validarEstado({...banco,...change},dados,true));
  const adulterar=fn=>{const d=structuredClone(dados);fn(d.contextos);assert.throws(()=>validarDados(d));};
  adulterar(c=>c.segmentos[1].aplicacoes[0].visoes.push('x'));adulterar(c=>c.segmentos[1].aplicacoes[0].registros[0].pop());adulterar(c=>c.modeloPrompt='{campo-desconhecido}');
});
teste('Contexto salvo, favorito, exportado e importado preserva suas escolhas',()=>{
  const p=criarPerfis(dados,novaBiblioteca(dados),()=>{});const id=p.guardar('Questões','Revisão pedagógica',banco);p.editar(id,{favorita:true});const exp=p.exportar('combinacao',id);const imp=validarImportacao(exp,dados);assert.deepEqual(imp.combinacao.variaveis,banco);assert.equal(imp.combinacao.favorita,true);
  const store=criarEstado(dados,banco);store.reset();assert.deepEqual(store.get(),padrao);
});
teste('Personalizado preserva texto literal e limita tamanho',()=>{
  const personalizado={...padrao,segmento:'personalizado',aplicacao:'personalizada',visao:'administracao',contextoNome:' <img src=x onerror=alert(1)> ',contextoDescricao:'Objetivo & público'};
  const v=validarEstado(personalizado,dados,true);assert.equal(v.contextoNome,personalizado.contextoNome.trim());assert.ok(gerarSaidas(dados,v).prompt.includes(v.contextoNome));assert.deepEqual(lerHash(hashEstado(v),dados),v);
  assert.throws(()=>validarEstado({...v,contextoDescricao:'x'.repeat(1001)},dados,true));assert.throws(()=>validarEstado({...v,contextoNome:{}},dados,true));
});
teste('Visões de consulta não herdam campos e ações de administração',()=>{
  for(const visao of ['portal','publica','analise']){const c=resolverContexto(dados,{...banco,visao});assert.equal(c.conteudo.campos.length,0);assert.ok(!c.conteudo.acoes.includes('Arquivar'));assert.ok(!c.conteudo.acoes.includes('Importar'));}
});
fs.mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../test-results/contexto-estrutura.json',import.meta.url),JSON.stringify(result,null,2));console.log(`${result.testes.length} grupos; ${result.contextos} combinações de contexto.`);
