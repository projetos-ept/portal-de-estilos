import { carregarDados } from './dados.js';
import { criarEstado, lerHash, hashEstado } from './estado.js';
import { gerarTokens, aplicarTokens } from './tema.js';
import { gerarSaidas } from './prompt.js';
import { criarArmazenamento } from './armazenamento.js';
import { novaBiblioteca, validarBiblioteca, criarPerfis } from './perfis.js';
import { iniciarPerfisUI } from './perfis-ui.js';
import { iniciarInteracoes, prepararComponentes } from './componentes.js';
import { $, $$, escapar, icone, copiar, baixar, notificar, configurarAbas } from './util.js';

let dados, estado, perfis, saidas;
let seletor='estilos', formato='prompt', pronto=false;
const viewport=$('#preview-viewport');const preview=$('#preview-root');
const configuracaoSeletores={estilos:{campo:'estilo',titulo:'Estilos visuais',singular:'estilo'},layouts:{campo:'layout',titulo:'Estruturas e layouts',singular:'layout'},paletas:{campo:'paleta',titulo:'Paletas de cor',singular:'paleta'}};
const configuracaoModificadores={tipografia:{grupo:'tipografias',nome:'Tipografia'},raio:{grupo:'raios',nome:'Raio de borda'},densidade:{grupo:'densidades',nome:'Densidade'},sombra:{grupo:'sombras',nome:'Sombra'}};
const arquivoSaida={prompt:{nome:'direcao-criativa.txt',mime:'text/plain',rotulo:'prompt'},css:{nome:'variaveis.css',mime:'text/css',rotulo:'CSS'},json:{nome:'tokens.json',mime:'application/json',rotulo:'JSON'}};
const normalizar=v=>v.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

function erroFatal(erro) { const el=$('#fatal-error');el.textContent=erro.message;el.hidden=false;$('#preview-status').textContent='Não foi possível concluir o carregamento.'; }
function avisoArmazenamento(mensagem) { const el=$('#storage-warning');el.textContent=mensagem;el.hidden=false; }
function selecionarAba(grupo,botao) { $$('[role="tab"]',grupo).forEach(b=>{b.setAttribute('aria-selected',String(b===botao));b.tabIndex=b===botao?0:-1;}); }

