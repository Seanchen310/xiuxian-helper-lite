
const levelData = {
  '三等築基':[5400,13000,24150],'四等結罡':[25000,26000,44625],'五等元嬰':[48825,51240,54915],
  '六等出竅':[56490,59325,61950],'七等化神':[65415,68670,72135],'八等合體':[75705,79485,166950],
  '九等渴虛':[175350,183750,193200],'十等大乘':[202965,213150,223650],'十一等渡劫':[262500,283500,315000],
  '十二等人仙':[861000,903000,1050000],'十三等真仙':[924000,945000,950985],'十四等金仙':[968100,985530,1003275],
  '十五等上仙':[1020000,1039500,1058442],'十六等仙君':[1890000,1942500,2520000]
};
const majorOrder=['三等築基','四等結罡','五等元嬰','六等出竅','七等化神','八等合體','九等渴虛','十等大乘','十一等渡劫','十二等人仙','十三等真仙','十四等金仙','十五等上仙','十六等仙君'];

const majorSel=document.getElementById('level-major'),
      phaseSel=document.getElementById('level-phase'),
      currInput=document.getElementById('exp-current'),
      spdInput=document.getElementById('exp-speed'),
      btnCalc=document.getElementById('calc-manual'),
      upload=document.getElementById('upload'),
      resBox=document.getElementById('result'),
      btnIcs=document.getElementById('download-ics');

let lastInfo;

majorSel.addEventListener('change', () => {
  phaseSel.innerHTML = '<option value="">-- 請先選大等級 --</option>';
  const arr = levelData[majorSel.value];
  if (arr) {
    ['前期','中期','後期'].forEach((lab,i) => {
      const opt = document.createElement('option');
      opt.value = arr[i];
      opt.textContent = lab + ' (' + arr[i] + ')';
      phaseSel.appendChild(opt);
    });
    phaseSel.disabled = false;
  }
});

function estimateTimes(cur, total, spd) {
  const now = new Date();
  const crystalSec = total * 0.4 / spd;
  const levelSec = (total - cur) / spd;
  const format = secs => new Date(now.getTime() + secs*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const levelDate = new Date(now.getTime() + levelSec*1000);
  let realm = new Date(levelDate);
  realm.setHours(levelDate.getHours()+1,0,0,0);
  const start = new Date(levelDate); start.setHours(11,0,0,0);
  const end = new Date(start); end.setDate(start.getDate()+1); end.setHours(0,2,0,0);
  if (realm < start) realm = start;
  if (realm > end) realm = new Date(start.getFullYear(), start.getMonth(), start.getDate()+1,11,0,0);
  return { crystalSec, levelSec, crystalTime: format(crystalSec), levelTime: format(levelSec), levelDate, realmDate: realm };
}

btnCalc.addEventListener('click', () => {
  const cur = Number(currInput.value), total = Number(phaseSel.value), spd = Number(spdInput.value);
  if (!cur || !total || !spd) return alert('請完整選擇並輸入！');
  const info = estimateTimes(cur, total, spd);
  lastInfo = info;
  const now = new Date();
  let lvlText = info.levelTime;
  if (info.levelDate < now) {
    const today0 = new Date(now); today0.setHours(0,0,0,0);
    const yesterday0 = new Date(today0); yesterday0.setDate(today0.getDate()-1);
    if (info.levelDate >= yesterday0 && info.levelDate < today0) {
      const t = info.levelDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      lvlText = '昨天 ' + t;
    } else {
      lvlText = '<span class="red">' + info.levelTime + '（已滿）</span>';
    }
  }
  let output = 
    `1. ⏰ 收結晶時間：${info.crystalTime}
` +
    `2. 📈 本階級修為集滿時間：${lvlText}
` +
    `3. ⚔️ 可打秘境時間：${info.realmDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  if (cur > total) {
    const arr = levelData[majorSel.value];
    const phaseIdx = arr.indexOf(total);
    let next, nextLabel;
    if (phaseIdx < 2) {
      next = arr[phaseIdx+1];
      nextLabel = ['前期','中期','後期'][phaseIdx+1] + '('+ next + ')';
    } else {
      const idx = majorOrder.indexOf(majorSel.value);
      const nextMajor = majorOrder[idx+1];
      if (nextMajor) {
        next = levelData[nextMajor][0];
        nextLabel = nextMajor + '·前期(' + next + ')';
      }
    }
    if (next) {
      const jinfo = estimateTimes(cur, next, spd);
      output += `

🔮 留層直升至 ${nextLabel}：需時 ${jinfo.levelTime}，預計 ${jinfo.levelTime}`;
    }
  }
  resBox.innerHTML = output;
  btnIcs.style.display = 'inline-block';
});

// OCR handler
upload.addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  resBox.textContent = '🧠 OCR辨識中…';
  const img = new Image(); img.src = URL.createObjectURL(f); await img.decode();
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img,0,0);
  try {
    const { data:{ text } } = await Tesseract.recognize(canvas,'chi_sim');
    const nums = [...text.matchAll(/\d{4,9}/g)].map(m=>+m[0]);
    const sm = text.match(/(\d+\.\d+)/);
    if (nums.length>=2 && sm) {
      currInput.value = nums[0];
      spdInput.value = sm[1];
      btnCalc.click();
    } else throw '';
  } catch {
    resBox.textContent = '⚠️ OCR未識別，請手動輸入並按計算。';
  }
});

// ICS download
btnIcs.addEventListener('click', () => {
  if (!lastInfo) return;
  const pad = n => n.toString().padStart(2,'0');
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const cd = new Date(Date.now() + lastInfo.crystalSec*1000), rd = lastInfo.realmDate;
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT","SUMMARY:收結晶","DTSTART:"+fmt(cd),"END:VEVENT","BEGIN:VEVENT","SUMMARY:可打秘境","DTSTART:"+fmt(rd),"END:VEVENT","END:VCALENDAR"];
  const blob = new Blob([lines.join("\n")],{type:"text/calendar"}),a=document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'xiuxian-helper.ics'; a.click();
});