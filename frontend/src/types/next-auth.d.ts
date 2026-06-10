import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: DefaultSession["user"] & {
      id?: string;
      firstNameTh?: string;
      lastNameTh?: string;
      roles?: string[];
    };
  }

  interface User {
    firstNameTh?: string;
    lastNameTh?: string;
    roles?: string[];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    roles?: string[];
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      firstNameTh?: string;
      lastNameTh?: string;
      roles?: string[];
    };
  }
}
