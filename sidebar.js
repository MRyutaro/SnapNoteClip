document.addEventListener("DOMContentLoaded", function () {
	const sendButton = document.getElementById("send-btn");
	const messageInput = document.getElementById("message-input");
	const chatBox = document.getElementById("chat-box");

	// **初期メッセージ（削除ボタンなし）**
	const INITIAL_MESSAGES = [
		{ type: "text", content: "Windowsなら Ctrl + Alt + S,", isInitial: true },
		{ type: "text", content: "Macなら Command + Shift + S でスクリーンショットを撮影できます。", isInitial: true },
		{ type: "text", content: "このチャットでスクリーンショットを保存して、後で参照できます。", isInitial: true },
	];

	// **保存されたメッセージを復元**
	loadMessages();

	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

	// **メッセージを復元（初期メッセージ対応）**
	function loadMessages() {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

		// **初期メッセージが未登録なら追加**
		const hasInitialMessages = messages.some((msg) => msg.isInitial);
		if (!hasInitialMessages) {
			messages = [...INITIAL_MESSAGES, ...messages];
			localStorage.setItem("chatMessages", JSON.stringify(messages));
		}

		// **メッセージを表示**
		messages.forEach((message, index) => {
			if (message.type === "text") {
				addTextToChat(message.content, index, message.isInitial);
			} else if (message.type === "image") {
				addImageToChat(message.content, index);
			}
		});
	}

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		const messageIndex = saveMessage({ type: "text", content: messageText });
		addTextToChat(messageText, messageIndex, false);

		messageInput.value = "";
	}

	// **メッセージを保存**
	function saveMessage(message) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
		messages.push(message);
		localStorage.setItem("chatMessages", JSON.stringify(messages));
		return messages.length - 1;
	}

	// **テキストメッセージをチャットに追加（初期メッセージか判定）**
	function addTextToChat(text, index, isInitial = false) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message", "text-message");
		messageElement.textContent = text;
		messageElement.style.position = "relative"; 

		// **初期メッセージでなければ削除ボタンを追加**
		if (!isInitial) {
			const deleteButton = createDeleteButton(index);
			messageElement.appendChild(deleteButton);
		}

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

	// **スクロールを最下部へ**
	function scrollToBottom() {
		setTimeout(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		}, 100);
	}

	// **スクリーンショットを表示**
	function displayScreenshot() {
		chrome.storage.local.get(["screenshot"], (data) => {
			if (!data.screenshot) {
				console.log("❌ スクリーンショットデータが見つかりません");
				return;
			}

			const messageIndex = saveMessage({ type: "image", content: data.screenshot });
			addImageToChat(data.screenshot, messageIndex);
		});
	}

	// **スライドバーを開いた時にストレージからスクショを取得**
	displayScreenshot();

	// **ストレージが更新されたらスクショを追加**
	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (changes.screenshot) {
			console.log("🔄 スクリーンショットが更新されました！");
			displayScreenshot();
		}
	});

	// **画像をチャットボックスに追加**
	function addImageToChat(imageSrc, index) {
		const imageElement = document.createElement("img");
		imageElement.src = imageSrc;
		imageElement.classList.add("chat-image");
		imageElement.onclick = function () {
			openImageInNewWindow(imageSrc);
		};

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "image-message");
		messageElement.style.position = "relative";

		// **削除ボタン追加**
		const deleteButton = createDeleteButton(index, true);
		messageElement.appendChild(deleteButton);
		messageElement.appendChild(imageElement);

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

	// **画像を拡大表示**
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

	// **削除ボタンを作成**
	function createDeleteButton(index, isImage = false) {
		const deleteButton = document.createElement("button");
		// deleteButton.textContent = "×";
		deleteButton.classList.add("delete-btn");

		deleteButton.addEventListener("click", function () {
			deleteMessage(index, isImage);
		});

		return deleteButton;
	}

	// **メッセージを削除（画像の場合は `chrome.storage.local` も削除）**
	function deleteMessage(index, isImage = false) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

		if (index >= 0 && index < messages.length) {
			const deletedMessage = messages[index];

			// **画像の場合は `chrome.storage.local` からも削除**
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

	// **チャットの表示をリロード**
	function reloadChat() {
		chatBox.innerHTML = "";
		loadMessages();
	}
});
