// Used to console.log to the background page of the chrome extension.
var bkg = chrome.extension.getBackgroundPage();
var numRequestsOutstanding = 0;
var urlsVisited = new Set();

// We need to get all HistoryItems and then for each HistoryItem
// we need to call the API to get all visits. This function is a 
// callback for the API call.
var processVisits = function(url, visitItems, dryRun, onCompletion){
	for (let visitItem of visitItems) {
		// Do not take URLs which the user did not actively navigate to.
		if (visitItem.transition != 'typed' && visitItem.transition != 'link') {
		  continue;
		}
		var parsedUrl = new URL(url);
		if (!parsedUrl.hostname) {
			continue;
		}
		// Strip off www. and any other prefixes.
		// A visit to www.mail.google.com will count as a visit to google.com
		shortenedDomain = parsedUrl.hostname.split(".").slice(-2).join(".")
		// Global set containing all TLDs.
		urlsVisited.add(shortenedDomain);
	}
	if(!--numRequestsOutstanding) {
		onAllVisitsProcessed(dryRun, onCompletion);
	}
}

// dryRun: A boolean indicating whether or not to delete the cookies.
// lookbackWindowStartTimeMicros: The start time for the history search. Entries in the history
// 		before this timestamp will not be counted as visited.
// onCompletion: A callback function that takes params
// 		urlsVisited, cookies, cookiesToKeep, cookiesToDelete
//		where cookiesToKeep and cookiesToDelete are arrays of strings, urlsVisited is a Set of strings
//		and cookies is an array of Cookies.
var deleteCookies = function(dryRun, lookbackWindowStartTimeMicros, onCompletion) {
  bkg.console.log("Looking through history");
  chrome.history.search({
  	'text': '',
  	'startTime': lookbackWindowStartTimeMicros,
  	'maxResults': 100000000
  },
  function(historyItems) {
  	for (var i = 0; i < historyItems.length; i++) {
  		  var url = historyItems[i].url;
  		  var processVisitsWithUrl = function(url) {
  		    // We need the url of the visited item to process the visit.
  		    // Use a closure to bind the  url into the callback's args.
  		    return function(visitItems) {
  		      processVisits(url, visitItems, dryRun, onCompletion);
  		    };
  		  };
  		  chrome.history.getVisits({"url": url}, processVisitsWithUrl(url));
  		  numRequestsOutstanding++;
  		}
	// if (!numRequestsOutstanding) {
	// 	bkg.console.log("DONE")
	//   onAllVisitsProcessed(dryRun);
	// }
  })
};

var onAllVisitsProcessed = function(dryRun, onCompletion) {
	var cookiesToDelete = [];
	var cookiesToKeep = [];
	chrome.cookies.getAll({}, function(cookies){
		for(let cookie of cookies) {
			// Strip off www. and any other prefixes.
			// A visit to www.mail.google.com will count as a visit to google.com
			shortenedDomain = cookie.domain.split(".").slice(-2).join(".");
			if(urlsVisited.has(shortenedDomain)) {
				cookiesToKeep.push(shortenedDomain)
			} else {
				cookiesToDelete.push(shortenedDomain);
				var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
				if(!dryRun){
					chrome.cookies.remove({"url": url, "name": cookie.name});
				}
			}
		}
		onCompletion(urlsVisited, cookies, cookiesToKeep, cookiesToDelete)
	});
}