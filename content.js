try {
  console.log("✅ content.js が実行されました！");

  // すでにリスナーが登録されている場合は再登録しない
  if (window.hasScreenshotSelection) {
      console.log("🚨 すでに範囲選択リスナーが登録されています。再登録しません。");
  } else {
      window.hasScreenshotSelection = true;  // フラグをセット

      // 選択範囲を示す赤い枠を作成
      let selectionDiv = document.createElement("div");
      selectionDiv.style.position = "fixed";
      selectionDiv.style.border = "2px dashed red";
      selectionDiv.style.zIndex = "10000";
      selectionDiv.style.pointerEvents = "none";
      document.body.appendChild(selectionDiv);

      let startX, startY, endX, endY;
      let isSelecting = false;

      // マウスが押されたとき
      function handleMouseDown(e) {
          console.log("🖱 mousedown:", e.clientX, e.clientY);
          isSelecting = true;
          startX = e.clientX;
          startY = e.clientY;
          selectionDiv.style.left = `${startX}px`;
          selectionDiv.style.top = `${startY}px`;
          selectionDiv.style.width = "0px";
          selectionDiv.style.height = "0px";
          selectionDiv.style.display = "block";  // 赤枠を表示
      }

      // マウスが動いたとき
      function handleMouseMove(e) {
          if (!isSelecting) return;
          endX = e.clientX;
          endY = e.clientY;
          selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
          selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
          selectionDiv.style.left = `${Math.min(startX, endX)}px`;
          selectionDiv.style.top = `${Math.min(startY, endY)}px`;
      }

      // マウスを離したとき
      function handleMouseUp(e) {
          if (!isSelecting) return;  // 既に処理済みなら無視
          // 最後に mouseup イベントの座標を取得して補完
          endX = e.clientX;
          endY = e.clientY;
          console.log("🖱 mouseup:", startX, startY, endX, endY);
          isSelecting = false;
          selectionDiv.style.display = "none";  // 赤枠を消す

          // 範囲がほぼゼロの場合は無視
          if (Math.abs(endX - startX) < 5 || Math.abs(endY - startY) < 5) {
              console.log("⚠️ 選択範囲が小さすぎるためスクショを撮りません！");
              cleanupScreenshotSelection();
              return;
          }

          // devicePixelRatio を考慮して、選択座標を補正（CSSピクセル -> デバイスピクセル）
          const dpr = window.devicePixelRatio || 1;
          chrome.runtime.sendMessage({
              action: "capture_screenshot",
              coords: { 
                  x: startX * dpr, 
                  y: startY * dpr, 
                  width: (endX - startX) * dpr, 
                  height: (endY - startY) * dpr 
              }
          });
          console.log("📸 スクリーンショットを撮影しました！");

          cleanupScreenshotSelection();
      }

      // スクショ機能をオフにする関数（イベントリスナーを解除）
      function cleanupScreenshotSelection() {
          document.removeEventListener("mousedown", handleMouseDown);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          window.hasScreenshotSelection = false;  // フラグをリセット
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

// スクリーンショットを画面に表示する関数
function displayScreenshot() {
  // 既存のスクリーンショットがあれば削除
  let oldImg = document.getElementById("screenshot-img");
  if (oldImg) {
      oldImg.remove();
      console.log("🗑️ 古いスクリーンショットを削除しました");
  }

  // ストレージからスクリーンショットと座標を取得
  chrome.storage.local.get(["screenshot", "coords"], (data) => {
      console.log("取得したストレージデータ:", data);
      if (data.screenshot) {
          // 保存された座標はデバイスピクセル単位になっているので、CSS表示用に逆補正する
          const dpr = window.devicePixelRatio || 1;
          let coords = data.coords || { x: 10, y: 10, width: 200, height: 200 };
          let cssCoords = {
              x: coords.x / dpr,
              y: coords.y / dpr,
              width: coords.width / dpr,
              height: coords.height / dpr
          };

          let imgElement = document.createElement("img");
          imgElement.id = "screenshot-img";
          imgElement.src = data.screenshot;
          imgElement.style.position = "fixed";
          imgElement.style.left = `${cssCoords.x}px`;
          imgElement.style.top = `${cssCoords.y}px`;
          imgElement.style.width = `${cssCoords.width}px`;
          imgElement.style.height = `${cssCoords.height}px`;
          imgElement.style.border = "1px solid black";
          imgElement.style.zIndex = "10000";
          document.body.appendChild(imgElement);
          console.log("📷 スクリーンショットが表示されました");
      } else {
          console.log("保存されたスクリーンショットが存在しません");
      }
  });
}

// 初回表示（確認用）
displayScreenshot();

// ストレージの変更を監視して、スクリーンショットを更新
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.screenshot || changes.coords) {
      displayScreenshot();
  }
});
