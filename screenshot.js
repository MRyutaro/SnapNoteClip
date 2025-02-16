try {
	console.log("✅ content.js が実行されました！");

	// すでにリスナーが登録されている場合は再登録しない
	if (window.hasScreenshotSelection) {
		console.log("🚨 すでに範囲選択リスナーが登録されています。再登録しません。");
	} else {
		window.hasScreenshotSelection = true;  // フラグをセット

		// 選択範囲を示す赤い枠を作成
		let selectionDiv = document.createElement("div");
		selectionDiv.style.position = "absolute";
		selectionDiv.style.border = "2px dashed red";
		selectionDiv.style.zIndex = "10000";
		selectionDiv.style.pointerEvents = "none";
		document.body.appendChild(selectionDiv);

		let startX, startY, endX, endY;
		let isSelecting = false;


		function updateSelectionBox(e) {
			endX = e.clientX + window.scrollX;
			endY = e.clientY + window.scrollY;
			selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
			selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
			selectionDiv.style.left = `${Math.min(startX, endX)}px`;
			selectionDiv.style.top = `${Math.min(startY, endY)}px`;
		}

		function autoScroll(e) {
			let margin = 50;
			let maxSpeed = 50;
			let speedFactor = 5;
			let scrollSpeedY = 0;
			let scrollSpeedX = 0;

			if (e.clientY < margin) {
				scrollSpeedY = Math.min(maxSpeed, (margin - e.clientY) * speedFactor);
				window.scrollBy(0, -scrollSpeedY);
			} else if (e.clientY > window.innerHeight - margin) {
				scrollSpeedY = Math.min(maxSpeed, (e.clientY - (window.innerHeight - margin)) * speedFactor);
				window.scrollBy(0, scrollSpeedY);
			}
			if (e.clientX < margin) {
				scrollSpeedX = Math.min(maxSpeed, (margin - e.clientX) * speedFactor);
				window.scrollBy(-scrollSpeedX, 0);
			} else if (e.clientX > window.innerWidth - margin) {
				scrollSpeedX = Math.min(maxSpeed, (e.clientX - (window.innerWidth - margin)) * speedFactor);
				window.scrollBy(scrollSpeedX, 0);
			}
		}

		function handleMouseDown(e) {
			console.log("🖱 mousedown:", e.clientX, e.clientY);
			isSelecting = true;
			startX = e.clientX + window.scrollX;
			startY = e.clientY + window.scrollY;
			selectionDiv.style.left = `${startX}px`;
			selectionDiv.style.top = `${startY}px`;
			selectionDiv.style.width = "0px";
			selectionDiv.style.height = "0px";
			selectionDiv.style.display = "block";
			// **テキスト選択防止**
			document.body.style.userSelect = "none";
		}

		function handleMouseMove(e) {
			if (!isSelecting) return;
			updateSelectionBox(e);
			autoScroll(e);
		}

		function handleMouseUp(e) {
			if (!isSelecting) return;
			console.log("🖱 mouseup:", startX, startY, endX, endY);
			isSelecting = false;

			// **選択範囲が小さすぎる場合は無視**
			if (Math.abs(endX - startX) < 5 || Math.abs(endY - startY) < 5) {
				console.log("⚠️ 選択範囲が小さすぎるためスクショを撮りません！");
				cleanupScreenshotSelection();
				return;
			}

			// **スクリーンショット前に赤枠を確実に削除**
			if (selectionDiv) {
				selectionDiv.remove();
				console.log("🟥 赤枠を削除しました");
			}
			// **少し遅らせてスクリーンショットを撮る**
			setTimeout(() => {
				const dpr = window.devicePixelRatio || 1;
				const coords = {
					x: startX * dpr,
					y: startY * dpr,
					width: (endX - startX) * dpr,
					height: (endY - startY) * dpr
				};

				console.log("📸 スクリーンショットを撮影します！座標:", coords);

				// **スクリーンショットをストレージに保存**
				chrome.runtime.sendMessage({
					action: "capture_screenshot",
					coords: coords
				});

				// **選択解除**
				document.body.style.userSelect = "";
				if (window.getSelection) {
					window.getSelection().removeAllRanges();
				}

				cleanupScreenshotSelection();
			}, 10);  // **10ms遅延**
		}

		function cleanupScreenshotSelection() {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			window.hasScreenshotSelection = false;
			console.log("🚫 スクリーンショット機能をオフにしました");
		}

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}
} catch (error) {
	console.error("❌ content.js のエラー:", error);
}
