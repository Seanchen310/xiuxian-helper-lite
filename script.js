
const majorSelect = document.getElementById("level-major");
const phaseSelect = document.getElementById("level-phase");
const currentInput = document.getElementById("exp-current");
const speedInput   = document.getElementById("exp-speed");
const manualBtn    = document.getElementById("calc-manual");
const upload       = document.getElementById("upload");
const resultBox    = document.getElementById("result");
const downloadBtn  = document.getElementById("download-ics");
const canvas       = document.getElementById("canvas");
const ctx          = canvas.getContext("2d");
let lastInfo = null;

// 境界資料
const levelData = {
  "三等築基": [5400, 13000, 24150],
  "四等結罡": [25000, 26000, 44625],
  "五等元嬰": [48825, 51240, 54915],
  "六等出竅": [56490, 59325, 61950],
  "七等化神": [65415, 68670, 72135],
  "八等合體": [75705, 79485, 166950],
  "九等渴虛": [175350, 183750, 193200],
  "十等大乘": [202965, 213150, 223650],
  "十一等渡劫": [262500, 283500, 315000],
  "十二等人仙": [861000, 903000, 1050000],
  "十三等真仙": [924000, 945000, 950985],
  "十四等金仙": [968100, 985530, 1003275],
  "十五等上仙": [1020000, 1039500, 1058442],
  "十六等仙君": [1890000, 1942500, 2520000]
};

// 初始化大等級選單
window.addEventListener("DOMContentLoaded", () => {
  for(const major in levelData) {
    const opt = document.createElement("option");
    opt.value = major;
    opt.text = major;
    majorSelect.appendChild(opt);
  }
});

// 選擇大等級後，動態加載細分期
majorSelect.addEventListener("change", () => {
  phaseSelect.innerHTML = '<option value="">-- 請選擇期數 --</option>';
  phaseSelect.disabled = false;
  const arr = levelData[majorSelect.value] || [];
  ["前期","中期","後期"].forEach((label,i) => {
    const opt = document.createElement("option");
    opt.value = arr[i];
    opt.text = `${label} (${arr[i]})`;
    phaseSelect.appendChild(opt);
  });
});

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
  resultBox.textContent = 
    (note?note+"\n":"") +
    `⏰ 收結晶時間：${info.crystalTime}\n` +
    `🚀 升級完成時間：${info.levelUpTime}`;
  downloadBtn.style.display = "inline-block";
}

// 手動計算
manualBtn.addEventListener("click", () => {
  const current = +currentInput.value;
  const total   = +phaseSelect.value;
  const speed   = +speedInput.value;
  if(!majorSelect.value || !phaseSelect.value || !current || !speed) {
    alert("請完整選擇境界、期數並輸入當前修為及速度！");
    return;
  }
  showResult(estimateTimes(current, total, speed), "🔧 手動模式：");
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
    if(nums.length>=2 && speedMatch && majorSelect.value) {
      currentInput.value = nums[0];
      speedInput.value   = speedMatch[1];
      // 自動選擇 total based on current > thresholds
      const thresholds = levelData[majorSelect.value];
      const phaseIndex = thresholds.findIndex(thresh => nums[1] == thresh);
      if(phaseIndex>=0) {
        phaseSelect.selectedIndex = phaseIndex+1;
      }
      showResult(estimateTimes(nums[0], +phaseSelect.value, +speedMatch[1]), "🤖 OCR 模式：");
    } else throw "";
  } catch {
    resultBox.textContent = "⚠️ OCR 無法完整擷取，請手動操作並按「計算時間」。";
  }
  manualBtn.disabled = false;
});

// 下載 .ics
downloadBtn.addEventListener("click", () => {
  if(!lastInfo) return;
  const pad = n=>n.toString().padStart(2,'0');
  const fmt = d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const {crystalDate, levelDate} = lastInfo;
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "BEGIN:VEVENT","SUMMARY:收結晶（修為滿40%）","DTSTART:"+fmt(crystalDate),"END:VEVENT",
    "BEGIN:VEVENT","SUMMARY:準備升級！（滿修為 + 打贏論道）","DTSTART:"+fmt(levelDate),"END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");
  const blob = new Blob([ics],{type:"text/calendar"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xiuxian-helper.ics";
  a.click();
});
