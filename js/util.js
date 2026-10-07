export const $ = (selector, root=document) => root.querySelector(selector);
export const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
export function escapar(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function icone(id) { return `<svg class="icon" aria-hidden="true"><use href="#i-${escapar(id)}"></use></svg>`; }
export function baixar(texto,nome,tipo='text/plain') {
  const url=URL.createObjectURL(new Blob([texto],{type:`${tipo};charset=utf-8`}));
  const a=document.createElement('a'); a.href=url; a.download=nome; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return; } catch { /* Fallback local para navegadores sem Clipboard API. */ }
  const campo=document.createElement('textarea'); campo.value=texto; campo.style.position='fixed'; campo.style.top='-1000px'; document.body.append(campo); campo.select();
  const anterior=document.activeElement;
  const ok=document.execCommand('copy'); campo.remove(); anterior?.focus();
  if(!ok) throw new Error('O navegador bloqueou a cópia. Selecione o texto na saída e use Ctrl+C.');
}
export function notificar(mensagem) {
  const el=$('#portal-toast'); $('span',el).textContent=mensagem; el.hidden=false;
  clearTimeout(notificar.timer); notificar.timer=setTimeout(()=>{el.hidden=true;},6000);
}
export function formulario({titulo,descricao='',campos=[],confirmar='Salvar',perigo=false}) {
  const dialog=$('#form-dialog'); const form=$('#portal-form');
  $('#form-title').textContent=titulo; $('#form-description').textContent=descricao;
  $('#form-fields').innerHTML=campos.map(c=>`<label>${escapar(c.label)}${c.area?`<textarea name="${escapar(c.name)}" rows="3" maxlength="4000">${escapar(c.value||'')}</textarea>`:`<input name="${escapar(c.name)}" value="${escapar(c.value||'')}" maxlength="120" ${c.obrigatorio===false?'':'required'}>`}</label>`).join('');
  $('#form-confirm').textContent=confirmar; $('#form-confirm').classList.toggle('danger',perigo);
  dialog.returnValue=''; dialog.showModal();
  if(perigo) $('#form-cancel').focus();
  return new Promise(resolve=>{
    const submit=e=>{ e.preventDefault(); if(form.reportValidity()) dialog.close('confirmar'); };
    const cancel=()=>dialog.close('cancelar');
    form.addEventListener('submit',submit); $('#form-cancel').addEventListener('click',cancel);
    dialog.addEventListener('close',()=>{form.removeEventListener('submit',submit); $('#form-cancel').removeEventListener('click',cancel); resolve(dialog.returnValue==='confirmar'?Object.fromEntries(new FormData(form)):null);},{once:true});
  });
}
export function configurarAbas(container,acionar) {
  container.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key) || e.target.getAttribute('role')!=='tab') return;
    const tabs=$$('[role="tab"]',container).filter(t=>!t.disabled); let index=tabs.indexOf(e.target);
    index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    e.preventDefault(); tabs[index].focus(); acionar(tabs[index]);
  });
}
