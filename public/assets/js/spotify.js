var access_token;
let redirectURI = encodeURI(location.origin + "/callback");

// Variables to hold the client ID
let clientID = "";
let auth_url = "";

// Fetch the client ID from the serverless function (NOT the secret)
fetchCredentials();

async function fetchCredentials() {
	console.log("Fetching credentials from serverless function...");
	try {
		const response = await fetch('/.netlify/functions/spotify-auth?action=getCredentials');
		console.log("Response status:", response.status);
		if (response.ok) {
			const data = await response.json();
			console.log("Received client ID:", data.clientId ? "YES (hidden)" : "NO");
			clientID = data.clientId;
			// Update the auth URL with the client ID
			auth_url = "https://accounts.spotify.com/authorize?client_id=" + clientID + 
				"&redirect_uri=" + redirectURI + 
				"&scope=user-read-private%20user-read-email%20user-modify-playback-state%20user-read-playback-state%20user-top-read%20user-read-recently-played&response_type=code";
			
			// If the login link is already in the DOM, update its href
			const loginLink = document.getElementById('newLogin');
			if (loginLink) {
				console.log("Setting login link URL...");
				loginLink.setAttribute("href", auth_url);
			} else {
				console.log("Login link element not found");
			}
			
			const expiredLink = document.getElementById('expiredLogin');
			if (expiredLink) {
				expiredLink.setAttribute("href", auth_url);
			}
		} else {
			console.error("Failed to fetch client ID:", response.status);
			try {
				const errorText = await response.text();
				console.error("Error response:", errorText);
			} catch (e) {
				console.error("Could not read error response");
			}
		}
	} catch (error) {
		console.error("Error fetching credentials:", error);
	}
}

var isLoggingOff = false;

async function request(method, path, data) {
	return new Promise(resolve => {
		(async () => {
			try {
				let xhr = new XMLHttpRequest();
				xhr.open(method, 'https://api.spotify.com/v1/' + path);
				xhr.onreadystatechange = function () {
					if (this.readyState == XMLHttpRequest.DONE) {
						if (this.status === 200) {
							resolve(JSON.parse(this.response))
						} else {
							if(this.response) {
								try {
									resolve({ ...JSON.parse(this.response), ...{ status: this.status } })
								} catch (e) {
									resolve({ status: this.status, error: "Invalid response" })
								}
							} else {
								resolve({ status: this.status })
							}
						}
					};
				}
				xhr.setRequestHeader('Authorization', 'Bearer ' + await getAccessToken())
				xhr.send(data ? JSON.stringify(data) : undefined);
			} catch (error) {
				console.error("Request error:", error);
				resolve({ status: 500, error: error.message });
			}
		})()
	})
}

function signOut() {
	localStorage.removeItem('token_expiration');
	localStorage.removeItem('access_token');
	localStorage.removeItem('refresh_token');
	isLoggingOff = true;
	location.reload();
}

async function controlPlayback(action, method, params, data) {
	try {
		let result = await request(method || 'PUT', 'me/player/' + action + (params || ""), data || {})
		if (result.status === 200) {
			if (updatePlayer) updatePlayer();
		} else if (result.status === 404) {
			if ((result.error || {}).reason == 'NO_ACTIVE_DEVICE') {
				alert('No device available!')
			}
		}
	} catch (error) {
		console.error("Playback control error:", error);
	}
}

async function getAccessToken() {
	return new Promise(resolve => {
		try {
			let expiration = localStorage.getItem("token_expiration");
			if (expiration && (new Date(expiration) > new Date())) {
				// we don't need a new access token
				resolve(localStorage.getItem('access_token'))
			} else {
				// Use our secure serverless function to refresh the token
				const refreshToken = localStorage.getItem('refresh_token');
				if (!refreshToken) {
					document.getElementById("expired").classList.add("shown");
					document.getElementById("loggedIn").classList.remove("shown");
					document.getElementById("loading").classList.add("hidden");
					resolve(null);
					return;
				}
				
				fetch(`/.netlify/functions/spotify-auth?action=refreshToken&refresh_token=${encodeURIComponent(refreshToken)}`)
					.then(response => {
						if (response.ok) return response.json();
						throw new Error('Token refresh failed: ' + response.status);
					})
					.then(data => {
						if (data.access_token) {
							access_token = data.access_token;
							localStorage.setItem("access_token", access_token);
							localStorage.setItem("token_expiration", "" + new Date(+new Date() + (+data.expires_in) * 1000));
							resolve(access_token);
						} else {
							console.error("Failed to get access token");
							if (typeof writeError === 'function') writeError();
							resolve(null);
						}
					})
					.catch(error => {
						console.error("Token refresh error:", error);
						document.getElementById("expired").classList.add("shown");
						document.getElementById("loggedIn").classList.remove("shown");
						document.getElementById("loading").classList.add("hidden");
						resolve(null);
					});
			}
		} catch (error) {
			console.error("Token error:", error);
			resolve(null);
		}
	})
}
