import {$,$$,escapar,icone,baixar,notificar,formulario} from './util.js';
export function iniciarPerfisUI(perfis,estado,dados) {
  const dialog=$('#profiles-dialog');
  function render() {
    const biblioteca=perfis.get();const ativo=perfis.ativo();$('#active-profile-name').textContent=ativo.nome;
    $('#open-profiles').setAttribute('aria-label',`Abrir perfis. Perfil ativo: ${ativo.nome}`);
    $('#profile-select').innerHTML=biblioteca.perfis.map(p=>`<option value="${escapar(p.id)}" ${p.id===ativo.id?'selected':''}>${escapar(p.nome)}</option>`).join('');
    const itens=[...ativo.combinacoes].sort((a,b)=>Number(b.favorita)-Number(a.favorita)||b.atualizadaEm.localeCompare(a.atualizadaEm));
    $('#saved-list').innerHTML=itens.length?itens.map(c=>{
      const nome=c.variaveis;const resumo=[dados.estilos.find(x=>x.id===nome.estilo).nome,dados.layouts.find(x=>x.id===nome.layout).nome,dados.paletas.find(x=>x.id===nome.paleta).nome,nome.modo].join(' · ');
      return `<article class="saved-combination" data-id="${escapar(c.id)}"><header><h3>${escapar(c.nome)}</h3><button class="p-icon" data-saved="favorite" aria-pressed="${c.favorita}" aria-label="Favoritar ${escapar(c.nome)}">${icone('star')}</button></header><p>${escapar(resumo)}</p>${c.nota?`<p>${escapar(c.nota)}</p>`:''}<small>Criada em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(c.criadaEm))}</small><div class="saved-actions"><button class="p-button primary" data-saved="apply">Aplicar</button><button class="p-button" data-saved="rename">Renomear / nota</button><button class="p-button" data-saved="export">Exportar</button><button class="p-button danger" data-saved="delete">Excluir</button></div></article>`;
    }).join(''):'<div class="empty-library"><strong>Sua próxima direção começa aqui.</strong><p>Use “Salvar combinação” para guardar o que você criar neste perfil.</p></div>';
  }
  const exibirErro=erro=>{const el=$('#profile-error');el.textContent=erro.message;el.hidden=false;};
  perfis.ouvir(render);render();
  $('#open-profiles').addEventListener('click',()=>{$('#profile-error').hidden=true;render();dialog.showModal();});
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('#profile-select').addEventListener('change',e=>{estado.set(perfis.ativar(e.target.value),'perfil');notificar(`Perfil ativo: ${perfis.ativo().nome}.`);});
  $('#save-combination').addEventListener('click',async()=>{
    const atual=estado.get();const nome=dados.estilos.find(s=>s.id===atual.estilo).nome+' · '+dados.paletas.find(p=>p.id===atual.paleta).nome;
    const valores=await formulario({titulo:'Guarde esta direção.',descricao:`Será salva no perfil “${perfis.ativo().nome}”.`,campos:[{name:'nome',label:'Nome da combinação',value:nome},{name:'nota',label:'Uma nota para lembrar (opcional)',area:true}]});
    if(valores) {try{perfis.guardar(valores.nome,valores.nota,atual);notificar('Combinação salva no perfil ativo.');}catch(e){notificar(e.message);}}
  });
  dialog.addEventListener('click',async e=>{
    const button=e.target.closest('[data-profile-action],[data-saved]');if(!button)return;
    try {
      const action=button.dataset.profileAction;const ativo=perfis.ativo();
      if(['create','rename','duplicate'].includes(action)) {
        const titulo=action==='create'?'Um espaço para outro projeto.':action==='rename'?'Um novo nome para este perfil.':'Duplique uma boa ideia.';
        const resposta=await formulario({titulo,campos:[{name:'nome',label:'Nome do perfil',value:action==='create'?'':ativo.nome+(action==='duplicate'?' — cópia':'')}]});
        if(resposta){if(action==='create')perfis.criar(resposta.nome);if(action==='rename')perfis.renomear(resposta.nome);if(action==='duplicate')perfis.duplicar(resposta.nome);notificar('Perfil atualizado.');}
      }
      if(action==='delete') {
        const resposta=await formulario({titulo:'Excluir este perfil?',descricao:`“${ativo.nome}” e suas ${ativo.combinacoes.length} combinações serão excluídos. Exporte um backup se quiser mantê-los.`,confirmar:'Excluir perfil',perigo:true});
        if(resposta){estado.set(perfis.excluir(),'perfil');notificar('Perfil excluído.');}
      }
      if(action==='export'||action==='export-all') {const tipo=action==='export'?'perfil':'perfis';baixar(JSON.stringify(perfis.exportar(tipo),null,2),`portal-${tipo}.json`,'application/json');notificar('Exportação JSON preparada.');}
      const itemAction=button.dataset.saved;if(!itemAction)return;
      const id=button.closest('[data-id]').dataset.id;const c=ativo.combinacoes.find(c=>c.id===id);
      if(itemAction==='apply'){estado.set(c.variaveis,'perfil');dialog.close();notificar(`Combinação aplicada: ${c.nome}.`);}
      if(itemAction==='favorite'){perfis.editar(id,{favorita:!c.favorita});$(`[data-id="${id}"] [data-saved="favorite"]`)?.focus();}
      if(itemAction==='rename') {const r=await formulario({titulo:'Refine esta lembrança.',campos:[{name:'nome',label:'Nome da combinação',value:c.nome},{name:'nota',label:'Nota (opcional)',value:c.nota,area:true}]});if(r)perfis.editar(id,{nome:r.nome,nota:r.nota});}
      if(itemAction==='delete') {const r=await formulario({titulo:'Excluir esta combinação?',descricao:`“${c.nome}” será removida de “${ativo.nome}”.`,confirmar:'Excluir combinação',perigo:true});if(r){perfis.remover(id);notificar('Combinação excluída.');}}
      if(itemAction==='export'){baixar(JSON.stringify(perfis.exportar('combinacao',id),null,2),'portal-combinacao.json','application/json');notificar('Combinação exportada.');}
    } catch(erro){exibirErro(erro);}
  });
  $('#import-profiles').addEventListener('click',()=>$('#import-file').click());
  $('#import-file').addEventListener('change',async e=>{
    const arquivo=e.target.files[0];if(!arquivo)return;
    try {
      if(arquivo.size>5*1024*1024)throw new Error('O arquivo excede o limite de 5 MB. Exporte perfis separadamente.');
      let objeto;try{objeto=JSON.parse(await arquivo.text());}catch{throw new Error('O arquivo não contém JSON válido. Verifique sua estrutura antes de importar.');}
      // Valida antes de pedir confirmação para não substituir uma biblioteca por um arquivo ruim.
      const {validarImportacao}=await import('./perfis.js');validarImportacao(objeto,dados);
      const modo=$('#import-mode').value;
      if(modo==='substituir') {const r=await formulario({titulo:'Substituir a biblioteca atual?',descricao:'Todos os perfis atuais serão substituídos pelo conteúdo deste arquivo. A opção Mesclar preserva os demais perfis.',confirmar:'Substituir perfis',perigo:true});if(!r)return;}
      estado.set(perfis.importar(objeto,modo),'importacao');$('#profile-error').hidden=true;notificar(modo==='mesclar'?'Perfis mesclados com sucesso.':'Biblioteca substituída com sucesso.');
    } catch(erro){exibirErro(erro);}finally{e.target.value='';}
  });
}
