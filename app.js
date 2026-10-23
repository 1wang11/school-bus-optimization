'use strict';
const data = window.PROJECT_DATA;
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent = value => Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + '%';
const icons = {
 bus:'<rect x="4" y="3" width="16" height="17" rx="4"/><path d="M4 11h16M9 3v8M15 3v8M7 20v2M17 20v2M8 15h1M15 15h1"/>',
 link:'<path d="m9 15 6-6m-7 3-2 2a4 4 0 0 0 6 6l3-3m1-5 2-2a4 4 0 0 0-6-6L9 7"/>',
 expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
 driver:'<circle cx="12" cy="6" r="3"/><path d="M6 15v-1a6 6 0 0 1 12 0v1M5 21v-3a7 7 0 0 1 14 0v3M8 18h8M12 18v3"/>',
 turn:'<path d="M18 21V8a6 6 0 0 0-12 0v8m-4-4 4 4 4-4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 interview:'<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 1-6a8 8 0 0 1 2-11 11 11 0 0 1 16 6Z"/><path d="M7 10h10M7 14h6"/>',
 survey:'<rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 11 1 1 2-2m2 1h3m-8 6 1 1 2-2m2 1h3"/>',
 timer:'<circle cx="12" cy="14" r="8"/><path d="M12 10v4l3 2M9 2h6M12 2v4M18 6l2-2"/>',
 ruler:'<path d="m3 16 13-13 5 5L8 21Zm5-5 2 2m2-6 2 2m2-6 2 2"/>',
 route:'<circle cx="5" cy="4" r="2"/><circle cx="19" cy="20" r="2"/><path d="M5 6v6a4 4 0 0 0 4 4h6a4 4 0 0 0 0-8h-4m8 10v-6"/>',
 location:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
 file:'<path d="M14 2H5v20h14V7Zm0 0v6h5M8 13h8M8 17h6"/>',
 play:'<path d="m9 5 11 7-11 7Z"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 replay:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 slides:'<rect x="2" y="3" width="20" height="14" rx="1"/><path d="M12 17v5M7 22l5-5 5 5M7 12l4-4 3 2 3-4"/>'
};
function renderIcons(root = document) {
 root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[el.dataset.icon] || icons.file}</svg>`; });
}
renderIcons();

// The chapters follow the original presentation sequence.
const chapterIds = ['background', 'methods', 'fieldwork', 'analysis', 'solutions', 'conclusions'];
const chapterNames = ['项目背景', '研究方法', '实地调研', '数据分析', '优化方案', '项目介绍'];
let currentChapter = 0;
let expanded = false;
function setChapter(index, {updateUrl = true, scroll = true} = {}) {
 if (index < 0 || index >= chapterIds.length) return;
 currentChapter = index;
 chapterIds.forEach((id, i) => { $(id).hidden = !expanded && i !== index; });
 window.ShuttleAnimations?.refresh();
 document.querySelectorAll('[data-chapter]').forEach(link => {
  if (link.dataset.chapter === chapterIds[index]) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
 });
 $('previous-chapter').disabled = index === 0;
 $('next-chapter').disabled = index === chapterIds.length - 1;
 $('next-chapter').innerHTML = index < chapterIds.length - 1 ? `下一页：${chapterNames[index + 1]} <span aria-hidden="true">→</span>` : '已到最后一页';
 $('chapter-progress').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
 $('chapter-name').textContent = chapterNames[index];
 if (updateUrl && location.hash !== '#' + chapterIds[index]) history.pushState(null, '', '#' + chapterIds[index]);
 if (scroll) {
  if (expanded) $(chapterIds[index]).scrollIntoView({behavior:'smooth', block:'start'});
  else window.scrollTo({top:0, behavior:'instant'});
 }
}
function restoreChapter() {
 const index = chapterIds.indexOf(location.hash.slice(1));
 setChapter(index < 0 ? 0 : index, {updateUrl:false, scroll:false});
}
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); setChapter(0); });
document.querySelectorAll('[data-chapter]').forEach(link => link.addEventListener('click', e => { e.preventDefault(); setChapter(chapterIds.indexOf(link.dataset.chapter)); }));
$('previous-chapter').addEventListener('click', () => setChapter(currentChapter - 1));
$('next-chapter').addEventListener('click', () => setChapter(currentChapter + 1));
$('display-toggle').addEventListener('click', () => {
 expanded = !expanded;
 document.body.classList.toggle('all-expanded', expanded);
 $('display-toggle').textContent = expanded ? '恢复分页浏览' : '展开全部页面';
 $('display-toggle').setAttribute('aria-pressed', String(expanded));
 setChapter(currentChapter, {updateUrl:false, scroll:false});
 if (!expanded) window.scrollTo({top:0, behavior:'instant'});
});
window.addEventListener('hashchange', restoreChapter);
restoreChapter();

// Retain the Chinese observation sheets exactly as embedded in the source files.
const stationTabs = $('station-tabs');
stationTabs.innerHTML = data.stations.map((station, index) => `<button type="button" role="tab" id="tab-${station.id}" aria-controls="station-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}" data-station="${index}">${esc(station.name)}</button>`).join('');
function setStation(index, focus = false) {
 if (index < 0 || index >= data.stations.length) return;
 const station = data.stations[index];
 stationTabs.querySelectorAll('[data-station]').forEach(button => {
  const selected = Number(button.dataset.station) === index;
  button.setAttribute('aria-selected', String(selected));
  button.tabIndex = selected ? 0 : -1;
  if (selected && focus) button.focus();
 });
 $('station-panel').setAttribute('aria-labelledby', `tab-${station.id}`);
 $('station-panel').innerHTML = `<h3>${esc(station.name)}</h3><p>${esc(station.caption)}</p>${station.images.map((file, i) => `<button type="button" class="record-image" data-image="assets/${file}" data-native="true" data-caption="${esc(station.name)}原始观测表${station.images.length > 1 ? ' · ' + (i === 0 ? '10月16日' : '10月17日') : ''}"><span>原始数据表 · 点击放大查看</span><img src="assets/${file}" alt="${esc(station.name)}原始观测表${station.images.length > 1 ? '，第'+(i+1)+'张' : ''}" loading="lazy"></button>`).join('')}`;
}
stationTabs.addEventListener('click', e => { const button = e.target.closest('[data-station]'); if (button) setStation(Number(button.dataset.station)); });
stationTabs.addEventListener('keydown', e => {
 if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
 const button = e.target.closest('[data-station]');
 if (!button) return;
 e.preventDefault();
 let index = Number(button.dataset.station);
 if (e.key === 'Home') index = 0;
 else if (e.key === 'End') index = data.stations.length - 1;
 else index = (index + (e.key === 'ArrowRight' ? 1 : -1) + data.stations.length) % data.stations.length;
 setStation(index, true);
});
setStation(0);

function surveyTable(rows, label) {
 return `<table><caption>${esc(label)}（101份有效答卷）</caption><thead><tr><th scope="col">选项</th><th scope="col">份数</th><th scope="col">比例</th></tr></thead><tbody>${rows.map(([name,count,rate]) => `<tr><th scope="row">${esc(name)}</th><td>${count}</td><td>${percent(rate)}</td></tr>`).join('')}</tbody></table>`;
}
function barRows(rows, {domain = 100, unit = 'rate', className = ''} = {}) {
 return `<div class="bar-chart ${className}">${rows.map(([label, count, rate], index) => {
  const width = (unit === 'rate' ? rate : count) / domain * 100;
  return `<div class="bar-row"><div class="bar-label"><span>${esc(label)}</span><strong>${unit === 'rate' ? percent(rate) : count + '份'}<small>${unit === 'rate' ? count + '份' : percent(rate)}</small></strong></div><div class="bar-track"><span style="width:${width}%;background:${index === 0 && unit === 'rate' ? '#4b5d7d' : '#92a7a3'}"></span></div></div>`;
 }).join('')}</div>`;
}
$('problems-chart').innerHTML = barRows(data.problems) + '<p class="axis-note">横轴比例范围0—100%。本题为多选，各项比例之和可超过100%。</p>';
$('problems-table').innerHTML = surveyTable(data.problems, '校车运营问题');
const colors = ['#4b5d7d','#93aba3','#e9ce76','#bd8a6e'];
const radius = 74;
const perimeter = 2 * Math.PI * radius;
let offset = 0;
const slices = data.wait.map((row, index) => {
 const length = row[2] / 100 * perimeter;
 const circle = `<circle cx="150" cy="120" r="${radius}" fill="none" stroke="${colors[index]}" stroke-width="24" stroke-dasharray="${length} ${perimeter - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 150 120)"/>`;
 offset += length;
 return circle;
}).join('');
$('wait-chart').innerHTML = `<div class="donut-wrap"><svg viewBox="0 0 300 240" role="img" aria-label="合理等候时间问卷结果，3至5分钟占57.43%，0至3分钟占18.81%，5至10分钟占19.8%，10至20分钟占3.96%"><circle cx="150" cy="120" r="74" fill="none" stroke="#eef4f8" stroke-width="24"/>${slices}<text x="150" y="116" text-anchor="middle" fill="#348799" font-size="31" font-weight="600">57.43%</text><text x="150" y="141" text-anchor="middle" fill="#98a9b4" font-size="12">选择3—5分钟</text></svg><div class="donut-legend">${data.wait.map((row, i) => `<div><i style="background:${colors[i]}"></i><span>${esc(row[0])}</span><strong>${percent(row[2])}</strong></div>`).join('')}</div></div>`;
$('wait-table').innerHTML = surveyTable(data.wait, '合理等候时间');
$('destinations-chart').innerHTML = barRows(data.destinations, {domain:40, unit:'count', className:'destination-bars'}) + '<p class="axis-note">横轴：选择该目的站的答卷数，范围0—40份。</p>';
$('destinations-table').innerHTML = surveyTable(data.destinations, '下车站点');
$('spacing-chart').innerHTML = `<div class="spacing-bars">${data.spacing.map(([label, value]) => `<div class="bar-row"><div class="bar-label"><span>${esc(label)}</span><strong>${value}<small>米</small></strong></div><div class="bar-track"><span style="width:${value / 750 * 100}%;background:${value < 300 ? '#c88d58' : '#92a7a3'}"></span><i class="benchmark" style="left:${650 / 750 * 100}%" aria-hidden="true"></i></div></div>`).join('')}</div><p class="axis-note">横轴范围0—750米。每行虚线对应合理站距约650米。</p>`;
$('spacing-table').innerHTML = `<table><caption>原始线路相邻站距</caption><thead><tr><th scope="col">相邻站点</th><th scope="col">实测距离（米）</th></tr></thead><tbody>${data.spacing.map(([label,value]) => `<tr><th scope="row">${esc(label)}</th><td>${value}</td></tr>`).join('')}</tbody></table>`;
function routeTable(rows) {
 return `<table><thead><tr><th scope="col">起点</th><th scope="col">终点</th><th scope="col">站距（米）</th></tr></thead><tbody>${rows.map(([from,to,distance]) => `<tr><td>${esc(from)}</td><td>${esc(to)}</td><td>${distance}</td></tr>`).join('')}</tbody></table>`;
}
function routeStops(rows, turn) {
 const stops = [rows[0][0], ...rows.map(row => row[1])];
 return stops.map((name, i) => `${i ? '<span class="route-arrow" aria-hidden="true">→</span>' : ''}<span class="stop">${esc(name)}${name === turn ? '（掉头）' : ''}</span>`).join('');
}
$('motion-table').innerHTML = `<table><thead><tr><th scope="col">动作分析</th><th scope="col">优化前</th><th scope="col">优化后</th></tr></thead><tbody>${data.motion.slice(0,4).map(([name,before,after]) => `<tr><th scope="row">${name}</th><td>${before}</td><td>${after}</td></tr>`).join('')}</tbody></table>`;

// Image viewer: original-size mode lets small source sheets remain readable.
const dialog = $('image-dialog');
let reportInDialog = false;
let focusedBeforeDialog = null;
let originalOverflow = '';
function setNativeZoom(enabled) {
 $('dialog-image-wrap').classList.toggle('native-size', enabled);
 $('dialog-zoom').textContent = enabled ? '适应屏幕' : '按原图查看';
 $('dialog-zoom').setAttribute('aria-pressed', String(enabled));
}
function openDialog(src, caption, {native = false, report = false} = {}) {
 focusedBeforeDialog = document.activeElement;
 originalOverflow = document.body.style.overflow;
 reportInDialog = report;
 $('dialog-image').src = src;
 $('dialog-image').alt = caption;
 $('dialog-caption').textContent = caption;
 $('dialog-pagination').hidden = !report;
 setNativeZoom(native);
 dialog.showModal();
 document.body.style.overflow = 'hidden';
 $('close-dialog').focus();
 if (report) updateDialogReport();
}
document.addEventListener('click', e => {
 const trigger = e.target.closest('[data-image]');
 if (trigger && !dialog.open) openDialog(trigger.dataset.image, trigger.dataset.caption || '项目图片', {native: trigger.dataset.native === 'true'});
});
$('dialog-zoom').addEventListener('click', () => setNativeZoom(!$('dialog-image-wrap').classList.contains('native-size')));
$('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
 document.body.style.overflow = originalOverflow;
 if (focusedBeforeDialog && typeof focusedBeforeDialog.focus === 'function') focusedBeforeDialog.focus();
});

const reportTitles = ['项目封面','项目目录','项目背景','项目方法','路线优化方案','掉头动作与站距结论','项目结语'];
let reportPage = 0;
function reportPath(index) { return `assets/report-${String(index + 1).padStart(2, '0')}.webp`; }
function updateDialogReport() {
 $('dialog-image').src = reportPath(reportPage);
 $('dialog-image').alt = `中文项目介绍，第${reportPage + 1}页：${reportTitles[reportPage]}`;
 $('dialog-caption').textContent = `${reportTitles[reportPage]} · 中文项目介绍`;
 $('dialog-page-status').textContent = `${reportPage + 1} / 7`;
 $('dialog-prev').disabled = reportPage === 0;
 $('dialog-next').disabled = reportPage === 6;
}
function setReportPage(index) {
 if (index < 0 || index > 6) return;
 reportPage = index;
 $('report-image').src = reportPath(index);
 $('report-image').alt = `中文项目介绍，第${index + 1}页：${reportTitles[index]}`;
 $('page-title').textContent = reportTitles[index];
 $('page-status').querySelector('strong').textContent = String(index + 1).padStart(2,'0');
 $('prev-page').disabled = index === 0;
 $('next-page').disabled = index === 6;
 document.querySelectorAll('[data-report-page]').forEach(button => {
  if (Number(button.dataset.reportPage) === index) button.setAttribute('aria-current','page');
  else button.removeAttribute('aria-current');
 });
 if (dialog.open && reportInDialog) updateDialogReport();
}
$('prev-page').addEventListener('click', () => setReportPage(reportPage - 1));
$('next-page').addEventListener('click', () => setReportPage(reportPage + 1));
$('dialog-prev').addEventListener('click', () => setReportPage(reportPage - 1));
$('dialog-next').addEventListener('click', () => setReportPage(reportPage + 1));
document.querySelectorAll('[data-report-page]').forEach(button => button.addEventListener('click', () => setReportPage(Number(button.dataset.reportPage))));
function openReport() { if (!dialog.open) openDialog(reportPath(reportPage), reportTitles[reportPage], {report:true}); }
$('expand-report').addEventListener('click', openReport);
$('report-stage').addEventListener('click', openReport);
dialog.addEventListener('keydown', e => {
 if (reportInDialog && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); setReportPage(reportPage + (e.key === 'ArrowRight' ? 1 : -1)); }
});
setReportPage(0);

let toastTimer;
function notify(message) {
 clearTimeout(toastTimer);
 $('toast').textContent = message;
 $('toast').hidden = false;
 toastTimer = setTimeout(() => { $('toast').hidden = true; },3500);
}
$('copy-link').addEventListener('click', async () => {
 const url = new URL('https://yanshan-shuttle-study.peachy-gnome-3006.chatgpt.site'); url.search = ''; url.hash = chapterIds[currentChapter];
 try {
  if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(url.href); notify('已复制当前项目页链接');
 } catch {
  const field = document.createElement('textarea'); field.value = url.href; field.setAttribute('readonly',''); field.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(field); field.select();
  let copied = false; try { copied = document.execCommand('copy'); } catch { /* Address bar remains available. */ }
  field.remove(); $('copy-link').focus(); notify(copied ? '已复制当前项目页链接' : '请从地址栏复制网页链接');
 }
});
