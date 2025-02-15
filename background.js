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
					files: ["content.js"],
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
	console.log("📩 メッセージを受信:", message);

	if (message.action === "capture_screenshot") {
		// 全画面スクリーンショットを取得（png形式）
		chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
			console.log("📸 全画面スクショ取得:", imageUri);

			// fetch API で画像を Blob として取得し、createImageBitmap() で ImageBitmap に変換
			fetch(imageUri)
				.then((response) => response.blob())
				.then((blob) => {
					console.log("背景スクリプト: Blob取得成功");
					return createImageBitmap(blob);
				})
				.then((imageBitmap) => {
					console.log("背景スクリプト: ImageBitmap生成成功");
					// OffscreenCanvas を利用して、選択範囲だけを切り抜く
					let canvas = new OffscreenCanvas(message.coords.width, message.coords.height);
					let ctx = canvas.getContext("2d");
					ctx.drawImage(
						imageBitmap,
						message.coords.x, // 切り抜き開始位置 X（デバイスピクセル単位）
						message.coords.y, // 切り抜き開始位置 Y
						message.coords.width, // 切り抜く幅
						message.coords.height, // 切り抜く高さ
						0, // Canvas 上の描画開始位置 X
						0, // Canvas 上の描画開始位置 Y
						message.coords.width, // 描画する幅
						message.coords.height // 描画する高さ
					);
					console.log("背景スクリプト: drawImage 成功");
					return canvas.convertToBlob({ type: "image/png" });
				})
				.then((blob) => {
					console.log("背景スクリプト: convertToBlob 成功");
					let reader = new FileReader();
					reader.onload = function () {
						let croppedImageUri = reader.result;
						console.log("🎯 切り抜き後の画像:", croppedImageUri);
						// 切り抜いた画像データを chrome.storage.local に保存
						chrome.storage.local.set({ screenshot: croppedImageUri, coords: message.coords }, () => {
							console.log("✅ スクショが chrome.storage.local に保存されました！");
							sendResponse({ success: true });
						});
					};
					reader.readAsDataURL(blob);
				})
				.catch((err) => {
					console.error("❌ 画像処理エラー:", err);
					sendResponse({ success: false, error: err });
				});
		});
		// 非同期処理のため true を返す
		return true;
	}
});
