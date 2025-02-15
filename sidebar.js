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

	function sendMessage() {
		const messageText = messageInput.value.trim();
		if (messageText === "") return;

		// メッセージ要素作成
		const messageElement = document.createElement("div");
		messageElement.classList.add("message", "my-message");
		messageElement.textContent = messageText;

		chatBox.appendChild(messageElement);

		// 最新のメッセージを常に表示
		setTimeout(() => {
			messageElement.scrollIntoView({ behavior: "smooth", block: "end" });
		}, 100);

		messageInput.value = "";
	}
});
