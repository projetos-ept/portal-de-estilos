import { $, escapar, notificar } from './util.js';
import { resolverContexto } from './contexto.js';
const opcoes = (itens, id) => itens.map(i=>`<option value="${escapar(i.id)}" ${i.id===id?'selected':''}>${escapar(i.nome)}</option>`).join('');
export function renderContexto(dados, estado) {
  const host = $('#context-panel'), atual = estado.get(), c = resolverContexto(dados, atual);
  const foco = host.contains(document.activeElement) ? document.activeElement.id : null;
  const generico = !c, personalizado = atual.segmento === 'personalizado';
  host.innerHTML = `<div class="context-intro"><h3>Contexto do projeto</h3><p>Defina para quem e para quê você está criando.</p></div>
    <label class="context-field" for="context-segment">Segmento<select id="context-segment">${opcoes(dados.contextos.segmentos,atual.segmento)}</select></label>
    <label class="context-field" for="context-application">Tipo de aplicação<select id="context-application" ${generico?'disabled':''}>${generico?'<option>Genérica</option>':opcoes(c.segmento.aplicacoes,atual.aplicacao)}</select></label>
    <label class="context-field" for="context-view">Visão da interface<select id="context-view" ${generico?'disabled':''}>${opcoes(dados.contextos.visoes.filter(v=>generico?v.id==='generico':c.aplicacao.visoes.includes(v.id)),atual.visao)}</select></label>
    ${personalizado?`<form id="context-custom-form" class="context-custom"><label class="context-field" for="context-name">Nome da aplicação<input id="context-name" name="nome" maxlength="120" placeholder="Ex.: Biblioteca de estudos" value="${escapar(atual.contextoNome)}"></label><label class="context-field" for="context-description">Objetivo e público<textarea id="context-description" name="descricao" maxlength="1000" rows="4" placeholder="Descreva o que a aplicação faz e quem vai usá-la.">${escapar(atual.contextoDescricao)}</textarea></label><button class="p-button primary" type="submit">Aplicar contexto</button></form>`:''}
    <div class="context-explanation" role="status"><strong>${generico?'Como você já conhece':escapar(c.aplicacao.nome)}</strong><p>${escapar(generico?dados.contextos.segmentos.find(s=>s.id==='generico').descricao:c.aplicacao.descricao)}</p>${generico?'':`<p>${escapar(c.visao.descricao)}</p><small>Adapta textos, navegação, indicadores, campos e ações na prévia e no prompt.</small>`}</div>
    <p class="context-footnote">Estilo, layout e paleta continuam sendo escolhas suas.</p>`;
  if(foco)document.getElementById(foco)?.focus({preventScroll:true});
}
export function iniciarContextoUI(dados, estado) {
  $('#context-panel').addEventListener('change', e=>{
    const atual = estado.get();
    if(e.target.id==='context-segment') {
      const s = dados.contextos.segmentos.find(x=>x.id===e.target.value), a = s.aplicacoes[0];
      estado.set({ ...dados.contextos.padrao, segmento:s.id, aplicacao:a?.id||'generico', visao:a?.visoes[0]||'generico' });
    }
    if(e.target.id==='context-application') {
      const a = dados.contextos.segmentos.find(s=>s.id===atual.segmento).aplicacoes.find(a=>a.id===e.target.value);
      estado.set({aplicacao:a.id,visao:a.visoes.includes(atual.visao)?atual.visao:a.visoes[0]});
    }
    if(e.target.id==='context-view')estado.set({visao:e.target.value});
  });
  $('#context-panel').addEventListener('submit', e=>{
    if(e.target.id!=='context-custom-form')return;
    e.preventDefault();
    estado.set({contextoNome:$('#context-name').value,contextoDescricao:$('#context-description').value});
    notificar('Contexto personalizado aplicado à prévia e ao prompt.');
  });
}
