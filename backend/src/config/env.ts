import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16).default("replace-with-secure-jwt-secret"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3307),
  DB_USER: z.string().default("loan_user"),
  DB_PASSWORD: z.string().default("loan_password"),
  DB_NAME: z.string().default("rmuti_surin_loan")
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  if (env.JWT_SECRET === "replace-with-secure-jwt-secret") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_SECRET"],
      message: "JWT_SECRET must be set to a production secret"
    });
  }
});

export const env = envSchema.parse(process.env);
