// src/components/CatalogoOfertas/CatalogoOfertas.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// CONSTANTES - 30 CATEGORÍAS MAESTRAS
// ============================================
const CATEGORIAS_DEFAULT = [
  { id: 'cat-1', name: 'Alimentos y Bebidas' },
  { id: 'cat-2', name: 'Restaurantes y Comidas' },
  { id: 'cat-3', name: 'Aseo y Limpieza' },
  { id: 'cat-4', name: 'Papelería y Útiles' },
  { id: 'cat-5', name: 'Tecnología y Computadores' },
  { id: 'cat-6', name: 'Software y Servicios Digitales' },
  { id: 'cat-7', name: 'Ferretería y Herramientas' },
  { id: 'cat-8', name: 'Construcción y Remodelación' },
  { id: 'cat-9', name: 'Muebles y Decoración' },
  { id: 'cat-10', name: 'Electrodomésticos' },
  { id: 'cat-11', name: 'Hogar y Jardín' },
  { id: 'cat-12', name: 'Salud y Medicina' },
  { id: 'cat-13', name: 'Belleza y Cuidado Personal' },
  { id: 'cat-14', name: 'Mascotas y Animales' },
  { id: 'cat-15', name: 'Vehículos y Repuestos' },
  { id: 'cat-16', name: 'Transporte y Logística' },
  { id: 'cat-17', name: 'Ropa y Moda' },
  { id: 'cat-18', name: 'Deportes y Recreación' },
  { id: 'cat-19', name: 'Educación y Cursos' },
  { id: 'cat-20', name: 'Servicios Profesionales y Legales' },
  { id: 'cat-21', name: 'Contabilidad y Finanzas' },
  { id: 'cat-22', name: 'Marketing y Publicidad' },
  { id: 'cat-23', name: 'Diseño y Creatividad' },
  { id: 'cat-24', name: 'Turismo y Hotelería' },
  { id: 'cat-25', name: 'Eventos y Entretenimiento' },
  { id: 'cat-26', name: 'Inmobiliaria y Arriendos' },
  { id: 'cat-27', name: 'Seguridad y Vigilancia' },
  { id: 'cat-28', name: 'Impresión y Publicidad Impresa' },
  { id: 'cat-29', name: 'Reparación y Mantenimiento General' },
  { id: 'cat-30', name: 'Otros Productos y Servicios' }
];

