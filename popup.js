let triggerDeleteButton = document.getElementById("triggerDeleteButton");
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
		updateUIWithCompletionStats(numUrls, numCookies, numDeleted, numKept);
};

var updateUIWithCompletionStats = function(numUrls, numCookies, numDeleted, numKept) {
	let textDiv = document.getElementById("deletionCompleted");
	textDiv.appendChild(document.createTextNode("The cookie deletion successful!"));
	textDiv.appendChild(document.createElement("br"));
	textDiv.appendChild(document.createElement("br"));
	textDiv.appendChild(document.createTextNode(`From a total of ${numCookies} cookies` +
		` and ${numUrls} domains you ` +
		`deleted ${numDeleted} cookies and kept ${numKept} cookies.`));
	triggerDeleteButton.style.display = "none";
};

triggerDeleteButton.onclick = function(element) {
	chrome.storage.sync.get('domainDoNotDeleteList', function(whitelist){
		chrome.storage.sync.get('lookbackWindowInDays', function(lookbackData){
			let kMicroSecondsInLookback = 1000 * 60 * 60 * 24 * Math.max(0.5, lookbackData.lookbackWindowInDays);
			var lookbackWindowStartTimeMicros = (new Date).getTime() - kMicroSecondsInLookback;
			deleteCookies(dryRun, lookbackWindowStartTimeMicros, whitelist.domainDoNotDeleteList, onCompletion);
		});
	});
};
