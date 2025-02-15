try {
  console.log("✅ content.js が実行されました！");

  let selectionDiv = document.createElement("div");
  selectionDiv.style.position = "fixed";
  selectionDiv.style.border = "2px dashed red";
  selectionDiv.style.zIndex = "10000";
  selectionDiv.style.pointerEvents = "none";
  document.body.appendChild(selectionDiv);

  let startX, startY, endX, endY;
  let isSelecting = false;

  function handleMouseDown(e) {
    console.log("mousedown:", e.clientX, e.clientY);
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionDiv.style.left = `${startX}px`;
    selectionDiv.style.top = `${startY}px`;
    selectionDiv.style.width = "0px";
    selectionDiv.style.height = "0px";
    selectionDiv.style.display = "block";  // 赤枠を表示
  }

  function handleMouseMove(e) {
    if (!isSelecting) return;
    endX = e.clientX;
    endY = e.clientY;
    selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
    selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
    selectionDiv.style.left = `${Math.min(startX, endX)}px`;
    selectionDiv.style.top = `${Math.min(startY, endY)}px`;
  }

  function handleMouseUp() {
    if (!isSelecting) return;  // 既に処理済みなら無視
    console.log("mouseup:", startX, startY, endX, endY);
    isSelecting = false;
    selectionDiv.style.display = "none";  // 赤枠を消す

    // 範囲がほぼゼロの場合は無視
    if (Math.abs(endX - startX) < 5 || Math.abs(endY - startY) < 5) {
        console.log("⚠️ 選択範囲が小さすぎるためスクショを撮りません！");
        cleanupScreenshotSelection();  // 機能オフ
        return;
    }

    // スクリーンショットをリクエスト
    chrome.runtime.sendMessage({
        action: "capture_screenshot",
        coords: { x: startX, y: startY, width: endX - startX, height: endY - startY }
    });

    console.log("スクリーンショットを撮影しました！");

    // スクショ機能をオフにする
    cleanupScreenshotSelection();
  }

  // スクショ機能をオフにする関数
  function cleanupScreenshotSelection() {
    document.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    window.hasScreenshotSelection = false;  // フラグをリセット
    console.log("スクリーンショット機能をオフにしました");
  }

  // イベントリスナーを登録
  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

} catch (error) {
  console.error("content.js のエラー:", error);
}

// スクショの表示処理
function displayScreenshot() {
  // 既存のスクリーンショットがあれば削除
  let oldImg = document.getElementById("screenshot-img");
  if (oldImg) {
      oldImg.remove();
      console.log("古いスクリーンショットを削除しました");
  }

  // ストレージからスクリーンショットを取得
  chrome.storage.local.get(["screenshot", "coords"], (data) => {
      if (data.screenshot) {
          let coords = data.coords || { x: 10, y: 10, width: 200, height: 200 };
          let imgElement = document.createElement("img");
          imgElement.id = "screenshot-img";  // IDをつけることで、後で削除がしやすくなる
          imgElement.src = data.screenshot;
          imgElement.style.position = "fixed";
          imgElement.style.left = `${coords.x}px`;
          imgElement.style.top = `${coords.y}px`;
          imgElement.style.width = `${coords.width}px`;
          imgElement.style.height = `${coords.height}px`;
          imgElement.style.border = "1px solid black";
          imgElement.style.zIndex = "10000";
          document.body.appendChild(imgElement);
          console.log("スクリーンショットが表示されました");
      }
  });
}

// 初回表示（確認用に一度呼び出す）
displayScreenshot();


// ストレージ変更時にスクショを更新
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.screenshot || changes.coords) {
      displayScreenshot();
  }
});
