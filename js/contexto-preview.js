import { $, $$, escapar, icone, notificar } from './util.js';
import { resolverContexto } from './contexto.js';
import { prepararComponentes, atualizarTabelas } from './componentes.js';
const e = escapar;
const options = valores => valores.map(v=>`<option>${e(v)}</option>`).join('');
const botao = (texto,acao='notice',classe='') => `<button type="button" class="ui-button ${classe}" data-demo="${acao}">${e(texto)}</button>`;
const setText = (raiz,sel,texto) => $$(sel,raiz).forEach(el=>el.textContent=texto);
function campo(f) {
  if(f.tipo==='especial')return '';
  const extra=f.nome==='Tipo de questão'?' data-question-type':'';
  const control=f.tipo==='area'?`<textarea rows="3" placeholder="${e(f.nome)}"></textarea>`:f.tipo==='select'?`<select aria-label="${e(f.nome)}"${extra}>${options(f.opcoes)}</select>`:`<input type="text" placeholder="${e(f.nome)}">`;
  return `<label class="ui-field">${e(f.nome)}${f.opcional?' (opcional)':''}${control}</label>`;
}
function respostas(tipo) {
  if(tipo==='Discursiva')return '<label class="ui-field">Resposta esperada<textarea rows="3" placeholder="Descreva os critérios de correção"></textarea></label>';
  if(tipo==='Verdadeiro ou falso')return '<label class="ui-field">Resposta correta<select aria-label="Resposta correta"><option>Verdadeiro</option><option>Falso</option></select></label>';
  if(tipo==='Associação')return `<fieldset class="context-answer"><legend>Pares de associação</legend>${[1,2,3].map(n=>`<div class="context-form-grid"><label class="ui-field">Item ${n}<input type="text"></label><label class="ui-field">Correspondência ${n}<input type="text"></label></div>`).join('')}</fieldset>`;
  return `<fieldset class="context-answer"><legend>Alternativas</legend>${['A','B','C','D'].map(letra=>`<label class="ui-field">Alternativa ${letra}<input type="text" placeholder="Texto da alternativa ${letra}"></label>`).join('')}<label class="ui-field">Resposta correta<select aria-label="Resposta correta">${options(['A','B','C','D'])}</select></label></fieldset>`;
}
function editor(a) {
  return `<form data-context-form><h3>${e(a.acao)}</h3><p class="ui-muted">Experimente os campos com dados fictícios.</p><div class="context-form-grid">${a.campos.map(campo).join('')}</div>${a.tiposQuestao?`<div data-question-answers>${respostas(a.tiposQuestao[0])}</div>`:''}<div class="ui-row"><button type="button" class="ui-button outline" data-context-close>Fechar</button><button type="submit" class="ui-button">Salvar demonstração</button></div><p role="status" data-context-form-status></p></form>`;
}
function tabela(a) {
  return `<div class="context-filters">${a.filtros.map(f=>`<label class="ui-field">${e(f.nome)}<select aria-label="${e(f.nome)}" data-context-filter="${a.colunas.indexOf(f.nome)}"><option value="">Todos</option>${options(f.opcoes)}</select></label>`).join('')}</div><div class="ui-table-scroll" role="region" aria-label="${e(a.colecao)}" tabindex="0"><table class="ui-table"><caption>${e(a.colecao)} · dados fictícios</caption><thead><tr><th scope="col">Seleção</th>${a.colunas.map((col,i)=>`<th scope="col"${i===0?' aria-sort="none"':''}>${i===0?`<button type="button" data-demo="sort">${e(col)} ${icone('sort')}</button>`:e(col)}</th>`).join('')}</tr></thead><tbody>${a.registros.map((r,i)=>`<tr data-project-row data-searchable ${i>=3?'hidden':''}><td><input type="checkbox" aria-label="Selecionar ${e(r[0])}"></td>${r.map((v,n)=>`<td data-context-cell="${n}">${a.colunas[n]==='Status'?`<span class="ui-badge">${e(v)}</span>`:e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="ui-muted" data-context-empty hidden>Nenhum registro com estes filtros. Ajuste a busca ou escolha Todos.</p>`;
}
export function aplicarContexto(preview,dados,estado) {
  const c=resolverContexto(dados,estado);
  if(!c)return;
  const a=c.conteudo, app=c.aplicacao, visao=c.visao;
  const root=$('.demo-layout,.catalog-grid',preview);
  const banner=document.createElement('div');banner.className='context-banner';
  banner.innerHTML=`<div><span class="ui-eyebrow">${e(c.segmento.nome)} / ${e(visao.nome)}</span><strong>${e(app.nome)}</strong><p>${e(visao.descricao)}</p></div><span class="ui-badge">Dados fictícios</span>`;
  root.prepend(banner);
  setText(root,'.layout-heading h1',app.nome);
  setText(root,'.layout-heading > div > p',app.descricao);
  setText(root,'.layout-heading .ui-eyebrow',visao.nome);
  $$('.kpi',root).forEach((k,i)=>{const m=a.indicadores[i%a.indicadores.length];setText(k,':scope > span',m.nome);setText(k,':scope > strong',m.valor);setText(k,':scope > small',m.nota);});
  setText(root,'.chart-card h3',`${app.colecao} no período`);
  setText(root,'.chart-card p','Atividade ilustrativa nesta semana');
  setText(root,'.chart-caption',`Atividade de ${app.colecao.toLowerCase()} · exemplo`);
  $$('.bar-chart',root).forEach(el=>el.setAttribute('aria-label',`Atividade fictícia de ${app.colecao.toLowerCase()} na semana`));
  $$('.activity-list p',root).forEach((p,i)=>{const r=a.registros[i%a.registros.length];p.innerHTML=`<span class="ui-avatar small">${i+1}</span><span><strong>${e(r[a.colunas.indexOf('Status')]||a.estados[i%a.estados.length])}</strong><small>${e(r[0])}</small></span>`;});
  $$('.workspace-sidebar,.bottom-nav',root).forEach(nav=>{$$('[data-demo="navigate"]',nav).forEach((b,i)=>b.textContent=a.navegacao[i%a.navegacao.length]);});
  $$('.kanban-column',root).forEach((col,i)=>{const h=$('h2',col);h.replaceChildren(document.createTextNode(a.estados[i%a.estados.length]+' '));const n=document.createElement('span');n.dataset.kanbanCount='';n.textContent=$$('.kanban-item',col).length;h.append(n);});
  $$('.kanban-item',root).forEach((item,i)=>{setText(item,'h3',app.registros[i%app.registros.length][0]);setText(item,'p',a.fluxo[i%a.fluxo.length]);setText(item,'.ui-eyebrow',app.entidade);});
  $$('.section-caption h2',root).forEach((h,i)=>h.textContent=[`Campos de ${app.entidade.toLowerCase()}`,`Explore ${app.colecao.toLowerCase()}`,'Ações e acompanhamento'][i%3]);
  setText(root,'.section-caption .ui-eyebrow',`${c.segmento.nome} / ${visao.nome}`);
  $$('.component-slot',root).forEach(slot=>{
    const id=slot.dataset.component;
    slot.closest('.catalog-item,.tool-item')?.classList.toggle('context-highlight',c.componentes.some(x=>x.id===id));
    if(id==='navegacao')slot.innerHTML=`<nav class="ui-navigation" aria-label="Navegação de ${e(app.nome)}"><strong class="demo-brand">${e(app.nome)}</strong><div class="ui-row">${a.navegacao.map((n,i)=>`<button type="button" data-demo="navigate" ${i===0?'aria-current="page"':''}>${e(n)}</button>`).join('')}</div></nav>`;
    if(id==='breadcrumb')slot.innerHTML=`<nav class="ui-breadcrumb" aria-label="Caminho na aplicação"><ol><li>${e(c.segmento.nome)}</li><li>${e(app.nome)}</li><li aria-current="page">${e(visao.nome)}</li></ol></nav>`;
    if(id==='tabela'){slot.innerHTML=tabela(a);const titulo=slot.parentElement.querySelector(':scope > h3');if(titulo)titulo.textContent=a.colecao;}
    if(id==='botao-primario')slot.innerHTML=botao(a.acao,a.campos.length?'context-editor':'notice');
    if(id==='botao-secundario')slot.innerHTML=botao(a.acoes.at(-1),'notice','outline');
    if(id==='busca'){const input=$('input',slot);input.placeholder=`Buscar ${a.colecao.toLowerCase()}`;input.setAttribute('aria-label',input.placeholder);}
    if(id==='campo-texto')slot.innerHTML=campo(a.campos.find(f=>f.tipo==='texto')||{nome:`Buscar ${a.colecao.toLowerCase()}`,tipo:'texto'});
    if(id==='area-texto')slot.innerHTML=campo(a.campos.find(f=>f.tipo==='area')||{nome:'Anotações',tipo:'area'});
    if(id==='select')slot.innerHTML=campo(a.campos.find(f=>f.tipo==='select')||{nome:'Visualização',tipo:'select',opcoes:[visao.nome]});
    if(id==='badge')slot.innerHTML=`<div class="ui-row">${(visao.id==='publica'?['Em destaque']:a.estados).map(s=>`<span class="ui-badge">${e(s)}</span>`).join('')}</div>`;
    if(id==='chip')slot.innerHTML=`<div class="chip-list">${a.navegacao.slice(0,3).map(n=>`<span class="ui-chip">${e(n)}<button type="button" data-demo="remove-chip" aria-label="Remover ${e(n)}">×</button></span>`).join('')}</div>`;
    if(id==='card')slot.innerHTML=`<article class="ui-card feature-card" data-searchable><span class="ui-eyebrow">${e(visao.nome)}</span><h3>${e(a.registros[0][0])}</h3><p>${e(app.descricao)}</p>${botao(a.acao,'notice','outline')}</article>`;
    if(id==='lista')slot.innerHTML=`<ul class="ui-icon-list">${a.fluxo.map(f=>`<li>${icone('check')}<span><strong>${e(f)}</strong><small>${e(app.nome)}</small></span></li>`).join('')}</ul>`;
    if(id==='modal')slot.innerHTML=a.campos.length?`${botao(a.acao,'open-modal','outline')}<dialog class="ui-dialog context-dialog">${editor(a)}</dialog>`:`${botao('Consultar detalhes','open-modal','outline')}<dialog class="ui-dialog"><form method="dialog"><h3>${e(app.nome)}</h3><p>${e(app.descricao)}</p><button class="ui-button">Fechar</button></form></dialog>`;
    if(id==='abas')slot.innerHTML=`<section class="ui-tabs"><div role="tablist" aria-label="${e(app.nome)}">${a.fluxo.map((f,i)=>`<button type="button" role="tab" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${e(f)}</button>`).join('')}</div>${a.fluxo.map((f,i)=>`<div role="tabpanel" ${i?'hidden':''}><h4>${e(f)}</h4><p>${e(i===0?app.descricao:i===1?visao.descricao:a.acoes.join(' · '))}</p></div>`).join('')}</section>`;
    if(id==='rodape')setText(slot,'.ui-footer > span',app.nome);
    if(id==='bloco'){setText(slot,'h3,h4',app.nome);setText(slot,'p',app.descricao);}
    if(id==='dropdown')$$('[role="menuitem"]',slot).forEach((el,i)=>el.textContent=a.acoes[i%a.acoes.length]);
    if(id==='progresso'){const label=$('label',slot);if(label?.firstChild?.nodeType===3)label.firstChild.textContent=`${a.fluxo[1]} `;$('progress',slot)?.setAttribute('aria-label',a.fluxo[1]);}
    if(id==='alerta')setText(slot,'.ui-alert',`${a.estados[0]} · ${visao.descricao}`);
  });
  prepararComponentes(preview,app.nome);
  atualizarTabelas(root);
}
export function iniciarContextoPreview(preview) {
  preview.addEventListener('change',ev=>{
    const alvo=ev.target;
    if(alvo.matches('[data-context-filter]')) {
      const root=alvo.closest('.demo-layout,.catalog-grid');
      root.dataset.page='0';atualizarTabelas(root);
    }
    if(alvo.matches('[data-question-type]'))$('[data-question-answers]',alvo.closest('form')).innerHTML=respostas(alvo.value);
  });
  preview.addEventListener('click',ev=>{
    if(ev.target.closest('[data-context-close]'))ev.target.closest('dialog').close();
    const b=ev.target.closest('[data-demo="context-editor"]');
    if(b){const d=$('.context-dialog',preview);if(d){d._acionador=b;d.showModal();}}
  });
  preview.addEventListener('submit',ev=>{
    if(!ev.target.matches('[data-context-form]'))return;
    ev.preventDefault();
    $('[data-context-form-status]',ev.target).textContent='Demonstração concluída. Os registros de exemplo permanecem disponíveis para explorar.';
    notificar('Formulário demonstrado localmente.');
  });
}
