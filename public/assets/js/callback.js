// Variables to hold the client credentials
let callbackClientID = "<YOUR_CLIENT>";
let callbackClientSecret = "<YOUR_SECRET>";

// Attempt to fetch credentials before processing the callback
onload = async function () {
	// First fetch the credentials
	try {
		const response = await fetch('/api/credentials');
		if (response.ok) {
			const data = await response.json();
			callbackClientID = data.clientId;
			callbackClientSecret = data.clientSecret;
		} else {
			console.error("Failed to fetch credentials:", response.status);
		}
	} catch (error) {
		console.error("Error fetching credentials:", error);
	}
	
	// Process the callback
	let url = window.location.href;
	let code = url.split("code=")[1];
	
	if (!code) {
		document.write("<p>Error: No authorization code received from Spotify</p>");
		return;
	}
	
	// Call our serverless function to exchange the code for tokens
	let redirectURI = encodeURI(location.origin + "/callback");
	
	try {
		const response = await fetch(`/.netlify/functions/spotify-auth?action=getToken&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectURI)}`);
		
		if (response.ok) {
			const result = await response.json();
			
			if (result.access_token && result.refresh_token) {
				localStorage.setItem("access_token", result.access_token);
				localStorage.setItem("refresh_token", result.refresh_token);
				localStorage.setItem("token_expiration", "" + new Date(+new Date() + result.expires_in * 1000));
				window.location = location.origin + "/";
			} else {
				document.write("<p>Error: <pre>" + JSON.stringify(result) + "</pre></p>");
			}
		} else {
			const error = await response.text();
			document.write("<p>Error: <pre>" + response.status + ": " + error + "</pre></p>");
		}
	} catch (error) {
		console.error("Error exchanging code for tokens:", error);
		document.write("<p>Error: " + error.message + "</p><p><a href='/'>Back to home</a></p>");
	}
}

function writeError() {
	document.write("Something went wrong. <a href='/'>Back to home</a>");
}