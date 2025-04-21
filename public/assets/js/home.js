var player = {};
var isPaused = false;
var hasAlerted = false;
var searchQuery;
var availableDevice;
var playerUpdate;

onload = async function () {
	if (!('localStorage' in window)) {
		document.write("<p>Sorry, this page is only made for modern browsers (preferably Chrome).</p>");
	} else {
		if (localStorage.getItem('refresh_token')) {
			access_token = localStorage.getItem("access_token");
			document.getElementById("loggedIn").classList.add("shown");
			document.getElementById('signout').addEventListener('click', signOut);
			document.getElementById('loadFavourites').addEventListener('click', loadFavourites);
			document.getElementById('lastPlayer').addEventListener('click', newPlayback);
			document.getElementById('search').addEventListener('click', search);
			document.getElementById('pauseplay').addEventListener('click', function () {
				controlPlayback(player ? (player.is_playing ? 'pause' : 'play') : '');
			});
			document.getElementById('next').addEventListener('click', function () {
				controlPlayback('next', 'POST');
			});
			document.getElementById('prev').addEventListener('click', function () {
				controlPlayback('previous', 'POST');
			});
			document.getElementById('shuffle').addEventListener('click', function () {
				controlPlayback('shuffle', 'PUT', '?state=' + ("" + (!player.shuffle_state) || 'true'));
			});

			document.getElementById("loading").classList.add("hidden");

			updatePlayer();
			updateTimer();
			setInterval(updatePlayer, 1000);
			setInterval(updateTimer, 250);
			let result = await request("GET", 'me')
			document.getElementById("user").innerHTML = " as " + result.display_name + " (" + result.email + ")";
		} else {
			document.getElementById("newLogin").setAttribute("href", auth_url);
			document.getElementById("notLoggedIn").classList.add("shown");
			document.getElementById("loading").classList.add("hidden");
		}
	}
}


async function loadFavourites() {
	if (document.getElementById("loadFavourites").innerHTML != 'Load your favorites') {
		document.getElementById("artists").innerHTML = '';
		document.getElementById("tracks").innerHTML = '';
		document.getElementById("loadFavourites").innerHTML = 'Load your favorites';
		return;
	}

	let result_artists = await request('GET', 'me/top/artists?time_range=short_term')
	document.getElementById("artists").innerHTML = '';
	document.getElementById("tracks").innerHTML = '';
	if (!result_artists || !('items' in result_artists)) {
		document.getElementById("artists").innerHTML = '<b>Something went wrong!</b>';
	} else {
		let items = result_artists.items;
		let html = '<h1>Most listened artists (last 4 weeks)</h1>';
		for (let i = 0; i < items.length; i++) {
			const el = items[i];
			html += '<li>' + el.name + '</li>'
		}
		document.getElementById("artists").innerHTML = html;
		document.getElementById("loadFavourites").innerHTML = 'Clear favorites list';
	}

	let result_tracks = await request('GET', 'me/top/tracks?time_range=short_term')
	if (!result_tracks || !('items' in result_tracks)) {
		alert("Something went wrong!");
	} else {
		let items = result_tracks.items;
		let html = '<h1>Most listened tracks (last 4 weeks)</h1>';
		for (let i = 0; i < items.length; i++) {
			const el = items[i];
			html += '<li>' + el.artists[0].name + " - " + el.name + '</li>'
		}
		document.getElementById("tracks").innerHTML = html;
	}
}


async function updatePlayer() {
	let result = await request("GET", "me/player")
	player.isPaused = false;
	let playerEl = document.getElementById("playerData");
	if (result.status && player.status !== 200) {
		playerEl.innerHTML = "<b>Nothing playing at the moment.</b>";
		document.getElementById("playback").classList.remove("shown");
		checkDevices();
	} else {
		if (!result) return;
		player = result;
		playerUpdate = +new Date();

		let html = "<b>Now playing" + (!player.is_playing ? " (paused)" : "") + ":</b> ";
		if (player.item) {
			html += player.item.artists[0].name + " - " + player.item.name;
		}

		document.getElementById("pauseplay").innerHTML = player.is_playing ? "Pause" : "Play";
		playerEl.innerHTML = html;
		document.getElementById("shuffle").innerHTML = 'Toggle shuffle ' + (result['shuffle_state'] ? 'off' : 'on');
		updateTimer();
		document.getElementById("playback").classList.add("shown");
		document.getElementById("lastPlayer").classList.remove("shown");
	}
}

async function checkDevices() {
	let result = await request("GET", "me/player/devices")
	availableDevice = null;
	if (result.devices.length > 0) {
		availableDevice = result.devices[0];
		document.getElementById("lastPlayer").classList.add("shown");
	} else {
		document.getElementById("lastPlayer").classList.remove("shown");
	}
}


