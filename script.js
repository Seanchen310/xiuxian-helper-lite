
const levelSelect = document.getElementById("level-select");
const currentInput = document.getElementById("exp-current");
const totalInput   = document.getElementById("exp-total");
const speedInput   = document.getElementById("exp-speed");
const manualBtn    = document.getElementById("calc-manual");
const upload       = document.getElementById("upload");
const resultBox    = document.getElementById("result");
const downloadBtn  = document.getElementById("download-ics");
const canvas       = document.getElementById("canvas");
const ctx          = canvas.getContext("2d");
let lastInfo = null;

// 計算函式
function estimateTimes(current, total, speed) {
  const now = new Date();
  const crystalSec = (total * 0.4) / speed;
  const levelSec   = (total - current) / speed;
  const toTimeStr = secs => new Date(now.getTime()+secs*1000)
                           .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  return {
    crystalTime: toTimeStr(crystalSec),
    levelUpTime: toTimeStr(levelSec),
    crystalDate: new Date(now.getTime()+crystalSec*1000),
    levelDate:   new Date(now.getTime()+levelSec*1000)
  };
}

// 顯示結果
function showResult(info, note="") {
  lastInfo = info;
  let out = note ? note + "\n" : "";
  out += `⏰ 收結晶時間：${info.crystalTime}\n`;
  out += `🚀 升級完成時間：${info.levelUpTime}`;
  resultBox.textContent = out;
  downloadBtn.style.display = "inline-block";
}

// 手動計算
manualBtn.addEventListener("click", () => {
  const c = +currentInput.value, t = +totalInput.value, s = +speedInput.value;
  if(!c||!t||!s){ alert("請完整填寫所有欄位！"); return; }
  showResult(estimateTimes(c,t,s), "🔧 手動模式：");
});

// 等級選擇帶入
levelSelect.addEventListener("change", () => {
  totalInput.value = levelSelect.value;
});

// OCR 輔助
upload.addEventListener("change", async e => {
  const file = e.target.files[0]; if(!file) return;
  resultBox.textContent = "🧠 OCR 辨識中…";
  manualBtn.disabled = true;
  const img = new Image();
  img.src = URL.createObjectURL(file); await img.decode();
  const w = img.width*0.3, h = img.height*0.2;
  canvas.width=w; canvas.height=h;
  ctx.drawImage(img, img.width-w,0,w,h,0,0,w,h);
  try {
    const { data:{text} } = await Tesseract.recognize(canvas,'chi_sim');
    const nums = [...text.matchAll(/\d{4,9}/g)].map(m=>+m[0]);
    const speedMatch = text.match(/(\d+\.\d+)/);
    if(nums.length>=2 && speedMatch) {
      currentInput.value = nums[0];
      totalInput.value   = nums[1];
      speedInput.value   = speedMatch[1];
      showResult(estimateTimes(nums[0],nums[1],+speedMatch[1]), "🤖 OCR 模式：");
    } else throw "";
  } catch {
    resultBox.textContent = "⚠️ OCR 無法完整擷取，請手動輸入並按「計算時間」。";
  }
  manualBtn.disabled = false;
});

// 產生並下載 .ics
downloadBtn.addEventListener("click", () => {
  if(!lastInfo) return;
  const pad = n=>n.toString().padStart(2,'0');
  const fmt = d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const {crystalDate, levelDate} = lastInfo;
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "BEGIN:VEVENT",
    "SUMMARY:收結晶（修為滿40%）",
    `DTSTART:${fmt(crystalDate)}`,
    "END:VEVENT",
    "BEGIN:VEVENT",
    "SUMMARY:準備升級！（滿修為 + 打贏論道）",
    `DTSTART:${fmt(levelDate)}`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\n");
  const blob = new Blob([ics],{type:"text/calendar"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xiuxian-helper.ics";
  a.click();
});
