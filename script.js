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

const phaseLabels = ['前期', '中期', '後期'];
const majorOrder = Object.keys(levelData);

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

// 當選擇大等級時，載入期數
majorSelect.addEventListener("change", () => {
  phaseSelect.innerHTML = '<option value="">-- 請選期數 --</option>';
  phaseSelect.disabled = true;
  const arr = levelData[majorSelect.value];
  if (arr) {
    ["前期", "中期", "後期"].forEach((label, i) => {
      const opt = document.createElement("option");
      opt.value = arr[i];
      opt.textContent = `${label} (${arr[i]})`;
      phaseSelect.appendChild(opt);
    });
    phaseSelect.disabled = false;
  }
});

// 取得 phase index
function getPhaseIndex(phaseText) {
  if (phaseText.includes('前期')) return 0;
  if (phaseText.includes('中期')) return 1;
  if (phaseText.includes('後期')) return 2;
  return 0;
}

// 完整升級路徑模擬
function estimateFullUpgradePath(startMajor, startPhaseIndex, currentExp, speed) {
  let now = new Date();
  let plan = [];
  const majors = majorOrder;
  const startMajorIdx = majors.indexOf(startMajor);

  // 當前大等級剩餘細分期
  let curMajor = startMajor;
  let curPhaseIdx = startPhaseIndex;
  let curExp = currentExp;

  // 先補完目前大等級剩餘細分期
  for (let i = curPhaseIdx; i < 3; i++) {
    const target = levelData[curMajor][i];
    const delta = (i === curPhaseIdx) ? (target - curExp) : target;
    const seconds = delta / speed;
    now = new Date(now.getTime() + seconds * 1000);
    plan.push({ level: curMajor, phase: phaseLabels[i], finishTime: new Date(now), delta });
    curExp = 0; // 升下一分期歸零
  }
  // 之後每個大等級都完整三個階段
  for (let majorIdx = startMajorIdx + 1; majorIdx < majors.length; majorIdx++) {
    curMajor = majors[majorIdx];
    for (let i = 0; i < 3; i++) {
      const target = levelData[curMajor][i];
      const seconds = target / speed;
      now = new Date(now.getTime() + seconds * 1000);
      plan.push({ level: curMajor, phase: phaseLabels[i], finishTime: new Date(now), delta: target });
    }
  }
  return plan;
}

// 顯示完整升級路徑
function showFullPath(plan) {
  let output = `🔧 手動模式（升級全路徑預測）：\n`;
  plan.forEach((step, idx) => {
    output += `${idx+1}. ${step.level} ${step.phase} 集滿（+${step.delta}）時間：${step.finishTime.toLocaleString()}\n`;
    // 若是每個大等級的後期，特別標註「可晉升挑戰」
    if (step.phase === '後期') {
      output += `   ⏩ 可於此時挑戰晉升秘境\n`;
    }
  });
  resultBox.textContent = output;
  downloadBtn.style.display = "inline-block";
}

// 傳統單階段計算（僅本階收結晶與集滿）
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

// 顯示單階段計算結果
function showResult(info, note="") {
  lastInfo = info;
  resultBox.textContent = (note?note+"\n":"") +
    `⏰ 收結晶時間：${info.crystalTime}\n` +
    `🚀 可打秘境時間：${info.levelUpTime}`;
  downloadBtn.style.display = "inline-block";
}

// 手動計算（完整升級路徑）
manualBtn.addEventListener("click", () => {
  const c = +currentInput.value;
  const tLabel = phaseSelect.options[phaseSelect.selectedIndex]?.textContent || "";
  const t = +phaseSelect.value;
  const s = +speedInput.value;
  const major = majorSelect.value;
  if (!major || !t || !c || !s) {
    alert("請選擇完整條件並輸入修為與速度！");
    return;
  }
  // 取得 phase index
  const phaseIdx = getPhaseIndex(tLabel);
  // 計算完整升級路徑
  const path = estimateFullUpgradePath(major, phaseIdx, c, s);
  showFullPath(path);
});

// OCR 輔助（保留原本單階段顯示，避免自動模式誤導）
upload.addEventListener("change", async e => {
  const file = e.target.files[0]; if(!file) return;
  resultBox.textContent = "🧠 OCR 辨識中…";
  manualBtn.disabled = true;
  const img = new Image();
  img.src = URL.createObjectURL(file); await img.decode();
  const w = img.width*0.3, h = img.height*0.2;
  canvas.width = w; canvas.height = h;
  ctx.drawImage(img, img.width-w, 0, w, h, 0, 0, w, h);
  try {
    const { data:{text} } = await Tesseract.recognize(canvas, 'chi_sim');
    const nums = [...text.matchAll(/\d{4,9}/g)].map(m => +m[0]);
    const speedMatch = text.match(/(\d+\.\d+)/);
    if (nums.length >= 2 && speedMatch && majorSelect.value) {
      currentInput.value = nums[0];
      speedInput.value = speedMatch[1];
      // 自動選期數：取最小大於等於current?
      const thresholds = levelData[majorSelect.value];
      const phaseIndex = thresholds.findIndex(val => nums[0] < val);
      phaseSelect.selectedIndex = phaseIndex + 1; // option index
      showResult(estimateTimes(nums[0], +phaseSelect.value, +speedMatch[1]), "🤖 OCR 模式：");
    } else throw "";
  } catch {
    resultBox.textContent = "⚠️ OCR 未完全識別，請手動操作並按「計算時間」。";
  }
  manualBtn.disabled = false;
});

// 下載日曆（保留原功能）
downloadBtn.addEventListener("click", () => {
  if (!lastInfo) return alert("請先計算時間！");
  // 這裡可自行加強為完整升級路徑日曆
  alert("下載功能尚未完善，請自行參考升級預測結果。");
});
