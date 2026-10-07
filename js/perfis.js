import { validarEstado } from './estado.js';
import { assert } from './dados.js';
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const agora = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));
function nomeValido(n, campo) { assert(typeof n === 'string' && n.trim().length > 0 && n.trim().length <= 120, `${campo}: use um nome de 1 a 120 caracteres.`); return n.trim(); }
function dataValida(v, campo) { assert(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v)), `${campo}: data ISO inválida.`); return v; }
function idValido(v, campo) { assert(typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v), `${campo}: identificador inválido.`); return v; }
export function novaBiblioteca(dados) {
  const id = uid(); const data = agora();
  return { versao: 1, perfilAtivo: id, ultimaCombinacao: { ...dados.modificadores.padrao }, perfis: [{ id, nome: 'Meu primeiro projeto', criadoEm: data, atualizadoEm: data, ultimaCombinacao: { ...dados.modificadores.padrao }, combinacoes: [] }] };
}
export function validarCombinacao(c, dados) {
  assert(c && typeof c === 'object', 'Combinação inválida.');
  assert(c.nota === undefined || (typeof c.nota === 'string' && c.nota.length <= 4000), 'A nota deve ter até 4.000 caracteres.');
  assert(typeof c.favorita === 'boolean', 'Favorita precisa ser true ou false.');
  return { id: idValido(c.id,'Combinação'), nome: nomeValido(c.nome,'Combinação'), nota: c.nota || '', criadaEm: dataValida(c.criadaEm,'criadaEm'), atualizadaEm: dataValida(c.atualizadaEm,'atualizadaEm'), favorita: c.favorita, variaveis: validarEstado(c.variaveis,dados,true) };
}
export function validarPerfil(p,dados) {
  assert(p && typeof p === 'object', 'Perfil inválido.');
  assert(Array.isArray(p.combinacoes) && p.combinacoes.length <= 3000, 'O perfil deve conter uma lista de até 3.000 combinações.');
  const combinacoes = p.combinacoes.map(c => validarCombinacao(c,dados));
  assert(new Set(combinacoes.map(c=>c.id)).size === combinacoes.length, 'Há IDs de combinações repetidos no perfil.');
  return { id: idValido(p.id,'Perfil'), nome: nomeValido(p.nome,'Perfil'), criadoEm: dataValida(p.criadoEm,'criadoEm'), atualizadoEm: dataValida(p.atualizadoEm,'atualizadoEm'), ultimaCombinacao: validarEstado(p.ultimaCombinacao,dados,true), combinacoes };
}
export function validarBiblioteca(b,dados) {
  assert(b && b.versao === 1, 'Versão de perfis incompatível. O campo "versao" deve ser 1.');
  assert(Array.isArray(b.perfis) && b.perfis.length > 0 && b.perfis.length <= 300, 'Informe entre 1 e 300 perfis.');
  const perfis = b.perfis.map(p=>validarPerfil(p,dados));
  assert(new Set(perfis.map(p=>p.id)).size === perfis.length,'Há IDs de perfis repetidos.');
  assert(perfis.some(p=>p.id===b.perfilAtivo),'O perfil ativo não existe no arquivo.');
  return { versao:1, perfilAtivo:b.perfilAtivo, ultimaCombinacao:validarEstado(b.ultimaCombinacao,dados,true), perfis };
}
export function validarImportacao(obj,dados) {
  assert(obj && obj.versao === 1,'Arquivo incompatível: o campo "versao" deve ser 1.');
  if (obj.tipo === 'combinacao') return { tipo:'combinacao', combinacao:validarCombinacao(obj.combinacao,dados) };
  if (obj.tipo === 'perfil') {
    const perfil = validarPerfil(obj.perfil,dados);
    return { tipo:'perfis', biblioteca:{ versao:1,perfilAtivo:perfil.id,ultimaCombinacao:perfil.ultimaCombinacao,perfis:[perfil] } };
  }
  assert(obj.tipo === undefined || obj.tipo === 'perfis','Tipo de exportação desconhecido.');
  return { tipo:'perfis',biblioteca:validarBiblioteca(obj,dados) };
}
export function importarBiblioteca(atual, recebido, modo, dados) {
  assert(['mesclar','substituir'].includes(modo),'Escolha mesclar ou substituir.');
  const entrada=validarImportacao(recebido,dados);
  let resultado=clone(atual);
  if(entrada.tipo==='combinacao') {
    if(modo==='substituir') resultado=novaBiblioteca(dados);
    const perfil=resultado.perfis.find(p=>p.id===resultado.perfilAtivo);
    const i=perfil.combinacoes.findIndex(c=>c.id===entrada.combinacao.id);
    if(i<0) perfil.combinacoes.push(entrada.combinacao);
    else perfil.combinacoes[i]=entrada.combinacao;
    perfil.atualizadoEm=agora();
    if(modo==='substituir'){perfil.ultimaCombinacao=clone(entrada.combinacao.variaveis);resultado.ultimaCombinacao=clone(entrada.combinacao.variaveis);}
  } else if(modo==='substituir') resultado=entrada.biblioteca;
  else {
    for(const p of entrada.biblioteca.perfis) {
      const local=resultado.perfis.find(x=>x.id===p.id);
      if(!local) resultado.perfis.push(p);
      else {
        const itens=new Map(local.combinacoes.map(c=>[c.id,c]));
        for(const c of p.combinacoes) {
          const anterior=itens.get(c.id);
          if(!anterior || c.atualizadaEm>=anterior.atualizadaEm) itens.set(c.id,c);
        }
        local.combinacoes=Array.from(itens.values());
        if(p.atualizadoEm>=local.atualizadoEm) { local.nome=p.nome; local.atualizadoEm=p.atualizadoEm; }
      }
    }
  }
  return validarBiblioteca(resultado,dados);
}
export function criarPerfis(dados, inicial, salvar) {
  let biblioteca=inicial;
  const listeners=new Set();
  const ativo=()=>biblioteca.perfis.find(p=>p.id===biblioteca.perfilAtivo);
  const commit=()=>{ salvar(biblioteca); listeners.forEach(fn=>fn()); };
  return {
    get:()=>clone(biblioteca), ativo:()=>clone(ativo()), ouvir:fn=>listeners.add(fn),
    atualizarEstado(estado) { biblioteca.ultimaCombinacao=clone(estado); ativo().ultimaCombinacao=clone(estado); salvar(biblioteca); },
    criar(nome) { const data=agora(); const p={ id:uid(), nome:nomeValido(nome,'Perfil'),criadoEm:data,atualizadoEm:data,ultimaCombinacao:clone(biblioteca.ultimaCombinacao),combinacoes:[] }; biblioteca.perfis.push(p); biblioteca.perfilAtivo=p.id; commit(); return p.id; },
    renomear(nome) { ativo().nome=nomeValido(nome,'Perfil'); ativo().atualizadoEm=agora(); commit(); },
    duplicar(nome) { const p=clone(ativo()); p.id=uid(); p.nome=nomeValido(nome,'Perfil'); p.criadoEm=agora(); p.atualizadoEm=agora(); p.combinacoes=p.combinacoes.map(c=>({...c,id:uid()})); biblioteca.perfis.push(p); biblioteca.perfilAtivo=p.id; commit(); },
    excluir() { biblioteca.perfis=biblioteca.perfis.filter(p=>p.id!==biblioteca.perfilAtivo); if(!biblioteca.perfis.length) biblioteca=novaBiblioteca(dados); biblioteca.perfilAtivo=biblioteca.perfis[0].id; biblioteca.ultimaCombinacao=clone(ativo().ultimaCombinacao); commit(); return clone(biblioteca.ultimaCombinacao); },
    ativar(id) { assert(biblioteca.perfis.some(p=>p.id===id),'Perfil não encontrado.'); biblioteca.perfilAtivo=id; biblioteca.ultimaCombinacao=clone(ativo().ultimaCombinacao); commit(); return clone(biblioteca.ultimaCombinacao); },
    guardar(nome,nota,estado) { const data=agora(); const c=validarCombinacao({id:uid(),nome,nota,criadaEm:data,atualizadaEm:data,favorita:false,variaveis:estado},dados); ativo().combinacoes.push(c); ativo().atualizadoEm=data; commit(); return c.id; },
    editar(id,mudancas) { const p=ativo(); const i=p.combinacoes.findIndex(c=>c.id===id); assert(i>=0,'Combinação não encontrada.'); p.combinacoes[i]=validarCombinacao({...p.combinacoes[i],...mudancas,atualizadaEm:agora()},dados); p.atualizadoEm=agora(); commit(); },
    remover(id) { ativo().combinacoes=ativo().combinacoes.filter(c=>c.id!==id); ativo().atualizadoEm=agora(); commit(); },
    importar(obj,modo) { biblioteca=importarBiblioteca(biblioteca,obj,modo,dados); commit(); return clone(biblioteca.ultimaCombinacao); },
    exportar(tipo,id) {
      if(tipo==='combinacao') { const c=ativo().combinacoes.find(x=>x.id===id); assert(c,'Combinação não encontrada.'); return {versao:1,tipo,exportadoEm:agora(),combinacao:clone(c)}; }
      if(tipo==='perfil') return {versao:1,tipo,exportadoEm:agora(),perfil:clone(ativo())};
      return {...clone(biblioteca),tipo:'perfis',exportadoEm:agora()};
    }
  };
}
