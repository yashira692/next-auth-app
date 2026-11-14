import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { buscarPorEmail, actualizarIntentos } from "@/lib/users";

// Bloqueo por intentos fallidos
export const MAX_INTENTOS = 3;
export const MINUTOS_BLOQUEO = 5;

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) throw new Error("Ingresa tu correo y contraseña.");

        const usuario = await buscarPorEmail(email);
        if (!usuario) throw new Error("Correo o contraseña incorrectos.");

        // 1) ¿La cuenta está bloqueada?
        const ahora = Date.now();
        if (usuario.lockUntil && usuario.lockUntil > ahora) {
          const min = Math.ceil((usuario.lockUntil - ahora) / 60000);
          throw new Error(`Cuenta bloqueada por demasiados intentos. Intenta de nuevo en ${min} minuto(s).`);
        }

        // 2) Comparar la contraseña con el hash guardado (bcrypt)
        const valida = await bcrypt.compare(password, usuario.passwordHash);
        if (!valida) {
          const intentos = usuario.failedAttempts + 1;
          if (intentos >= MAX_INTENTOS) {
            await actualizarIntentos(email, 0, ahora + MINUTOS_BLOQUEO * 60000);
            throw new Error(`Demasiados intentos fallidos. Tu cuenta se bloqueó por ${MINUTOS_BLOQUEO} minutos.`);
          }
          await actualizarIntentos(email, intentos, null);
          const quedan = MAX_INTENTOS - intentos;
          throw new Error(`Contraseña incorrecta. Te queda(n) ${quedan} intento(s).`);
        }

        // 3) Login correcto: se reinician los intentos
        await actualizarIntentos(email, 0, null);
        return { id: usuario.id, name: usuario.name, email: usuario.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signIn" },
  callbacks: {
    // Guarda el proveedor usado (google, github o credentials) en el token
    async jwt({ token, account }) {
      if (account) token.provider = account.provider;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.provider = token.provider as string | undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
