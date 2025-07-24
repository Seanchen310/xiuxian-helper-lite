
const resultBox = document.getElementById("result");

function estimateTimes(current, total, speed) {
  const percent = current / total;
  const remainSec1 = ((total * 0.4) - current) / speed;
  const remainSec2 = (total - current) / speed;
  const now = new Date();

  const toTimeStr = (sec) => {
    const t = new Date(now.getTime() + sec * 1000);
    return t.toTimeString().substring(0, 5);
  };

  return {
    percent: (percent * 100).toFixed(2) + "%",
    crystalTime: toTimeStr(remainSec1),
    levelUpTime: toTimeStr(remainSec2),
  };
}

document.getElementById("upload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  resultBox.textContent = "🧠 圖像分析中，請稍候…";

  const { data: { text } } = await Tesseract.recognize(file, 'chi_sim');

  // 抓出數值：修為兩個與速度
  const allNums = [...text.matchAll(/\d{4,9}/g)].map(m => parseInt(m[0], 10));
  const speedMatch = text.match(/(\d+\.\d+)\s*(修為|exp)?\/?秒/);

  let output = `🔍 原始辨識結果：\n${text}\n\n`;

  if (allNums.length >= 2 && speedMatch) {
    const [current, total] = allNums;
    const speed = parseFloat(speedMatch[1]);

    const info = estimateTimes(current, total, speed);
    output += `📊 修為：${current} / ${total}（${info.percent}）\n⚡ 速度：${speed} 修為/秒\n\n`;
    output += `⏰ 收結晶時間：${info.crystalTime}\n🚀 升級完成時間：${info.levelUpTime}`;
  } else {
    output += "⚠️ 無法正確辨識三項數值（修為 x2 + 速度），請再試一次或上傳清晰截圖。";
  }

  resultBox.textContent = output;
});
