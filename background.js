chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "capture_screenshot") {
      console.log("capture_screenshot");
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
        chrome.storage.local.set({ screenshot: imageUri, coords: message.coords }, () => {
          sendResponse({ success: true });
        });
      });
      return true; // 非同期処理のため `true` を返す
    }
  });
  