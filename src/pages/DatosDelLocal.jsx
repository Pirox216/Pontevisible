// src/components/DatosDelLocal/DatosDelLocal.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DatosDelLocal({ businessId, onVolver }) {
  // ============================================
  // ESTADOS - SEDES
  // ============================================
  const [esMultiSede, setEsMultiSede] = useState(false);
  const [sedes, setSedes] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);

  // ============================================
  // ESTADOS - FORMULARIO DE SEDE
  // ============================================
  const [nombreSede, setNombreSede] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [horarios, setHorarios] = useState('');

  // ============================================
  // ESTADOS - REDES SOCIALES
  // ============================================
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');

  // ============================================
  // ESTADOS - GUIAS Y CARGA
  // ============================================
  const [ayudaMaps, setAyudaMaps] = useState(false);
  const [ayudaRedes, setAyudaRedes] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMessage] = useState({ text: '', type: '' });

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDatosCompletos = async () => {
    setCargando(true);
    try {
      // 1. Cargar redes corporativas
      if (businessId) {
        const { data: bProfile, error: bError } = await supabase
          .schema('business')
          .from('business_profiles')
          .select('*')
          .eq('id', businessId)
          .single();

        if (bProfile && !bError) {
          setInstagram(bProfile.instagram || '');
          setFacebook(bProfile.facebook || '');
          setTiktok(bProfile.tiktok || '');
          setYoutube(bProfile.youtube || '');
          setSitioWeb(bProfile.payment_link || '');
        }
      }

      // 2. Cargar sucursales
      const { data: sedesData, error: sError } = await supabase
        .schema('organizations')
        .from('branches')
        .select('*');

      if (sedesData && sedesData.length > 0 && !sError) {
        setSedes(sedesData);
        if (sedesData.length > 1) {
          setEsMultiSede(true);
        }

        const principal = sedesData[0];
        setSedeSeleccionada(principal.id);
        cargarFormularioSede(principal);
      }
    } catch (err) {
      console.error('Error al cargar datos multisede:', err);
      setMessage({ text: '❌ Error al cargar los datos: ' + err.message, type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const cargarFormularioSede = (sede) => {
    setNombreSede(sede.name || sede.branch_name || '');
    setNombreContacto(sede.contact_person || '');
    setWhatsapp(sede.phone || sede.whatsapp || '');
    setDepartamento(sede.state || sede.department || '');
    setCiudad(sede.city || '');
    setDireccion(sede.address || '');
    setGoogleMapsUrl(sede.google_maps_url || '');
    setHorarios(sede.opening_hours || sede.hours || '');
  };

  const resetFormularioNuevaSede = () => {
    setSedeSeleccionada('nueva');
    setNombreSede('');
    setNombreContacto('');
    setWhatsapp('');
    setDepartamento('');
    setCiudad('');
    setDireccion('');
    setGoogleMapsUrl('');
    setHorarios('');
  };

  // ============================================
  // FUNCIONES DE GUARDADO
  // ============================================
  const dispararAnalisisIA = async () => {
    if (!businessId) return;

    try {
      const { data: negocioData } = await supabase
        .schema('business')
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();

      const { data: sedesData } = await supabase
        .schema('organizations')
        .from('branches')
        .select('*');

      const payload = {
        nombre: negocioData?.business_name || 'Negocio sin nombre',
        descripcion: negocioData?.description || '',
        ciudad: sedesData?.[0]?.city || '',
        departamento: sedesData?.[0]?.state || '',
        direccion: sedesData?.[0]?.address || '',
        redes: {
          instagram: negocioData?.instagram || '',
          facebook: negocioData?.facebook || '',
          tiktok: negocioData?.tiktok || '',
          youtube: negocioData?.youtube || '',
          web: negocioData?.payment_link || ''
        }
      };

      console.log('🧠 Enviando datos a la IA...');
      const { data, error } = await supabase.functions.invoke('analizar-negocio', {
        body: payload
      });

      if (error) {
        console.error('❌ Error al llamar a la IA:', error);
      } else {
        console.log('✅ IA respondió con éxito:', data?.recomendaciones);
      }
    } catch (error) {
      console.error('🔌 Error de conexión con la IA:', error);
    }
  };

  const handleGuardarSede = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMessage({ text: '', type: '' });

    try {
      const payloadSede = {
        name: esMultiSede ? (nombreSede.trim() || 'Nueva Sucursal') : 'Sede Principal',
        contact_person: nombreContacto.trim(),
        phone: whatsapp.trim(),
        state: departamento.trim(),
        city: ciudad.trim(),
        address: direccion.trim(),
        google_maps_url: googleMapsUrl.trim(),
        opening_hours: horarios.trim(),
        is_main: !esMultiSede || sedes.length === 0
      };

      let errorResult = null;

      if (sedeSeleccionada && sedeSeleccionada !== 'nueva') {
        const { error } = await supabase
          .schema('organizations')
          .from('branches')
          .update(payloadSede)
          .eq('id', sedeSeleccionada);
        errorResult = error;
      } else {
        const { error } = await supabase
          .schema('organizations')
          .from('branches')
          .insert([payloadSede]);
        errorResult = error;
      }

      if (errorResult) {
        setMessage({ text: `❌ Error al guardar sede: ${errorResult.message}`, type: 'error' });
      } else {
        setMessage({ text: '✅ ¡Información de la sede guardada con éxito!', type: 'success' });
        cargarDatosCompletos();
        await dispararAnalisisIA();
      }
    } catch (err) {
      setMessage({ text: '❌ Error de conexión al guardar la sede.', type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarRedes = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMessage({ text: '', type: '' });

    try {
      if (!businessId) {
        setMessage({ text: '❌ No se encontró el ID del negocio.', type: 'error' });
        return;
      }

      const { error } = await supabase
        .schema('business')
        .from('business_profiles')
        .update({
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          tiktok: tiktok.trim(),
          youtube: youtube.trim(),
          payment_link: sitioWeb.trim(),
          updated_at: new Date()
        })
        .eq('id', businessId);

      if (error) {
        setMessage({ text: `❌ Error al actualizar canales: ${error.message}`, type: 'error' });
      } else {
        setMessage({ text: '✅ ¡Canales y redes sociales corporativas actualizadas!', type: 'success' });
        await dispararAnalisisIA();
      }
    } catch (err) {
      setMessage({ text: '❌ Error de conexión al actualizar redes.', type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const totalSedes = useMemo(() => sedes.length, [sedes]);

  const esEdicion = useMemo(() => {
    return sedeSeleccionada && sedeSeleccionada !== 'nueva';
  }, [sedeSeleccionada]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDatosCompletos();
  }, [businessId]);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="datos-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE DATOS DEL LOCAL
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .datos-container {
          max-width: 850px;
          margin: 30px auto;
          padding: 0 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #1E293B;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- BOTÓN VOLVER ----- */
        .btn-volver {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          color: #1E3A8A;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          margin-bottom: 20px;
        }

        .btn-volver:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          border-color: #93C5FD;
        }

        .btn-volver:active {
          transform: translateY(0);
        }

        /* ----- ENCABEZADO ----- */
        .datos-header {
          margin-bottom: 24px;
        }

        .datos-title {
          color: #0F172A;
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .datos-title-icon {
          font-size: 26px;
        }

        .datos-subtitle {
          color: #64748B;
          font-size: 13px;
          margin: 4px 0 0 0;
        }

        /* ----- MENSAJE ----- */
        .datos-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .datos-message--success {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .datos-message--error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .datos-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .datos-message-close:hover {
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

        /* ----- TARJETAS DE SECCIÓN ----- */
        .section-card {
          border: 1px solid #F1F5F9;
          border-radius: 20px;
          padding: 28px;
          background: #FFFFFF;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 32px;
        }

        .section-card:hover {
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.08);
          border-color: #E2E8F0;
        }

        .section-card-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #2563EB;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ----- SELECTOR DE MULTISEDE ----- */
        .multisede-selector {
          background: #F8FAFC;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
        }

        .multisede-label {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .multisede-options {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .multisede-option {
          cursor: pointer;
          font-size: 13px;
          color: #334155;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .multisede-option input[type="radio"] {
          width: 16px;
          height: 16px;
          accent-color: #2563EB;
          cursor: pointer;
        }

        /* ----- NAVEGADOR DE SEDES ----- */
        .sedes-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .sedes-nav::-webkit-scrollbar {
          height: 4px;
        }

        .sedes-nav::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .sedes-nav::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .sede-nav-btn {
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #475569;
          white-space: nowrap;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .sede-nav-btn:hover {
          border-color: #94A3B8;
          background: #F8FAFC;
        }

        .sede-nav-btn--active {
          border-color: #2563EB;
          background: #EFF6FF;
          color: #1E40AF;
        }

        .sede-nav-btn--new {
          border: 1px dashed #2563EB;
          background: #FFFFFF;
          color: #2563EB;
        }

        .sede-nav-btn--new:hover {
          background: #EFF6FF;
        }

        /* ----- FORMULARIO ----- */
        .datos-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          box-sizing: border-box;
          border: 2px solid #CBD5E1;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #0F172A;
          background: #FFFFFF;
        }

        .form-input:hover {
          border-color: #94A3B8;
        }

        .form-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row-2 .form-group {
          margin-bottom: 0;
        }

        /* ----- AYUDA INTERACTIVA ----- */
        .ayuda-container {
          background: #F8FAFC;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          margin-bottom: 16px;
        }

        .ayuda-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .ayuda-label {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ayuda-toggle {
          font-size: 11px;
          font-weight: 700;
          color: #2563EB;
          background: #FFFFFF;
          border: 1px solid #BFDBFE;
          padding: 4px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .ayuda-toggle:hover {
          background: #EFF6FF;
        }

        .ayuda-content {
          background: #0F172A;
          color: #F8FAFC;
          padding: 14px;
          border-radius: 12px;
          font-size: 12px;
          margin-bottom: 12px;
          border: 1px solid #334155;
          line-height: 1.6;
          animation: slideDown 0.3s ease;
        }

        .ayuda-content-title {
          font-weight: 700;
          color: #60A5FA;
          margin-bottom: 4px;
        }

        .ayuda-content ol,
        .ayuda-content ul {
          margin: 4px 0 0 0;
          padding-left: 18px;
        }

        .ayuda-content li {
          margin-bottom: 2px;
        }

        /* ----- BOTONES DE GUARDADO ----- */
        .btn-guardar {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-guardar:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-guardar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-guardar--sede {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #FFFFFF;
        }

        .btn-guardar--sede:hover:not(:disabled) {
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
        }

        .btn-guardar--redes {
          background: linear-gradient(135deg, #0F172A, #1E293B);
          color: #FFFFFF;
        }

        .btn-guardar--redes:hover:not(:disabled) {
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.3);
        }

        /* ----- REDES SOCIALES ----- */
        .redes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .redes-title {
          margin: 0;
          font-size: 16px;
          color: #2563EB;
          font-weight: 800;
        }

        .redes-rule {
          font-size: 12px;
          color: #64748B;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .redes-rule strong {
          color: #0F172A;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .datos-container {
            margin: 16px auto;
            padding: 0 12px;
          }

          .datos-title {
            font-size: 18px;
          }

          .section-card {
            padding: 20px;
            border-radius: 16px;
          }

          .form-row-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .multisede-options {
            flex-direction: column;
            gap: 10px;
          }

          .sedes-nav {
            gap: 8px;
          }

          .sede-nav-btn {
            font-size: 11px;
            padding: 6px 12px;
          }

          .redes-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .datos-container {
            margin: 12px auto;
            padding: 0 8px;
          }

          .datos-title {
            font-size: 16px;
          }

          .datos-subtitle {
            font-size: 12px;
          }

          .section-card {
            padding: 16px;
            border-radius: 14px;
          }

          .section-card-title {
            font-size: 14px;
          }

          .form-input {
            font-size: 12px;
            padding: 10px 12px;
          }

          .form-label {
            font-size: 11px;
          }

          .btn-guardar {
            font-size: 13px;
            padding: 10px;
          }

          .ayuda-content {
            font-size: 11px;
            padding: 12px;
          }

          .sede-nav-btn {
            font-size: 10px;
            padding: 5px 10px;
          }
        }
      `}</style>

      {/* ============================================
          BOTÓN VOLVER
          ============================================ */}
      <button
        type="button"
        onClick={() => {
          if (typeof onVolver === 'function') onVolver();
        }}
        className="btn-volver"
      >
        <span>🏠</span>
        Volver al Menú Inicial
      </button>

      {/* ============================================
          ENCABEZADO
          ============================================ */}
      <header className="datos-header">
        <h1 className="datos-title">
          <span className="datos-title-icon">📍</span>
          Ubicación, Sedes y Canales de Contacto
        </h1>
        <p className="datos-subtitle">
          Administra la geolocalización de tus puntos físicos y la presencia digital corporativa.
        </p>
      </header>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {mensaje.text && (
        <div
          className={`datos-message datos-message--${mensaje.type}`}
          role="alert"
        >
          <span>{mensaje.text}</span>
          <button
            className="datos-message-close"
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
      {cargando ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Cargando sedes y configuración geográfica...</p>
        </div>
      ) : (
        <>
          {/* ==========================================
              BLOQUE 1: SEDES Y SUCURSALES
              ========================================== */}
          <div className="section-card">
            <h3 className="section-card-title">
              <span>🏬</span>
              Operación Física y Sucursales
            </h3>

            {/* Selector de Modelo Multisede */}
            <div className="multisede-selector">
              <label className="multisede-label">
                Modelo de Atención del Negocio
              </label>
              <div className="multisede-options">
                <label className="multisede-option">
                  <input
                    type="radio"
                    name="multisede"
                    checked={!esMultiSede}
                    onChange={() => setEsMultiSede(false)}
                  />
                  🏢 Sede Única / Local Principal
                </label>
                <label className="multisede-option">
                  <input
                    type="radio"
                    name="multisede"
                    checked={esMultiSede}
                    onChange={() => setEsMultiSede(true)}
                  />
                  🏬 Multisede ({totalSedes} sucursales)
                </label>
              </div>
            </div>

            {/* Navegador de Sedes */}
            {esMultiSede && (
              <div className="sedes-nav">
                {sedes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSedeSeleccionada(s.id);
                      cargarFormularioSede(s);
                    }}
                    className={`sede-nav-btn ${sedeSeleccionada === s.id ? 'sede-nav-btn--active' : ''}`}
                  >
                    📍 {s.name || s.branch_name || 'Sucursal'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetFormularioNuevaSede}
                  className="sede-nav-btn sede-nav-btn--new"
                >
                  ➕ Agregar Nueva Sede
                </button>
              </div>
            )}

            {/* Formulario de Sede */}
            <form onSubmit={handleGuardarSede} className="datos-form">
              {esMultiSede && (
                <div className="form-group">
                  <label className="form-label">
                    Identificador de la Sucursal <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreSede}
                    onChange={(e) => setNombreSede(e.target.value)}
                    placeholder="Ej: Sede Chicó, Sucursal Calle 140"
                    required
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    Responsable / Atención <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    placeholder="Ej: María Pérez"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    WhatsApp Directo de la Sede <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ej: +573001234567"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    Departamento / Estado <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    placeholder="Ej: Cundinamarca"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Ciudad / Municipio <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Bogotá"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Dirección Física Exacta <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Calle 45 # 18-20"
                  required
                  className="form-input"
                />
              </div>

              <div className="ayuda-container">
                <div className="ayuda-header">
                  <label className="ayuda-label">
                    Enlace de Google Maps / GPS
                  </label>
                  <button
                    type="button"
                    onClick={() => setAyudaMaps(!ayudaMaps)}
                    className="ayuda-toggle"
                  >
                    💡 {ayudaMaps ? 'Cerrar guía' : 'Ver Hablador de Ayuda'}
                  </button>
                </div>

                {ayudaMaps && (
                  <div className="ayuda-content">
                    <div className="ayuda-content-title">📍 Guía en 3 pasos:</div>
                    <ol>
                      <li>Abre <strong>Google Maps</strong> en tu celular o computador.</li>
                      <li>Busca tu establecimiento o presiona la ubicación del local.</li>
                      <li>Toca <strong>"Compartir"</strong> y copia el enlace directo para pegarlo aquí.</li>
                    </ol>
                  </div>
                )}

                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Horarios de Atención Comercial <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  value={horarios}
                  onChange={(e) => setHorarios(e.target.value)}
                  placeholder="Ej: Lunes a Sábado de 8:00 AM a 6:00 PM"
                  required
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="btn-guardar btn-guardar--sede"
              >
                {guardando ? (
                  '⏳ Guardando cambios...'
                ) : esEdicion ? (
                  '📝 Actualizar Información de la Sede'
                ) : (
                  '💾 Guardar y Registrar Sede'
                )}
              </button>
            </form>
          </div>

          {/* ==========================================
              BLOQUE 2: REDES SOCIALES
              ========================================== */}
          <div className="section-card" style={{ marginBottom: 0 }}>
            <div className="redes-header">
              <h3 className="redes-title">🌐 Canales y Redes Sociales Corporativas</h3>
              <button
                type="button"
                onClick={() => setAyudaRedes(!ayudaRedes)}
                className="ayuda-toggle"
              >
                💡 {ayudaRedes ? 'Cerrar guía' : 'Ver Hablador de Ayuda'}
              </button>
            </div>

            <p className="redes-rule">
              🛡️ <strong>Regla Corporativa:</strong> Las redes sociales representan la identidad global
              de la marca y son heredadas automáticamente por todas las sucursales.
            </p>

            {ayudaRedes && (
              <div className="ayuda-content">
                <div className="ayuda-content-title">📱 ¿Cómo copiar los enlaces oficial de tus redes?</div>
                <ul>
                  <li>
                    <strong>Instagram / TikTok:</strong> Ve a tu perfil ➔ Opción "Compartir Perfil" ➔ "Copiar Enlace".
                  </li>
                  <li>
                    <strong>Facebook:</strong> Ingresa a la página oficial ➔ Menú de opciones (...) ➔ "Copiar Enlace".
                  </li>
                </ul>
              </div>
            )}

            <form onSubmit={handleGuardarRedes} className="datos-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    📸 Instagram
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/tu_marca"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    📘 Facebook
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/tu_marca"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    🎵 TikTok
                  </label>
                  <input
                    type="url"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@tu_marca"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    🔴 YouTube
                  </label>
                  <input
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@tu_marca"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  🌐 Link de Pago o Sitio Web Oficial
                </label>
                <input
                  type="url"
                  value={sitioWeb}
                  onChange={(e) => setSitioWeb(e.target.value)}
                  placeholder="https://www.tu_empresa.com"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="btn-guardar btn-guardar--redes"
              >
                {guardando ? (
                  '⏳ Guardando canales...'
                ) : (
                  '💾 Guardar y Actualizar Redes Sociales Corporativas'
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}