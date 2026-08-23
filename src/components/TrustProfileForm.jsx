import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function TrustProfileForm({ businessId }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Estado para controlar los habladores / ayudas contextuales interactivas
  const [showTooltips, setShowTooltips] = useState({
    tagline: false,
    description: false,
    advantages: false
  });

  // Estado del formulario vinculado al Perfil de Confianza e Identidad Comercial
  const [formData, setFormData] = useState({
    tagline: '',
    description: '',
    advantagesText: ''
  });

  useEffect(() => {
    if (businessId) {
      fetchTrustProfile();
    }
  }, [businessId]);

  // Cargar datos actuales desde Supabase
  async function fetchTrustProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('business') // Ajusta el esquema si en tu proyecto es 'public'
        .from('business_profiles')
        .select('tagline, description, advantages')
        .eq('id', businessId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          tagline: data.tagline || '',
          description: data.description || '',
          advantagesText: data.advantages ? data.advantages.join('\n') : ''
        });
      }
    } catch (error) {
      console.error('Error al cargar el Perfil de Confianza:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Guardar cambios en la base de datos
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Transformar las ventajas por línea en un Array nativo de PostgreSQL
      const advantagesArray = formData.advantagesText
        ? formData.advantagesText.split('\n').map(item => item.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .schema('business')
        .from('business_profiles')
        .update({
          tagline: formData.tagline,
          description: formData.description,
          advantages: advantagesArray,
          updated_at: new Date()
        })
        .eq('id', businessId);

      if (error) throw error;

      setMessage({ text: '¡Perfil de Confianza y propuesta de valor actualizados con éxito!', type: 'success' });
    } catch (error) {
      console.error('Error al guardar:', error.message);
      setMessage({ text: 'Hubo un error al guardar los cambios.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Alternar el hablador o ayuda contextual
  const toggleTooltip = (field) => {
    setShowTooltips(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">Perfil de Confianza e Identidad Comercial</h2>
        <p className="text-sm text-gray-500 mt-1">
          Este es el núcleo donde tu negocio demuestra por qué es la mejor opción. Configura aquí tu propuesta de valor, descripción y ventajas para destacar ante clientes y motores de IA.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 mb-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ================= 1. ESLEGAN / TAGLINE ================= */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Eslogan o Frase Gancho (Tagline)
            </label>
            <button
              type="button"
              onClick={() => toggleTooltip('tagline')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              💡 {showTooltips.tagline ? 'Ocultar ayuda' : '¿Qué escribir aquí? (Hablador)'}
            </button>
          </div>

          {/* Hablador / Ayuda contextual */}
          {showTooltips.tagline && (
            <div className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-900 text-xs rounded-r-lg space-y-1">
              <p className="font-semibold">💡 Propuesta Única de Venta (USP):</p>
              <p>Resume en menos de 10 palabras qué solucionalizas o qué dolor quitas al cliente de inmediato.</p>
              <p className="italic font-mono text-blue-800">Ejemplo: "Repuestos originales garantizados a domicilio en menos de 2 horas."</p>
            </div>
          )}

          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="Ej: Soluciones tecnológicas rápidas con soporte certificado."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            maxLength={120}
          />
        </div>

        {/* ================= 2. DESCRIPCIÓN PROFUNDA ================= */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Descripción Profunda del Negocio (Propuesta de Valor)
            </label>
            <button
              type="button"
              onClick={() => toggleTooltip('description')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              💡 {showTooltips.description ? 'Ocultar ayuda' : '¿Qué escribir aquí? (Hablador)'}
            </button>
          </div>

          {/* Hablador / Ayuda contextual */}
          {showTooltips.description && (
            <div className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-900 text-xs rounded-r-lg space-y-1">
              <p className="font-semibold">💡 Optimización para Asistentes de IA y SEO:</p>
              <p>Evita limitarte a listar características. Explica con claridad **qué problema resuelves**, **a quién ayudas** y **por qué eres superior**. Los motores de IA (como ChatGPT o Google Gemini) extraen este texto exacto para recomendar tu negocio ante los usuarios.</p>
            </div>
          )}

          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Explica detalladamente la trayectoria de tu negocio, el dolor que le quitas al cliente y tu elemento diferencial..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* ================= 3. VENTAJAS COMPETITIVAS ================= */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Ventajas Competitivas (Una por línea)
            </label>
            <button
              type="button"
              onClick={() => toggleTooltip('advantages')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              💡 {showTooltips.advantages ? 'Ocultar ayuda' : '¿Qué escribir aquí? (Hablador)'}
            </button>
          </div>

          {/* Hablador / Ayuda contextual */}
          {showTooltips.advantages && (
            <div className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-900 text-xs rounded-r-lg space-y-1">
              <p className="font-semibold">💡 Fase de Prueba y Credibilidad:</p>
              <p>Indica viñetas concretas que convenzan al cliente de comprar o contactarte (certificaciones, envíos inmediatos, políticas de devolución o soporte continuo).</p>
            </div>
          )}

          <textarea
            rows={3}
            value={formData.advantagesText}
            onChange={(e) => setFormData({ ...formData, advantagesText: e.target.value })}
            placeholder="Ej: Envíos gratis a todo el país&#10;Atención personalizada 24/7&#10;Garantía directa de fábrica"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Cada salto de línea se convertirá automáticamente en una viñeta de valor dentro de tu perfil.</p>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Guardar Perfil de Confianza'}
          </button>
        </div>
      </form>
    </div>
  );
}