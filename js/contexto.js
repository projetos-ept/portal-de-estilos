/* Contexto altera conteúdo, nunca o tema ou a estrutura selecionada. */
export const camposContexto = ['segmento', 'aplicacao', 'visao', 'contextoNome', 'contextoDescricao'];
export const estadoPadrao = dados => ({ ...dados.modificadores.padrao, ...dados.contextos.padrao });
export const chaveContexto = estado => JSON.stringify(camposContexto.map(k => estado[k] || ''));
export function validarContexto(entrada, dados) {
  const padrao = { ...dados.contextos.padrao };
  // Perfis e links v1 anteriores ao recurso não têm nenhum destes campos.
  if (!camposContexto.some(k => Object.hasOwn(entrada, k))) return padrao;
  const segmento = dados.contextos.segmentos.find(s => s.id === entrada.segmento);
  if (!segmento) throw new Error('Segmento desconhecido.');
  if (segmento.id === 'generico') {
    if (entrada.aplicacao !== 'generico' || entrada.visao !== 'generico') throw new Error('O contexto genérico deve usar aplicação e visão genéricas.');
    return padrao;
  }
  const app = segmento.aplicacoes.find(a => a.id === entrada.aplicacao);
  if (!app) throw new Error('A aplicação não pertence ao segmento escolhido.');
  if (!app.visoes.includes(entrada.visao)) throw new Error('A visão não está disponível para esta aplicação.');
  const resultado = { ...padrao, segmento: segmento.id, aplicacao: app.id, visao: entrada.visao };
  if (segmento.id === 'personalizado') {
    for (const [k, limite] of [['contextoNome',120],['contextoDescricao',1000]]) {
      const valor = entrada[k] ?? '';
      if (typeof valor !== 'string' || valor.length > limite) throw new Error(`O campo ${k} deve conter até ${limite} caracteres.`);
      resultado[k] = valor.trim();
    }
  }
  return resultado;
}
export function resolverContexto(dados, estado) {
  const segmento = dados.contextos.segmentos.find(s => s.id === (estado.segmento || 'generico'));
  if (!segmento || segmento.id === 'generico') return null;
  const base = segmento.aplicacoes.find(a => a.id === estado.aplicacao);
  const aplicacao = segmento.id === 'personalizado' ? { ...base, nome: estado.contextoNome || base.nome, descricao: estado.contextoDescricao || base.descricao } : base;
  const visao = dados.contextos.visoes.find(v => v.id === estado.visao);
  const componentes = [...new Set([...aplicacao.destaques,...visao.foco])].map(id => dados.componentes.find(c => c.id === id));
  return { segmento, aplicacao, visao, componentes, conteudo: conteudoDaVisao(aplicacao, visao) };
}
function conteudoDaVisao(a, v) {
  const base = { ...a };
  if(v.id==='administracao')return base;
  if(v.id==='operacao')return {...base, acao:`Revisar ${a.entidade.toLowerCase()}`, acoes:['Revisar','Atualizar status','Consultar histórico'], navegacao:['Fila de trabalho',a.colecao,'Histórico'], indicadores:[{nome:'Na fila',valor:'6',nota:'Registros de exemplo'},{nome:'Em andamento',valor:'2',nota:'Em acompanhamento'},{nome:'Concluídos',valor:'4',nota:'Neste período ilustrativo'}]};
  if(v.id==='analise') {
    const pos=a.colunas.indexOf('Status');
    const registros=a.estados.map(s=>{const n=a.registros.filter(r=>r[pos]===s).length;return [s,String(n),`${Math.round(100*n/a.registros.length)}%`];});
    return {...base, navegacao:['Resumo','Indicadores','Relatórios'], colecao:'Distribuição por status', colunas:['Status','Quantidade','Participação'], registros, filtros:[], campos:[], acao:v.acao, acoes:['Comparar indicadores','Consultar relatório']};
  }
  const publica=v.id==='publica';
  return {...base, navegacao:publica?['Apresentação',a.colecao,'Como funciona']:['Meu espaço',a.colecao,'Minha atividade'], colecao:publica?a.colecao:'Minha atividade', colunas:publica?[a.colunas[0],'Descrição']:[a.colunas[0],'Status'], registros:a.registros.slice(0,3).map((r,i)=>[r[0],publica?a.descricao:['Disponível','Em andamento','Concluído'][i]]), filtros:[], campos:[], acao:v.acao, acoes:[v.acao], estados:publica?['Em destaque']:['Disponível','Em andamento','Concluído'], fluxo:publica?['Conheça a proposta','Explore o conteúdo','Saiba como começar']:['Explore o conteúdo','Continue sua atividade','Acompanhe seu progresso'], indicadores:[{nome:publica?'Itens em destaque':'Disponíveis',valor:'6',nota:'Exemplos para explorar'},{nome:publica?'Categorias':'Em andamento',valor:'2',nota:'Nesta demonstração'},{nome:publica?'Etapas':'Concluídos',valor:publica?'3':'4',nota:'Percurso ilustrativo'}]};
}
export function promptContexto(dados, estado) {
  const c = resolverContexto(dados, estado);
  if (!c) return '';
  const a = c.conteudo;
  const campos = {
    segmento: c.segmento.nome, aplicacao: a.nome, visao: c.visao.nome,
    descricao: a.descricao, regras: a.prompt, regrasVisao: c.visao.prompt,
    navegacao: a.navegacao.join(', '), indicadores: a.indicadores.map(i => i.nome).join(', '),
    campos: a.campos.map(f => f.nome + (f.opcional ? ' (opcional)' : '')).join(', ') || 'apenas consulta nesta visão',
    colunas: a.colunas.join(', '), filtros: a.filtros.map(f => f.nome).join(', ') || 'sem filtros administrativos nesta visão',
    estados: a.estados.join(', '), acoes: a.acoes.join(', '), componentes: c.componentes.map(x => x.nome).join(', ')
  };
  return dados.contextos.modeloPrompt.replace(/\{([^{}]+)\}/g, (_, k) => campos[k]);
}
