import { useEffect, useState } from "react";
import "../styles/Home.scss";

import { motion as m } from "framer-motion";

import AddedTimeZonesList from "../components/AddedTimeZonesList";
import Navbar from "../components/Navbar";
import TimeOffsetControls from "../components/TimeOffsetControls";
import TimeZoneSearchPopover from "../components/TimeZoneSearchPopover";

import useLocalStorage from "../hooks/useLocalStorage";
import { useSearchWorker } from "../hooks/useSearchWorker";

import moment from "moment-timezone";
import TimeDifference from "../components/TimeDifference";
import { getVersion } from "../lib/version";

const Home = () => {
	const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const [spinnerText, setSpinnerText] = useState("library");
	const [userSettings, setUserSettings] = useLocalStorage(
		"timeCalculatorSettings",
		{
			version: getVersion(),
			theme: "light",
			addedTimeZones: [],
			hourFormat: 12,
			offsetTimeBy: { hours: 0, minutes: 0, seconds: 0, sign: 1 }
		}
	);
	const [hourFormat, setHourFormat] = useState(userSettings.hourFormat);
	const [addedTimeZones, setAddedTimeZones] = useState(
		userSettings.addedTimeZones
	);
	const [offsetTimeBy, setOffsetTimeBy] = useState(userSettings.offsetTimeBy);

	const [searchTerm, setSearchTerm] = useState("");

	// Use web worker for fast search
	const { search, results: searchResults, clearResults } = useSearchWorker();

	// State moved from AddedTimeZonesList
	const [date, setDate] = useState(new Date());
	const [globalTimeOverride, setGlobalTimeOverride] = useState(null);
	const [systemTimezoneData, setSystemTimezoneData] = useState(null);

	// Load system timezone data based on currentTimeZone
	useEffect(() => {
		if (
			!userSettings ||
			!userSettings.version ||
			!userSettings.version === getVersion()
		) {
			console.log("Version mismatch or not found");
			localStorage.clear();
			window.location.reload();
		}
		const loadSystemTimezoneData = async () => {
			try {
				const module = await import("../countries+states+cities.json");
				const data = module.default;

				// Handle legacy timezone names
				let targetTimezone = currentTimeZone;
				if (currentTimeZone === "Asia/Calcutta") {
					targetTimezone = "Asia/Kolkata";
				}

				// Find the country/city that matches the system timezone
				for (const country of data) {
					// Check country-level timezone
					if (country.timezones) {
						for (const tz of country.timezones) {
							if (tz.zoneName === targetTimezone) {
								setSystemTimezoneData({
									name: country.name,
									latitude: country.latitude,
									longitude: country.longitude,
									region: country.region,
									currency: country.currency,
									currency_name: country.currency_name,
									currency_symbol: country.currency_symbol,
									phone_code: country.phone_code,
									timezone: targetTimezone
								});
								return;
							}
						}
					}
				}
			} catch (error) {
				console.error("Error loading system timezone data:", error);
			}
		};

		loadSystemTimezoneData();
	}, [currentTimeZone]);

	useEffect(() => {
		document.body.setAttribute("data-theme", userSettings.theme);
	}, [userSettings.theme]);

	// Load saved custom time on mount
	useEffect(() => {
		const savedTime = localStorage.getItem("globalTimeOverride");
		if (savedTime) {
			const parsedDate = new Date(savedTime);
			if (!isNaN(parsedDate.getTime())) {
				setGlobalTimeOverride(parsedDate);
				setDate(parsedDate);
			}
		}
	}, []);

	// Save custom time to localStorage and update theme
	useEffect(() => {
		if (globalTimeOverride) {
			localStorage.setItem(
				"globalTimeOverride",
				globalTimeOverride.toISOString()
			);
			document.body.setAttribute("data-mode", "custom-time");
		} else {
			localStorage.removeItem("globalTimeOverride");
			document.body.removeAttribute("data-mode");
		}
	}, [globalTimeOverride]);

	useEffect(() => {
		var timerID = setInterval(() => tick(), 1000);
		return function cleanup() {
			clearInterval(timerID);
		};
	});

	function tick() {
		// Always update date to current real time
		setDate(new Date());
	}

	const handleGlobalTimeChange = (newDate, sourceTimezone) => {
		if (newDate === null) {
			// Reset to real-time
			setGlobalTimeOverride(null);
			setDate(new Date());
		} else {
			// newDate is the "face value" time set by the user.
			// We need to interpret this face value as being in the sourceTimezone
			// and convert it to an absolute timestamp.

			// Format the date components to a string that moment can parse
			// We use local getters because newDate is a local Date object constructed from inputs
			const year = newDate.getFullYear();
			const month = String(newDate.getMonth() + 1).padStart(2, "0");
			const day = String(newDate.getDate()).padStart(2, "0");
			const hours = String(newDate.getHours()).padStart(2, "0");
			const minutes = String(newDate.getMinutes()).padStart(2, "0");
			const seconds = String(newDate.getSeconds()).padStart(2, "0");

			const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

			// Create absolute date from the source timezone
			const absoluteDate = moment.tz(timeString, sourceTimezone).toDate();

			setGlobalTimeOverride(absoluteDate);
			setDate(absoluteDate);
		}
	};

	// Helper function to format the time difference between custom time and real time
	const getTimeDifferenceParts = () => {
		if (!globalTimeOverride) return null;

		const diffMs = globalTimeOverride.getTime() - date.getTime();
		const absDiffMs = Math.abs(diffMs);

		const units = [
			{
				label: "day",
				value: Math.floor(absDiffMs / (1000 * 60 * 60 * 24))
			},
			{
				label: "hour",
				value: Math.floor(absDiffMs / (1000 * 60 * 60)) % 24
			},
			{
				label: "minute",
				value: Math.floor(absDiffMs / (1000 * 60)) % 60
			},
			{ label: "second", value: Math.floor(absDiffMs / 1000) % 60 }
		];

		const timeParts = units
			.filter((u) => u.value > 0)
			.map((u) => ({
				text: `${u.value} ${u.label}${u.value !== 1 ? "s" : ""}`,
				value: u.value,
				unit: u.label
			}));

		if (timeParts.length === 0) {
			return {
				status: "now",
				direction: null,
				parts: []
			};
		}

		return {
			status: "diff",
			direction: diffMs > 0 ? "ahead" : "behind",
			parts: timeParts
		};
	};

	const [popOverOpened, setPopOverOpened] = useState(false);
	const [isFetchingTimeZone, setIsFetchingTimeZone] = useState(false);

	function handleSearchInput(searchQuery) {
		setSearchTerm(searchQuery);
		search(searchQuery);
	}

	async function handleResultClick(result) {
		// Fetch the timezone for the clicked result if it doesnt already exist
		if (
			!addedTimeZones.some((addedTimeZone) => {
				const {
					["timezone"]: removedAddedTimeZone,
					...restAddedTimeZone
				} = addedTimeZone;
				const { ["timezone"]: removedResult, ...restResult } = result;
				return (
					JSON.stringify(restAddedTimeZone) ===
					JSON.stringify(restResult)
				);
			})
		) {
			setIsFetchingTimeZone(true);
			let latitude, longitude;
			if (result.states) {
				let state = result.states[0];
				if (state.cities) {
					let city = state.cities[0];
					if (city.latitude && city.longitude) {
						latitude = city.latitude;
						longitude = city.longitude;
					}
				}
				if (!latitude && state.latitude && state.longitude) {
					latitude = state.latitude;
					longitude = state.longitude;
				}
			}
			if (!latitude && result.latitude && result.longitude) {
				latitude = result.latitude;
				longitude = result.longitude;
			}

			// If the timezone is not already added, add it
			if (latitude && longitude) {
				try {
					console.log("fetching timezone from serverless function");
					setSpinnerText("Getting Timezone");
					const response = await fetch(
						`/api/timezone?lat=${latitude}&lng=${longitude}`
					);

					if (!response.ok) {
						throw new Error(`API error: ${response.status}`);
					}

					const data = await response.json();
					result.timezone = data.timezoneId;
				} catch (error) {
					console.error("Error fetching timezone:", error);
					setSpinnerText("Error");
					setIsFetchingTimeZone(false);
					return;
				}

				setIsFetchingTimeZone(false);
			}

			setAddedTimeZones((prev) => [...prev, result]);
			setUserSettings({
				...userSettings,
				addedTimeZones: [...addedTimeZones, result]
			});
		}

		clearResults();
	}

	return (
		<div className='wrapper'>
			<Navbar
				hourFormat={hourFormat}
				setHourFormat={setHourFormat}
				userSettings={userSettings}
				setUserSettings={setUserSettings}
				isCustomTime={globalTimeOverride !== null}
			/>
			<main>
				<AddedTimeZonesList
					userSettings={userSettings}
					setUserSettings={setUserSettings}
					currentTimeZone={currentTimeZone}
					hourFormat={hourFormat}
					offsetTimeBy={offsetTimeBy}
					addedTimeZones={addedTimeZones}
					setAddedTimeZones={setAddedTimeZones}
					isFetchingTimeZone={isFetchingTimeZone}
					spinnerText={spinnerText}
					date={date}
					globalTimeOverride={globalTimeOverride}
					handleGlobalTimeChange={handleGlobalTimeChange}
					systemTimezoneData={systemTimezoneData}
				/>
				<m.div className='addTimeZone'>
					<TimeZoneSearchPopover
						popOverOpened={popOverOpened}
						setPopOverOpened={setPopOverOpened}
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						handleSearchInput={handleSearchInput}
						searchResults={searchResults}
						handleResultClick={handleResultClick}
					/>
				</m.div>
				<div className='bottomPart'>
					<TimeDifference
						getTimeDifferenceParts={getTimeDifferenceParts}
					/>
					<TimeOffsetControls
						userSettings={userSettings}
						setUserSettings={setUserSettings}
						offsetTimeBy={offsetTimeBy}
						setOffsetTimeBy={setOffsetTimeBy}
					/>
				</div>
			</main>
		</div>
	);
};

export default Home;
