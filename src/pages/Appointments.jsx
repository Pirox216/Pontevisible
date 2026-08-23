// src/components/Appointments/Appointments.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';

// ============================================
// CONSTANTES
// ============================================
const SERVICIOS_DEFECTO = [
  { id: 'general', title: 'Servicio General' },
  { id: 'consultoria', title: 'Consultoría Empresarial' },
  { id: 'mantenimiento', title: 'Mantenimiento Técnico' },
  { id: 'capacitacion', title: 'Capacitación y Formación' }
];

const ESTADO_INICIAL_CITA = {
  client_name: '',
  client_phone: '',
  client_email: '',
  service_id: '',
  service_name: '',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '10:00',
  notes: ''
};

const ESTADO_COLORS = {
  pendiente: { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', label: 'Pendiente' },
  confirmada: { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E', label: 'Confirmada' },
  completada: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'Completada' },
  cancelada: { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444', label: 'Cancelada' }
};

const ESTADO_ICONOS = {
  todos: '📊',
  pendiente: '⏳',
  confirmada: '✅',
  completada: '✔️',
  cancelada: '❌'
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Appointments({ onVolver }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [formCita, setFormCita] = useState(ESTADO_INICIAL_CITA);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const cargarDatosAgenda = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCargando(false);
        return;
      }

      // 1. Cargar servicios activos del catálogo para el selector
      const { data: servs } = await supabase
        .from('products')
        .select('id, title, name, price, valor_de_venta')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_active', true);

      const listaFinalServicios = (servs && servs.length > 0) ? servs : SERVICIOS_DEFECTO;
      setServicios(listaFinalServicios);

      setFormCita(prev => ({
        ...prev,
        service_id: listaFinalServicios[0]?.id || '',
        service_name: listaFinalServicios[0]?.title || listaFinalServicios[0]?.name || 'Servicio General'
      }));

      // 2. Cargar citas registradas
      const { data: citasData, error: citasError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (citasError) {
        console.warn('Advertencia en carga de appointments:', citasError.message);
      }
      if (citasData) {
        setCitas(citasData);
      }

    } catch (err) {
      console.error('Error cargando citas:', err);
      setServicios(SERVICIOS_DEFECTO);
      setFormCita(prev => ({
        ...prev,
        service_id: SERVICIOS_DEFECTO[0]?.id || '',
        service_name: SERVICIOS_DEFECTO[0]?.title || 'Servicio General'
      }));
      setMensaje({ text: '⚠️ Error al cargar datos. Usando servicios de respaldo.', type: 'error' });
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'service_id') {
      const servEncontrado = servicios.find(s => String(s.id) === String(value));
      setFormCita(prev => ({
        ...prev,
        service_id: value,
        service_name: servEncontrado ? (servEncontrado.title || servEncontrado.name) : ''
      }));
    } else {
      setFormCita(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ text: '', type: '' });

    if (!formCita.service_id) {
      setMensaje({ text: '⚠️ Por favor, selecciona un servicio de la lista.', type: 'error' });
      setGuardando(false);
      return;
    }

    if (!formCita.client_name.trim()) {
      setMensaje({ text: '⚠️ Por favor, ingresa el nombre del cliente.', type: 'error' });
      setGuardando(false);
      return;
    }

    if (!formCita.client_phone.trim()) {
      setMensaje({ text: '⚠️ Por favor, ingresa el teléfono del cliente.', type: 'error' });
      setGuardando(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa.');

      const nuevaCitaPayload = {
        user_id: user.id,
        client_name: formCita.client_name.trim(),
        client_phone: formCita.client_phone.trim(),
        client_email: formCita.client_email.trim(),
        service_id: formCita.service_id || null,
        service_name: formCita.service_name || 'Servicio General',
        appointment_date: formCita.appointment_date,
        appointment_time: formCita.appointment_time,
        status: 'pendiente',
        notes: formCita.notes.trim()
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([nuevaCitaPayload])
        .select()
        .single();

      if (error) throw error;

      setCitas(prev => [...prev, data]);
      setMensaje({ text: '✅ ¡Cita agendada con éxito!', type: 'success' });

      setFormCita(prev => ({
        ...prev,
        client_name: '',
        client_phone: '',
        client_email: '',
        notes: ''
      }));

      setModalAbierto(false);

    } catch (err) {
      console.error('Error guardando cita:', err);
      setMensaje({ text: `❌ Error al agendar: ${err.message}`, type: 'error' });
      setModalAbierto(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (citaId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', citaId);

      if (error) throw error;

      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, status: nuevoEstado } : c));
      setMensaje({ text: `✅ Estado actualizado a "${nuevoEstado}"`, type: 'success' });
      setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error actualizando estado de cita:', err);
      setMensaje({ text: `❌ Error al actualizar: ${err.message}`, type: 'error' });
    }
  };

  const handleEnviarRecordatorioWhatsApp = (cita) => {
    let cleanPhone = String(cita.client_phone || '').replace(/[^\d]/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) {
      cleanPhone = `57${cleanPhone}`;
    }
    const mensajeWA = `¡Hola ${cita.client_name || ''}! Te confirmamos tu cita para el servicio "${cita.service_name || 'Agendamiento'}" el día ${cita.appointment_date} a las ${formatearHora(cita.appointment_time)}. ¡Te esperamos!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensajeWA)}`, '_blank');
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  // ============================================
  // MEMOIZACIÓN
  // ============================================
  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      const cumpleEstado = filtroEstado === 'todos' || c.status === filtroEstado;
      const cumpleFecha = !filtroFecha || c.appointment_date === filtroFecha;
      return cumpleEstado && cumpleFecha;
    });
  }, [citas, filtroEstado, filtroFecha]);

  const contadores = useMemo(() => {
    return {
      todos: citas.length,
      pendiente: citas.filter(c => c.status === 'pendiente').length,
      confirmada: citas.filter(c => c.status === 'confirmada').length,
      completada: citas.filter(c => c.status === 'completada').length,
      cancelada: citas.filter(c => c.status === 'cancelada').length
    };
  }, [citas]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarDatosAgenda();
  }, []);

  // Cerrar modal con ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalAbierto) {
        setModalAbierto(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalAbierto]);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="appointments-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE APPOINTMENTS
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .appointments-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0F172A;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* ----- CABECERA ----- */
        .appointments-header {
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
          padding: 10px 18px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          color: #0F172A;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-volver:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          border-color: #CBD5E1;
        }

        .btn-volver:active {
          transform: translateY(0);
        }

        .appointments-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0F172A;
        }

        .appointments-title-icon {
          font-size: 26px;
        }

        .appointments-badge {
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          padding: 2px 12px;
          border-radius: 20px;
          margin-left: 6px;
        }

        .btn-nueva-cita {
          padding: 10px 22px;
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.25);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-nueva-cita:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 102, 255, 0.35);
        }

        .btn-nueva-cita:active {
          transform: translateY(0);
        }

        /* ----- MENSAJES ----- */
        .appointments-message {
          padding: 12px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-weight: 700;
          font-size: 14px;
          animation: slideDown 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .appointments-message--success {
          background: #DCFCE7;
          color: #166534;
          border: 1px solid #BBF7D0;
        }

        .appointments-message--error {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECDD3;
        }

        .appointments-message-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          padding: 0 4px;
          transition: opacity 0.2s ease;
        }

        .appointments-message-close:hover {
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

        /* ----- FILTROS ----- */
        .appointments-filters {
          background: #FFFFFF;
          padding: 16px 20px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          transition: box-shadow 0.2s ease;
        }

        .appointments-filters:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .filters-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 7px 14px;
          border-radius: 10px;
          border: 2px solid transparent;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          cursor: pointer;
          background: #F1F5F9;
          color: #64748B;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-btn:hover {
          background: #E2E8F0;
          transform: translateY(-1px);
        }

        .filter-btn--active {
          background: #0F172A;
          color: #FFFFFF;
          border-color: #0F172A;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }

        .filter-btn--active .filter-count {
          background: rgba(255, 255, 255, 0.15);
        }

        .filter-count {
          background: rgba(0, 0, 0, 0.06);
          padding: 0 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 900;
          min-width: 20px;
          text-align: center;
          color: #94A3B8;
        }

        .filter-btn--active .filter-count {
          color: #FFFFFF;
        }

        .filter-date-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-date-label {
          font-size: 12px;
          font-weight: 800;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .filter-date-input {
          padding: 7px 12px;
          border-radius: 10px;
          border: 2px solid #E2E8F0;
          font-size: 13px;
          background: #F8FAFC;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
          color: #0F172A;
        }

        .filter-date-input:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
        }

        .filter-clear-btn {
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
          border: none;
          background: #F1F5F9;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748B;
          font-family: inherit;
        }

        .filter-clear-btn:hover {
          background: #E2E8F0;
          transform: scale(1.05);
        }

        /* ----- GRID DE CITAS ----- */
        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }

        /* ----- TARJETA DE CITA ----- */
        .appointment-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .appointment-card::before {
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

        .appointment-card:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          transform: translateY(-3px);
          border-color: #CBD5E1;
        }

        .appointment-card:hover::before {
          opacity: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .card-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 12px 4px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .card-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .card-time {
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-service-name {
          font-size: 16px;
          font-weight: 900;
          margin: 0;
          color: #0F172A;
          line-height: 1.3;
        }

        .card-client-info {
          font-size: 13px;
          color: #475569;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-client-line {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-client-icon {
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .card-client-info strong {
          color: #0F172A;
          margin-right: 2px;
        }

        .card-notes {
          font-size: 12px;
          color: #64748B;
          background: #F8FAFC;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 4px 0 0 0;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          border-left: 3px solid #E2E8F0;
        }

        .card-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-whatsapp {
          padding: 8px 14px;
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .btn-whatsapp:hover {
          background: #BBF7D0;
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }

        .btn-whatsapp:active {
          transform: scale(0.97);
        }

        .select-estado {
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 800;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          background: #F8FAFC;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          min-width: 120px;
        }

        .select-estado:hover {
          border-color: #94A3B8;
        }

        .select-estado:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15);
        }

        /* ----- ESTADO VACÍO ----- */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 2px dashed #E2E8F0;
          transition: border-color 0.3s ease;
        }

        .empty-state:hover {
          border-color: #CBD5E1;
        }

        .empty-icon {
          font-size: 56px;
          display: block;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 900;
          margin: 0 0 8px 0;
          color: #0F172A;
        }

        .empty-description {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        .empty-description strong {
          color: #0066FF;
          font-weight: 900;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* ----- ESTADO DE CARGA ----- */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          border-radius: 20px;
          min-height: 300px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #E2E8F0;
          border-top: 4px solid #0066FF;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .loading-text {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* ----- MODAL ----- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 520px;
          width: 100%;
          padding: 32px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
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
          top: 14px;
          right: 14px;
          background: #F1F5F9;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
        }

        .modal-close:hover {
          background: #E2E8F0;
          transform: rotate(90deg);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 900;
          margin: 0 0 20px 0;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-form {
          display: grid;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group-double {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-label {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 2px solid #E2E8F0;
          font-size: 14px;
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
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
          cursor: pointer;
        }

        .form-textarea {
          resize: vertical;
          min-height: 70px;
          line-height: 1.5;
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #059669, #047857);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          margin-top: 6px;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }

        .form-required-hint {
          font-size: 11px;
          color: #94A3B8;
          margin: 4px 0 0 0;
          text-align: right;
        }

        .form-required-hint .form-required {
          color: #EF4444;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */

        @media (max-width: 1024px) {
          .appointments-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .appointments-container {
            padding: 16px 12px;
          }

          .appointments-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 16px;
          }

          .appointments-title {
            font-size: 18px;
            justify-content: center;
          }

          .btn-volver,
          .btn-nueva-cita {
            text-align: center;
            justify-content: center;
            width: 100%;
          }

          .appointments-filters {
            flex-direction: column;
            align-items: stretch;
            padding: 14px 16px;
            gap: 14px;
          }

          .filters-group {
            justify-content: center;
          }

          .filter-date-group {
            justify-content: center;
          }

          .appointments-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            padding: 24px 20px;
            border-radius: 20px;
          }

          .form-group-double {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }

        @media (max-width: 480px) {
          .appointments-container {
            padding: 12px 8px;
          }

          .appointments-header {
            padding: 12px;
            border-radius: 16px;
          }

          .appointments-title {
            font-size: 16px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .btn-volver {
            font-size: 12px;
            padding: 8px 14px;
          }

          .btn-nueva-cita {
            font-size: 12px;
            padding: 8px 16px;
          }

          .filters-group {
            gap: 4px;
          }

          .filter-btn {
            font-size: 10px;
            padding: 5px 10px;
          }

          .filter-count {
            font-size: 9px;
            padding: 0 6px;
          }

          .filter-date-group {
            flex-wrap: wrap;
            gap: 6px;
          }

          .appointment-card {
            padding: 16px;
            border-radius: 14px;
          }

          .card-service-name {
            font-size: 14px;
          }

          .card-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .btn-whatsapp,
          .select-estado {
            width: 100%;
            justify-content: center;
          }

          .select-estado {
            min-width: unset;
          }

          .modal-content {
            padding: 18px 14px;
            border-radius: 16px;
          }

          .modal-title {
            font-size: 17px;
          }

          .form-input,
          .form-select,
          .form-textarea {
            padding: 9px 12px;
            font-size: 13px;
          }

          .form-label {
            font-size: 10px;
          }
        }

        /* ============================================
           SCROLLBAR PERSONALIZADA PARA MODAL
           ============================================ */
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
      `}</style>

      {/* ============================================
          CABECERA
          ============================================ */}
      <header className="appointments-header">
        <button
          type="button"
          onClick={onVolver}
          className="btn-volver"
        >
          <span>🏠</span>
          Volver al Menú Principal
        </button>

        <h1 className="appointments-title">
          <span className="appointments-title-icon">📅</span>
          Agenda de Citas y Servicios
          <span className="appointments-badge">{contadores.todos}</span>
        </h1>

        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="btn-nueva-cita"
        >
          <span>+</span>
          Nueva Cita
        </button>
      </header>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {mensaje.text && (
        <div className={`appointments-message appointments-message--${mensaje.type}`} role="alert">
          <span>{mensaje.text}</span>
          <button
            className="appointments-message-close"
            onClick={() => setMensaje({ text: '', type: '' })}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================
          FILTROS
          ============================================ */}
      <div className="appointments-filters" role="toolbar" aria-label="Filtros de citas">
        <div className="filters-group" role="group" aria-label="Filtrar por estado">
          {['todos', 'pendiente', 'confirmada', 'completada', 'cancelada'].map(est => {
            const isActive = filtroEstado === est;
            const icon = ESTADO_ICONOS[est] || '';
            const count = contadores[est] || 0;

            return (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`filter-btn ${isActive ? 'filter-btn--active' : ''}`}
                aria-pressed={isActive}
              >
                <span>{icon}</span>
                {est === 'todos' ? 'Todas' : est}
                <span className="filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-date-group">
          <label className="filter-date-label" htmlFor="filtroFecha">
            <span>📅</span>
            Fecha:
          </label>
          <input
            id="filtroFecha"
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="filter-date-input"
            aria-label="Filtrar por fecha"
          />
          {filtroFecha && (
            <button
              type="button"
              onClick={() => setFiltroFecha('')}
              className="filter-clear-btn"
              aria-label="Limpiar filtro de fecha"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      {cargando ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p className="loading-text">⚡ Cargando agenda de citas...</p>
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3 className="empty-title">No hay citas agendadas</h3>
          <p className="empty-description">
            Haz clic en <strong>+ Nueva Cita</strong> para registrar la primera reserva de tus clientes.
          </p>
        </div>
      ) : (
        <div className="appointments-grid">
          {citasFiltradas.map(c => {
            const estadoColor = ESTADO_COLORS[c.status] || ESTADO_COLORS.pendiente;

            return (
              <article key={c.id} className="appointment-card">
                {/* Cabecera */}
                <div className="card-header">
                  <span
                    className="card-badge"
                    style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                  >
                    <span
                      className="card-badge-dot"
                      style={{ backgroundColor: estadoColor.dot }}
                    />
                    {estadoColor.label}
                  </span>
                  <span className="card-time">
                    <span>⏰</span>
                    {formatearHora(c.appointment_time)}
                  </span>
                </div>

                {/* Cuerpo */}
                <div className="card-body">
                  <h4 className="card-service-name">{c.service_name}</h4>
                  <div className="card-client-info">
                    <span className="card-client-line">
                      <span className="card-client-icon">👤</span>
                      <strong>Cliente:</strong> {c.client_name}
                    </span>
                    <span className="card-client-line">
                      <span className="card-client-icon">📱</span>
                      <strong>Teléfono:</strong> {c.client_phone}
                    </span>
                    <span className="card-client-line">
                      <span className="card-client-icon">📆</span>
                      <strong>Fecha:</strong> {c.appointment_date}
                    </span>
                  </div>
                  {c.notes && (
                    <p className="card-notes">
                      <span>📝</span>
                      {c.notes}
                    </p>
                  )}
                </div>

                {/* Pie (acciones) */}
                <div className="card-footer">
                  <button
                    type="button"
                    onClick={() => handleEnviarRecordatorioWhatsApp(c)}
                    className="btn-whatsapp"
                    aria-label="Enviar recordatorio por WhatsApp"
                  >
                    <span>💬</span>
                    WhatsApp
                  </button>

                  <select
                    value={c.status}
                    onChange={(e) => handleCambiarEstado(c.id, e.target.value)}
                    className="select-estado"
                    aria-label="Cambiar estado de la cita"
                  >
                    <option value="pendiente">📌 Pendiente</option>
                    <option value="confirmada">✅ Confirmada</option>
                    <option value="completada">✔️ Completada</option>
                    <option value="cancelada">❌ Cancelada</option>
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ============================================
          MODAL - CREAR NUEVA CITA
          ============================================ */}
      {modalAbierto && (
        <div
          className="modal-overlay"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="modal-close"
              aria-label="Cerrar formulario"
            >
              ✕
            </button>

            <h2 className="modal-title">
              <span>📝</span>
              Agendar Nueva Cita
            </h2>

            <form onSubmit={handleCrearCita} className="modal-form" noValidate>
              {/* Servicio */}
              <div className="form-group">
                <label htmlFor="service_id" className="form-label">
                  Servicio a Prestar <span className="form-required">*</span>
                </label>
                <select
                  id="service_id"
                  name="service_id"
                  value={formCita.service_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Selecciona un servicio...</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre del Cliente */}
              <div className="form-group">
                <label htmlFor="client_name" className="form-label">
                  Nombre del Cliente <span className="form-required">*</span>
                </label>
                <input
                  id="client_name"
                  type="text"
                  name="client_name"
                  value={formCita.client_name}
                  onChange={handleChange}
                  placeholder="Ej: Laura Gómez"
                  className="form-input"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Teléfono y Email */}
              <div className="form-group-double">
                <div className="form-group">
                  <label htmlFor="client_phone" className="form-label">
                    Teléfono / WhatsApp <span className="form-required">*</span>
                  </label>
                  <input
                    id="client_phone"
                    type="tel"
                    name="client_phone"
                    value={formCita.client_phone}
                    onChange={handleChange}
                    placeholder="3001234567"
                    className="form-input"
                    required
                    autoComplete="tel"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client_email" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    id="client_email"
                    type="email"
                    name="client_email"
                    value={formCita.client_email}
                    onChange={handleChange}
                    placeholder="cliente@email.com"
                    className="form-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="form-group-double">
                <div className="form-group">
                  <label htmlFor="appointment_date" className="form-label">
                    Fecha <span className="form-required">*</span>
                  </label>
                  <input
                    id="appointment_date"
                    type="date"
                    name="appointment_date"
                    value={formCita.appointment_date}
                    onChange={handleChange}
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appointment_time" className="form-label">
                    Hora <span className="form-required">*</span>
                  </label>
                  <input
                    id="appointment_time"
                    type="time"
                    name="appointment_time"
                    value={formCita.appointment_time}
                    onChange={handleChange}
                    className="form-input"
                    required
                    step="900"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Notas Adicionales
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formCita.notes}
                  onChange={handleChange}
                  placeholder="Detalles del trabajo o requerimientos especiales..."
                  className="form-textarea"
                />
              </div>

              {/* Botón Enviar */}
              <button
                type="submit"
                disabled={guardando}
                className="btn-submit"
              >
                {guardando ? (
                  <>
                    <span className="spinner-small" />
                    Agendando...
                  </>
                ) : (
                  '💾 Confirmar y Agendar'
                )}
              </button>

              <p className="form-required-hint">
                <span className="form-required">*</span> Campos obligatorios
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}