function renderSeletores() {
  const atual=estado.get();const config=configuracaoSeletores[seletor];const query=normalizar($('#selector-search').value);const categoria=$('#layout-category').value;
  const lista=dados[seletor].filter(item=>normalizar(item.nome).includes(query)&&(seletor!=='layouts'||!categoria||item.categoria===categoria));
  const grid=$('#selection-grid');const rolagem=grid.scrollTop;grid.classList.toggle('palette-options',seletor==='paletas');
  grid.innerHTML=lista.map((item,index)=>{
    let miniature='';
    if(seletor==='estilos') miniature='<span class="style-mini"><span class="mini-window"><b></b><i></i><i></i><i></i></span></span>';
    if(seletor==='layouts') miniature=`<span class="layout-mini" data-shape="${index%5}"><span></span><span></span><span></span><span></span><span></span><span></span></span>`;
    if(seletor==='paletas') miniature='<span class="palette-mini">'+['primaria','secundaria','destaque','fundo','texto'].map(c=>`<span style="background:${item.tokens[atual.modo]['--'+c]}"></span>`).join('')+'</span>';
    return `<button type="button" class="selection-card" data-selection="${escapar(item.id)}" aria-pressed="${atual[config.campo]===item.id}" title="${escapar(item.descricao)}">${miniature}<strong>${escapar(item.nome)}</strong></button>`;
  }).join('')||'<p class="no-results">Nenhuma opção encontrada. Tente outro nome ou remova o filtro.</p>';
  if(seletor==='estilos')$$('[data-selection]',grid).forEach(b=>aplicarTokens($('.style-mini',b),gerarTokens(dados,{...atual,estilo:b.dataset.selection,raio:'estilo',sombra:'estilo'})));
  grid.scrollTop=rolagem;
  $('#selection-heading').textContent=config.titulo;$('#selection-count').textContent=`${lista.length} de ${dados[seletor].length}`;
  $('#selection-description').textContent=dados[seletor].find(item=>item.id===atual[config.campo]).descricao;
  $('#category-wrap').hidden=seletor!=='layouts';
  $('#selector-search').placeholder=`Encontre ${seletor==='paletas'?'uma':'um'} ${config.singular}`;
  $('#selection-panel').setAttribute('aria-labelledby',`selector-${seletor}`);
}
function renderControles() {
  const atual=estado.get();
  $('#mode-toggle').innerHTML=dados.modificadores.modos.map(m=>`<button type="button" data-mode="${m.id}" aria-pressed="${m.id===atual.modo}">${icone(m.id==='claro'?'sun':'moon')}${escapar(m.nome)}</button>`).join('');
  $('#modifier-grid').innerHTML=Object.entries(configuracaoModificadores).map(([campo,c])=>`<label>${c.nome}<select data-modifier="${campo}" aria-label="${c.nome}">${dados.modificadores[c.grupo].map(m=>`<option value="${m.id}" ${m.id===atual[campo]?'selected':''}>${escapar(m.nome)}</option>`).join('')}</select></label>`).join('');
  const deviceIcons=['monitor','tablet','phone'];
  $('#device-switch').innerHTML=dados.modificadores.dispositivos.map((d,i)=>`<button type="button" data-device="${d.id}" aria-label="Prévia ${escapar(d.nome)}" title="${escapar(d.nome)}" aria-pressed="${d.id===atual.dispositivo}">${icone(deviceIcons[i]||'monitor')}</button>`).join('');
  $('#prompt-size').innerHTML=dados['prompt-modelos'].modelos.map(m=>`<option value="${m.id}" ${m.id===atual.tamanhoPrompt?'selected':''}>${escapar(m.nome)}</option>`).join('');
  selecionarAba($('.view-tabs'),$(`[data-view="${atual.tela}"]`));preview.setAttribute('aria-labelledby',`view-${atual.tela}`);
}
function atualizarSaida() {
  saidas=gerarSaidas(dados,estado.get());
  const cfg=arquivoSaida[formato];$('#output-text').value=saidas[formato];
  $('#output-filename').textContent=cfg.nome;$('#output-stats').textContent=`${saidas[formato].length.toLocaleString('pt-BR')} caracteres`;
  $('#output-token-count').textContent=`${Object.keys(saidas.tokens).length} tokens`;
  $('#copy-output span').textContent=`Copiar ${cfg.rotulo}`;$('#copy-output').setAttribute('aria-label',`Copiar ${cfg.rotulo}`);
  $('#download-output').setAttribute('aria-label',`Baixar arquivo ${cfg.nome}`);
  $('#prompt-size-wrap').hidden=formato!=='prompt';$('#output-panel-content').setAttribute('aria-labelledby',`tab-${formato}`);
  $('#current-combination').innerHTML=[saidas.estilo.nome,saidas.layout.nome,saidas.paleta.nome].map(s=>`<span>${escapar(s)}</span>`).join('<i>×</i>');
  $('#preview-location').textContent=estado.get().tela==='catalogo'?'studio / catálogo de componentes':`studio / ${saidas.layout.nome.toLowerCase()}`;
}
function verificarPronto() {
  const slots=$$('.component-slot',preview);const carregados=slots.filter(s=>s.dataset.loaded==='true').length;
  const atual=estado.get();const contextoEsperado=atual.tela==='catalogo'?'catalogo':atual.layout;
  pronto=preview.dataset.contexto===contextoEsperado&&slots.length>0&&carregados===slots.length;
  preview.setAttribute('aria-busy',String(!pronto));preview.inert=!pronto;
  $('#copy-output').disabled=!pronto;$('#save-combination').disabled=!pronto;$('#download-output').disabled=!pronto;
  const tipos=new Set(slots.map(s=>s.dataset.component)).size;
  $('#preview-status').textContent=pronto?`${tipos} componentes · ${estado.get().modo==='claro'?'Modo claro':'Modo escuro'} · Pronto para explorar`:`Carregando componentes: ${carregados}/${slots.length}`;
  document.documentElement.dataset.ready=String(pronto);
}
function preencherSlots(raiz) {
  for(const slot of $$('.component-slot:not([data-requested])',raiz)) {
    const c=dados.componentes.find(c=>c.id===slot.dataset.component);
    if(!c){erroFatal(new Error(`Componente desconhecido no parcial: ${slot.dataset.component}.`));continue;}
    slot.dataset.requested='true';slot.setAttribute('hx-get',c.caminho);slot.setAttribute('hx-trigger','load');slot.setAttribute('hx-target','this');slot.setAttribute('hx-swap','innerHTML');slot.setAttribute('hx-params','none');htmx.process(slot);
  }
}
function carregarPreview() {
  const atual=estado.get();pronto=false;preview.dataset.contexto='';document.documentElement.dataset.ready='false';preview.setAttribute('aria-busy','true');preview.inert=true;
  $('#copy-output').disabled=true;$('#save-combination').disabled=true;$('#download-output').disabled=true;$('#preview-status').textContent='Carregando a composição local';
  const loader=$('#layout-loader');htmx.trigger(loader,'htmx:abort');
  if(atual.tela==='catalogo') {
    preview.dataset.contexto='catalogo';
    preview.innerHTML=`<div class="catalog-grid">${dados.componentes.map((c,i)=>`<section class="catalog-item"><header><h2>${escapar(c.nome)}</h2><span>${String(i+1).padStart(2,'0')}</span></header><div class="component-slot" data-component="${escapar(c.id)}"></div></section>`).join('')}</div>`;
    preencherSlots(preview);
  } else {
    const layout=dados.layouts.find(l=>l.id===atual.layout);loader.setAttribute('hx-get',layout.caminho);htmx.process(loader);htmx.trigger(loader,'carregar-layout');
  }
  $('#preview-stage').scrollTop=0;
}
function atualizarTema() {
  const atual=estado.get();aplicarTokens(viewport,gerarTokens(dados,atual));
  viewport.style.width=dados.modificadores.dispositivos.find(d=>d.id===atual.dispositivo).largura;
  $('#preview-stage').dataset.device=atual.dispositivo;
}
function configurarEventos() {
  $('.selector-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-selector]');if(!tab)return;seletor=tab.dataset.selector;$('#selection-grid').scrollTop=0;selecionarAba($('.selector-tabs'),tab);$('#selector-search').value='';renderSeletores();});
  configurarAbas($('.selector-tabs'),b=>b.click());
  $('#selector-search').addEventListener('input',renderSeletores);$('#layout-category').addEventListener('change',renderSeletores);
  $('#selection-grid').addEventListener('click',e=>{const b=e.target.closest('[data-selection]');if(b){const id=b.dataset.selection;estado.set({[configuracaoSeletores[seletor].campo]:id});$(`[data-selection="${id}"]`)?.focus({preventScroll:true});}});
  $('#mode-toggle').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b){const id=b.dataset.mode;estado.set({modo:id});$(`[data-mode="${id}"]`).focus();}});
  $('#modifier-grid').addEventListener('change',e=>{const field=e.target.dataset.modifier;if(field){estado.set({[field]:e.target.value});$(`[data-modifier="${field}"]`).focus();}});
  $('#device-switch').addEventListener('click',e=>{const b=e.target.closest('[data-device]');if(b){const id=b.dataset.device;estado.set({dispositivo:id});$(`[data-device="${id}"]`).focus();}});
  $('#randomize').addEventListener('click',()=>{estado.aleatorio();notificar('Uma nova direção para explorar.');});
  $('#reset').addEventListener('click',()=>{estado.reset();notificar('Combinação inicial restaurada.');});
  $('#prompt-size').addEventListener('change',e=>{estado.set({tamanhoPrompt:e.target.value});$('#prompt-size').focus();});
  $('.output-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-output]');if(!tab)return;formato=tab.dataset.output;selecionarAba($('.output-tabs'),tab);atualizarSaida();});
  configurarAbas($('.output-tabs'),b=>b.click());
  $('.view-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-view]');if(tab)estado.set({tela:tab.dataset.view});});
  configurarAbas($('.view-tabs'),b=>b.click());
  $('#copy-output').addEventListener('click',async()=>{try{if(!pronto)return;await copiar(saidas[formato]);$('#copy-output span').textContent='Copiado!';notificar(`${arquivoSaida[formato].rotulo} copiado. A combinação corresponde à prévia atual.`);}catch(erro){notificar(erro.message);}});
  $('#download-output').addEventListener('click',()=>{if(!pronto)return;const cfg=arquivoSaida[formato];baixar(saidas[formato],cfg.nome,cfg.mime);notificar(`${cfg.nome} preparado para baixar.`);});
  $('#share').addEventListener('click',async()=>{try{await copiar(location.href);notificar('Link desta combinação copiado.');}catch(erro){notificar(erro.message);}});
  $('#close-toast').addEventListener('click',()=>$('#portal-toast').hidden=true);
  window.addEventListener('hashchange',()=>{try{const valor=lerHash(location.hash,dados);if(valor)estado.set(valor,'url');}catch(erro){notificar(`Link inválido: ${erro.message}`);history.replaceState(null,'',hashEstado(estado.get()));}});
  document.body.addEventListener('htmx:beforeSwap',e=>{
    if(e.detail.target===preview && (estado.get().tela!=='layouts'||e.detail.requestConfig.path!==dados.layouts.find(l=>l.id===estado.get().layout).caminho))e.detail.shouldSwap=false;
  });
  document.body.addEventListener('htmx:afterSwap',e=>{
    const target=e.detail.target;
    if(target===preview){preview.dataset.contexto=estado.get().layout;prepararComponentes(preview,saidas.layout.nome);preencherSlots(preview);}
    else if(preview.contains(target)&&target.matches('.component-slot')){target.dataset.loaded='true';prepararComponentes(target,saidas.layout.nome);}
    else return;
    verificarPronto();
  });
  for(const event of ['htmx:responseError','htmx:sendError'])document.body.addEventListener(event,e=>{
    if(e.detail.elt?.id==='layout-loader'||preview.contains(e.detail.elt))erroFatal(new Error(`Não foi possível carregar o parcial ${e.detail.pathInfo?.requestPath||e.detail.requestConfig?.path||'solicitado'}. Verifique se o arquivo existe e se o projeto está sendo servido localmente.`));
  });
  iniciarInteracoes(preview);
  // A gaveta móvel mantém foco contido e torna o restante da interface inerte.
  const controles=$('#controls-panel');let focoAntes;
  const partes=()=>[$('.portal-header'),$('.intro'),$('.preview-panel'),$('.output-panel'),$('.portal-footer'),$('#open-controls')];
  function gaveta(abrir) {
    if(abrir)focoAntes=document.activeElement;
    controles.classList.toggle('drawer-open',abrir);$('#drawer-backdrop').hidden=!abrir;$('#open-controls').setAttribute('aria-expanded',String(abrir));
    partes().forEach(el=>{el.inert=abrir;});document.body.style.overflow=abrir?'hidden':'';
    if(abrir){controles.setAttribute('role','dialog');controles.setAttribute('aria-modal','true');$('#close-controls').focus();}
    else{controles.removeAttribute('role');controles.removeAttribute('aria-modal');focoAntes?.focus();}
  }
  $('#open-controls').addEventListener('click',()=>gaveta(true));$('#close-controls').addEventListener('click',()=>gaveta(false));$('#drawer-backdrop').addEventListener('click',()=>gaveta(false));
  controles.addEventListener('keydown',e=>{if(!controles.classList.contains('drawer-open'))return;if(e.key==='Escape')gaveta(false);if(e.key==='Tab'){const focus=$$('button:not(:disabled),input,select,[tabindex="0"]',controles).filter(el=>el.getClientRects().length);const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  matchMedia('(max-width: 760px)').addEventListener('change',e=>{if(!e.matches&&controles.classList.contains('drawer-open'))gaveta(false);});
}
async function iniciarOffline() {
  function rede() {const online=navigator.onLine;const el=$('#network-status');el.classList.toggle('offline',!online);el.innerHTML=`<i></i>${online?'Online':'Offline'}`;el.setAttribute('aria-label',online?'Conexão disponível':'Sem conexão. Usando recursos locais.');}
  rede();window.addEventListener('online',rede);window.addEventListener('offline',rede);
  if(!('serviceWorker' in navigator)){ $('#offline-readiness').textContent='Este navegador não oferece instalação offline.';return; }
  try {
    const registro=await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
    const aviso=()=>{if(registro.waiting&&navigator.serviceWorker.controller)$('#update-banner').hidden=false;};
    aviso();registro.addEventListener('updatefound',()=>{const sw=registro.installing;sw?.addEventListener('statechange',()=>{if(sw.state==='installed')aviso();if(sw.state==='redundant')$('#offline-readiness').textContent='O cache offline não foi concluído. Recarregue com conexão.';});});
    $('#apply-update').addEventListener('click',()=>registro.waiting?.postMessage({tipo:'ATIVAR_ATUALIZACAO'}));
    let atualizando=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(registro.waiting||!$('#update-banner').hidden){if(!atualizando){atualizando=true;location.reload();}}});
    await navigator.serviceWorker.ready;
    $('#offline-readiness').textContent='Todos os estilos disponíveis offline';
    // Verifica atualização sem interferir nos recursos que já estão em cache.
    if(navigator.onLine)registro.update().catch(()=>{});
  } catch { $('#offline-readiness').textContent='Uso offline indisponível nesta sessão. Use localhost ou uma hospedagem segura.'; }
}
async function iniciar() {
  try {
    dados=await carregarDados();
    if(!globalThis.htmx)throw new Error('vendor/htmx.min.js não foi carregado. Verifique os arquivos locais do projeto.');
    let local;
    try{local=window.localStorage;}catch{local={getItem(){throw new Error('bloqueado');},setItem(){throw new Error('bloqueado');}};}
    const armazenamento=criarArmazenamento(local,avisoArmazenamento);let biblioteca=armazenamento.ler();
    if(biblioteca){try{biblioteca=validarBiblioteca(biblioteca,dados);}catch(erro){avisoArmazenamento(`A biblioteca salva não pôde ser restaurada: ${erro.message} Uma sessão nova foi aberta.`);biblioteca=null;}}
    biblioteca ||= novaBiblioteca(dados);perfis=criarPerfis(dados,biblioteca,b=>armazenamento.salvar(b));
    let inicial=biblioteca.ultimaCombinacao;try{inicial=lerHash(location.hash,dados)||inicial;}catch(erro){notificar(`O link contém uma combinação inválida. ${erro.message}`);}
    estado=criarEstado(dados,inicial);
    $('#combination-count').textContent=(dados.estilos.length*dados.layouts.length*dados.paletas.length).toLocaleString('pt-BR');$('#component-count').textContent=dados.componentes.length;
    const categorias=[...new Set(dados.layouts.map(l=>l.categoria))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    $('#layout-category').innerHTML='<option value="">Todas as categorias</option>'+categorias.map(c=>`<option>${escapar(c)}</option>`).join('');
    configurarEventos();iniciarPerfisUI(perfis,estado,dados);
    estado.ouvir((atual,anterior)=>{
      atualizarTema();renderSeletores();renderControles();atualizarSaida();history.replaceState(null,'',hashEstado(atual));perfis.atualizarEstado(atual);
      if(atual.layout!==anterior.layout||atual.tela!==anterior.tela)carregarPreview();else verificarPronto();
    });
    atualizarTema();renderSeletores();renderControles();atualizarSaida();history.replaceState(null,'',hashEstado(estado.get()));
    carregarPreview();iniciarOffline();
    const escolhido=$('#selection-grid [aria-pressed="true"]');
    if(escolhido){const grade=$('#selection-grid');grade.scrollTop+=escolhido.getBoundingClientRect().top-grade.getBoundingClientRect().top-grade.clientHeight/2;}
    if($('#storage-warning').hidden)perfis.atualizarEstado(estado.get());
    // Interface mínima de observação para o checklist; não permite introduzir dados arbitrários.
    window.portalEstilos=Object.freeze({estado:()=>estado.get(),selecionar:parcial=>estado.set(parcial),dados:()=>structuredClone(dados),saidas:()=>structuredClone(saidas),pronto:()=>pronto});
  } catch(erro){erroFatal(erro);}
}
iniciar();
