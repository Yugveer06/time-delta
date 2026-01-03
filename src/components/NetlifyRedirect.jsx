import { useEffect, useState } from "react";
import "../styles/NetlifyRedirect.scss";

const VERCEL_URL = "https://timedelta.vercel.app";

const NetlifyRedirect = () => {
	const [countdown, setCountdown] = useState(5);
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		// Check if we're on Netlify
		if (window.location.hostname.includes("netlify.app")) {
			setShouldRedirect(true);
		}
	}, []);

	useEffect(() => {
		if (!shouldRedirect) return;

		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					window.location.href = VERCEL_URL;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [shouldRedirect]);

	if (!shouldRedirect) return null;

	return (
		<div className='redirect-overlay'>
			<div className='redirect-modal'>
				<h2>🚀 We've Moved!</h2>
				<p>Time Delta has a new home.</p>
				<p className='new-url'>{VERCEL_URL}</p>
				<p className='countdown'>
					Redirecting in <span>{countdown}</span> seconds...
				</p>
				<a href={VERCEL_URL} className='redirect-button'>
					Go Now
				</a>
			</div>
		</div>
	);
};

export default NetlifyRedirect;
