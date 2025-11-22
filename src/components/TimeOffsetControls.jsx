import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { motion as m } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import SelectMenu from "./SelectMenu";

const TimeOffsetControls = ({
	userSettings,
	setUserSettings,
	offsetTimeBy,
	setOffsetTimeBy,
}) => {
	return (
		<m.div layout='position' className='offsetTime'>
			<div className='left'>
				<span>
					What {offsetTimeBy.sign === 1 ? "will be" : "was"} the time
				</span>
				<SelectMenu
					userSettings={userSettings}
					setUserSettings={setUserSettings}
					Items={["after", "before"]}
					offsetTimeBy={offsetTimeBy}
					setOffsetTimeBy={setOffsetTimeBy}
				/>
				<div className='offsetTimeInputGroup hours'>
					<m.input
						type='number'
						className='offsetTimeInput'
						min={0}
						value={offsetTimeBy.hours.toString()}
						onFocus={e => e.target.select()}
						onChange={e => {
							setOffsetTimeBy(prev => ({
								...prev,
								hours: Number(e.target.value),
							}));
							setUserSettings({
								...userSettings,
								offsetTimeBy: {
									...offsetTimeBy,
									hours: Number(e.target.value),
								},
							});
						}}
						animate={{
							width: `${
								offsetTimeBy.hours.toString().length + 1 + 4
							}ch`,
						}}
					/>
					<span>hour{offsetTimeBy.hours !== 1 ? "s" : ""}</span>
				</div>
				<div className='offsetTimeInputGroup minutes'>
					<m.input
						type='number'
						className='offsetTimeInput'
						min={0}
						value={offsetTimeBy.minutes.toString()}
						onFocus={e => e.target.select()}
						onChange={e => {
							setOffsetTimeBy(prev => ({
								...prev,
								minutes: Number(e.target.value),
							}));
							setUserSettings({
								...userSettings,
								offsetTimeBy: {
									...offsetTimeBy,
									minutes: Number(e.target.value),
								},
							});
						}}
						animate={{
							width: `${
								offsetTimeBy.minutes.toString().length + 1 + 4
							}ch`,
						}}
					/>
					<span>minute{offsetTimeBy.minutes !== 1 ? "s" : ""}</span>
				</div>
				<div className='offsetTimeInputGroup seconds'>
					<m.input
						type='number'
						className='offsetTimeInput'
						min={0}
						value={offsetTimeBy.seconds.toString()}
						onFocus={e => e.target.select()}
						onChange={e => {
							setOffsetTimeBy(prev => ({
								...prev,
								seconds: Number(e.target.value),
							}));
							setUserSettings({
								...userSettings,
								offsetTimeBy: {
									...offsetTimeBy,
									seconds: Number(e.target.value),
								},
							});
						}}
						animate={{
							width: `${
								offsetTimeBy.seconds.toString().length + 1 + 4
							}ch`,
						}}
					/>
					<span>second{offsetTimeBy.seconds !== 1 ? "s" : ""}?</span>
				</div>
			</div>
			<div className='right'>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<button
								className='resetOffsetButton'
								onClick={() => {
									setOffsetTimeBy({
										hours: 0,
										minutes: 0,
										seconds: 0,
										sign: 1,
									});
									setUserSettings({
										...userSettings,
										offsetTimeBy: {
											hours: 0,
											minutes: 0,
											seconds: 0,
											sign: 1,
										},
									});
								}}
							>
								<FontAwesomeIcon icon={faArrowRotateLeft} />
							</button>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								className='TooltipContent'
								sideOffset={5}
							>
								Reset offset time settings
								<Tooltip.Arrow className='TooltipArrow' />
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
		</m.div>
	);
};

export default TimeOffsetControls;
