export default async function handler(req, res) {
	// Only allow GET requests
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { lat, lon } = req.query;

	if (!lat || !lon) {
		return res.status(400).json({ error: "Missing lat or lon parameters" });
	}

	const apiKey = process.env.OPENWEATHER_API_KEY;
	if (!apiKey) {
		return res.status(500).json({ error: "API key not configured" });
	}

	try {
		const response = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
		);

		if (!response.ok) {
			throw new Error(`OpenWeather API error: ${response.status}`);
		}

		const data = await response.json();
		return res.status(200).json(data);
	} catch (error) {
		console.error("Weather API error:", error);
		return res.status(500).json({ error: "Failed to fetch weather data" });
	}
}
