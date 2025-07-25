document.addEventListener('DOMContentLoaded', () => {
  const levelData = {
    '三等築基':[5400,13000,24150],'四等結罡':[25000,26000,44625],'五等元嬰':[48825,51240,54915],
    '六等出竅':[56490,59325,61950],'七等化神':[65415,68670,72135],'八等合體':[75705,79485,166950],
    '九等渴虛':[175350,183750,193200],'十等大乘':[202965,213150,223650],'十一等渡劫':[262500,283500,315000],
    '十二等人仙':[1050000,861000,903000],'十三等真仙':[924000,945000,950985],'十四等金仙':[968100,985530,1003275],
    '十五等上仙':[1020000,1039500,1058442],'十六等仙君':[1890000,1942500,2520000]
  };
  const majorOrder = ['三等築基','四等結罡','五等元嬰','六等出竅','七等化神','八等合體',
    '九等渴虛','十等大乘','十一等渡劫','十二等人仙','十三等真仙','十四等金仙','十五等上仙','十六等仙君'];
  function clampWindow(date) {
    const start=new Date(date); start.setHours(11,0,0,0);
    const end=new Date(start); end.setDate(start.getDate()+1); end.setHours(0,2,0,0);
    if(date<=start) return start;
    const next=new Date(date); next.setMinutes(0,0,0,0); next.setHours(next.getHours()+1);
    if(next<=end) return next;
    start.setDate(start.getDate()+1);
    return start;
  }
  function toLabel(d,now){
    const diff=Math.floor((d-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
    const t=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(diff===0) return t;
    if(diff===1) return '明天 '+t;
    return d.toLocaleDateString()+' '+t;
  }
  function getEpochEnd(now){
    const day=now.getDay(), dt=new Date(now);
    const diffSat=(6-day+7)%7; dt.setDate(now.getDate()+diffSat); dt.setHours(23,59,0,0);
    return dt;
  }
  document.getElementById('level-major').addEventListener('change',function(){
    const phase=document.getElementById('level-phase'); phase.innerHTML='<option value="">-- 請先選大等級 --</option>';
    const arr=levelData[this.value]||[];
    if(arr.length){
      ['前期','中期','後期'].forEach((lab,i)=>{
        const opt=document.createElement('option'); opt.value=arr[i]; opt.textContent=`${lab} (${arr[i]})`; phase.append(opt);
      });
      phase.disabled=false;
    } else phase.disabled=true;
  });
  document.getElementById('calc-manual').addEventListener('click',()=>{
    const major=document.getElementById('level-major').value;
    const cur=+document.getElementById('exp-current').value;
    const total=+document.getElementById('level-phase').value;
    const spd=+document.getElementById('exp-speed').value;
    if(!major||cur<0||!total||!spd){alert('請完整選擇並輸入');return;}
    const now=new Date();
    const crystalCap=total*0.4;
    const crystalDate=cur>=crystalCap?now:new Date(now.getTime()+crystalCap/spd*1000);
    const levelDate=cur>=total?now:new Date(now.getTime()+(total-cur)/spd*1000);
    const arr=levelData[major],pi=arr.indexOf(total);
    let sec3=0; for(let i=pi;i<arr.length;i++){sec3+=(i===pi?(arr[i]-cur):arr[i])/spd;}
    const fillDate=new Date(now.getTime()+sec3*1000);
    const realmDate=clampWindow(fillDate);
    const nextArr=levelData[majorOrder[majorOrder.indexOf(major)+1]];
    const sec4=nextArr.reduce((s,th)=>s+th/spd,0);
    const fillNext=new Date(realmDate.getTime()+sec4*1000);
    const realmNext=clampWindow(fillNext);
    const epochEnd=getEpochEnd(now);
    const reachable = realmDate<=epochEnd?majorOrder[majorOrder.indexOf(major)+1]+'後期':major+['前期','中期','後期'][pi];
    const lines=[
      `1. ⏰ 收結晶時間：${toLabel(crystalDate,now)}`,
      `2. 📈 本階段集滿時間：${toLabel(levelDate,now)}`,
      `3. ⚔️ 可打秘境時間：${toLabel(realmDate,now)}`,
      `4. 🔮 秘境打贏後，再集滿 ${majorOrder[majorOrder.indexOf(major)+1]} 全階後期，可於 ${toLabel(realmNext,now)} 挑戰`,
      `5. ⚡ 本紀元最高等級：${reachable}`
    ];
    document.getElementById('result').innerText=lines.join('\n');
  });
});
