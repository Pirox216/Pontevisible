// src/components/Login/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { traducirError } from '../utils/traducirError';

// ============================================
// COMPONENTE - LOGO PONTEVISIBLE
// ============================================
function LogoPonteVisibleLogin({ size = 46 }) {
  return (
    <div className="logo-container">
      <style jsx>{`
        .logo-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .logo-text {
          font-size: 26px;
          font-weight: 900;
          color: #0B132B;
          letter-spacing: -0.5px;
        }

        .logo-text span {
          color: #0066FF;
        }

        .logo-tagline {
          font-size: 11px;
          color: #64748B;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .logo-svg {
          display: block;
        }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
      >
        <defs>
          <linearGradient id="pvLoginGradOfficial" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00F5D4" />
          </linearGradient>
        </defs>
        {/* Isotipo: 'P' en bucle continuo con pin GPS y ondas */}
        <path
          d="M 30 85 L 30 45 C 30 25, 65 25, 65 45 C 65 60, 48 60, 48 60"
          stroke="url(#pvLoginGradOfficial)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="42" r="6" fill="#00F5D4" />
        <path d="M 74 34 C 79 39, 79 51, 74 56" stroke="#00F5D4" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M 83 26 C 91 35, 91 55, 83 64"
          stroke="#00F5D4"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      <div className="logo-text">
        Ponte<span>Visible</span>
      </div>
      <span className="logo-tagline">Hazte visible. Conecta. Crece.</span>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL - LOGIN
// ============================================
export default function Login({ onSwitchToRegister }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;
    } catch (error) {
      const mensajeAmigable = traducirError(error?.message || error);
      setMessage({
        text: mensajeAmigable,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage({
        text: 'Por favor, ingresa tu correo electrónico primero.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setMessage({
        text: '✅ ¡Te hemos enviado un enlace para restablecer tu contraseña! Revisa tu bandeja de entrada.',
        type: 'success'
      });
    } catch (error) {
      const mensajeAmigable = traducirError(error?.message || error);
      setMessage({
        text: mensajeAmigable,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="login-container">
      <style jsx>{`
        /* ============================================
           ESTILOS DEL COMPONENTE LOGIN
           ============================================ */

        /* ----- CONTENEDOR PRINCIPAL ----- */
        .login-container {
          width: 100%;
          max-width: 430px;
          background: #FFFFFF;
          border-radius: 26px;
          padding: 36px 32px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 16px 36px -10px rgba(11, 19, 43, 0.08);
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
          color: #0F172A;
          text-align: center;
          transition: all 0.3s ease;
        }

        .login-container:hover {
          box-shadow: 0 20px 48px -12px rgba(11, 19, 43, 0.12);
        }

        /* ----- SUBTÍTULO ----- */
        .login-subtitle {
          font-size: 13px;
          color: #475569;
          margin: 4px 0 24px 0;
          font-weight: 600;
        }

        /* ----- MENSAJE ----- */
        .login-message {
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 18px;
          text-align: left;
          animation: slideDown 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-message--success {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .login-message--error {
          background: #FFF1F2;
          color: #BE123C;
          border: 1px solid #FECDD3;
        }

        .login-message-icon {
          font-size: 16px;
          flex-shrink: 0;
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

        /* ----- FORMULARIO ----- */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          letter-spacing: 0.3px;
        }

        .form-label-required {
          color: #EF4444;
          font-weight: 900;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          box-sizing: border-box;
          border: 2px solid #CBD5E1;
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Sora', system-ui, sans-serif;
          outline: none;
          transition: all 0.2s ease;
          background: #F8FAFC;
          color: #0F172A;
        }

        .form-input:hover {
          border-color: #94A3B8;
          background: #FFFFFF;
        }

        .form-input:focus {
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
          background: #FFFFFF;
        }

        .form-input::placeholder {
          color: #94A3B8;
        }

        /* ----- BOTÓN ENVIAR ----- */
        .btn-submit {
          width: 100%;
          padding: 13px;
          margin-top: 6px;
          background: linear-gradient(135deg, #0066FF, #0052CC);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Sora', system-ui, sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.25);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
          position: relative;
          overflow: hidden;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 102, 255, 0.35);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ----- SPINNER DEL BOTÓN ----- */
        .btn-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ----- ENLACES INFERIORES ----- */
        .login-footer {
          margin-top: 22px;
          border-top: 1px solid #F1F5F9;
          padding-top: 18px;
          text-align: center;
        }

        .btn-reset {
          background: none;
          border: none;
          color: #64748B;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: block;
          margin: 0 auto 10px auto;
          text-decoration: underline;
          font-family: 'Sora', system-ui, sans-serif;
          transition: color 0.2s ease;
          padding: 4px 8px;
        }

        .btn-reset:hover:not(:disabled) {
          color: #0066FF;
        }

        .btn-reset:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer-text {
          font-size: 12px;
          color: #64748B;
        }

        .btn-register {
          background: none;
          border: none;
          color: #0066FF;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
          font-family: 'Sora', system-ui, sans-serif;
          padding: 0;
          text-decoration: underline;
          transition: color 0.2s ease;
        }

        .btn-register:hover {
          color: #0044CC;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 480px) {
          .login-container {
            padding: 28px 20px;
            border-radius: 20px;
            max-width: 100%;
            margin: 0 12px;
          }

          .logo-text {
            font-size: 22px;
          }

          .form-input {
            font-size: 12px;
            padding: 10px 12px;
          }

          .btn-submit {
            font-size: 13px;
            padding: 11px;
          }

          .login-subtitle {
            font-size: 12px;
          }
        }

        @media (max-width: 380px) {
          .login-container {
            padding: 20px 16px;
            border-radius: 16px;
          }

          .logo-text {
            font-size: 19px;
          }

          .logo-tagline {
            font-size: 10px;
          }

          .form-label {
            font-size: 11px;
          }

          .btn-submit {
            font-size: 12px;
            padding: 10px;
          }
        }
      `}</style>

      {/* ============================================
          LOGO
          ============================================ */}
      <LogoPonteVisibleLogin size={46} />

      <p className="login-subtitle">Entrada a tu Negocio</p>

      {/* ============================================
          MENSAJE
          ============================================ */}
      {message.text && (
        <div className={`login-message login-message--${message.type}`} role="alert">
          <span className="login-message-icon">
            {message.type === 'success' ? '✅' : '⚠️'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* ============================================
          FORMULARIO
          ============================================ */}
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label className="form-label">
            Correo <span className="form-label-required">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@minegocio.com"
            required
            className="form-input"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Tu clave <span className="form-label-required">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="form-input"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Cargando...
            </>
          ) : (
            'Entrar a mi negocio'
          )}
        </button>
      </form>

      {/* ============================================
          ENLACES INFERIORES
          ============================================ */}
      <div className="login-footer">
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={loading}
          className="btn-reset"
        >
          ¿Olvidaste tu clave?
        </button>

        <div className="login-footer-text">
          ¿Es tu primera vez aquí?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="btn-register"
          >
            Registra tu negocio gratis
          </button>
        </div>
      </div>
    </div>
  );
}