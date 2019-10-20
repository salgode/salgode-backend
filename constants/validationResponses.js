module.exports = {
  BadRequest: {
    statusCode: 400,
    message: 'Tu solicitud tiene errores'
  },
  Unauthorized: {
    statusCode: 401,
    message: 'No estás autorizado para esto'
  },
  ValidationErrorEmailAlreadyInUse: {
    statusCode: 400,
    message: 'El email ya está en uso'
  },
  ValidationErrorInvalidCredentials: {
    statusCode: 401,
    message: 'Credenciales inválidas'
  },
  ValidationErrorPasswordMismatch: {
    statusCode: 400,
    message: 'Las contraseñas no coinciden'
  },
  NotFound: {
    statusCode: 404,
    message: 'No se ha encontrado lo que buscas'
  },
  InternalServerError: {
    statusCode: 503,
    message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
  }
};
