import { useEffect, useRef, useState, useCallback } from "react";

export function useSearchWorker() {
	const workerRef = useRef(null);
	const [isReady, setIsReady] = useState(false);
	const [results, setResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const pendingQueryRef = useRef(null);
	const debounceRef = useRef(null);

	useEffect(() => {
		// Create worker
		workerRef.current = new Worker(
			new URL("../workers/searchWorker.js", import.meta.url),
			{ type: "module" }
		);

		// Handle messages from worker
		workerRef.current.onmessage = (e) => {
			const { type, payload } = e.data;

			if (type === "READY") {
				setIsReady(true);
			} else if (type === "RESULTS") {
				// Only update if this is the latest query
				if (payload.query === pendingQueryRef.current) {
					setResults(payload.results);
					setIsSearching(false);
				}
			} else if (type === "ERROR") {
				console.error("Search worker error:", payload);
				setIsSearching(false);
			}
		};

		// Load data and initialize worker
		import("../countries+states+cities.json")
			.then((module) => {
				workerRef.current.postMessage({
					type: "INIT",
					payload: { data: module.default }
				});
			})
			.catch((err) => {
				console.error("Failed to load search data:", err);
			});

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
			}
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const search = useCallback(
		(query, debounceMs = 150) => {
			// Clear previous debounce
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			// Handle empty query
			if (!query || query.trim().length < 2) {
				setResults([]);
				setIsSearching(false);
				pendingQueryRef.current = null;
				return;
			}

			pendingQueryRef.current = query;
			setIsSearching(true);

			// Debounce the search
			debounceRef.current = setTimeout(() => {
				if (workerRef.current && isReady) {
					workerRef.current.postMessage({
						type: "SEARCH",
						payload: { query, maxResults: 100 }
					});
				}
			}, debounceMs);
		},
		[isReady]
	);

	const clearResults = useCallback(() => {
		setResults([]);
		pendingQueryRef.current = null;
	}, []);

	return { search, results, isReady, isSearching, clearResults };
}
