document.getElementById("openSidePanel").addEventListener("click", async () => {
	if (chrome.sidePanel) {
		await chrome.sidePanel.open({ tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id });
	} else {
		alert("このブラウザはサイドパネルをサポートしていません。");
	}
});
