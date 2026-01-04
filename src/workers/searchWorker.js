// Web Worker for fast fuzzy location search
let searchIndex = null;
let isIndexReady = false;

// Build a flat search index with pre-computed search tokens
function buildSearchIndex(data) {
	const index = [];

	for (const country of data) {
		// Add country entry
		index.push({
			type: "country",
			searchName: country.name.toLowerCase(),
			searchTokens: tokenize(country.name),
			name: country.name,
			latitude: country.latitude,
			longitude: country.longitude,
			region: country.region,
			currency: country.currency,
			currency_name: country.currency_name,
			currency_symbol: country.currency_symbol,
			phone_code: country.phone_code,
			country_code: {
				iso2: country.iso2,
				iso3: country.iso3
			}
		});

		if (country.states) {
			for (const state of country.states) {
				index.push({
					type: "state",
					searchName: state.name.toLowerCase(),
					searchTokens: tokenize(state.name),
					parentTokens: tokenize(country.name),
					name: state.name,
					latitude: state.latitude,
					longitude: state.longitude,
					countryName: country.name,
					region: country.region,
					currency: country.currency,
					currency_name: country.currency_name,
					currency_symbol: country.currency_symbol,
					phone_code: country.phone_code,
					country_code: {
						iso2: country.iso2,
						iso3: country.iso3
					}
				});

				if (state.cities) {
					for (const city of state.cities) {
						index.push({
							type: "city",
							searchName: city.name.toLowerCase(),
							searchTokens: tokenize(city.name),
							parentTokens: tokenize(
								state.name + " " + country.name
							),
							name: city.name,
							latitude: city.latitude,
							longitude: city.longitude,
							stateName: state.name,
							countryName: country.name,
							region: country.region,
							currency: country.currency,
							currency_name: country.currency_name,
							currency_symbol: country.currency_symbol,
							phone_code: country.phone_code,
							country_code: {
								iso2: country.iso2,
								iso3: country.iso3
							}
						});
					}
				}
			}
		}
	}

	return index;
}

// Tokenize a string into searchable words
function tokenize(str) {
	return str
		.toLowerCase()
		.split(/[\s,.-]+/)
		.filter((t) => t.length > 0);
}

// Fast fuzzy match score - returns 0 if no match, higher = better
function fuzzyScore(query, target) {
	if (!target) return 0;

	const q = query.toLowerCase();
	const t = target.toLowerCase();

	// Exact match - highest score
	if (t === q) return 1000;

	// Starts with query - very high score
	if (t.startsWith(q)) return 800 + (q.length / t.length) * 100;

	// Word boundary match (query matches start of a word)
	const words = t.split(/[\s,.-]+/);
	for (let i = 0; i < words.length; i++) {
		if (words[i].startsWith(q)) {
			return 600 + (q.length / words[i].length) * 50 - i * 10;
		}
	}

	// Contains query as substring
	const idx = t.indexOf(q);
	if (idx !== -1) {
		return 400 + (q.length / t.length) * 50 - idx * 2;
	}

	// Fuzzy character sequence match
	const fuzzy = fuzzySequenceMatch(q, t);
	if (fuzzy.matched) {
		return 100 + fuzzy.score;
	}

	return 0;
}

// Check if query characters appear in order in target (fuzzy)
function fuzzySequenceMatch(query, target) {
	let qIdx = 0;
	let score = 0;
	let consecutive = 0;
	let lastMatchIdx = -2;

	for (let tIdx = 0; tIdx < target.length && qIdx < query.length; tIdx++) {
		if (target[tIdx] === query[qIdx]) {
			// Bonus for consecutive matches
			if (tIdx === lastMatchIdx + 1) {
				consecutive++;
				score += consecutive * 5;
			} else {
				consecutive = 1;
				score += 1;
			}
			// Bonus for matching at word boundaries
			if (tIdx === 0 || /[\s,.-]/.test(target[tIdx - 1])) {
				score += 10;
			}
			lastMatchIdx = tIdx;
			qIdx++;
		}
	}

	const matched = qIdx === query.length;
	// Penalize long targets with sparse matches
	if (matched) {
		score = score * (query.length / target.length);
	}

	return { matched, score };
}