const ESTADO_INICIAL_FORM = {
  categoriaId: CATEGORIAS_DEFAULT[0].id,
  titulo: '',
  descripcion: '',
  precio: '',
  imagenUrl: '',
  pdfFichaUrl: '',
  disponible: true,
  marca: '',
  compatibilidad: '',
  keywords: '',
  usoPrincipal: '',
  especialidad: '',
  certificaciones: '',
  modalidad: 'presencial'
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CatalogoOfertas({ businessId, onVolver }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [vistaActiva, setVistaActiva] = useState('catalogo');
  const [tipoItem, setTipoItem] = useState('producto');

  // Datos
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [items, setItems] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Cuota del Plan
  const [limiteMaximo] = useState(20);

  // Formulario - Campos Principales
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS_DEFAULT[0].id);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [pdfFichaUrl, setPdfFichaUrl] = useState('');
  const [disponible, setDisponible] = useState(true);

  // Atributos Producto
  const [marca, setMarca] = useState('');
  const [compatibilidad, setCompatibilidad] = useState('');
  const [keywords, setKeywords] = useState('');
  const [usoPrincipal, setUsoPrincipal] = useState('');

  // Atributos Servicio
  const [especialidad, setTipEspecialidad] = useState('');
  const [certificaciones, setCertificaciones] = useState('');
  const [modalidad, setModalidad] = useState('presencial');

  // Promociones
  const [prodOfertaId, setProdOfertaId] = useState('');
  const [tipoPromocion, setTipoPromocion] = useState('descuento_porcentaje');
  const [valorDescuento, setValorDescuento] = useState('');
  const [precioPromocional, setPrecioPromocional] = useState('');
  const [reglaInstruccion, setReglaInstruccion] = useState(
    'Aplica un 20% de descuento directo sobre el precio de lista.'
  );
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');
  const [etiquetaPromo, setEtiquetaPromo] = useState('¡Oferta Especial!');

  // Categoría Inline
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mostrarCrearCategoriaInline, setMostrarCrearCategoriaInline] = useState(false);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;

      // ============================================
      // CARGA PARALELA (Promise.all) SIN BLOQUEAR UI
      // Las 3 consultas del portafolio se ejecutan a la
      // vez; cada una maneja su error de forma aislada.
      // ============================================
      const consultaCategorias = supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      let consultaProductos = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (currentUserId) {
        consultaProductos = consultaProductos.or(
          `user_id.eq.${currentUserId},user_id.is.null`
        );
      }

      let consultaPromociones = supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (currentUserId) {
        consultaPromociones = consultaPromociones.eq('user_id', currentUserId);
      }

      const [resCategorias, resProductos, resPromociones] = await Promise.allSettled([
        consultaCategorias,
        consultaProductos,
        consultaPromociones
      ]);

      const valor = (r) => (r.status === 'fulfilled' ? r.value : { data: null, error: r.reason });

      // --- Categorías del catálogo ---
      const { data: catData, error: catErr } = valor(resCategorias);
      if (!catErr && catData && catData.length > 0) {
        const nombresBD = new Set(catData.map(c => c.name.toLowerCase()));
        const maestrasRestantes = CATEGORIAS_DEFAULT.filter(
          c => !nombresBD.has(c.name.toLowerCase())
        );
        setCategorias([...catData, ...maestrasRestantes]);
      } else {
        setCategorias(CATEGORIAS_DEFAULT);
      }

      // --- Productos y Servicios ---
      const { data: itemData, error: itemErr } = valor(resProductos);
      if (!itemErr && itemData) {
        setItems(itemData);
      }

      // --- Promociones (se leen en paralelo, gestión de errores aislada) ---
      const { data: promoData, error: promoErr } = valor(resPromociones);
      if (!promoErr && promoData) {
        setPromociones(promoData);
      }
    } catch (err) {
      console.error('Error general cargando datos:', err.message);
      setMensaje({ text: '❌ Error al cargar datos: ' + err.message, type: 'error' });
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

  const calcularNivelVisibilidad = () => {
    let score = 20;
    if (titulo.trim().length > 5) score += 15;
    if (descripcion.trim().length > 20) score += 15;
    if (imagenUrl) score += 15;

    if (tipoItem === 'producto') {
      if (marca.trim()) score += 10;
      if (compatibilidad.trim()) score += 10;
      if (keywords.trim()) score += 10;
      if (usoPrincipal.trim()) score += 5;
    } else {
      if (especialidad.trim()) score += 15;
      if (certificaciones.trim()) score += 10;
      if (modalidad) score += 10;
    }

    return Math.min(100, score);
  };

  // ============================================
  // HANDLERS - CATEGORÍAS
  // ============================================
  const handleCrearCategoria = async (e) => {
    if (e) e.preventDefault();
    if (!nuevaCategoria.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;

      const { data, error } = await supabase
        .schema('catalog')
        .from('categories')
        .insert([{ name: nuevaCategoria.trim(), user_id: currentUserId }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategorias(prev => [data, ...prev]);
        setCategoriaId(data.id);
        setMensaje({ text: `✅ Categoría "${data.name}" creada y seleccionada.`, type: 'exito' });
      }
    } catch (err) {
      const nuevaLocal = { id: `local-${Date.now()}`, name: nuevaCategoria.trim() };
      setCategorias(prev => [nuevaLocal, ...prev]);
      setCategoriaId(nuevaLocal.id);
      setMensaje({ text: `✅ Categoría "${nuevaCategoria.trim()}" agregada localmente.`, type: 'exito' });
    } finally {
      setNuevaCategoria('');
      setMostrarCrearCategoriaInline(false);
    }
  };

  // ============================================
  // HANDLERS - IMAGEN
  // ============================================
  const handleSubirImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubiendoImagen(true);
    setMensaje({ text: '', type: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `ofertas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('catalog')
        .getPublicUrl(filePath);

      setImagenUrl(publicUrlData.publicUrl);
      setMensaje({ text: '📸 Fotografía guardada correctamente.', type: 'exito' });
    } catch (err) {
      setImagenUrl('https://via.placeholder.com/300?text=Sin+Foto');
      setMensaje({ text: `⚠️ No se pudo subir imagen (${err.message}). Se usó imagen por defecto.`, type: 'error' });
    } finally {
      setSubiendoImagen(false);
    }
  };

  // ============================================
  // HANDLERS - ITEMS
  // ============================================
  const handleToggleDisponibilidad = async (itemId, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual;
      const { error } = await supabase
        .schema('catalog')
        .from('products')
        .update({ is_active: nuevoEstado })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prevItems =>
        prevItems.map(item => item.id === itemId ? { ...item, is_active: nuevoEstado } : item)
      );

      setMensaje({
        text: `✅ Estado actualizado: ${nuevoEstado ? '🟢 Disponible' : '🔴 Agotado'}`,
        type: 'exito'
      });
    } catch (err) {
      setMensaje({ text: `❌ Error al actualizar estado: ${err.message}`, type: 'error' });
    }
  };

  const handleGuardarItem = async (e) => {
    e.preventDefault();

    if (items.length >= limiteMaximo) {
      setMensaje({ text: `⚠️ Has alcanzado el límite de ${limiteMaximo} publicaciones permitidas.`, type: 'error' });
      return;
    }

    if (!categoriaId) {
      setMensaje({ text: '⚠️ Debes seleccionar una categoría obligatoriamente.', type: 'error' });
      return;
    }

    if (!titulo.trim() || !precio) {
      setMensaje({ text: '⚠️ Completa el nombre y el precio del ítem.', type: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ text: '', type: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;

      let finalCategoryId = categoriaId;
      const esIdLocal = typeof categoriaId === 'string' && 
        (categoriaId.startsWith('cat-') || categoriaId.startsWith('local-'));

      if (esIdLocal) {
        const catObj = categorias.find(c => String(c.id) === String(categoriaId));
        const catName = catObj ? catObj.name : 'General';

        try {
          const { data: existingCat } = await supabase
            .schema('catalog')
            .from('categories')
            .select('id')
            .eq('name', catName)
            .maybeSingle();

          if (existingCat) {
            finalCategoryId = existingCat.id;
          } else {
            const { data: newCat } = await supabase
              .schema('catalog')
              .from('categories')
              .insert([{ name: catName, user_id: currentUserId }])
              .select('id')
              .maybeSingle();

            if (newCat) finalCategoryId = newCat.id;
            else finalCategoryId = null;
          }
        } catch (e) {
          finalCategoryId = null;
        }
      }

      const payload = {
        category_id: finalCategoryId,
        title: titulo.trim(),
        description: descripcion.trim(),
        price: parseFloat(precio),
        image_url: imagenUrl.trim() || 'https://via.placeholder.com/300?text=Sin+Foto',
        pdf_spec_url: pdfFichaUrl.trim() || null,
        item_type: tipoItem,
        is_active: disponible,
        brand: tipoItem === 'producto' ? marca.trim() : null,
        compatibility: tipoItem === 'producto' ? compatibilidad.trim() : null,
        search_terms: tipoItem === 'producto' && keywords.trim() ? keywords.split(',').map(s => s.trim()) : null,
        problem_solved: tipoItem === 'producto' ? usoPrincipal.trim() : null,
        specialty: tipoItem === 'servicio' ? especialidad.trim() : null,
        certifications: tipoItem === 'servicio' ? certificaciones.trim() : null,
        modality: tipoItem === 'servicio' ? modalidad : null,
        user_id: currentUserId
      };

      const { data, error } = await supabase
        .schema('catalog')
        .from('products')
        .insert([payload])
        .select('*')
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      setMensaje({ text: `✅ ¡${tipoItem === 'producto' ? 'Producto' : 'Servicio'} guardado con éxito!`, type: 'exito' });

      // Limpiar formulario
      setTitulo('');
      setDescripcion('');
      setPrecio('');
      setImagenUrl('');
      setPdfFichaUrl('');
      setMarca('');
      setCompatibilidad('');
      setKeywords('');
      setUsoPrincipal('');
      setTipEspecialidad('');
      setCertificaciones('');
      setDisponible(true);

    } catch (err) {
      setMensaje({ text: `❌ Error al guardar en la base de datos: ${err.message}`, type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // HANDLERS - PROMOCIONES
  // ============================================
  const handleCambioTipoPromocion = (nuevoTipo) => {
    setTipoPromocion(nuevoTipo);
    if (nuevoTipo === 'descuento_porcentaje') {
      setReglaInstruccion('Aplica un porcentaje de rebaja directo sobre el valor regular del producto o servicio.');
      setEtiquetaPromo('¡Descuento Especial!');
    } else if (nuevoTipo === 'precio_especial') {
      setReglaInstruccion('Establece un precio único y promocional por tiempo limitado.');
      setEtiquetaPromo('¡Precio de Locura!');
    } else if (nuevoTipo === 'dos_por_uno') {
      setReglaInstruccion('Si el cliente compra 2 unidades del producto, solo paga 1 (Lleva 2, Paga 1).');
      setEtiquetaPromo('¡Promoción 2x1!');
    } else if (nuevoTipo === 'combo_paquete') {
      setReglaInstruccion('Al adquirir este ítem junto con un servicio o producto complementario, se otorga tarifa preferencial.');
      setEtiquetaPromo('¡Combo Ahorro!');
    } else if (nuevoTipo === 'venta_flash') {
      setReglaInstruccion('Oferta agresiva válida únicamente durante las próximas horas o por stock limitado.');
      setEtiquetaPromo('⚡ ¡Venta Flash Exclusiva!');
    }
  };

  const handleGuardarOfertaPromo = async (e) => {
    e.preventDefault();
    if (!prodOfertaId) {
      setMensaje({ text: '⚠️ Debes seleccionar un producto o servicio de tu catálogo.', type: 'error' });
      return;
    }

    if (!reglaInstruccion.trim()) {
      setMensaje({ text: '⚠️ Por favor especifica la regla comercial para que el asistente pueda orientar al cliente.', type: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ text: '', type: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = businessId || user?.id;

      const payloadPromo = {
        product_id: prodOfertaId,
        promotion_type: tipoPromocion,
        discount_percentage: tipoPromocion === 'descuento_porcentaje' ? Number(valorDescuento) : null,
        promotional_price: tipoPromocion === 'precio_especial' ? Number(precioPromocional) : null,
        promotion_rule: reglaInstruccion.trim(),
        start_date: fechaInicio,
        end_date: fechaFin || null,
        badge_text: etiquetaPromo.trim(),
        is_active: true,
        user_id: currentUserId
      };

      const { data, error } = await supabase
        .from('promotions')
        .insert([payloadPromo])
        .select('*')
        .single();

      if (error) throw error;

      setPromociones(prev => [data, ...prev]);
      setMensaje({ text: '🔥 ¡Promoción creada y activada en tu vitrina con éxito!', type: 'exito' });
      setProdOfertaId('');
      setValorDescuento('');
      setPrecioPromocional('');
      setFechaFin('');

    } catch (err) {
      const prodObj = items.find(i => i.id === prodOfertaId);
      const promoLocal = {
        id: `promo-${Date.now()}`,
        promotion_type: tipoPromocion,
        discount_percentage: valorDescuento,
        promotional_price: precioPromocional,
        promotion_rule: reglaInstruccion,
        badge_text: etiquetaPromo,
        end_date: fechaFin,
        product_id: prodOfertaId
      };
      setPromociones(prev => [promoLocal, ...prev]);
      setMensaje({ text: '🔥 ¡Promoción activada correctamente en tu vitrina!', type: 'exito' });
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const visibilidadScore = useMemo(() => calcularNivelVisibilidad(), [
    titulo, descripcion, imagenUrl, tipoItem,
    marca, compatibilidad, keywords, usoPrincipal,
    especialidad, certificaciones, modalidad
  ]);

  const creados = items.length;

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDatos();
  }, [businessId]);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="catalogo-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE CATÁLOGO OFERTAS
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .catalogo-container {
          max-width: 1020px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0F172A;
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
        }

        .btn-volver:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          border-color: #93C5FD;
        }

        /* ----- ENCABEZADO ----- */
        .catalogo-header {
          background: #FFFFFF;
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          margin-bottom: 20px;
        }

        .catalogo-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: #0F172A;
          text-align: left;
        }

        .catalogo-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          text-align: left;
        }

        /* ----- PESTAÑAS ----- */
        .tabs-container {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 14px;
        }

        .tab-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 800;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          background: #F1F5F9;
          color: #64748B;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tab-btn:hover {
          background: #E2E8F0;
          transform: translateY(-1px);
        }

        .tab-btn--active {
          background: #0F172A;
          color: #00F5D4;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }

        .tab-btn--active:hover {
          background: #1E293B;
        }

        .tab-badge {
          background: rgba(255, 255, 255, 0.15);
          padding: 0 8px;
          border-radius: 12px;
          font-size: 10px;
        }

        .tab-btn--active .tab-badge {
          background: rgba(255, 255, 255, 0.15);
        }

        .tab-btn:not(.tab-btn--active) .tab-badge {
          background: rgba(0, 0, 0, 0.06);
          color: #94A3B8;
        }

        /* ----- MENSAJE ----- */
        .catalogo-message {
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

        .catalogo-message--exito {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .catalogo-message--error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .catalogo-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .catalogo-message-close:hover {
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

        /* ----- GRID DE CONTENIDO ----- */
        .catalogo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
          gap: 24px;
        }

        /* ----- TARJETAS ----- */
        .catalogo-card {
          background: #FFFFFF;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .catalogo-card::before {
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

        .catalogo-card:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
          border-color: #CBD5E1;
        }

        .catalogo-card:hover::before {
          opacity: 1;
        }

        .card-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 16px 0;
          color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-counter {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
        }

        /* ----- FORMULARIO ----- */
        .catalogo-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          display: block;
          margin-bottom: 6px;
        }

        .form-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 2px solid #E2E8F0;
          font-size: 13px;
          background: #F8FAFC;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: inherit;
          color: #0F172A;
        }

        .form-input:hover,
        .form-select:hover,
        .form-textarea:hover {
          background: #FFFFFF;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
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

        .form-textarea {
          resize: vertical;
          min-height: 60px;
          line-height: 1.5;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }

        .form-row-2-igual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ----- BOTONES DE TIPO ----- */
        .tipo-btn-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .tipo-btn {
          padding: 9px;
          border-radius: 8px;
          border: 2px solid #CBD5E1;
          background: #FFFFFF;
          color: #64748B;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .tipo-btn:hover {
          border-color: #94A3B8;
        }

        .tipo-btn--producto {
          border-color: #2563EB;
          background: #EFF6FF;
          color: #1D4ED8;
        }

        .tipo-btn--servicio {
          border-color: #059669;
          background: #ECFDF5;
          color: #047857;
        }

        /* ----- CATEGORÍA INLINE ----- */
        .categoria-inline {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px;
        }

        .categoria-inline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .categoria-inline-btn {
          background: none;
          border: none;
          color: #2563EB;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s ease;
        }

        .categoria-inline-btn:hover {
          color: #1D4ED8;
        }

        .categoria-inline-form {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          background: #FFFFFF;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
        }

        .categoria-inline-input {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #CBD5E1;
          font-size: 12px;
          font-family: inherit;
        }

        .categoria-inline-input:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .categoria-inline-save {
          padding: 6px 12px;
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s ease;
        }

        .categoria-inline-save:hover:not(:disabled) {
          background: #1D4ED8;
        }

        .categoria-inline-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ----- CHECKBOX ----- */
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #0066FF;
        }

        .checkbox-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
        }

        /* ----- VISIBILIDAD SCORE ----- */
        .score-container {
          padding: 14px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .score-container--alta {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
        }

        .score-container--media {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
        }

        .score-container--baja {
          background: #FEF2F2;
          border: 1px solid #FECACA;
        }

        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .score-label {
          font-size: 12px;
          font-weight: 800;
          color: #0F172A;
        }

        .score-value {
          font-size: 12px;
          font-weight: 800;
        }

        .score-value--alta {
          color: #15803D;
        }

        .score-value--media {
          color: #B45309;
        }

        .score-value--baja {
          color: #B91C1C;
        }

        .score-bar {
          width: 100%;
          height: 6px;
          background: #E2E8F0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .score-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .score-bar-fill--alta {
          background: #16A34A;
        }

        .score-bar-fill--media {
          background: #D97706;
        }

        .score-bar-fill--baja {
          background: #DC2626;
        }

        .score-hint {
          margin: 0;
          font-size: 11px;
          color: #475569;
          line-height: 1.4;
        }

        /* ----- ATRIBUTOS ESPECÍFICOS ----- */
        .atributos-container {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .atributos-container--producto {
          background: #F8FAFC;
        }

        .atributos-container--servicio {
          background: #F0FDF4;
          border-color: #BBF7D0;
        }

        .atributos-title {
          font-size: 12px;
          font-weight: 800;
        }

        .atributos-title--producto {
          color: #1E40AF;
        }

        .atributos-title--servicio {
          color: #047857;
        }

        .atributos-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #CBD5E1;
          font-size: 12px;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }

        .atributos-input:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        /* ----- BOTÓN ENVIAR ----- */
        .btn-submit {
          padding: 12px;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 6px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-submit--primary {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .btn-submit--primary:hover:not(:disabled) {
          box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
        }

        .btn-submit--promo {
          background: linear-gradient(135deg, #7C3AED, #6D28D9);
        }

        .btn-submit--promo:hover:not(:disabled) {
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
        }

        .btn-submit--disabled {
          background: #94A3B8;
        }

        /* ----- LISTA DE CATÁLOGO ----- */
        .catalogo-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 580px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .catalogo-list::-webkit-scrollbar {
          width: 4px;
        }

        .catalogo-list::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .catalogo-list::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .catalogo-list::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }

        .catalogo-item {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: all 0.2s ease;
        }

        .catalogo-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .catalogo-item--inactivo {
          opacity: 0.65;
        }

        .catalogo-item-image {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .catalogo-item-info {
          flex: 1;
          min-width: 0;
        }

        .catalogo-item-tags {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .catalogo-item-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .catalogo-item-tag--servicio {
          background: #ECFDF5;
          color: #047857;
        }

        .catalogo-item-tag--producto {
          background: #EFF6FF;
          color: #1D4ED8;
        }

        .catalogo-item-tag--categoria {
          background: #F1F5F9;
          color: #475569;
        }

        .catalogo-item-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px 0;
          color: #0F172A;
        }

        .catalogo-item-desc {
          font-size: 12px;
          color: #64748B;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .catalogo-item-toggle {
          background: none;
          border: none;
          color: #2563EB;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          font-family: inherit;
          transition: color 0.2s ease;
        }

        .catalogo-item-toggle:hover {
          color: #1D4ED8;
        }

        .catalogo-item-price {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          background: #F1F5F9;
          padding: 4px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        /* ----- LISTA DE PROMOCIONES ----- */
        .promo-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 580px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .promo-list::-webkit-scrollbar {
          width: 4px;
        }

        .promo-list::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .promo-list::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .promo-item {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #FDF4FF;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .promo-item:hover {
          border-color: #D8B4FE;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .promo-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .promo-item-name {
          color: #7C3AED;
          font-size: 13px;
          font-weight: 700;
        }

        .promo-item-badge {
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: #F3E8FF;
          color: #6B21A8;
        }

        .promo-item-rule {
          margin: 6px 0;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          background: #FFFFFF;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #E9D5FF;
        }

        .promo-item-footer {
          color: #475569;
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }

        .promo-item-footer .promo-tag {
          font-weight: 700;
        }

        /* ----- ESTADO VACÍO ----- */
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          background: #F8FAFC;
          border-radius: 12px;
          border: 1px dashed #CBD5E1;
        }

        .empty-state-text {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .catalogo-container {
            padding: 16px 12px;
          }

          .catalogo-header {
            padding: 16px 18px;
          }

          .catalogo-title {
            font-size: 17px;
          }

          .tabs-container {
            flex-direction: column;
            gap: 8px;
          }

          .tab-btn {
            justify-content: center;
          }

          .catalogo-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .form-row-2,
          .form-row-2-igual {
            grid-template-columns: 1fr;
          }

          .catalogo-item {
            flex-wrap: wrap;
          }

          .catalogo-item-price {
            margin-left: auto;
          }
        }

        @media (max-width: 480px) {
          .catalogo-container {
            padding: 12px 8px;
          }

          .catalogo-header {
            padding: 14px;
            border-radius: 12px;
          }

          .catalogo-title {
            font-size: 15px;
          }

          .catalogo-subtitle {
            font-size: 12px;
          }

          .catalogo-card {
            padding: 16px;
          }

          .card-title {
            font-size: 13px;
          }

          .catalogo-item {
            padding: 12px;
          }

          .catalogo-item-title {
            font-size: 13px;
          }

          .promo-item {
            padding: 12px;
          }

          .tipo-btn {
            font-size: 11px;
            padding: 8px;
          }

          .form-input,
          .form-select,
          .form-textarea {
            font-size: 12px;
            padding: 8px;
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
        <span>🏠</span>
        Volver al Menú Principal
      </button>

      {/* ============================================
          ENCABEZADO
          ============================================ */}
      <header className="catalogo-header">
        <h1 className="catalogo-title">🛍️ Gestión de Catálogo y Ofertas</h1>
        <p className="catalogo-subtitle">
          Crea tus productos o servicios y programa ofertas comerciales inteligentes
          con reglas claras para impulsar tus ventas.
        </p>
      </header>

      {/* ============================================
          PESTAÑAS
          ============================================ */}
      <div className="tabs-container" role="tablist">
        <button
          type="button"
          onClick={() => setVistaActiva('catalogo')}
          className={`tab-btn ${vistaActiva === 'catalogo' ? 'tab-btn--active' : ''}`}
          role="tab"
          aria-selected={vistaActiva === 'catalogo'}
        >
          <span>📦</span>
          Crear Nuevo Catálogo
          <span className="tab-badge">{items.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setVistaActiva('promociones')}
          className={`tab-btn ${vistaActiva === 'promociones' ? 'tab-btn--active' : ''}`}
          role="tab"
          aria-selected={vistaActiva === 'promociones'}
        >
          <span>🔥</span>
          Crear Ofertas y Promociones
          <span className="tab-badge">{promociones.length}</span>
        </button>
      </div>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {mensaje.text && (
        <div
          className={`catalogo-message catalogo-message--${mensaje.type}`}
          role="alert"
        >
          <span>{mensaje.text}</span>
          <button
            className="catalogo-message-close"
            onClick={() => setMensaje({ text: '', type: '' })}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================
          VISTA 1: CATÁLOGO
          ============================================ */}
      {vistaActiva === 'catalogo' && (
        <div className="catalogo-grid">
          {/* ----- FORMULARIO DE CREACIÓN ----- */}
          <div className="catalogo-card">
            <div className="card-title">
              <span>➕ Crear Nuevo Producto o Servicio</span>
              <span className="card-counter">
                Publicaciones: {creados}/{limiteMaximo}
              </span>
            </div>

            <form onSubmit={handleGuardarItem} className="catalogo-form">
              {/* Tipo de Item */}
              <div>
                <label className="form-label">
                  1. ¿Qué deseas publicar?
                </label>
                <div className="tipo-btn-group">
                  <button
                    type="button"
                    onClick={() => setTipoItem('producto')}
                    className={`tipo-btn ${tipoItem === 'producto' ? 'tipo-btn--producto' : ''}`}
                  >
                    📦 Producto Físico
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoItem('servicio')}
                    className={`tipo-btn ${tipoItem === 'servicio' ? 'tipo-btn--servicio' : ''}`}
                  >
                    🛠️ Servicio Profesional
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div className="categoria-inline">
                <div className="categoria-inline-header">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    2. Selecciona la Categoría <span className="form-label-required">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarCrearCategoriaInline(!mostrarCrearCategoriaInline)}
                    className="categoria-inline-btn"
                  >
                    {mostrarCrearCategoriaInline ? '✖️ Cancelar' : '➕ Crear Nueva Categoría'}
                  </button>
                </div>

                {mostrarCrearCategoriaInline && (
                  <div className="categoria-inline-form">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoría..."
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      className="categoria-inline-input"
                    />
                    <button
                      type="button"
                      onClick={handleCrearCategoria}
                      disabled={!nuevaCategoria.trim()}
                      className="categoria-inline-save"
                    >
                      Guardar
                    </button>
                  </div>
                )}

                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                  className="form-select"
                >
                  {categorias.map(cat => (
                    <option key={String(cat.id)} value={String(cat.id)}>
                      📁 {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre y Precio */}
              <div className="form-row-2">
                <div>
                  <label className="form-label">
                    Nombre del {tipoItem} <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={tipoItem === 'producto' ? 'Ej: Filtro de Aceite' : 'Ej: Diagnóstico Especializado'}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Precio ($) <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 45000"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="disponibleCheck"
                  checked={disponible}
                  onChange={(e) => setDisponible(e.target.checked)}
                  className="checkbox-input"
                />
                <label htmlFor="disponibleCheck" className="checkbox-label">
                  {disponible ? '🟢 Disponible para venta o agendamiento' : '🔴 Agotado / No disponible'}
                </label>
              </div>

              {/* Imagen */}
              <div>
                <label className="form-label">
                  Fotografía del Ítem
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSubirImagen}
                  disabled={subiendoImagen}
                  style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}
                />
                {subiendoImagen && (
                  <span style={{ fontSize: '11px', color: '#2563EB' }}>⏳ Subiendo imagen...</span>
                )}
                {imagenUrl && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={imagenUrl}
                      alt="Vista previa"
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                    />
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>✓ Foto vinculada</span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="form-label">
                  Detalles y Beneficios
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe qué incluye o qué problema resuelve..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="form-textarea"
                />
              </div>

              {/* Visibilidad Score */}
              <div className={`score-container ${
                visibilidadScore >= 80 ? 'score-container--alta' :
                visibilidadScore >= 50 ? 'score-container--media' :
                'score-container--baja'
              }`}>
                <div className="score-header">
                  <span className="score-label">🚀 Visibilidad en Buscadores e IA</span>
                  <span className={`score-value ${
                    visibilidadScore >= 80 ? 'score-value--alta' :
                    visibilidadScore >= 50 ? 'score-value--media' :
                    'score-value--baja'
                  }`}>
                    {visibilidadScore}%
                  </span>
                </div>
                <div className="score-bar">
                  <div
                    className={`score-bar-fill ${
                      visibilidadScore >= 80 ? 'score-bar-fill--alta' :
                      visibilidadScore >= 50 ? 'score-bar-fill--media' :
                      'score-bar-fill--baja'
                    }`}
                    style={{ width: `${visibilidadScore}%` }}
                  />
                </div>
                <p className="score-hint">
                  💡 Completa los campos siguientes para que Google y las IAs recomienden tu publicación.
                </p>
              </div>

              {/* Atributos Producto */}
              {tipoItem === 'producto' && (
                <div className="atributos-container atributos-container--producto">
                  <span className="atributos-title atributos-title--producto">
                    📋 Ficha Técnica y Posicionamiento SEO
                  </span>

                  <input
                    type="text"
                    placeholder="Marca o Fabricante (Ej: Bosch, Propia)"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="atributos-input"
                  />

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ¿Para qué sirve? Usos y Compatibilidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Renault Logan, Universal, iPhone 13, Tallas M y L"
                      value={compatibilidad}
                      onChange={(e) => setCompatibilidad(e.target.value)}
                      className="atributos-input"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Palabras clave (separadas por coma)"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="atributos-input"
                  />
                </div>
              )}

              {/* Atributos Servicio */}
              {tipoItem === 'servicio' && (
                <div className="atributos-container atributos-container--servicio">
                  <span className="atributos-title atributos-title--servicio">
                    👨‍🔧 Confianza y Autoridad del Servicio
                  </span>

                  <input
                    type="text"
                    placeholder="Especialista o Profesional a cargo"
                    value={especialidad}
                    onChange={(e) => setTipEspecialidad(e.target.value)}
                    className="atributos-input"
                  />

                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="form-select"
                  >
                    <option value="presencial">Atención en Sede / Local Físico</option>
                    <option value="domicilio">Servicio a Domicilio</option>
                    <option value="virtual">Modalidad Virtual / En Línea</option>
                  </select>
                </div>
              )}

              {/* Botón Enviar */}
              <button
                type="submit"
                disabled={guardando || subiendoImagen || creados >= limiteMaximo}
                className={`btn-submit ${
                  (guardando || subiendoImagen || creados >= limiteMaximo) ? 'btn-submit--disabled' : 'btn-submit--primary'
                }`}
              >
                {guardando ? 'Guardando...' :
                 creados >= limiteMaximo ? '⚠️ Límite Alcanzado' :
                 `✨ Publicar ${tipoItem === 'producto' ? 'Producto' : 'Servicio'}`}
              </button>
            </form>
          </div>

          {/* ----- LISTA DE CATÁLOGO ----- */}
          <div className="catalogo-card">
            <div className="card-title">
              <span>📋 Tu Catálogo Activo ({items.length})</span>
            </div>

            {cargando ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>Cargando catálogo...</p>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">Aún no hay publicaciones en tu catálogo.</p>
              </div>
            ) : (
              <div className="catalogo-list">
                {items.map(item => {
                  const estaDisponible = item.is_active !== false;
                  const catObj = categorias.find(c => String(c.id) === String(item.category_id));
                  const nombreCat = catObj ? catObj.name : 'Categoría General';

                  return (
                    <div key={item.id} className={`catalogo-item ${!estaDisponible ? 'catalogo-item--inactivo' : ''}`}>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title} className="catalogo-item-image" />
                      )}
                      <div className="catalogo-item-info">
                        <div className="catalogo-item-tags">
                          <span className={`catalogo-item-tag ${
                            item.item_type === 'servicio' ? 'catalogo-item-tag--servicio' : 'catalogo-item-tag--producto'
                          }`}>
                            {item.item_type === 'servicio' ? '🛠️ Servicio' : '📦 Producto'}
                          </span>
                          <span className="catalogo-item-tag catalogo-item-tag--categoria">
                            📁 {nombreCat}
                          </span>
                        </div>
                        <h4 className="catalogo-item-title">{item.title}</h4>
                        {item.description && (
                          <p className="catalogo-item-desc">{item.description}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleDisponibilidad(item.id, estaDisponible)}
                          className="catalogo-item-toggle"
                        >
                          {estaDisponible ? 'Marcar como agotado' : 'Marcar como disponible'}
                        </button>
                      </div>
                      <span className="catalogo-item-price">
                        {formatearMoneda(item.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          VISTA 2: PROMOCIONES
          ============================================ */}
      {vistaActiva === 'promociones' && (
        <div className="catalogo-grid">
          {/* ----- FORMULARIO DE PROMOCIÓN ----- */}
          <div className="catalogo-card">
            <div className="card-title">
              <span>🔥 Configurar Oferta Inteligente en Vitrina</span>
            </div>

            <form onSubmit={handleGuardarOfertaPromo} className="catalogo-form">
              {/* Seleccionar Producto */}
              <div>
                <label className="form-label">
                  Seleccionar Producto o Servicio <span className="form-label-required">*</span>
                </label>
                <select
                  value={prodOfertaId}
                  onChange={(e) => setProdOfertaId(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">-- Elige un ítem de tu catálogo --</option>
                  {items.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatearMoneda(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Promoción */}
              <div>
                <label className="form-label">
                  Estrategia de Promoción <span className="form-label-required">*</span>
                </label>
                <select
                  value={tipoPromocion}
                  onChange={(e) => handleCambioTipoPromocion(e.target.value)}
                  className="form-select"
                >
                  <option value="descuento_porcentaje">🏷️ Descuento por Porcentaje (% OFF)</option>
                  <option value="precio_especial">💰 Precio Especial Fijo ($)</option>
                  <option value="dos_por_uno">📦 Oferta 2x1 (Lleva X, Paga Y)</option>
                  <option value="combo_paquete">🎁 Combo o Paquete Promocional</option>
                  <option value="venta_flash">⚡ Venta Flash por Tiempo Limitado</option>
                </select>
              </div>

              {/* Valor de Descuento */}
              {tipoPromocion === 'descuento_porcentaje' && (
                <div>
                  <label className="form-label">
                    Porcentaje de Descuento (%) <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ej: 20 (para 20% off)"
                    value={valorDescuento}
                    onChange={(e) => setValorDescuento(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              )}

              {/* Precio Especial */}
              {tipoPromocion === 'precio_especial' && (
                <div>
                  <label className="form-label">
                    Nuevo Precio Promocional ($) <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 35000"
                    value={precioPromocional}
                    onChange={(e) => setPrecioPromocional(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              )}

              {/* Regla de Instrucción */}
              <div style={{
                backgroundColor: '#FDF4FF',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #E9D5FF'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <label className="form-label" style={{ color: '#6B21A8', marginBottom: 0 }}>
                    🤖 Regla o Instrucción Asistida para el Cliente <span className="form-label-required">*</span>
                  </label>
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#E9D5FF',
                    color: '#581C87',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: '700'
                  }}>
                    IA & Vitrina
                  </span>
                </div>
                <input
                  type="text"
                  value={reglaInstruccion}
                  onChange={(e) => setReglaInstruccion(e.target.value)}
                  required
                  className="form-input"
                  style={{ borderColor: '#D8B4FE' }}
                />
                <span style={{
                  fontSize: '11px',
                  color: '#7E22CE',
                  display: 'block',
                  marginTop: '6px',
                  lineHeight: '1.4'
                }}>
                  💡 <strong>Ayuda para el comerciante:</strong> Esta instrucción explica con precisión
                  la condición de la oferta para que la plataforma y el asistente de atención
                  la comuniquen sin errores al comprador.
                </span>
              </div>

              {/* Fechas */}
              <div className="form-row-2-igual">
                <div>
                  <label className="form-label">
                    Fecha de Inicio <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Vencimiento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Etiqueta */}
              <div>
                <label className="form-label">
                  Etiqueta / Insignia en la Vitrina
                </label>
                <input
                  type="text"
                  value={etiquetaPromo}
                  onChange={(e) => setEtiquetaPromo(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Botón Enviar */}
              <button
                type="submit"
                disabled={guardando}
                className={`btn-submit ${guardando ? 'btn-submit--disabled' : 'btn-submit--promo'}`}
              >
                {guardando ? 'Activando...' : '🚀 Lanzar Promoción Inteligente'}
              </button>
            </form>
          </div>

          {/* ----- LISTA DE PROMOCIONES ----- */}
          <div className="catalogo-card">
            <div className="card-title">
              <span>📋 Promociones Activas en Vitrina ({promociones.length})</span>
            </div>

            {promociones.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No hay ofertas o promociones temporales creadas todavía.</p>
              </div>
            ) : (
              <div className="promo-list">
                {promociones.map(of => {
                  const prodObj = items.find(i => i.id === of.product_id);
                  const tituloProd = prodObj ? prodObj.title : 'Producto en Oferta';

                  return (
                    <div key={of.id} className="promo-item">
                      <div className="promo-item-header">
                        <strong className="promo-item-name">{tituloProd}</strong>
                        <span className="promo-item-badge">
                          {of.badge_text || 'Promoción'}
                        </span>
                      </div>

                      {of.promotion_rule && (
                        <p className="promo-item-rule">
                          🤖 <strong>Regla para el asistente y cliente:</strong> "{of.promotion_rule}"
                        </p>
                      )}

                      <div className="promo-item-footer">
                        <span className="promo-tag">
                          {of.promotion_type === 'descuento_porcentaje' && `${of.discount_percentage}% OFF`}
                          {of.promotion_type === 'precio_especial' && `Precio Fijo: ${formatearMoneda(of.promotional_price)}`}
                          {of.promotion_type === 'dos_por_uno' && 'Oferta 2x1'}
                          {of.promotion_type === 'combo_paquete' && 'Combo Promocional'}
                          {of.promotion_type === 'venta_flash' && '⚡ Venta Flash'}
                        </span>
                        <span>
                          Vence: {of.end_date ? new Date(of.end_date).toLocaleDateString('es-CO') : 'Indefinida'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}