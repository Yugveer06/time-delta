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
					width:
						((timeToDisplay / 1000 -
							timeToDisplay.setHours(0, 0, 0, 0) / 1000) /
							(24 * 60 * 60)) *
							100 +
						"%",
				}}
			></m.div>
		</div>
	);
};

export default TimelineDisplay;
