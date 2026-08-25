// src/components/Interesados/Interesados.jsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Interesados({ onVolver }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [metricas, setMetricas] = useState({
    whatsapp: 0,
    llamadas: 0,
    ubicacion: 0,
    vistas: 0
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // FUNCIONES DE CARGA (CORREGIDO PARA MANEJAR ERRORES DE SUPABASE)
  // ============================================
  const cargarResultadosComerciales = async () => {
    setCargando(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Obtenemos el organization_id
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        // Si hay error buscando el perfil, lo capturamos pero no rompemos todo
        if (profileError) {
          console.warn("Error buscando perfil:", profileError.message);
        }

        const orgId = userProfile?.organization_id || user.id;

        // Obtenemos las métricas
        const { data, error } = await supabase
          .from('daily_metrics')
          .select('whatsapp_clicks, phone_clicks, directions_clicks, profile_views')
          .eq('organization_id', orgId);

        if (error) throw error;

        if (data && data.length > 0) {
          const totalWhatsapp = data.reduce((acc, curr) => acc + (curr.whatsapp_clicks || 0), 0);
          const totalLlamadas = data.reduce((acc, curr) => acc + (curr.phone_clicks || 0), 0);
          const totalUbicacion = data.reduce((acc, curr) => acc + (curr.directions_clicks || 0), 0);
          const totalVistas = data.reduce((acc, curr) => acc + (curr.profile_views || 0), 0);

          setMetricas({
            whatsapp: totalWhatsapp,
            llamadas: totalLlamadas,
            ubicacion: totalUbicacion,
            vistas: totalVistas
          });
        }
      }
    } catch (err) {
      // El código PGRST205 es específico de "tabla no encontrada"
      if (err.code === 'PGRST205') {
        setError('La tabla "daily_metrics" no existe en Supabase. Por favor, créala en el esquema público o ajusta el schema.');
      } else {
        setError(err.message || 'Error al cargar métricas');
      }
      console.error('Error al cargar métricas comerciales:', err);
      setMetricas({ whatsapp: 0, llamadas: 0, ubicacion: 0, vistas: 0 });
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = useCallback(() => {
    cargarResultadosComerciales();
  }, []);

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const totalOportunidades = useMemo(() => {
    return metricas.whatsapp + metricas.llamadas + metricas.ubicacion;
  }, [metricas]);

  const tieneDatos = useMemo(() => {
    return totalOportunidades > 0 || metricas.vistas > 0;
  }, [totalOportunidades, metricas.vistas]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarResultadosComerciales();
  }, []);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="interesados-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE INTERESADOS
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .interesados-container {
          max-width: 680px;
          margin: 30px auto;
          padding: 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0B132B;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- BOTÓN VOLVER (ACTUALIZADO PARA COINCIDIR) ----- */
        .btn-volver {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0B132B;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 24px;
          padding: 10px 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .btn-volver:hover {
          background: #F1F5F9;
          transform: translateY(-2px);
          color: #0066FF;
        }

        /* ----- ENCABEZADO ----- */
        .interesados-header {
          margin-bottom: 24px;
        }

        .interesados-title {
          color: #0B132B;
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .interesados-title-icon {
          font-size: 28px;
        }

        .interesados-subtitle {
          color: #4A5568;
          font-size: 14px;
          margin: 6px 0 0 0;
          line-height: 1.5;
        }

        /* ----- TARJETA PRINCIPAL (NORTH STAR) ----- */
        .north-star-card {
          background: #0B132B;
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 28px;
          text-align: center;
          box-shadow: 0 10px 25px -5px rgba(11, 19, 43, 0.3);
          border: 2px solid #00F5D4;
          position: relative;
          overflow: hidden;
        }

        .north-star-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(0, 245, 212, 0.05) 0%, transparent 70%);
          animation: pulseGlow 4s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .north-star-label {
          font-size: 12px;
          font-weight: 800;
          color: #00F5D4;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
        }

        .north-star-number {
          font-size: 52px;
          font-weight: 900;
          color: #FFFFFF;
          margin: 10px 0;
          position: relative;
          z-index: 1;
        }

        .north-star-message {
          margin: 0;
          font-size: 14px;
          color: #E2E8F0;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }

        /* ----- MENSAJE DE ERROR ----- */
        .error-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideDown 0.3s ease;
        }

        .error-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .error-message-close:hover {
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

        /* ----- ESTADO DE CARGA ----- */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #E2E8F0;
          border-top: 4px solid #0066FF;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .loading-text {
          font-size: 14px;
          color: #64748B;
          font-weight: 600;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ----- GRID DE MÉTRICAS ----- */
        .metricas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        /* ----- TARJETA DE MÉTRICA ----- */
        .metrica-card {
          padding: 20px;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .metrica-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .metrica-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #CBD5E1;
        }

        .metrica-card:hover::before {
          opacity: 1;
        }

        .metrica-card--whatsapp::before {
          background: linear-gradient(90deg, #25D366, #128C7E);
        }

        .metrica-card--llamadas::before {
          background: linear-gradient(90deg, #3B82F6, #1D4ED8);
        }

        .metrica-card--ubicacion::before {
          background: linear-gradient(90deg, #F59E0B, #D97706);
        }

        .metrica-card--vistas::before {
          background: linear-gradient(90deg, #8B5CF6, #7C3AED);
        }

        .metrica-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .metrica-card-icon {
          font-size: 28px;
        }

        .metrica-card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .metrica-card-badge--whatsapp {
          background: #E6FFFA;
          color: #00A389;
        }

        .metrica-card-badge--llamadas {
          background: #EBF8FF;
          color: #2B6CB0;
        }

        .metrica-card-badge--ubicacion {
          background: #FEFCBF;
          color: #975A16;
        }

        .metrica-card-badge--vistas {
          background: #EDF2F7;
          color: #4A5568;
        }

        .metrica-card-title {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: #0B132B;
          font-weight: 700;
        }

        .metrica-card-number {
          font-size: 28px;
          font-weight: 800;
          color: #0B132B;
          transition: all 0.3s ease;
        }

        .metrica-card-number:hover {
          transform: scale(1.05);
        }

        .metrica-card-description {
          font-size: 12px;
          color: #718096;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .interesados-container {
            margin: 16px auto;
            padding: 16px;
          }

          .interesados-title {
            font-size: 22px;
          }

          .north-star-number {
            font-size: 40px;
          }

          .metricas-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .metrica-card {
            padding: 16px;
          }

          .metrica-card-number {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .interesados-container {
            margin: 12px auto;
            padding: 12px;
          }

          .interesados-title {
            font-size: 18px;
          }

          .interesados-subtitle {
            font-size: 13px;
          }

          .north-star-card {
            padding: 20px;
          }

          .north-star-number {
            font-size: 34px;
          }

          .metricas-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .metrica-card {
            padding: 14px;
            border-radius: 14px;
          }

          .metrica-card-number {
            font-size: 22px;
          }

          .metrica-card-title {
            font-size: 14px;
          }

          .metrica-card-icon {
            font-size: 24px;
          }
        }
      `}</style>

      {/* ============================================
          BOTÓN VOLVER (ACTUALIZADO)
          ============================================ */}
      <button
        type="button"
        onClick={onVolver}
        className="btn-volver"
      >
        🏠 Volver al Menú Principal
      </button>

      {/* ============================================
          ENCABEZADO
          ============================================ */}
      <header className="interesados-header">
        <h1 className="interesados-title">
          <span className="interesados-title-icon">💬</span>
          Clientes e Interesados Generados
        </h1>
        <p className="interesados-subtitle">
          Aquí mides el retorno real de tu vitrina: personas reales interesadas
          en comprarte o contactarte.
        </p>
      </header>

      {/* ============================================
          MENSAJE DE ERROR
          ============================================ */}
      {error && (
        <div className="error-message" role="alert">
          <span>❌ Error al cargar las métricas: {error}</span>
          <button
            className="error-message-close"
            onClick={() => setError(null)}
            aria-label="Cerrar mensaje de error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      {cargando ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Cargando clientes e interesados...</p>
        </div>
      ) : (
        <>
          {/* ===== TARJETA NORTH STAR ===== */}
          <div className="north-star-card">
            <span className="north-star-label">
              Contactos de Venta Directos Generados
            </span>
            <div className="north-star-number">
              {totalOportunidades}
            </div>
            <p className="north-star-message">
              {totalOportunidades === 0
                ? '¡Tu vitrina está activa! En cuanto los clientes comiencen a interactuar, verás reflejados tus contactos aquí.'
                : '💬 Personas interesadas que hicieron clic para iniciar una compra o contacto.'}
            </p>
          </div>

          {/* ===== GRID DE MÉTRICAS ===== */}
          <div className="metricas-grid">
            {/* WhatsApp */}
            <div className="metrica-card metrica-card--whatsapp">
              <div className="metrica-card-header">
                <span className="metrica-card-icon">💬</span>
                <span className="metrica-card-badge metrica-card-badge--whatsapp">
                  Contacto Directo
                </span>
              </div>
              <h4 className="metrica-card-title">Clics a tu WhatsApp</h4>
              <div className="metrica-card-number">{metricas.whatsapp}</div>
              <span className="metrica-card-description">
                Personas que iniciaron un chat para consultar o comprar
              </span>
            </div>

            {/* Llamadas */}
            <div className="metrica-card metrica-card--llamadas">
              <div className="metrica-card-header">
                <span className="metrica-card-icon">📞</span>
                <span className="metrica-card-badge metrica-card-badge--llamadas">
                  Llamada Directa
                </span>
              </div>
              <h4 className="metrica-card-title">Llamadas iniciadas</h4>
              <div className="metrica-card-number">{metricas.llamadas}</div>
              <span className="metrica-card-description">
                Clientes que presionaron para llamar a tu negocio
              </span>
            </div>

            {/* Ubicación */}
            <div className="metrica-card metrica-card--ubicacion">
              <div className="metrica-card-header">
                <span className="metrica-card-icon">📍</span>
                <span className="metrica-card-badge metrica-card-badge--ubicacion">
                  Ubicación Local
                </span>
              </div>
              <h4 className="metrica-card-title">Consultas de ubicación</h4>
              <div className="metrica-card-number">{metricas.ubicacion}</div>
              <span className="metrica-card-description">
                Personas que buscaron cómo llegar a tu sede
              </span>
            </div>

            {/* Vistas */}
            <div className="metrica-card metrica-card--vistas">
              <div className="metrica-card-header">
                <span className="metrica-card-icon">👁️</span>
                <span className="metrica-card-badge metrica-card-badge--vistas">
                  Alcance
                </span>
              </div>
              <h4 className="metrica-card-title">Visitas a tu vitrina</h4>
              <div className="metrica-card-number">{metricas.vistas}</div>
              <span className="metrica-card-description">
                Total de vistas acumuladas en la plataforma
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}