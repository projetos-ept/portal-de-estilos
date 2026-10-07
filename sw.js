/* Cache isolado por subpasta e versão. A instalação só termina quando tudo está disponível. */
const VERSAO = '1.0.2';
const PREFIXO = 'portal-estilos-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIXO + VERSAO;
const BASE = new URL('./',self.location.href);
const locais = caminhos => caminhos.map(p=>new URL(p,BASE).href);
const shell = [
  './','index.html','.nojekyll','.gitignore','manifest.webmanifest','sw.js','README.md','RELATORIO-TESTES.md',
  'tests/verificar.mjs','tests/navegador.cjs',
  'css/base.css','css/componentes.css','css/portal.css',
  'js/app.js','js/dados.js','js/estado.js','js/tema.js','js/prompt.js','js/armazenamento.js','js/perfis.js','js/perfis-ui.js','js/componentes.js','js/util.js',
  'vendor/htmx.min.js','vendor/LICENSE-htmx.txt','img/icon.svg','img/paisagem.svg','img/objeto.svg',
  'data/estilos.json','data/paletas.json','data/layouts.json','data/componentes.json','data/modificadores.json','data/prompt-modelos.json'
];
async function obter(url) { const resposta=await fetch(url,{cache:'reload'});if(!resposta.ok)throw new Error('Não foi possível guardar '+url);return resposta; }
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Os caminhos dos catálogos são descobertos em JSON, inclusive novos registros.
    const [lr,cr]=await Promise.all([obter(new URL('data/layouts.json',BASE)),obter(new URL('data/componentes.json',BASE))]);
    const [layouts,componentes]=await Promise.all([lr.clone().json(),cr.clone().json()]);
    const adicionais=[...layouts,...componentes].map(x=>x.caminho);
    if(adicionais.some(p=>!/^partials\/(layouts|componentes)\/[a-z0-9-]+\.html$/.test(p)))throw new Error('Caminho de parcial inválido.');
    const arquivos=[...new Set(locais([...shell,...adicionais]))];
    // Lotes evitam abrir dezenas de conexões simultâneas em aparelhos pequenos.
    for(let i=0;i<arquivos.length;i+=10)await Promise.all(arquivos.slice(i,i+10).map(async url=>cache.put(url,await obter(url))));
    await cache.put(new URL('data/layouts.json',BASE),lr);await cache.put(new URL('data/componentes.json',BASE),cr);
    if(!self.registration.active)await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{for(const nome of await caches.keys())if(nome.startsWith(PREFIXO)&&nome!==CACHE)await caches.delete(nome);await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data?.tipo==='ATIVAR_ATUALIZACAO')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);const salvo=await cache.match(event.request,{ignoreSearch:true});if(salvo)return salvo;
    // Somente navegações para a raiz podem usar index como fallback; um parcial ausente continua sendo erro.
    try {const resposta=await fetch(event.request);return resposta;}
    catch {if(event.request.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname))return await cache.match(new URL('index.html',BASE));return new Response('Recurso local não disponível offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
