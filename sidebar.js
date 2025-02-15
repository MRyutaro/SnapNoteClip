document.addEventListener("DOMContentLoaded", function () {
	const sendButton = document.getElementById("send-btn");
	const messageInput = document.getElementById("message-input");
	const chatBox = document.getElementById("chat-box");

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
				};
				reader.readAsDataURL(blob);
			}
		}
	});

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		// メッセージ要素作成
		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message", "text-message");
		messageElement.textContent = messageText;

		chatBox.appendChild(messageElement);
		scrollToBottom();

		messageInput.value = "";
	}

	function addImageToChat(imageSrc) {
		const imageElement = document.createElement("img");
		imageElement.src = imageSrc;
		imageElement.classList.add("chat-image");

		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "image-message"); // 背景なし＆余白なし用のクラス
		messageElement.appendChild(imageElement);

		chatBox.appendChild(messageElement);
		scrollToBottom();
	}

	function scrollToBottom() {
		setTimeout(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		}, 100);
	}
});
