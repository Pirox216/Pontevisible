import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './config/supabase';
import { useLocation } from 'react-router-dom'; // Agregado para manejar rutas

// SEO Dinámico
import SEO from './components/SEO';

// Módulos y Páginas del Sistema
import Login from './pages/Login';
import Register from './pages/Register';
import MiNegocio from './pages/MiNegocio';
import Interesados from './pages/Interesados';
import CatalogoOfertas from './pages/CatalogoOfertas';
import InventarioVentas from './pages/InventarioVentas';
import Appointments from './pages/Appointments';
import CentroAyudaGerencial from './pages/CentroAyudaGerencial';
import AsistenteCrecimiento from './pages/AsistenteCrecimiento';
import VitrinaPublica from './pages/VitrinaPublica';
import DiscoveryFeed from './pages/DiscoveryFeed';

// Isotipo y Logotipo Oficial Vectorial según Brand Book PonteVisible
export function LogoPonteVisible({ size = 38, variant = 'full' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pvBrandGradientAppLight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00F5D4" />
          </linearGradient>
        </defs>
        <path d="M 30 85 L 30 45 C 30 25, 65 25, 65 45 C 65 60, 48 60, 48 60" stroke="url(#pvBrandGradientAppLight)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="42" r="5" fill="#00F5D4" />
        <path d="M 74 34 C 79 39, 79 51, 74 56" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" />
        <path d="M 83 26 C 91 35, 91 55, 83 64" stroke="#00F5D4" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      </svg>

      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
            Ponte<span style={{ color: '#0066FF' }}>Visible</span> <span style={{ color: '#00F5D4', fontSize: '12px', backgroundColor: '#0B132B', padding: '1px 6px', borderRadius: '6px' }}>Pro</span>
          </div>
          <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', letterSpacing: '0.05em' }}>Hazte visible. Conecta. Crece.</span>
        </div>
      )}
    </div>
  );
}

