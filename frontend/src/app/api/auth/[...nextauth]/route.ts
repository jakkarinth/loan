import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type BackendRole = {
  id: number;
  code: string;
  name_th: string;
};

type BackendLoginResponse = {
  data: {
    access_token: string;
    token_type: "Bearer";
    user: {
      id: number;
      email: string;
      first_name_th: string;
      last_name_th: string;
      roles: BackendRole[];
    };
  };
};

const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          })
        });

        if (!response.ok) return null;

        const body = (await response.json()) as BackendLoginResponse;
        const user = body.data.user;

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.first_name_th} ${user.last_name_th}`,
          firstNameTh: user.first_name_th,
          lastNameTh: user.last_name_th,
          roles: user.roles.map((role) => role.code),
          accessToken: body.data.access_token
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.roles = user.roles;
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          firstNameTh: user.firstNameTh,
          lastNameTh: user.lastNameTh,
          roles: user.roles
        };
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = {
        ...session.user,
        ...token.user
      };
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
