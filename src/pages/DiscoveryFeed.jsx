// src/components/DiscoveryFeed/DiscoveryFeed.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// CONSTANTES
// ============================================
const SECTORES_MAESTROS = [
  'Todos los Sectores',
  'Alimentos y Bebidas', 'Restaurantes y Comidas', 'Aseo y Limpieza', 'Papelería y Útiles',
  'Tecnología y Computadores', 'Software y Servicios Digitales', 'Ferretería y Herramientas',
  'Construcción y Remodelación', 'Muebles y Decoración', 'Electrodomésticos', 'Hogar y Jardín',
  'Salud y Medicina', 'Belleza y Cuidado Personal', 'Mascotas y Animales', 'Vehículos y Repuestos',
  'Transporte y Logística', 'Ropa y Moda', 'Deportes y Recreación', 'Educación y Cursos',
  'Servicios Profesionales y Legales', 'Contabilidad y Finanzas', 'Marketing y Publicidad',
  'Diseño y Creatividad', 'Turismo y Hotelería', 'Eventos y Entretenimiento', 'Inmobiliaria y Arriendos',
  'Seguridad y Vigilancia', 'Impresión y Publicidad Impresa', 'Reparación y Mantenimiento General',
  'Otros Productos y Servicios'
];

const GEO_COLOMBIA = [
  { departamento: 'Todos los Departamentos', ciudades: ['Todas las Ciudades'] },
  { departamento: 'Cundinamarca', ciudades: ['Todas las Ciudades', 'Funza', 'Mosquera', 'Madrid', 'Facatativá', 'Chía', 'Cota', 'Cajicá', 'Zipaquirá', 'Soacha', 'Girardot', 'Fusagasugá'] },
  { departamento: 'Bogotá D.C.', ciudades: ['Todas las Ciudades', 'Bogotá D.C.'] },
  { departamento: 'Antioquia', ciudades: ['Todas las Ciudades', 'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'Rionegro'] },
  { departamento: 'Valle del Cauca', ciudades: ['Todas las Ciudades', 'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Buga', 'Yumbo'] },
  { departamento: 'Santander', ciudades: ['Todas las Ciudades', 'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'] },
  { departamento: 'Atlántico', ciudades: ['Todas las Ciudades', 'Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'] }
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DiscoveryFeed({ onVolverMenu, onVerVitrinaNegocio }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos los Sectores');
  const [deptoSeleccionado, setDeptoSeleccionado] = useState('Todos los Departamentos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Todas las Ciudades');
  const [ciudadesOpciones, setCiudadesOpciones] = useState(['Todas las Ciudades']);
  const [itemModal, setItemModal] = useState(null);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDiscoveryFeed = async () => {
    setCargando(true);
    try {
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      const { data: perfiles, error: perfErr } = await supabase
        .from('business_profiles')
        .select('user_id, business_name, name, department, city, address, phone, whatsapp, logo_url');

      if (perfErr) console.warn('Aviso perfiles:', perfErr.message);

      const perfilesMap = (perfiles || []).reduce((acc, curr) => {
        acc[curr.user_id] = curr;
        return acc;
      }, {});

      const itemsConNegocio = (prods || []).map(p => ({
        ...p,
        business: perfilesMap[p.user_id] || {
          business_name: 'Comercio Verificado',
          city: 'Funza',
          department: 'Cundinamarca',
          whatsapp: '573000000000'
        }
      }));

      setItems(itemsConNegocio);
    } catch (err) {
      console.error('Error cargando Discovery Feed:', err);
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================
  const formatearMoneda = (valor) => {
    const num = Number(valor);
    if (isNaN(num)) return '$0';
    return `$${num.toLocaleString('es-CO')}`;
  };

  const registrarEventoOCG = async (tipoAccion, item) => {
    try {
      const bizId = item?.business?.user_id || item?.user_id;
      if (!bizId) return;

      await supabase.from('ocg_events').insert([{
        business_id: bizId,
        event_type: tipoAccion,
        item_id: item.id,
        metadata: {
          item_title: item.title || item.name,
          source: 'discovery_feed',
          timestamp: new Date().toISOString()
        }
      }]);
    } catch (e) {
      console.warn('Evento OCG local:', tipoAccion);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleContactar = (item) => {
    registrarEventoOCG('click_whatsapp', item);
    const rawNumber = item?.business?.whatsapp || item?.business?.phone || '573000000000';
    let cleanPhone = String(rawNumber).replace(/[^\d]/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) {
      cleanPhone = `57${cleanPhone}`;
    }
    const titulo = item.title || item.name || '';
    const mensaje = `¡Hola! Vi en el Discovery Feed de PonteVisible su oferta "${titulo}" (${formatearMoneda(item.price || item.valor_de_venta)}) y deseo más información.`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDiscoveryFeed();
  }, []);

  useEffect(() => {
    const depObj = GEO_COLOMBIA.find(d => d.departamento === deptoSeleccionado);
    if (depObj) {
      setCiudadesOpciones(depObj.ciudades);
      setCiudadSeleccionada('Todas las Ciudades');
    } else {
      setCiudadesOpciones(['Todas las Ciudades']);
    }
  }, [deptoSeleccionado]);

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const itemsFiltrados = useMemo(() => {
    return items.filter(item => {
      const nombre = (item.title || item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const bizNombre = (item.business?.business_name || '').toLowerCase();
      const q = busqueda.toLowerCase();

      const coincideTexto = !q || nombre.includes(q) || desc.includes(q) || bizNombre.includes(q);
      const coincideDepto = deptoSeleccionado === 'Todos los Departamentos' || item.business?.department === deptoSeleccionado;
      const coincideCiudad = ciudadSeleccionada === 'Todas las Ciudades' || item.business?.city === ciudadSeleccionada;

      return coincideTexto && coincideDepto && coincideCiudad;
    });
  }, [items, busqueda, deptoSeleccionado, ciudadSeleccionada]);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="discovery-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE DISCOVERY FEED
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .discovery-container {
          min-height: 100vh;
          background: #F8FAFC;
          color: #0F172A;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
        }

        /* ----- CABECERA ----- */
        .discovery-header {
          background: #0B132B;
          color: #FFFFFF;
          padding: 24px 20px;
          border-bottom: 1px solid rgba(0, 245, 212, 0.2);
        }

        .discovery-header-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .btn-volver-feed {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.1);
          color: #00F5D4;
          border: 1px solid rgba(0, 245, 212, 0.3);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          margin-bottom: 10px;
          transition: all 0.25s ease;
          font-family: inherit;
        }

        .btn-volver-feed:hover {
          background: rgba(0, 245, 212, 0.15);
          transform: translateY(-1px);
        }

        .discovery-title {
          font-size: 24px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .discovery-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 4px 0 0 0;
        }

        .discovery-badge {
          font-size: 12px;
          font-weight: 800;
          padding: 6px 14px;
          background: rgba(0, 245, 212, 0.15);
          color: #00F5D4;
          border-radius: 20px;
          border: 1px solid rgba(0, 245, 212, 0.3);
        }

        /* ----- CONTENIDO ----- */
        .discovery-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 20px;
        }

        /* ----- FILTROS ----- */
        .discovery-filters {
          background: #FFFFFF;
          padding: 18px 22px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }

        .discovery-filters:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid #CBD5E1;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #0F172A;
          background: #F8FAFC;
        }

        .filter-input:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .filter-input:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        .filter-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid #CBD5E1;
          font-size: 13px;
          background: #F8FAFC;
          font-weight: 700;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #0F172A;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .filter-select:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .filter-select:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        /* ----- GRILLA DE RESULTADOS ----- */
        .discovery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        }

        /* ----- TARJETA DE OFERTA ----- */
        .discovery-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(11, 19, 43, 0.03);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .discovery-card:hover {
          transform: translateY(-4px);
          border-color: #0066FF;
          box-shadow: 0 12px 24px rgba(0, 102, 255, 0.12);
        }

        .discovery-card-image {
          height: 190px;
          background: #F8FAFC;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }

        .discovery-card-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .discovery-card-image-placeholder {
          font-size: 48px;
        }

        .discovery-card-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 10px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
        }

        .discovery-card-badge--servicio {
          background: #ECFDF5;
          color: #047857;
          border-color: #A7F3D0;
        }

        .discovery-card-badge--producto {
          background: #EFF6FF;
          color: #0066FF;
          border-color: #BFDBFE;
        }

        .discovery-card-body {
          padding: 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .discovery-card-business {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .discovery-card-business-icon {
          font-size: 12px;
        }

        .discovery-card-business-name {
          font-size: 12px;
          font-weight: 800;
          color: #0066FF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .discovery-card-title {
          font-size: 15px;
          font-weight: 900;
          color: #0F172A;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .discovery-card-location {
          font-size: 11px;
          color: #64748B;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .discovery-card-stock {
          font-size: 10.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        .discovery-card-stock--available {
          background: #DCFCE7;
          color: #15803D;
        }

        .discovery-card-stock--empty {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .discovery-card-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .discovery-card-price-label {
          font-size: 10px;
          color: #64748B;
          display: block;
          font-weight: 700;
        }

        .discovery-card-price {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
        }

        .btn-contactar {
          padding: 8px 14px;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 900;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          cursor: pointer;
        }

        .btn-contactar--available {
          background: #059669;
          color: #FFFFFF;
        }

        .btn-contactar--available:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
        }

        .btn-contactar--available:active {
          transform: translateY(0);
        }

        .btn-contactar--disabled {
          background: #CBD5E1;
          color: #FFFFFF;
          cursor: not-allowed;
        }

        /* ----- ESTADOS DE CARGA Y VACÍO ----- */
        .loading-state {
          text-align: center;
          padding: 80px 20px;
          color: #0066FF;
          font-weight: 800;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 2px dashed #CBD5E1;
        }

        .empty-state-text {
          font-size: 15px;
          color: #64748B;
          margin: 0;
          font-weight: 700;
        }

        /* ----- MODAL ----- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 540px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #F1F5F9;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .modal-close:hover {
          background: #E2E8F0;
          transform: rotate(90deg);
        }

        .modal-image-container {
          height: 200px;
          background: #F8FAFC;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          padding: 10px;
        }

        .modal-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .modal-business {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .modal-business-name {
          font-size: 14px;
          color: #0066FF;
          font-weight: 800;
        }

        .modal-business-location {
          font-size: 12px;
          color: #64748B;
        }

        .modal-title {
          font-size: 19px;
          font-weight: 900;
          margin: 0 0 6px 0;
        }

        .modal-price {
          font-size: 22px;
          font-weight: 900;
          color: #059669;
          display: block;
          margin-bottom: 12px;
        }

        .modal-description {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .btn-modal-contactar {
          width: 100%;
          padding: 12px;
          background: #059669;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .btn-modal-contactar:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
        }

        .btn-modal-contactar:active {
          transform: translateY(0);
        }

        /* ----- SCROLLBAR DEL MODAL ----- */
        .modal-content::-webkit-scrollbar {
          width: 4px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .discovery-header {
            padding: 18px 16px;
          }

          .discovery-title {
            font-size: 20px;
          }

          .discovery-header-inner {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .discovery-badge {
            text-align: center;
          }

          .discovery-content {
            padding: 16px;
          }

          .discovery-filters {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 12px;
          }

          .discovery-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .modal-content {
            padding: 20px;
          }

          .modal-title {
            font-size: 17px;
          }

          .modal-price {
            font-size: 19px;
          }
        }

        @media (max-width: 480px) {
          .discovery-header {
            padding: 14px 12px;
          }

          .discovery-title {
            font-size: 17px;
          }

          .discovery-subtitle {
            font-size: 12px;
          }

          .discovery-content {
            padding: 12px;
          }

          .discovery-filters {
            padding: 12px;
            border-radius: 16px;
          }

          .discovery-card-image {
            height: 150px;
          }

          .discovery-card-body {
            padding: 14px;
          }

          .discovery-card-title {
            font-size: 14px;
          }

          .discovery-card-price {
            font-size: 14px;
          }

          .modal-content {
            padding: 16px;
            border-radius: 18px;
          }

          .modal-image-container {
            height: 150px;
          }

          .modal-title {
            font-size: 16px;
          }

          .btn-contactar,
          .btn-modal-contactar {
            font-size: 12px;
            padding: 10px 14px;
          }
        }
      `}</style>

      {/* ============================================
          CABECERA
          ============================================ */}
      <header className="discovery-header">
        <div className="discovery-header-inner">
          <div>
            {onVolverMenu && (
              <button
                type="button"
                onClick={onVolverMenu}
                className="btn-volver-feed"
              >
                🏠 Volver al Panel
              </button>
            )}
            <h1 className="discovery-title">🔍 Discovery Feed Comercial</h1>
            <p className="discovery-subtitle">
              Explora ofertas, productos en stock y servicios profesionales verificados en tu región.
            </p>
          </div>

          <div>
            <span className="discovery-badge">
              ⚡ {itemsFiltrados.length} Ofertas Disponibles
            </span>
          </div>
        </div>
      </header>

      {/* ============================================
          CONTENIDO
          ============================================ */}
      <div className="discovery-content">
        {/* ===== FILTROS ===== */}
        <div className="discovery-filters">
          <div className="filter-group">
            <label className="filter-label">Buscar Ítem o Empresa</label>
            <input
              type="text"
              placeholder="Ej: Aceite, Llantas, Merkadeando..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Departamento</label>
            <select
              value={deptoSeleccionado}
              onChange={(e) => setDeptoSeleccionado(e.target.value)}
              className="filter-select"
            >
              {GEO_COLOMBIA.map(d => (
                <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Ciudad / Municipio</label>
            <select
              value={ciudadSeleccionada}
              onChange={(e) => setCiudadSeleccionada(e.target.value)}
              className="filter-select"
            >
              {ciudadesOpciones.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sector Comercial</label>
            <select
              value={sectorSeleccionado}
              onChange={(e) => setSectorSeleccionado(e.target.value)}
              className="filter-select"
            >
              {SECTORES_MAESTROS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== GRILLA DE RESULTADOS ===== */}
        {cargando ? (
          <div className="loading-state">
            ⚡ CARGANDO OFERTAS DE LA RED COMERCIAL...
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              No se encontraron ofertas que coincidan con los filtros de ubicación o búsqueda.
            </p>
          </div>
        ) : (
          <div className="discovery-grid">
            {itemsFiltrados.map(item => {
              const esServicio = item.item_type === 'servicio';
              const tieneStock = esServicio || (item.stock !== undefined && item.stock !== null ? item.stock > 0 : true);
              const cantidadStock = item.stock || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setItemModal(item)}
                  className="discovery-card"
                >
                  {/* Imagen */}
                  <div className="discovery-card-image">
                    {item.image_url && item.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                      <img src={item.image_url} alt={item.title || item.name} />
                    ) : (
                      <span className="discovery-card-image-placeholder">
                        {esServicio ? '🛠️' : '📦'}
                      </span>
                    )}

                    <span className={`discovery-card-badge ${
                      esServicio ? 'discovery-card-badge--servicio' : 'discovery-card-badge--producto'
                    }`}>
                      {esServicio ? '🛠️ Servicio' : '📦 Producto'}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div className="discovery-card-body">
                    <div className="discovery-card-business">
                      <span className="discovery-card-business-icon">🏪</span>
                      <span className="discovery-card-business-name">
                        {item.business?.business_name || 'Comercio Verificado'}
                      </span>
                    </div>

                    <h4 className="discovery-card-title">
                      {item.title || item.name}
                    </h4>

                    <span className="discovery-card-location">
                      📍 {item.business?.city || 'Funza'}, {item.business?.department || 'Cundinamarca'}
                    </span>

                    {!esServicio && (
                      <span className={`discovery-card-stock ${
                        tieneStock ? 'discovery-card-stock--available' : 'discovery-card-stock--empty'
                      }`}>
                        {tieneStock ? `📦 Stock: ${cantidadStock} disponibles` : '🚫 Agotado'}
                      </span>
                    )}

                    <div className="discovery-card-footer">
                      <div>
                        <span className="discovery-card-price-label">Precio:</span>
                        <span className="discovery-card-price">
                          {formatearMoneda(item.price || item.valor_de_venta)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!tieneStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tieneStock) handleContactar(item);
                        }}
                        className={`btn-contactar ${
                          tieneStock ? 'btn-contactar--available' : 'btn-contactar--disabled'
                        }`}
                      >
                        {tieneStock ? 'Pedir 💬' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================
          MODAL DE DETALLE
          ============================================ */}
      {itemModal && (
        <div
          className="modal-overlay"
          onClick={() => setItemModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setItemModal(null)}
              className="modal-close"
            >
              ✕
            </button>

            <div className="modal-image-container">
              {itemModal.image_url && itemModal.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                <img src={itemModal.image_url} alt={itemModal.title || itemModal.name} />
              ) : (
                <span style={{ fontSize: '48px' }}>
                  {itemModal.item_type === 'servicio' ? '🛠️' : '📦'}
                </span>
              )}
            </div>

            <div className="modal-business">
              <span style={{ fontSize: '13px' }}>🏪</span>
              <span className="modal-business-name">
                {itemModal.business?.business_name}
              </span>
              <span className="modal-business-location">
                — {itemModal.business?.city}, {itemModal.business?.department}
              </span>
            </div>

            <h2 className="modal-title">{itemModal.title || itemModal.name}</h2>
            <span className="modal-price">
              {formatearMoneda(itemModal.price || itemModal.valor_de_venta)}
            </span>

            {itemModal.description && (
              <p className="modal-description">{itemModal.description}</p>
            )}

            <button
              type="button"
              onClick={() => handleContactar(itemModal)}
              className="btn-modal-contactar"
            >
              💬 Contactar y Pedir al Negocio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}