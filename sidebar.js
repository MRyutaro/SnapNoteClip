document.addEventListener("DOMContentLoaded", function () {
	const sendButton = document.getElementById("send-btn");
	const messageInput = document.getElementById("message-input");
	const chatBox = document.getElementById("chat-box");

	// 初期メッセージ（説明文）を複数登録
	const INITIAL_MESSAGES = [
		{ type: "text", content: "Windowsなら Ctrl + Alt + S,", isInitial: true },
		{ type: "text", content: "Macなら Command + Shift + S でスクリーンショットを撮影できます。", isInitial: true },
		{ type: "text", content: "このチャットでスクリーンショットを保存して、後で参照できます。", isInitial: true },
	];

	// 保存されたメッセージを復元
	loadMessages();

	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

	// `localStorage` からメッセージを復元（初期メッセージ対応）
	function loadMessages() {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

		// 初期メッセージがすでに含まれているかチェック
		const hasInitialMessages = messages.some((msg) => msg.isInitial);

		// 初期メッセージが未登録なら追加
		if (!hasInitialMessages) {
			messages = [...INITIAL_MESSAGES, ...messages];
			localStorage.setItem("chatMessages", JSON.stringify(messages));
		}

		// チャットボックスにメッセージを表示
		messages.forEach((message) => {
			if (message.type === "text") {
				addTextToChat(message.content);
			} else if (message.type === "image") {
				addImageToChat(message.content);
			}
		});
	}

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		addTextToChat(messageText);
		saveMessage({ type: "text", content: messageText });

		messageInput.value = "";
	}

	// メッセージを `localStorage` に保存
	function saveMessage(message) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
		messages.push(message);
		localStorage.setItem("chatMessages", JSON.stringify(messages));
	}

	// メッセージをチャットボックスに追加（改行対応）
	function addTextToChat(text) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message", "text-message");
		messageElement.textContent = text;

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

	function scrollToBottom() {
		setTimeout(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		}, 100);
	}

	// 画像をクリップボードから貼り付ける
	document.addEventListener("paste", function (event) {
		const items = event.clipboardData.items;
		for (let item of items) {
			if (item.type.startsWith("image/")) {
				const blob = item.getAsFile();
				const reader = new FileReader();
				reader.onload = function (e) {
					addImageToChat(e.target.result);
					saveMessage({ type: "image", content: e.target.result });
				};
				reader.readAsDataURL(blob);
			}
		}
	});

	function displayScreenshot() {
        chrome.storage.local.get(["screenshot", "coords"], (data) => {
            console.log("📂 取得したストレージデータ:", data);
            if (!data.screenshot) {
                console.log("❌ スクリーンショットデータが見つかりません");
                return;
            }

            let imgElement = document.createElement("img");
            imgElement.src = data.screenshot;
            imgElement.classList.add("chat-image");

            chatBox.appendChild(imgElement);
            console.log("✅ スクリーンショットがスライドバーに表示されました！");
        });
    }

    // **スライドバーを開いた時にストレージからスクショを取得**
    displayScreenshot();

    // **ストレージが更新されたらリアルタイムでスクショを表示**
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.screenshot) {
            console.log("🔄 スクリーンショットが更新されました！");
            displayScreenshot();
        }
    });

	// **スクリーンショットを取得してチャットに追加**
	// chrome.storage.onChanged.addListener((changes, namespace) => {
	// 	console.log("🔄 `chrome.storage.onChanged` が発火:", changes);
	// 	if (changes.screenshot) {
	// 		console.log("📸 スクリーンショットが保存されました");
	// 		pasteScreenshotAsImage();
	// 	}
	// });

	// **スクリーンショットをチャットに表示**
	// function pasteScreenshotAsImage() {
	// 	chrome.storage.local.get(["screenshot"], (data) => {
	// 		if (data.screenshot) {
	// 			console.log("📸 スクリーンショットをチャットに追加");
	// 			addImageToChat(data.screenshot);
	// 			saveMessage({ type: "image", content: data.screenshot });
	// 		} else {
	// 			console.log("❌ スクリーンショットデータが見つかりません");
	// 		}
	// 	});
	// }

	// **画像をチャットボックスに追加**
	function addImageToChat(imageSrc) {
		const imageElement = document.createElement("img");
		imageElement.src = imageSrc;
		imageElement.classList.add("chat-image");
		imageElement.onclick = function () {
			openImageInNewWindow(imageSrc);
		};

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "image-message");
		messageElement.appendChild(imageElement);

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

	function openImageInNewWindow(imageSrc) {
		const newWindow = window.open("", "_blank", "width=1200,height=900");
		newWindow.document.write(`
			<html>
			<head>
				<title>画像拡大表示</title>
				<style>
					body { display: flex; justify-content: center; align-items: center; height: 100vh; background: black; margin: 0; }
					img { max-width: 90%; max-height: 90%; }
				</style>
			</head>
			<body>
				<img src="${imageSrc}" alt="拡大画像">
			</body>
			</html>
		`);
		newWindow.document.close();
	}
});
