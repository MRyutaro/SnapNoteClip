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

  document.addEventListener("mousedown", (e) => {
      console.log("🖱 mousedown:", e.clientX, e.clientY);
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      selectionDiv.style.left = `${startX}px`;
      selectionDiv.style.top = `${startY}px`;
      selectionDiv.style.width = "0px";
      selectionDiv.style.height = "0px";
  });

  document.addEventListener("mousemove", (e) => {
      if (!isSelecting) return;
      endX = e.clientX;
      endY = e.clientY;
      selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
      selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
      selectionDiv.style.left = `${Math.min(startX, endX)}px`;
      selectionDiv.style.top = `${Math.min(startY, endY)}px`;
  });

  document.addEventListener("mouseup", () => {
      console.log("🖱 mouseup:", startX, startY, endX, endY);
      isSelecting = false;
      selectionDiv.style.display = "none";

      chrome.runtime.sendMessage({
          action: "capture_screenshot",
          coords: { x: startX, y: startY, width: endX - startX, height: endY - startY }
      });
  });

} catch (error) {
  console.error("❌ content.js のエラー:", error);
}

// スクショの表示処理
function displayScreenshot() {
  let oldImg = document.getElementById("screenshot-img");
  if (oldImg) {
      oldImg.remove();
      console.log("🗑️ 古いスクリーンショットを削除しました");
  }

  chrome.storage.local.get(["screenshot", "coords"], (data) => {
      if (data.screenshot) {
          let coords = data.coords || { x: 10, y: 10, width: 200, height: 200 };
          let imgElement = document.createElement("img");
          imgElement.id = "screenshot-img";
          imgElement.src = data.screenshot;
          imgElement.style.position = "fixed";
          imgElement.style.left = `${coords.x}px`;
          imgElement.style.top = `${coords.y}px`;
          imgElement.style.width = `${coords.width}px`;
          imgElement.style.height = `${coords.height}px`;
          imgElement.style.border = "1px solid black";
          imgElement.style.zIndex = "10000";
          document.body.appendChild(imgElement);
      }
  });
}

// 初回スクショ表示
displayScreenshot();

// ストレージ変更時にスクショを更新
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.screenshot || changes.coords) {
      displayScreenshot();
  }
});
