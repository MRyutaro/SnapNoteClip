// background.js

// 拡張機能のアイコンがクリックされたときにサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
	if (chrome.sidePanel) {
		await chrome.sidePanel.open({ tabId: tab.id });
		console.log("サイドパネルを開きました");
	} else {
		console.warn("サイドパネルを開けませんでした（非対応の環境の可能性あり）");
	}
});

// ショートカットキー（例：Ctrl+Shift+S / Command+Shift+S）が押されたとき、content.js を現在のタブに注入する
chrome.commands.onCommand.addListener((command) => {
	if (command === "capture_screenshot") {
		console.log("ショートカットキーが押されました！");
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (!tabs || tabs.length === 0) {
				console.error("⚠️ アクティブなタブが見つかりません！");
				return;
			}
			// content.js を注入してユーザーの範囲選択を有効化する
			chrome.scripting
				.executeScript({
					target: { tabId: tabs[0].id },
					files: ["screenshot.js"],
				})
				.then(() => {
					console.log("スクリーンショット処理を開始しました");
				})
				.catch((error) => {
					console.error("スクリプト実行エラー:", error);
				});
		});
	}
});

// content.js からのメッセージを受信して、スクリーンショットを取得・切り抜く処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "capture_screenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
            console.log("📸 全画面スクショ取得:", imageUri);
  
            fetch(imageUri)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(imageBitmap => {
                    let canvas = new OffscreenCanvas(message.coords.width, message.coords.height);
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(
                        imageBitmap,
                        message.coords.x, message.coords.y,
                        message.coords.width, message.coords.height,
                        0, 0,
                        message.coords.width, message.coords.height
                    );
                    return canvas.convertToBlob({ type: "image/png" });
                })
                .then(blob => {
                    let reader = new FileReader();
                    reader.onload = function () {
                        let croppedImageUri = reader.result;
                        console.log("🎯 切り抜き後の画像:", croppedImageUri);
  
                        // **スクショを `chrome.storage.local` に保存**
                        chrome.storage.local.set({ screenshot: croppedImageUri, coords: message.coords }, () => {
                            console.log("✅ スクリーンショットが `chrome.storage.local` に保存されました！");
                            sendResponse({ success: true });
                        });
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(err => {
                    console.error("❌ 画像処理エラー:", err);
                    sendResponse({ success: false, error: err.message });
                }); // ここで `.catch()` を閉じる
        });
        return true; // 非同期処理のため `true` を返す
    }
  });
  