/**
 * Classe de erro customizada para representar erros da lógica de negócio da aplicação.
 * Permite associar uma mensagem a um status code HTTP específico.
 */
export class AppError extends Error {
    public readonly statusCode: number;
  
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
  
      // Mantém o stack trace correto para a nossa classe de erro customizada
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }