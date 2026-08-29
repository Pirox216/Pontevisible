import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './components/SEO';
import { supabase } from './config/supabase';

// Submódulos del panel del comerciante
import MiNegocio from './pages/MiNegocio.jsx';
import DatosDelLocal from './pages/DatosDelLocal.jsx';
import CatalogoOfertas from './pages/CatalogoOfertas.jsx';
import InventarioVentas from './pages/InventarioVentas.jsx';
import Interesados from './pages/Interesados.jsx';
import Appointments from './pages/Appointments.jsx';
import AsistenteCrecimiento from './pages/AsistenteCrecimiento.jsx';
import CentroAyudaGerencial from './pages/CentroAyudaGerencial.jsx';
import VitrinaPublica from './pages/VitrinaPublica.jsx';
import SecurityAdmin from './pages/SecurityAdmin.jsx';
import DiscoveryFeed from './pages/DiscoveryFeed.jsx';
import BienvenidaNegocio from './pages/BienvenidaNegocio.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// ============================================================
// APLICACION PRINCIPAL - Panel del comerciante PonteVisible Pro
// Barra de visibilidad, onboarding consultivo (BienvenidaNegocio),
// animaciones CSS y la rejilla completa de herramientas.
// Paleta: Fondo #F8FAFC / Primario #0B132B / Acentos #00F5D4 y #0066FF
// ============================================================

