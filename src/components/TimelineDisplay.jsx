import React from "react";
import { motion as m } from "framer-motion";

const TimelineDisplay = ({
	date,
	currentTimeZone,
	timeZoneName,
	convertTimeZone,
	offsetTimeBy,
	offsetTime,
	type = "current",
}) => {
	const getTimeToDisplay = () => {
		if (type === "current") {
			return convertTimeZone(
				date,
				currentTimeZone,
				timeZoneName || currentTimeZone
			);
		} else {
			return offsetTime(
				convertTimeZone(
					date,
					currentTimeZone,
					timeZoneName || currentTimeZone
				),
				offsetTimeBy.hours,
				offsetTimeBy.minutes,
				offsetTimeBy.seconds
			);
		}
	};

	const timeToDisplay = getTimeToDisplay();

	return (
		<div className={`timeline ${type}`}>
			<div className='line'>
				<div className='numbers'>
					{[...Array(25).keys()].map(e => {
						return (
							<span
								className={
									timeToDisplay.getHours() === e
										? "highlighted"
										: null
								}
								key={e}
							>
								{e}
							</span>
						);
					})}
				</div>
			</div>
			<m.div
				className='circle'
				animate={{
					width: (() => {
						// Get the timestamp for the current time
						const currentTime = timeToDisplay.getTime();
						// Create a new Date object set to the start of the day (midnight)
						const startOfDay = new Date(timeToDisplay);
						startOfDay.setHours(0, 0, 0, 0);
						const startOfDayTime = startOfDay.getTime();
						// Calculate seconds elapsed since midnight
						const elapsedSeconds =
							(currentTime - startOfDayTime) / 1000;
						// Calculate percentage of the day (24 * 60 * 60 = 86400 seconds in a day)
						const percentage = (elapsedSeconds / 86400) * 100;
						return percentage + "%";
					})(),
				}}
			></m.div>
		</div>
	);
};

export default TimelineDisplay;