// Iconos 3D estilo cristal
const Icons = {
  Store: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <path d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12H15V21" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 10L12 3L21 10" stroke="rgba(15, 23, 42, 0.2)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Shopping: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <path d="M20.59 13.41L13.41 20.59C12.63 21.37 11.37 21.37 10.59 20.59L3.41 13.41C3.03 13.03 2.82 12.52 2.82 12V4C2.82 3.45 3.27 3 3.82 3H11.82C12.34 3 12.85 3.21 13.23 3.59L20.41 10.77C21.19 11.55 21.19 12.81 20.41 13.59L20.59 13.41Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7H6.01" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Package: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7V17L12 22L21 17V7" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V22" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chart: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <path d="M4 20H20" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 16L10 12L14 16L18 8" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="8" r="1.5" stroke="#0F172A" strokeWidth="1.8"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#0F172A" strokeWidth="1.8"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Shield: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AI: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 19, 43, 0.15))' }}>
      <rect x="3" y="11" width="18" height="10" rx="2" stroke="#0F172A" strokeWidth="1.8"/>
      <circle cx="12" cy="5" r="2" stroke="#0F172A" strokeWidth="1.8"/>
      <path d="M12 7v4" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="8" y2="16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="16" x2="16" y2="16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.25 + 0.08
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 102, 255, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 102, 255, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [moduloActivo, setModuloActivo] = useState('menu');
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [metricas, setMetricas] = useState({ items: 0, contactos: 0, citas: 0 });

  // Para saber en qué ruta estamos y poder redirigir si es necesario
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSesion(session);
      if (session) {
        cargarDatosNegocio(session.user.id);
      } else {
        setCargando(false);
      }
    }).catch(() => {
      if (isMounted) setCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSesion(session);
      if (session) {
        cargarDatosNegocio(session.user.id);
      } else {
        setPerfil(null);
        setMetricas({ items: 0, contactos: 0, citas: 0 });
        setCargando(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const cargarDatosNegocio = async (userId) => {
    try {
      try {
        const { data: bizData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (bizData) setPerfil(bizData);
      } catch (err) {
        console.warn('Perfil de negocio no disponible:', err.message);
      }

      let itemsCount = 0;
      try {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        itemsCount = count || 0;
      } catch (err) {
        console.warn('Conteo productos no disponible:', err.message);
      }

      let ocgCount = 0;
      try {
        const { count } = await supabase
          .from('ocg_events')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', userId);
        ocgCount = count || 0;
      } catch (err) {
        console.warn('Conteo OCG no disponible:', err.message);
      }

      let citasCount = 0;
      try {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        citasCount = count || 0;
      } catch (err) {
        console.warn('Conteo citas no disponible:', err.message);
      }

      setMetricas({
        items: itemsCount,
        contactos: ocgCount,
        citas: citasCount
      });
    } catch (e) {
      console.warn('Error general al cargar métricas:', e.message);
    } finally {
      setCargando(false);
    }
  };

  const calcularNivelVisibilidad = () => {
    let puntos = 20;
    if (perfil?.business_name) puntos += 15;
    if (perfil?.logo_url) puntos += 15;
    if (perfil?.store_front_url || perfil?.fachada_url) puntos += 15;
    if (perfil?.whatsapp || perfil?.phone) puntos += 15;
    if (perfil?.city && perfil?.department) puntos += 10;
    if (metricas.items > 0) puntos += 10;
    return Math.min(puntos, 100);
  };

  const nivelVisibilidad = calcularNivelVisibilidad();

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setPerfil(null);
    setModuloActivo('menu');
    setAuthView('login');
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, sans-serif', fontWeight: '800' }}>
        ⚡ Cargando PonteVisible Pro...
      </div>
    );
  }

  if (moduloActivo === 'discovery') {
    return (
      <DiscoveryFeed
        businessId={sesion?.user?.id}
        onVolver={() => setModuloActivo('menu')}
        onVerVitrinaNegocio={() => setModuloActivo('vitrina')}
      />
    );
  }

  if (!sesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <SEO 
          title={authView === 'login' ? "Iniciar Sesión | PonteVisible" : "Registro | PonteVisible"}
          description="Accede a tu panel de control para gestionar tu negocio en PonteVisible."
        />
        {authView === 'login' ? (
          <Login 
            onSwitchToRegister={() => setAuthView('register')} 
            onVerDiscovery={() => setModuloActivo('discovery')}
          />
        ) : (
          <Register 
            onSwitchToLogin={() => setAuthView('login')} 
            onVerDiscovery={() => setModuloActivo('discovery')}
          />
        )}
      </div>
    );
  }

  const businessId = sesion.user.id;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(0, 245, 212, 0.10) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0, 102, 255, 0.08) 0px, transparent 50%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      color: '#0F172A', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {/* SEO Dinámico para el Dashboard */}
      <SEO 
        title="Panel de Control | PonteVisible Pro"
        description="Gestiona tu negocio, catálogo, métricas y citas desde el panel de PonteVisible."
      />
      
      <ParticleBackground />

      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(16px)', 
        borderBottom: '1px solid #E2E8F0', 
        padding: '14px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setModuloActivo('menu')}>
          <LogoPonteVisible size={38} variant="full" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', zIndex: 2 }}>
          {sesion.user.email && (
            <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', padding: '6px 14px', backgroundColor: '#F1F5F9', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              👤 {sesion.user.email}
            </span>
          )}

          <button
            type="button"
            onClick={handleCerrarSesion}
            style={{ padding: '8px 16px', backgroundColor: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
          >
            🚪 Salir
          </button>
        </div>
      </header>

      <main style={{ 
        padding: '32px 40px 80px 40px', 
        maxWidth: '1440px', 
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 1 
      }}>
        
        {moduloActivo === 'negocio' && <MiNegocio businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'resultados' && <Interesados businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'catalogo' && <CatalogoOfertas businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'citas' && <Appointments businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'inventario' && <InventarioVentas businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'vitrina' && <VitrinaPublica businessId={businessId} onVolver={() => setModuloActivo('menu')} />}
        {moduloActivo === 'gerencial' && <CentroAyudaGerencial businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}
        {moduloActivo === 'asistente' && <AsistenteCrecimiento businessId={businessId} onVolverMenu={() => setModuloActivo('menu')} />}

        {moduloActivo === 'menu' && (
          <div>
            {/* HERO PRINCIPAL CON BARRA DE VISIBILIDAD */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 70%, #064E3B 100%)', 
              borderRadius: '24px', 
              padding: '32px 36px', 
              border: '1px solid rgba(0, 245, 212, 0.25)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '24px', 
              boxShadow: '0 16px 36px -10px rgba(11, 19, 43, 0.2)', 
              marginBottom: '32px', 
              color: '#FFFFFF' 
            }}>
              <div style={{ flex: '1 1 500px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 245, 212, 0.15)', color: '#00F5D4', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', border: '1px solid rgba(0, 245, 212, 0.3)' }}>
                  ⚡ Red de Negocios Inteligentes
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  ¡Bienvenido, {perfil?.business_name || perfil?.name || 'Comerciante'}!
                </h1>
                <p style={{ fontSize: '13.5px', color: '#CBD5E1', margin: '0 0 16px 0', maxWidth: '580px', lineHeight: 1.5 }}>
                  Tu ecosistema comercial está activo para conectar con clientes empresariales y particulares en la red de búsqueda.
                </p>

                <div style={{ maxWidth: '420px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#E2E8F0', marginBottom: '6px' }}>
                    <span>Nivel de Visibilidad en la Red</span>
                    <span style={{ color: '#00F5D4' }}>{nivelVisibilidad}% Óptimo</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${nivelVisibilidad}%`, background: 'linear-gradient(90deg, #0066FF, #00F5D4)', borderRadius: '6px', transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setModuloActivo('vitrina')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 26px',
                    background: 'linear-gradient(135deg, #00F5D4 0%, #059669 100%)',
                    color: '#060B18',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '13.5px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(0, 245, 212, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  👁️ Ver Mi Vitrina Pública →
                </button>
              </div>
            </div>

            {/* ============================================ */}
            {/* SECCIÓN 1: TUS PILARES COMERCIALES (GRID ESTÁTICO - SIN CARRUSEL) */}
            {/* ============================================ */}
            <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ TUS PILARES COMERCIALES</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', marginBottom: '40px' }}>
              
              {/* 1. IDENTIDAD */}
              <div onClick={() => setModuloActivo('negocio')} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icons.Store />
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Identidad y Multisede</h3>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '100px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>✅ Listo</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0', flexGrow: 1 }}>Configura tu fachada, logotipo oficial y georreferenciación.</p>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0066FF' }}>Gestionar →</span>
                </div>
              </div>

              {/* 2. CATÁLOGO */}
              <div onClick={() => setModuloActivo('catalogo')} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icons.Shopping />
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Catálogo y Ofertas</h3>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '100px', backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{metricas.items} en vitrina</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0', flexGrow: 1 }}>Publica productos y servicios organizados con atributos de búsqueda y promociones.</p>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0066FF' }}>Gestionar →</span>
                </div>
              </div>

              {/* 3. STOCK */}
              <div onClick={() => setModuloActivo('inventario')} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icons.Package />
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Stock Visible</h3>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0', flexGrow: 1 }}>Monitorea unidades en existencia y disponibilidad de atención.</p>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>Ver stock →</span>
                </div>
              </div>

            </div>

            {/* ============================================ */}
            {/* SECCIÓN 2: MOTOR DE RESULTADOS (GRID ESTÁTICO) */}
            {/* ============================================ */}
            <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 TU MOTOR DE RESULTADOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', marginBottom: '40px' }}>
              
              {/* 4. OCG */}
              <div onClick={() => setModuloActivo('resultados')} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icons.Chart />
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Oportunidades (OCG)</h3>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '100px', backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>{metricas.contactos} capturadas</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0', flexGrow: 1 }}>Mide interacciones reales: cotizaciones por WhatsApp, llamadas y visitas.</p>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F97316' }}>Ver métricas →</span>
                </div>
              </div>

              {/* 5. CITAS */}
              <div onClick={() => setModuloActivo('citas')} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icons.Calendar />
                </div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Agenda de Citas</h3>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '100px', backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>{metricas.citas} reservas</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0', flexGrow: 1 }}>Gestiona citas y confirmaciones por WhatsApp.</p>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#F59E0B' }}>Abrir agenda →</span>
                </div>
              </div>

            </div>

            {/* ============================================ */}
            {/* SECCIÓN 3: INTELIGENCIA Y SOPORTE */}
            {/* ============================================ */}
            <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧠 INTELIGENCIA Y SOPORTE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
              
              {/* IA */}
              <div onClick={() => setModuloActivo('asistente')} style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', borderTop: '4px solid #00F5D4', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#F0FDFA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid #99F6E4' }}>
                  <Icons.AI />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>Asistente de Crecimiento IA</h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>Diagnóstico inteligente para optimizar títulos y posicionar tu oferta.</p>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#00F5D4' }}>Consultar IA →</span>
              </div>

              {/* EXPLORAR NEGOCIOS */}
              <div onClick={() => setModuloActivo('discovery')} style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', borderTop: '4px solid #0066FF', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', border: '1px solid #DBEAFE' }}>
                  <span style={{ fontSize: '22px' }}>🔍</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>Explorar Negocios</h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>Descubre productos y proveedores locales verificados. Contacta directamente.</p>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0066FF' }}>Ir a Explorar →</span>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}