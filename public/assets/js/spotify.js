var access_token;
let redirectURI = encodeURI(location.origin + "/callback");

// Variables to hold the client credentials
let clientID = "<YOUR_CLIENT>";
let clientSecret = "<YOUR_SECRET>";

// Fetch the credentials from the server
fetchCredentials();

async function fetchCredentials() {
	try {
		const response = await fetch('/api/credentials');
		if (response.ok) {
			const data = await response.json();
			clientID = data.clientId;
			clientSecret = data.clientSecret;
			// Update the auth URL with the new client ID
			auth_url = "https://accounts.spotify.com/authorize?client_id=" + clientID + 
				"&redirect_uri=" + redirectURI + 
				"&scope=user-read-private%20user-read-email%20user-modify-playback-state%20user-read-playback-state%20user-top-read%20user-read-recently-played&response_type=code";
			
			// If the login link is already in the DOM, update its href
			const loginLink = document.getElementById('newLogin');
			if (loginLink) {
				loginLink.setAttribute("href", auth_url);
			}
			
			const expiredLink = document.getElementById('expiredLogin');
			if (expiredLink) {
				expiredLink.setAttribute("href", auth_url);
			}
		} else {
			console.error("Failed to fetch credentials:", response.status);
		}
	} catch (error) {
		console.error("Error fetching credentials:", error);
	}
}

var auth_url = "https://accounts.spotify.com/authorize?client_id=" + clientID + "&redirect_uri=" + redirectURI + "&scope=user-read-private%20user-read-email%20user-modify-playback-state%20user-read-playback-state%20user-top-read%20user-read-recently-played&response_type=code";
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
				var xhr = new XMLHttpRequest();
				var data = "grant_type=refresh_token&refresh_token=" + localStorage.getItem('refresh_token');
				xhr.addEventListener("readystatechange", function () {
					if (this.readyState == XMLHttpRequest.DONE && this.status === 200) {
						let res = JSON.parse(this.response)
						if (res.access_token) {
							access_token = res.access_token
							localStorage.setItem("access_token", access_token);
							localStorage.setItem("token_expiration", "" + new Date(+new Date() + (+res.expires_in) * 1000));
							resolve(access_token)
						} else {
							console.error("Failed to get access token");
							if (typeof writeError === 'function') writeError();
							resolve(null);
						}
					} else if (this.readyState == XMLHttpRequest.DONE) {
						console.error("Token refresh failed:", this.status);
						resolve(null);
					}
				});

				xhr.open("POST", "https://accounts.spotify.com/api/token");
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.setRequestHeader("Authorization", "Basic " + btoa(clientID + ':' + clientSecret))

				xhr.send(data);
			}
		} catch (error) {
			console.error("Token error:", error);
			resolve(null);
		}
	})
}
