import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../config/supabase';
import SEO from '../components/SEO';

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
  const [lightboxAbierto, setLightboxAbierto] = useState(false);

  // Búsqueda con debounce (300ms) para filtrar en vivo sin recargar
  const [busquedaDebounce, setBusquedaDebounce] = useState('');
  const refChips = useRef(null);

  useEffect(() => {
    cargarDatosVitrina();
  }, [businessId]);

  // Cierra el lightbox (y de paso el modal) con la tecla Escape.
  // Prioridad: si el lightbox está abierto, se cierra primero; si no, se cierra el modal.
  useEffect(() => {
    const manejarEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (lightboxAbierto) {
        setLightboxAbierto(false);
      } else if (itemSeleccionado) {
        setItemSeleccionado(null);
      }
    };
    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [lightboxAbierto, itemSeleccionado]);

  // Debounce de 300ms para la búsqueda en vivo
  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaDebounce(busqueda.trim().toLowerCase()), 300);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

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

  const itemsFiltrados = useMemo(() => (items || []).filter(item => {
    const tipoItem = item.item_type || 'producto';
    const cumpleTipo = filtroTipo === 'todos' || tipoItem === filtroTipo;
    const cumpleCat = categoriaSeleccionada === 'todas' || String(item.category_id) === String(categoriaSeleccionada);
    const texto = [
      item.title || item.name || '',
      item.brand || item.compatibility || item.specialty || item.modality || '',
      item.description || '',
    ].join(' ').toLowerCase();
    const cumpleBusqueda = busquedaDebounce === '' || texto.includes(busquedaDebounce);
    return cumpleTipo && cumpleCat && cumpleBusqueda;
  }), [items, filtroTipo, categoriaSeleccionada, busquedaDebounce]);

  // Contadores por pestaña para la barra de filtros
  const contadores = useMemo(() => {
    const base = items || [];
    const baseFiltado = categoriaSeleccionada === 'todas'
      ? base
      : base.filter(i => String(i.category_id) === String(categoriaSeleccionada));
    return {
      todos: baseFiltado.length,
      productos: baseFiltado.filter(i => (i.item_type || 'producto') !== 'servicio').length,
      servicios: baseFiltado.filter(i => (i.item_type || 'producto') === 'servicio').length,
    };
  }, [items, categoriaSeleccionada]);

  // Copiar enlace del ítem al portapapeles
  const compartirItem = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : canonicalUrl;
      await navigator.clipboard.writeText(url);
    } catch {
      /* portapapeles no disponible: no bloquear */
    }
  };

  const numeroLimpio = String(perfil?.whatsapp || perfil?.phone || '').replace(/[^\d]/g, '');
  const linkWhatsApp = `https://api.whatsapp.com/send?phone=${numeroLimpio}`;

  // ============================================
  // Datos de SEO / Datos Estructurados (Schema.org)
  // ============================================
  const nombreNegocio = perfil?.business_name || perfil?.name || 'Establecimiento en PonteVisible';
  const slugNegocio = String(nombreNegocio)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'vitrina';
  const canonicalUrl = `https://pontevisible.com/${slugNegocio}`;
  const telefonoLimpio = (perfil?.phone || perfil?.whatsapp || '')
    .replace(/[^\d+]/g, '');

  // Productos destacados para el carrusel de ofertas
  const itemsDestacados = (items || [])
    .filter(item => item.is_active !== false && item.image_url && item.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto')
    .slice(0, 8);

  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: nombreNegocio,
    description: perfil?.description || perfil?.tagline || 'Negocio verificado en PonteVisible.',
    url: canonicalUrl,
    image: perfil?.logo_url || imagenFachada || undefined,
    telephone: telefonoLimpio || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: perfil?.address || undefined,
      addressLocality: perfil?.city || undefined,
      addressRegion: perfil?.department || undefined,
      addressCountry: 'CO'
    },
    ...(perfil?.schedule
      ? { openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', description: perfil.schedule }] }
      : {}),
    ...(() => {
      const urls = [];
      if (perfil?.website) urls.push(String(perfil.website).startsWith('http') ? perfil.website : `https://${perfil.website}`);
      if (perfil?.instagram) urls.push(`https://instagram.com/${String(perfil.instagram).replace('@', '')}`);
      if (perfil?.facebook) urls.push(String(perfil.facebook).startsWith('http') ? perfil.facebook : `https://facebook.com/${perfil.facebook}`);
      return urls.length > 0 ? { sameAs: urls } : {};
    })()
  };

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
    <>
      <SEO
        title={`${nombreNegocio} — Vitrina Oficial | PonteVisible`}
        description={perfil?.description || perfil?.tagline || `Descubre los productos y servicios de ${nombreNegocio} y contacta directamente.`}
        canonical={canonicalUrl}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
      />

      <div className="vitrina-container" role="main" aria-labelledby="vitrina-title">
      <div className="vitrina-wrapper">
        
        {/* 1. BARRA SUPERIOR (glassmorphism) */}
        <div className="bar-top">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="btn-volver"
            >
              ← Volver al Panel
            </button>
          )}

          <span className="badge-verificada">
            <LogoPVPill color={colorPrimario} /> ✓ Vitrina Verificada
          </span>
        </div>

        {/* 2. CINTILLO DE BENEFICIOS (USPs) */}
        <div className="usp-strip" aria-label="Beneficios del negocio">
          <div className="usp-capsula"><span role="img" aria-hidden="true">📦</span> Envíos Locales y Nacionales</div>
          <div className="usp-capsula"><span role="img" aria-hidden="true">⭐</span> Trato Directo sin Intermediarios</div>
          <div className="usp-capsula"><span role="img" aria-hidden="true">💳</span> Múltiples Medios de Pago</div>
          <div className="usp-capsula"><span role="img" aria-hidden="true">⚡</span> Cotización Inmediata por Chat</div>
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
                    {perfil?.sector ? `, ${perfil.sector}` : ''}
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
          <div className="filter-group-buttons" role="tablist" aria-label="Filtrar por tipo de ítem">
            <button
              type="button"
              role="tab"
              aria-selected={filtroTipo === 'todos'}
              onClick={() => setFiltroTipo('todos')}
              className={`filter-btn ${filtroTipo === 'todos' ? 'active' : ''}`}
            >
              Todos ({contadores.todos})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroTipo === 'producto'}
              onClick={() => setFiltroTipo('producto')}
              className={`filter-btn ${filtroTipo === 'producto' ? 'active' : ''}`}
            >
              📦 Productos ({contadores.productos})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroTipo === 'servicio'}
              onClick={() => setFiltroTipo('servicio')}
              className={`filter-btn ${filtroTipo === 'servicio' ? 'active' : ''}`}
            >
              🛠️ Servicios ({contadores.servicios})
            </button>
          </div>

          <div className="search-select-wrapper">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, marca o palabra clave..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
              aria-label="Buscar productos o servicios"
            />
          </div>

          {/* Chips tipo píldora por categoría (scroll suave con indicador) */}
          <div className="pisos-filtro">
            <div className="chips-track custom-scroll" ref={refChips} role="list" aria-label="Filtrar por categoría">
              <button
                type="button"
                role="listitem"
                onClick={() => setCategoriaSeleccionada('todas')}
                className={`chip-pill ${categoriaSeleccionada === 'todas' ? 'active' : ''}`}
              >
                📁 Todas las categorías
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  role="listitem"
                  onClick={() => setCategoriaSeleccionada(String(cat.id))}
                  className={`chip-pill ${String(categoriaSeleccionada) === String(cat.id) ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <span className="chips-scroll-hint" aria-hidden="true" />
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
                      <img
                        src={item.image_url}
                        alt={item.title || item.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const hermano = e.currentTarget.nextElementSibling;
                          if (hermano) hermano.style.display = 'flex';
                        }}
                      />
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

                    <button
                      type="button"
                      className="ver-detalle-link"
                      onClick={(e) => { e.stopPropagation(); setItemSeleccionado(item); }}
                    >
                      Ver detalle →
                    </button>

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
            className="modal-overlay"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="modal-content"
            >
              {/* BOTÓN DE CERRAR (Visible y elegante) */}
            <button 
              className="close-btn" 
              onClick={() => setItemSeleccionado(null)}
              aria-label="Cerrar"
              type="button"
            >
              ✕
            </button>

            {/* HEADER: Imagen del producto (clic para ampliar) */}
            <div className="modal-image-container">
              {itemSeleccionado.image_url && itemSeleccionado.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                <button
                  type="button"
                  className="zoom-trigger"
                  onClick={() => setLightboxAbierto(true)}
                  aria-label="Ampliar imagen"
                >
                  <img 
                    src={itemSeleccionado.image_url} 
                    alt={itemSeleccionado.title || itemSeleccionado.name} 
                    loading="lazy" 
                    decoding="async" 
                  />
                  <span className="zoom-icon" aria-hidden="true">🔍</span>
                </button>
              ) : (
                <span role="img" aria-label={itemSeleccionado.item_type === 'servicio' ? 'Servicio' : 'Producto'}>
                  {itemSeleccionado.item_type === 'servicio' ? '🛠️' : '📦'}
                </span>
              )}
            </div>

            {/* BODY: Texto del producto */}
            <div className="modal-body">
              <div className="product-badges">
                <span className={`badge ${itemSeleccionado.item_type === 'servicio' ? 'badge-servicio' : 'badge-producto'}`}>
                  {itemSeleccionado.item_type === 'servicio' ? '🛠️ Servicio Profesional' : '📦 Producto Físico'}
                </span>

                {itemSeleccionado.item_type !== 'servicio' && (
                  <span className={`badge badge-stock ${(itemSeleccionado.stock || 0) > 0 ? 'in-stock' : 'out-stock'}`}>
                    {(itemSeleccionado.stock || 0) > 0 ? `Stock: ${itemSeleccionado.stock} disponibles` : '🚫 Agotado'}
                  </span>
                )}
              </div>

              <h2 className="product-title">
                {itemSeleccionado.title || itemSeleccionado.name}
              </h2>
              <p className="product-price">
                {formatearMoneda(itemSeleccionado.price || itemSeleccionado.valor_de_venta)}
              </p>

              <div className="product-details">
                <h3>Detalles y Beneficios:</h3>
                <p>{itemSeleccionado.description || 'Sin descripción disponible.'}</p>
              </div>

              {(itemSeleccionado.brand || itemSeleccionado.compatibility || itemSeleccionado.specialty || itemSeleccionado.modality) && (
                <div className="product-details product-attributes">
                  {itemSeleccionado.brand && (
                    <p>🏷️ <strong>Marca / Fabricante:</strong> {itemSeleccionado.brand}</p>
                  )}
                  {itemSeleccionado.compatibility && (
                    <p>🎯 <strong>¿Para qué sirve? Usos y Aplicaciones:</strong> {itemSeleccionado.compatibility}</p>
                  )}
                  {itemSeleccionado.specialty && (
                    <p>👨‍🔧 <strong>Especialista a Cargo:</strong> {itemSeleccionado.specialty}</p>
                  )}
                  {itemSeleccionado.modality && (
                    <p>📍 <strong>Modalidad:</strong> {itemSeleccionado.modality === 'presencial' ? 'Atención en Local' : itemSeleccionado.modality === 'domicilio' ? 'A Domicilio' : 'Virtual'}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={compartirItem}
                className="modal-share-btn"
              >
                🔗 Compartir este ítem
              </button>

              <button
                type="button"
                disabled={itemSeleccionado.item_type !== 'servicio' && (itemSeleccionado.stock || 0) <= 0}
                onClick={() => handleContactarWhatsApp(itemSeleccionado)}
                className={`modal-submit-btn ${itemSeleccionado.item_type === 'servicio' || (itemSeleccionado.stock || 0) > 0 ? 'active' : 'disabled'}`}
              >
                {(itemSeleccionado.item_type === 'servicio' || (itemSeleccionado.stock || 0) > 0) ? '💬 Solicitar este ítem por WhatsApp' : '🚫 Producto Agotado'}
              </button>
            </div>
            </div>

            {/* LIGHTBOX: Visor a pantalla completa (hijo del overlay para no recortarse por el overflow del panel) */}
            {lightboxAbierto && itemSeleccionado.image_url && (
              <div
                className="lightbox-overlay"
                onClick={(e) => { e.stopPropagation(); setLightboxAbierto(false); }}
                role="dialog"
                aria-modal="true"
                aria-label="Imagen ampliada"
              >
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={(e) => { e.stopPropagation(); setLightboxAbierto(false); }}
                  aria-label="Cerrar imagen ampliada"
                >
                  ✕
                </button>
                <img
                  className="lightbox-image"
                  src={itemSeleccionado.image_url}
                  alt={itemSeleccionado.title || itemSeleccionado.name}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        )}

        {/* 7. CARRUSEL DE DESTACADOS (OFERTAS) */}
        {itemsDestacados.length > 0 && (
          <div className="destacados-section">
            <div className="destacados-header">
              <h2 className="destacados-title">⭐ Destacados y Ofertas</h2>
              <span className="destacados-subtitle">Lo más relevante de este negocio</span>
            </div>
            <div className="destacados-track">
              {itemsDestacados.map(item => {
                const esServicio = item.item_type === 'servicio';
                const nombreItem = item.title || item.name || '';
                return (
                  <div
                    key={item.id}
                    className="destacado-card"
                    onClick={() => setItemSeleccionado(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setItemSeleccionado(item); }}
                  >
                    <div className="destacado-imagen">
                      {item.image_url && item.image_url !== 'https://via.placeholder.com/300?text=Sin+Foto' ? (
                        <img src={item.image_url} alt={nombreItem} loading="lazy" />
                      ) : (
                        <span className="destacado-fallback" role="img" aria-label={esServicio ? 'Servicio' : 'Producto'}>
                          {esServicio ? '🛠️' : '📦'}
                        </span>
                      )}
                    </div>
                    <div className="destacado-body">
                      <span className="destacado-tipo">
                        {esServicio ? '🛠️ Servicio' : '📦 Producto'}
                      </span>
                      <h4 className="destacado-nombre">{nombreItem}</h4>
                      <div className="destacado-footer">
                        <span className="destacado-precio">{formatearMoneda(item.price || item.valor_de_venta)}</span>
                        <button type="button" className="destacado-cta" onClick={(e) => { e.stopPropagation(); handleContactarWhatsApp(item); }}>
                          Pedir 💬
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. PIE DE VITRINA INSTITUCIONAL */}
        <footer className="vitrina-footer" role="contentinfo">
          <div className="footer-brand">
            <span className="footer-logo">
              <LogoPVPill color={colorPrimario} />
            </span>
            <div>
              <strong className="footer-nombre">{nombreNegocio}</strong>
              <span className="footer-bajo">Vitrina oficial en PonteVisible</span>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-col">
              <span className="footer-col-title">Canales</span>
              {perfil?.phone || perfil?.whatsapp ? (
                <a
                  className="footer-link"
                  href={`https://wa.me/${telefonoLimpio || ''}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 WhatsApp
                </a>
              ) : null}
              {perfil?.phone ? (
                <a className="footer-link" href={`tel:${telefonoLimpio}`}>📞 Llamar</a>
              ) : null}
              {perfil?.address && (
                <a
                  className="footer-link"
                  href={perfil?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(perfil.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  📍 Cómo llegar
                </a>
              )}
            </div>

            {(perfil?.instagram || perfil?.facebook || perfil?.website) && (
              <div className="footer-col">
                <span className="footer-col-title">Redes</span>
                {perfil?.instagram && (
                  <a className="footer-link" href={`https://instagram.com/${String(perfil.instagram).replace('@', '')}`} target="_blank" rel="noreferrer">📸 Instagram</a>
                )}
                {perfil?.facebook && (
                  <a className="footer-link" href={String(perfil.facebook).startsWith('http') ? perfil.facebook : `https://facebook.com/${perfil.facebook}`} target="_blank" rel="noreferrer">🌐 Facebook</a>
                )}
                {perfil?.website && (
                  <a className="footer-link" href={String(perfil.website).startsWith('http') ? perfil.website : `https://${perfil.website}`} target="_blank" rel="noreferrer">🔗 Web Oficial</a>
                )}
              </div>
            )}

            <div className="footer-col">
              <span className="footer-col-title">Negocio</span>
              {perfil?.city ? <span className="footer-meta">📍 {perfil.city}{perfil?.department ? `, ${perfil.department}` : ''}</span> : null}
              {perfil?.schedule ? <span className="footer-meta">🕒 {perfil.schedule}</span> : null}
              <span className="footer-meta footer-shield">🛡️ Comercio Verificado PonteVisible</span>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {nombreNegocio} · PonteVisible</span>
            <span className="footer-legal">Hazte visible. Conecta. Crece.</span>
          </div>
        </footer>

        {/* 9. BARRA DE ACCIONES MÓVIL FIJA */}
        <div className="mobile-action-bar" aria-label="Acciones rápidas">
          <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="mb-btn mb-whatsapp">
            💬 WhatsApp
          </a>
          <a href={`tel:${telefonoLimpio || ''}`} className="mb-btn mb-llamar">
            📞 Llamar
          </a>
          {perfil?.address ? (
            <a href={perfil?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(perfil.address)}`} target="_blank" rel="noreferrer" className="mb-btn mb-ubicacion">
              📍 Ubicación
            </a>
          ) : (
            <button type="button" className="mb-btn mb-ubicacion" onClick={() => handleContactarWhatsApp()}>
              📍 Ubicación
            </button>
          )}
        </div>

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
          margin-bottom: 14px;
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.82);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
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

        /* ---- Cintillo de beneficios (USPs) ---- */
        .usp-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          background-color: #0B132B;
          border-radius: 18px;
          padding: 14px 18px;
          margin-bottom: 22px;
          box-shadow: 0 10px 24px -12px rgba(11, 19, 43, 0.5);
        }
        .usp-capsula {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          font-size: 12.5px;
          font-weight: 700;
          line-height: 1.3;
        }
        .usp-capsula span { font-size: 18px; flex-shrink: 0; }

        /* ---- Barra de acciones móvil fija ---- */
        .mobile-action-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 120;
            background-color: #FFFFFF;
            border-top: 1px solid #E2E8F0;
            box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.10);
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
            gap: 8px;
          }
          .mb-btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
            border: none;
            cursor: pointer;
            font-family: inherit;
          }
          .mb-whatsapp { background-color: #25D366; color: #ffffff; }
          .mb-llamar { background-color: ${colorPrimario}; color: #ffffff; }
          .mb-ubicacion { background-color: #F1F5F9; color: #0B132B; }
          .vitrina-container { padding-bottom: 96px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .item-card:hover, .item-card:hover .item-image-container img { transform: none; transition: none; }
          .mobile-action-bar { transition: none; }
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
          height: 230px;
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

        /* ---- Chips tipo píldora (categorías) ---- */
        .pisos-filtro {
          position: relative;
          margin-top: 14px;
          width: 100%;
        }
        .chips-track {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px 2px 10px 2px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .chips-track::-webkit-scrollbar { height: 6px; }
        .chips-track::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 100px; }
        .chip-pill {
          flex: 0 0 auto;
          padding: 9px 16px;
          border-radius: 100px;
          border: 1.5px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #475569;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .chip-pill:hover { border-color: ${colorPrimario}; color: ${colorPrimario}; }
        .chip-pill.active {
          background-color: ${colorPrimario};
          border-color: ${colorPrimario};
          color: #FFFFFF;
        }
        .custom-scroll { scrollbar-width: thin; }
        .chips-scroll-hint {
          position: absolute;
          top: 0; bottom: 8px;
          right: 0;
          width: 42px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(248, 250, 252, 1));
          border-radius: 12px;
        }

        /* ---- Enlace "Ver detalle" en tarjeta ---- */
        .ver-detalle-link {
          background: none;
          border: none;
          padding: 0;
          margin: 0 0 8px 0;
          color: ${colorPrimario};
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: opacity 0.2s ease;
        }
        .ver-detalle-link:hover { opacity: 0.8; }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
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
          transform: translateY(-4px);
          border-color: ${colorPrimario};
          box-shadow: 0 14px 28px ${colorPrimario}20;
        }

        .item-image-container {
          height: 210px;
          width: 100%;
          background-color: #F8FAFC;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          overflow: hidden;
        }

        .item-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .item-card:hover .item-image-container img {
          transform: scale(1.05);
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

        /* Fondo oscuro detrás del modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          z-index: 1000;
          padding: 40px 16px;
        }

        /* Contenedor blanco */
        .modal-content {
          position: relative;
          width: 100%;
          max-width: 500px;
          background: #FFFFFF;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          padding-bottom: 20px;
          margin: 2.5rem auto;
        }

        /* BOTÓN DE CERRAR (Visible y elegante) */
        .close-btn {
          position: absolute;
          top: 32px;
          right: 32px;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(11, 19, 43, 0.8);
          color: #FFFFFF;
          border: none;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .close-btn:hover {
          background-color: rgba(220, 38, 38, 0.9);
          transform: scale(1.1);
        }

        /* Imagen del producto */
        .modal-image-container {
          width: 100%;
          height: 280px;
          background: linear-gradient(135deg, #F8FAFC, #E2E8F0);
          border-radius: 20px 20px 0 0;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-image-container span {
          font-size: 64px;
        }

        /* Botón que envuelve la imagen ampliable (zoom) */
        .zoom-trigger {
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: zoom-in;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          line-height: 0;
        }

        .zoom-trigger img {
          max-width: 80%;
          max-height: 90%;
          object-fit: contain;
          transition: transform 0.2s ease;
        }

        .zoom-trigger:hover img {
          transform: scale(1.03);
        }

        .zoom-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(11, 19, 43, 0.75);
          color: #FFFFFF;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .modal-image-container:hover .zoom-icon,
        .zoom-trigger:hover .zoom-icon {
          opacity: 1;
        }

        /* LIGHTBOX: Visor a pantalla completa */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          cursor: zoom-out;
        }

        .lightbox-image {
          max-width: 92%;
          max-height: 92%;
          object-fit: contain;
          cursor: zoom-out;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 70;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          color: #0B132B;
          border: none;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .lightbox-close:hover {
          background-color: #FFFFFF;
          transform: scale(1.1);
        }

        /* Cuerpo del texto */
        .modal-body {
          padding: 0 24px;
        }

        .product-badges {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .badge {
          background: #E6FFFA;
          color: #0B132B;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .badge.badge-producto,
        .badge.badge-servicio {
          background: #E6FFFA;
        }

        .badge.badge-stock.in-stock {
          background: #DCFCE7;
          color: #15803D;
        }

        .badge.badge-stock.out-stock {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .product-title {
          font-size: 24px;
          font-weight: 800;
          color: #0B132B;
          line-height: 1.3;
          margin: 0 0 10px 0;
          word-wrap: break-word;
          white-space: normal;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .product-price {
          font-size: 32px;
          font-weight: 900;
          color: #0066FF;
          margin: 0 0 20px 0;
        }

        .product-details {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 16px;
        }

        .product-details h3 {
          font-size: 14px;
          color: #0B132B;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }

        .product-details p {
          font-size: 14px;
          color: #4A5568;
          line-height: 1.6;
          margin: 0;
        }

        .product-attributes p:not(:last-child) {
          margin-bottom: 8px;
        }

        /* Botón de acción (agregar al carrito / pedir) */
        .modal-submit-btn {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 16px;
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
          background-color: #0066FF;
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.3);
        }

        .modal-submit-btn.active:hover {
          background-color: #0050CC;
          box-shadow: 0 8px 24px rgba(0, 102, 255, 0.35);
          transform: translateY(-2px);
        }

        .modal-submit-btn.disabled {
          background-color: #CBD5E1;
          color: #FFFFFF;
          cursor: not-allowed;
          box-shadow: none;
        }

        .modal-share-btn {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          margin-bottom: 8px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          background-color: #FFFFFF;
          color: #475569;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modal-share-btn:hover {
          border-color: #0066FF;
          color: #0066FF;
          background-color: #EFF6FF;
        }

        /* ----- CARRUSEL DE DESTACADOS ----- */
        .destacados-section {
          margin: 32px 0 8px 0;
        }

        .destacados-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .destacados-title {
          font-size: 20px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
        }

        .destacados-subtitle {
          font-size: 13px;
          color: #64748B;
          font-weight: 600;
        }

        .destacados-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 6px 4px 16px 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .destacados-track::-webkit-scrollbar {
          height: 8px;
        }

        .destacados-track::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 8px;
        }

        .destacado-card {
          flex: 0 0 260px;
          scroll-snap-align: start;
          background-color: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(11,19,43,0.04);
        }

        .destacado-card:hover {
          transform: translateY(-4px);
          border-color: ${colorPrimario};
          box-shadow: 0 12px 24px ${colorPrimario}18;
        }

        .destacado-imagen {
          height: 170px;
          background-color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .destacado-imagen img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .destacado-fallback {
          font-size: 42px;
        }

        .destacado-body {
          padding: 14px 16px 16px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .destacado-tipo {
          font-size: 10.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${colorPrimario};
          margin-bottom: 4px;
        }

        .destacado-nombre {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 12px 0;
          line-height: 1.35;
        }

        .destacado-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .destacado-precio {
          font-size: 15px;
          font-weight: 900;
          color: #0F172A;
        }

        .destacado-cta {
          padding: 8px 16px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #00F5D4, #059669);
          color: #060B18;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .destacado-cta:hover {
          transform: translateY(-1px);
        }

        /* ----- PIE DE VITRINA INSTITUCIONAL ----- */
        .vitrina-footer {
          margin-top: 40px;
          background-color: #0B132B;
          color: #E2E8F0;
          border-radius: 24px;
          padding: 34px 32px 22px 32px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .footer-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background-color: rgba(0, 245, 212, 0.12);
          border: 1px solid rgba(0, 245, 212, 0.3);
        }

        .footer-nombre {
          display: block;
          font-size: 16px;
          font-weight: 900;
          color: #FFFFFF;
        }

        .footer-bajo {
          display: block;
          font-size: 12px;
          color: #94A3B8;
          margin-top: 2px;
        }

        .footer-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 24px;
          margin-bottom: 26px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-col-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: ${colorAcento};
          margin-bottom: 4px;
        }

        .footer-link {
          color: #CBD5E1;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: ${colorAcento};
        }

        .footer-meta {
          font-size: 13px;
          color: #CBD5E1;
          font-weight: 600;
        }

        .footer-shield {
          color: #94A3B8;
          font-size: 12px;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: #94A3B8;
        }

        .footer-legal {
          font-weight: 800;
          color: ${colorAcento};
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
          .vitrina-footer {
            padding: 26px 20px 18px 20px;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          .destacado-card {
            flex: 0 0 240px;
          }
        }
      `}</style>
    </div>
    </>
  );
}