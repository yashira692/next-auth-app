import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { buscarPorEmail, crearUsuario } from "@/lib/users";

export async function POST(request: Request) {
  const { name, email, password } = await request.json().catch(() => ({}));

  if (!name || String(name).trim().length < 2)
    return NextResponse.json({ error: "El nombre debe tener al menos 2 caracteres." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))
    return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });
  if (!password || String(password).length < 6)
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });

  if (await buscarPorEmail(String(email)))
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });

  // Cifrado de la contraseña con bcrypt (10 rondas de salt)
  const passwordHash = await bcrypt.hash(String(password), 10);
  const usuario = await crearUsuario(String(name), String(email), passwordHash);

  return NextResponse.json({ id: usuario.id, name: usuario.name, email: usuario.email }, { status: 201 });
}
