export function traducirError(error) {
  if (!error) return ''

  const mensajeCrudo = typeof error === 'string' ? error : (error.message || JSON.stringify(error))
  const msg = mensajeCrudo.toLowerCase()

  // Errores de Autenticación y Cuentas
  if (msg.includes('email rate limit exceeded')) {
    return '⏳ Has realizado varios intentos seguidos. Por seguridad, espera unos minutos e intenta de nuevo.'
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return '✉️ Este correo ya tiene un negocio registrado en el sistema. Intenta entrar con tu clave o usa otro correo.'
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return '🔑 El correo o la clave no coinciden. Revisa bien tus datos e intenta de nuevo.'
  }
  if (msg.includes('password should be at least')) {
    return '🔒 Tu clave debe tener al menos 6 caracteres para mantener protegido tu negocio.'
  }
  if (msg.includes('email signups are disabled')) {
    return '🚫 El registro por correo está pausado temporalmente en el sistema.'
  }

  // Errores de Base de Datos y Estructura (Supabase / PostgreSQL)
  if (msg.includes('could not find the table') || msg.includes('relation') || msg.includes('schema cache')) {
    return '🔧 Estamos actualizando el sistema de bases de datos. Por favor recarga la página o intenta de nuevo en un momento.'
  }
  if (msg.includes('violates foreign key constraint') || msg.includes('row-level security')) {
    return '🔒 Tu sesión ha cambiado o expirado. Vuelve a iniciar sesión para continuar.'
  }
  if (msg.includes('violates not-null constraint') || msg.includes('null value in column')) {
    return '📝 Por favor completa todos los campos obligatorios antes de guardar.'
  }
  if (msg.includes('duplicate key value violates unique constraint')) {
    return '⚠️ Ya existe un registro con estos mismos datos en el sistema.'
  }

  // Errores de Red / Conectividad
  if (msg.includes('network error') || msg.includes('failed to fetch') || msg.includes('networkrequestfailed')) {
    return '📡 Problema de conexión a internet. Revisa tu red e intenta de nuevo.'
  }

  // Mensaje por defecto humanizado en español
  return `⚠️ No pudimos completar la acción en este momento. Revisa tus datos e intenta nuevamente.`
}