document.addEventListener("DOMContentLoaded", function () {
	const sendButton = document.getElementById("send-btn");
	const messageInput = document.getElementById("message-input");
	const chatBox = document.getElementById("chat-box");

	const INITIAL_MESSAGES = [
		{ type: "text", content: "スクリーンショットのショートカットはchrome://extensions/shortcutsから設定を行ってください。", isInitial: true },
		{ type: "text", content: "このチャットでスクリーンショットを保存して、後で参照できます。", isInitial: true },
	];

	loadMessages();

	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

	function loadMessages() {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

		const hasInitialMessages = messages.some((msg) => msg.isInitial);
		if (!hasInitialMessages) {
			messages = [...INITIAL_MESSAGES, ...messages];
			localStorage.setItem("chatMessages", JSON.stringify(messages));
		}

		chatBox.innerHTML = "";
		messages.forEach((message, index) => {
			if (message.type === "text") {
				addTextToChat(message.content, index, message.timestamp, message.isInitial);
			} else if (message.type === "image") {
				addImageToChat(message.content, index, message.timestamp, message.tabId, message.url);
			}
		});
	}

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		const timestamp = getCurrentTimestamp();
		const messageIndex = saveMessage({ type: "text", content: messageText, timestamp: timestamp });
		addTextToChat(messageText, messageIndex, timestamp, false);

		messageInput.value = "";
	}

	function saveMessage(message) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
		messages.push(message);
		localStorage.setItem("chatMessages", JSON.stringify(messages));
		return messages.length - 1;
	}

	function addTextToChat(text, index, timestamp, isInitial = false) {
		const messageWrapper = document.createElement("div");
		messageWrapper.classList.add("message-wrapper");

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message", "text-message");
		messageElement.textContent = text;

		const timeElement = createTimestampElement(timestamp);
		const buttonContainer = createButtonContainer(index, null, false, isInitial);

		messageWrapper.appendChild(messageElement);
		messageWrapper.appendChild(timeElement);
		messageWrapper.appendChild(buttonContainer);

		chatBox.appendChild(messageWrapper);
		scrollToBottom();
	}

	function scrollToBottom() {
		setTimeout(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		}, 100);
	}

	function displayScreenshot(tabId, url) {
		chrome.storage.local.get(["screenshot"], (data) => {
			if (!data.screenshot) {
				console.log("❌ スクリーンショットデータが見つかりません");
				return;
			}

			const timestamp = getCurrentTimestamp();
			const messageIndex = saveMessage({ type: "image", content: data.screenshot, timestamp, tabId, url });
			addImageToChat(data.screenshot, messageIndex, timestamp, tabId, url);
		});
	}

	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (changes.screenshot) {
			console.log("🔄 スクリーンショットが更新されました！");
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (!tabs || tabs.length === 0) {
					console.error("⚠️ アクティブなタブが見つかりません！");
					return;
				}
				displayScreenshot(tabs[0].id, tabs[0].url);
			});
		}
	});

	function addImageToChat(imageSrc, index, timestamp, tabId, url) {
		const messageWrapper = document.createElement("div");
		messageWrapper.classList.add("message-wrapper");
		messageWrapper.id = "tab-" + tabId; // 初期のtabIdを設定

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "image-message");

		const imageElement = document.createElement("img");
		imageElement.src = imageSrc;
		imageElement.classList.add("chat-image");
		// imageElement.onclick = function () {
		//     openImageInNewWindow(imageSrc);
		// };

		const timeElement = createTimestampElement(timestamp);
		const buttonContainer = createButtonContainer(index, imageSrc, true, false);

		messageElement.appendChild(imageElement);
		messageWrapper.appendChild(messageElement);
		messageWrapper.appendChild(timeElement);
		messageWrapper.appendChild(buttonContainer);

		chatBox.appendChild(messageWrapper);
		scrollToBottom();

		// タブを開く or アクティブ化する処理
		imageElement.onclick = function () {
			if (tabId) {
				// タブが存在するかチェック
				chrome.tabs.get(tabId, function (tab) {
					if (chrome.runtime.lastError || !tab) {
						// タブが閉じていた場合、新しく開く
						chrome.tabs.create({ url }, function (newTab) {
							tabId = newTab.id; // 新しいタブIDを更新
							messageWrapper.id = "tab-" + tabId; // IDも更新
						});
					} else {
						// 既存のタブをアクティブにする
						chrome.tabs.update(tabId, { active: true });
					}
				});
			} else {
				// tabIdがない場合、新しく開く
				chrome.tabs.create({ url }, function (newTab) {
					tabId = newTab.id; // 新しいタブIDを更新
					messageWrapper.id = "tab-" + tabId; // IDも更新
				});
			}
		};
	}

	function getCurrentTimestamp() {
		const now = new Date();
		return now.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
	}

	function createTimestampElement(timestamp) {
		const timeElement = document.createElement("div");
		timeElement.classList.add("timestamp");
		timeElement.textContent = timestamp;
		return timeElement;
	}

	function createButtonContainer(index, imageSrc, isImage = false, isInitial = false) {
		if (isInitial) {
			return document.createElement("span"); // 初期メッセージならボタンを作成しない
		}

		const buttonContainer = document.createElement("div");
		buttonContainer.classList.add("button-container");

		// 削除ボタン
		const deleteButton = document.createElement("button");
		deleteButton.classList.add("delete-btn");
		deleteButton.addEventListener("click", function () {
			deleteMessage(index, isImage);
		});

		// 拡大ボタン（画像の場合のみ）
		if (isImage) {
			const expandButton = document.createElement("button");
			expandButton.classList.add("expand-btn");
			expandButton.addEventListener("click", function (event) {
				event.stopPropagation();
				openImageInNewWindow(imageSrc);
			});

			buttonContainer.appendChild(expandButton);
		}

		buttonContainer.appendChild(deleteButton);
		return buttonContainer;
	}

	function deleteMessage(index, isImage = false) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

		if (index >= 0 && index < messages.length) {
			const deletedMessage = messages[index];

			// 画像の場合は `chrome.storage.local` からも削除
			if (isImage && deletedMessage.type === "image") {
				chrome.storage.local.remove("screenshot", () => {
					console.log("🗑️ スクリーンショットを `chrome.storage.local` から削除しました");
				});
			}

			messages.splice(index, 1);
			localStorage.setItem("chatMessages", JSON.stringify(messages));
			reloadChat();
		}
	}

	function reloadChat() {
		chatBox.innerHTML = "";
		loadMessages();
	}

	function openImageInNewWindow(imageSrc) {
		const newWindow = window.open("", "_blank", "width=1200,height=900");
		newWindow.document.write(`
			<html>
			<head>
				<title>画像拡大表示</title>
			</head>
			<body>
				<img src="${imageSrc}" alt="拡大画像" style="max-width: 100%; max-height: 100vh;">
			</body>
			</html>
		`);
		newWindow.document.close();
	}
});
