/* Teste de integração do escopo adaptável e da preferência PWA no prompt. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PORTAL_TEST_URL||'http://127.0.0.1:8000/';
const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const result={data:new Date().toISOString(),testes:[],erros:[]};
const ready=p=>p.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:30000});
async function teste(nome,fn){await fn();result.testes.push({nome,status:'PASSOU'});console.log('PASSOU:',nome);}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const context=await browser.newContext({viewport:{width:1600,height:1050},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>result.erros.push(e.message));
  const pwa=page.getByRole('checkbox',{name:'Preparar como PWA',exact:true});
  const set=async partial=>{await page.evaluate(p=>portalEstilos.selecionar(p),partial);await ready(page);};
  const oldHash='#estilo=minimalista-suico&layout=dashboard&paleta=verde-esmeralda&modo=claro&tipografia=geometrica&raio=estilo&densidade=confortavel&sombra=estilo&dispositivo=desktop&tela=layouts&tamanhoPrompt=completo-css';
  try {
    await page.goto(base+oldHash);await ready(page);
    await teste('Links antigos abrem com PWA desligado; três modelos orientam o uso necessário',async()=>{
      assert.equal(await pwa.isChecked(),false);assert.equal(await page.evaluate(()=>portalEstilos.estado().pwa),false);
      const adaptacao=await page.evaluate(()=>portalEstilos.dados()['prompt-modelos'].adaptacao);
      for(const tamanho of ['curto','completo','completo-css']){await page.selectOption('#prompt-size',tamanho);const texto=await page.locator('#output-text').inputValue();assert.ok(texto.startsWith('ADAPTAÇÃO AO CONTEÚDO REAL'));assert.ok(texto.includes(adaptacao));assert.ok(!texto.includes('PREPARAR O PROJETO COMO PWA'));assert.ok(texto.includes('CATÁLOGO OPCIONAL'));}
    });
    await teste('Checkbox por teclado altera somente as instruções PWA, com cópia e download coerentes',async()=>{
      const antes=await page.evaluate(()=>({saida:portalEstilos.saidas(),preview:document.querySelector('#preview-root').innerHTML}));
      await pwa.focus();await page.keyboard.press('Space');assert.equal(await pwa.isChecked(),true);assert.ok(page.url().includes('pwa=true'));
      const depois=await page.evaluate(()=>({saida:portalEstilos.saidas(),preview:document.querySelector('#preview-root').innerHTML,pwa:portalEstilos.dados()['prompt-modelos'].pwa.prompt}));
      assert.equal(depois.saida.prompt,antes.saida.prompt+depois.pwa);assert.equal(depois.saida.css,antes.saida.css);assert.equal(depois.preview,antes.preview);
      await page.locator('#copy-output').click();const clip=(await page.evaluate(()=>navigator.clipboard.readText())).replaceAll('\r\n','\n');assert.equal(clip,await page.locator('#output-text').inputValue());
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-output').click()]);assert.equal(fs.readFileSync(await download.path(),'utf8').replaceAll('\r\n','\n'),clip);
      await page.locator('[data-output="json"]').click();assert.equal(JSON.parse(await page.locator('#output-text').inputValue()).combinacao.pwa,true);assert.equal(await page.locator('#pwa-option-wrap').isVisible(),false);await page.locator('[data-output="prompt"]').click();assert.equal(await pwa.isChecked(),true);
      await pwa.uncheck();assert.equal(await page.locator('#output-text').inputValue(),antes.saida.prompt);await pwa.check();await page.reload();await ready(page);assert.equal(await pwa.isChecked(),true);
    });
    await teste('Contexto também é opcional; preferência acompanha salvar, aplicar, exportar e importar',async()=>{
      await set({segmento:'educacao',aplicacao:'gestao-escolar',visao:'administracao'});
      const prompt=await page.locator('#output-text').inputValue();assert.ok(prompt.includes('CONTEXTO DO PROJETO — REFERÊNCIAS OPCIONAIS'));assert.ok(prompt.includes('Campos possíveis'));assert.ok(!prompt.includes('Mantenha o layout'));assert.ok(prompt.includes('PREPARAR O PROJETO COMO PWA'));
      await page.locator('#save-combination').click();await page.locator('#form-fields input[name="nome"]').fill('Gestão escolar com PWA');await page.locator('#form-confirm').click();await page.locator('#form-dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('portal-de-estilos:v1')).perfis.some(p=>p.combinacoes.length));
      await page.locator('#reset').click();await ready(page);assert.equal(await pwa.isChecked(),false);await page.locator('#open-profiles').click();assert.ok((await page.locator('#saved-list').innerText()).includes('PWA'));
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-saved="export"]').click()]);const file=await download.path();assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).combinacao.variaveis.pwa,true);
      await page.locator('[data-saved="apply"]').click();await ready(page);assert.equal(await pwa.isChecked(),true);assert.equal(await page.evaluate(()=>portalEstilos.estado().aplicacao),'gestao-escolar');
      const fresh=await browser.newContext({serviceWorkers:'block'}),p=await fresh.newPage();await p.goto(base+oldHash);await ready(p);await p.locator('#open-profiles').click();await p.locator('#import-file').setInputFiles({name:'combinacao-pwa.json',mimeType:'application/json',buffer:fs.readFileSync(file)});await p.locator('[data-saved="apply"]').waitFor({state:'visible'});await p.locator('[data-saved="apply"]').click();await ready(p);assert.equal(await p.locator('#pwa-toggle').isChecked(),true);await fresh.close();
      await page.screenshot({path:path.join(out,'prompt-pwa-desktop.png'),fullPage:true});await page.locator('.output-panel').screenshot({path:path.join(out,'prompt-pwa-painel.png')});
    });
    await teste('Estado salvo e opção PWA continuam utilizáveis offline e no celular',async()=>{
      await page.waitForFunction(()=>navigator.serviceWorker.controller);await context.setOffline(true);await page.goto(base);await ready(page);assert.equal(await pwa.isChecked(),true);await pwa.uncheck();await page.reload();await ready(page);assert.equal(await pwa.isChecked(),false);await context.setOffline(false);
      await page.setViewportSize({width:390,height:844});await pwa.check();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await pwa.isChecked(),true);await page.locator('.output-panel').screenshot({path:path.join(out,'prompt-pwa-celular.png')});
    });
    await teste('Nenhuma exceção JavaScript',async()=>assert.deepEqual(result.erros,[]));
  } finally {fs.writeFileSync(path.join(out,'prompt-pwa-navegador.json'),JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
