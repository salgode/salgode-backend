module.exports = {
  InternalServerError: {
    statusCode: 503,
    message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
  },
  ValidationErrorEmailAlreadyInUse: {
    statusCode: 400,
    message: 'El email ya está en uso'
  },
  ValidationErrorPasswordMismatch: {
    statusCode: 400,
    message: 'Las contraseñas no coinciden'
  }
};
