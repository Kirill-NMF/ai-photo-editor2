import { z } from "zod";
import path from "node:path";

const DEFAULT_LOCAL_STORAGE_LIMIT = 15 * 1024 ** 3;

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(5080),
    PUBLIC_BASE_URL: optionalString.pipe(z.string().url().optional()),
    DATABASE_URL: z.string().trim().min(1),
    SESSION_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: optionalString.pipe(z.string().url().optional()),
    TELEGRAM_BOT_TOKEN: optionalString,
    TELEGRAM_BOT_USERNAME: optionalString,
    LOCAL_STORAGE_DIR: z.string().trim().min(1).default("data/object-storage"),
    LOCAL_STORAGE_LIMIT_BYTES: z.coerce.number().int().positive().default(DEFAULT_LOCAL_STORAGE_LIMIT),
    OPENROUTER_API_KEY: optionalString,
    PROMO_CODE: optionalString,
  })
  .superRefine((env, context) => {
    const googleValues = [
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI,
    ];
    if (googleValues.some(Boolean) && !googleValues.every(Boolean)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Google OAuth configuration is incomplete",
      });
    }

    const telegramValues = [env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_BOT_USERNAME];
    if (telegramValues.some(Boolean) && !telegramValues.every(Boolean)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telegram authentication configuration is incomplete",
      });
    }

    if (env.NODE_ENV === "production" && !path.isAbsolute(env.LOCAL_STORAGE_DIR)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Local storage directory must be absolute in production",
      });
    }
  });

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  publicBaseUrl?: string;
  databaseUrl: string;
  sessionSecret: string;
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  telegram?: {
    botToken: string;
    botUsername: string;
  };
  localStorage: {
    directory: string;
    maxBytes: number;
  };
  openRouterApiKey?: string;
  promoCode?: string;
}

export function parseConfig(
  environment: Record<string, string | undefined>,
): AppConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const messages = Array.from(
      new Set(parsed.error.issues.map((issue) => issue.message)),
    );
    throw new Error(`Invalid environment configuration: ${messages.join("; ")}`);
  }

  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    publicBaseUrl: env.PUBLIC_BASE_URL,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            redirectUri: env.GOOGLE_REDIRECT_URI,
          }
        : undefined,
    telegram:
      env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME
        ? {
            botToken: env.TELEGRAM_BOT_TOKEN,
            botUsername: env.TELEGRAM_BOT_USERNAME,
          }
        : undefined,
    localStorage: {
      directory: path.resolve(env.LOCAL_STORAGE_DIR),
      maxBytes: env.LOCAL_STORAGE_LIMIT_BYTES,
    },
    openRouterApiKey: env.OPENROUTER_API_KEY,
    promoCode: env.PROMO_CODE,
  };
}

let cachedConfig: AppConfig | undefined;

export function getConfig(): AppConfig {
  cachedConfig ??= parseConfig(process.env);
  return cachedConfig;
}

export function requireOpenRouterApiKey(config: AppConfig = getConfig()): string {
  if (!config.openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required for image editing");
  }
  return config.openRouterApiKey;
}
