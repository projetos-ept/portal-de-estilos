/* Integração do contexto; dependência de teste opcional, sem dependências no produto. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PORTAL_TEST_URL||'http://127.0.0.1:8000/';
const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const result={data:new Date().toISOString(),testes:[],erros:[],externas:[]};
const ready=p=>p.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:30000});
async function teste(nome,fn){await fn();result.testes.push({nome,status:'PASSOU'});console.log('PASSOU:',nome);}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const ctx=await browser.newContext({viewport:{width:1600,height:1000}}),page=await ctx.newPage();
  page.on('pageerror',e=>result.erros.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))result.externas.push(r.url());});
  const select=async v=>{await page.evaluate(v=>portalEstilos.selecionar(v),v);await ready(page);};
  let original,prompt;
  try {
    await page.goto(base);await ready(page);original=await page.locator('#preview-root').innerText();prompt=await page.locator('#output-text').inputValue();
    await teste('Aba Contexto acessível e Genérico como padrão',async()=>{
      await page.locator('#selector-contextos').click();assert.equal(await page.locator('#context-segment').inputValue(),'generico');assert.equal(await page.locator('#context-application').isDisabled(),true);assert.equal(await page.locator('#context-view').isDisabled(),true);
      await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#selector-paletas').getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#selector-contextos').getAttribute('aria-selected'),'true');
      assert.equal(await page.locator('#preview-root').innerText(),original);assert.equal(await page.locator('#output-text').inputValue(),prompt);
    });
    await teste('Banco de questões: navegação, indicadores, filtros, busca, paginação e estados',async()=>{
      await page.selectOption('#context-segment','educacao');await ready(page);assert.equal(await page.locator('#context-application').inputValue(),'banco-de-questoes');assert.equal(await page.locator('#context-view').inputValue(),'administracao');
      assert.ok((await page.locator('.ui-navigation').innerText()).includes('Revisões'));assert.ok((await page.locator('.kpi-grid').innerText()).includes('1.248'));
      const table=page.locator('[data-component="tabela"]');assert.equal(await table.locator('thead th').count(),8);assert.equal(await table.locator('[data-project-row]:visible').count(),3);
      await page.locator('[data-demo="page-next"]').click();assert.ok((await page.locator('[data-page-status]').innerText()).includes('Página 2'));
      await page.selectOption('[data-context-filter="1"]','Ciências');assert.equal(await table.locator('[data-project-row]:visible').count(),2);
      await page.selectOption('[data-context-filter="5"]','Rascunho');assert.equal(await table.locator('[data-context-empty]').isVisible(),true);
      await page.selectOption('[data-context-filter="5"]','');await page.selectOption('[data-context-filter="1"]','');
      await page.locator('[data-demo-search]').fill('Fotossíntese');assert.equal(await table.locator('[data-project-row]:visible').count(),1);await page.locator('[data-demo-search]').fill('');
      const state=await page.evaluate(()=>portalEstilos.estado());assert.equal(state.estilo,'minimalista-suico');assert.equal(state.layout,'dashboard');assert.ok((await page.locator('#output-text').inputValue()).includes('CONTEXTO DO PROJETO'));
      await page.screenshot({path:path.join(out,'contexto-banco-desktop.png'),fullPage:true});
    });
    await teste('Editor de questão adapta alternativas, gabarito, associação e resposta discursiva',async()=>{
      const trigger=page.locator('[data-demo="context-editor"]').first();await trigger.click();const modal=page.locator('.context-dialog');assert.equal(await modal.isVisible(),true);
      assert.equal(await modal.getByLabel('Alternativa A',{exact:true}).count(),1);
      await modal.locator('[data-question-type]').selectOption('Discursiva');assert.equal(await modal.getByLabel('Resposta esperada').count(),1);assert.equal(await modal.getByLabel('Alternativa A',{exact:true}).count(),0);
      await modal.locator('[data-question-type]').selectOption('Verdadeiro ou falso');assert.equal(await modal.getByLabel('Resposta correta',{exact:true}).locator('option').count(),2);
      await modal.locator('[data-question-type]').selectOption('Associação');assert.equal(await modal.getByLabel('Correspondência 3').count(),1);
      await modal.getByRole('button',{name:'Salvar demonstração'}).click();assert.ok((await modal.locator('[role="status"]').innerText()).includes('Demonstração concluída'));
      await page.screenshot({path:path.join(out,'contexto-formulario.png')});await page.keyboard.press('Escape');assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
    });
    await teste('Visões distintas e dependências válidas ao trocar segmento e aplicação',async()=>{
      for(const visao of ['operacao','portal','analise','publica']){await page.selectOption('#context-view',visao);await ready(page);assert.equal(await page.locator('.context-banner').count(),1);if(visao!=='operacao')assert.equal(await page.locator('.context-dialog').count(),0);}
      await page.selectOption('#context-segment','gestao-e-operacoes');await ready(page);assert.equal(await page.locator('#context-view option[value="publica"]').count(),0);assert.equal(await page.locator('#context-view').inputValue(),'administracao');
      await page.selectOption('#context-segment','educacao');await ready(page);
    });
    await teste('Voltar a Genérico restaura exatamente conteúdo e prompt',async()=>{
      await page.selectOption('#context-segment','generico');await ready(page);assert.equal(await page.locator('#preview-root').innerText(),original);assert.equal(await page.locator('#output-text').inputValue(),prompt);assert.equal(await page.locator('.context-banner').count(),0);
    });
    await teste('Contexto em todos os 30 layouts e no catálogo; sem estouro em 390px',async()=>{
      await page.selectOption('#context-segment','educacao');await ready(page);
      const layouts=await page.evaluate(()=>portalEstilos.dados().layouts.map(l=>l.id));
      for(const layout of layouts){await select({layout,dispositivo:'celular'});assert.equal(await page.locator('.component-slot').evaluateAll(els=>new Set(els.map(e=>e.dataset.component)).size),36);assert.equal(await page.locator('.context-banner').count(),1);assert.ok(await page.locator('#preview-root').evaluate(el=>el.scrollWidth<=el.clientWidth+2),layout);}
      await select({tela:'catalogo'});assert.equal(await page.locator('.catalog-item').count(),36);assert.ok(await page.locator('.context-highlight').count()>0);
      await select({tela:'layouts',layout:'dashboard',dispositivo:'desktop'});await page.setViewportSize({width:390,height:844});await page.locator('#open-controls').click();await page.locator('#context-panel').waitFor({state:'visible'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'contexto-celular.png')});await page.keyboard.press('Escape');await page.setViewportSize({width:1600,height:1000});
    });
    await teste('Personalizado escapa HTML e conserva objetivo no prompt e link',async()=>{
      await page.selectOption('#context-segment','personalizado');await ready(page);await page.locator('#context-name').fill('<img src=x onerror=alert(1)>');await page.locator('#context-description').fill('Biblioteca de estudos & revisões');await page.locator('#context-custom-form button').click();await ready(page);assert.equal(await page.locator('.context-banner img').count(),0);assert.ok((await page.locator('.context-banner').innerText()).includes('<img'));assert.ok((await page.locator('#output-text').inputValue()).includes('Biblioteca de estudos & revisões'));await page.reload();await ready(page);assert.equal(await page.evaluate(()=>portalEstilos.estado().contextoDescricao),'Biblioteca de estudos & revisões');
    });
    await teste('Salvar, exportar, importar e aplicar contexto pela interface',async()=>{
      await select({segmento:'educacao',aplicacao:'banco-de-questoes',visao:'administracao',contextoNome:'',contextoDescricao:''});await page.locator('#save-combination').click();await page.locator('#form-fields input[name="nome"]').fill('Banco de questões — teste');await page.locator('#form-confirm').click();await page.locator('#form-dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('portal-de-estilos:v1')).perfis.some(p=>p.combinacoes.length));
      await page.locator('#open-profiles').click();assert.ok((await page.locator('#saved-list').innerText()).includes('Administração'));
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-saved="export"]').click()]);const file=await download.path();const saved=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(saved.combinacao.variaveis.aplicacao,'banco-de-questoes');
      await page.locator('#import-file').setInputFiles(file);await page.waitForFunction(()=>!document.querySelector('#profile-error').textContent);await page.locator('[data-saved="apply"]').click();await ready(page);await page.reload();await ready(page);assert.equal(await page.evaluate(()=>portalEstilos.estado().aplicacao),'banco-de-questoes');
    });
    await teste('Contextos, formulário e prompt disponíveis offline',async()=>{
      await page.waitForFunction(()=>navigator.serviceWorker.controller);await ctx.setOffline(true);await page.reload();await ready(page);await page.locator('#selector-contextos').click();await page.selectOption('#context-segment','saude-e-laboratorio');await ready(page);assert.ok((await page.locator('.context-banner').innerText()).includes('Saúde'));assert.ok((await page.locator('#output-text').inputValue()).includes('Saúde'));await page.selectOption('#context-segment','generico');await ready(page);assert.equal(await page.locator('#preview-root').innerText(),original);await ctx.setOffline(false);
    });
    await teste('Sem exceções JavaScript nem requisições externas',async()=>{assert.deepEqual(result.erros,[]);assert.deepEqual(result.externas,[]);});
  } finally {fs.writeFileSync(path.join(out,'contexto-navegador.json'),JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
