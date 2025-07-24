
const levelData = {
  '三等築基':[5400,13000,24150],'四等結罡':[25000,26000,44625],'五等元嬰':[48825,51240,54915],
  '六等出竅':[56490,59325,61950],'七等化神':[65415,68670,72135],'八等合體':[75705,79485,166950],
  '九等渴虛':[175350,183750,193200],'十等大乘':[202965,213150,223650],'十一等渡劫':[262500,283500,315000],
  '十二等人仙':[861000,903000,1050000],'十三等真仙':[924000,945000,950985],'十四等金仙':[968100,985530,1003275],
  '十五等上仙':[1020000,1039500,1058442],'十六等仙君':[1890000,1942500,2520000]
};
const majorOrder=['三等築基','四等結罡','五等元嬰','六等出竅','七等化神','八等合體','九等渴虛','十等大乘',
  '十一等渡劫','十二等人仙','十三等真仙','十四等金仙','十五等上仙','十六等仙君'];

const majorSel=document.getElementById('level-major'),
      phaseSel=document.getElementById('level-phase'),
      currInput=document.getElementById('exp-current'),
      spdInput=document.getElementById('exp-speed'),
      btnCalc=document.getElementById('calc-manual'),
      upload=document.getElementById('upload'),
      resBox=document.getElementById('result'),
      btnIcs=document.getElementById('download-ics');

let lastInfo;

// populate phase
majorSel.addEventListener('change', ()=>{
  phaseSel.innerHTML='<option value="">-- 請先選大等級 --</option>';
  const arr=levelData[majorSel.value];
  if(arr){
    ['前期','中期','後期'].forEach((lab,i)=>{
      const opt=document.createElement('option');
      opt.value=arr[i]; opt.textContent=`${lab} (${arr[i]})`;
      phaseSel.append(opt);
    });
    phaseSel.disabled=false;
  }
});

function estimateTimes(cur,total,spd){
  const now=new Date();
  const crystalSec=total*0.4/spd;
  const levelSec=(total-cur)/spd;
  const fmt=secs=>new Date(now.getTime()+secs*1000)
    .toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const levelDate=new Date(now.getTime()+levelSec*1000);
  // realm at next hour
  let realm=new Date(levelDate);
  realm.setHours(levelDate.getHours()+1,0,0,0);
  // restrict 11:00~00:02
  const start=new Date(levelDate); start.setHours(11,0,0,0);
  let end=new Date(start); end.setDate(start.getDate()+1); end.setHours(0,2,0,0);
  if(realm<start) realm=start; if(realm>end) realm=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1,11,0,0);
  return {crystalSec,levelSec,crystalTime:fmt(crystalSec),levelTime:fmt(levelSec),levelDate,realmDate:realm};
}

btnCalc.addEventListener('click',()=>{
  const cur=+currInput.value, total=+phaseSel.value, spd=+spdInput.value;
  if(!cur||!total||!spd) return alert('請完整選擇並輸入！');
  // base estimates
  const info=estimateTimes(cur,total,spd); lastInfo=info;
  const now=new Date();
  // format levelTime
  let lvlText=info.levelTime;
  if(info.levelDate<now){
    const today0=new Date(now); today0.setHours(0,0,0,0);
    const yesterday0=new Date(today0); yesterday0.setDate(today0.getDate()-1);
    if(info.levelDate>=yesterday0&&info.levelDate<today0){
      lvlText='昨天 '+info.levelDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    } else {
      lvlText='<span class="red">'+info.levelTime+'（已滿）</span>';
    }
  }
  // line1-3
  let output=`1. ⏰ 收結晶時間：${info.crystalTime}\n2. 📈 本階級修為集滿時間：${lvlText}\n3. ⚔️ 可打秘境時間：${info.realmDate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  // compute next threshold for direct ascend
  const arr=levelData[majorSel.value], idx=arr.indexOf(total);
  let nextThreshold=null, nextLabel=null;
  if(idx<2){
    nextThreshold=arr[idx+1];
    nextLabel=['前期','中期','後期'][idx+1]+'('+nextThreshold+')';
  } else {
    const mi=majorOrder.indexOf(majorSel.value);
    const nm=majorOrder[mi+1];
    if(nm){
      nextThreshold=levelData[nm][0];
      nextLabel=nm+'·前期('+nextThreshold+')';
    }
  }
  if(nextThreshold){
    // estimate to nextThreshold
    const nextInfo=estimateTimes(cur,nextThreshold,spd);
    // compute next realm after filling next threshold
    let nr=nextInfo.realmDate;
    // restrict window
    const start=new Date(nextInfo.levelDate); start.setHours(11,0,0,0);
    let end=new Date(start); end.setDate(start.getDate()+1); end.setHours(0,2,0,0);
    if(nr<start) nr=start; if(nr>end) nr=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1,11,0,0);
    const nrTime=nr.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    output+=`\n4. 🔮 秘境打贏後可打下一次秘境時間：${nrTime}`;
  }
  resBox.innerHTML=output;
  btnIcs.style.display='inline-block';
});

// OCR and ICS code omitted
