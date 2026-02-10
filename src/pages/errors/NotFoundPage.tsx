import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

/**
 *
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-primary">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Voltar para o Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
