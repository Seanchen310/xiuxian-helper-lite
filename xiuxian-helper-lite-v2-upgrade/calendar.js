
document.getElementById("add-google").addEventListener("click", () => {
  alert("⚠️ Google Calendar 實際整合需設定 OAuth 憑證，請自行部署至 Firebase 或 Vercel 伺服器。此為示意按鈕。");
});
document.getElementById("download-ics").addEventListener("click", () => {
  const content = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:收結晶（修為滿40%）
DTSTART;TZID=Asia/Taipei:20250724T105000
END:VEVENT
BEGIN:VEVENT
SUMMARY:準備升級！（滿修為 + 打贏論道）
DTSTART;TZID=Asia/Taipei:20250724T120000
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([content], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'xiuxian-helper.ics';
  a.click();
});