// ============================================================
// COMPONENTE - LOGO PONTEVISIBLE
// ============================================================
function LogoPonteVisible({ size = 40 }) {
  return (
    <div className="app-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="pvAppLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00F5D4" />
          </linearGradient>
        </defs>
        <path d="M 30 85 L 30 45 C 30 25, 65 25, 65 45 C 65 60, 48 60, 48 60" stroke="url(#pvAppLogoGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="42" r="5" fill="#00F5D4" />
        <path d="M 74 34 C 79 39, 79 51, 74 56" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" />
        <path d="M 83 26 C 91 35, 91 55, 83 64" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#0B132B', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
          Ponte<span style={{ color: '#0066FF' }}>Visible</span>{' '}
          <span style={{ color: '#00F5D4', fontSize: '11px', backgroundColor: '#0B132B', padding: '1px 6px', borderRadius: '5px' }}>Pro</span>
        </span>
        <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>Hazte visible. Conecta. Crece.</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE - FONDO CON PARTÍCULAS
// ============================================================
function ParticleBackground() {
  const cajas = Array.from({ length: 18 });
  return (
    <div className="particle-bg" aria-hidden="true" style={{ position: 'fixed', inset: '0', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {cajas.map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: 8 + (i % 5) * 3,
            height: 8 + (i % 5) * 3,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#0066FF' : '#00F5D4',
            opacity: 0.12,
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            animation: 'pvFloat 12s ease-in-out infinite',
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// ICONOS VECTORIALES INTEGRADOS
// ============================================================
const Icons = {
  Store: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12H15V21" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Shopping: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.59 13.41L13.41 20.59C12.63 21.37 11.37 21.37 10.59 20.59L3.41 13.41C3.03 13.03 2.82 12.52 2.82 12V4C2.82 3.45 3.27 3 3.82 3H11.82C12.34 3 12.85 3.21 13.23 3.59L20.41 10.77C21.19 11.55 21.19 12.81 20.41 13.59L20.59 13.41Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7H6.01" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Package: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7V17L12 22L21 17V7" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V22" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chart: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 20H20" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 16L10 12L14 16L18 8" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="8" r="1.5" stroke="#0F172A" strokeWidth="1.8"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#0F172A" strokeWidth="1.8"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  Shield: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AI: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" stroke="#0F172A" strokeWidth="1.8"/>
      <circle cx="12" cy="5" r="2" stroke="#0F172A" strokeWidth="1.8"/>
      <path d="M12 7v4" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="8" y2="16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="16" x2="16" y2="16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Pin: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="2.6" stroke="#0F172A" strokeWidth="1.8"/>
    </svg>
  ),
  Search: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#0F172A" strokeWidth="1.8"/>
      <path d="M16.5 16.5L21 21" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

// ============================================================
// COMPONENTE PRINCIPAL (continúa abajo)
// ============================================================

// ============================================================
// COMPONENTE PRINCIPAL DEL PANEL
// ============================================================
export default function App() {
  const location = useLocation();

  // ---------- Sesión y navegación ----------
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [moduloActivo, setModuloActivo] = useState('menu');
  const [authView, setAuthView] = useState('login');

  // ---------- Datos del panel ----------
  const [perfil, setPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [metricas, setMetricas] = useState({ items: 0, contactos: 0, citas: 0 });
  const [cargandoDatos, setCargandoDatos] = useState(true);
  useEffect(() => {
    if (location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // ---------- Consulta de sesión ----------
  useEffect(() => {
    let activo = true;
    const iniciarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (activo && session) setSesion(session);
      setCargandoSesion(false);
    };
    iniciarSesion();

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (activo) setSesion(nuevaSesion);
    });

    return () => {
      activo = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ---------- Consultas concurrentes seguras (Promise.allSettled) ----------
  const businessId = sesion?.user?.id || null;

  const cargarDatosNegocio = async (usuarioId) => {
    if (!usuarioId) {
      await Promise.resolve();
      setCargandoDatos(false);
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

    const datos = (r) => (r.status === 'fulfilled' ? r.value : null);
    const perfilData = datos(perfilRes)?.data ?? null;
    const conItems = datos(conteoCatRes)?.count ?? 0;
    const ultimos = datos(ultimosRes)?.data ?? [];
    const conContactos = datos(contactosRes)?.count ?? 0;
    const conCitas = datos(citasRes)?.count ?? 0;

    if (perfilData) setPerfil(perfilData);
    setProductos(ultimos);
    setMetricas({ items: conItems, contactos: conContactos, citas: conCitas });
    setCargandoDatos(false);
  };

  useEffect(() => {
    const ejecutar = async () => {
      await cargarDatosNegocio(businessId);
    };
    ejecutar();
  }, [businessId]);

  // ---------- Nivel de Visibilidad Digital (0 a 100) ----------
  const nivelVisibilidad = (() => {
    let puntos = 10;
    if (perfil?.business_name || perfil?.name) puntos += 15;
    if (perfil?.tagline || perfil?.description) puntos += 10;
    if (perfil?.logo_url) puntos += 15;
    if (perfil?.store_front_url || perfil?.fachada_url || perfil?.cover_url) puntos += 15;
    if (perfil?.whatsapp || perfil?.phone) puntos += 15;
    if (perfil?.city && perfil?.department) puntos += 10;
    if (perfil?.instagram || perfil?.facebook || perfil?.website) puntos += 5;
    if (metricas.items > 0) puntos += 15;
    return Math.min(puntos, 100);
  })();

  const nombreNegocio = perfil?.business_name || perfil?.name || 'Mi Negocio';
  const usuarioNombre = sesion?.user?.user_metadata?.business_name
    || sesion?.user?.user_metadata?.full_name
    || sesion?.user?.email
    || 'Comerciante';

  const ir = (destino) => () => { setModuloActivo(destino); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ---------- Cierre de sesión ----------
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setModuloActivo('menu');
  };

  const cargandoGeneral = cargandoSesion || (cargandoDatos && sesion);

  // ============================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <div className="app-root" data-modulo={moduloActivo} style={{ position: 'relative', zIndex: 1 }}>
      <ParticleBackground />
      <SEO
        title="Panel del Comerciante | PonteVisible"
        description="Gestiona tu visibilidad, catálogo, citas y oportunidades comerciales de tu negocio."
        canonical={typeof window !== 'undefined' ? window.location.href : undefined}
      />

      {/* ===== Animasiones y dinamismo CSS ===== */}
      <style>{`
        @keyframes shimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.45); }
          50% { box-shadow: 0 0 18px 5px rgba(0, 245, 212, 0.35); }
        }
        @keyframes borderGlow {
          0% { border-color: rgba(0, 102, 255, 0.35); box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.25); }
          50% { border-color: rgba(0, 245, 212, 0.6); box-shadow: 0 0 22px -2px rgba(0, 245, 212, 0.5); }
          100% { border-color: rgba(0, 102, 255, 0.35); box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.25); }
        }
        @keyframes pvFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .pv-shimmer-bar {
          position: absolute;
          top: 0; bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: shimmerBar 2.6s ease-in-out infinite;
        }
        .bento-card-hover {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card-hover:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 18px 34px -12px rgba(11, 19, 43, 0.18), 0 0 0 1px rgba(0, 102, 255, 0.12), 0 8px 24px -8px rgba(0, 245, 212, 0.35);
        }
        .accion-flecha { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); display: inline-block; }
        .bento-card-hover:hover .accion-flecha { transform: translateX(5px); }
        .btn-glow { animation: glowPulse 2.6s ease-in-out infinite; }

        /* Accesibilidad: reducir animaciones */
        @media (prefers-reduced-motion: reduce) {
          .pv-shimmer-bar, .btn-glow, .particle-bg, .bento-card-hover, .accion-flecha { animation: none !important; transition: none !important; }
          .pv-shimmer-bar { display: none; }
          .bento-card-hover:hover { transform: none; }
        }
      `}</style>

      {/* ===== SIN SESIÓN: ENTRADA / REGISTRO ===== */}
      {!sesion && !cargandoSesion && (
        <>
          {authView === 'login' ? (
            <Login onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthView('login')} />
          )}
        </>
      )}

      {/* ===== CARGANDO ===== */}
      {cargandoSesion && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontFamily: "'Sora', sans-serif" }}>
          <LogoPonteVisible size={48} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Cargando tu panel comercial…</span>
        </div>
      )}

      {sesion && !cargandoGeneral && (<>`
        <div className="app-header" style={{ position: 'sticky', top: '0', zIndex: 50, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #E8EDF4', padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div onClick={() => setModuloActivo('menu')} style={{ cursor: 'pointer' }}>
            <LogoPonteVisible size={36} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {moduloActivo !== 'menu' && (
              <button type="button" onClick={() => setModuloActivo('menu')} style={{ background: 'none', border: '1px solid #E2E8F0', color: '#0B132B', fontWeight: 700, fontSize: '13px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
                ← Volver al panel
              </button>
            )}
            <button type="button" onClick={() => setModuloActivo('bienvenida')} style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', color: '#0B132B', fontWeight: 800, fontSize: '13px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
              🧭 Asistente de Inicio
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{usuarioNombre}</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Comerciante activo</div>
            </div>
            <button type="button" onClick={cerrarSesion} style={{ background: '#0B132B', color: '#00F5D4', border: 'none', fontWeight: 800, fontSize: '13px', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer' }}>
              Salir
            </button>
          </div>
        </div>

        {moduloActivo === 'negocio' && <MiNegocio businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'sedes' && <DatosDelLocal businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'catalogo' && <CatalogoOfertas businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'inventario' && <InventarioVentas businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'resultados' && <Interesados businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'citas' && <Appointments businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'asistente' && <AsistenteCrecimiento businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'gerencial' && <CentroAyudaGerencial businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'vitrina' && <VitrinaPublica businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'seguridad_admin' && <SecurityAdmin onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'discovery' && (
          <DiscoveryFeed
            businessId={businessId}
            onVolverMenu={() => setModuloActivo('menu')}
            onVerVitrinaNegocio={() => setModuloActivo('vitrina')}
          />
        )}
        {moduloActivo === 'bienvenida' && (
          <BienvenidaNegocio
            businessId={businessId}
            onFinalizar={() => {
              setModuloActivo('menu');
              cargarDatosNegocio(businessId);
            }}
          />
        )}

        {moduloActivo === 'menu' && (
          <main className="app-main" style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 20px 90px', position: 'relative', zIndex: 1 }}>

            {/* ============ HERO DE VISIBILIDAD COMERCIAL ============ */}
            <section aria-labelledby="hero-visibilidad-titulo" style={{ marginBottom: '34px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 55%, #064E3B 100%)', borderRadius: '22px', padding: '32px 30px', color: '#fff', display: 'flex', flexWrap: 'wrap', gap: '22px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h1 id="hero-visibilidad-titulo" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                    Hola, {usuarioNombre.split(' ')[0]}
                  </h1>
                  <p style={{ fontSize: '15.5px', color: 'rgba(255,255,255,0.82)', margin: '0 0 20px 0', maxWidth: '500px', lineHeight: 1.6 }}>
                    Bienvenido a tu tablero {nombreNegocio}. Aquí puedes conectarte con más clientes y crecer tu negocio.
                  </p>
                  <button type="button" className="btn-glow" onClick={ir('vitrina')} style={{ background: 'linear-gradient(120deg, #0066FF, #00F5D4)', color: '#0B132B', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>
                    Ver Mi Vitrina Pública →
                  </button>
                </div>

                <div style={{ flex: '1 1 300px', minWidth: '260px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Nivel de Visibilidad Digital</span>
                    <span style={{ fontSize: '30px', fontWeight: 900, color: '#00F5D4', lineHeight: 1 }} aria-live="polite">{nivelVisibilidad}%</span>
                  </div>
                  <div role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow={nivelVisibilidad} aria-valuetext={`${nivelVisibilidad} por ciento de visibilidad digital`} style={{ position: 'relative', height: '14px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${nivelVisibilidad}%`, background: 'linear-gradient(90deg, #0066FF, #00F5D4, #059669)', borderRadius: '100px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}>
                      <div className="pv-shimmer-bar" />
                    </div>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    {nivelVisibilidad >= 80
                      ? '¡Excelente! Tu negocio está muy visible en la red.'
                      : nivelVisibilidad >= 50
                        ? 'Vas bien. Completa los datos para brillar más.'
                        : 'Completa los pasos del diagnóstico para subir tu visibilidad.'}
                  </p>
                </div>
              </div>
            </section>


            {/* ============ VISTA PREVIA DE PRODUCTOS ACTIVOS ============ */}
            {productos.length > 0 && (
              <section aria-labelledby="recientes-titulo" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 id="recientes-titulo" style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Lo que muestras en tu vitrina</h2>
                  <button type="button" onClick={ir('catalogo')} style={{ background: 'none', border: 'none', color: '#0066FF', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Ver todo el catálogo <span className="accion-flecha">→</span>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
                  {productos.map((p) => {
                    const titulo = p.title || p.name || 'Producto / Servicio';
                    const precio = p.price ?? p.valor_de_venta;
                    const imgOk = p.image_url && !p.image_url.startsWith('data:') && p.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto';
                    return (
                      <article key={p.id} className="bento-card-hover" onClick={ir('catalogo')} role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('catalogo'); } }} aria-label={`Ver ${titulo} en el catálogo`} style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #E8EDF4', padding: '10px', cursor: 'pointer' }}>
                        <div style={{ height: '120px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: '10px' }}>
                          {imgOk ? (
                            <img src={p.image_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }} aria-hidden="true">🛒</div>
                          )}
                        </div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{titulo}</h3>
                        {typeof precio === 'number' && (
                          <p style={{ fontSize: '14px', fontWeight: 900, color: '#059669', margin: 0 }}>
                            ${precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ============ SECCIÓN 1 · TUS PILARES COMERCIALES ============ */}
            <section aria-labelledby="pilares-titulo" style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tus pilares comerciales</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

                <div onClick={ir('negocio')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('negocio'); } }} aria-label="Abrir Identidad y Multisede" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #0066FF', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#EFF6FF', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #DBEAFE' }}><Icons.Store /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Identidad y Multisede</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Define quién eres, tu marca y tus puntos de venta.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0066FF' }}>Configurar identidad <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('sedes')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('sedes'); } }} aria-label="Abrir Sedes y Canales" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #00F5D4', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#F0FDFA', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #99F6E4' }}><Icons.Pin /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Sedes y Canales</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Administra horarios, direcciones y canales de contacto.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0B132B' }}>Gestionar sedes <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('catalogo')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('catalogo'); } }} aria-label="Abrir Catálogo y Ofertas" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #F59E0B', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#FEF3C7', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #FDE68A' }}><Icons.Shopping /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Catálogo y Ofertas</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>
                    Publica y organiza lo que vendes. <strong style={{ color: '#0F172A' }}>({metricas.items} activos)</strong>
                  </p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#D97706' }}>Ver catálogo <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('inventario')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('inventario'); } }} aria-label="Abrir el Stock Visible" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #059669', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#ECFDF5', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #A7F3D0' }}><Icons.Package /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Stock Visible</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Controla tu inventario real y evita sorpresas.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669' }}>Gestionar stock <span className="accion-flecha">→</span></span>
                </div>

              </div>
            </section>

            {/* ============ SECCIÓN 2 · TU MOTOR DE RESULTADOS ============ */}
            <section aria-labelledby="resultados-titulo" style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu motor de resultados</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                <div onClick={ir('resultados')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('resultados'); } }} aria-label="Abrir Clientes e Interesados" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #0066FF', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#EFF6FF', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #DBEAFE' }}><Icons.Chart /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Clientes e Interesados</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 10px 0', flexGrow: 1 }}>Oportunidades Comerciales Generadas desde tu vitrina.</p>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0066FF', marginBottom: '12px' }} aria-live="polite">{metricas.contactos} contactos OCG</div>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0066FF' }}>Ver interesados <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('citas')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('citas'); } }} aria-label="Abrir la Agenda de Citas" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #F59E0B', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#FEF3C7', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #FDE68A' }}><Icons.Calendar /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Agenda de Citas</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 10px 0', flexGrow: 1 }}>Organiza reservas y confirmaciones con tus clientes.</p>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#B45309', marginBottom: '12px' }} aria-live="polite">{metricas.citas} citas reservadas</div>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#D97706' }}>Abrir agenda <span className="accion-flecha">→</span></span>
                </div>

              </div>
            </section>

            {/* ============ SECCIÓN 3 · INTELIGENCIA Y SOPORTE ============ */}
            <section aria-labelledby="apoyo-titulo" style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '16px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inteligencia, soporte y exploración</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                <div onClick={ir('asistente')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('asistente'); } }} aria-label="Abrir el Asistente de Crecimiento IA" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #00F5D4', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#F0FDFA', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #99F6E4' }}><Icons.AI /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Asistente de Crecimiento IA</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Optimiza títulos y posiciona tu oferta frente a compradores.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669' }}>Consultar Asistente <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('discovery')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('discovery'); } }} aria-label="Abrir Explorar Negocios" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #0066FF', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#EFF6FF', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #DBEAFE' }}><Icons.Search /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Explorar Negocios</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Descubre proveedores verificados y contacta directo.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0066FF' }}>Ir a Explorar <span className="accion-flecha">→</span></span>
                </div>

                <div onClick={ir('gerencial')} className="bento-card-hover" role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModuloActivo('gerencial'); } }} aria-label="Abrir el Centro Gerencial" style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '22px', border: '1px solid #E8EDF4', borderTop: '4px solid #0B132B', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#F8FAFC', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '13px', border: '1px solid #E2E8F0' }}><Icons.Shield /></div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>Centro Gerencial</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0', flexGrow: 1 }}>Soporte, reportes y canales de ayuda para tu negocio.</p>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0B132B' }}>Abrir Soporte <span className="accion-flecha">→</span></span>
                </div>

              </div>
            </section>

          </main>
        )}
      </>)}
    </div>
  );
}

