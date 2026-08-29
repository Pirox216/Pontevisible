// ============================================================
// traducirError.js
// Convierte los mensajes de error técnicos (principalmente de
// Supabase Auth / red / base de datos) en mensajes 100% en
// español, cotidianos y amigables para el comerciante.
// Cero palabras técnicas en inglés visibles en pantalla.
// ============================================================

export function traducirError(error) {
  if (!error) return ''

  const mensajeCrudo = typeof error === 'string' ? error : (error.message || JSON.stringify(error))
  const msg = mensajeCrudo.toLowerCase()

  // ================= AUTH (Supabase Auth) =================
  // Clave o correo incorrectos
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return '🔑 El correo o la clave no coinciden. Revisa los datos e intenta nuevamente.'
  }

  // Correo aún no confirmado
  if (msg.includes('email not confirmed') || msg.includes('user email not confirmed')) {
    return '📩 Tu cuenta está pendiente de confirmación. Revisa tu correo y confirma tu dirección para poder entrar.'
  }

  // Correo ya registrado
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('email already in use') || msg.includes('already exists')) {
    return '🏪 Ya existe un negocio registrado con este correo electrónico. Prueba con otra cuenta o inicia sesión.'
  }

  // Clave muy corta
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return '🔒 La clave debe tener mínimo 6 caracteres. Usa una clave más larga y segura.'
  }

  // Paginación / límite de intentos
  if (msg.includes('email rate limit exceeded') || msg.includes('rate limit exceeded')) {
    return '⏳ Has realizado varios intentos seguidos. Por seguridad, espera unos minutos e intenta de nuevo.'
  }

  // Registro por correo deshabilitado
  if (msg.includes('email signups are disabled') || msg.includes('signups are disabled')) {
    return '🚫 El registro por correo está pausado temporalmente en el sistema. Intenta de nuevo más tarde.'
  }

  // Enlace de recuperación / token inválido o expirado
  if (msg.includes('invalid token') || msg.includes('token has expired') || msg.includes('link is invalid') || msg.includes('expired token')) {
    return '🔗 Ese enlace ya no es válido o expiró. Pide un enlace nuevo para continuar.'
  }

  // ================= RED / CONECTIVIDAD =================
  if (msg.includes('network request failed')
    || msg.includes('network error')
    || msg.includes('failed to fetch')
    || msg.includes('networkrequestfailed')
    || msg.includes('connection refused')
    || msg.includes('timed out')) {
    return '📡 No pudimos conectar con el servidor. Revisa tu conexión a internet e intenta nuevamente.'
  }

  // ================= BASE DE DATOS / ESTRUCTURA =================
  // Tabla o esquema no disponible (caché / migración)
  if (msg.includes('could not find the table') || msg.includes('relation') || msg.includes('schema cache')) {
    return '🔧 Estamos actualizando el sistema de bases de datos. Por favor recarga la página o intenta de nuevo en un momento.'
  }
  // Sesión / permisos
  if (msg.includes('violates foreign key constraint') || msg.includes('row-level security')) {
    return '🔒 Tu sesión ha cambiado o expirado. Vuelve a iniciar sesión para continuar.'
  }
  // Campos obligatorios
  if (msg.includes('violates not-null constraint') || msg.includes('null value in column')) {
    return '📝 Por favor completa todos los campos obligatorios antes de guardar.'
  }
  // Duplicados
  if (msg.includes('duplicate key value violates unique constraint')) {
    return '⚠️ Ya existe un registro con estos mismos datos en el sistema.'
  }

  // ================= MENSAJE POR DEFECTO HUMANIZADO =================
  return '⚠️ No pudimos completar la acción en este momento. Revisa tus datos e intenta nuevamente.'
}
