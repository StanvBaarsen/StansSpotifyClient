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
	
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("readystatechange", function () {
		if (this.readyState === 4 && this.status === 200) {
			let result = JSON.parse(this.response);
			if (result.access_token && result.refresh_token) {
				localStorage.setItem("access_token", result.access_token);
				localStorage.setItem("refresh_token", result.refresh_token);
				localStorage.setItem("token_expiration", "" + new Date(+new Date() + result.expires_in * 1000));
				window.location = location.origin + "/";
			} else {
				document.write("<p>Error: <pre>" + JSON.stringify(result) + "</pre></p>");
			}
		} else if (this.readyState === 4) {
			document.write("<p>Error: <pre>" + this.status + ": " + this.response + "</pre></p>");
		}
	});
	
	xhr.open("POST", "https://accounts.spotify.com/api/token");
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("Authorization", "Basic " + btoa(callbackClientID + ':' + callbackClientSecret));
	let redirectURI = encodeURI(location.origin + "/callback");
	xhr.send("grant_type=authorization_code&code=" + code + "&redirect_uri=" + redirectURI);
}

function writeError() {
	document.write("Something went wrong. <a href='/'>Back to home</a>");
}