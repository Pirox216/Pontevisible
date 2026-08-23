import { useState } from 'react'
import { supabase } from '../config/supabase'

// Lista de los Sectores Maestros
const SECTORES_MAESTROS = [
  { id: 'comercio', label: 'Comercio / Retail / Productos Físicos' },
  { id: 'gastronomia', label: 'Gastronomía / Restaurantes / Comida' },
  { id: 'belleza_salud', label: 'Belleza, Salud y Cuidado Personal' },
  { id: 'servicios_profesionales', label: 'Servicios Profesionales / Consultoría' },
  { id: 'mantenimiento_tecnico', label: 'Mantenimiento Técnico / Servicios del Hogar' },
]

export default function Register({ onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [industrySector, setIndustrySector] = useState('comercio')
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: businessName.trim(),
            business_name: businessName.trim(),
            industry_sector: industrySector,
            promo_code: promoCode.trim().toUpperCase() || null
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else if (data?.user) {
        setMessage('✅ ¡Cuenta creada con éxito! Abriendo el espacio de tu negocio...')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container" role="main" aria-labelledby="register-title">
      <div className="register-header">
        <h2 id="register-title" className="register-title">
          PonteVisible <span className="rocket-icon" aria-hidden="true">🚀</span>
        </h2>
        <h3 className="register-subtitle">Registrar mi negocio</h3>
        <p className="register-description">Comienza a vender más y organiza tu vitrina comercial</p>
      </div>

      <form onSubmit={handleRegister} className="register-form">
        <div className="form-group">
          <label htmlFor="businessName">Nombre de tu negocio:</label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="Ej: Calzado El Triunfo"
          />
        </div>

        <div className="form-group">
          <label htmlFor="industrySector">Rubro o sector principal:</label>
          <select
            id="industrySector"
            value={industrySector}
            onChange={(e) => setIndustrySector(e.target.value)}
          >
            {SECTORES_MAESTROS.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email">Tu correo electrónico:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ejemplo@minegocio.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Crea tu clave de acceso:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <div className="form-group">
          <label htmlFor="promoCode">¿Tienes un código de convenio o invitación? (Opcional)</label>
          <input
            id="promoCode"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Ej: CAMARA_COMERCIO_2026"
            className="input-promo"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
          aria-busy={loading}
        >
          {loading ? 'Un momento...' : 'Crear mi cuenta gratis'}
        </button>
      </form>

      {message && (
        <div
          className={`message-box ${message.includes('✅') ? 'message-success' : 'message-error'}`}
          role="status"
          aria-live="polite"
        >
          <p>{message}</p>
        </div>
      )}

      <div className="footer-switch">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="btn-switch"
        >
          ¿Ya tienes cuenta? Entra a tu negocio
        </button>
      </div>

      <style jsx>{`
        .register-container {
          max-width: 440px;
          margin: 40px auto;
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          padding: 32px;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          background-color: #FFFFFF;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .register-container:hover {
          box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.08);
          border-color: #CBD5E1;
        }

        .register-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .register-title {
          color: #0F172A;
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .rocket-icon {
          color: #0066FF;
        }

        .register-subtitle {
          font-size: 18px;
          color: #4A5568;
          font-weight: 600;
          margin: 6px 0 0 0;
        }

        .register-description {
          font-size: 13px;
          color: #718096;
          margin: 4px 0 0 0;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          color: #2D3748;
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 14px;
          box-sizing: border-box;
          border: 1px solid #CBD5E0;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          background-color: #FFFFFF;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.12);
        }

        .input-promo {
          border: 1px dashed #A0AEC0 !important;
          background-color: #F7FAFC !important;
          text-transform: uppercase;
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background-color: #059669;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          background-color: #047857;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
        }

        .btn-submit:disabled {
          background-color: #A0AEC0;
          cursor: not-allowed;
          box-shadow: none;
        }

        .message-box {
          margin-top: 20px;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .message-success {
          background-color: #F0FFF4;
          border: 1px solid #C6F6D5;
        }

        .message-error {
          background-color: #FFF5F5;
          border: 1px solid #FEB2B2;
        }

        .message-box p {
          margin: 0;
          font-size: 14px;
          text-align: center;
          font-weight: 500;
          line-height: 1.4;
        }

        .message-success p {
          color: #22543D;
        }

        .message-error p {
          color: #9B2C2C;
        }

        .footer-switch {
          margin-top: 24px;
          text-align: center;
        }

        .btn-switch {
          background: none;
          border: none;
          color: #0066FF;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          text-decoration: underline;
          transition: color 0.2s ease;
        }

        .btn-switch:hover {
          color: #1E3A8A;
        }

        @media (max-width: 480px) {
          .register-container {
            margin: 16px;
            padding: 24px 16px;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  )
}