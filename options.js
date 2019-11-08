let autoDeleteInput = document.getElementById("runAutoDelete");
let lookbackInput = document.getElementById("lookBackWindowDays");
let whitelistTable = document.getElementById("whitelistedDomains");
let whitelistInput = document.getElementById("whitelistInputText");

// Populate initial data.
chrome.storage.sync.get('autoDelete', function(deleteData){
	autoDeleteInput.checked=deleteData.autoDelete;
});

chrome.storage.sync.get('lookbackWindowInDays', function(lookbackData){
	lookbackInput.value=lookbackData.lookbackWindowInDays
});


var writeWhitelistToStorage = function(){
	let domains = []
	// TODO why do map and filter not work here?
	for (let span of document.getElementsByTagName("span")){
		if(span.className == "whitelistEntry"){
			domains.push(span.textContent);
		}
	}
	chrome.storage.sync.set({"domainDoNotDeleteList": domains})
}

var deleteListItem = function(li){
	li.parentNode.removeChild(li);
	writeWhitelistToStorage();
}

var createListItem = function(text){
	let li = document.createElement("li");
	let textSpan = document.createElement("span");
	textSpan.className = "whitelistEntry";
	textSpan.appendChild(document.createTextNode(text))
	li.appendChild(textSpan);

	// Create a button to delete entries with.
	let deleteSpan = document.createElement("SPAN");
	deleteSpan.onclick = function(){ deleteListItem(li) };
	deleteSpan.className = "close";
	deleteSpan.appendChild(document.createTextNode("\u00D7"));
	li.appendChild(deleteSpan);

	let whitelistInputLi = document.getElementById("whitelistInputLi");
	whitelistTable.insertBefore(li, whitelistInputLi);
}

chrome.storage.sync.get('domainDoNotDeleteList', function(whitelistData){
	for(let whitelistedDomain of whitelistData.domainDoNotDeleteList) {
		createListItem(whitelistedDomain);
	}
});


// Handle clicks/updates
// TODO: Add a notification that the value has changed
autoDeleteInput.addEventListener("change", function(){
	chrome.storage.sync.set({"autoDelete": autoDeleteInput.checked});
});

lookbackInput.addEventListener("input", function(){
	if(!isNaN(lookbackInput.value) && parseFloat(lookbackInput.value, 10) > 0) {
		chrome.storage.sync.set({"lookbackWindowInDays": parseFloat(lookbackInput.value, 10)});
	}
});

whitelistInput.addEventListener("keypress", function(key){
	const ENTER_KEY = 13;
	if(key.charCode != ENTER_KEY){
		return;
	}
	createListItem(whitelistInput.value);
	writeWhitelistToStorage();
	whitelistInput.value = "";
});
