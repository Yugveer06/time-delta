import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCheck,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import * as Select from "@radix-ui/react-select";

const SelectMenu = ({
	userSettings,
	setUserSettings,
	Items,
	offsetTimeBy,
	setOffsetTimeBy,
}) => {
	return (
		<Select.Root
			onValueChange={e => {
				setOffsetTimeBy(prev => ({
					...prev,
					sign: e === "before" ? -1 : 1,
				}));
				setUserSettings({
					...userSettings,
					offsetTimeBy: {
						...offsetTimeBy,
						sign: e === "before" ? -1 : 1,
					},
				});
			}}
			value={offsetTimeBy.sign === 1 ? "after" : "before"}
		>
			<Select.Trigger className='SelectTrigger'>
				<Select.Value />
				<Select.Icon className='SelectIcon'>
					<FontAwesomeIcon icon={faChevronDown} />
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content className='SelectContent'>
					<Select.ScrollUpButton className='SelectScrollButton'>
						<FontAwesomeIcon icon={faChevronUp} />
					</Select.ScrollUpButton>
					<Select.Viewport className='SelectViewport'>
						{Items.map(Item => {
							return (
								<Select.Item
									className='SelectItem'
									key={Item}
									value={Item}
								>
									<Select.ItemText>{Item}</Select.ItemText>
									<Select.ItemIndicator className='SelectItemIndicator'>
										<FontAwesomeIcon icon={faCheck} />
									</Select.ItemIndicator>
								</Select.Item>
							);
						})}
					</Select.Viewport>
					<Select.ScrollDownButton className='SelectScrollButton'>
						<FontAwesomeIcon icon={faChevronDown} />
					</Select.ScrollDownButton>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	);
};

export default SelectMenu;
