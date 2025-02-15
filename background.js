// 拡張機能のアイコンがクリックされたときにサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
	if (chrome.sidePanel) {
		await chrome.sidePanel.open({ tabId: tab.id });
		console.log("サイドパネルを開きました");
	} else {
		console.warn("サイドパネルを開けませんでした（非対応の環境の可能性あり）");
	}
});
