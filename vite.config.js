import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Custom plugin to handle /api routes in development
function apiPlugin() {
	return {
		name: "api-plugin",
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (req.url?.startsWith("/api/")) {
					const url = new URL(req.url, `http://${req.headers.host}`);
					const params = Object.fromEntries(url.searchParams);

					if (req.url.startsWith("/api/weather")) {
						const { lat, lon } = params;
						if (!lat || !lon) {
							res.statusCode = 400;
							res.end(
								JSON.stringify({ error: "Missing lat or lon" })
							);
							return;
						}
						try {
							const apiKey = process.env.OPENWEATHER_API_KEY;
							const response = await fetch(
								`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
							);
							const data = await response.json();
							res.setHeader("Content-Type", "application/json");
							res.end(JSON.stringify(data));
						} catch (error) {
							res.statusCode = 500;
							res.end(
								JSON.stringify({
									error: "Failed to fetch weather"
								})
							);
						}
						return;
					}

					if (req.url.startsWith("/api/timezone")) {
						const { lat, lng } = params;
						if (!lat || !lng) {
							res.statusCode = 400;
							res.end(
								JSON.stringify({ error: "Missing lat or lng" })
							);
							return;
						}
						try {
							const username = process.env.GEONAMES_USERNAME;
							const response = await fetch(
								`http://api.geonames.org/timezoneJSON?username=${username}&lang=en&lat=${lat}&lng=${lng}`
							);
							const data = await response.json();
							res.setHeader("Content-Type", "application/json");
							res.end(JSON.stringify(data));
						} catch (error) {
							res.statusCode = 500;
							res.end(
								JSON.stringify({
									error: "Failed to fetch timezone"
								})
							);
						}
						return;
					}
				}
				next();
			});
		}
	};
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	process.env.OPENWEATHER_API_KEY = env.OPENWEATHER_API_KEY;
	process.env.GEONAMES_USERNAME = env.GEONAMES_USERNAME;

	return {
		plugins: [react(), apiPlugin()],
		css: {
			preprocessorOptions: {
				scss: {
					api: "modern-compiler"
				}
			}
		},
		server: {
			port: 3000
		}
	};
});
