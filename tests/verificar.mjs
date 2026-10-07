/* Checklist estrutural e funcional sem bibliotecas externas. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {validarDados} from '../js/dados.js';
import {validarEstado,lerHash,hashEstado,criarEstado} from '../js/estado.js';
import {gerarTokens,contraste} from '../js/tema.js';
import {gerarSaidas} from '../js/prompt.js';
import {novaBiblioteca,criarPerfis,validarBiblioteca,validarImportacao,importarBiblioteca} from '../js/perfis.js';
import {criarArmazenamento} from '../js/armazenamento.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const carregar=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const dados=validarDados(Object.fromEntries(['estilos','paletas','layouts','componentes','modificadores','prompt-modelos'].map(n=>[n,carregar(n)])));
const resultado={data:new Date().toISOString(),testes:[],layouts:[],contrastes:[],combinacoes:0};
function teste(nome,fn){fn();resultado.testes.push({nome,status:'PASSOU'});console.log('PASSOU:',nome);}
teste('Quantidades e catálogos completos',()=>{assert.equal(dados.estilos.length,20);assert.equal(dados.layouts.length,30);assert.equal(dados.paletas.length,12);assert.equal(dados.componentes.length,36);assert.equal(dados['prompt-modelos'].modelos.length,3);});
teste('Cada layout possui 36 tipos de componente e caminhos locais existentes',()=>{
  for(const l of dados.layouts){const html=fs.readFileSync(path.join(root,l.caminho),'utf8');const ids=[...new Set([...html.matchAll(/data-component="([a-z0-9-]+)"/g)].map(m=>m[1]))];assert.ok(ids.length>=25,l.id);assert.equal(ids.length,36,l.id);assert.deepEqual([...ids].sort(),[...l.componentes].sort());resultado.layouts.push({id:l.id,nome:l.nome,quantidade:ids.length,componentes:ids});}
  for(const c of dados.componentes)assert.ok(fs.existsSync(path.join(root,c.caminho)));
});
teste('Contraste AA nas 12 paletas, em ambos os modos',()=>{
  for(const p of dados.paletas)for(const modo of ['claro','escuro']){
    const t=p.tokens[modo];let menorTexto=99,menorBorda=99;const pares=[];
    for(const fg of ['texto','texto-secundario','primaria','secundaria','destaque','sucesso','alerta','erro'])for(const bg of ['fundo','superficie']){const r=contraste(t['--'+fg],t['--'+bg]);assert.ok(r>=4.5,`${p.id}/${modo}/${fg} sobre ${bg}: ${r}`);menorTexto=Math.min(menorTexto,r);pares.push({texto:fg,fundo:bg,razao:r});}
    for(const bg of ['primaria','secundaria','destaque','sucesso','alerta','erro']){const r=contraste(t['--sobre-'+bg],t['--'+bg]);assert.ok(r>=4.5,`${p.id}/${modo}/sobre-${bg}: ${r}`);menorTexto=Math.min(menorTexto,r);}
    for(const bg of ['fundo','superficie']){const r=contraste(t['--borda'],t['--'+bg]);assert.ok(r>=3,`${p.id}/${modo}/borda: ${r}`);menorBorda=Math.min(menorBorda,r);}
    resultado.contrastes.push({paleta:p.nome,modo,menorTexto,menorBorda,pares});
  }
});
teste('Texto principal e secundário nos extremos dos gradientes de estilo',()=>{
  const misturar=(a,b,p)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*p+parseInt(b.slice(1).match(/../g)[i],16)*(1-p)).toString(16).padStart(2,'0')).join('');
  for(const paleta of dados.paletas)for(const modo of ['claro','escuro']){const t=paleta.tokens[modo];const fundos=['primaria','secundaria','destaque'].map(c=>misturar(t['--'+c],t['--fundo'],.22));fundos.push(misturar(fundos[0],fundos[2],.5));for(const bg of fundos)for(const fg of ['texto','texto-secundario'])assert.ok(contraste(t['--'+fg],bg)>=4.5,`${paleta.id}/${modo}/${fg} sobre gradiente ${bg}`);}
});
teste('7.200 combinações em cada modo: 14.400 temas e prompts coerentes',()=>{
  for(const estilo of dados.estilos)for(const layout of dados.layouts)for(const paleta of dados.paletas)for(const modo of ['claro','escuro']){
    const e={...dados.modificadores.padrao,estilo:estilo.id,layout:layout.id,paleta:paleta.id,modo};const s=gerarSaidas(dados,e);
    assert.ok(s.prompt.includes(estilo.nome)&&s.prompt.includes(layout.nome)&&s.prompt.includes(paleta.nome));assert.ok(!s.prompt.includes('undefined'));assert.ok(s.prompt.includes(s.css));
    assert.equal(s.tokens['--primaria'],paleta.tokens[modo]['--primaria']);assert.equal(s.tokens['--raio'],estilo.tokens['--raio']);assert.deepEqual(JSON.parse(s.json).tokens,s.tokens);assert.deepEqual(lerHash(hashEstado(e),dados),e);resultado.combinacoes++;
  }
});
teste('Modificadores, precedência, catálogo e três tamanhos de prompt',()=>{
  const padrao=dados.modificadores.padrao;
  for(const [campo,grupo] of Object.entries({tipografia:'tipografias',raio:'raios',densidade:'densidades',sombra:'sombras'}))for(const m of dados.modificadores[grupo]){const tokens=gerarTokens(dados,{...padrao,[campo]:m.id});for(const [k,v]of Object.entries(m.tokens))assert.equal(tokens[k],v);}
  for(const modelo of dados['prompt-modelos'].modelos){const s=gerarSaidas(dados,{...padrao,tamanhoPrompt:modelo.id,tela:'catalogo'});assert.ok(s.prompt.length>200);assert.ok(!/\{(?:resumo|estilo|tokens)\}/.test(s.prompt));assert.ok(s.prompt.includes('catálogo'));assert.ok(s.prompt.includes(s.css));}
  const state=criarEstado(dados,padrao);state.aleatorio();validarEstado(state.get(),dados,true);state.reset();assert.deepEqual(state.get(),padrao);
});
teste('Validação rejeita catálogos, referências, tokens e estados inválidos',()=>{
  const alterar=fn=>{const d=structuredClone(dados);fn(d);assert.throws(()=>validarDados(d));};
  alterar(d=>d.estilos.push(d.estilos[0]));alterar(d=>d.layouts[0].componentes.push('nao-existe'));alterar(d=>d.componentes[0].caminho='../arquivo.html');alterar(d=>d.estilos[0].tokens['--raio']='url(externo)');alterar(d=>d.paletas[0].tokens.claro['--texto']='red');alterar(d=>d['prompt-modelos'].modelos[0].template='{invalido}');
  assert.throws(()=>validarEstado({...dados.modificadores.padrao,paleta:'nao-existe'},dados,true));assert.throws(()=>lerHash('#estilo=invalido',dados));
});
teste('Perfis: criar, renomear, duplicar, salvar, favorito, exportar, importar, mesclar e excluir',()=>{
  let salvo;const perfis=criarPerfis(dados,novaBiblioteca(dados),b=>{salvo=structuredClone(b);});perfis.criar('Projeto Escola');perfis.renomear('Painel Escola');const id=perfis.guardar('Direção A','Uma nota',dados.modificadores.padrao);perfis.editar(id,{favorita:true});assert.equal(perfis.ativo().combinacoes[0].favorita,true);
  const individual=perfis.exportar('combinacao',id);assert.equal(validarImportacao(individual,dados).tipo,'combinacao');const perfil=perfis.exportar('perfil');validarImportacao(perfil,dados);const todos=perfis.exportar('perfis');validarBiblioteca(todos,dados);
  perfis.duplicar('Painel Admin');assert.notEqual(perfis.ativo().id,perfil.perfil.id);assert.notEqual(perfis.ativo().combinacoes[0].id,id);assert.equal(perfis.ativo().combinacoes[0].favorita,true);
  const a=importarBiblioteca(perfis.get(),todos,'mesclar',dados);const b=importarBiblioteca(a,todos,'mesclar',dados);assert.deepEqual(a.perfis,b.perfis);
  const substituida=importarBiblioteca(b,perfil,'substituir',dados);assert.equal(substituida.perfis.length,1);assert.equal(substituida.perfilAtivo,perfil.perfil.id);
  const avulsa=importarBiblioteca(substituida,individual,'mesclar',dados);assert.equal(avulsa.perfis[0].combinacoes.length,1);
  const invalid=structuredClone(todos);invalid.versao=99;assert.throws(()=>validarImportacao(invalid,dados));const erro=structuredClone(individual);erro.combinacao.variaveis.layout='desconhecido';assert.throws(()=>validarImportacao(erro,dados));
  assert.ok(salvo.perfis.length>0);perfis.remover(perfis.ativo().combinacoes[0].id);assert.equal(perfis.ativo().combinacoes.length,0);while(perfis.get().perfis.length>1)perfis.excluir();perfis.excluir();assert.equal(perfis.get().perfis.length,1);
});
teste('Persistência e erros de armazenamento indisponível, cheio ou malformado',()=>{
  let avisos=[];let texto;const storage={getItem:()=>texto||null,setItem:(k,v)=>{texto=v;}};const a=criarArmazenamento(storage,m=>avisos.push(m));const b=novaBiblioteca(dados);assert.equal(a.salvar(b),true);assert.deepEqual(a.ler(),b);texto='{invalido';assert.equal(a.ler(),null);assert.equal(avisos.length,1);
  const falha=criarArmazenamento({getItem(){throw Error('bloqueado');},setItem(){throw Error('quota');}},m=>avisos.push(m));assert.equal(falha.ler(),null);assert.equal(falha.salvar(b),false);assert.equal(avisos.length,3);
});
const arquivos=[];function percorrer(p){for(const item of fs.readdirSync(p,{withFileTypes:true})){if(item.name==='test-results')continue;const f=path.join(p,item.name);if(item.isDirectory())percorrer(f);else arquivos.push(f);}}percorrer(root);
teste('Sem dependências ou recursos de rede externos',()=>{
  for(const file of arquivos.filter(f=>/\.(html|css|json|js|svg|webmanifest)$/.test(f)&&!f.includes(path.sep+'tests'+path.sep))){const raw=fs.readFileSync(file,'utf8');
    const semNamespace=raw.replaceAll('http://www.w3.org/2000/svg','');assert.ok(!/https?:\/\/|(?:src|href|hx-get)\s*=\s*["']\/\//i.test(semNamespace),path.relative(root,file)+' contém URL externa');
    if(file.endsWith('.html')){for(const m of raw.matchAll(/(?:src|href|hx-get)="([^"#][^"]*)"/g)){const ref=m[1];assert.ok(!ref.startsWith('/'),`${file}: caminho absoluto ${ref}`);if(!ref.includes(':'))assert.ok(fs.existsSync(path.join(root,ref.split('#')[0])),`${file}: caminho não existe: ${ref}`);}}
  }
});
const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'estrutura.json'),JSON.stringify(resultado,null,2));console.log(`\n${resultado.testes.length} grupos de teste passaram. ${resultado.combinacoes} combinações verificadas.`);
