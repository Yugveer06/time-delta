// Web Worker for fast fuzzy location search
let searchIndex = null;
let isIndexReady = false;

// Available search filters
const AVAILABLE_FILTERS = {
	iso2: "Search by ISO2 country code (e.g., iso2:US)",
	iso3: "Search by ISO3 country code (e.g., iso3:USA)",
	region: 'Search by region (e.g., region:Asia, region:"North America")',
	currency: "Search by currency code (e.g., currency:USD)",
	phone: "Search by phone code (e.g., phone:1)",
	type: "Filter by location type (e.g., type:city, type:country, type:state)",
	in: 'Find locations within a parent (e.g., hyderabad in:india, california in:"united states")'
};

// Parse search query for filters
function parseQuery(query) {
	const filters = {};
	let searchText = query;

	// Extract filters in format "key:value" or "key:"quoted value""
	// This regex handles both quoted and unquoted values
	const filterRegex = /(\w+):(?:"([^"]+)"|([^\s]+))/g;
	let match;

	while ((match = filterRegex.exec(query)) !== null) {
		const [fullMatch, key, quotedValue, unquotedValue] = match;
		const value = quotedValue || unquotedValue; // Use quoted value if present, otherwise unquoted
		filters[key.toLowerCase()] = value.toLowerCase();
		searchText = searchText.replace(fullMatch, "").trim();
	}

	// Handle special case: "region:asia india" -> region filter + search text
	if (filters.region && searchText) {
		// Keep both the region filter and the remaining search text
	}

	return { filters, searchText: searchText.trim() };
}

// Check if item matches filters
function matchesFilters(item, filters) {
	for (const [key, value] of Object.entries(filters)) {
		switch (key) {
			case "iso2":
				if (item.country_code?.iso2?.toLowerCase() !== value)
					return false;
				break;
			case "iso3":
				if (item.country_code?.iso3?.toLowerCase() !== value)
					return false;
				break;
			case "region":
				if (item.region?.toLowerCase() !== value) return false;
				break;
			case "currency":
				if (item.currency?.toLowerCase() !== value) return false;
				break;
			case "phone":
				if (item.phone_code !== value) return false;
				break;
			case "type":
				if (item.type !== value) return false;
				break;
			case "in":
				// Check if the item is within the specified parent location
				const parentName = value.toLowerCase();
				let isWithinParent = false;

				// For cities: check if in specified state or country
				if (item.type === "city") {
					isWithinParent =
						item.stateName?.toLowerCase() === parentName ||
						item.countryName?.toLowerCase() === parentName;
				}
				// For states: check if in specified country
				else if (item.type === "state") {
					isWithinParent =
						item.countryName?.toLowerCase() === parentName;
				}
				// Countries can't be "in" anything else
				else if (item.type === "country") {
					isWithinParent = false;
				}

				if (!isWithinParent) return false;
				break;
			default:
				// Unknown filter, ignore
				break;
		}
	}
	return true;
}

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

// Multi-keyword search with scoring and filtering
function search(query, maxResults = 100) {
	if (!isIndexReady || !query) return [];

	const trimmedQuery = query.trim();
	if (trimmedQuery.length < 2) return [];

	// Parse query for filters and search text
	const { filters, searchText } = parseQuery(trimmedQuery);

	// If no search text and no filters, return empty
	if (!searchText && Object.keys(filters).length === 0) return [];

	const keywords = searchText
		? searchText
				.toLowerCase()
				.split(/\s+/)
				.filter((k) => k.length > 0)
		: [];

	const exactMatches = [];
	const scored = [];
	const minScoreThreshold = 30; // Lowered threshold for better results

	for (const item of searchIndex) {
		// Apply filters first
		if (!matchesFilters(item, filters)) continue;

		// If no search text but filters match, include with high score
		if (keywords.length === 0) {
			scored.push({
				item,
				score: 1000 // High score for filter-only matches
			});
			continue;
		}

		let totalScore = 0;
		let matchedKeywords = 0;
		let hasExactMatch = false;

		// Check for exact matches first
		const fullSearchText = searchText.toLowerCase();
		if (item.searchName === fullSearchText) {
			hasExactMatch = true;
			totalScore = 10000; // Highest priority for exact matches
			matchedKeywords = keywords.length;
		} else {
			// Score each keyword
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
		}

		// All keywords must match something (or exact match)
		if (
			hasExactMatch ||
			(matchedKeywords === keywords.length &&
				totalScore >= minScoreThreshold)
		) {
			// Priority scoring: Country > State > City for exact matches
			// This ensures "Oman" (country) appears before "Oman" (city)
			let typeBonus = 0;
			if (hasExactMatch) {
				typeBonus =
					item.type === "country"
						? 1000
						: item.type === "state"
						? 500
						: 100;
			} else {
				// For non-exact matches, prefer more specific locations
				typeBonus =
					item.type === "city" ? 20 : item.type === "state" ? 10 : 0;
			}

			// Bonus for matching all keywords in the primary name
			const allInName = keywords.every((k) =>
				item.searchName.includes(k)
			);
			const nameBonus = allInName ? 50 : 0;

			const finalScore = totalScore + typeBonus + nameBonus;

			if (hasExactMatch) {
				exactMatches.push({ item, score: finalScore });
			} else {
				scored.push({ item, score: finalScore });
			}
		}

		// Early termination: if we have lots of high-quality matches, stop
		if (exactMatches.length + scored.length >= maxResults * 3) {
			break;
		}
	}

	// Sort exact matches by type priority (country > state > city)
	exactMatches.sort((a, b) => b.score - a.score);

	// Sort other matches by score
	scored.sort((a, b) => b.score - a.score);

	// Combine results: exact matches first, then others
	const allResults = [...exactMatches, ...scored];

	// Return top results
	return allResults.slice(0, maxResults).map((s) => formatResult(s.item));
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
	} else if (type === "GET_FILTERS") {
		self.postMessage({
			type: "FILTERS",
			payload: AVAILABLE_FILTERS
		});
	}
};
