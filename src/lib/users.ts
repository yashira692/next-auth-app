import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

export type Usuario = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  failedAttempts: number;
  lockUntil: number | null; // timestamp en ms
};

// ------------------------------------------------------------------
// Almacenamiento de usuarios:
//  - Si existe DATABASE_URL (Postgres en Neon, usado en Vercel) se usa la BD.
//  - Si no, se guarda en data/users.json (desarrollo local).
// ------------------------------------------------------------------
const usarBD = !!process.env.DATABASE_URL;
const sql = usarBD ? neon(process.env.DATABASE_URL as string) : null;
let tablaLista = false;

async function asegurarTabla() {
  if (!sql || tablaLista) return;
  await sql`CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    lock_until BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  tablaLista = true;
}

// En Vercel el sistema de archivos es de solo lectura (salvo /tmp)
const archivo = process.env.VERCEL
  ? path.join("/tmp", "users.json")
  : path.join(process.cwd(), "data", "users.json");

async function leerArchivo(): Promise<Usuario[]> {
  try {
    return JSON.parse(await fs.readFile(archivo, "utf8"));
  } catch {
    return [];
  }
}

async function guardarArchivo(usuarios: Usuario[]) {
  await fs.mkdir(path.dirname(archivo), { recursive: true });
  await fs.writeFile(archivo, JSON.stringify(usuarios, null, 2), "utf8");
}

type Fila = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  failed_attempts: number;
  lock_until: string | null;
};

function deFila(f: Fila): Usuario {
  return {
    id: String(f.id),
    name: f.name,
    email: f.email,
    passwordHash: f.password_hash,
    failedAttempts: f.failed_attempts,
    lockUntil: f.lock_until ? Number(f.lock_until) : null,
  };
}

export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  const correo = email.trim().toLowerCase();
  if (sql) {
    await asegurarTabla();
    const filas = (await sql`SELECT * FROM usuarios WHERE email = ${correo}`) as Fila[];
    return filas.length ? deFila(filas[0]) : null;
  }
  const usuarios = await leerArchivo();
  return usuarios.find((u) => u.email === correo) ?? null;
}

export async function crearUsuario(name: string, email: string, passwordHash: string): Promise<Usuario> {
  const correo = email.trim().toLowerCase();
  if (sql) {
    await asegurarTabla();
    const filas = (await sql`
      INSERT INTO usuarios (name, email, password_hash)
      VALUES (${name.trim()}, ${correo}, ${passwordHash})
      RETURNING *`) as Fila[];
    return deFila(filas[0]);
  }
  const usuarios = await leerArchivo();
  const nuevo: Usuario = {
    id: String(Date.now()),
    name: name.trim(),
    email: correo,
    passwordHash,
    failedAttempts: 0,
    lockUntil: null,
  };
  usuarios.push(nuevo);
  await guardarArchivo(usuarios);
  return nuevo;
}

export async function actualizarIntentos(email: string, failedAttempts: number, lockUntil: number | null) {
  const correo = email.trim().toLowerCase();
  if (sql) {
    await asegurarTabla();
    await sql`UPDATE usuarios SET failed_attempts = ${failedAttempts}, lock_until = ${lockUntil} WHERE email = ${correo}`;
    return;
  }
  const usuarios = await leerArchivo();
  const u = usuarios.find((x) => x.email === correo);
  if (u) {
    u.failedAttempts = failedAttempts;
    u.lockUntil = lockUntil;
    await guardarArchivo(usuarios);
  }
}
