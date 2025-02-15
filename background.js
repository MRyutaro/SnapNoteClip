chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture_screenshot") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
      console.log("背景スクリプト: 全画面スクショ取得", imageUri);
      fetch(imageUri)
        .then(response => response.blob())
        .then(blob => {
          console.log("背景スクリプト: Blob取得成功");
          return createImageBitmap(blob);
        })
        .then(imageBitmap => {
          console.log("背景スクリプト: ImageBitmap生成成功");
          let canvas = new OffscreenCanvas(message.coords.width, message.coords.height);
          let ctx = canvas.getContext("2d");
          ctx.drawImage(
            imageBitmap,
            message.coords.x,        // 切り抜き開始位置 X（デバイスピクセル単位）
            message.coords.y,        // 切り抜き開始位置 Y
            message.coords.width,    // 切り抜く幅
            message.coords.height,   // 切り抜く高さ
            0,                       // Canvas 上の描画開始位置 X
            0,                       // Canvas 上の描画開始位置 Y
            message.coords.width,    // 描画する幅
            message.coords.height    // 描画する高さ
          );
          console.log("背景スクリプト: drawImage 成功");
          return canvas.convertToBlob({ type: "image/png" });
        })
        .then(blob => {
          console.log("背景スクリプト: convertToBlob 成功");
          let reader = new FileReader();
          reader.onload = function() {
            let croppedImageUri = reader.result;
            console.log("背景スクリプト: 切り抜いた画像Data URL", croppedImageUri);
            chrome.storage.local.set({ screenshot: croppedImageUri, coords: message.coords }, () => {
              console.log("背景スクリプト: スクショ保存完了");
              sendResponse({ success: true });
            });
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error("背景スクリプト: 画像処理エラー:", err);
          sendResponse({ success: false, error: err });
        });
    });
    return true;
  }
});
