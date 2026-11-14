'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaGoogle, FaGithub } from "react-icons/fa";

const erroresOAuth: Record<string, string> = {
  OAuthAccountNotLinked: 'Ese correo ya está asociado a otro método de inicio de sesión.',
  AccessDenied: 'Acceso denegado.',
  Callback: 'No se pudo completar el inicio de sesión. Intenta otra vez.',
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const errorUrl = params.get('error');
  const [error, setError] = useState<string | null>(
    errorUrl ? erroresOAuth[errorUrl] ?? 'No se pudo iniciar sesión.' : null
  );
  const registrado = params.get('registrado') === '1';

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleGitHubSignIn = async () => {
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setCargando(false);

    if (result?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result?.error ?? 'No se pudo iniciar sesión.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl text-gray-800 font-bold mb-6 text-center">
          Sign In
        </h1>

        {registrado && (
          <p className="mb-4 rounded bg-green-100 text-green-800 text-sm p-3">
            Cuenta creada. Ya puedes iniciar sesión.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded bg-red-100 text-red-700 text-sm p-3">{error}</p>
        )}

        <form onSubmit={handleCredentials} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 text-gray-800"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 text-gray-800"
          />
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-3">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">Regístrate</Link>
        </p>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-xs text-gray-500">o continúa con</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"
          >
            <FaGoogle />
            Continue with Google
          </button>
          <button
            onClick={handleGitHubSignIn}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"
          >
            <FaGithub />
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