// Multi-keyword search with scoring
function search(query, maxResults = 100) {
	if (!isIndexReady || !query) return [];

	const trimmedQuery = query.trim().toLowerCase();
	if (trimmedQuery.length < 2) return [];

	// Split query into keywords
	const keywords = trimmedQuery.split(/\s+/).filter((k) => k.length > 0);

	const scored = [];
	const minScoreThreshold = 50; // Filter out weak matches

	for (const item of searchIndex) {
		let totalScore = 0;
		let matchedKeywords = 0;

		for (const keyword of keywords) {
			// Score against primary name
			const nameScore = fuzzyScore(keyword, item.searchName);

			// Score against parent (country/state) for context matching
			let parentScore = 0;
			if (item.parentTokens) {
				for (const token of item.parentTokens) {
					parentScore = Math.max(
						parentScore,
						fuzzyScore(keyword, token) * 0.5
					);
				}
			}

			const keywordScore = Math.max(nameScore, parentScore);

			if (keywordScore > 0) {
				matchedKeywords++;
				totalScore += keywordScore;
			}
		}

		// All keywords must match something
		if (
			matchedKeywords === keywords.length &&
			totalScore >= minScoreThreshold
		) {
			// Type weighting: prefer cities > states > countries for specificity
			const typeBonus =
				item.type === "city" ? 20 : item.type === "state" ? 10 : 0;

			// Bonus for matching all keywords in the primary name
			const allInName = keywords.every((k) =>
				item.searchName.includes(k)
			);
			const nameBonus = allInName ? 50 : 0;

			scored.push({
				item,
				score: totalScore + typeBonus + nameBonus
			});
		}

		// Early termination: if we have lots of high-quality matches, stop
		if (scored.length >= maxResults * 3) {
			break;
		}
	}

	// Sort by score descending
	scored.sort((a, b) => b.score - a.score);

	// Return top results
	return scored.slice(0, maxResults).map((s) => formatResult(s.item));
}

// Format result back to the expected structure
function formatResult(item) {
	if (item.type === "country") {
		return {
			name: item.name,
			latitude: item.latitude,
			longitude: item.longitude,
			region: item.region,
			currency: item.currency,
			currency_name: item.currency_name,
			currency_symbol: item.currency_symbol,
			phone_code: item.phone_code,
			country_code: {
				iso2: item.country_code.iso2,
				iso3: item.country_code.iso3
			}
		};
	} else if (item.type === "state") {
		return {
			name: item.countryName,
			region: item.region,
			currency: item.currency,
			currency_name: item.currency_name,
			currency_symbol: item.currency_symbol,
			phone_code: item.phone_code,
			country_code: {
				iso2: item.country_code.iso2,
				iso3: item.country_code.iso3
			},
			states: [
				{
					name: item.name,
					latitude: item.latitude,
					longitude: item.longitude
				}
			]
		};
	} else {
		return {
			name: item.countryName,
			region: item.region,
			currency: item.currency,
			currency_name: item.currency_name,
			currency_symbol: item.currency_symbol,
			phone_code: item.phone_code,
			country_code: {
				iso2: item.country_code.iso2,
				iso3: item.country_code.iso3
			},
			states: [
				{
					name: item.stateName,
					cities: [
						{
							name: item.name,
							latitude: item.latitude,
							longitude: item.longitude
						}
					]
				}
			]
		};
	}
}

// Handle messages from main thread
self.onmessage = function (e) {
	const { type, payload } = e.data;

	if (type === "INIT") {
		if (payload && payload.data) {
			searchIndex = buildSearchIndex(payload.data);
			isIndexReady = true;
			self.postMessage({ type: "READY" });
		} else {
			self.postMessage({ type: "ERROR", payload: "No data provided" });
		}
	} else if (type === "SEARCH") {
		const results = search(payload.query, payload.maxResults || 100);
		self.postMessage({
			type: "RESULTS",
			payload: { query: payload.query, results }
		});
	}
};
