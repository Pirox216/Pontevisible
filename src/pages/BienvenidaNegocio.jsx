import React, { useState } from 'react';
import { supabase } from '../config/supabase';

// ============================================================
// BIENVENIDA / ONBOARDING CONSULTIVO NEGOCIO
// Flujo de Diagnóstico Estratégico en 4 pasos.
// Basado en 5 Dimensiones: Económica, Visibilidad, Operativa,
// Relación y Crecimiento. Incluye efecto espejo y activación
// real en business_profiles (columna description).
// ============================================================

// Clave de persistencia del diagnóstico (localStorage)
const LS_DIAGNOSTICO = 'pv_diagnostico_onboarding';

export default function BienvenidaNegocio({ businessId, onFinalizar = () => {} }) {
  // ---------- Progreso ----------
  const [etapa, setEtapa] = useState(1);

  // ---------- Etapa 1 · Reconocimiento ----------
  const [equipo, setEquipo] = useState('');
  const [ciudad, setCiudad] = useState('');

  // ---------- Etapa 2 · Exploración de Dolores ----------
  const [descubrimiento, setDescubrimiento] = useState('');
  const [tomaTiempo, setTomaTiempo] = useState('');
  const [metaPrincipal, setMetaPrincipal] = useState('');

  // ---------- Etapa 4 · Cierre ----------
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorMsj, setErrorMsj] = useState('');
  // ---------- Navegación entre etapas ----------
  const puedeAvanzarEtapa1 = equipo !== '' && ciudad.trim().length >= 2;
  const puedeAvanzarEtapa2 = descubrimiento !== '' && tomaTiempo !== '' && metaPrincipal !== '';

  // ---------- Efecto Espejo: lectura del dolor y la meta ----------
  const mapaDescubrimiento = {
    recomendacion: 'te llegan clientes por recomendación y boca a boca',
    calle: 'tu local queda a la vista en la calle',
    redes: 'tus clientes te encuentran por redes y WhatsApp',
  };
  const mapaTomaTiempo = {
    fotos: 'gastas tiempo enviando fotos y precios uno por uno',
    repetir: 'pierdes tiempo explicando lo mismo a cada persona',
    compradores: 'te cuesta conseguir compradores reales interesados',
  };
  const mapaMeta = {
    whatsapp: 'llegar a más clientes directos por WhatsApp',
    catalogo: 'tener tu catálogo organizado en un solo enlace',
    posicionar: 'posicionar tu negocio en los mapas locales',
  };

  const rutaSolucion = (() => {
    if (!tomaTiempo || !metaPrincipal) return null;
    const rutaPorDolor = {
      fotos: 'Sube tu catálogo y ofrece precios en un solo enlace de tu vitrina.',
      repetir: 'Centraliza tu información en una vitrina oficial para explicarlo una sola vez.',
      compradores: 'Activa tu vitrina y sistema de interesados para llegar a más compradores.',
    };
    return rutaPorDolor[tomaTiempo] || rutaPorDolor.fotos;
  })();

  // Veremos juntos las 5 dimensiones: económica, visibilidad,
  // operativa, relación y crecimiento, para subir tu Salud Digital.
  const dimensiones = ['Económica', 'Visibilidad', 'Operativa', 'Relación', 'Crecimiento'];

  // ---------- Activación real del plan ----------
  const activarPlan = async () => {
    setErrorMsj('');
    if (descripcion.trim().length < 3) {
      setErrorMsj('Escribe una breve descripción de lo que vendes para continuar.');
      return;
    }

    // Guardar diagnóstico en localStorage
    try {
      localStorage.setItem(LS_DIAGNOSTICO, JSON.stringify({
        equipo,
        ciudad,
        descubrimiento,
        tomaTiempo,
        metaPrincipal,
        descripcion,
        saludDigital: 40,
        fecha: new Date().toISOString(),
      }));
    } catch {
      /* almacenamiento no disponible: continuar sin bloqueo */
    }

    setGuardando(true);
    try {
      const usuarioId = businessId || (await supabase.auth.getUser())?.data?.user?.id;
      if (usuarioId) {
        await supabase
          .from('business_profiles')
          .update({ description: descripcion.trim() })
          .eq('user_id', usuarioId);
      }
      onFinalizar();
    } catch (err) {
      setErrorMsj('No pudimos activar tu plan en este momento. Revisa tu conexión e intenta de nuevo.');
      console.warn('[BienvenidaNegocio] Error al activar:', err?.message);
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // RENDERIZADO
  // ============================================================
  const estiloBaseOpcion = (activa) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '15px 16px',
    border: `2px solid ${activa ? '#0066FF' : '#E2E8F0'}`,
    borderRadius: '14px',
    backgroundColor: activa ? '#EFF6FF' : '#ffffff',
    color: activa ? '#0066FF' : '#334155',
    fontWeight: 800,
    fontSize: '14.5px',
    marginBottom: '10px',
    cursor: 'pointer',
    fontFamily: "'Sora', sans-serif",
    transition: 'all 0.2s ease',
  });

  const textoRefuerzo = (meta) => ({
    whatsapp: 'Con tu vitrina y botones de contacto, más personas te escribirán directo.',
    catalogo: 'Sube tus productos una vez y comparte un solo enlace organizado.',
    posicionar: 'Tu negocio aparecerá mejor ubicado en los mapas y búsquedas locales.',
  }[meta] || '');

  return (
    <div className="bienvenida-onboarding" style={{ maxWidth: '860px', margin: '0 auto', padding: '36px 20px 80px', minHeight: '80vh' }}>
      <style>{`
        @keyframes bienvenidaFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bienvenidaPulso {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.45); }
          50% { box-shadow: 0 0 18px 5px rgba(0, 245, 212, 0.35); }
        }
        .bw-card {
          background: #ffffff;
          border: 1px solid #E8EDF4;
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          animation: bienvenidaFade 0.35s ease;
        }
        .bw-titulo { font-size: 24px; font-weight: 900; color: #0F172A; margin: 0 0 6px 0; letter-spacing: -0.4px; }
        .bw-subtitulo { font-size: 15px; color: #64748B; margin: 0 0 22px 0; line-height: 1.6; }
        .bw-paso { font-size: 11px; font-weight: 800; color: #0066FF; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px 0; }
        .bw-pregunta { font-size: 17px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0; }
        .bw-opcion { cursor: pointer; }
        .bw-siguiente {
          background: linear-gradient(120deg, #0B132B, #0066FF);
          color: #fff; border: none; padding: 14px 26px; border-radius: 14px;
          font-weight: 800; font-size: 15px; cursor: pointer;
          font-family: inherit; animation: bienvenidaPulso 2.6s ease-in-out infinite;
        }
        .bw-siguiente:disabled { opacity: 0.45; cursor: not-allowed; animation: none; }
        .bw-atras { background: none; border: 1px solid #E2E8F0; color: #0F172A; padding: 11px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; }
        .bw-progreso-fondo { height: 8px; border-radius: 100px; background: #E8EDF4; overflow: hidden; margin-bottom: 24px; }
        .bw-progreso-valor { height: 100%; background: linear-gradient(90deg, #0066FF, #00F5D4); border-radius: 100px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
        @media (prefers-reduced-motion: reduce) {
          .bw-card, .bw-siguiente { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Progreso del onboarding */}
      <div className="bw-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Asistente de Inicio</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>Diagnóstico estratégico de tu negocio</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0066FF' }}>Etapa {etapa} de 4</div>
        </div>
        <div className="bw-progreso-fondo" style={{ marginTop: '14px' }} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={etapa * 25}>
          <div className="bw-progreso-valor" style={{ width: `${etapa * 25}%` }} />
        </div>
      </div>

      {etapa === 1 && (
        <div className="bw-card">
          <p className="bw-paso">Paso 1 de 4 · Reconocimiento</p>
          <h2 className="bw-titulo">Cuéntanos sobre tu negocio</h2>
          <p className="bw-subtitulo">Estos datos nos ayudan a preparar un plan a tu medida.</p>

          <p className="bw-pregunta">¿Cuántas personas integran tu equipo de trabajo?</p>
          {[
            { valor: 'solo', texto: '👤 Solo yo' },
            { valor: 'grupo2_5', texto: '👥 2 a 5' },
            { valor: 'grupo6_20', texto: '🏢 6 a 20' },
            { valor: 'mas20', texto: '🏬 Más de 20' },
          ].map((op) => (
            <button
              type="button"
              key={op.valor}
              onClick={() => setEquipo(op.valor)}
              role="radio"
              aria-checked={equipo === op.valor}
              style={estiloBaseOpcion(equipo === op.valor)}
            >
              {equipo === op.valor && <span aria-hidden="true">● </span>}
              {op.texto}
            </button>
          ))}

          <p className="bw-pregunta" style={{ marginTop: '20px' }}>¿En qué ciudad o municipio atiendes principalmente?</p>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej: Bogotá"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontFamily: 'inherit', color: '#0F172A' }}
          />

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="bw-siguiente" disabled={!puedeAvanzarEtapa1} onClick={() => setEtapa(2)}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {etapa === 2 && (
        <div className="bw-card">
          <p className="bw-paso">Paso 2 de 4 · Exploración</p>
          <h2 className="bw-titulo">Conozcamos tus retos diarios</h2>
          <p className="bw-subtitulo">No hay respuestas equivocadas. Queremos entender tu realidad para ayudarte mejor.</p>

          <p className="bw-pregunta">¿Cómo te encuentran tus clientes habitualmente?</p>
          {[
            { valor: 'recomendacion', texto: 'Recomendación / boca a boca' },
            { valor: 'calle', texto: 'Local a la calle' },
            { valor: 'redes', texto: 'Redes / WhatsApp' },
          ].map((op) => (
            <button
              type="button"
              key={op.valor}
              onClick={() => setDescubrimiento(op.valor)}
              role="radio"
              aria-checked={descubrimiento === op.valor}
              style={estiloBaseOpcion(descubrimiento === op.valor)}
            >
              {descubrimiento === op.valor && <span aria-hidden="true">● </span>}
              {op.texto}
            </button>
          ))}

          <p className="bw-pregunta" style={{ marginTop: '20px' }}>¿Qué es lo que más te quita tiempo en el día a día?</p>
          {[
            { valor: 'fotos', texto: 'Enviar fotos y precios uno por uno' },
            { valor: 'repetir', texto: 'Explicar siempre lo mismo' },
            { valor: 'compradores', texto: 'Conseguir compradores reales' },
          ].map((op) => (
            <button
              type="button"
              key={op.valor}
              onClick={() => setTomaTiempo(op.valor)}
              role="radio"
              aria-checked={tomaTiempo === op.valor}
              style={estiloBaseOpcion(tomaTiempo === op.valor)}
            >
              {tomaTiempo === op.valor && <span aria-hidden="true">● </span>}
              {op.texto}
            </button>
          ))}

          <p className="bw-pregunta" style={{ marginTop: '20px' }}>¿Cuál es tu meta principal para los próximos 3 meses?</p>
          {[
            { valor: 'whatsapp', texto: 'Más clientes directos a WhatsApp' },
            { valor: 'catalogo', texto: 'Catálogo organizado en un enlace' },
            { valor: 'posicionar', texto: 'Posicionamiento local en mapas' },
          ].map((op) => (
            <button
              type="button"
              key={op.valor}
              onClick={() => setMetaPrincipal(op.valor)}
              role="radio"
              aria-checked={metaPrincipal === op.valor}
              style={estiloBaseOpcion(metaPrincipal === op.valor)}
            >
              {metaPrincipal === op.valor && <span aria-hidden="true">● </span>}
              {op.texto}
            </button>
          ))}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="bw-atras" onClick={() => setEtapa(1)}>← Atrás</button>
            <button type="button" className="bw-siguiente" disabled={!puedeAvanzarEtapa2} onClick={() => setEtapa(3)}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="bw-card">
          <p className="bw-paso">Paso 3 de 4 · Tu diagnóstico</p>
          <h2 className="bw-titulo">Esto es lo que vemos en tu negocio</h2>

          <div style={{ backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#065F46', margin: 0 }}>
              Hoy <strong>{mapaDescubrimiento[descubrimiento] || 'tus clientes llegan por recomendación'}</strong>,
              y {mapaTomaTiempo[tomaTiempo] || 'quieres ganar más tiempo en tu día a día'}.
              Tu objetivo para los próximos 3 meses es <strong>{mapaMeta[metaPrincipal] || 'hacer crecer tu negocio'}</strong>.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#047857', margin: '14px 0 0 0' }}>
              {textoRefuerzo(metaPrincipal)}
            </p>
          </div>

          <p style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Nuestra ruta para ti</p>
          <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.7, margin: '0 0 22px 0' }}>
            {rutaSolucion}
          </p>

          {/* Mapa de las 5 Dimensiones */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', marginBottom: '10px' }}>
              Las 5 dimensiones que trabajaremos juntos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {dimensiones.map((dim) => (
                <div key={dim} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E8EDF4', borderRadius: '12px', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                  {dim}
                </div>
              ))}
            </div>
          </div>

          {/* Salud Digital inicial */}
          <div style={{ backgroundColor: '#0B132B', borderRadius: '16px', padding: '18px 20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Salud Digital inicial</span>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#00F5D4' }}>40%</span>
            </div>
            <div role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40 por ciento de salud digital inicial" style={{ height: '12px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, #0066FF, #00F5D4)', borderRadius: '100px' }} />
            </div>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.72)', margin: '10px 0 0 0' }}>
              Es nuestro punto de partida: con tu activación empezaremos a mejorar estas dimensiones.
            </p>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="bw-atras" onClick={() => setEtapa(2)}>← Atrás</button>
            <button type="button" className="bw-siguiente" onClick={() => setEtapa(4)}>
              Contar con mi plan →
            </button>
          </div>
        </div>
      )}

      {etapa === 4 && (
        <div className="bw-card">
          <p className="bw-paso">Paso 4 de 4 · Activa tu plan</p>
          <h2 className="bw-titulo">¡Listo para empezar!</h2>
          <p className="bw-subtitulo">
            Cuéntanos en tus propias palabras qué vendes o cuál es tu especialidad. Lo guardaremos en tu perfil comercial.
          </p>

          <p className="bw-pregunta">Describe brevemente qué vendes o cuál es tu especialidad</p>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Ej: Vendo repuestos y accesorios para motos, con envíos a todo el país…"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontFamily: 'inherit', color: '#0F172A', resize: 'vertical' }}
          />

          {errorMsj && (
            <p role="alert" style={{ margin: '14px 0 0 0', padding: '12px', borderRadius: '12px', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', color: '#9B2C2C', fontSize: '14px', fontWeight: 600 }}>
              {errorMsj}
            </p>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="bw-atras" disabled={guardando} onClick={() => setEtapa(3)}>← Atrás</button>
            <button type="button" className="bw-siguiente" disabled={guardando} onClick={activarPlan}>
              {guardando ? 'Activando tu plan…' : '🚀 Activar mi Plan y Entrar a mi Panel Comercial →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

