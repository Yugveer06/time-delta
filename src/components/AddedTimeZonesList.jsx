import React, { useEffect, useState } from "react";
import { AnimatePresence, Reorder } from "framer-motion";
import SystemClockDisplay from "./SystemClockDisplay";
import AddedTimeZoneItem from "./AddedTimeZoneItem";
import LoadingSpinner from "./LoadingSpinner";

const AddedTimeZonesList = ({
	userSettings,
	setUserSettings,
	currentTimeZone,
	hourFormat,
	offsetTimeBy,
	addedTimeZones,
	setAddedTimeZones,
	isFetchingTimeZone,
	spinnerText,
}) => {
	const [date, setDate] = useState(new Date());

	useEffect(() => {
		var timerID = setInterval(() => tick(), 1000);
		return function cleanup() {
			clearInterval(timerID);
		};
	});

	function tick() {
		setDate(
			new Date(),
			offsetTimeBy.hours,
			offsetTimeBy.minutes,
			offsetTimeBy.seconds
		);
	}

	function convertTimeZone(date, fromTimeZone, toTimeZone) {
		// Create a Date object for the given date and time in the fromTimeZone
		var fromTime = new Date(
			date.toLocaleString("en-US", { timeZone: fromTimeZone })
		);

		// Convert the date to the toTimeZone
		var toTime = new Date(
			fromTime.toLocaleString("en-US", { timeZone: toTimeZone })
		);

		return toTime;
	}

	function offsetTime(date, hours = 0, minutes = 0, seconds = 0) {
		let result = new Date(date.getTime());
		result.setHours(result.getHours() + hours * offsetTimeBy.sign);
		result.setMinutes(result.getMinutes() + minutes * offsetTimeBy.sign);
		result.setSeconds(result.getSeconds() + seconds * offsetTimeBy.sign);
		return result;
	}

	const handleRemoveTimeZone = addedTimeZone => {
		setAddedTimeZones(prev => {
			return prev.filter(item => item !== addedTimeZone);
		});
		setUserSettings({
			...userSettings,
			addedTimeZones: addedTimeZones.filter(
				item => item !== addedTimeZone
			),
		});
	};

	return (
		<div className='addedTimeZones'>
			<SystemClockDisplay
				currentTimeZone={currentTimeZone}
				date={date}
				hourFormat={hourFormat}
				offsetTimeBy={offsetTimeBy}
				offsetTime={offsetTime}
				convertTimeZone={convertTimeZone}
			/>

			{addedTimeZones.length > 0 && (
				<Reorder.Group
					axis='y'
					values={addedTimeZones}
					onReorder={e => {
						setAddedTimeZones(e);
						setUserSettings({ ...userSettings, addedTimeZones: e });
					}}
				>
					<AnimatePresence mode='popLayout'>
						{addedTimeZones.map((addedTimeZone, i) => (
							<AddedTimeZoneItem
								key={JSON.stringify(addedTimeZone)}
								addedTimeZone={addedTimeZone}
								date={date}
								currentTimeZone={currentTimeZone}
								hourFormat={hourFormat}
								offsetTimeBy={offsetTimeBy}
								convertTimeZone={convertTimeZone}
								offsetTime={offsetTime}
								onRemove={() =>
									handleRemoveTimeZone(addedTimeZone)
								}
							/>
						))}
					</AnimatePresence>
				</Reorder.Group>
			)}

			{isFetchingTimeZone && <LoadingSpinner spinnerText={spinnerText} />}
		</div>
	);
};

export default AddedTimeZonesList;
