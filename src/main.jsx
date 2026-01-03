import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import NetlifyRedirect from "./components/NetlifyRedirect";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<NetlifyRedirect />
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
