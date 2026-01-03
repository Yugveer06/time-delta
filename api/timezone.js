export default async function handler(req, res) {
	// Only allow GET requests
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { lat, lng } = req.query;

	if (!lat || !lng) {
		return res.status(400).json({ error: "Missing lat or lng parameters" });
	}

	const username = process.env.GEONAMES_USERNAME;
	if (!username) {
		return res
			.status(500)
			.json({ error: "GeoNames username not configured" });
	}

	try {
		const response = await fetch(
			`http://api.geonames.org/timezoneJSON?username=${username}&lang=en&lat=${lat}&lng=${lng}`
		);

		if (!response.ok) {
			throw new Error(`GeoNames API error: ${response.status}`);
		}

		const data = await response.json();
		return res.status(200).json(data);
	} catch (error) {
		console.error("Timezone API error:", error);
		return res.status(500).json({ error: "Failed to fetch timezone data" });
	}
}
