import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, "0.0.0.0", () => {
  console.log(`[kindora-api] listening on http://0.0.0.0:${env.port}`);
  console.log(`[kindora-api] auth base URL: ${env.authUrl}`);
  console.log(`[kindora-api] allowed client origin: ${env.clientOrigin}`);
});
