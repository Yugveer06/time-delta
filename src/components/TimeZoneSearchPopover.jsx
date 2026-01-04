import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { motion as m } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";
import * as ScrollArea from "@radix-ui/react-scroll-area";

const TimeZoneSearchPopover = ({
	popOverOpened,
	setPopOverOpened,
	searchTerm,
	setSearchTerm,
	handleSearchInput,
	searchResults,
	handleResultClick
}) => {
	return (
		<Popover.Root onOpenChange={setPopOverOpened} open={popOverOpened}>
			<Popover.Trigger asChild>
				<m.button
					layout
					className='addTimeZoneButton'
					aria-label='Add Time Zone'
				>
					Add Time Zone
				</m.button>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content className='PopoverContent' sideOffset={5}>
					<div className='PopoverHeader'>
						<h2>Choose Time Zone</h2>
						<div className='searchArea'>
							<div className='inputArea'>
								<input
									type='text'
									className='timeZoneSearchBar'
									value={searchTerm}
									onChange={(event) =>
										handleSearchInput(event.target.value)
									}
									placeholder='Search...'
								/>
								{searchTerm !== "" && (
									<m.button
										className='clearSearchQuery'
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										onClick={() => {
											setSearchTerm("");
											handleSearchInput("");
										}}
									>
										<FontAwesomeIcon icon={faClose} />
									</m.button>
								)}
							</div>
							<div className='resultsFound'>
								{searchTerm !== "" && searchTerm.length < 2
									? "Type at least 2 characters..."
									: searchTerm !== "" &&
									  searchResults.length +
											" results found..."}
							</div>
						</div>
					</div>
					<ScrollArea.Root className='ScrollAreaRoot'>
						<ScrollArea.Viewport className='ScrollAreaViewport'>
							<div className='timeZonesList'>
								{searchResults?.map((result, index) => {
									let isCity = false;
									let isState = false;
									let isCountry = false;
									if (result.name) {
										isCountry = true;
									}
									if (
										result.states &&
										result.states[0].name
									) {
										isState = true;
									}
									if (
										result.states &&
										result.states[0].cities &&
										result.states[0].cities[0].name
									) {
										isCity = true;
									}
									return (
										<button
											className='searchTimeZone'
											onClick={() => {
												handleResultClick(result);
												setSearchTerm("");
												setPopOverOpened(false);
											}}
											key={index}
										>
											<div className='left'>
												<div className='name 1'>
													{isCity
														? result.states[0]
																.cities[0].name
														: isState
														? result.states[0].name
														: result.name}
												</div>
												<div className='name 2'>
													{isCity
														? result.states[0]
																.name +
														  ", " +
														  result.name
														: isState
														? result.name
														: null}
												</div>
											</div>
											<div className='abbreviation'>
												{""}
											</div>
										</button>
									);
								})}
							</div>
						</ScrollArea.Viewport>
						<ScrollArea.Scrollbar
							className='ScrollAreaScrollbar'
							orientation='vertical'
						>
							<ScrollArea.Thumb className='ScrollAreaThumb' />
						</ScrollArea.Scrollbar>
						<ScrollArea.Scrollbar
							className='ScrollAreaScrollbar'
							orientation='horizontal'
						>
							<ScrollArea.Thumb className='ScrollAreaThumb' />
						</ScrollArea.Scrollbar>
						<ScrollArea.Corner className='ScrollAreaCorner' />
					</ScrollArea.Root>
					<Popover.Close className='PopoverClose' aria-label='Close'>
						<FontAwesomeIcon icon={faClose} />
					</Popover.Close>
					<Popover.Arrow className='PopoverArrow' />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
};

export default TimeZoneSearchPopover;
