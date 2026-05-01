import { z } from "zod";

const schema = z.object({
  COMPOSIO_API_KEY: z.string().min(1),
  COMPOSIO_USER_ID: z.string().default("default"),
});

export const env = (() => {
  try {
    return schema.parse({
      COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
      COMPOSIO_USER_ID: process.env.COMPOSIO_USER_ID,
    });
  } catch (e) {
    return {
      COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY ?? "",
      COMPOSIO_USER_ID: process.env.COMPOSIO_USER_ID ?? "default",
    };
  }
})();
