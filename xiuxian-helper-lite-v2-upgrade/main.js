
const output = document.getElementById("output");
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  output.textContent = "🧠 OCR 分析中，請稍候…";
  Tesseract.recognize(file, 'chi_sim', { logger: m => console.log(m) })
    .then(({ data: { text } }) => {
      output.textContent = `🔍 辨識結果：\n${text}`;
    }).catch(err => {
      output.textContent = `❌ 發生錯誤：${err.message}`;
    });
});
