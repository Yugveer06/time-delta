export default async (req, context) => {
	// Only allow GET requests
	if (req.method !== "GET") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" }
		});
	}

	const url = new URL(req.url);
	const lat = url.searchParams.get("lat");
	const lon = url.searchParams.get("lon");

	if (!lat || !lon) {
		return new Response(
			JSON.stringify({ error: "Missing lat or lon parameters" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	const apiKey = process.env.OPENWEATHER_API_KEY;
	if (!apiKey) {
		return new Response(
			JSON.stringify({ error: "API key not configured" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	try {
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
		);

		if (!response.ok) {
			throw new Error(`OpenWeather API error: ${response.status}`);
		}

		const data = await response.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Weather API error:", error);
		return new Response(
			JSON.stringify({ error: "Failed to fetch weather data" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" }
			}
		);
	}
};

export const config = {
	path: "/api/weather"
};
