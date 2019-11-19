let triggerDeleteButton = document.getElementById("triggerDeleteButton");
let cookieMonsterDiv = document.getElementById("cookieMonsterImage");
let cookieMonsterImage = document.createElement("img");
// Used to console.log to the background page of the chrome extension.
var bkg = chrome.extension.getBackgroundPage();
var dryRun = false;

var onCompletion = function(urlsVisited, cookies, cookiesToKeep, cookiesToDelete) {
		bkg.console.log("Cookies to DELETE:");
		// Convert to a set to de-dupe.
		bkg.console.log(Array.from(new Set(cookiesToDelete)).join(", "));
		bkg.console.log("\n\n");
		numUrls = urlsVisited.size;
		numCookies = cookies.length;
		numDeleted = cookiesToDelete.length;
		numKept = cookiesToKeep.length;
		// startTime is initialized in triggerDeleteButton.onclick
		// Set this timeout to avoid showing results until the gif
		// has finished playing.
		let currentTime = new Date();
		const GIF_LENGTH = 4470;
		let timeRemainingForGif = Math.max(0, GIF_LENGTH - (currentTime - startTime));
		setTimeout(function(){
			updateUIWithCompletionStats(numUrls, numCookies, numDeleted, numKept);
		}, timeRemainingForGif)
};

var updateUIWithCompletionStats = function(numUrls, numCookies, numDeleted, numKept) {
	let textDiv = document.getElementById("deletionCompleted");
	textDiv.appendChild(document.createTextNode("The cookie deletion was successful!"));
	textDiv.appendChild(document.createElement("br"));
	textDiv.appendChild(document.createElement("br"));
	textDiv.appendChild(document.createTextNode(`From a total of ${numCookies} cookies` +
		` and ${numUrls} domains you ` +
		`deleted ${numDeleted} cookies and kept ${numKept} cookies.`));
	cookieMonsterImage.src = "imgs/happy_cookie_monster.jpg";
};

triggerDeleteButton.onclick = function(element) {
	chrome.storage.sync.get('domainDoNotDeleteList', function(whitelist){
		chrome.storage.sync.get('lookbackWindowInDays', function(lookbackData){
			let kMicroSecondsInLookback = 1000 * 60 * 60 * 24 * Math.max(0.5, lookbackData.lookbackWindowInDays);
			var lookbackWindowStartTimeMicros = (new Date).getTime() - kMicroSecondsInLookback;
			deleteCookies(dryRun, lookbackWindowStartTimeMicros, whitelist.domainDoNotDeleteList, onCompletion);
		});
	});
	// Set a slight delay before removing the button of aesthetic reasons.
	setTimeout(function(){
		// Global variable that will be used to determine when the gif has finished.
		startTime = new Date();
		triggerDeleteButton.style.display = "none";
		cookieMonsterImage.src="imgs/cookie_monster.gif";
		cookieMonsterDiv.appendChild(cookieMonsterImage);
	}, 30);
};

