/* Teste de integração real. Playwright é usado apenas nesta ferramenta de desenvolvimento. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.dirname(__dirname);const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const base=process.env.PORTAL_TEST_URL||'http://127.0.0.1:8000/';
const resultado={data:new Date().toISOString(),url:base,grupos:[],layouts:[],requisicoesExternas:[],erros:[]};
const ready=page=>page.waitForFunction(()=>document.documentElement.dataset.ready==='true',{timeout:30000});
async function fecharFormulario(page,seletor='#form-confirm') { const fechado=page.evaluate(()=>new Promise(resolve=>document.querySelector('#form-dialog').addEventListener('close',()=>setTimeout(resolve,0),{once:true}))); await page.locator(seletor).click(); await fechado; }
async function teste(nome,fn){await fn();resultado.grupos.push({nome,status:'PASSOU'});console.log('PASSOU:',nome);}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();const swFile=path.join(root,'sw.js');const swOriginal=fs.readFileSync(swFile,'utf8');let mudouWorker=false;
  page.on('pageerror',e=>resultado.erros.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin&&!r.url().startsWith('data:'))resultado.requisicoesExternas.push(r.url());});
  try {
    await teste('Inicialização em subpasta, htmx local e pré-cache completo',async()=>{
      await page.goto(base);await ready(page);assert.equal(await page.locator('#fatal-error').isVisible(),false);
      assert.equal(await page.evaluate(()=>htmx.version),'2.0.11');assert.equal(await page.locator('#combination-count').innerText(),'7.200');
      await page.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('#offline-readiness').textContent.includes('Todos'),{timeout:45000});
      resultado.cache=await page.evaluate(async()=>{const names=await caches.keys();const keys=await(await caches.open(names.find(n=>n.startsWith('portal-estilos-')))).keys();return {names,arquivos:keys.map(k=>new URL(k.url).pathname)};});
      assert.ok(resultado.cache.arquivos.filter(p=>p.includes('/partials/layouts/')).length===30);assert.ok(resultado.cache.arquivos.filter(p=>p.includes('/partials/componentes/')).length===36);
      await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
    });
    await teste('Seletores, busca, filtro, modificadores, saídas e clipboard sincronizados',async()=>{
      await page.locator('#selector-search').fill('neobru');assert.equal(await page.locator('[data-selection]').count(),1);await page.locator('[data-selection]').click();
      await page.locator('[data-mode="escuro"]').click();await page.selectOption('[data-modifier="raio"]','16');await page.selectOption('[data-modifier="tipografia"]','mono');await page.selectOption('[data-modifier="sombra"]','intensa');
      const e=await page.evaluate(()=>portalEstilos.estado());assert.equal(e.estilo,'neobrutalism');assert.equal(e.modo,'escuro');assert.equal(e.raio,'16');assert.ok(page.url().includes('neobrutalism'));
      await page.locator('[data-output="css"]').click();assert.ok((await page.locator('#output-text').inputValue()).includes('--raio: 16px;'));
      await page.locator('[data-output="json"]').click();assert.equal(JSON.parse(await page.locator('#output-text').inputValue()).combinacao.estilo,e.estilo);
      await page.locator('[data-output="prompt"]').click();await page.locator('#copy-output').click();const clip=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(clip.replaceAll('\r\n','\n')===await page.locator('#output-text').inputValue(),'Clipboard diverge da saída exibida');assert.ok(clip.includes('Neobrutalism')&&clip.includes('modo escuro'));
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-output').click()]);const arquivo=await download.path();assert.ok(fs.readFileSync(arquivo,'utf8').replaceAll('\r\n','\n')===clip.replaceAll('\r\n','\n'),'Download diverge do clipboard');
      await page.locator('#selector-layouts').click();await page.selectOption('#layout-category','Comércio');assert.equal(await page.locator('[data-selection]').count(),3);
      await page.locator('#reset').click();await ready(page);await page.locator('#selector-estilos').click();
      const durante=await page.evaluate(()=>{portalEstilos.selecionar({layout:'chat'});portalEstilos.selecionar({modo:'escuro'});return {pronto:portalEstilos.pronto(),copiar:document.querySelector('#copy-output').disabled};});assert.equal(durante.pronto,false);assert.equal(durante.copiar,true);await ready(page);assert.equal(await page.locator('.demo-layout').getAttribute('data-layout'),'chat');await page.locator('#reset').click();await ready(page);
    });
    await teste('Catálogo completo e interações acessíveis: carrossel, diálogo, abas, menu, toast e tabela',async()=>{
      await page.locator('[data-view="catalogo"]').click();await ready(page);assert.equal(await page.locator('.catalog-item').count(),36);
      const carousel=page.locator('[data-component="carrossel"]');await carousel.locator('[data-demo="slide-next"]').click();assert.equal(await carousel.locator('[data-slide-status]').innerText(),'2 de 3');await carousel.locator('[data-demo="slide-next"]').click();assert.equal(await carousel.locator('[data-demo="slide-next"]').isDisabled(),true);
      const modal=page.locator('[data-component="modal"]');await modal.locator('[data-demo="open-modal"]').click();assert.equal(await modal.locator('dialog').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await modal.locator('dialog').isVisible(),false);assert.equal(await modal.locator('[data-demo="open-modal"]').evaluate(el=>el===document.activeElement),true);
      const tabs=page.locator('[data-component="abas"]');await tabs.getByRole('tab',{name:'Visão geral'}).focus();await page.keyboard.press('ArrowRight');assert.equal(await tabs.getByRole('tab',{name:'Atividade'}).getAttribute('aria-selected'),'true');assert.equal(await tabs.getByRole('tabpanel').filter({visible:true}).count(),1);
      const accordion=page.locator('[data-component="acordeao"] summary').first();await accordion.click();assert.equal(await accordion.evaluate(el=>el.parentElement.open),true);
      const menu=page.locator('[data-component="dropdown"]');await menu.locator('[data-demo="dropdown"]').click();assert.equal(await menu.getByRole('menu').isVisible(),true);await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');assert.equal(await menu.getByRole('menu').isVisible(),false);
      await page.locator('[data-demo="toast"]').click();assert.equal(await page.locator('.ui-toast-live').isVisible(),true);await page.locator('.ui-toast-live button').click();
      const chip=page.locator('[data-component="chip"]');const before=await chip.locator('.ui-chip').count();await chip.getByRole('button',{name:'Remover tag Design'}).click();assert.equal(await chip.locator('.ui-chip').count(),before-1);
      await page.locator('[data-demo="page-next"]').click();assert.ok((await page.locator('[data-page-status]').innerText()).includes('Página 2'));await page.locator('[data-demo="sort"]').click();assert.equal(await page.locator('th[aria-sort]').getAttribute('aria-sort'),'ascending');
      await page.locator('[data-demo-search]').fill('Horizonte');assert.equal(await page.locator('tr[data-project-row]:visible').count(),1);await page.locator('[data-demo-search]').fill('');
      const range=page.locator('[data-demo-range]');await range.focus();await page.keyboard.press('ArrowRight');assert.equal(await range.evaluate(el=>el.value),'61');
      const ids=await page.locator('[id]').evaluateAll(els=>els.map(e=>e.id));assert.equal(new Set(ids).size,ids.length,'IDs DOM duplicados');
    });
    await teste('Perfis pela interface: persistência, CRUD, favorito, arquivos, mesclar e substituir',async()=>{
      await page.locator('[data-view="layouts"]').click();await ready(page);await page.locator('#save-combination').click();await page.locator('#form-fields input[name="nome"]').fill('Direção para Escola');await page.locator('#form-fields textarea').fill('Nota de teste local');await fecharFormulario(page);
      await page.locator('#open-profiles').click();assert.equal(await page.locator('.saved-combination').count(),1);await page.locator('[data-saved="favorite"]').click();assert.equal(await page.locator('[data-saved="favorite"]').getAttribute('aria-pressed'),'true');
      await page.locator('[data-saved="rename"]').click();await page.locator('#form-fields input').fill('Escola · versão final');await fecharFormulario(page);assert.ok((await page.locator('.saved-combination h3').innerText()).includes('versão final'));
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-saved="export"]').click()]);const combo=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(combo.versao,1);assert.equal(combo.combinacao.nota,'Nota de teste local');
      const [exportAll]=await Promise.all([page.waitForEvent('download'),page.locator('[data-profile-action="export-all"]').click()]);const all=fs.readFileSync(await exportAll.path());
      await page.locator('[data-profile-action="duplicate"]').click();await page.locator('#form-fields input').fill('Painel Admin');await fecharFormulario(page);assert.equal(await page.locator('#active-profile-name').innerText(),'Painel Admin');assert.equal(await page.locator('.saved-combination').count(),1);
      await page.locator('[data-profile-action="rename"]').click();await page.locator('#form-fields input').fill('Admin Renomeado');await fecharFormulario(page);
      await page.locator('[data-profile-action="create"]').click();await page.locator('#form-fields input').fill('Terceiro projeto');await fecharFormulario(page);assert.equal(await page.locator('.saved-combination').count(),0);
      await page.locator('[data-profile-action="delete"]').click();await fecharFormulario(page,'#form-cancel');assert.equal(await page.locator('#active-profile-name').innerText(),'Terceiro projeto');
      await page.locator('[data-profile-action="delete"]').click();await fecharFormulario(page);assert.notEqual(await page.locator('#active-profile-name').innerText(),'Terceiro projeto');
      await page.locator('#import-file').setInputFiles({name:'biblioteca.json',mimeType:'application/json',buffer:all});await page.waitForFunction(()=>document.querySelector('#portal-toast').textContent.includes('mesclados'));assert.equal(await page.locator('#profile-select option').count(),2);
      await page.locator('#import-file').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{invalido')});await page.locator('#profile-error').waitFor({state:'visible'});assert.ok((await page.locator('#profile-error').innerText()).includes('JSON válido'));
      await page.selectOption('#import-mode','substituir');await page.locator('#import-file').setInputFiles({name:'biblioteca.json',mimeType:'application/json',buffer:all});await page.locator('#form-dialog').waitFor({state:'visible'});await fecharFormulario(page);await page.waitForFunction(()=>document.querySelectorAll('#profile-select option').length===1);assert.equal(await page.locator('.saved-combination').count(),1);
      await page.locator('[data-saved="delete"]').click();await fecharFormulario(page,'#form-cancel');assert.equal(await page.locator('.saved-combination').count(),1);
      await page.locator('[data-saved="apply"]').click();await ready(page);await page.reload();await ready(page);await page.locator('#open-profiles').click();assert.equal(await page.locator('.saved-combination').count(),1);assert.equal(await page.locator('[data-saved="favorite"]').getAttribute('aria-pressed'),'true');await page.locator('[data-close-dialog]').click();
    });
    await teste('Todos os 30 layouts renderizados online e na dimensão celular',async()=>{
      const layouts=await page.evaluate(()=>portalEstilos.dados().layouts);
      for(const l of layouts){await page.evaluate(id=>portalEstilos.selecionar({layout:id,tela:'layouts',dispositivo:'desktop'}),l.id);await ready(page);const count=await page.locator('.component-slot').evaluateAll(e=>new Set(e.map(x=>x.dataset.component)).size);assert.equal(count,36,l.id);
        await page.evaluate(()=>portalEstilos.selecionar({dispositivo:'celular'}));await page.waitForTimeout(280);const dims=await page.locator('#preview-viewport').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(dims.scroll<=dims.client+2,`${l.id}: overflow ${JSON.stringify(dims)}`);resultado.layouts.push({layout:l.nome,componentes:count,celular:'PASSOU'});
      }
    });
    await teste('Comportamentos próprios: wizard, kanban, chat, calendário e feed',async()=>{
      await page.evaluate(()=>portalEstilos.selecionar({layout:'wizard',dispositivo:'desktop'}));await ready(page);await page.locator('[data-demo="wizard-next"]').click();assert.ok((await page.locator('[data-wizard-error]').innerText()).includes('nome'));await page.locator('.wizard input[type="text"]').fill('Projeto real');await page.locator('[data-demo="wizard-next"]').click();assert.equal(await page.locator('.wizard').getAttribute('data-step'),'1');await page.locator('[data-demo="wizard-next"]').click();assert.equal(await page.locator('.wizard').getAttribute('data-step'),'2');
      await page.evaluate(()=>portalEstilos.selecionar({layout:'kanban'}));await ready(page);await page.locator('.kanban-column').first().locator('[data-demo="move-task"]').first().click();assert.equal(await page.locator('.kanban-column').nth(1).locator('.kanban-item').count(),3);
      await page.evaluate(()=>portalEstilos.selecionar({layout:'chat'}));await ready(page);await page.locator('[data-chat-form] input').fill('Mensagem local de teste');await page.locator('[data-chat-form] button').click();assert.ok((await page.locator('.chat-messages').innerText()).includes('Mensagem local de teste'));
      await page.evaluate(()=>portalEstilos.selecionar({layout:'calendario'}));await ready(page);await page.locator('[data-demo="month-next"]').click();assert.ok((await page.locator('[data-month-label]').innerText()).includes('novembro'));await page.locator('[data-demo="calendar-day"]').first().click();assert.ok((await page.locator('[data-calendar-event]').innerText()).includes('1 de novembro'));
      await page.evaluate(()=>portalEstilos.selecionar({layout:'feed'}));await ready(page);await page.locator('.feed-layout textarea').fill('Uma novidade na equipe');await page.locator('[data-demo="feed-post"]').click();assert.ok((await page.locator('[data-feed]').innerText()).includes('Uma novidade na equipe'));
    });
    await teste('Temas renderizados, modificadores, movimento reduzido e responsividade do portal',async()=>{
      const tokens=await page.evaluate(async()=>{const {gerarTokens,aplicarTokens}=await import('./js/tema.js');const d=portalEstilos.dados();let n=0;const problemas=[];for(const e of d.estilos)for(const p of d.paletas)for(const modo of ['claro','escuro']){const t=gerarTokens(d,{...d.modificadores.padrao,estilo:e.id,paleta:p.id,modo});aplicarTokens(document.querySelector('#preview-viewport'),t);const s=getComputedStyle(document.querySelector('.ui-button'));if(s.color===s.backgroundColor)problemas.push(e.id+'/'+p.id+'/'+modo);n++;}aplicarTokens(document.querySelector('#preview-viewport'),gerarTokens(d,portalEstilos.estado()));return {n,problemas};});assert.equal(tokens.n,480);assert.deepEqual(tokens.problemas,[]);
      await page.evaluate(()=>portalEstilos.selecionar({...portalEstilos.dados().modificadores.padrao}));await ready(page);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);assert.equal(await page.locator('#controls-panel').isVisible(),false);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.locator('#open-controls').click();assert.equal(await page.locator('#controls-panel').getAttribute('aria-modal'),'true');await page.locator('#selector-paletas').click();await page.screenshot({path:path.join(out,'gaveta-celular.png'),fullPage:false});await page.keyboard.press('Escape');assert.equal(await page.locator('#open-controls').getAttribute('aria-expanded'),'false');await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'celular.png'),fullPage:true});
      await page.emulateMedia({reducedMotion:'reduce'});const duration=await page.locator('#preview-root .ui-button').first().evaluate(el=>getComputedStyle(el).transitionDuration);assert.ok(duration.split(',').every(x=>parseFloat(x)<.01));await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1000});
    });
    await teste('Offline real: recarga, 30 layouts nunca dependem de rede e catálogo disponível',async()=>{
      await context.setOffline(true);await page.reload();await ready(page);assert.ok((await page.locator('#network-status').innerText()).includes('Offline'));
      const layouts=await page.evaluate(()=>portalEstilos.dados().layouts);for(const l of layouts){await page.evaluate(id=>portalEstilos.selecionar({layout:id}),l.id);await ready(page);assert.equal(await page.locator('.component-slot').evaluateAll(e=>new Set(e.map(x=>x.dataset.component)).size),36,l.id);}
      await page.evaluate(()=>portalEstilos.selecionar({tela:'catalogo'}));await ready(page);assert.equal(await page.locator('.catalog-item').count(),36);await context.setOffline(false);
    });
    await teste('Aviso de atualização, ativação da nova versão e preservação do perfil',async()=>{
      const perfil=await page.locator('#active-profile-name').innerText();fs.writeFileSync(swFile,swOriginal.replace(/const VERSAO = '[^']+';/,"const VERSAO = '1.0.1-teste';"));mudouWorker=true;
      await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await page.locator('#update-banner').waitFor({state:'visible',timeout:45000});await page.locator('#apply-update').click();await page.waitForEvent('load');await ready(page);assert.equal(await page.locator('#active-profile-name').innerText(),perfil);assert.ok(await page.evaluate(async()=> (await caches.keys()).some(x=>x.endsWith('1.0.1-teste'))));
      fs.writeFileSync(swFile,swOriginal);mudouWorker=false;
    });
    await teste('Falhas legíveis de JSON e armazenamento bloqueado',async()=>{
      const invalid=await browser.newContext({serviceWorkers:'block'});const p=await invalid.newPage();await p.route('**/data/estilos.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{quebrado'}));await p.goto(base);await p.locator('#fatal-error').waitFor({state:'visible'});assert.ok((await p.locator('#fatal-error').innerText()).includes('JSON malformado'));await invalid.close();
      const denied=await browser.newContext({serviceWorkers:'block'});await denied.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Bloqueado','SecurityError');}});});const p2=await denied.newPage();await p2.goto(base);await ready(p2);assert.equal(await p2.locator('#storage-warning').isVisible(),true);await denied.close();
    });
    await teste('Nenhuma requisição externa ou exceção JavaScript',async()=>{assert.deepEqual(resultado.requisicoesExternas,[]);assert.deepEqual(resultado.erros,[]);});
  } finally {if(mudouWorker)fs.writeFileSync(swFile,swOriginal);fs.writeFileSync(path.join(out,'navegador.json'),JSON.stringify(resultado,null,2));await browser.close();}
  console.log(`\n${resultado.grupos.length} grupos de navegador passaram.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
