
const manualBtn = document.getElementById("calc-manual");
const upload = document.getElementById("upload");
const resultBox = document.getElementById("result");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function estimateTimes(current, total, speed) {
  const percent = (current / total) * 100;
  const now = new Date();
  const remainSec1 = ((total * 0.4) - current) / speed;
  const remainSec2 = (total - current) / speed;

  const toTimeStr = (secs) => {
    const date = new Date(now.getTime() + secs * 1000);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return {
    percent: percent.toFixed(2) + "%",
    crystalTime: toTimeStr(remainSec1),
    levelUpTime: toTimeStr(remainSec2),
  };
}

function showResult(current, total, speed, note="") {
  const info = estimateTimes(current, total, speed);
  let output = "";
  if (note) output += note + "\n";
  output += `📊 修為：${current} / ${total}（${info.percent}）\n`;
  output += `⚡ 速度：${speed} 修為/秒\n\n`;
  output += `⏰ 收結晶時間：${info.crystalTime}\n`;
  output += `🚀 升級完成時間：${info.levelUpTime}`;
  resultBox.textContent = output;
}

manualBtn.addEventListener("click", () => {
  const current = parseInt(document.getElementById("exp-current").value);
  const total = parseInt(document.getElementById("exp-total").value);
  const speed = parseFloat(document.getElementById("exp-speed").value);
  if (!current || !total || !speed) {
    alert("請完整填寫所有欄位！");
    return;
  }
  showResult(current, total, speed, "🔧 手動輸入模式：");
});

// OCR as helper
upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  resultBox.textContent = "🧠 OCR 辨識中，若無法全部擷取，請手動輸入。";
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  const w = img.width * 0.30, h = img.height * 0.20;
  canvas.width = w; canvas.height = h;
  ctx.drawImage(img, img.width - w, 0, w, h, 0, 0, w, h);
  try {
    const { data: { text } } = await Tesseract.recognize(canvas, 'chi_sim');
    const nums = [...text.matchAll(/\d{4,9}/g)].map(m=>parseInt(m[0],10));
    const speedMatch = text.match(/(\d+\.\d+)/);
    if (nums.length >=2 && speedMatch) {
      document.getElementById("exp-current").value = nums[0];
      document.getElementById("exp-total").value = nums[1];
      document.getElementById("exp-speed").value = speedMatch[1];
      showResult(nums[0], nums[1], parseFloat(speedMatch[1]), "🤖 OCR 模式：");
    } else {
      throw new Error("數值不足");
    }
  } catch {
    // fallback: manual section already visible
  }
});
