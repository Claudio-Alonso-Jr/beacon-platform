import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/** Dev-server twin of api/instagram.ts — same core, same contract. */
function instagramDevApi(): Plugin {
  return {
    name: "instagram-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/instagram", (req, res) => {
        void (async () => {
          const url = new URL(req.url ?? "/", "http://localhost");
          const handle = (url.searchParams.get("handle") ?? "").toLowerCase().trim();
          res.setHeader("content-type", "application/json");
          if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "invalid_handle" }));
            return;
          }
          const { fetchPublicSnapshot, ProviderHttpError } = await import("./api/_lib/instagram");
          try {
            const snapshot = await fetchPublicSnapshot(handle);
            res.end(JSON.stringify({ snapshot }));
          } catch (error) {
            const code = error instanceof ProviderHttpError ? error.code : "unavailable";
            res.statusCode =
              { private: 403, not_found: 404, rate_limited: 429 }[code as string] ?? 502;
            res.end(JSON.stringify({ error: code }));
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), instagramDevApi()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
