import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

/**
 * Full auth config with credential providers — Node.js only.
 * Uses dynamic import for @amazone/users to avoid pulling in @amazone/db
 * at module evaluation time (important when this module is indirectly
 * referenced from middleware via shared type exports).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dynamic import keeps @amazone/db out of the module graph
        // until an actual sign-in attempt occurs
        const { getUserByEmail } = await import("@amazone/users");
        const user = await getUserByEmail(credentials.email as string);
        if (!user || !user.hashedPassword) {
          return null;
        }

        // TODO: Replace with proper bcrypt comparison
        // const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        // if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
