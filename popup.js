let triggerDeleteButton = document.getElementById("triggerDeleteButton");

var microSecondsPerMonth = 1000 * 60 * 60 * 24 * 31;
var oneMonthAgo = (new Date).getTime() - microSecondsPerMonth;
// Used to console.log to the background page of the chrome extension.
var bkg = chrome.extension.getBackgroundPage();
var urlsVisited = new Set();
var numRequestsOutstanding = 0;

// We need to get all HistoryItems and then for each HistoryItem
// we need to call the API to get all visits. This function is a 
// callback for the API call.
var processVisits = function(url, visitItems){
	for (let visitItem of visitItems) {
		// Do not take URLs which the user did not actively navigate to.
		if (visitItem.transition != 'typed' && visitItem.transition != 'link') {
		  continue;
		}
		var parsedUrl = new URL(url);
		if (!parsedUrl.hostname) {
			continue;
		}
		// Strip of www. and any other prefixes.
		// A visit to www.mail.google.com will count as a visit to google.com
		shortenedDomain = parsedUrl.hostname.split(".").slice(-2).join(".")
		// Global set containing all TLDs.
		urlsVisited.add(shortenedDomain);
	}
	if(!--numRequestsOutstanding) {
		onAllVisitsProcessed();
	}
}

triggerDeleteButton.onclick = function(element) {
  bkg.console.log("Looking through history");
  chrome.history.search({
  	'text': '',
  	'startTime': oneMonthAgo,
  	'maxResults': 1000000000
  },
  function(historyItems) {
  	for (var i = 0; i < historyItems.length; i++) {
  		  var url = historyItems[i].url;
  		  var processVisitsWithUrl = function(url) {
  		    // We need the url of the visited item to process the visit.
  		    // Use a closure to bind the  url into the callback's args.
  		    return function(visitItems) {
  		      processVisits(url, visitItems);
  		    };
  		  };
  		  chrome.history.getVisits({"url": url}, processVisitsWithUrl(url));
  		  numRequestsOutstanding++;
  		}
	if (!numRequestsOutstanding) {
	  onAllVisitsProcessed();
	}
  })
};

var onAllVisitsProcessed = function() {
	var cookiesToDelete = [];
	var cookiesToKeep = []
	var numUrls, numCookies, numDeleted, numKept;
	chrome.cookies.getAll({}, function(cookies){
		for(let cookie of cookies) {
			shortenedDomain = cookie.domain.split(".").slice(-2).join(".")
			if(urlsVisited.has(shortenedDomain)) {
				cookiesToKeep.push(shortenedDomain)
			} else {
				cookiesToDelete.push(shortenedDomain);
				var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
				          cookie.path;
				// chrome.cookies.remove({"url": url, "name": cookie.name});
			}
		}
		bkg.console.log("Cookies to DELETE:");
		bkg.console.log(cookiesToDelete.join(", "));
		bkg.console.log("\n\n");
		bkg.console.log("Cookies to KEEP:");
		bkg.console.log(cookiesToKeep.join(", "));
		numUrls = urlsVisited.size;
		numCookies = cookies.length;
		numDeleted = cookiesToDelete.length;
		numKept = cookiesToKeep.length;
		// TODO is this the right way to write JS code? Do I have to issue the next 
		// function call from within this callback?
		updateUIWithCompletionStats(numUrls, numCookies, numDeleted, numKept);
	});
}

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