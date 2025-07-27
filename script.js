document.addEventListener('DOMContentLoaded', () => {
  const phaseData = {
    '三等築基':[5400,13000,24150],
    '四等結丹':[25000,26000,44625],
    '五等元嬰':[48825,51240,54915],
    '六等出竅':[56490,59325,61950],
    '七等化神':[65415,68670,72135],
    '八等合體':[75705,79485,166950],
    '九等洞虛':[175350,183750,193200],
    '十等大乘':[202965,213150,223650],
    '十一等渡劫':[262500,283500,315000],
    '十二等人仙':[315000,861000,903000],
    '十三等真仙':[924000,945000,950985],
    '十四等金仙':[968100,985530,1003275],
    '十五等上仙':[1020000,1039500,1058442],
    '十六等仙君':[1890000,1942500,2520000]
  };
  const majorSel = document.getElementById('level-major');
  const phaseSel = document.getElementById('level-phase');
  const curInput = document.getElementById('exp-current');
  const spdInput = document.getElementById('exp-speed');
  const calcBtn  = document.getElementById('calcBtn');
  const resDiv   = document.getElementById('result');

  function getLegalSlot(d) {
    const slot = new Date(d);
    slot.setMinutes(0,0,0,0);
    if (d.getMinutes()>0 || d.getSeconds()>0) slot.setHours(slot.getHours()+1);
    const h = slot.getHours();
    if ((h>=11 && h<=23) || h===0) return slot;
    slot.setDate(slot.getDate()+1);
    slot.setHours(11,0,0,0);
    return slot;
  }

  majorSel.addEventListener('change', () => {
    const arr = phaseData[majorSel.value] || [];
    phaseSel.innerHTML = '';
    if (!arr.length) {
      phaseSel.disabled = true;
      phaseSel.innerHTML = '<option>-- 請先選大等級 --</option>';
    } else {
      ['前期','中期','後期'].forEach((lab,i) => {
        const opt = document.createElement('option');
        opt.value = arr[i];
        opt.textContent = `${lab} (${arr[i]})`;
        phaseSel.appendChild(opt);
      });
      phaseSel.disabled = false;
    }
  });

  calcBtn.addEventListener('click', () => {
    const major = majorSel.value;
    const cur   = +curInput.value;
    const spd   = +spdInput.value;
    const arr   = phaseData[major] || [];
    if (!major || isNaN(cur) || isNaN(spd) || !arr.length) {
      alert('請完整填寫大等級、細分期、修為及速度');
      return;
    }
    const needPhase = +phaseSel.value;

    // 1. 收結晶時間
    const capExp = needPhase * 0.4;
    const remCap = capExp - (cur % needPhase);
    const t1raw = new Date(Date.now() + (remCap / spd) * 1000);

    // 2. 本階段集滿時間
    let t2str, t2raw;
    if (cur >= needPhase) {
      t2str = '已集滿';
      t2raw = new Date();
    } else {
      t2raw = new Date(Date.now() + ((needPhase - cur) / spd) * 1000);
      t2str = t2raw.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    }

    // 3. 可打秘境時間
    const lateNeed = arr[2];
    const t3raw = cur >= lateNeed
      ? new Date()
      : new Date(Date.now() + ((lateNeed - cur) / spd) * 1000);
    const t3leg = getLegalSlot(t3raw);

    // 4. 下階段全階後期集滿時間 (從本階段集滿時間 t2raw 開始)
    const keys = Object.keys(phaseData);
    const idx  = keys.indexOf(major);
    const nextKey = keys[idx+1] || major;
    const nextArr = phaseData[nextKey] || [];
    const totalNext = nextArr[0] + nextArr[1] + nextArr[2];
    const over = Math.max(0, cur - arr[2]);
    const remNext = totalNext - over;
    const t4raw = new Date(t2raw.getTime() + (remNext / spd) * 1000);
    const t4leg = getLegalSlot(t4raw);

    // 5. 模擬本紀元可至等級
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate()+((6-now.getDay()+7)%7)); end.setHours(23,59,0,0);
    let reach = major;
    let leftSec = (end-now)/1000;
    for (let i=idx+1;i<keys.length;i++){
      const key = keys[i];
      const needAll = phaseData[key][0]+phaseData[key][1]+phaseData[key][2];
      const sec = needAll/phaseData[key][0];
      if(sec<=leftSec){ reach=key; leftSec-=sec; } else break;
    }

    const fmt = d=>d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    resDiv.innerText = [
      `1. ⏰ 收結晶時間：${fmt(t1raw)}`,
      `2. 📈 本階段集滿時間：${t2str}`,
      `3. ⚔️ 可打秘境時間：${fmt(t3leg)}`,
      `4. 🔮 集滿 ${nextKey} 全階後期: ${fmt(t4raw)}，挑戰時間: ${fmt(t4leg)}`,
      `5. ⚡ 模擬本紀元可至等級：${reach}`
    ].join('\n');
  });
});
