import { Link, useRouteError } from 'react-router';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';

  return (
    <div className="mx-auto max-w-[760px] px-4 py-16">
      <div className="rounded-[16px] border border-red-100 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-800">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-red-700">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Rafraîchir
          </button>
          <Link
            to="/"
            className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Retour accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
