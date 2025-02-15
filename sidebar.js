document.addEventListener("DOMContentLoaded", function () {
	const sendButton = document.getElementById("send-btn");
	const messageInput = document.getElementById("message-input");
	const chatBox = document.getElementById("chat-box");

	// 保存されたメッセージを復元
	loadMessages();

	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			sendMessage();
		}
	});

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

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		addTextToChat(messageText);
		saveMessage({ type: "text", content: messageText });

		messageInput.value = "";
	}

	function addTextToChat(text) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message", "text-message");
		messageElement.textContent = text;

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

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

	function scrollToBottom() {
		setTimeout(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		}, 100);
	}

	// メッセージを `localStorage` に保存
	function saveMessage(message) {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
		messages.push(message);
		localStorage.setItem("chatMessages", JSON.stringify(messages));
	}

	// `localStorage` からメッセージを復元
	function loadMessages() {
		let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
		messages.forEach((message) => {
			if (message.type === "text") {
				addTextToChat(message.content);
			} else if (message.type === "image") {
				addImageToChat(message.content);
			}
		});
	}
});
