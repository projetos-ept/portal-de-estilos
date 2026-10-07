/* Um erro de persistência mantém a sessão utilizável e avisa claramente o usuário. */
export const CHAVE = 'portal-de-estilos:v1';
export function criarArmazenamento(storage, avisar) {
  return {
    ler() {
      try {
        const valor = storage.getItem(CHAVE);
        return valor ? JSON.parse(valor) : null;
      } catch (erro) {
        avisar(erro instanceof SyntaxError ? 'Os dados salvos estão malformados. Uma sessão nova foi aberta; o registro original será preservado até você salvar uma alteração.' : 'O armazenamento local está indisponível. Você pode usar o portal e exportar perfis, mas a sessão não será mantida ao fechar.');
        return null;
      }
    },
    salvar(valor) {
      try { storage.setItem(CHAVE, JSON.stringify(valor)); return true; }
      catch { avisar('Não foi possível salvar: o armazenamento está cheio ou bloqueado. As alterações continuam nesta sessão. Exporte seus perfis em JSON para preservá-las.'); return false; }
    }
  };
}
