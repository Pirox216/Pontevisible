// src/components/AsistenteCrecimiento/AsistenteCrecimiento.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function AsistenteCrecimiento({ businessId, onVolverMenu }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [analisis, setAnalisis] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [realBusinessId, setRealBusinessId] = useState(businessId || null);

  // ============================================
  // FUNCIONES PRINCIPALES
  // ============================================
  const cargarUltimoAnalisis = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener el negocio
      let query = supabase.from('negocios').select('id');
      if (businessId) {
        query = query.eq('id', businessId);
      } else {
        query = query.eq('user_id', user.id);
      }
      const { data: perfil } = await query.maybeSingle();

      if (!perfil) {
        setLoading(false);
        return;
      }
      setRealBusinessId(perfil.id);

      // Obtener la última auditoría
      const { data: auditoria, error } = await supabase
        .from('auditorias')
        .select('*')
        .eq('negocio_id', perfil.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar auditoría:', error);
      }

      if (auditoria) {
        // Procesar recomendaciones (manteniendo la lógica original)
        let recomendacionesFinales = [];

        if (typeof auditoria.recomendaciones === 'string') {
          const lineas = auditoria.recomendaciones.split('\n').filter(l => l.trim().length > 0);
          recomendacionesFinales = lineas.map(line =>
            line.replace(/^[\*\-\s]+/, '').trim()
          );
        } else if (Array.isArray(auditoria.recomendaciones)) {
          recomendacionesFinales = auditoria.recomendaciones;
        } else if (typeof auditoria.recomendaciones === 'object') {
          recomendacionesFinales = Object.values(auditoria.recomendaciones);
        }

        // Calcular score (manteniendo la lógica original)
        let score = 40;
        if (auditoria.nuevo_eslogan && auditoria.nuevo_eslogan.length > 5) score += 15;
        if (auditoria.nueva_descripcion && auditoria.nueva_descripcion.length > 30) score += 15;
        if (recomendacionesFinales.length >= 3) score += 15;
        if (auditoria.titulo_seo && auditoria.titulo_seo.length > 5) score += 15;
        if (auditoria.palabras_clave && auditoria.palabras_clave.length >= 3) score += 10;

        setAnalisis({
          score: Math.min(score, 100),
          recomendaciones: recomendacionesFinales,
          cambios_sugeridos: {
            tagline: auditoria.nuevo_eslogan || '',
            description: auditoria.nueva_descripcion || '',
            texto_aprobacion: auditoria.texto_aprobacion || '',
            titulo_seo: auditoria.titulo_seo || '',
            descripcion_seo: auditoria.descripcion_seo || '',
            palabras_clave: auditoria.palabras_clave || []
          }
        });
      } else {
        setAnalisis(null);
      }
    } catch (error) {
      console.error('Error al cargar análisis:', error);
      setMessage({ text: '❌ Error al cargar el análisis: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const aplicarCambios = async () => {
    if (!realBusinessId) return;
    setAplicando(true);
    setMessage({ text: '', type: '' });

    try {
      const { error: updateError } = await supabase
        .from('negocios')
        .update({
          tagline: analisis.cambios_sugeridos.tagline || undefined,
          description: analisis.cambios_sugeridos.description || undefined
        })
        .eq('id', realBusinessId);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('auditorias')
        .delete()
        .eq('negocio_id', realBusinessId);

      if (deleteError) throw deleteError;

      setMessage({ text: '✅ ¡Cambios aplicados y sugerencias eliminadas con éxito!', type: 'success' });

      setTimeout(() => cargarUltimoAnalisis(), 1000);
    } catch (error) {
      setMessage({ text: '❌ Error al aplicar cambios: ' + error.message, type: 'error' });
    } finally {
      setAplicando(false);
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const scoreColor = useMemo(() => {
    if (!analisis) return '#64748B';
    return analisis.score >= 70 ? '#16A34A' : '#D97706';
  }, [analisis]);

  const scoreMessage = useMemo(() => {
    if (!analisis) return '';
    return analisis.score >= 70
      ? '✅ Tu negocio está bien optimizado'
      : '⚠️ Hay oportunidades de mejora';
  }, [analisis]);

  const recomendacionesLista = useMemo(() => {
    if (!analisis) return [];
    return analisis.recomendaciones.slice(0, 5);
  }, [analisis]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarUltimoAnalisis();
  }, [businessId]);

  // ============================================
  // RENDERIZADO
  // ============================================
  if (loading) {
    return (
      <div className="asistente-container">
        <style jsx>{`
          .asistente-container {
            max-width: 1000px;
            margin: 30px auto;
            padding: 0 20px;
            font-family: 'Sora', system-ui, -apple-system, sans-serif;
            color: #1e293b;
          }

          .loading-state {
            text-align: center;
            padding: 80px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #FFFFFF;
            border-radius: 20px;
            min-height: 300px;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #E2E8F0;
            border-top: 4px solid #0066FF;
            border-radius: 50%;
            animation: spin 0.9s linear infinite;
          }

          .loading-text {
            font-size: 15px;
            font-weight: 700;
            color: #0F172A;
          }

          .loading-subtext {
            font-size: 13px;
            color: #94A3B8;
            font-weight: 500;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">🧠 Cargando diagnóstico de inteligencia artificial...</p>
          <p className="loading-subtext">Analizando las oportunidades de crecimiento para tu negocio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="asistente-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE ASISTENTE CRECIMIENTO
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .asistente-container {
          max-width: 1000px;
          margin: 30px auto;
          padding: 0 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background: #F8FAFC;
          min-height: 80vh;
        }

        /* ----- CABECERA ----- */
        .asistente-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 12px;
          background: #FFFFFF;
          padding: 16px 24px;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          border: 1px solid #F1F5F9;
        }

        .btn-volver {
          padding: 10px 18px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          color: #0F172A;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-volver:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          border-color: #CBD5E1;
        }

        .btn-volver:active {
          transform: translateY(0);
        }

        .asistente-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0F172A;
        }

        .asistente-title-icon {
          font-size: 26px;
        }

        /* ----- MENSAJE ----- */
        .asistente-message {
          padding: 12px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-weight: 700;
          font-size: 14px;
          animation: slideDown 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .asistente-message--success {
          background: #DCFCE7;
          color: #166534;
          border: 1px solid #BBF7D0;
        }

        .asistente-message--error {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECDD3;
        }

        .asistente-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .asistente-message-close:hover {
          opacity: 1;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ----- ESTADO SIN ANÁLISIS ----- */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 2px dashed #E2E8F0;
          transition: border-color 0.3s ease;
        }

        .empty-state:hover {
          border-color: #CBD5E1;
        }

        .empty-icon {
          font-size: 56px;
          display: block;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 900;
          margin: 0 0 8px 0;
          color: #0F172A;
        }

        .empty-description {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* ----- GRID DE CONTENIDO ----- */
        .asistente-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        /* ----- TARJETA DE SCORE ----- */
        .score-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 30px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .score-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0066FF, #00D4FF);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .score-card:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          transform: translateY(-3px);
          border-color: #CBD5E1;
        }

        .score-card:hover::before {
          opacity: 1;
        }

        .score-label {
          font-size: 14px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .score-number {
          font-size: 64px;
          font-weight: 900;
          line-height: 1.1;
          margin: 8px 0;
        }

        .score-message {
          font-size: 14px;
          color: #334155;
          margin-top: 8px;
        }

        /* ----- TARJETA DE RECOMENDACIONES ----- */
        .recomendaciones-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 30px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .recomendaciones-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #8B5CF6, #EC4899);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .recomendaciones-card:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          transform: translateY(-3px);
          border-color: #CBD5E1;
        }

        .recomendaciones-card:hover::before {
          opacity: 1;
        }

        .recomendaciones-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .recomendaciones-list {
          flex: 1;
          font-size: 15px;
          line-height: 1.8;
          color: #334155;
          text-align: justify;
        }

        .recomendacion-item {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .recomendacion-item:hover {
          background: #F8FAFC;
        }

        .recomendacion-bullet {
          color: #2563EB;
          font-weight: 800;
          flex-shrink: 0;
          font-size: 18px;
        }

        .recomendacion-text {
          flex: 1;
        }

        .recomendaciones-footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #F1F5F9;
        }

        .btn-aplicar {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-aplicar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
        }

        .btn-aplicar:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-aplicar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-aplicar .spinner-small {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }

        .btn-aplicar-text {
          font-size: 11px;
          color: #94A3B8;
          text-align: center;
          margin-top: 8px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */

        @media (max-width: 768px) {
          .asistente-container {
            margin: 16px auto;
            padding: 0 12px;
          }

          .asistente-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 16px;
          }

          .asistente-title {
            font-size: 18px;
            justify-content: center;
          }

          .btn-volver {
            text-align: center;
            justify-content: center;
            width: 100%;
          }

          .asistente-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .score-number {
            font-size: 48px;
          }

          .score-card,
          .recomendaciones-card {
            padding: 24px 20px;
          }

          .recomendacion-item {
            padding: 4px 8px;
          }
        }

        @media (max-width: 480px) {
          .asistente-container {
            margin: 12px auto;
            padding: 0 8px;
          }

          .asistente-header {
            padding: 12px;
            border-radius: 16px;
          }

          .asistente-title {
            font-size: 16px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .btn-volver {
            font-size: 12px;
            padding: 8px 14px;
          }

          .score-number {
            font-size: 40px;
          }

          .score-card,
          .recomendaciones-card {
            padding: 20px 16px;
            border-radius: 16px;
          }

          .recomendaciones-title {
            font-size: 14px;
          }

          .recomendacion-item {
            font-size: 14px;
            padding: 4px 6px;
          }

          .btn-aplicar {
            font-size: 13px;
            padding: 10px;
          }
        }
      `}</style>

      {/* ============================================
          CABECERA
          ============================================ */}
      <header className="asistente-header">
        <button
          type="button"
          onClick={() => {
            if (typeof onVolverMenu === 'function') onVolverMenu();
          }}
          className="btn-volver"
        >
          <span>🏠</span>
          Volver al Menú Principal
        </button>

        <h1 className="asistente-title">
          <span className="asistente-title-icon">🧠</span>
          Asistente de Crecimiento
        </h1>

        {/* Espacio vacío para mantener el diseño simétrico */}
        <div style={{ width: '140px' }} />
      </header>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {message.text && (
        <div
          className={`asistente-message asistente-message--${message.type}`}
          role="alert"
        >
          <span>{message.text}</span>
          <button
            className="asistente-message-close"
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      {!analisis ? (
        <div className="empty-state">
          <span className="empty-icon">🎉</span>
          <h3 className="empty-title">¡Tu negocio está optimizado!</h3>
          <p className="empty-description">
            No hay sugerencias pendientes. ¡Sigue así!
          </p>
        </div>
      ) : (
        <div className="asistente-grid">
          {/* ===== TARJETA DE SCORE ===== */}
          <div className="score-card">
            <h2 className="score-label">PonteVisible Score</h2>
            <div
              className="score-number"
              style={{ color: scoreColor }}
            >
              {analisis.score}%
            </div>
            <p className="score-message">{scoreMessage}</p>
          </div>

          {/* ===== TARJETA DE RECOMENDACIONES ===== */}
          <div className="recomendaciones-card">
            <h3 className="recomendaciones-title">
              <span>🎯</span>
              Recomendaciones Estratégicas
            </h3>

            <div className="recomendaciones-list">
              {recomendacionesLista.length > 0 ? (
                recomendacionesLista.map((rec, i) => (
                  <div key={i} className="recomendacion-item">
                    <span className="recomendacion-bullet">•</span>
                    <span className="recomendacion-text">{rec}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94A3B8' }}>
                  No se pudieron cargar las recomendaciones.
                </p>
              )}
            </div>

            {/* ===== BOTÓN APLICAR CAMBIOS ===== */}
            {analisis.cambios_sugeridos && (
              <div className="recomendaciones-footer">
                <button
                  onClick={aplicarCambios}
                  disabled={aplicando}
                  className="btn-aplicar"
                >
                  {aplicando ? (
                    <>
                      <span className="spinner-small" />
                      Aplicando cambios...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Aplicar mejoras sugeridas
                    </>
                  )}
                </button>
                <p className="btn-aplicar-text">
                  {analisis.cambios_sugeridos.texto_aprobacion ||
                    'La IA actualizará tu eslogan y descripción automáticamente.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}