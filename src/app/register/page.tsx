'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    setCargando(false);
    if (res.ok) {
      router.push('/signIn?registrado=1');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo registrar.');
    }
  };

  const input = "border border-gray-300 rounded px-3 py-2 text-gray-800";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl text-gray-800 font-bold mb-6 text-center">Crear cuenta</h1>
        {error && <p className="mb-4 rounded bg-red-100 text-red-700 text-sm p-3">{error}</p>}
        <form onSubmit={registrar} className="flex flex-col gap-3">
          <input name="name" placeholder="Nombre completo" value={form.name} onChange={cambiar} required className={input} />
          <input name="email" type="email" placeholder="Correo" value={form.email} onChange={cambiar} required className={input} />
          <input name="password" type="password" placeholder="Contraseña (mín. 6 caracteres)" value={form.password} onChange={cambiar} required minLength={6} className={input} />
          <input name="confirm" type="password" placeholder="Confirmar contraseña" value={form.confirm} onChange={cambiar} required className={input} />
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {cargando ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/signIn" className="text-blue-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
