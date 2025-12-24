function TimeDifference({ getTimeDifferenceParts }) {
	const diff = getTimeDifferenceParts();

	if (!diff) return null;

	if (diff.status === "now") {
		return <span className='timeNow'>Calculating</span>;
	}

	return (
		<span className='timeDiff'>
			<span className='label'>Custom time is</span>{" "}
			{diff.parts.map((p, i) => (
				<span key={i} className='timePart'>
					<span>{p.text}</span>
					{i < diff.parts.length - 1 && ", "}
				</span>
			))}{" "}
			<span className={`direction ${diff.direction}`}>
				{diff.direction === "ahead" ? "ahead" : "behind"}
			</span>{" "}
			<span className='label'>of real time</span>
		</span>
	);
}

export default TimeDifference;
