import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';

/* ============================================================
   PONTEVISIBLE PRO — LandingNegocioPanel
   Vista principal scrolleable del comerciante:
   - Evaluación conversacional inicial (con persistencia local)
   - Nivel de Visibilidad Digital (0-100%)
   - Rejilla completa de las 8 herramientas del negocio
   - Dinamismo visual con animaciones, micro-interacciones y scroll suave
   - Accesibilidad, rendimiento y resiliencia ante fallos
   Paleta oficial: Fondo #F8FAFC · Primario #0B132B · Acentos #00F5D4 y #0066FF
   Tipografía: Sora
   ============================================================ */

/* Claves de persistencia local (prefijo pv_) */
const LS_KEYS = {
  tipoCliente: 'pv_tipo_cliente',
  necesidadUrgente: 'pv_necesidad_urgente',
  descripcionNegocio: 'pv_descripcion_negocio',
};

const leerLocal = (clave, defecto = '') => {
  try {
    const valor = localStorage.getItem(clave);
    return valor == null ? defecto : valor;
  } catch {
    return defecto;
  }
};

/* Isotipo oficial PonteVisible (trazo vectorial de marca) */
function IsotipoPonteVisible({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pvLandingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#00F5D4" />
        </linearGradient>
      </defs>
      <path
        d="M 30 85 L 30 45 C 30 25, 65 25, 65 45 C 65 60, 48 60, 48 60"
        stroke="url(#pvLandingGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="42" r="5" fill="#00F5D4" />
      <path d="M 74 34 C 79 39, 79 51, 74 56" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" />
      <path d="M 83 26 C 91 35, 91 55, 83 64" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/* Micro-iconos SVG de las herramientas */
const Icn = {
  Identidad: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L3 15h18L12 3Z" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 15v6M9 21h6" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Sedes: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.6" stroke="#0F172A" strokeWidth="1.8" />
    </svg>
  ),
  Catalogo: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="#0F172A" strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Stock: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Resultados: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Citas: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="16" rx="2" stroke="#0F172A" strokeWidth="1.8" />
      <path d="M4 10h16M8 3v4M16 3v4" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 15h.01M12 15h.01M16 15h.01" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  IA: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" stroke="#0F172A" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" stroke="#0F172A" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="2" stroke="#0F172A" strokeWidth="1.6" />
    </svg>
  ),
  Discovery: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#0F172A" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

/* ---------- Componentes presentacionales (ámbito de módulo) ---------- */
function Skeleton({ altura = 90 }) {
  return <div className="pv-sk" style={{ height: altura, borderRadius: 14 }} aria-hidden="true" />;
}

function EnlaceAccion({ destino, etiqueta, color = '#0066FF', onNavegar }) {
  return (
    <a
      href="#!"
      onClick={(e) => {
        e.preventDefault();
        if (onNavegar) onNavegar(destino);
      }}
      className="pv-arrow-link"
      style={{ color, fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      {etiqueta}
      <span className="pv-arrow" aria-hidden="true">→</span>
    </a>
  );
}

export default function LandingNegocioPanel({ businessId, onNavegar = () => {} }) {
  /* ---------- Estado de carga / datos ---------- */
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [metricas, setMetricas] = useState({ items: 0, contactos: 0, citas: 0 });

  /* ---------- Estado conversacional (persistido) ---------- */
  const [tipoCliente, setTipoCliente] = useState(() => leerLocal(LS_KEYS.tipoCliente, ''));
  const [necesidadUrgente, setNecesidadUrgente] = useState(() => leerLocal(LS_KEYS.necesidadUrgente, ''));
  const [descripcionNegocio, setDescripcionNegocio] = useState(() => leerLocal(LS_KEYS.descripcionNegocio, ''));

  /* ---------- Indicador de autoguardado ---------- */
  const [mostrarGuardado, setMostrarGuardado] = useState(false);
  const timerGuardar = useRef(null);

  /* Manejo de errores de consulta sin bloquear la interfaz */
  const mapError = (resultado, mensaje) => {
    if (resultado.status === 'fulfilled') return resultado.value;
    console.warn(`[LandingNegocioPanel] ${mensaje}:`, resultado.reason?.message);
    return null;
  };

  /* ---------- Consultas concurrentes y seguras (Promise.allSettled) ---------- */
  useEffect(() => {
    let activo = true;
    const usuarioId = businessId || null;

    const cargarTodo = async () => {
      if (!usuarioId) {
        if (activo) setCargando(false);
        return;
      }

      const [perfilRes, conteoCatRes, ultimosRes, contactosRes, citasRes] = await Promise.allSettled([
        supabase.from('business_profiles').select('*').eq('user_id', usuarioId).maybeSingle(),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id, title, name, price, valor_de_venta, image_url')
          .eq('is_active', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('ocg_events').select('*', { count: 'exact', head: true }).eq('business_id', usuarioId),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', usuarioId),
      ]);

      if (!activo) return;

      const perfilData = mapError(perfilRes, 'Perfil no disponible')?.data ?? null;
      const conItems = mapError(conteoCatRes, 'Conteo de catálogo no disponible')?.count ?? 0;
      const ultimos = mapError(ultimosRes, 'Productos recientes no disponibles')?.data ?? [];
      const conContactos = mapError(contactosRes, 'Conteo OCG no disponible')?.count ?? 0;
      const conCitas = mapError(citasRes, 'Conteo de citas no disponible')?.count ?? 0;

      if (perfilData) setPerfil(perfilData);
      setProductos(ultimos);
      setMetricas({ items: conItems, contactos: conContactos, citas: conCitas });
      setCargando(false);
    };

    cargarTodo();

    return () => {
      activo = false;
    };
  }, [businessId]);

  /* ---------- Persistencia local con autoguardado ---------- */
  const guardarRespuesta = useCallback((clave, valor) => {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* almacenamiento no disponible: continuar sin bloqueo */
    }
    setMostrarGuardado(true);
    clearTimeout(timerGuardar.current);
    timerGuardar.current = setTimeout(() => setMostrarGuardado(false), 1800);
  }, []);

  const onCambioTipoCliente = (valor) => {
    setTipoCliente(valor);
    guardarRespuesta(LS_KEYS.tipoCliente, valor);
  };
  const onCambioNecesidad = (valor) => {
    setNecesidadUrgente(valor);
    guardarRespuesta(LS_KEYS.necesidadUrgente, valor);
  };
  const onCambioDescripcion = (e) => {
    const valor = e.target.value;
    setDescripcionNegocio(valor);
    clearTimeout(timerGuardar.current);
    timerGuardar.current = setTimeout(() => guardarRespuesta(LS_KEYS.descripcionNegocio, valor), 800);
  };
  useEffect(() => () => clearTimeout(timerGuardar.current), []);

  /* ---------- Cálculo del Nivel de Visibilidad Digital (0-100) ---------- */
  const calcularNivelVisibilidad = () => {
    let puntos = 10;
    if (perfil?.business_name || perfil?.name) puntos += 15;
    if (perfil?.tagline || perfil?.description) puntos += 10;
    if (perfil?.logo_url) puntos += 15;
    if (perfil?.store_front_url || perfil?.fachada_url || perfil?.cover_url) puntos += 15;
    if (perfil?.whatsapp || perfil?.phone) puntos += 15;
    if (perfil?.city && perfil?.department) puntos += 10;
    if (perfil?.instagram || perfil?.facebook || perfil?.website) puntos += 5;
    if (metricas.items > 0) puntos += 15;
    if (tipoCliente) puntos += 5;
    if (necesidadUrgente) puntos += 5;
    if (descripcionNegocio.trim().length >= 5) puntos += 5;
    return Math.min(puntos, 100);
  };
  const nivelVisibilidad = calcularNivelVisibilidad();

  const nombreNegocio = perfil?.business_name || perfil?.name || 'Mi Negocio';

  const ir = (destino) => () => onNavegar(destino);

  return (
    <div className="pv-panel">
      <style>{`
        /* ===== Animaciones y dinamismo (bloque <style>) ===== */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.45); }
          50% { box-shadow: 0 0 18px 5px rgba(0, 245, 212, 0.35); }
        }
        @keyframes borderRotate {
          0% { --rot: 0deg; }
          100% { --rot: 360deg; }
        }
        .pv-rotating-border {
          --rot: 0deg;
          position: relative;
          border-radius: 22px;
          padding: 2px;
          background: conic-gradient(from var(--rot), #0066FF, #00F5D4, #059669, #0066FF);
          animation: borderRotate 6s linear infinite;
        }
        @keyframes shimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .pv-shimmer {
          position: absolute;
          top: 0; bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: shimmerBar 2.6s ease-in-out infinite;
        }

        /* Skeleton con pulso sutil */
        @keyframes pv-sk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes skMove {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .pv-sk {
          background: linear-gradient(90deg, #E8EDF4 25%, #F3F6FB 50%, #E8EDF4 75%);
          background-size: 200% 100%;
          animation: skMove 1.4s ease-in-out infinite, pv-sk-pulse 1.6s ease-in-out infinite;
        }

        /* Micro-interacciones Bento Cards */
        .pv-bento {
          background: #ffffff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #E8EDF4;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: left;
        }
        .pv-bento:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 18px 34px -12px rgba(11, 19, 43, 0.18), 0 0 0 1px rgba(0, 102, 255, 0.12), 0 8px 24px -8px rgba(0, 245, 212, 0.35);
        }
        .pv-bento::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          pointer-events: none;
          background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(0, 102, 255, 0.05), transparent 45%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .pv-bento:hover::after { opacity: 1; }

        .pv-arrow-link .pv-arrow {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
        }
        .pv-arrow-link:hover .pv-arrow,
        .pv-bento:hover .pv-arrow {
          transform: translateX(5px);
        }

        .pv-btn-primary {
          background: linear-gradient(120deg, #0B132B, #0066FF);
          color: #ffffff;
          border: none;
          padding: 14px 26px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          animation: glowPulse 2.6s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease;
        }
        .pv-btn-primary:hover { transform: translateY(-2px); filter: brightness(1.06); }
        .pv-btn-primary:active { transform: translateY(0); }

        .pv-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 100px;
        }

        /* Transición suave del badge "Guardado" */
        .pv-guardado {
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .pv-guardado-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Accesibilidad: desactivar animaciones complejas */
        @media (prefers-reduced-motion: reduce) {
          .pv-rotating-border, .pv-shimmer, .pv-sk, .pv-btn-primary,
          .pv-arrow, .pv-guardado, .pv-bento::after { animation: none !important; transition: none !important; }
          .pv-shimmer { display: none; }
          .pv-bento:hover { transform: none; }
        }
      `}</style>


      {/* ============================================================
          BARRA SUPERIOR FLOTANTE
      ============================================================ */}
      <header
        className="pv-navbar"
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 60,
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E8EDF4',
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={ir('menu')}>
          <IsotipoPonteVisible size={34} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              Ponte<span style={{ color: '#0066FF' }}>Visible</span>{' '}
              <span style={{ color: '#00F5D4', fontSize: '11px', backgroundColor: '#0B132B', padding: '1px 6px', borderRadius: '5px' }}>Pro</span>
            </span>
            <span style={{ fontSize: '8.5px', color: '#64748B', fontWeight: '700', letterSpacing: '0.05em' }}>Hazte visible. Conecta. Crece.</span>
          </div>
        </div>

        <nav aria-label="Navegación principal del panel" style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          {[
            ['hero', 'Inicio'],
            ['diagnostico', 'Autodiagnóstico'],
            ['pilares', 'Herramientas'],
            ['resultados', 'Resultados'],
            ['apoyo', 'Soporte'],
          ].map(([ancla, texto]) => (
            <a key={ancla} href={`#${ancla}`} style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>
              {texto}
            </a>
          ))}
        </nav>

        <button type="button" className="pv-btn-primary" onClick={ir('vitrina')} style={{ padding: '11px 20px', fontSize: '13.5px' }}>
          Ver Mi Vitrina Pública →
        </button>
      </header>

      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 90px 20px' }}>
        {/* ============================================================
            BLOQUE 1 · HERO COMERCIAL
        ============================================================ */}
        <section id="hero" aria-labelledby="hero-titulo" style={{ marginBottom: '36px' }}>
          <div className="pv-rotating-border" style={{ maxWidth: '1200px' }}>
            <div style={{ background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 55%, #064E3B 100%)', borderRadius: '20px', padding: '34px 32px', color: '#fff' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>
                    <span aria-hidden="true">👋</span> Hola, comerciante
                  </div>
                  <h1 id="hero-titulo" style={{ fontSize: 'clamp(30px, 4.5vw, 46px)', fontWeight: '900', color: '#fff', margin: '14px 0 8px 0', letterSpacing: '-0.5px' }}>
                    {cargando ? 'Cargando tu negocio…' : nombreNegocio}
                  </h1>
                  <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.82)', margin: '0 0 20px 0', maxWidth: '520px', lineHeight: 1.6 }}>
                    Hoy es un gran día para hacerte visible. Aquí tienes tu tablero para conectar, crecer y vender con confianza.
                  </p>
                  <button type="button" className="pv-btn-primary" onClick={ir('vitrina')}>
                    Abrir mi vitrina pública →
                  </button>
                </div>

                {/* Nivel de Visibilidad Digital */}
                <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>Nivel de Visibilidad Digital</span>
                      <span
                        style={{ fontSize: '28px', fontWeight: '900', color: '#00F5D4', lineHeight: 1 }}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {cargando ? '—' : `${nivelVisibilidad}%`}
                      </span>
                    </div>

                    {/* Barra de progreso con shimmer */}
                    <div
                      role="meter"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={cargando ? 0 : nivelVisibilidad}
                      aria-valuetext={`${cargando ? 0 : nivelVisibilidad} por ciento de visibilidad digital`}
                      style={{ position: 'relative', height: '14px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', marginBottom: '14px' }}
                    >
                      <div style={{ position: 'absolute', inset: 0, width: cargando ? 0 : `${nivelVisibilidad}%`, background: 'linear-gradient(90deg, #0066FF, #00F5D4, #059669)', borderRadius: '100px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}>
                        <div className="pv-shimmer" />
                      </div>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
                      {cargando
                        ? 'Calculando tu nivel…'
                        : nivelVisibilidad >= 80
                          ? '¡Excelente! Tu negocio está muy visible en la red.'
                          : nivelVisibilidad >= 50
                            ? 'Vas bien. Completa tus datos para brillar más.'
                            : 'Completa los pasos del diagnóstico para subir tu visibilidad.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            BLOQUE 2 · PASO A PASO Y DIAGNÓSTICO CONVERSACIONAL
        ============================================================ */}
        <section id="diagnostico" aria-labelledby="diag-titulo" style={{ marginBottom: '40px' }}>
          <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #E8EDF4', padding: '28px 26px', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h2 id="diag-titulo" style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A' }}>Cuéntanos de tu negocio en 3 pasos</h2>
              <span
                className={`pv-guardado ${mostrarGuardado ? 'pv-guardado-visible' : ''}`}
                role="status"
                aria-live="polite"
                style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '6px 12px' }}
              >
                <span className="pv-pill" style={{ color: '#047857' }}>Guardado ✓</span>
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 22px 0' }}>
              Tus respuestas se guardan automáticamente en este dispositivo. Puedes volver cuando quieras.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '22px' }}>

              {/* Paso 1: tipo de cliente */}
              <div>
                <fieldset id="tipo-cliente" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '10px', padding: 0 }}>
                    1. ¿Quiénes son tus clientes habituales?
                  </legend>
                  {[
                    { valor: 'particulares', texto: 'Particulares' },
                    { valor: 'empresas', texto: 'Empresas' },
                    { valor: 'ambos', texto: 'Ambos' },
                  ].map((op) => (
                    <label
                      key={op.valor}
                      role="radio"
                      aria-checked={tipoCliente === op.valor}
                      tabIndex="0"
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onCambioTipoCliente(op.valor); } }}
                      onClick={() => onCambioTipoCliente(op.valor)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid ${tipoCliente === op.valor ? '#0066FF' : '#E2E8F0'}`,
                        borderRadius: '12px',
                        backgroundColor: tipoCliente === op.valor ? '#EFF6FF' : '#ffffff',
                        color: tipoCliente === op.valor ? '#0066FF' : '#334155',
                        fontWeight: '800',
                        fontSize: '14px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {tipoCliente === op.valor && <span aria-hidden="true">● </span>}
                      {op.texto}
                    </label>
                  ))}
                </fieldset>
              </div>

              {/* Paso 2: necesidad urgente */}
              <div>
                <fieldset id="necesidad-urgente" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '10px', padding: 0 }}>
                    2. ¿Qué necesitas resolver primero?
                  </legend>
                  {[
                    { valor: 'whatsapp', texto: '💬 Recibir más mensajes de WhatsApp' },
                    { valor: 'cotizar', texto: '⏱️ Ahorrar tiempo respondiendo cotizaciones' },
                  ].map((op) => (
                    <label
                      key={op.valor}
                      role="radio"
                      aria-checked={necesidadUrgente === op.valor}
                      tabIndex="0"
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onCambioNecesidad(op.valor); } }}
                      onClick={() => onCambioNecesidad(op.valor)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid ${necesidadUrgente === op.valor ? '#0066FF' : '#E2E8F0'}`,
                        borderRadius: '12px',
                        backgroundColor: necesidadUrgente === op.valor ? '#EFF6FF' : '#ffffff',
                        color: necesidadUrgente === op.valor ? '#0066FF' : '#334155',
                        fontWeight: '800',
                        fontSize: '14px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {necesidadUrgente === op.valor && <span aria-hidden="true">● </span>}
                      {op.texto}
                    </label>
                  ))}
                </fieldset>
              </div>

              {/* Paso 3: descripción libre */}
              <div>
                <label htmlFor="descripcion-negocio" style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
                  3. Describe tu negocio con tus palabras
                </label>
                <textarea
                  id="descripcion-negocio"
                  value={descripcionNegocio}
                  onChange={onCambioDescripcion}
                  rows={4}
                  placeholder="Ej: Vendo repuestos para motos en Bogotá y hago envíos al día…"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: '#0F172A',
                    resize: 'vertical',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="pv-btn-primary" onClick={ir('catalogo')}>
                Subir lo que tengo para vender →
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================
            BLOQUE 3 · PILARES COMERCIALES
        ============================================================ */}
        <section id="pilares" aria-labelledby="pilares-titulo" style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pilares comerciales</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

            <article
              className="pv-bento"
              onClick={ir('negocio')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('negocio'); } }}
              aria-label="Abrir Identidad y Multisede"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Identidad />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Identidad y Multisede</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Define quién eres, tu marca y todos tus puntos de venta.</p>
              <EnlaceAccion destino="negocio" etiqueta="Configurar identidad" color="#0066FF" onNavegar={onNavegar} />
            </article>

            <article
              className="pv-bento"
              onClick={ir('sedes')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('sedes'); } }}
              aria-label="Abrir Sedes y Canales"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Sedes />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Sedes y Canales</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Administra horarios, direcciones y canales de contacto.</p>
              <EnlaceAccion destino="sedes" etiqueta="Gestionar sedes" color="#0066FF" onNavegar={onNavegar} />
            </article>

            <article
              className="pv-bento"
              onClick={ir('catalogo')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('catalogo'); } }}
              aria-label="Abrir Catálogo y Ofertas"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Catalogo />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Catálogo y Ofertas</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>
                Publica productos y servicios atractivos.{' '}
                {cargando ? '' : <strong style={{ color: '#0F172A' }}>({metricas.items} activos)</strong>}
              </p>
              <EnlaceAccion destino="catalogo" etiqueta="Ver catálogo" color="#D97706" onNavegar={onNavegar} />
            </article>

            <article
              className="pv-bento"
              onClick={ir('inventario')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('inventario'); } }}
              aria-label="Abrir el control de Stock Visible"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Stock />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Stock Visible</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Muestra tu inventario real y evita sorpresas con tus clientes.</p>
              <EnlaceAccion destino="inventario" etiqueta="Gestionar stock" color="#0066FF" onNavegar={onNavegar} />
            </article>

          </div>
        </section>

        {/* ============================================================
            BLOQUE 4 · MOTOR DE RESULTADOS
        ============================================================ */}
        <section id="resultados" aria-labelledby="resultados-titulo" style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motor de resultados</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            <article
              className="pv-bento"
              onClick={ir('resultados')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('resultados'); } }}
              aria-label="Abrir Clientes e Interesados"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Resultados />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Clientes e Interesados</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 12px 0', flexGrow: 1 }}>
                Oportunidades Comerciales Generadas desde tu vitrina.
              </p>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0066FF', marginBottom: '12px' }} aria-live="polite" aria-atomic="true">
                {cargando ? <Skeleton altura={22} /> : <span>{metricas.contactos} contactos OCG</span>}
              </div>
              <EnlaceAccion destino="resultados" etiqueta="Ver interesados" color="#0066FF" onNavegar={onNavegar} />
            </article>

            <article
              className="pv-bento"
              onClick={ir('citas')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('citas'); } }}
              aria-label="Abrir la Agenda de Citas"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Citas />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Agenda de Citas</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 12px 0', flexGrow: 1 }}>
                Organiza reservas y confirmaciones con tus clientes.
              </p>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#B45309', marginBottom: '12px' }} aria-live="polite" aria-atomic="true">
                {cargando ? <Skeleton altura={22} /> : <span>{metricas.citas} citas reservadas</span>}
              </div>
              <EnlaceAccion destino="citas" etiqueta="Abrir agenda" color="#D97706" onNavegar={onNavegar} />
            </article>

          </div>
        </section>

        {/* ============================================================
            BLOQUE 5 · INTELIGENCIA Y SOPORTE
        ============================================================ */}
        <section id="apoyo" aria-labelledby="apoyo-titulo" style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inteligencia y soporte</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            <article
              className="pv-bento"
              onClick={ir('asistente')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('asistente'); } }}
              aria-label="Abrir el Asistente de Crecimiento IA"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.IA />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Asistente de Crecimiento IA</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Diagnóstico inteligente para optimizar títulos y posicionar tu oferta.</p>
              <EnlaceAccion destino="asistente" etiqueta="Consultar IA" color="#059669" onNavegar={onNavegar} />
            </article>

            <article
              className="pv-bento"
              onClick={ir('discovery')}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('discovery'); } }}
              aria-label="Abrir Explorar Negocios"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icn.Discovery />
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Explorar Negocios</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Descubre productos de proveedores locales verificados y contacta directo.</p>
              <EnlaceAccion destino="discovery" etiqueta="Ir a Explorar" color="#0066FF" onNavegar={onNavegar} />
            </article>

          </div>
        </section>

        {/* ============================================================
            VISTA PREVIA DE ÚLTIMOS PRODUCTOS (si existen)
        ============================================================ */}
        {!cargando && productos.length > 0 && (
          <section aria-labelledby="recientes-titulo" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 id="recientes-titulo" style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>Lo que acabas de subir</h2>
              <EnlaceAccion destino="catalogo" etiqueta="Ver todo el catálogo" color="#0066FF" onNavegar={onNavegar} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
              {productos.map((p) => {
                const titulo = p.title || p.name || 'Producto / Servicio';
                const precio = p.price ?? p.valor_de_venta;
                const imgOk = p.image_url && !p.image_url.startsWith('data:') && p.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto';
                return (
                  <article
                    key={p.id}
                    className="pv-bento"
                    onClick={ir('catalogo')}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavegar('catalogo'); } }}
                    aria-label={`Ver ${titulo} en el catálogo`}
                    style={{ padding: '10px' }}
                  >
                    <div style={{ height: '130px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: '10px' }}>
                      {imgOk ? (
                        <img
                          src={p.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }} aria-hidden="true">🛒</div>
                      )}
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' }}>{titulo}</h3>
                    {typeof precio === 'number' && (
                      <p style={{ fontSize: '14px', fontWeight: '900', color: '#059669', margin: 0 }}>
                        ${precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

