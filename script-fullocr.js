
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

function loadPhases() {
  const majorSelect = document.getElementById("level-major");
  const phaseSelect = document.getElementById("level-phase");
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
}

function estimateTimes(current, total, speed) {
  const now = new Date();
  const crystalSec = (total * 0.4) / speed;
  const levelSec   = (total - current) / speed;
  const toTimeStr = secs => new Date(now.getTime()+secs*1000)
                           .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const levelDate = new Date(now.getTime() + levelSec * 1000);
  // Compute next realm slot within 11:00～00:02 window
  const start = new Date(levelDate.getFullYear(), levelDate.getMonth(), levelDate.getDate(), 11, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate()+1);
  end.setHours(0, 2, 0, 0);
  let realmDate = new Date(levelDate.getFullYear(), levelDate.getMonth(), levelDate.getDate(), levelDate.getHours()+1, 0, 0);
  if (realmDate < start) realmDate = start;
  if (realmDate > end) realmDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()+1, 11, 0, 0);
  return {
    crystalSec,
    levelSec,
    crystalTime: toTimeStr(crystalSec),
    levelTime:   toTimeStr(levelSec),
    realmDate
  };
}

function showResult(info, note="") {
  document.getElementById("download-ics").style.display = "inline-block";
  const resultBox = document.getElementById("result");
  resultBox.textContent = (note?note +"\n":"") +
    `1. ⏰ 收結晶時間：${info.crystalTime}\n` +
    `2. 📈 本階級修為集滿時間：${info.levelTime}\n` +
    `3. ⚔️ 可打秘境時間：${info.realmDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  window.lastInfo = info;
}

function setupHandlers() {
  document.getElementById("calc-manual").addEventListener("click", () => {
    const c = +document.getElementById("exp-current").value;
    const t = +document.getElementById("level-phase").value;
    const s = +document.getElementById("exp-speed").value;
    if (!c || !t || !s) return alert("請完整選擇並輸入！");
    showResult(estimateTimes(c, t, s), "🔧 手動模式：");
  });
  document.getElementById("upload").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    document.getElementById("result").textContent = "🧠 OCR辨識中…";
    const img = new Image();
    img.src = URL.createObjectURL(f); await img.decode();
    const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    try {
      const { data:{ text } } = await Tesseract.recognize(canvas, 'chi_sim');
      const nums = [...text.matchAll(/\d{4,9}/g)].map(m => +m[0]);
      const speedMatch = text.match(/(\d+\.\d+)/);
      if (nums.length>=2 && speedMatch) {
        document.getElementById("exp-current").value = nums[0];
        document.getElementById("exp-speed").value = speedMatch[1];
        showResult(estimateTimes(nums[0], +document.getElementById("level-phase").value, +speedMatch[1]), "🤖 OCR模式：");
      } else throw "";
    } catch {
      document.getElementById("result").textContent = "⚠️ OCR未識別，請手動輸入並按計算。";
    }
  });
  document.getElementById("download-ics").addEventListener("click", () => {
    const info = window.lastInfo;
    if (!info) return;
    const pad = n => n.toString().padStart(2,'0');
    const fmt = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const crystalDate = new Date(Date.now() + info.crystalSec*1000);
    const realmDate = info.realmDate;
    const lines = [
      "BEGIN:VCALENDAR","VERSION:2.0",
      "BEGIN:VEVENT","SUMMARY:收結晶","DTSTART:"+fmt(crystalDate),"END:VEVENT",
      "BEGIN:VEVENT","SUMMARY:可打秘境","DTSTART:"+fmt(realmDate),"END:VEVENT",
      "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\n")],{type:"text/calendar"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xiuxian-helper.ics";
    a.click();
  });
}

window.onload = () => {
  loadPhases();
  setupHandlers();
};
