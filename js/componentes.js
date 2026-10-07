import {$,$$,configurarAbas,notificar} from './util.js';
let contador=0;
const todos=(raiz,seletor)=>[...(raiz.matches?.(seletor)?[raiz]:[]),...$$(seletor,raiz)];
function fecharMenu(menu,devolver=true) {
  const trigger=$('[data-demo="dropdown"]',menu); $('.ui-menu',menu).hidden=true; trigger.setAttribute('aria-expanded','false'); if(devolver) trigger.focus();
}
function ativarAba(aba) {
  const grupo=aba.closest('.ui-tabs'); const tabs=$$('[role="tab"]',grupo); const panels=$$('[role="tabpanel"]',grupo); const i=tabs.indexOf(aba);
  tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(i===n));t.tabIndex=i===n?0:-1;}); panels.forEach((p,n)=>{p.hidden=i!==n;});
}
function renderCalendario(cal,offset=0) {
  const ano=Number(cal.dataset.ano||2026); const mes=Number(cal.dataset.mes||9)+offset; const date=new Date(ano,mes,1);
  cal.dataset.ano=date.getFullYear(); cal.dataset.mes=date.getMonth();
  $('[data-month-label]',cal).textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(date);
  const grid=$('.calendar-days',cal); grid.replaceChildren();
  for(let i=0;i<date.getDay();i++) { const space=document.createElement('span'); space.setAttribute('aria-hidden','true'); grid.append(space); }
  const total=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  for(let n=1;n<=total;n++) {
    const b=document.createElement('button'); b.type='button'; b.dataset.demo='calendar-day'; b.textContent=n;
    b.setAttribute('aria-label',`${n} de ${$('[data-month-label]',cal).textContent}`); b.setAttribute('aria-pressed','false'); grid.append(b);
  }
  $('[data-calendar-event]',cal).textContent='Selecione um dia para consultar a agenda.';
}
function tabelaContexto(el) { return el.closest('.demo-layout,.catalog-grid') || $('#preview-root'); }
function atualizarTabelas(contexto,delta=0) {
  const query=(contexto.dataset.query||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const linhas=$$('[data-project-row]',contexto); const filtradas=linhas.filter(r=>r.textContent.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().includes(query));
  const total=Math.max(1,Math.ceil(filtradas.length/3)); const pagina=Math.max(0,Math.min(total-1,Number(contexto.dataset.page||0)+delta)); contexto.dataset.page=pagina;
  linhas.forEach(r=>{const i=filtradas.indexOf(r);r.hidden=i<0||Math.floor(i/3)!==pagina;});
  $$('[data-page-status]',contexto).forEach(n=>n.textContent=`Página ${pagina+1} de ${total} · ${filtradas.length} itens`);
  $$('[data-demo="page-prev"]',contexto).forEach(b=>b.disabled=pagina===0);
  $$('[data-demo="page-next"]',contexto).forEach(b=>b.disabled=pagina>=total-1);
}
function toastNoPreview(acionador,texto) {
  const host=acionador.closest('.component-slot,.ui-card')||$('#preview-root');
  let msg=$('.ui-toast-live',host);
  if(!msg) { msg=document.createElement('div');msg.className='ui-toast-live ui-alert';msg.setAttribute('role','status');host.append(msg); }
  msg.replaceChildren(document.createTextNode(texto));
  const fechar=document.createElement('button');fechar.className='ui-button icon-button outline';fechar.textContent='×';fechar.setAttribute('aria-label','Fechar notificação de demonstração');fechar.type='button';fechar.addEventListener('click',()=>msg.remove());msg.append(fechar);
  clearTimeout(msg.timer);msg.timer=setTimeout(()=>msg.remove(),7000);
}
export function prepararComponentes(raiz,contextoTitulo) {
  todos(raiz,'[data-context-title]').forEach(el=>{el.textContent=contextoTitulo;});
  todos(raiz,'.component-slot').forEach(slot=>{
    if(slot.dataset.rotulo) $$('[data-rotulo]',slot).forEach(el=>{el.textContent=slot.dataset.rotulo;});
    $$('input[type="radio"]',slot).forEach(input=>{input.name=`grupo-${slot.dataset.component}-${++contador}`;});
    const radios=$$('input[type="radio"]',slot);if(radios.length) { const name=`radio-${++contador}`;radios.forEach(input=>{input.name=name;}); }
  });
  todos(raiz,'.ui-tabs').forEach(grupo=>{
    if(grupo.dataset.ready)return;grupo.dataset.ready='true';const prefix=`abas-${++contador}`;
    const tabs=$$('[role="tab"]',grupo);const panels=$$('[role="tabpanel"]',grupo);
    tabs.forEach((tab,i)=>{tab.id=`${prefix}-tab-${i}`;tab.setAttribute('aria-controls',`${prefix}-painel-${i}`);});
    panels.forEach((p,i)=>{p.id=`${prefix}-painel-${i}`;p.setAttribute('aria-labelledby',tabs[i].id);p.tabIndex=0;});
    configurarAbas(grupo,ativarAba);
  });
  todos(raiz,'.ui-tooltip-wrap').forEach(w=>{const tip=$('[role="tooltip"]',w);if(!tip.id)tip.id=`dica-${++contador}`;$('[data-tooltip-trigger]',w).setAttribute('aria-describedby',tip.id);});
  todos(raiz,'.ui-dropdown').forEach(w=>{const menu=$('.ui-menu',w);if(!menu.id)menu.id=`menu-${++contador}`;$('[data-demo="dropdown"]',w).setAttribute('aria-controls',menu.id);});
  todos(raiz,'.ui-dialog').forEach(d=>{if(d.dataset.ready)return;d.dataset.ready='true';const title=$('h3',d);title.id=`dialogo-${++contador}`;d.setAttribute('aria-labelledby',title.id);d.addEventListener('close',()=>d._acionador?.focus());});
  todos(raiz,'.calendar').forEach(c=>{if(!c.dataset.ano)renderCalendario(c);});
}
export function iniciarInteracoes(preview) {
  preview.addEventListener('click',e=>{
    const aba=e.target.closest('[role="tab"]');if(aba?.closest('.ui-tabs')) {ativarAba(aba);return;}
    const b=e.target.closest('[data-demo]');if(!b||b.disabled)return;
    const acao=b.dataset.demo; const context=tabelaContexto(b);
    if(b.tagName==='A')e.preventDefault();
    if(acao==='notice') {notificar('Ação de demonstração concluída. Nenhum dado foi enviado.');b.closest('.ui-dropdown')&&fecharMenu(b.closest('.ui-dropdown'));}
    if(acao==='favorite') {const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));notificar(on?'Item favoritado na prévia.':'Favorito removido da prévia.');}
    if(acao==='segment') {$$('button',b.parentElement).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));notificar(`Período selecionado: ${b.textContent}.`);}
    if(acao==='remove-chip') {const grupo=b.closest('.chip-list');b.closest('.ui-chip').remove();$('button:not(:disabled)',grupo)?.focus();}
    if(acao==='toast')toastNoPreview(b,'Sua ideia foi salva nesta demonstração.');
    if(acao==='open-modal') {const d=$('dialog',b.parentElement);d._acionador=b;d.showModal();}
    if(acao==='dropdown') {const menu=$('.ui-menu',b.parentElement);const open=menu.hidden;menu.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open)$('button:not(:disabled)',menu)?.focus();}
    if(acao==='slide-prev'||acao==='slide-next') {const car=b.closest('.ui-carousel');const slides=$$('[data-slide]',car);const index=Math.max(0,Math.min(slides.length-1,Number(car.dataset.slide||0)+(acao==='slide-next'?1:-1)));car.dataset.slide=index;slides.forEach((s,i)=>s.hidden=i!==index);$('[data-slide-status]',car).textContent=`${index+1} de ${slides.length}`;$('[data-demo="slide-prev"]',car).disabled=index===0;$('[data-demo="slide-next"]',car).disabled=index===slides.length-1;}
    if(acao==='progress') {const wrap=b.parentElement;const progress=$('progress',wrap);progress.value=Math.min(100,progress.value+8);$('[data-progress-value]',wrap).textContent=`${progress.value}%`;b.disabled=progress.value>=100;}
    if(acao==='navigate') {const nav=b.closest('nav,aside');$$('[data-demo="navigate"]',nav).forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','page');notificar(`Seção selecionada na demonstração: ${b.textContent}.`);}
    if(acao==='page-prev'||acao==='page-next')atualizarTabelas(context,acao==='page-next'?1:-1);
    if(acao==='sort') {const table=b.closest('table');const th=b.closest('th');const asc=th.getAttribute('aria-sort')!=='ascending';th.setAttribute('aria-sort',asc?'ascending':'descending');const rows=$$('tbody tr',table).sort((a,b)=>(asc?1:-1)*$('td:nth-child(2)',a).textContent.localeCompare($('td:nth-child(2)',b).textContent,'pt-BR'));rows.forEach(r=>$('tbody',table).append(r));context.dataset.page='0';atualizarTabelas(context);}
    if(acao==='detail') {$$('[data-detail-title]',context).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-detail-heading]',context).textContent=b.dataset.detailTitle;$('[data-detail-text]',context).textContent=`Explore referências e registre os próximos passos de ${b.dataset.detailTitle.toLowerCase()}.`;}
    if(acao==='move-task') {const item=b.closest('.kanban-item');const col=b.closest('.kanban-column');const cols=$$('.kanban-column',context);cols[(cols.indexOf(col)+1)%cols.length].append(item);cols.forEach(c=>$('[data-kanban-count]',c).textContent=$$('.kanban-item',c).length);b.focus();notificar('Tarefa movida para a próxima coluna.');}
    if(acao.startsWith('wizard-')) {const wizard=b.closest('.wizard');let step=Number(wizard.dataset.step);const erro=$('[data-wizard-error]',wizard);erro.textContent='';if(acao==='wizard-next'&&step===0) {const nome=$('input[type="text"]',wizard);if(!nome.value.trim()){nome.setAttribute('aria-invalid','true');erro.textContent='Dê um nome à sua ideia para continuar.';nome.focus();return;}nome.removeAttribute('aria-invalid');}
      if(acao==='wizard-next'&&step===2){notificar('Projeto de demonstração concluído.');return;}step=Math.max(0,Math.min(2,step+(acao==='wizard-next'?1:-1)));wizard.dataset.step=step;$$('[data-wizard-panel]',wizard).forEach((p,i)=>p.hidden=i!==step);$$('.wizard-steps li',wizard).forEach((li,i)=>{li.removeAttribute('aria-current');if(i===step)li.setAttribute('aria-current','step');});$('[data-demo="wizard-prev"]',wizard).disabled=step===0;$('[data-demo="wizard-next"]',wizard).textContent=step===2?'Concluir demonstração':'Continuar';}
    if(acao==='login')toastNoPreview(b,'Tudo pronto na demonstração. Nenhuma autenticação ou envio foi realizado.');
    if(acao==='feed-post') {const field=$('textarea',context);if(!field.value.trim()){field.focus();return;}const article=document.createElement('article');article.className='ui-card';const h=document.createElement('h3');h.textContent='Você · agora';const p=document.createElement('p');p.textContent=field.value;article.append(h,p);$('[data-feed]',context).prepend(article);field.value='';notificar('Atualização adicionada à prévia local.');}
    if(acao==='month-prev'||acao==='month-next')renderCalendario(b.closest('.calendar'),acao==='month-next'?1:-1);
    if(acao==='calendar-day') {const cal=b.closest('.calendar');$$('.calendar-days button',cal).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-calendar-event]',cal).textContent=`${b.getAttribute('aria-label')}: ${Number(b.textContent)%3===0?'14h — Encontro de ideias com a equipe.':'Seu dia está livre para novas ideias.'}`;}
    if(acao==='choose-plan') {$$('[data-demo="choose-plan"]',context).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));toastNoPreview(b,'Plano selecionado na prévia. Nenhuma compra foi realizada.');}
    if(acao==='cart') {context.dataset.cart=Number(context.dataset.cart||0)+1;notificar(`${context.dataset.cart} item(ns) no carrinho de demonstração. Nenhuma compra foi realizada.`);}
    if(acao==='anchor') {const target=$(b.getAttribute('href'),context);target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
    if(acao==='recover') {const p=document.createElement('p');p.className='ui-alert';p.setAttribute('role','status');p.textContent='Seu primeiro projeto de demonstração foi criado. Agora este espaço tem uma ideia!';b.closest('.empty-state').append(p);b.disabled=true;}
  });
  preview.addEventListener('input',e=>{
    if(e.target.matches('[data-demo-range]'))$('output',e.target.closest('label')).textContent=`${e.target.value}%`;
    if(e.target.matches('[data-demo-search]')) {const context=tabelaContexto(e.target);const query=e.target.value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();context.dataset.query=query;context.dataset.page=0;const itens=$$('[data-searchable]',context);let count=0;itens.forEach(el=>{const match=el.textContent.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().includes(query);el.hidden=!match;if(match)count++;});atualizarTabelas(context);const status=$('[data-search-status]',e.target.closest('.component-slot'));if(status)status.textContent=`${count} itens encontrados`;}
  });
  preview.addEventListener('submit',e=>{
    if(e.target.matches('[data-chat-form]')) {e.preventDefault();const input=$('input',e.target);if(!input.value.trim())return;const p=document.createElement('p');p.className='own';const strong=document.createElement('strong');strong.textContent='Você';p.append(strong,document.createTextNode(input.value));const log=$('.chat-messages',e.target.parentElement);log.append(p);log.scrollTop=log.scrollHeight;input.value='';input.focus();}
  });
  document.addEventListener('click',e=>{$$('.ui-dropdown').forEach(m=>{if(!m.contains(e.target)&&!$('.ui-menu',m).hidden)fecharMenu(m,false);});});
  preview.addEventListener('keydown',e=>{
    const menu=e.target.closest('.ui-dropdown');if(menu&&e.key==='Escape'){fecharMenu(menu);e.preventDefault();}
    if(menu&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){const items=$$('[role="menuitem"]:not(:disabled)',menu);const i=items.indexOf(e.target);const n=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[n]?.focus();e.preventDefault();}
    if(e.key==='Escape')e.target.closest('.ui-tooltip-wrap')?.classList.add('tooltip-dismissed');
  });
  preview.addEventListener('focusout',e=>e.target.closest('.ui-tooltip-wrap')?.classList.remove('tooltip-dismissed'));
}
