import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const LoadingSpinner = ({ spinnerText }) => {
	return (
		<div className='loaderContainer'>
			<FontAwesomeIcon
				className='spinner'
				icon={faSpinner}
				spin
				size='xl'
			/>
			<span className='loaderText'>{spinnerText}</span>
		</div>
	);
};

export default LoadingSpinner;
