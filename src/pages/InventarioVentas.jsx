// src/components/InventarioVentas/InventarioVentas.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function InventarioVentas({ businessId, onVolverMenu }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMessage] = useState({ text: '', type: '' });

  // Campos del formulario
  const [selectedProductId, setSelectedProductId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipoDocumento, setTipoDocumento] = useState('inventario_inicial');
  const [nit, setNit] = useState('');
  const [costo, setCosto] = useState('');
  const [valorDeVenta, setValorDeVenta] = useState('');
  const [cantidad, setCantidad] = useState('1');

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDatosInventario = async () => {
    try {
      setLoading(true);

      const { data: dataProd, error: errProd } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errProd && dataProd) {
        setProductos(dataProd);
        if (dataProd.length > 0 && !selectedProductId) {
          setSelectedProductId(dataProd[0].id);
          setValorDeVenta(dataProd[0].price || '');
          setCosto(dataProd[0].cost || '');
        }
      }

      const { data: dataMov, error: errMov } = await supabase
        .from('stock_documents')
        .select('*')
        .order('fecha', { ascending: false });

      if (!errMov && dataMov) {
        setMovimientos(dataMov);
      }
    } catch (error) {
      console.error('Error general:', error.message);
      setMessage({ text: '⚠️ Error al cargar datos: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleSelectProduct = (e) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    const prodEncontrado = productos.find(p => p.id === prodId);
    if (prodEncontrado) {
      setValorDeVenta(prodEncontrado.price || prodEncontrado.valor_de_venta || '');
      setCosto(prodEncontrado.cost || prodEncontrado.costo || '');
    }
  };

  const registrarDocumentoInventario = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setMessage({ text: '⚠️ Debes seleccionar un producto del catálogo.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentOrgId = businessId || user?.id || null;

      const payloadDoc = {
        business_id: currentOrgId,
        product_id: selectedProductId,
        fecha: new Date(fecha).toISOString(),
        tipo_documento: tipoDocumento,
        nit: nit.trim() || 'N/A',
        costo: Number(costo) || 0,
        valor_de_venta: Number(valorDeVenta) || 0,
        cantidad: Number(cantidad) || 1
      };

      const { error: errInsert } = await supabase
        .from('stock_documents')
        .insert([payloadDoc]);

      if (errInsert) throw errInsert;

      setMessage({ text: '✅ ¡Documento de inventario registrado y stock recalculado!', type: 'success' });

      setNit('');
      setCosto('');
      setValorDeVenta('');
      setCantidad('1');
      await cargarDatosInventario();
    } catch (error) {
      console.error('Error al registrar:', error.message);
      setMessage({ text: '❌ Error al registrar: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const totalProductos = useMemo(() => productos.length, [productos]);
  const totalMovimientos = useMemo(() => movimientos.length, [movimientos]);

  const productosConStock = useMemo(() => {
    return productos.filter(p => (p.stock || 0) > 0);
  }, [productos]);

  const productosAgotados = useMemo(() => {
    return productos.filter(p => (p.stock || 0) === 0);
  }, [productos]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDatosInventario();
  }, [businessId]);

  // ============================================
  // RENDERIZADO
  // ============================================
  if (loading) {
    return (
      <div className="inventario-container">
        <style jsx>{`
          .inventario-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
            font-family: 'Sora', system-ui, -apple-system, sans-serif;
            color: #0F172A;
            background: #F8FAFC;
            min-height: 100vh;
          }
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
        `}</style>
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">Cargando existencias y movimientos de inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE INVENTARIO VENTAS
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .inventario-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0F172A;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- CABECERA ----- */
        .inventario-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
          background: #FFFFFF;
          padding: 16px 24px;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          border: 1px solid #F1F5F9;
        }

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
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .btn-volver:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          border-color: #93C5FD;
        }

        .inventario-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .inventario-title-icon {
          font-size: 24px;
        }

        /* ----- MENSAJE ----- */
        .inventario-message {
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

        .inventario-message--success {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .inventario-message--error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .inventario-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .inventario-message-close:hover {
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

        /* ----- RESUMEN DE STOCK ----- */
        .stock-summary {
          background: #FFFFFF;
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .stock-summary:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .stock-summary-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 14px 0;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stock-summary-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .stock-stat {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          padding: 4px 12px;
          border-radius: 20px;
          background: #F1F5F9;
        }

        .stock-stat strong {
          color: #0F172A;
        }

        .stock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .stock-item {
          padding: 12px 16px;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .stock-item:hover {
          border-color: #CBD5E1;
          background: #FFFFFF;
        }

        .stock-item-info {
          display: flex;
          flex-direction: column;
        }

        .stock-item-name {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
        }

        .stock-item-price {
          font-size: 12px;
          color: #059669;
          font-weight: 700;
        }

        .stock-item-qty {
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 12px;
        }

        .stock-item-qty--available {
          background: #DCFCE7;
          color: #166534;
        }

        .stock-item-qty--empty {
          background: #FEE2E2;
          color: #991B1B;
        }

        /* ----- GRID DE FORMULARIO E HISTORIAL ----- */
        .inventario-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 24px;
          align-items: start;
        }

        /* ----- TARJETAS ----- */
        .inventario-card {
          background: #FFFFFF;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .inventario-card::before {
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

        .inventario-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
          border-color: #CBD5E1;
        }

        .inventario-card:hover::before {
          opacity: 1;
        }

        .inventario-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .inventario-card-title .badge-count {
          font-size: 12px;
          background: #F1F5F9;
          padding: 2px 10px;
          border-radius: 20px;
          color: #64748B;
        }

        /* ----- FORMULARIO ----- */
        .inventario-form {
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
          font-size: 11px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 6px;
        }

        .form-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 2px solid #CBD5E1;
          font-size: 13px;
          background: #F8FAFC;
          box-sizing: border-box;
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
          gap: 12px;
        }

        .form-row-2 .form-group {
          margin-bottom: 0;
        }

        /* ----- BOTÓN GUARDAR ----- */
        .btn-guardar {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #16A34A, #15803D);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .btn-guardar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
        }

        .btn-guardar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ----- LISTA DE MOVIMIENTOS ----- */
        .movimientos-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .movimientos-list::-webkit-scrollbar {
          width: 4px;
        }

        .movimientos-list::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .movimientos-list::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .movimientos-list::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }

        .movimiento-item {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .movimiento-item:hover {
          border-color: #CBD5E1;
          background: #FFFFFF;
        }

        .movimiento-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .movimiento-producto {
          font-weight: 700;
          color: #2563EB;
        }

        .movimiento-badge {
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .movimiento-badge--inventario {
          background: #E0F2FE;
          color: #0369A1;
        }

        .movimiento-badge--entrada {
          background: #DCFCE7;
          color: #166534;
        }

        .movimiento-badge--salida {
          background: #FEE2E2;
          color: #991B1B;
        }

        .movimiento-body {
          color: #64748B;
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .movimiento-prices {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-weight: 700;
          color: #0F172A;
        }

        .movimiento-prices .venta {
          color: #16A34A;
        }

        /* ----- ESTADO VACÍO ----- */
        .empty-state {
          text-align: center;
          padding: 30px;
          color: #64748B;
          font-size: 13px;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .inventario-container {
            padding: 16px;
          }

          .inventario-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 16px;
          }

          .inventario-title {
            font-size: 17px;
            justify-content: center;
          }

          .btn-volver {
            text-align: center;
            justify-content: center;
            width: 100%;
          }

          .inventario-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .form-row-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .stock-grid {
            grid-template-columns: 1fr;
          }

          .stock-summary {
            padding: 16px;
          }

          .stock-summary-stats {
            justify-content: center;
          }

          .inventario-card {
            padding: 18px;
          }
        }

        @media (max-width: 480px) {
          .inventario-container {
            padding: 12px;
          }

          .inventario-header {
            padding: 12px;
            border-radius: 16px;
          }

          .inventario-title {
            font-size: 15px;
          }

          .btn-volver {
            font-size: 12px;
            padding: 8px 14px;
          }

          .inventario-card {
            padding: 14px;
            border-radius: 16px;
          }

          .stock-item {
            padding: 10px 12px;
          }

          .stock-item-name {
            font-size: 12px;
          }

          .movimiento-item {
            padding: 10px;
          }

          .form-input,
          .form-select {
            font-size: 12px;
            padding: 8px 10px;
          }
        }
      `}</style>

      {/* ============================================
          CABECERA
          ============================================ */}
      <header className="inventario-header">
        <button
          type="button"
          onClick={onVolverMenu}
          className="btn-volver"
        >
          <span>🏠</span>
          Volver al Menú Principal
        </button>

        <h1 className="inventario-title">
          <span className="inventario-title-icon">📦</span>
          Control de Inventario y Operaciones
        </h1>
      </header>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {mensaje.text && (
        <div
          className={`inventario-message inventario-message--${mensaje.type}`}
          role="alert"
        >
          <span>{mensaje.text}</span>
          <button
            className="inventario-message-close"
            onClick={() => setMessage({ text: '', type: '' })}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================
          RESUMEN DE STOCK
          ============================================ */}
      <div className="stock-summary">
        <div className="stock-summary-title">
          <span>📊</span>
          Existencias Actuales en Catálogo
          <span className="badge-count">{totalProductos} Productos</span>
        </div>

        <div className="stock-summary-stats">
          <span className="stock-stat">
            🟢 Disponibles: <strong>{productosConStock.length}</strong>
          </span>
          <span className="stock-stat">
            🔴 Agotados: <strong>{productosAgotados.length}</strong>
          </span>
          <span className="stock-stat">
            📄 Movimientos: <strong>{totalMovimientos}</strong>
          </span>
        </div>

        <div className="stock-grid">
          {productos.map(p => {
            const tieneStock = (p.stock || 0) > 0;
            return (
              <div key={p.id} className="stock-item">
                <div className="stock-item-info">
                  <span className="stock-item-name">{p.title || p.name}</span>
                  <span className="stock-item-price">
                    ${Number(p.price || 0).toLocaleString()}
                  </span>
                </div>
                <span className={`stock-item-qty ${tieneStock ? 'stock-item-qty--available' : 'stock-item-qty--empty'}`}>
                  {tieneStock ? `${p.stock} unids.` : 'Agotado'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================
          FORMULARIO E HISTORIAL
          ============================================ */}
      <div className="inventario-grid">
        {/* ===== FORMULARIO ===== */}
        <div className="inventario-card">
          <div className="inventario-card-title">
            <span>📦</span>
            Registrar Documento
            <span className="badge-count">Inventario / Venta</span>
          </div>

          <form onSubmit={registrarDocumentoInventario} className="inventario-form">
            <div className="form-group">
              <label className="form-label">
                Seleccionar Producto o Servicio <span className="form-label-required">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={handleSelectProduct}
                required
                className="form-select"
              >
                <option value="">-- Seleccione un producto o servicio --</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.name} — Stock: {p.stock || 0} unids.
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Fecha <span className="form-label-required">*</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tipo de Documento <span className="form-label-required">*</span>
                </label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="form-select"
                >
                  <option value="inventario_inicial">Inventario Inicial</option>
                  <option value="entrada">Entrada de Mercancía (+)</option>
                  <option value="salida_venta">Salida / Venta (-)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                NIT / Cédula del Proveedor o Tercero
              </label>
              <input
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="Ej: 900123456-7"
                className="form-input"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Costo Unitario ($) <span className="form-label-required">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Valor de Venta ($) <span className="form-label-required">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorDeVenta}
                  onChange={(e) => setValorDeVenta(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Cantidad <span className="form-label-required">*</span>
              </label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-guardar"
            >
              {saving ? '⏳ Registrando...' : '💾 Guardar e Integrar con Módulos'}
            </button>
          </form>
        </div>

        {/* ===== HISTORIAL ===== */}
        <div className="inventario-card">
          <div className="inventario-card-title">
            <span>📋</span>
            Historial de Documentos
            <span className="badge-count">{totalMovimientos}</span>
          </div>

          {movimientos.length === 0 ? (
            <div className="empty-state">
              No hay documentos de inventario registrados todavía.
            </div>
          ) : (
            <div className="movimientos-list">
              {movimientos.map(mov => {
                const prod = productos.find(p => p.id === mov.product_id);
                const tipoClase = {
                  inventario_inicial: 'movimiento-badge--inventario',
                  entrada: 'movimiento-badge--entrada',
                  salida_venta: 'movimiento-badge--salida'
                }[mov.tipo_documento] || 'movimiento-badge--inventario';

                const tipoLabel = {
                  inventario_inicial: 'INVENTARIO INICIAL',
                  entrada: 'ENTRADA (+)',
                  salida_venta: 'SALIDA (-)'
                }[mov.tipo_documento] || mov.tipo_documento?.replace('_', ' ').toUpperCase();

                return (
                  <div key={mov.id} className="movimiento-item">
                    <div className="movimiento-header">
                      <span className="movimiento-producto">
                        {prod?.title || prod?.name || 'Producto del Catálogo'}
                      </span>
                      <span className={`movimiento-badge ${tipoClase}`}>
                        {tipoLabel}
                      </span>
                    </div>
                    <div className="movimiento-body">
                      <span>📅 {mov.fecha ? new Date(mov.fecha).toLocaleDateString() : 'N/A'}</span>
                      <span>NIT: {mov.nit || 'N/A'}</span>
                      <span>Cant: {mov.cantidad}</span>
                    </div>
                    <div className="movimiento-prices">
                      <span>Costo: ${Number(mov.costo || 0).toLocaleString()}</span>
                      <span className="venta">Venta: ${Number(mov.valor_de_venta || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}