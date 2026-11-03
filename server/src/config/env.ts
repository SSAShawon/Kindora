import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}. See server/.env.example.`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/kindora?directConnection=true"),
  mongoDbName: process.env.MONGODB_DB_NAME ?? "kindora",
  authSecret: required("BETTER_AUTH_SECRET", "dev-only-secret-change-me-0123456789abcdef"),
  authUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  seedResetAllowed: process.env.ALLOW_SEED_RESET === "true",
};

if (env.isProduction && env.authSecret.startsWith("dev-only-secret")) {
  throw new Error("BETTER_AUTH_SECRET must be set to a strong random value in production.");
}

export const googleAuthEnabled = Boolean(env.googleClientId && env.googleClientSecret);
