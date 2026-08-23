// src/components/MiNegocio/MiNegocio.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// CONSTANTES
// ============================================
const PALETAS_COLOR = [
  { id: 'brand-blue', name: 'Azul Corporativo', primary: '#2563eb', bg: '#eff6ff', text: '#1e3a8a' },
  { id: 'emerald-growth', name: 'Verde Crecimiento', primary: '#059669', bg: '#ecfdf5', text: '#065f46' },
  { id: 'warm-orange', name: 'Naranja Comercial', primary: '#ea580c', bg: '#fff7ed', text: '#9a3412' },
  { id: 'royal-purple', name: 'Morado Premium', primary: '#7c3aed', bg: '#f5f3ff', text: '#5b21b6' },
  { id: 'slate-dark', name: 'Gris Ejecutivo', primary: '#334155', bg: '#f8fafc', text: '#0f172a' }
];

const OPCIONES_FUENTE = [
  { id: 'font-sans', name: 'Sans-Serif Moderno', fontFamily: 'system-ui, -apple-system, sans-serif' },
  { id: 'font-serif', name: 'Serif Elegante', fontFamily: 'Georgia, serif' },
  { id: 'font-mono', name: 'Monospace Técnico', fontFamily: 'ui-monospace, monospace' }
];

const GEO_COLOMBIA = [
  { id: 1, departamento: 'Cundinamarca', ciudades: ['Funza', 'Mosquera', 'Madrid', 'Facatativá', 'Chía', 'Cota', 'Cajicá', 'Zipaquirá', 'Soacha', 'Sibaté', 'Bojacá', 'Subachoque', 'El Rosal', 'Tenjo', 'Tabio', 'Sopó', 'Tocancipá', 'Gachancipá', 'Girardot', 'Fusagasugá', 'Villeta'] },
  { id: 2, departamento: 'Bogotá D.C.', ciudades: ['Bogotá D.C.'] },
  { id: 3, departamento: 'Antioquia', ciudades: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'Rionegro', 'La Ceja', 'Apartadó', 'Girardota', 'Copacabana'] },
  { id: 4, departamento: 'Valle del Cauca', ciudades: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Buga', 'Cartago', 'Jamundí', 'Yumbo', 'Zarzal', 'Sevilla'] },
  { id: 5, departamento: 'Santander', ciudades: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Socorro'] },
  { id: 6, departamento: 'Atlántico', ciudades: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Sabanagrande', 'Puerto Colombia'] },
  { id: 7, departamento: 'Bolívar', ciudades: ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar'] },
  { id: 8, departamento: 'Boyacá', ciudades: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Villa de Leyva', 'Paipa', 'Moniquirá'] },
  { id: 9, departamento: 'Caldas', ciudades: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma'] },
  { id: 10, departamento: 'Meta', ciudades: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Cumaral', 'San Martín'] },
  { id: 11, departamento: 'Huila', ciudades: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Gigante'] },
  { id: 12, departamento: 'Tolima', ciudades: ['Ibagué', 'Espinal', 'Melgar', 'Mariquita', 'Honda', 'Chaparral', 'Guamo', 'Líbano'] },
  { id: 13, departamento: 'Risaralda', ciudades: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Quinchía'] },
  { id: 14, departamento: 'Quindío', ciudades: ['Armenia', 'Calarcá', 'Montenegro', 'Quimbaya', 'Circasia', 'La Tebaida'] },
  { id: 15, departamento: 'Norte de Santander', ciudades: ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios', 'Tibú'] },
  { id: 16, departamento: 'Nariño', ciudades: ['Pasto', 'Ipiales', 'Tumaco', 'Túquerres', 'Samaniego'] },
  { id: 17, departamento: 'Córdoba', ciudades: ['Montería', 'Cereté', 'Sahagún', 'Lorica', 'Montelíbano', 'Planeta Rica'] },
  { id: 18, departamento: 'Cesar', ciudades: ['Valledupar', 'Aguachica', 'Codazzi', 'Bosconia', 'Curumaní'] },
  { id: 19, departamento: 'Magdalena', ciudades: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato'] },
  { id: 20, departamento: 'Cauca', ciudades: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía'] },
  { id: 21, departamento: 'Casanare', ciudades: ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Paz de Ariporo'] },
  { id: 22, departamento: 'La Guajira', ciudades: ['Riohacha', 'Maicao', 'Uribia', 'San Juan del Cesar', 'Fonseca'] },
  { id: 23, departamento: 'Sucre', ciudades: ['Sincelejo', 'Corozal', 'San Marcos', 'Tolú', 'Coveñas'] }
];

const IMAGEN_DEFAULT = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80';

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function comprimirImagen(file, maxWidth = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function MiNegocio({ businessId, onVolverMenu }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [activeTab, setActiveTab] = useState('confianza');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState({ logo: false, fachada: false });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [realBusinessId, setRealBusinessId] = useState(businessId || null);

  const [sedes, setSedes] = useState([{ id: 'principal', branch_name: 'Sede Principal (Matriz)', is_main: true }]);
  const [activeBranchId, setActiveBranchId] = useState('principal');
  const esSedePrincipal = activeBranchId === 'principal' || sedes.find(s => s.id === activeBranchId)?.is_main;

  const [formData, setFormData] = useState({
    business_name: 'Mi Empresa Pro',
    logo_url: '',
    store_front_url: '',
    tagline: '',
    description: '',
    advantagesText: '',
    country: 'Colombia',
    department: 'Cundinamarca',
    city: 'Funza',
    address: '',
    zone: '',
    google_maps_url: '',
    whatsapp: '',
    phone: '',
    facebook: '',
    instagram: '',
    payment_link: '',
    palette_id: 'brand-blue',
    font_id: 'font-sans'
  });

  const [ciudadesDisponibles, setCiudadesDisponibles] = useState(GEO_COLOMBIA[0].ciudades);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDatosNegocio = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase.from('business_profiles').select('*');
      if (businessId) {
        query = query.eq('id', businessId);
      } else {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      let businessProfileData = {};
      if (data) {
        setRealBusinessId(data.id);
        businessProfileData = {
          business_name: data.name || data.business_name || 'Mi Empresa Pro',
          logo_url: data.logo_url || '',
          store_front_url: data.store_front_url || data.fachada_url || '',
          tagline: data.tagline || '',
          description: data.description || '',
          advantagesText: data.advantages ? (Array.isArray(data.advantages) ? data.advantages.join('\n') : data.advantages) : '',
          country: data.country || 'Colombia',
          department: data.department || 'Cundinamarca',
          city: data.city || 'Funza',
          address: data.address || '',
          zone: data.zone || '',
          google_maps_url: data.google_maps_url || '',
          whatsapp: data.whatsapp || '',
          phone: data.phone || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          payment_link: data.payment_link || '',
          palette_id: data.palette_id || 'brand-blue',
          font_id: data.font_id || 'font-sans'
        };
      }

      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('user_id', user.id);

      if (branchesData && branchesData.length > 0) {
        setSedes(branchesData);
        if (activeBranchId !== 'principal') {
          const sedeSeleccionada = branchesData.find(b => b.id === activeBranchId);
          if (sedeSeleccionada) {
            businessProfileData = {
              ...businessProfileData,
              address: sedeSeleccionada.address || businessProfileData.address,
              department: sedeSeleccionada.department || businessProfileData.department,
              city: sedeSeleccionada.city || businessProfileData.city,
              zone: sedeSeleccionada.zone || businessProfileData.zone,
              phone: sedeSeleccionada.phone || businessProfileData.phone,
              whatsapp: sedeSeleccionada.whatsapp || businessProfileData.whatsapp,
              store_front_url: sedeSeleccionada.store_front_url || businessProfileData.store_front_url
            };
          }
        }
      }

      setFormData(prev => ({ ...prev, ...businessProfileData }));
    } catch (error) {
      console.error('Error al cargar la información del negocio:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const manejarSubidaImagen = async (e, tipo) => {
    try {
      const originalFile = e.target.files[0];
      if (!originalFile) return;
      if (!originalFile.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen válido.');
        return;
      }
      setUploadingState(prev => ({ ...prev, [tipo]: true }));
      setMessage({ text: `Comprimiendo y optimizando foto de ${tipo}...`, type: 'info' });

      const fileToUpload = await comprimirImagen(originalFile, 1000, 0.8);
      const fileName = `${tipo}-${realBusinessId || 'empresa'}-${activeBranchId}-${Date.now()}.webp`;

      const { error: uploadError } = await supabase
        .storage
        .from('logos')
        .upload(fileName, fileToUpload, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from('logos')
        .getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;
      const fieldKey = tipo === 'logo' ? 'logo_url' : 'store_front_url';
      setFormData(prev => ({ ...prev, [fieldKey]: publicUrl }));
      setMessage({ text: `¡Imagen de ${tipo === 'logo' ? 'Logotipo' : 'Fachada'} cargada con éxito!`, type: 'success' });
    } catch (error) {
      console.error(`Error al subir ${tipo}:`, error.message);
      setMessage({ text: 'Error al subir la imagen. Verifica que el Bucket "logos" sea público en Supabase Storage.', type: 'error' });
    } finally {
      setUploadingState(prev => ({ ...prev, [tipo]: false }));
    }
  };

  const alternarAyuda = (campo) => {
    setActiveTooltip(activeTooltip === campo ? null : campo);
  };

  const irSiguienteTab = () => {
    if (activeTab === 'confianza') setActiveTab('estilo');
    else if (activeTab === 'estilo') setActiveTab('ubicacion');
    else if (activeTab === 'ubicacion') setActiveTab('canales');
  };

  const irAnteriorTab = () => {
    if (activeTab === 'canales') setActiveTab('ubicacion');
    else if (activeTab === 'ubicacion') setActiveTab('estilo');
    else if (activeTab === 'estilo') setActiveTab('confianza');
  };

  const crearNuevaSede = async () => {
    const nombreSede = prompt('Nombre de la nueva sucursal / sede:');
    if (nombreSede && nombreSede.trim() !== '') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const nuevaSedeObj = {
          user_id: user.id,
          business_id: realBusinessId,
          branch_name: nombreSede.trim(),
          is_main: false,
          country: formData.country,
          department: formData.department,
          city: formData.city || 'Funza',
          address: formData.address || 'Por definir'
        };
        const { data, error } = await supabase
          .from('branches')
          .insert([nuevaSedeObj])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setSedes(prev => [...prev, data]);
          setActiveBranchId(data.id);
          setMessage({ text: `¡Sucursal "${data.branch_name}" creada con éxito!`, type: 'success' });
        }
      } catch (err) {
        console.error('Error al crear sede:', err.message);
        setMessage({ text: 'Error al crear la sucursal.', type: 'error' });
      }
    }
  };

  const dispararAnalisisIA = async () => {
    if (!realBusinessId) return;
    setMessage({ text: '🤖 La IA está analizando tu negocio...', type: 'info' });

    try {
      const { data: negocioData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', realBusinessId)
        .single();

      const { data: productosData } = await supabase
        .from('products')
        .select('title, description')
        .eq('user_id', negocioData?.user_id);

      const payload = {
        nombre: negocioData?.business_name || 'Negocio sin nombre',
        descripcion: negocioData?.description || '',
        ciudad: formData.city || '',
        departamento: formData.department || 'Colombia',
        direccion: formData.address || '',
        redes: {
          instagram: formData.instagram || '',
          facebook: formData.facebook || '',
          tiktok: '',
          youtube: '',
          web: formData.payment_link || ''
        },
        productos: productosData || []
      };

      const url = `https://twwwtwevtxlwrpzjbqyn.supabase.co/functions/v1/analizar-negocio-ok`;
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!respuesta.ok) {
        const errorText = await respuesta.text();
        throw new Error(`Error HTTP ${respuesta.status}: ${errorText}`);
      }

      const data = await respuesta.json();

      await supabase
        .from('auditorias')
        .insert([{
          negocio_id: realBusinessId,
          recomendaciones: data.recomendaciones || [],
          nuevo_eslogan: data.nuevo_eslogan || '',
          nueva_descripcion: data.nueva_descripcion || '',
          texto_aprobacion: data.texto_aprobacion || '',
          titulo_seo: data.titulo_seo || '',
          descripcion_seo: data.descripcion_seo || '',
          palabras_clave: data.palabras_clave || []
        }]);

      setMessage({ text: '🧠 ¡Análisis de IA completado! Ve al Asistente de Crecimiento.', type: 'success' });
    } catch (error) {
      console.warn('Aviso conexión IA:', error.message);
    }
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para guardar.');
        setSaving(false);
        return;
      }

      const ventajasArray = formData.advantagesText
        ? formData.advantagesText.split('\n').map(item => item.trim()).filter(Boolean)
        : [];

      const payloadPerfil = {
        user_id: user.id,
        name: formData.business_name,
        business_name: formData.business_name,
        logo_url: formData.logo_url,
        store_front_url: formData.store_front_url,
        tagline: formData.tagline,
        description: formData.description,
        advantages: ventajasArray,
        country: formData.country,
        department: formData.department,
        city: formData.city,
        address: formData.address,
        zone: formData.zone,
        google_maps_url: formData.google_maps_url,
        whatsapp: formData.whatsapp,
        phone: formData.phone,
        facebook: formData.facebook,
        instagram: formData.instagram,
        payment_link: formData.payment_link,
        palette_id: formData.palette_id,
        font_id: formData.font_id,
        updated_at: new Date()
      };

      if (realBusinessId) {
        payloadPerfil.id = realBusinessId;
      }

      const { data: perfilGuardado, error: errorPerfil } = await supabase
        .from('business_profiles')
        .upsert(payloadPerfil)
        .select()
        .single();

      if (errorPerfil) throw errorPerfil;
      if (perfilGuardado) {
        setRealBusinessId(perfilGuardado.id);
      }

      if (activeBranchId !== 'principal') {
        const payloadSede = {
          id: activeBranchId,
          user_id: user.id,
          business_id: realBusinessId,
          country: formData.country,
          department: formData.department,
          city: formData.city,
          address: formData.address,
          zone: formData.zone,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          store_front_url: formData.store_front_url
        };
        const { error: errorSede } = await supabase
          .from('branches')
          .upsert(payloadSede);
        if (errorSede) console.warn('Aviso sobre sucursal:', errorSede.message);
      }

      setMessage({ text: '¡Información guardada y sincronizada con éxito!', type: 'success' });
      dispararAnalisisIA();
    } catch (error) {
      console.error('Error al guardar:', error.message);
      setMessage({ text: 'Ocurrió un error al guardar los cambios: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const seoScore = useMemo(() => {
    let score = 20;
    if (formData.tagline.length > 15) score += 20;
    if (formData.description.length > 40) score += 20;
    if (formData.advantagesText.trim().length > 0) score += 20;
    if (formData.department && formData.city) score += 20;
    return Math.min(100, score);
  }, [formData]);

  const selectedPalette = useMemo(() => {
    return PALETAS_COLOR.find(p => p.id === formData.palette_id) || PALETAS_COLOR[0];
  }, [formData.palette_id]);

  const selectedFont = useMemo(() => {
    return OPCIONES_FUENTE.find(f => f.id === formData.font_id) || OPCIONES_FUENTE[0];
  }, [formData.font_id]);

  const sedeActual = useMemo(() => {
    return sedes.find(s => s.id === activeBranchId) || sedes[0];
  }, [sedes, activeBranchId]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDatosNegocio();
  }, [businessId, activeBranchId]);

  useEffect(() => {
    const depEncontrado = GEO_COLOMBIA.find(d => d.departamento === formData.department);
    if (depEncontrado) {
      setCiudadesDisponibles(depEncontrado.ciudades);
      if (!depEncontrado.ciudades.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: depEncontrado.ciudades[0] }));
      }
    } else {
      setCiudadesDisponibles([]);
    }
  }, [formData.department]);

  // ============================================
  // RENDERIZADO
  // ============================================
  if (loading) {
    return (
      <div className="minegocio-container">
        <style jsx>{`
          .minegocio-container {
            max-width: 1280px;
            margin: 30px auto;
            padding: 0 20px;
            font-family: 'Sora', system-ui, sans-serif;
            color: #1E293B;
            background: #F8FAFC;
            min-height: 100vh;
          }
          .loading-state {
            text-align: center;
            padding: 80px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
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
          <p className="loading-text">Cargando espacio de trabajo empresarial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="minegocio-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE MI NEGOCIO
           ============================================ */

        .minegocio-container {
          max-width: 1280px;
          margin: 30px auto;
          padding: 0 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #1E293B;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- BARRA SUPERIOR ----- */
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
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

        .sede-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFFFFF;
          padding: 6px 14px;
          border-radius: 12px;
          border: 1px solid #CBD5E1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .sede-selector-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
        }

        .sede-selector select {
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          background: #F8FAFC;
          color: #0F172A;
          outline: none;
          font-family: inherit;
        }

        .sede-selector select:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .btn-nueva-sede {
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .btn-nueva-sede:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
        }

        /* ----- GRID PRINCIPAL ----- */
        .main-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
          align-items: start;
        }

        /* ----- TARJETA DEL FORMULARIO ----- */
        .form-card {
          background: #FFFFFF;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          border: 1px solid #F1F5F9;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .form-card:hover {
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.08);
        }

        .form-card-header {
          padding: 24px 28px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .form-card-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .form-card-subtitle {
          font-size: 12px;
          color: #64748B;
          margin: 4px 0 0 0;
        }

        .form-card-subtitle strong {
          color: #0F172A;
        }

        /* ----- INDICADORES ----- */
        .indicators-bar {
          background: #F8FAFC;
          padding: 14px 28px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .indicators-label {
          font-size: 11px;
          font-weight: 800;
          color: #0369A1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .indicators-desc {
          font-size: 12px;
          color: #334155;
          margin-top: 2px;
        }

        .indicators-group {
          display: flex;
          gap: 12px;
        }

        .indicator-item {
          background: #FFFFFF;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          text-align: center;
        }

        .indicator-item-label {
          font-size: 10px;
          color: #64748B;
          font-weight: 700;
        }

        .indicator-item-value {
          font-size: 14px;
          font-weight: 800;
        }

        .indicator-item-value--green {
          color: #16A34A;
        }

        .indicator-item-value--yellow {
          color: #D97706;
        }

        /* ----- PESTAÑAS ----- */
        .tabs-bar {
          display: flex;
          background: #F8FAFC;
          border-bottom: 1px solid #F1F5F9;
          padding: 0 20px;
          gap: 12px;
          overflow-x: auto;
        }

        .tabs-bar::-webkit-scrollbar {
          height: 4px;
        }

        .tabs-bar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 2px;
        }

        .tabs-bar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }

        .tab-btn {
          padding: 14px 4px;
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .tab-btn:hover {
          color: #1E293B;
        }

        .tab-btn--active {
          color: #0066FF;
          border-bottom-color: #0066FF;
        }

        /* ----- FORMULARIO ----- */
        .form-body {
          padding: 24px;
        }

        /* ----- GRUPOS DE CAMPOS ----- */
        .field-group {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .field-group:hover {
          border-color: #CBD5E1;
        }

        .field-group:focus-within {
          border-color: #0066FF;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.06);
        }

        .field-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-group-label {
          font-size: 11px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field-group-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        /* ----- INPUTS ----- */
        .form-input {
          width: 100%;
          padding: 10px 14px;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          color: #0F172A;
        }

        .form-input:hover {
          border-color: #94A3B8;
        }

        .form-input:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .form-input::placeholder {
          color: #94A3B8;
        }

        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          font-family: inherit;
          color: #0F172A;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 80px;
        }

        .form-textarea:hover {
          border-color: #94A3B8;
        }

        .form-textarea:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .form-textarea.mono {
          font-family: ui-monospace, monospace;
        }

        .form-select {
          width: 100%;
          padding: 10px 14px;
          background: #F8FAFC;
          border: 2px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          box-sizing: border-box;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          color: #0F172A;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }

        .form-select:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .form-select:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        .form-select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ----- BOTÓN DE AYUDA ----- */
        .help-btn {
          font-size: 11px;
          font-weight: 700;
          color: #0066FF;
          background: #FFFFFF;
          border: 1px solid #BFDBFE;
          padding: 4px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .help-btn:hover {
          background: #EFF6FF;
          border-color: #93C5FD;
        }

        /* ----- TOOLTIP ----- */
        .tooltip-card {
          background: #0F172A;
          color: #F8FAFC;
          padding: 14px;
          border-radius: 12px;
          font-size: 12px;
          margin-bottom: 12px;
          border: 1px solid #334155;
          line-height: 1.5;
          animation: slideDown 0.3s ease;
        }

        .tooltip-title {
          font-weight: 700;
          color: #60A5FA;
          margin-bottom: 4px;
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

        /* ----- IMAGEN PREVIEW ----- */
        .image-preview-container {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-top: 10px;
        }

        .image-preview-box {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 2px dashed #CBD5E1;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .image-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .image-preview-box .placeholder {
          font-size: 20px;
          color: #94A3B8;
        }

        .image-preview-box--fachada {
          width: 100px;
          height: 65px;
        }

        .image-preview-box--fachada img {
          object-fit: cover;
        }

        .btn-upload {
          display: inline-block;
          padding: 10px 18px;
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .btn-upload:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
        }

        .btn-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ----- PALETA DE COLORES ----- */
        .palette-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .palette-option {
          padding: 10px;
          border-radius: 10px;
          border: 2px solid #CBD5E1;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .palette-option:hover {
          border-color: #94A3B8;
        }

        .palette-option--selected {
          border-color: #0066FF;
          background: #EFF6FF;
        }

        .palette-color {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid #94A3B8;
          flex-shrink: 0;
        }

        .palette-name {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
        }

        /* ----- OPCIONES DE FUENTE ----- */
        .font-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .font-option {
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid #CBD5E1;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .font-option:hover {
          border-color: #94A3B8;
        }

        .font-option--selected {
          border-color: #0066FF;
          background: #EFF6FF;
        }

        .font-option input[type="radio"] {
          accent-color: #0066FF;
          cursor: pointer;
        }

        .font-option-name {
          font-size: 13px;
          font-weight: 600;
        }

        /* ----- MENSAJES ----- */
        .form-message {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .form-message--success {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .form-message--error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .form-message--info {
          background: #EFF6FF;
          color: #1E3A8A;
          border: 1px solid #BFDBFE;
        }

        /* ----- PIE DEL FORMULARIO ----- */
        .form-footer {
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .btn-secondary {
          padding: 10px 16px;
          background: #F1F5F9;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #E2E8F0;
        }

        .btn-primary {
          padding: 10px 18px;
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-success {
          padding: 10px 20px;
          background: linear-gradient(135deg, #16A34A, #15803D);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
        }

        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .footer-actions {
          display: flex;
          gap: 10px;
        }

        /* ----- VISTA PREVIA ----- */
        .preview-card {
          position: sticky;
          top: 20px;
          background: #FFFFFF;
          border-radius: 24px;
          padding: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .preview-card:hover {
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.08);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .preview-header-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .preview-header-sede {
          font-size: 11px;
          font-weight: 700;
          color: #0066FF;
        }

        .preview-body {
          background: #F8FAFC;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #CBD5E1;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .preview-verified {
          display: inline-block;
          padding: 4px 10px;
          background: #FFFFFF;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid #E2E8F0;
          margin-bottom: 12px;
        }

        .preview-fachada {
          width: 100%;
          height: 130px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 14px;
          border: 1px solid #CBD5E1;
        }

        .preview-fachada img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-business {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .preview-logo {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: contain;
          background: #FFFFFF;
          padding: 4px;
          border: 1px solid #E2E8F0;
        }

        .preview-logo-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: #FFFFFF;
        }

        .preview-business-name {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
        }

        .preview-tagline {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.85;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .preview-advantages {
          background: #FFFFFF;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 14px;
          border: 1px solid #E2E8F0;
        }

        .preview-advantages-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }

        .preview-advantages-list {
          margin: 0;
          padding-left: 16px;
          font-size: 11px;
          color: #334155;
        }

        .preview-advantages-list li {
          margin-bottom: 2px;
        }

        .preview-description {
          font-size: 11px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .preview-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preview-whatsapp-btn {
          background: #059669;
          color: #FFFFFF;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preview-whatsapp-btn:hover {
          background: #047857;
        }

        .preview-address {
          font-size: 11px;
          color: #64748B;
          text-align: center;
          background: #FFFFFF;
          padding: 6px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 768px) {
          .minegocio-container {
            margin: 16px auto;
            padding: 0 16px;
          }

          .top-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .btn-volver {
            width: 100%;
            justify-content: center;
          }

          .sede-selector {
            flex-wrap: wrap;
            justify-content: center;
            padding: 10px 14px;
          }

          .main-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .form-card-header {
            padding: 18px 20px;
          }

          .form-card-title {
            font-size: 16px;
          }

          .indicators-bar {
            padding: 12px 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .indicators-group {
            justify-content: center;
          }

          .tabs-bar {
            padding: 0 12px;
            gap: 8px;
          }

          .tab-btn {
            font-size: 11px;
            padding: 12px 4px;
          }

          .form-body {
            padding: 16px;
          }

          .palette-grid {
            grid-template-columns: 1fr;
          }

          .field-group {
            padding: 14px;
          }

          .image-preview-container {
            flex-direction: column;
            align-items: stretch;
          }

          .form-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .footer-actions {
            flex-direction: column;
          }

          .btn-secondary,
          .btn-primary,
          .btn-success {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .preview-card {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 480px) {
          .minegocio-container {
            margin: 12px auto;
            padding: 0 12px;
          }

          .form-card-header {
            padding: 14px 16px;
          }

          .form-card-title {
            font-size: 14px;
          }

          .tabs-bar {
            gap: 4px;
            padding: 0 8px;
          }

          .tab-btn {
            font-size: 10px;
            padding: 10px 2px;
          }

          .form-body {
            padding: 12px;
          }

          .field-group {
            padding: 12px;
          }

          .form-input,
          .form-select,
          .form-textarea {
            font-size: 12px;
            padding: 8px 12px;
          }

          .preview-body {
            padding: 14px;
          }

          .preview-business-name {
            font-size: 15px;
          }
        }
      `}</style>

      {/* ============================================
          BARRA SUPERIOR
          ============================================ */}
      <div className="top-bar">
        <button
          type="button"
          onClick={() => {
            if (typeof onVolverMenu === 'function') {
              onVolverMenu();
            }
          }}
          className="btn-volver"
        >
          🏠 Volver al Menú Inicial
        </button>

        <div className="sede-selector">
          <span className="sede-selector-label">📍 Sede en edición:</span>
          <select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
          >
            {sedes.map(s => (
              <option key={s.id} value={s.id}>
                {s.branch_name || s.name} {s.is_main ? '(Matriz)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={crearNuevaSede}
            className="btn-nueva-sede"
          >
            + Nueva Sede
          </button>
        </div>
      </div>

      {/* ============================================
          GRID PRINCIPAL
          ============================================ */}
      <div className="main-grid">
        {/* ===== COLUMNA FORMULARIO ===== */}
        <div className="form-card">
          {/* Encabezado */}
          <div className="form-card-header">
            <div>
              <h1 className="form-card-title">Configuración del Negocio</h1>
              <p className="form-card-subtitle">
                Editando: <strong>{sedeActual?.branch_name || 'Sede Principal'}</strong>
              </p>
            </div>
            {message.text && (
              <div className={`form-message form-message--${message.type}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Indicadores */}
          <div className="indicators-bar">
            <div>
              <div className="indicators-label">Indicadores de Impacto Comercial</div>
              <div className="indicators-desc">
                Optimización activa para Google SEO, ChatGPT y Perplexity.
              </div>
            </div>
            <div className="indicators-group">
              <div className="indicator-item">
                <div className="indicator-item-label">Puntaje IA / SEO</div>
                <div className={`indicator-item-value ${seoScore >= 80 ? 'indicator-item-value--green' : 'indicator-item-value--yellow'}`}>
                  {seoScore}%
                </div>
              </div>
              <div className="indicator-item">
                <div className="indicator-item-label">Datos Google SEO</div>
                <div className="indicator-item-value indicator-item-value--green">✅ Listos</div>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="tabs-bar">
            <button
              type="button"
              onClick={() => setActiveTab('confianza')}
              className={`tab-btn ${activeTab === 'confianza' ? 'tab-btn--active' : ''}`}
            >
              🛡️ Confianza & Identidad
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('estilo')}
              className={`tab-btn ${activeTab === 'estilo' ? 'tab-btn--active' : ''}`}
            >
              🎨 Estilo y Vitrina
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ubicacion')}
              className={`tab-btn ${activeTab === 'ubicacion' ? 'tab-btn--active' : ''}`}
            >
              📍 Georreferenciación & Sede
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('canales')}
              className={`tab-btn ${activeTab === 'canales' ? 'tab-btn--active' : ''}`}
            >
              🌐 Canales y Redes
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={guardarCambios} className="form-body">
            {/* ===== TAB 1: CONFIANZA ===== */}
            {activeTab === 'confianza' && (
              <div>
                <div className="field-group">
                  <div className="field-group-header">
                    <label className="field-group-label">Nombre del Negocio <span className="field-group-label-required">*</span></label>
                  </div>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={manejarCambio}
                    required
                    className="form-input"
                  />
                </div>

                <div className="field-group">
                  <div className="field-group-header">
                    <label className="field-group-label">Logotipo del Negocio</label>
                    <button type="button" onClick={() => alternarAyuda('logo')} className="help-btn">
                      💡 {activeTooltip === 'logo' ? 'Cerrar guía' : 'Ver Hablador'}
                    </button>
                  </div>

                  {activeTooltip === 'logo' && (
                    <div className="tooltip-card">
                      <div className="tooltip-title">🖼️ Formato Recomendado:</div>
                      <div>Sube una imagen cuadrada de tu logo (PNG o WebP con fondo transparente). Se optimiza automáticamente.</div>
                    </div>
                  )}

                  <div className="image-preview-container">
                    <div className="image-preview-box">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" />
                      ) : (
                        <span className="placeholder">📷</span>
                      )}
                    </div>
                    <div>
                      <label className="btn-upload">
                        {uploadingState.logo ? '⏳ Comprimiendo...' : '📁 Cargar Foto de Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => manejarSubidaImagen(e, 'logo')}
                          disabled={uploadingState.logo}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-group-header">
                    <label className="field-group-label">Eslogan o Frase Gancho (Tagline)</label>
                    <button type="button" onClick={() => alternarAyuda('eslogan')} className="help-btn">
                      💡 {activeTooltip === 'eslogan' ? 'Cerrar guía' : 'Ver Hablador'}
                    </button>
                  </div>

                  {activeTooltip === 'eslogan' && (
                    <div className="tooltip-card">
                      <div className="tooltip-title">🎯 Objetivo:</div>
                      <div>Resume en menos de 10 palabras la solución principal que entregas a tu cliente.</div>
                    </div>
                  )}

                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={manejarCambio}
                    placeholder="Ej: Repuestos originales entregados a domicilio en tiempo récord."
                    className="form-input"
                    maxLength={120}
                  />
                </div>

                <div className="field-group">
                  <div className="field-group-header">
                    <label className="field-group-label">Descripción Comercial Profunda</label>
                    <button type="button" onClick={() => alternarAyuda('descripcion')} className="help-btn">
                      💡 {activeTooltip === 'descripcion' ? 'Cerrar guía' : 'Ver Hablador'}
                    </button>
                  </div>

                  {activeTooltip === 'descripcion' && (
                    <div className="tooltip-card">
                      <div className="tooltip-title">🤖 Enfoque para SEO e IA:</div>
                      <div>Menciona tu trayectoria, tipo de clientes que atiendes y respaldo de marca.</div>
                    </div>
                  )}

                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={manejarCambio}
                    placeholder="Describe los productos, servicios y diferenciales de esta sede..."
                    className="form-textarea"
                  />
                </div>

                <div className="field-group">
                  <label className="field-group-label">Ventajas Competitivas (Una por línea)</label>
                  <textarea
                    name="advantagesText"
                    rows={3}
                    value={formData.advantagesText}
                    onChange={manejarCambio}
                    placeholder="Envíos gratis en la zona\nGarantía directa de 2 años\nAtención personalizada 24/7"
                    className="form-textarea mono"
                  />
                </div>
              </div>
            )}

            {/* ===== TAB 2: ESTILO ===== */}
            {activeTab === 'estilo' && (
              <div>
                <div className="field-group">
                  <label className="field-group-label">Paleta de Color de la Vitrina</label>
                  <div className="palette-grid">
                    {PALETAS_COLOR.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setFormData(prev => ({ ...prev, palette_id: p.id }))}
                        className={`palette-option ${formData.palette_id === p.id ? 'palette-option--selected' : ''}`}
                      >
                        <div className="palette-color" style={{ backgroundColor: p.primary }} />
                        <span className="palette-name">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-group-label">Estilo Tipográfico</label>
                  <div className="font-options">
                    {OPCIONES_FUENTE.map(f => (
                      <label
                        key={f.id}
                        className={`font-option ${formData.font_id === f.id ? 'font-option--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="font_id"
                          checked={formData.font_id === f.id}
                          onChange={() => setFormData(prev => ({ ...prev, font_id: f.id }))}
                        />
                        <span className="font-option-name" style={{ fontFamily: f.fontFamily }}>{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== TAB 3: UBICACIÓN ===== */}
            {activeTab === 'ubicacion' && (
              <div>
                <div className="field-group">
                  <div className="field-group-header">
                    <label className="field-group-label">Foto de Fachada de esta Sede</label>
                    <button type="button" onClick={() => alternarAyuda('fachada')} className="help-btn">
                      💡 {activeTooltip === 'fachada' ? 'Cerrar guía' : 'Ver Hablador'}
                    </button>
                  </div>

                  {activeTooltip === 'fachada' && (
                    <div className="tooltip-card">
                      <div className="tooltip-title">🏢 Foto del Local Físico:</div>
                      <div>Sube una foto clara del frente de esta sucursal. Ayuda a los clientes a ubicarte fácilmente al llegar.</div>
                    </div>
                  )}

                  <div className="image-preview-container">
                    <div className="image-preview-box image-preview-box--fachada">
                      {formData.store_front_url ? (
                        <img src={formData.store_front_url} alt="Fachada" />
                      ) : (
                        <span className="placeholder">🏢</span>
                      )}
                    </div>
                    <div>
                      <label className="btn-upload">
                        {uploadingState.fachada ? '⏳ Comprimiendo...' : '📁 Cargar Foto de Fachada'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => manejarSubidaImagen(e, 'fachada')}
                          disabled={uploadingState.fachada}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-group-label">País de Operación</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={manejarCambio}
                    className="form-select"
                  >
                    <option value="Colombia">🇨🇴 Colombia (Preseleccionado)</option>
                    <option value="México" disabled>🇲🇽 México (Próximamente)</option>
                    <option value="Perú" disabled>🇵🇪 Perú (Próximamente)</option>
                  </select>
                </div>

                <div className="field-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="field-group-label">Departamento <span className="field-group-label-required">*</span></label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={manejarCambio}
                        className="form-select"
                        required
                      >
                        {GEO_COLOMBIA.map(dep => (
                          <option key={dep.id} value={dep.departamento}>
                            {dep.departamento}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-group-label">Ciudad / Municipio <span className="field-group-label-required">*</span></label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={manejarCambio}
                        className="form-select"
                        required
                      >
                        {ciudadesDisponibles.map((ciudad, idx) => (
                          <option key={idx} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-group-label">Dirección Física <span className="field-group-label-required">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={manejarCambio}
                      placeholder="Ej: Cra 15 # 93-20"
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-group-label">Zona / Barrio</label>
                    <input
                      type="text"
                      name="zone"
                      value={formData.zone}
                      onChange={manejarCambio}
                      placeholder="Ej: Chapinero"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="field-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                  <label className="field-group-label">Enlace de Google Maps</label>
                  <input
                    type="url"
                    name="google_maps_url"
                    value={formData.google_maps_url}
                    onChange={manejarCambio}
                    placeholder="https://maps.google.com/..."
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* ===== TAB 4: CANALES ===== */}
            {activeTab === 'canales' && (
              <div>
                <div className="field-group">
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                    📞 Contacto Directo de esta Sede
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="field-group-label">WhatsApp Comercial</label>
                      <input
                        type="text"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={manejarCambio}
                        placeholder="+57 300 123 4567"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="field-group-label">Teléfono Fijo / PBX</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={manejarCambio}
                        placeholder="(601) 5551234"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="field-group" style={{ backgroundColor: esSedePrincipal ? '#FFFFFF' : '#F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', margin: 0 }}>
                      🌐 Redes Sociales Corporativas
                    </h4>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: esSedePrincipal ? '#ECFDF5' : '#E2E8F0',
                      color: esSedePrincipal ? '#065F46' : '#475569'
                    }}>
                      {esSedePrincipal ? 'Edición Habilitada (Matriz)' : 'Heredadas de Sede Principal'}
                    </span>
                  </div>

                  {!esSedePrincipal && (
                    <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
                      ℹ️ Para modificar las redes corporativas globales, selecciona la <strong>Sede Principal</strong> arriba.
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label className="field-group-label">Facebook</label>
                      <input
                        type="url"
                        name="facebook"
                        value={formData.facebook}
                        onChange={manejarCambio}
                        disabled={!esSedePrincipal}
                        placeholder="https://facebook.com/empresa"
                        className="form-input"
                        style={{
                          backgroundColor: esSedePrincipal ? '#FFFFFF' : '#F8FAFC',
                          opacity: esSedePrincipal ? 1 : 0.7
                        }}
                      />
                    </div>
                    <div>
                      <label className="field-group-label">Instagram</label>
                      <input
                        type="url"
                        name="instagram"
                        value={formData.instagram}
                        onChange={manejarCambio}
                        disabled={!esSedePrincipal}
                        placeholder="https://instagram.com/empresa"
                        className="form-input"
                        style={{
                          backgroundColor: esSedePrincipal ? '#FFFFFF' : '#F8FAFC',
                          opacity: esSedePrincipal ? 1 : 0.7
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-group-label">Enlace de Pago Directo (Bold, Wompi, etc.)</label>
                    <input
                      type="url"
                      name="payment_link"
                      value={formData.payment_link}
                      onChange={manejarCambio}
                      placeholder="https://pay.bold.co/..."
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== PIE DEL FORMULARIO ===== */}
            <div className="form-footer">
              <div>
                {activeTab !== 'confianza' ? (
                  <button type="button" onClick={irAnteriorTab} className="btn-secondary">
                    ← Anterior
                  </button>
                ) : (
                  <button type="button" onClick={() => typeof onVolverMenu === 'function' && onVolverMenu()} className="btn-secondary">
                    🏠 Ir al Menú
                  </button>
                )}
              </div>

              <div className="footer-actions">
                {activeTab !== 'canales' && (
                  <button type="button" onClick={irSiguienteTab} className="btn-primary">
                    Siguiente →
                  </button>
                )}
                <button type="submit" disabled={saving} className="btn-success">
                  {saving ? 'Guardando...' : '💾 Guardar Sede'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ===== COLUMNA VISTA PREVIA ===== */}
        <div className="preview-card">
          <div className="preview-header">
            <span className="preview-header-label">🟢 Vista Previa en Vivo — Vitrina</span>
            <span className="preview-header-sede">
              {sedeActual?.branch_name || 'Sede Principal'}
            </span>
          </div>

          <div
            className="preview-body"
            style={{
              backgroundColor: selectedPalette.bg,
              fontFamily: selectedFont.fontFamily,
              borderColor: '#CBD5E1'
            }}
          >
            <span className="preview-verified" style={{ color: selectedPalette.primary }}>
              ✓ Negocio Verificado • PonteVisible
            </span>

            {formData.store_front_url && (
              <div className="preview-fachada">
                <img src={formData.store_front_url} alt="Fachada" />
              </div>
            )}

            <div className="preview-business">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="preview-logo" />
              ) : (
                <div
                  className="preview-logo-placeholder"
                  style={{ backgroundColor: selectedPalette.primary }}
                >
                  {formData.business_name ? formData.business_name.charAt(0) : 'N'}
                </div>
              )}
              <div>
                <h2 className="preview-business-name" style={{ color: selectedPalette.text }}>
                  {formData.business_name}
                </h2>
              </div>
            </div>

            <p className="preview-tagline" style={{ color: selectedPalette.text }}>
              {formData.tagline || 'Escribe tu eslogan en el formulario para verlo reflejado aquí.'}
            </p>

            {formData.advantagesText && (
              <div className="preview-advantages">
                <span className="preview-advantages-label">Ventajas Destacadas</span>
                <ul className="preview-advantages-list">
                  {formData.advantagesText.split('\n').filter(Boolean).map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="preview-description">
              {formData.description || 'Aquí aparecerá la descripción detallada de tu establecimiento.'}
            </p>

            <div className="preview-actions">
              <button
                className="preview-whatsapp-btn"
                style={{ backgroundColor: selectedPalette.primary }}
              >
                💬 Contactar por WhatsApp ({formData.whatsapp || 'WhatsApp'})
              </button>
              {formData.address && (
                <div className="preview-address">
                  📍 {formData.address} ({formData.city}, {formData.department})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}