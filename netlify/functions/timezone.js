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
	const lng = url.searchParams.get("lng");

	if (!lat || !lng) {
		return new Response(
			JSON.stringify({ error: "Missing lat or lng parameters" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	const username = process.env.GEONAMES_USERNAME;
	if (!username) {
		return new Response(
			JSON.stringify({ error: "GeoNames username not configured" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	try {
		const response = await fetch(
			`http://api.geonames.org/timezoneJSON?username=${username}&lang=en&lat=${lat}&lng=${lng}`
		);

		if (!response.ok) {
			throw new Error(`GeoNames API error: ${response.status}`);
		}

		const data = await response.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Timezone API error:", error);
		return new Response(
			JSON.stringify({ error: "Failed to fetch timezone data" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" }
			}
		);
	}
};

export const config = {
	path: "/api/timezone"
};
