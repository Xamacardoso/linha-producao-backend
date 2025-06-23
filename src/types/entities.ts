export interface IProduto {
    id: number;
    id_produto: string | null; // O código de barras/SKU, pode ser nulo inicialmente
    linha_id: number;
    status_geral: 'Em producao' | 'Concluido' | 'Cancelado';
    data_criacao: Date;
    data_conclusao: Date | null;
  }
  
  export interface IHistoricoEtapa {
    id: number;
    produto_id: number;
    etapa_id: number;
    inicio_ts: Date | null; // Nulo para etapas futuras
    fim_ts: Date | null;   // Nulo para a etapa atual e futuras
  }
  
  export interface IAlerta {
    id: number;
    linha_id: number;
    etapa_id: number | null; // Nulo se for um alerta geral da linha
    descricao: string;
    inicio_alerta_ts: Date;
    fim_alerta_ts: Date | null; // Nulo enquanto o alerta estiver ativo
    status_alerta: 'Aberto' | 'Resolvido';
  }