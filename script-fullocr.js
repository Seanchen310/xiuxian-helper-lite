
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

const majorSelect = document.getElementById("level-major");
const phaseSelect = document.getElementById("level-phase");
const currentInput = document.getElementById("exp-current");
const speedInput   = document.getElementById("exp-speed");
const manualBtn    = document.getElementById("calc-manual");
const upload       = document.getElementById("upload");
const resultBox    = document.getElementById("result");
const downloadBtn  = document.getElementById("download-ics");
let lastInfo = null;

// 載入期數
majorSelect.addEventListener("change", () => {
  phaseSelect.innerHTML = '<option value="">-- 請先選大等級 --</option>';
  const arr = levelData[majorSelect.value];
  if (arr) {
    ["前期","中期","後期"].forEach((lab,i) => {
      const o = document.createElement("option");
      o.value = arr[i];
      o.textContent = `${lab} (${arr[i]})`;
      phaseSelect.appendChild(o);
    });
    phaseSelect.disabled = false;
  }
});

// 計算函式
function estimateTimes(current, total, speed) {
  const now = new Date();
  const crystalSec = (total * 0.4) / speed;
  const levelSec   = (total - current) / speed;
  const toTimeStr = secs => new Date(now.getTime()+secs*1000)
                           .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  return {
    crystalSec,
    levelSec,
    crystalTime: toTimeStr(crystalSec),
    levelUpTime: toTimeStr(levelSec),
    crystalDate: new Date(now.getTime()+crystalSec*1000),
    levelDate:   new Date(now.getTime()+levelSec*1000)
  };
}

// 顯示結果：監於原先的UI
function showResult(info, note="") {
  lastInfo = info;
  resultBox.textContent = (note?note+"\n":"") +
    `⏰ 收結晶時間：${info.crystalTime}\n🚀 升級完成時間：${info.levelUpTime}`;
  downloadBtn.style.display = "inline-block";
}

// 手動計算
manualBtn.addEventListener("click", () => {
  const c = +currentInput.value;
  const t = +phaseSelect.value;
  const s = +speedInput.value;
  if (!majorSelect.value || !phaseSelect.value || !c || !s) {
    alert("請完整選擇並輸入！");
    return;
  }
  showResult(estimateTimes(c, t, s), "🔧 手動模式：");
});

// 全圖OCR
upload.addEventListener("change", async e => {
  const f = e.target.files[0]; if(!f) return;
  resultBox.textContent = "🧠 OCR辨識中…";
  const img = new Image();
  img.src = URL.createObjectURL(f); await img.decode();
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  canvas.width = img.width; canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  try {
    const { data:{ text } } = await Tesseract.recognize(canvas, 'chi_sim');
    const nums = [...text.matchAll(/\d{4,9}/g)].map(m => +m[0]);
    const speedMatch = text.match(/(\d+\.\d+)/);
    if (nums.length >= 2 && speedMatch && majorSelect.value && phaseSelect.value) {
      currentInput.value = nums[0];
      speedInput.value = speedMatch[1];
      showResult(estimateTimes(nums[0], +phaseSelect.value, +speedMatch[1]), "🤖 OCR模式：");
    } else throw "";
  } catch {
    resultBox.textContent = "⚠️ OCR未識別，請手動輸入並按計算。";
  }
});

// 計算準備升級時間：下一整點前1分鐘 + 範圍
function getPrepareTime(levelDate) {
  let prep = new Date(levelDate);
  prep.setHours(prep.getHours()+1, 0, 0, 0);
  prep = new Date(prep.getTime() - 60000);
  const start = new Date(prep);
  start.setHours(prep.getHours() < 11 ? 11 : prep.getHours(), 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate()+1);
  end.setHours(0, 2, 0, 0);
  if (prep < start) prep = start;
  if (prep > end) prep = end;
  return prep;
}

// Download .ics: crystal at crystalDate, prepare at prepDT
downloadBtn.addEventListener("click", () => {
  if (!lastInfo) return;
  const pad = n => n.toString().padStart(2,'0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const crystalDT = new Date(Date.now() + lastInfo.crystalSec*1000);
  const prepDT = getPrepareTime(lastInfo.levelDate);
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "BEGIN:VEVENT","SUMMARY:收結晶","DTSTART:"+fmt(crystalDT),"END:VEVENT",
    "BEGIN:VEVENT","SUMMARY:秘境論道大會開始前1分鐘","DTSTART:"+fmt(prepDT),"END:VEVENT",
    "END:VCALENDAR"
  ];
  const blob = new Blob([lines.join("\n")],{type:"text/calendar"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xiuxian-helper.ics";
  a.click();
});
