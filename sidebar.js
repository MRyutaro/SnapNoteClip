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

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "image-message");
		messageElement.appendChild(imageElement);

		chatBox.appendChild(messageElement);
		scrollToBottom();
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
