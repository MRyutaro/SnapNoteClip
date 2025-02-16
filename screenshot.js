try {
	console.log("✅ content.js が実行されました！");

	// すでにリスナーが登録されている場合は再登録しない
	if (window.hasScreenshotSelection) {
		console.log("🚨 すでに範囲選択リスナーが登録されています。再登録しません。");
	} else {
		window.hasScreenshotSelection = true;

		// 選択範囲の枠（赤い線）
		let selectionDiv = document.createElement("div");
		selectionDiv.style.position = "fixed";
		selectionDiv.style.border = "2px dashed red";
		selectionDiv.style.zIndex = "10000";
		selectionDiv.style.pointerEvents = "none";
		document.body.appendChild(selectionDiv);

		let startX, startY, endX, endY;
		let isSelecting = false;

		// クリックで選択開始
		function handleMouseDown(e) {
			console.log("🖱 mousedown:", e.clientX, e.clientY);
			isSelecting = true;
			startX = e.clientX;
			startY = e.clientY;
			selectionDiv.style.left = `${startX}px`;
			selectionDiv.style.top = `${startY}px`;
			selectionDiv.style.width = "0px";
			selectionDiv.style.height = "0px";
			selectionDiv.style.display = "block";

			// **テキスト選択防止**
			document.body.style.userSelect = "none";
		}

		// マウス移動で範囲を拡大
		function handleMouseMove(e) {
			if (!isSelecting) return;
			endX = e.clientX;
			endY = e.clientY;

			// どの方向からでも選択できるように修正
			const left = Math.min(startX, endX);
			const top = Math.min(startY, endY);
			const width = Math.abs(endX - startX);
			const height = Math.abs(endY - startY);

			selectionDiv.style.left = `${left}px`;
			selectionDiv.style.top = `${top}px`;
			selectionDiv.style.width = `${width}px`;
			selectionDiv.style.height = `${height}px`;
		}

		// マウスを離したらスクショ
		function handleMouseUp(e) {
			if (!isSelecting) return;
			endX = e.clientX;
			endY = e.clientY;
			console.log("🖱 mouseup:", startX, startY, endX, endY);
			isSelecting = false;

			// **スクリーンショット前に赤枠を削除**
			if (selectionDiv) {
				selectionDiv.remove();
				console.log("🟥 赤枠を削除しました");
			}

			// **選択範囲が小さすぎる場合は無視**
			if (Math.abs(endX - startX) < 5 || Math.abs(endY - startY) < 5) {
				console.log("⚠️ 選択範囲が小さすぎるためスクショを撮りません！");
				cleanupScreenshotSelection();
				return;
			}

			// **スクリーンショットを撮影（devicePixelRatio補正）**
			setTimeout(() => {
				const dpr = window.devicePixelRatio || 1;
				const coords = {
					x: Math.min(startX, endX) * dpr,
					y: Math.min(startY, endY) * dpr,
					width: Math.abs(endX - startX) * dpr,
					height: Math.abs(endY - startY) * dpr,
				};

				console.log("📸 スクリーンショットを撮影！座標:", coords);

				// **スクリーンショットを保存**
				chrome.runtime.sendMessage({
					action: "capture_screenshot",
					coords: coords,
				});

				// **選択解除**
				document.body.style.userSelect = "";
				if (window.getSelection) {
					window.getSelection().removeAllRanges();
				}

				cleanupScreenshotSelection();
			}, 100); // **100ms遅延でスクショを確実に処理**
		}

		// 選択処理を終了
		function cleanupScreenshotSelection() {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			window.hasScreenshotSelection = false;
			console.log("🚫 スクリーンショット機能をオフにしました");
		}

		// イベントリスナーを登録
		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}
} catch (error) {
	console.error("❌ content.js のエラー:", error);
}
