// src/components/SecurityAdmin/SecurityAdmin.jsx
// ============================================================
// PONTEVISIBLE PRO — MÓDULO SUPERADMIN (ESQUEMA SECURITY)
// Panel de gobierno de la plataforma: organizaciones, planes,
// monitoreo SIEM de auditoría y resumen global de OCG.
// Aislamiento total de identity.user_profiles: las credenciales
// de SuperAdmin residen exclusivamente en security.platform_admins.
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// ESTADOS DE SEVERIDAD (Monitoreo SIEM)
// ============================================
const SEVERIDAD = {
  INFO: { etiqueta: 'Informativo', color: '#0066FF', fondo: '#EFF6FF' },
  WARN: { etiqueta: 'Advertencia', color: '#B45309', fondo: '#FEF3C7' },
  CRITICAL: { etiqueta: 'Crítico', color: '#B91C1C', fondo: '#FEE2E2' }
};

const ROLES_PERMITIDOS = ['super_admin', 'secops_auditor'];

const RESUMEN_FALLO = { organizaciones: '—', ocg: '—', servicios: '—' };

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function SecurityAdmin({ onVolver }) {
  // ---- Estado de acceso ----
  const [verificando, setVerificando] = useState(true);
  const [acceso, setAcceso] = useState({ permitido: false, rol: null });
  const [razonDenegada, setRazonDenegada] = useState('');

  // ---- Datos del panel ----
  const [organizaciones, setOrganizaciones] = useState([]);
  const [logs, setLogs] = useState([]);
  const [resumen, setResumen] = useState(RESUMEN_FALLO);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [error, setError] = useState('');

  // ---- UI ----
  const [filtroSeveridad, setFiltroSeveridad] = useState('TODOS');
  const [cargandoLogs, setCargandoLogs] = useState(false);

  // ============================================
  // VERIFICACIÓN DE SESIÓN (auth.uid() en platform_admins)
  // ============================================
  const verificarAcceso = async () => {
    setVerificando(true);
    setRazonDenegada('');
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRazonDenegada('No hay una sesión activa. Inicia sesión para continuar.');
        return;
      }

      // SuperAdmin vive aislado en security.platform_admins (no en identity).
      const { data: admin, error: adminErr } = await supabase
        .schema('security')
        .from('platform_admins')
        .select('*')
        .or(`user_id.eq.${user.id},auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (adminErr) {
        console.error('Error verificando plataforma:', adminErr.message);
        setRazonDenegada('No se pudo verificar tu rol de administración. Intenta de nuevo.');
        return;
      }

      const rol = admin?.role;
      if (admin && ROLES_PERMITIDOS.includes(rol)) {
        setAcceso({ permitido: true, rol });
        cargarResumenYLogs(); // carga inicial una vez autorizado
      } else {
        setRazonDenegada(
          'Tu cuenta no tiene permisos de administración de la plataforma. ' +
          'Contacta al equipo de Seguridad si crees que esto es un error.'
        );
      }
    } catch (err) {
      console.error('Error verificando acceso:', err);
      setRazonDenegada('Ocurrió un error al validar tus permisos. Intenta de nuevo.');
    } finally {
      setVerificando(false);
    }
  };

  // ============================================
  // CARGA EN PARALELO (Promise.allSettled) — SIN BLOQUEAR UI
  // ============================================
  const cargarResumenYLogs = async () => {
    setCargandoDatos(true);
    setError('');
    try {
      // 1. Organizaciones de la plataforma
      const consultaOrganizaciones = supabase
        .schema('organizations')
        .from('organizations')
        .select('id, name, created_at, subscription_plan');

      // 2. Últimos 50 eventos de auditoría
      const consultaLogs = supabase
        .schema('security')
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const [resOrganizaciones, resLogs, resOcg] = await Promise.allSettled([
        consultaOrganizaciones,
        consultaLogs,
        // TOTAL OCG ACUMULADO (vista de conteo en public)
        supabase
          .from('ocg_events')
          .select('count')
          .limit(1)
      ]);

      const valor = (r) => (r.status === 'fulfilled' ? r.value : { data: null, error: r.reason });

      // --- Organizaciones ---
      const { data: orgData, error: orgErr } = valor(resOrganizaciones);
      if (!orgErr && Array.isArray(orgData)) {
        setOrganizaciones(orgData);
      }

      // --- Logs de seguridad (SIEM) ---
      const { data: logData, error: logErr } = valor(resLogs);
      if (!logErr && Array.isArray(logData)) {
        setLogs(logData);
      }

      // --- Resumen global ---
      const { data: ocgData, error: ocgErr } = valor(resOcg);
      const ocgCount = (!ocgErr && ocgData && Array.isArray(ocgData))
        ? Number(ocgData[0]?.count ?? 0)
        : '—';

      const totalOrg = orgErr ? '—' : (Array.isArray(orgData) ? orgData.length : 0);
      setResumen({
        organizaciones: totalOrg,
        ocg: isNaN(ocgCount) ? '—' : ocgCount,
        servicios: 'Operando'
      });
    } catch (err) {
      console.error('Error cargando panel:', err.message);
      setError('No se pudieron cargar todos los datos del panel. Revisa la conexión e inténtalo de nuevo.');
      setResumen(RESUMEN_FALLO);
    } finally {
      setCargandoDatos(false);
    }
  };

  const cargarLogs = async () => {
    setCargandoLogs(true);
    try {
      const { data, error: err } = await supabase
        .schema('security')
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!err && Array.isArray(data)) setLogs(data);
    } catch (e) {
      console.error('Error recargando logs:', e.message);
    } finally {
      setCargandoLogs(false);
    }
  };

  // ============================================
  // CICLO DE VIDA
  // ============================================
  useEffect(() => {
    verificarAcceso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // CÁLCULOS DERIVADOS
  // ============================================
  const logsFiltrados = useMemo(() => {
    if (filtroSeveridad === 'TODOS') return logs;
    return logs.filter((l) => (l.severity || 'INFO').toUpperCase() === filtroSeveridad);
  }, [logs, filtroSeveridad]);

  return (
    <div style={{ fontFamily: "'Sora', system-ui, sans-serif", backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '32px 40px 80px' }}>
      <style>{`@media (max-width: 720px){.sa-wrap{padding:16px!important;} .sa-grid{grid-template-columns:1fr!important;}}`}</style>

      {verificando ? (
        <CargandoEtiqueta texto="Verificando tus permisos de administración..." />
      ) : !acceso.permitido ? (
        <AccesoDenegado razon={razonDenegada} onVolver={onVolver} />
      ) : (
        <div className="sa-wrap">
          {/* ===== ENCABEZADO ===== */}
          <Cabecera rol={acceso.rol} onVolver={onVolver} />

          {/* ===== RESUMEN GLOBAL ===== */}
          <ResumenGlobal resumen={resumen} cargando={cargandoDatos} organizaciones={organizaciones} />

          {/* ===== MONITOREO SIEM ===== */}
          <MonitoreoSiem
            logsFiltrados={logsFiltrados}
            totalLogs={logs.length}
            filtroSeveridad={filtroSeveridad}
            setFiltroSeveridad={setFiltroSeveridad}
            cargandoLogs={cargandoLogs}
            onRecargar={cargarLogs}
            cargandoDatos={cargandoDatos}
            error={error}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// SUBCOMPONENTES — UI
// ============================================
function Cabecera({ rol, onVolver }) {
  const rolEtiqueta = rol === 'super_admin' ? 'Administrador General' : 'Auditor de Seguridad';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0B132B', color: '#00F5D4', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', border: '1px solid rgba(0,245,212,0.35)' }}>
          🛡️ Control de la Plataforma
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0B132B', margin: 0, letterSpacing: '-0.4px' }}>
          SuperAdmin · {rolEtiqueta}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0 0' }}>
          Gobierno, organizaciones y auditoría forense en una sola vista.
        </p>
      </div>
      <button
        type="button"
        onClick={onVolver}
        style={{ padding: '10px 18px', backgroundColor: '#FFFFFF', color: '#0066FF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
      >
        ← Volver al panel
      </button>
    </div>
  );
}


function ResumenGlobal({ resumen, cargando, organizaciones }) {
  const tarjetas = [
    { titulo: 'Organizaciones activas', icono: '🏢', valor: resumen.organizaciones, detalle: Array.isArray(organizaciones) ? `Plan principal: ${planResumen(organizaciones)}` : 'Sin datos' },
    { titulo: 'Oportunidades OCG acumuladas', icono: '📈', valor: resumen.ocg, detalle: 'Contactos generados en la red comercial' },
    { titulo: 'Servicios de la plataforma', icono: '🟢', valor: resumen.servicios, detalle: 'API, notificaciones y motor de búsqueda' }
  ];

  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Resumen global</h2>
      <div className="sa-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        {tarjetas.map((t) => (
          <div key={t.titulo} style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', borderTop: '4px solid #0066FF' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{t.icono}</div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{t.titulo}</div>
            <div style={{ fontSize: '30px', fontWeight: '900', color: '#0B132B', lineHeight: 1 }}>
              {cargando ? '…' : t.valor}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '10px', lineHeight: 1.4 }}>{t.detalle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function planResumen(organizaciones) {
  const conteo = {};
  organizaciones.forEach((o) => {
    const p = (o.subscription_plan || 'Sin plan').toLowerCase();
    conteo[p] = (conteo[p] || 0) + 1;
  });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} ×${top[1]}` : 'Sin datos';
}



function MonitoreoSiem({ logsFiltrados, totalLogs, filtroSeveridad, setFiltroSeveridad, cargandoLogs, onRecargar, cargandoDatos, error }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0B132B', margin: 0 }}>🛰️ Monitoreo de Seguridad (SIEM)</h2>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
            Últimos eventos de auditoría forense de la plataforma
            <span style={{ marginLeft: '8px', padding: '2px 10px', backgroundColor: '#F1F5F9', borderRadius: '12px', fontWeight: '800', color: '#0B132B' }}>{totalLogs}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['TODOS', 'CRITICAL', 'WARN', 'INFO'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltroSeveridad(s)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: filtroSeveridad === s ? '1px solid #0066FF' : '1px solid #E2E8F0',
                backgroundColor: filtroSeveridad === s ? '#EFF6FF' : '#FFFFFF',
                color: filtroSeveridad === s ? '#0066FF' : '#64748B',
                fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              {s === 'TODOS' ? 'Todos' : SEVERIDAD[s]?.etiqueta || s}
            </button>
          ))}
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargandoLogs}
            style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#0066FF', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {cargandoLogs ? 'Recargando…' : '↻ Recargar'}
          </button>
        </div>
      </div>


      <div style={{ padding: '12px 8px', maxHeight: '520px', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: '16px 24px', backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '13px', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        {!cargandoDatos && logsFiltrados.length === 0 && !error && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔐</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Sin eventos en este filtro</div>
            <div style={{ fontSize: '12.5px', marginTop: '6px' }}>Aún no hay registros de auditoría que coincidan con la selección.</div>
          </div>
        )}

        {logsFiltrados.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }}>Severidad</th>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }}>Evento</th>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }}>Detalle</th>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }}>Origen</th>
                <th style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.map((log, i) => {
                const sev = SEVERIDAD[(log.severity || 'INFO').toUpperCase()] || SEVERIDAD.INFO;
                return (
                  <tr key={log.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: sev.color, backgroundColor: sev.fondo }}>{sev.etiqueta}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0B132B' }}>
                      {eventoLegible(log.event || log.event_type || '—')}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{log.details || log.message || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{log.ip_address || log.source || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatearFecha(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


function eventoLegible(evento) {
  if (!evento) return '—';
  const mapa = {
    user_login: 'Inicio de sesión',
    user_logout: 'Cierre de sesión',
    org_created: 'Organización creada',
    org_updated: 'Organización actualizada',
    plan_changed: 'Plan actualizado',
    admin_login: 'Acceso de administración',
    permission_denied: 'Acceso denegado',
    config_changed: 'Configuración modificada',
    api_call: 'Llamada a la API'
  };
  return mapa[evento] || evento.replace(/_+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatearFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(iso).slice(0, 19);
  }
}

// ============================================
// ESTADOS DE UI
// ============================================
function CargandoEtiqueta({ texto }) {
  return (
    <div style={{ maxWidth: '640px', margin: '80px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '26px', marginBottom: '12px' }}>🛡️</div>
      <p style={{ fontSize: '14px', color: '#0B132B', fontWeight: '700' }}>{texto}</p>
      <div style={{ marginTop: '16px', display: 'inline-block', width: '26px', height: '26px', border: '3px solid #E2E8F0', borderTopColor: '#0066FF', borderRadius: '50%', animation: 'sa-spin 0.8s linear infinite' }} />
      <style>{`@keyframes sa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AccesoDenegado({ razon, onVolver }) {
  return (
    <div style={{ maxWidth: '520px', margin: '80px auto', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⛔</div>
      <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0B132B', margin: '0 0 10px 0' }}>Acceso restringido</h1>
      <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, marginBottom: '22px' }}>
        {razon || 'No tienes permisos para acceder al control de la plataforma.'}
      </p>
      <button
        type="button"
        onClick={onVolver}
        style={{ padding: '11px 20px', backgroundColor: '#0066FF', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Volver al panel
      </button>
    </div>
  );
}