function updateTimer() {
	let timer = document.getElementById('timer');
	let prependZero = function (n) {
		return n < 10 ? ('0' + n) : n;
	}
	let parseTime = function (t) {
		return prependZero(Math.floor(t / 60000)) + ":" + prependZero(Math.floor(t / 1000) % 60);
	}
	if (player.item) {
		let progress = player['progress_ms'];
		let duration = player.item['duration_ms'];
		if (player.is_playing) {
			let ts = playerUpdate;
			let diff = +new Date() - ts;
			progress += diff;
			if (progress > duration) {
				updatePlayer();
			}
		}
		timer.innerHTML = parseTime(progress) + '/' + parseTime(duration);
	} else {
		timer.innerHTML = '-/-';
	}
}


function newPlayback() {
	controlPlayback('', "PUT", '', {
		device_ids: [availableDevice.id],
		play: true
	});
}

function search() {
	const searchInput = document.getElementById("searchInput");
	const searchResults = document.getElementById("searchResults");
	
	// Get search query from input field
	searchQuery = searchInput.value.trim();
	
	// Clear results if empty
	searchResults.innerHTML = '';
	
	if (!searchQuery || !searchQuery.length) {
		return;
	}
	
	// Perform search
	setTimeout(async function () {
		// Show loading indicator
		searchResults.innerHTML = '<div class="loading-indicator">Searching...</div>';
		
		try {
			let result = await request('GET', 'search?type=track,album,artist&market=us&q=' + encodeURIComponent(searchQuery));
			let albums = result.albums.items;
			let artists = result.artists.items;
			let tracks = result.tracks.items;

			let html = '<div class="search-header">' +
						'<b>Results for: </b>' + searchQuery + 
						'<button id="clearSearch">Clear</button>' +
						'</div>';

			// Artists section
			if (artists.length) {
				html += '<div class="result-section"><h3>Artists</h3><div class="result-items">';
				for (let i = 0; i < artists.length && i < 3; i++) {
					const artist = artists[i];
					html += `
						<div class="search-item">
							<img src="${artist.images && artist.images.length ? artist.images[artist.images.length-1].url : 'assets/images/placeholder.png'}" alt="${artist.name}">
							<div class="item-details">
								<div class="item-name">${artist.name}</div>
								<div class="item-meta">Artist</div>
							</div>
							<div class="item-actions">
								<button class='playURI' URI="${artist.uri}">Play</button>
							</div>
						</div>`;
				}
				html += '</div></div>';
			}

			// Tracks section
			if (tracks.length) {
				html += '<div class="result-section"><h3>Tracks</h3><div class="result-items">';
				for (let i = 0; i < tracks.length && i < 8; i++) {
					const track = tracks[i];
					html += `
						<div class="search-item">
							<img src="${track.album.images && track.album.images.length ? track.album.images[track.album.images.length-1].url : 'assets/images/placeholder.png'}" alt="${track.name}">
							<div class="item-details">
								<div class="item-name">${track.name}</div>
								<div class="item-meta">${track.artists[0].name} • ${track.album.name}</div>
							</div>
							<div class="item-actions">
								<button class='playURI' URI="${track.uri}">Play</button>
							</div>
						</div>`;
				}
				html += '</div></div>';
			}

			// Albums section
			if (albums.length) {
				html += '<div class="result-section"><h3>Albums</h3><div class="result-items">';
				for (let i = 0; i < albums.length && i < 3; i++) {
					const album = albums[i];
					html += `
						<div class="search-item">
							<img src="${album.images && album.images.length ? album.images[album.images.length-1].url : 'assets/images/placeholder.png'}" alt="${album.name}">
							<div class="item-details">
								<div class="item-name">${album.name}</div>
								<div class="item-meta">${album.artists[0].name} • ${album.release_date.substring(0, 4)}</div>
							</div>
							<div class="item-actions">
								<button class='playURI' URI="${album.uri}">Play</button>
							</div>
						</div>`;
				}
				html += '</div></div>';
			}

			// Display results
			searchResults.innerHTML = html;
			
			// Add clear button event listener
			document.getElementById("clearSearch").addEventListener("click", function () {
				searchResults.innerHTML = '';
				searchInput.value = '';
			});

			// Add play button event listeners
			let btns = document.getElementsByClassName("playURI");
			for (let i = 0; i < btns.length; i++) {
				const btn = btns[i];
				btn.addEventListener('click', function () {
					let uri = this.attributes.uri.value;
					let data = uri.startsWith("spotify:track") ? { uris: [uri], } : { context_uri: uri, };
					controlPlayback('play', "PUT", '', data);
				});
			}
		} catch (error) {
			searchResults.innerHTML = '<div class="error-message">Search failed. Please try again.</div>';
			console.error('Search error:', error);
		}
	}, 50);
}

// Add event listener for the Enter key on search input
document.addEventListener('DOMContentLoaded', function() {
	const searchInput = document.getElementById("searchInput");
	if (searchInput) {
		searchInput.addEventListener('keypress', function(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				search();
			}
		});
	}
});