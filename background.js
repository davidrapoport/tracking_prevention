chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.sync.set({autoDelete: false, lookbackWindowInDays: 30.0, domainDoNotDeleteList: []})
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	  chrome.declarativeContent.onPageChanged.addRules([{
	    conditions: [new chrome.declarativeContent.PageStateMatcher()],
		actions: [new chrome.declarativeContent.ShowPageAction()]
	  }]);
	});
});

// Do not actually delete cookies on a dry run.
var dry_run = false;

chrome.alarms.create("cookieDeleteAlarm", {"periodInMinutes": 0.1})
chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name != "cookieDeleteAlarm") {
		return;
	}
	chrome.storage.sync.get('autoDelete', function(autoDeleteData){
		if(autoDeleteData.autoDelete) {
			chrome.storage.sync.get("domainDoNotDeleteList", function(whitelistData) {
				chrome.storage.sync.get('lookbackWindowInDays', function(lookbackData){
					let kMicroSecondsInLookback = 1000 * 60 * 60 * 24 * 
													Math.max(0.5, lookbackData.lookbackWindowInDays);
					var lookbackWindowStartTime = (new Date).getTime() - kMicroSecondsInLookback;
					deleteCookies(dry_run, lookbackWindowStartTime, whitelistData.domainDoNotDeleteList, 
					  function(urlsVisited, cookies, cookiesToKeep, cookiesToDelete){
						console.log("Cookies to DELETE: ");
						console.log(cookiesToDelete.join(", "));
						var numUrls = urlsVisited.size;
						var numCookies = cookies.length;
						var numDeleted = cookiesToDelete.length;
						var numKept = cookiesToKeep.length;
						console.log(`From a total of ${numCookies} cookies` +
								` and ${numUrls} domains you ` +
								`deleted ${numDeleted} cookies and kept ${numKept} cookies.`)
					});
				});
			});
		}
	})
});