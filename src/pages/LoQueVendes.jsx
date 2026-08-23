// src/components/LoQueVendes/LoQueVendes.jsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// CONSTANTES
// ============================================
const IMAGEN_DEFAULT = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function LoQueVendes({ onVolver }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMessage] = useState('');

  // Categoría in-line
  const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');

  // Formulario unificado
  const [itemType, setItemType] = useState('product');
  const [categoryId, setCategoryId] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  // Atributos PRODUCTO
  const [seoSearchTerms, setSeoSearchTerms] = useState('');
  const [compatibilityBrand, setCompatibilityBrand] = useState('');
  const [problemSolved, setProblemSolved] = useState('');

  // Atributos SERVICIO
  const [providerSpecialty, setProviderSpecialty] = useState('');
  const [certifications, setCertifications] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .schema('catalog')
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (!error && data) {
        setCategorias(data);
      } else if (error) {
        console.error('Error al cargar categorías:', error.message);
      }
    } catch (err) {
      console.error('Error inesperado al cargar categorías:', err);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .schema('catalog')
        .from('products_services')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProductos(data);
      } else if (error) {
        console.error('Error al cargar ofertas:', error.message);
      }
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleCrearCategoriaRapida = async () => {
    if (!nuevaCatNombre.trim()) return;
    try {
      const { data, error } = await supabase
        .schema('catalog')
        .from('categories')
        .insert([{ name: nuevaCatNombre.trim() }])
        .select()
        .single();

      if (!error && data) {
        setCategorias(prev => [...prev, data]);
        setCategoryId(data.id);
        setNuevaCatNombre('');
        setMostrarNuevaCat(false);
        setMessage('✅ Categoría creada y seleccionada.');
      } else {
        setMessage(`❌ Error al crear categoría: ${error?.message || ''}`);
      }
    } catch (err) {
      setMessage('❌ Error de conexión al crear categoría.');
    }
  };

  const handleGuardarOferta = async (e) => {
    e.preventDefault();

    if (!categoryId) {
      setMessage('❌ La categoría es obligatoria para garantizar la visibilidad SEO e IA.');
      return;
    }

    setGuardando(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage('❌ No hay una sesión activa de usuario.');
        return;
      }

      const payload = {
        item_type: itemType,
        category_id: categoryId,
        name: nombre.trim(),
        price: parseFloat(precio) || 0,
        image_url: imagenUrl.trim() || IMAGEN_DEFAULT,
        user_id: user.id,
        is_active: true,
        seo_search_terms: itemType === 'product' && seoSearchTerms ? seoSearchTerms.split(',').map(s => s.trim()) : null,
        compatibility_brand: itemType === 'product' ? compatibilityBrand.trim() : null,
        problem_solved: itemType === 'product' ? problemSolved.trim() : null,
        provider_specialty: itemType === 'service' ? providerSpecialty.trim() : null,
        certifications: itemType === 'service' ? certifications.trim() : null,
        expected_outcome: itemType === 'service' ? expectedOutcome.trim() : null,
      };

      const { error } = await supabase
        .schema('catalog')
        .from('products_services')
        .insert([payload]);

      if (error) {
        setMessage(`❌ No pudimos publicar la oferta: ${error.message}`);
      } else {
        setMessage('✅ ¡Listo! Oferta optimizada y agregada con éxito a tu catálogo.');
        setNombre('');
        setPrecio('');
        setImagenUrl('');
        setSeoSearchTerms('');
        setCompatibilityBrand('');
        setProblemSolved('');
        setProviderSpecialty('');
        setCertifications('');
        setExpectedOutcome('');
        setCategoryId('');
        cargarProductos();
      }
    } catch (err) {
      setMessage('❌ Ocurrió un error de conexión al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarOferta = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto/servicio?')) return;
    try {
      const { error } = await supabase
        .schema('catalog')
        .from('products_services')
        .delete()
        .eq('id', id);

      if (!error) {
        setProductos(productos.filter(p => p.id !== id));
        setMessage('🗑️ Oferta eliminada del catálogo.');
      } else {
        setMessage(`❌ Error al eliminar: ${error.message}`);
      }
    } catch (err) {
      setMessage('❌ Error de conexión al eliminar.');
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const totalProductos = useMemo(() => productos.length, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos;
  }, [productos]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="loquevendes-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE LO QUE VENDES
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .loquevendes-container {
          max-width: 800px;
          margin: 30px auto;
          padding: 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0F172A;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- BOTÓN VOLVER ----- */
        .btn-volver {
          background: none;
          border: none;
          color: #0066FF;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-volver:hover {
          color: #0044CC;
          transform: translateX(-2px);
        }

        /* ----- ENCABEZADO ----- */
        .loquevendes-header {
          margin-bottom: 24px;
        }

        .loquevendes-title {
          color: #0F172A;
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .loquevendes-title-icon {
          font-size: 28px;
        }

        .loquevendes-subtitle {
          color: #64748B;
          font-size: 14px;
          margin: 6px 0 0 0;
          line-height: 1.5;
        }

        /* ----- MENSAJE ----- */
        .loquevendes-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 16px;
          animation: slideDown 0.3s ease;
        }

        .loquevendes-message--success {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .loquevendes-message--error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ----- TARJETA DEL FORMULARIO ----- */
        .form-card {
          border: 1px solid #CBD5E1;
          border-radius: 16px;
          padding: 24px;
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          margin-bottom: 32px;
          transition: all 0.3s ease;
        }

        .form-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .form-card-title {
          margin: 0 0 18px 0;
          font-size: 16px;
          color: #0066FF;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-card-title-icon {
          font-size: 18px;
        }

        /* ----- FORMULARIO ----- */
        .loquevendes-form {
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
          font-weight: 700;
          color: #334155;
        }

        .form-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          box-sizing: border-box;
          border: 2px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          background: #F8FAFC;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #0F172A;
        }

        .form-input:hover,
        .form-select:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-row-2 .form-group {
          margin-bottom: 0;
        }

        /* ----- CLASIFICACIÓN BASE ----- */
        .classification-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 14px;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          margin-bottom: 16px;
        }

        /* ----- ATRIBUTOS ESPECÍFICOS ----- */
        .atributos-box {
          padding: 16px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .atributos-box--producto {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
        }

        .atributos-box--servicio {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .atributos-title {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 700;
        }

        .atributos-title--producto {
          color: #1E40AF;
        }

        .atributos-title--servicio {
          color: #92400E;
        }

        .atributos-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .atributos-row-2 .form-group {
          margin-bottom: 0;
        }

        /* ----- BOTÓN PUBLICAR ----- */
        .btn-publicar {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #16A34A, #15803D);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-publicar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
        }

        .btn-publicar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ----- VISTA PREVIA DE IMAGEN ----- */
        .preview-container {
          margin-top: 12px;
          text-align: center;
        }

        .preview-label {
          font-size: 12px;
          color: #64748B;
          display: block;
          margin-bottom: 4px;
        }

        .preview-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }

        /* ----- CATEGORÍA INLINE ----- */
        .categoria-inline {
          display: flex;
          gap: 6px;
        }

        .categoria-inline-input {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid #CBD5E1;
          border-radius: 6px;
          font-size: 12px;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .categoria-inline-input:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .categoria-inline-btn {
          background: #0066FF;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s ease;
        }

        .categoria-inline-btn:hover {
          background: #0052CC;
        }

        .categoria-toggle {
          background: none;
          border: none;
          color: #0066FF;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
          transition: color 0.2s ease;
        }

        .categoria-toggle:hover {
          color: #0044CC;
        }

        /* ----- LISTA DE OFERTAS ----- */
        .ofertas-header {
          font-size: 17px;
          color: #0F172A;
          font-weight: 700;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ofertas-header .badge-count {
          font-size: 13px;
          background: #F1F5F9;
          padding: 2px 12px;
          border-radius: 20px;
          color: #64748B;
        }

        .ofertas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        /* ----- TARJETA DE OFERTA ----- */
        .oferta-card {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        .oferta-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #CBD5E1;
        }

        .oferta-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          background: #F1F5F9;
        }

        .oferta-body {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .oferta-tags {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .oferta-badge {
          display: inline-block;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 4px;
        }

        .oferta-badge--producto {
          background: #EFF6FF;
          color: #1E40AF;
        }

        .oferta-badge--servicio {
          background: #FEF3C7;
          color: #92400E;
        }

        .oferta-categoria {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          background: #F1F5F9;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .oferta-nombre {
          margin: 0 0 6px 0;
          font-size: 15px;
          color: #0F172A;
          font-weight: 700;
        }

        .oferta-precio {
          margin: 0 0 8px 0;
          color: #16A34A;
          font-size: 17px;
          font-weight: 800;
        }

        .oferta-detalle {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #475569;
        }

        .oferta-detalle strong {
          color: #0F172A;
        }

        .oferta-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
          text-align: right;
        }

        .btn-eliminar {
          background: none;
          border: none;
          color: #EF4444;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s ease;
        }

        .btn-eliminar:hover {
          color: #DC2626;
        }

        /* ----- ESTADO VACÍO ----- */
        .empty-state {
          padding: 40px;
          text-align: center;
          border: 2px dashed #CBD5E1;
          border-radius: 12px;
          color: #64748B;
          background: #F8FAFC;
        }

        .empty-state-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .empty-state-text {
          margin: 0;
          font-size: 14px;
        }

        /* ----- ESTADO DE CARGA ----- */
        .loading-state {
          text-align: center;
          padding: 40px;
          color: #64748B;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .loquevendes-container {
            margin: 16px auto;
            padding: 16px;
          }

          .loquevendes-title {
            font-size: 22px;
          }

          .classification-box {
            grid-template-columns: 1fr;
          }

          .form-row-2 {
            grid-template-columns: 1fr;
          }

          .atributos-row-2 {
            grid-template-columns: 1fr;
          }

          .form-card {
            padding: 18px;
          }

          .ofertas-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .loquevendes-container {
            margin: 12px auto;
            padding: 12px;
          }

          .loquevendes-title {
            font-size: 18px;
          }

          .loquevendes-subtitle {
            font-size: 13px;
          }

          .form-card {
            padding: 14px;
            border-radius: 12px;
          }

          .form-card-title {
            font-size: 14px;
          }

          .form-input,
          .form-select {
            font-size: 12px;
            padding: 8px 10px;
          }

          .btn-publicar {
            font-size: 13px;
            padding: 12px;
          }

          .oferta-nombre {
            font-size: 14px;
          }

          .oferta-precio {
            font-size: 15px;
          }
        }
      `}</style>

      {/* ============================================
          BOTÓN VOLVER
          ============================================ */}
      <button
        type="button"
        onClick={onVolver}
        className="btn-volver"
      >
        ⬅️ Volver al menú inicial
      </button>

      {/* ============================================
          ENCABEZADO
          ============================================ */}
      <header className="loquevendes-header">
        <h1 className="loquevendes-title">
          <span className="loquevendes-title-icon">📦</span>
          Catálogo Inteligente & Ofertas
        </h1>
        <p className="loquevendes-subtitle">
          Publica tus productos y servicios con atributos estructurados. Toda información ingresada
          queda optimizada para motores de búsqueda (Google) y asistentes de Inteligencia Artificial.
        </p>
      </header>

      {/* ============================================
          FORMULARIO
          ============================================ */}
      <div className="form-card">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">➕</span>
          Publicar Nueva Oferta o Servicio
        </h3>

        <form onSubmit={handleGuardarOferta} className="loquevendes-form">
          {/* Clasificación Base y Categoría */}
          <div className="classification-box">
            <div className="form-group">
              <label className="form-label">
                Tipo de Oferta <span className="form-label-required">*</span>
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="form-select"
              >
                <option value="product">📦 Producto Físico (SEO & Compatibilidad)</option>
                <option value="service">🛠️ Servicio Profesional (Especialista & Confianza)</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Categoría <span className="form-label-required">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarNuevaCat(!mostrarNuevaCat)}
                  className="categoria-toggle"
                >
                  {mostrarNuevaCat ? 'Cancelar' : '+ Nueva Categ.'}
                </button>
              </div>

              {!mostrarNuevaCat ? (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Seleccione categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div className="categoria-inline">
                  <input
                    type="text"
                    placeholder="Nombre categoría"
                    value={nuevaCatNombre}
                    onChange={(e) => setNuevaCatNombre(e.target.value)}
                    className="categoria-inline-input"
                  />
                  <button
                    type="button"
                    onClick={handleCrearCategoriaRapida}
                    className="categoria-inline-btn"
                  >
                    Crear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Datos Generales */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">
                Nombre del {itemType === 'product' ? 'Producto' : 'Servicio'} <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder={itemType === 'product' ? 'Ej: Filtro de aceite Renault Logan' : 'Ej: Mantenimiento Preventivo de Frenos'}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Precio Venta ($) <span className="form-label-required">*</span>
              </label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                min="0"
                placeholder="Ej: 85000"
                className="form-input"
              />
            </div>
          </div>

          {/* Atributos PRODUCTO */}
          {itemType === 'product' && (
            <div className="atributos-box atributos-box--producto">
              <h4 className="atributos-title atributos-title--producto">
                🔍 Atributos para Indexación Semántica e IA (Product Schema)
              </h4>

              <div className="form-group">
                <label className="form-label" style={{ color: '#1E3A8A' }}>
                  Palabras Clave de Búsqueda (separadas por comas)
                </label>
                <input
                  type="text"
                  value={seoSearchTerms}
                  onChange={(e) => setSeoSearchTerms(e.target.value)}
                  placeholder="Ej: Filtro Logan, Repuestos Renault, Aceite sintético"
                  className="form-input"
                />
              </div>

              <div className="atributos-row-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: '#1E3A8A' }}>
                    Marca / Modelo / Compatibilidad
                  </label>
                  <input
                    type="text"
                    value={compatibilityBrand}
                    onChange={(e) => setCompatibilityBrand(e.target.value)}
                    placeholder="Ej: Bosch / Logan Sandero 1.6"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#1E3A8A' }}>
                    Problema o Uso Principal que Resuelve
                  </label>
                  <input
                    type="text"
                    value={problemSolved}
                    onChange={(e) => setProblemSolved(e.target.value)}
                    placeholder="Ej: Protege el motor contra desgaste prematuro"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Atributos SERVICIO */}
          {itemType === 'service' && (
            <div className="atributos-box atributos-box--servicio">
              <h4 className="atributos-title atributos-title--servicio">
                🎓 Atributos de Autoridad & Perfil de Confianza (Servicio Consultivo)
              </h4>

              <div className="atributos-row-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: '#78350F' }}>
                    Profesión / Especialidad a Cargo
                  </label>
                  <input
                    type="text"
                    value={providerSpecialty}
                    onChange={(e) => setProviderSpecialty(e.target.value)}
                    placeholder="Ej: Técnico Máster / Mecánico Certificado"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#78350F' }}>
                    Acreditaciones o Años de Experiencia
                  </label>
                  <input
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="Ej: 10+ años de experiencia / Marca Certificada"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#78350F' }}>
                  Resultado Esperado o Garantía
                </label>
                <input
                  type="text"
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="Ej: Garantiza frenado seguro en carretera al 100%"
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Imagen */}
          <div className="form-group">
            <label className="form-label">
              URL de Foto Representativa
            </label>
            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              className="form-input"
            />
            {imagenUrl && (
              <div className="preview-container">
                <span className="preview-label">Vista previa:</span>
                <img
                  src={imagenUrl}
                  alt="Vista previa"
                  className="preview-image"
                  onError={(e) => {
                    e.target.src = IMAGEN_DEFAULT;
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="btn-publicar"
          >
            {guardando ? '⏳ Publicando oferta...' : '🚀 Publicar Oferta en la Vitrina'}
          </button>
        </form>

        {mensaje && (
          <div className={`loquevendes-message ${mensaje.includes('✅') || mensaje.includes('🗑️') ? 'loquevendes-message--success' : 'loquevendes-message--error'}`}>
            {mensaje}
          </div>
        )}
      </div>

      {/* ============================================
          LISTADO DE OFERTAS
          ============================================ */}
      <div>
        <h3 className="ofertas-header">
          Publicaciones Activas en tu Catálogo
          <span className="badge-count">{totalProductos}</span>
        </h3>

        {cargando ? (
          <div className="loading-state">Cargando catálogo del negocio...</div>
        ) : productos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🛒</span>
            <p className="empty-state-text">
              Tu catálogo está vacío. Publica tu primer producto o servicio profesional arriba.
            </p>
          </div>
        ) : (
          <div className="ofertas-grid">
            {productos.map((prod) => (
              <div key={prod.id} className="oferta-card">
                <img
                  src={prod.image_url || IMAGEN_DEFAULT}
                  alt={prod.name}
                  className="oferta-image"
                />
                <div className="oferta-body">
                  <div className="oferta-tags">
                    <span className={`oferta-badge ${prod.item_type === 'product' ? 'oferta-badge--producto' : 'oferta-badge--servicio'}`}>
                      {prod.item_type === 'product' ? '📦 Producto' : '🛠️ Servicio'}
                    </span>
                    {prod.categories?.name && (
                      <span className="oferta-categoria">{prod.categories.name}</span>
                    )}
                  </div>

                  <h4 className="oferta-nombre">{prod.name}</h4>
                  <p className="oferta-precio">${Number(prod.price).toLocaleString()}</p>

                  {prod.compatibility_brand && (
                    <p className="oferta-detalle">
                      <strong>Compatibilidad:</strong> {prod.compatibility_brand}
                    </p>
                  )}

                  {prod.provider_specialty && (
                    <p className="oferta-detalle">
                      <strong>Especialista:</strong> {prod.provider_specialty}
                    </p>
                  )}

                  <div className="oferta-footer">
                    <button
                      type="button"
                      onClick={() => handleEliminarOferta(prod.id)}
                      className="btn-eliminar"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}