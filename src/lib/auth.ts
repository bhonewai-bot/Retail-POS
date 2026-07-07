import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year (max allowed by cookie spec is ~400 days)
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
      strategy: "compact", // Smallest payload for POS performance
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "cashier",
      },
    },
  },
});
