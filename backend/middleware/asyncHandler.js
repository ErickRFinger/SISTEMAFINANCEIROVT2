// Wrapper para capturar erros assíncronos em rotas Express
// Garante que todos os erros sejam capturados e passados para o middleware de erro

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

