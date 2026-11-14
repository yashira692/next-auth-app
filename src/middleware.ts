import { withAuth } from "next-auth/middleware"

// Protege /dashboard y /profile: sin sesión redirige a /signIn
export default withAuth({
  pages: { signIn: "/signIn" },
})

export const config = { matcher: ["/dashboard", "/profile"] }
