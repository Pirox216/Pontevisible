import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
      <SEO title="404 - Página no encontrada | PonteVisible" description="La página que buscas no existe." />
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="mt-4 text-lg text-gray-600">Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
        Volver al inicio
      </Link>
    </div>
  );
}