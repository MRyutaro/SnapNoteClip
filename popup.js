document.addEventListener("DOMContentLoaded", () => {
    // スクリーンショット取得ボタン
    const captureButton = document.getElementById("capture");
    if (captureButton) {
        captureButton.addEventListener("click", async () => {
            try {
                console.log("ボタンがクリックされました！");

                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

                if (!tabs || tabs.length === 0) {
                    console.error("アクティブなタブが見つかりません！");
                    return;
                }

                console.log("アクティブなタブ:", tabs[0]);

                // content.js を実行（スクリーンショット範囲の選択処理）
                const result = await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ["content.js"]
                });

                console.log("スクリプト実行結果:", result);

            } catch (error) {
                console.error("スクリプト実行エラー:", error);
            }
        });
    } else {
        console.error("❌ `capture` ボタンが見つかりません！");
    }

    // スクリーンショット削除ボタン
    const deleteButton = document.getElementById("deleteScreenshot");
    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            chrome.storage.local.remove(["screenshot", "coords"], () => {
                console.log("スクリーンショット削除完了！");

                // 現在のタブでスクリーンショットを削除
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) return;

                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: () => {
                            let imgElement = document.getElementById("screenshot-img");
                            if (imgElement) {
                                imgElement.remove();
                                console.log("画面上のスクショ削除完了！");
                            } else {
                                console.log("削除するスクショが見つかりません！");
                            }
                        }
                    });
                });
            });
        });
    } else {
        console.error("❌ `deleteScreenshot` ボタンが見つかりません！");
    }

    // 現在のストレージデータを確認
    chrome.storage.local.get(null, (data) => console.log("現在のストレージデータ:", data));
});
