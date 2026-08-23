import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

// Paletas Oficiales del Sistema
const PALETAS_SISTEMA = [
  { id: 'brand-blue', name: 'Azul PonteVisible (Oficial)', primary: '#0066FF', secondary: '#00F5D4' },
  { id: 'emerald-growth', name: 'Verde Crecimiento & B2B', primary: '#059669', secondary: '#10B981' },
  { id: 'slate-dark', name: 'Gris Ejecutivo', primary: '#0B132B', secondary: '#00F5D4' },
  { id: 'warm-orange', name: 'Naranja Comercial', primary: '#ea580c', secondary: '#f97316' },
  { id: 'royal-purple', name: 'Morado Premium', primary: '#7c3aed', secondary: '#a855f7' }
];

function LogoPVPill({ color = '#00F5D4' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M 30 85 L 30 45 C 30 25, 65 25, 65 45 C 65 60, 48 60, 48 60"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="42" r="6" fill={color} />
      <path d="M 74 34 C 79 39, 79 51, 74 56" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function VitrinaPublica({ businessId, onVolver }) {
  const [perfil, setPerfil] = useState(null);
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatosVitrina();
  }, [businessId]);

  const formatearMoneda = (valor) => {
    const num = Number(valor);
    if (isNaN(num)) return '$0';
    return `$${num.toLocaleString('es-CO')}`;
  };

  const cargarDatosVitrina = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;
      if (!currentUserId) {
        setCargando(false);
        return;
      }

      // 1. Perfil del negocio
      const { data: bizData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (bizData) setPerfil(bizData);

      // 2. Categorías
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (catData) setCategorias(catData);

      // 3. Productos / Servicios
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .or(`user_id.eq.${currentUserId},user_id.is.null`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (prodData) setItems(prodData);

    } catch (err) {
      console.error('Error cargando vitrina:', err.message);
    } finally {
      setCargando(false);
    }
  };

  const registrarEventoOCG = async (tipoAccion, detalleItem = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;
      if (!currentUserId) return;

      await supabase.from('ocg_events').insert([{
        business_id: currentUserId,
        event_type: tipoAccion,
        item_id: detalleItem?.id || null,
        metadata: {
          item_title: detalleItem?.title || detalleItem?.name || 'General',
          timestamp: new Date().toISOString()
        }
      }]);
    } catch (e) {
      console.warn('Evento OCG local:', tipoAccion);
    }
  };

  const handleContactarWhatsApp = (item = null) => {
    registrarEventoOCG('click_whatsapp', item);
    const rawNumber = perfil?.whatsapp || perfil?.phone || '573000000000';
    let cleanPhone = String(rawNumber).replace(/[^\d]/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) {
      cleanPhone = `57${cleanPhone}`;
    }
    const tituloItem = item?.title || item?.name || '';
    const mensaje = item
      ? `¡Hola! Vi en su vitrina oficial "${tituloItem}" (${formatearMoneda(item.price || item.valor_de_venta)}) y deseo solicitarlo.`
      : `¡Hola! Vi su vitrina oficial en PonteVisible y me gustaría consultar información sobre sus productos y servicios.`;

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleLlamar = () => {
    registrarEventoOCG('click_llamada');
    const rawPhone = perfil?.phone || perfil?.whatsapp;
    if (rawPhone) {
      const cleanPhone = String(rawPhone).replace(/[^\d+]/g, '');
      window.location.href = `tel:${cleanPhone}`;
    } else {
      alert('Este comercio aún no tiene registrado un número telefónico.');
    }
  };

  const handleVerMapa = () => {
    registrarEventoOCG('click_mapa');
    if (perfil?.google_maps_url) {
      window.open(perfil.google_maps_url, '_blank');
    } else if (perfil?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(perfil.address)}`, '_blank');
    }
  };

  const paletaActiva = PALETAS_SISTEMA.find(p => p.id === perfil?.palette_id) || {
    primary: perfil?.primary_color || '#0066FF',
    secondary: perfil?.secondary_color || '#00F5D4'
  };

  const colorPrimario = paletaActiva.primary;
  const colorAcento = paletaActiva.secondary;
  const fuenteNegocio = perfil?.font_family || perfil?.font_style || 'Sora, system-ui, sans-serif';
  const imagenFachada = perfil?.store_front_url || perfil?.fachada_url || perfil?.cover_url;

  const textoVentaja = typeof perfil?.advantages === 'string'
    ? perfil.advantages.replace(/^[⭐✨•\s]+/, '').trim()
    : Array.isArray(perfil?.advantages)
      ? perfil.advantages.join(', ')
      : '';

  const itemsFiltrados = (items || []).filter(item => {
    const tipoItem = item.item_type || 'producto';
    const cumpleTipo = filtroTipo === 'todos' || tipoItem === filtroTipo;
    const cumpleCat = categoriaSeleccionada === 'todas' || String(item.category_id) === String(categoriaSeleccionada);
    const nombre = item.title || item.name || '';
    const desc = item.description || '';
    const cumpleBusqueda = busqueda.trim() === '' || 
      nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      desc.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleTipo && cumpleCat && cumpleBusqueda;
  });

  if (cargando) {
    return (
      <div className="cargando-container" role="status" aria-live="polite">
        ⚡ CARGANDO VITRINA OFICIAL...
        <style jsx>{`
          .cargando-container {
            text-align: center;
            padding: 120px 20px;
            color: ${colorPrimario};
            font-family: ${fuenteNegocio};
            font-weight: 800;
            background: #F8FAFC;
            min-height: 100vh;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="vitrina-container" role="main" aria-labelledby="vitrina-title">
      <div className="vitrina-wrapper">
        
        {/* 1. BARRA SUPERIOR */}
        <div className="bar-top">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="btn-volver"
            >
              🏠 Volver al Menú Principal
            </button>
          )}

          <span className="badge-verificada">
            <LogoPVPill color={colorPrimario} /> Vitrina Verificada
          </span>
        </div>

        {/* 2. HERO COMERCIAL ESTRUCTURADO */}
        <div className="hero-card">
          {imagenFachada && (
            <div className="hero-fachada">
              <img 
                src={imagenFachada} 
                alt="Fachada Comercial" 
              />
            </div>
          )}

          <div className="hero-content">
            <div className="hero-info-grid">
              
              <div className="hero-brand-section">
                <div className="logo-box">
                  {perfil?.logo_url ? (
                    <img src={perfil.logo_url} alt="Logo" />
                  ) : (
                    <span role="img" aria-label="Comercio">🏪</span>
                  )}
                </div>

                <div className="hero-texts">
                  <h1 id="vitrina-title" className="hero-title">
                    {perfil?.business_name || perfil?.name || 'Nombre del Establecimiento'}
                  </h1>
                  <p className="hero-tagline">
                    {perfil?.tagline || 'Insumos esenciales para grandes empresas'}
                  </p>
                  {perfil?.description && (
                    <p className="hero-description">
                      {perfil.description}
                    </p>
                  )}
                </div>
              </div>

              {/* BOTONES DE CONVERSIÓN */}
              <div className="conversion-buttons">
                <button
                  type="button"
                  onClick={() => handleContactarWhatsApp()}
                  className="btn-whatsapp"
                >
                  💬 WhatsApp Directo
                </button>
                
                <button
                  type="button"
                  onClick={handleLlamar}
                  className="btn-llamar"
                >
                  📞 Llamar
                </button>

                {perfil?.address && (
                  <button
                    type="button"
                    onClick={handleVerMapa}
                    className="btn-mapa"
                  >
                    📍 Cómo Llegar
                  </button>
                )}
              </div>

            </div>

            {/* CAJA DE VENTAJAS DIFERENCIADORAS */}
            {textoVentaja && (
              <div className="advantages-box">
                <span role="img" aria-label="Estrella">⭐</span>
                <p>{textoVentaja}</p>
              </div>
            )}

            {/* UBICACIÓN COMPLETA Y CANALES */}
            <div className="location-channels">
              <div className="location-info">
                {(perfil?.address || perfil?.city) && (
                  <span>
                    📍 <strong>Ubicación:</strong> {perfil?.address ? `${perfil.address} — ` : ''}
                    <strong className="city-highlight">{perfil?.city || 'Funza'}</strong>
                    {perfil?.department ? `, ${perfil.department}` : ''}
                  </span>
                )}
                {perfil?.schedule && <span>🕒 <strong>Horario:</strong> {perfil.schedule}</span>}
              </div>

              <div className="social-links">
                {perfil?.instagram && (
                  <a href={`https://instagram.com/${String(perfil.instagram).replace('@', '')}`} target="_blank" rel="noreferrer" className="social-tag ig">
                    📸 Instagram
                  </a>
                )}
                {perfil?.facebook && (
                  <a href={String(perfil.facebook).startsWith('http') ? perfil.facebook : `https://facebook.com/${perfil.facebook}`} target="_blank" rel="noreferrer" className="social-tag fb">
                    🌐 Facebook
                  </a>
                )}
                {perfil?.website && (
                  <a href={String(perfil.website).startsWith('http') ? perfil.website : `https://${perfil.website}`} target="_blank" rel="noreferrer" className="social-tag web">
                    🔗 Web Oficial
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 3. BENEFICIOS RÁPIDOS */}
        <div className="quick-benefits-grid">
          <div className="benefit-card">
            <span role="img" aria-label="Escudo">🛡️</span>
            <div>
              <strong>Comercio Verificado</strong>
              <span>Garantía PonteVisible</span>
            </div>
          </div>

          <div className="benefit-card">
            <span role="img" aria-label="Rayo">⚡</span>
            <div>
              <strong>Atención al Instante</strong>
              <span>Canal WhatsApp directo</span>
            </div>
          </div>

          <div className="benefit-card">
            <span role="img" aria-label="Tarjeta">💳</span>
            <div>
              <strong>Métodos de Pago</strong>
              <span>Transferencia, Nequi y efectivo</span>
            </div>
          </div>

          <div className="benefit-card">
            <span role="img" aria-label="Moto">🛵</span>
            <div>
              <strong>Cobertura Local</strong>
              <span>Envíos y atención en sede</span>
            </div>
          </div>
        </div>

        {/* 4. BUSCADOR Y FILTROS */}
        <div className="filters-bar">
          <div className="filter-group-buttons">
            <button 
              type="button" 
              onClick={() => setFiltroTipo('todos')} 
              className={`filter-btn ${filtroTipo === 'todos' ? 'active' : ''}`}
            >
              Todos ({items.length})
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('producto')} 
              className={`filter-btn ${filtroTipo === 'producto' ? 'active' : ''}`}
            >
              📦 Productos
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroTipo('servicio')} 
              className={`filter-btn ${filtroTipo === 'servicio' ? 'active' : ''}`}
            >
              🛠️ Servicios
            </button>
          </div>

          <div className="search-select-wrapper">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, marca o palabra clave..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            {categorias.length > 0 && (
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="category-select"
              >
                <option value="todas">📁 Categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 5. GRILLA DE PRODUCTOS / SERVICIOS CON STOCK EN VIVO */}
        {itemsFiltrados.length === 0 ? (
          <div className="empty-results">
            <p>No se encontraron productos o servicios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="items-grid">
            {itemsFiltrados.map(item => {
              const esServicio = item.item_type === 'servicio';
              const catObj = (categorias || []).find(c => String(c.id) === String(item.category_id));
              const tieneStock = esServicio || (item.stock !== undefined && item.stock !== null ? item.stock > 0 : true);
              const cantidadStock = item.stock || 0;

              return (
                <div 
                  key={item.id} 
                  onClick={() => setItemSeleccionado(item)}
                  className="catalog-card item-card"
                >
                  <div className="item-image-container">
                    {item.image_url && item.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                      <img src={item.image_url} alt={item.title || item.name} />
                    ) : (
                      <span className="fallback-emoji" role="img" aria-label={esServicio ? 'Servicio' : 'Producto'}>
                        {esServicio ? '🛠️' : '📦'}
                      </span>
                    )}
                    
                    <span className={`item-type-pill ${esServicio ? 'servicio' : 'producto'}`}>
                      {esServicio ? '🛠️ Servicio' : '📦 Producto'}
                    </span>

                    <span className="detalle-pill">
                      🔍 Ver Detalle
                    </span>
                  </div>

                  <div className="item-content-body">
                    <span className="item-category-label">
                      📁 {catObj?.name || 'General'}
                    </span>
                    
                    <h4 className="item-title">
                      {item.title || item.name}
                    </h4>

                    {item.description && (
                      <p className="item-description">
                        {item.description.length > 85 ? `${item.description.substring(0, 85)}...` : item.description}
                      </p>
                    )}

                    {!esServicio && (
                      <div className="stock-wrapper">
                        <span className={`stock-badge ${tieneStock ? 'in-stock' : 'out-stock'}`}>
                          {tieneStock ? `📦 Stock: ${cantidadStock} disponibles` : '🚫 Agotado'}
                        </span>
                      </div>
                    )}

                    <div className="item-footer">
                      <div>
                        <span className="price-label">Precio:</span>
                        <span className="price-value">
                          {formatearMoneda(item.price || item.valor_de_venta)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!tieneStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tieneStock) handleContactarWhatsApp(item);
                        }}
                        className={`btn-pedir ${tieneStock ? 'active' : 'disabled'}`}
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

        {/* 6. MODAL QUICK-VIEW 360° OPTIMIZADO */}
        {itemSeleccionado && (
          <div 
            onClick={() => setItemSeleccionado(null)}
            className="modal-backdrop"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="modal-content"
            >
              <button 
                type="button"
                onClick={() => setItemSeleccionado(null)}
                className="modal-close"
              >
                ✕
              </button>

              <div className="modal-img-container">
                {itemSeleccionado.image_url && itemSeleccionado.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                  <img 
                    src={itemSeleccionado.image_url} 
                    alt={itemSeleccionado.title || itemSeleccionado.name} 
                  />
                ) : (
                  <span role="img" aria-label={itemSeleccionado.item_type === 'servicio' ? 'Servicio' : 'Producto'}>
                    {itemSeleccionado.item_type === 'servicio' ? '🛠️' : '📦'}
                  </span>
                )}
              </div>

              <div className="modal-badges">
                <span className={`modal-type-badge ${itemSeleccionado.item_type === 'servicio' ? 'servicio' : 'producto'}`}>
                  {itemSeleccionado.item_type === 'servicio' ? '🛠️ Servicio Profesional' : '📦 Producto Físico'}
                </span>

                {itemSeleccionado.item_type !== 'servicio' && (
                  <span className={`modal-stock-badge ${(itemSeleccionado.stock || 0) > 0 ? 'in-stock' : 'out-stock'}`}>
                    {(itemSeleccionado.stock || 0) > 0 ? `Stock: ${itemSeleccionado.stock} disponibles` : '🚫 Agotado'}
                  </span>
                )}
              </div>

              <h2 className="modal-title">
                {itemSeleccionado.title || itemSeleccionado.name}
              </h2>

              <span className="modal-price">
                {formatearMoneda(itemSeleccionado.price || itemSeleccionado.valor_de_venta)}
              </span>

              {itemSeleccionado.description && (
                <div className="modal-desc-section">
                  <h4>Detalles y Beneficios:</h4>
                  <p>{itemSeleccionado.description}</p>
                </div>
              )}

              {(itemSeleccionado.brand || itemSeleccionado.compatibility || itemSeleccionado.specialty || itemSeleccionado.modality) && (
                <div className="modal-attributes-box">
                  {itemSeleccionado.brand && (
                    <div>🏷️ <strong>Marca / Fabricante:</strong> {itemSeleccionado.brand}</div>
                  )}
                  {itemSeleccionado.compatibility && (
                    <div className="compatibility-text">
                      🎯 <strong>¿Para qué sirve? Usos y Aplicaciones:</strong> {itemSeleccionado.compatibility}
                    </div>
                  )}
                  {itemSeleccionado.specialty && (
                    <div>👨‍🔧 <strong>Especialista a Cargo:</strong> {itemSeleccionado.specialty}</div>
                  )}
                  {itemSeleccionado.modality && (
                    <div>📍 <strong>Modalidad:</strong> {itemSeleccionado.modality === 'presencial' ? 'Atención en Local' : itemSeleccionado.modality === 'domicilio' ? 'A Domicilio' : 'Virtual'}</div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={itemSeleccionado.item_type !== 'servicio' && (itemSeleccionado.stock || 0) <= 0}
                onClick={() => handleContactarWhatsApp(itemSeleccionado)}
                className={`modal-submit-btn ${itemSeleccionado.item_type === 'servicio' || (itemSeleccionado.stock || 0) > 0 ? 'active' : 'disabled'}`}
              >
                {(itemSeleccionado.item_type === 'servicio' || (itemSeleccionado.stock || 0) > 0) ? '💬 Solicitar y Pedir por WhatsApp' : '🚫 Producto Agotado'}
              </button>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .vitrina-container {
          min-height: 100vh;
          background-color: #F8FAFC;
          background-image: radial-gradient(at 0% 0%, ${colorAcento}15 0px, transparent 50%), radial-gradient(at 100% 100%, ${colorPrimario}10 0px, transparent 50%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
          padding: 20px 24px 80px 24px;
          font-family: ${fuenteNegocio};
          color: #0F172A;
        }

        .vitrina-wrapper {
          max-width: 100%;
          margin: 0 auto;
        }

        .bar-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn-volver {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-volver:hover {
          border-color: #CBD5E1;
          transform: translateY(-1px);
        }

        .badge-verificada {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 20px;
          background-color: #FFFFFF;
          color: ${colorPrimario};
          border: 1.5px solid ${colorPrimario};
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .hero-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #E2E8F0;
          box-shadow: 0 12px 30px -10px rgba(11, 19, 43, 0.08);
          margin-bottom: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-fachada {
          width: 100%;
          height: 280px;
          overflow: hidden;
          background-color: #E2E8F0;
        }

        .hero-fachada img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 65%;
        }

        .hero-content {
          padding: 28px 32px;
        }

        .hero-info-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
        }

        .hero-brand-section {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex: 1 1 500px;
          min-width: 280px;
        }

        .logo-box {
          width: 92px;
          height: 92px;
          border-radius: 20px;
          background-color: #FFFFFF;
          border: 2px solid ${colorPrimario};
          box-shadow: 0 8px 20px ${colorPrimario}25;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          flex-shrink: 0;
        }

        .logo-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .logo-box span {
          font-size: 36px;
        }

        .hero-texts {
          text-align: left;
          flex: 1;
        }

        .hero-title {
          font-size: 26px;
          font-weight: 900;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .hero-tagline {
          font-size: 14.5px;
          color: ${colorPrimario};
          margin: 0 0 6px 0;
          font-weight: 800;
        }

        .hero-description {
          font-size: 13px;
          color: #475569;
          margin: 0;
          line-height: 1.5;
          max-width: 640px;
        }

        .conversion-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-self: flex-start;
          flex-shrink: 0;
        }

        .btn-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background-color: #059669;
          color: #FFFFFF;
          border: none;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(5,150,105,0.3);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-whatsapp:hover {
          background-color: #047857;
          transform: translateY(-1px);
        }

        .btn-llamar {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 18px;
          background-color: ${colorPrimario}15;
          color: ${colorPrimario};
          border: 1.5px solid ${colorPrimario}40;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-llamar:hover {
          background-color: ${colorPrimario}25;
        }

        .btn-mapa {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 18px;
          background-color: #F8FAFC;
          color: #475569;
          border: 1px solid #CBD5E1;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-mapa:hover {
          background-color: #F1F5F9;
        }

        .advantages-box {
          margin-top: 20px;
          padding: 14px 18px;
          background-color: ${colorPrimario}08;
          border-radius: 14px;
          border: 1px solid ${colorPrimario}25;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .advantages-box span {
          font-size: 18px;
          flex-shrink: 0;
        }

        .advantages-box p {
          margin: 0;
          font-size: 13px;
          color: #0F172A;
          font-weight: 600;
          line-height: 1.5;
          text-align: left;
        }

        .location-channels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
          font-size: 13px;
          color: #64748B;
        }

        .location-info {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .city-highlight {
          color: #0F172A;
        }

        .social-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .social-tag {
          text-decoration: none;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .social-tag:hover {
          transform: translateY(-1px);
        }

        .social-tag.ig {
          background-color: #FDF2F8;
          color: #DB2777;
          border: 1px solid #FBCFE8;
        }

        .social-tag.fb {
          background-color: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
        }

        .social-tag.web {
          background-color: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        .quick-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }

        .benefit-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background-color: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .benefit-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .benefit-card span {
          font-size: 24px;
        }

        .benefit-card strong {
          font-size: 13px;
          display: block;
          color: #0F172A;
        }

        .benefit-card span span, .benefit-card span {
          font-size: 11px;
          color: #64748B;
        }

        .filters-bar {
          background-color: #FFFFFF;
          padding: 16px 20px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .filter-group-buttons {
          display: flex;
          gap: 8px;
          background-color: #F1F5F9;
          padding: 4px;
          border-radius: 12px;
        }

        .filter-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .filter-btn.active {
          background-color: ${colorPrimario};
          color: #FFFFFF;
        }

        .filter-btn:not(.active) {
          background-color: transparent;
          color: #64748B;
        }

        .search-select-wrapper {
          display: flex;
          gap: 10px;
          align-items: center;
          flex: 1;
          max-width: 480px;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #CBD5E1;
          font-size: 13px;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background-color: #FFFFFF;
        }

        .search-input:focus {
          border-color: ${colorPrimario};
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.12);
        }

        .category-select {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #CBD5E1;
          font-size: 13px;
          font-weight: 700;
          background-color: #FFFFFF;
          cursor: pointer;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-select:focus {
          border-color: ${colorPrimario};
        }

        .empty-results {
          text-align: center;
          padding: 60px 20px;
          background-color: #FFFFFF;
          border-radius: 20px;
          border: 1px dashed #CBD5E1;
        }

        .empty-results p {
          font-size: 15px;
          color: #64748B;
          margin: 0;
          font-weight: 700;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        }

        .item-card {
          background-color: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(11,19,43,0.03);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .item-card:hover {
          transform: translateY(-5px);
          border-color: ${colorPrimario};
          box-shadow: 0 14px 28px ${colorPrimario}20;
        }

        .item-image-container {
          height: 210px;
          background-color: #F8FAFC;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }

        .item-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .fallback-emoji {
          font-size: 48px;
        }

        .item-type-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 11px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .item-type-pill.servicio {
          background-color: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        .item-type-pill.producto {
          background-color: #EFF6FF;
          color: ${colorPrimario};
          border: 1px solid ${colorPrimario}40;
        }

        .detalle-pill {
          position: absolute;
          bottom: 10px;
          right: 10px;
          font-size: 11px;
          background-color: #FFFFFF;
          color: ${colorPrimario};
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 800;
          border: 1px solid ${colorPrimario}40;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .item-content-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-category-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .item-title {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .item-description {
          font-size: 13px;
          color: #475569;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .stock-wrapper {
          margin-bottom: 10px;
        }

        .stock-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .stock-badge.in-stock {
          background-color: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        .stock-badge.out-stock {
          background-color: #FEE2E2;
          color: #B91C1C;
          border: 1px solid #FECDD3;
        }

        .item-footer {
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 11px;
          color: #64748B;
          display: block;
          font-weight: 700;
        }

        .price-value {
          font-size: 18px;
          font-weight: 900;
          color: #0F172A;
        }

        .btn-pedir {
          padding: 9px 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 900;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-pedir.active {
          background: #059669;
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(5,150,105,0.25);
        }

        .btn-pedir.active:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .btn-pedir.disabled {
          background: #CBD5E1;
          color: #FFFFFF;
          cursor: not-allowed;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          zIndex: 1000;
          padding: 16px;
        }

        .modal-content {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          max-width: 560px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          padding: 28px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #F1F5F9;
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          zIndex: 10;
          transition: background-color 0.2s ease;
        }

        .modal-close:hover {
          background: #E2E8F0;
        }

        .modal-img-container {
          height: 210px;
          background-color: #F8FAFC;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          padding: 12px;
          border: 1px solid #F1F5F9;
        }

        .modal-img-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .modal-img-container span {
          font-size: 56px;
        }

        .modal-badges {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .modal-type-badge {
          font-size: 11px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .modal-type-badge.servicio {
          background-color: #ECFDF5;
          color: #047857;
        }

        .modal-type-badge.producto {
          background-color: #EFF6FF;
          color: ${colorPrimario};
        }

        .modal-stock-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .modal-stock-badge.in-stock {
          background-color: #DCFCE7;
          color: #15803D;
        }

        .modal-stock-badge.out-stock {
          background-color: #FEE2E2;
          color: #B91C1C;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 900;
          color: #0F172A;
          margin: 8px 0 4px 0;
          text-align: left;
        }

        .modal-price {
          font-size: 24px;
          font-weight: 900;
          color: #059669;
          display: block;
          text-align: left;
          margin-bottom: 14px;
        }

        .modal-desc-section {
          margin-bottom: 16px;
          text-align: left;
        }

        .modal-desc-section h4 {
          font-size: 12px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          margin: 0 0 6px 0;
        }

        .modal-desc-section p {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        .modal-attributes-box {
          background-color: #F8FAFC;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
          font-size: 13px;
          display: grid;
          gap: 8px;
          color: #334155;
          text-align: left;
        }

        .compatibility-text {
          line-height: 1.5;
        }

        .modal-submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-submit-btn.active {
          background-color: #059669;
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(5,150,105,0.3);
        }

        .modal-submit-btn.active:hover {
          background-color: #047857;
        }

        .modal-submit-btn.disabled {
          background-color: #CBD5E1;
          color: #FFFFFF;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .vitrina-container {
            padding: 16px 12px 60px 12px;
          }
          .hero-content {
            padding: 20px 16px;
          }
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .search-select-wrapper {
            max-width: 100%;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}