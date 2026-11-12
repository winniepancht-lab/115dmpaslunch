// 替換為您的 Google 試算表 CSV 網址
const DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vREskMp4E7maOMthtokLEWGgeRBNBKxl3djFSIxeYCfccmBiaC0iWup2HUvfNz40DYQkATEd8_nOlmo/pub?output=csv';  

let DATA = { semesters: [ { id: "current", name: "最新試菜紀錄 (自動更新)", months: [], days: [], qa: [] } ] };
const wk = ["日","一","二","三","四","五","六"];
const E = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const lab = d => {
    const parts = String(d).split("-");
    if(parts.length !== 3) return d;
    const [y, m, x] = parts;
    return `${+m}/${+x}（${wk[new Date(y, m-1, x).getDay()]}）`;
};
const idOf = d => "d-" + String(d).slice(5).replace("-","");
let si = 0, mo = null;
const S = () => DATA.semesters[si];
const mDays = m => S().days.filter(x => x.d.slice(5,7) == m);
const mQa = m => S().qa.filter(x => x.m == m);
const has = m => mDays(m).length || mQa(m).length;

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

function fetchData() {
    Papa.parse(DATA_URL, {
        download: true,
        header: true,
        complete: function(results) {
            processCSVData(results.data);
            init();
        },
        error: function(err) {
            console.error('讀取資料失敗:', err);
            document.getElementById('view').innerHTML = '<div class="empty">資料載入失敗，請確認 Google 試算表網址是否正確。</div>';
        }
    });
}

function getAnonymousGrade(classStr) {
    if (!classStr) return '家長代表';
    classStr = classStr.toString().trim();
    const gradeMap = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六' };
    const gradeNum = classStr.charAt(0);
    return gradeMap[gradeNum] ? gradeMap[gradeNum] + '年級代表' : '家長代表';
}

function processCSVData(csvRows) {
    const validRows = csvRows.filter(row => row['日期'] && row['日期'].trim() !== '');
    validRows.sort((a, b) => new Date(a['日期']) - new Date(b['日期']));

    const monthSet = new Set();
    const daysMap = {};
    
    validRows.forEach(row => {
        const date = row['日期'].trim();
        const m = date.split('-')[1];
        if(m) monthSet.add(m);
        
        if(!daysMap[date]) {
            daysMap[date] = { d: date, reps: [], ph: [], n: [] };
        }
        
        if(row['照片連結'] && row['照片連結'].trim() !== '') {
            const urls = row['照片連結'].split(',').map(s=>s.trim()).filter(s=>s!=='');
            daysMap[date].ph.push(...urls);
        }
        
        if(row['營養師回應'] && row['營養師回應'].trim() !== '') {
            daysMap[date].n.push({ t: '校方/營養師回應', x: row['營養師回應'] });
        }
        
        const menu = row['午餐菜色'] ? row['午餐菜色'].trim() : '';
        const fb = row['家代意見反饋'] ? row['家代意見反饋'].trim() : '';
        
        let fbLines = [];
        if(menu) fbLines.push(`【今日菜單】${menu}`);
        if(fb) fbLines.push(...fb.split('\n'));
        
        daysMap[date].reps.push({ c: getAnonymousGrade(row['班級']), l: fbLines });
    });
    
    const currentSemester = DATA.semesters[0];
    currentSemester.months = Array.from(monthSet).sort((a, b) => Number(a) - Number(b));
    currentSemester.days = Object.values(daysMap);
    currentSemester.days.sort((a, b) => new Date(a.d) - new Date(b.d)); 
    currentSemester.qa = []; 
}

function pick(){
    const h=(location.hash||"").slice(1);
    let m=null;
    if(/^m-\d\d$/.test(h)) m=h.slice(2); 
    else if(/^d-\d{4}$/.test(h)) m=h.slice(2,4);
    
    if(!m || !S().months.includes(m)){
        const ms=S().months.filter(has);
        m = ms.length ? ms[ms.length-1] : (S().months[0] || null);
    }
    mo = m; 
    return h;
}

function render(){
    const s = S();
    if(!s.months.length) {
        document.getElementById("semsum").textContent = `無資料`;
        document.getElementById("view").innerHTML = `<div class="empty">試算表中尚無資料</div>`;
        return;
    }

    document.getElementById("semsum").textContent=`共 ${s.days.length} 天試菜紀錄、${s.days.reduce((a,x)=>a+x.reps.length,0)} 份代表回報`;
    document.getElementById("tabs").innerHTML=s.months.map(m=>`<button data-m="${m}" class="${m==mo?"on":""} ${has(m)?"":"em"}">${+m}月</button>`).join("");
    
    const D = mDays(mo), Q = mQa(mo);
    let h = "";
    
    if(!D.length && !Q.length) {
        h=`<div class="empty">${+mo}月尚無紀錄</div>`;
    } else {
        h+=`<div class="st"><div><b>${D.length}</b>試菜天數</div><div><b>${D.reduce((a,x)=>a+x.reps.length,0)}</b>代表回報</div><div><b>${Q.length}</b>反映與回覆</div></div>`;
        
        if(D.length) {
            h+=`<h2>${+mo}月日曆</h2><div class="cal">` + D.map(x=>{
                const t=[`<span class="tag">${x.reps.length}位回報</span>`];
                if(x.ph.length) t.push('<span class="tag">有照片</span>');
                if(x.n.some(n=>n.t.includes("回應"))) t.push('<span class="tag">已回覆</span>');
                return `<a href="#${idOf(x.d)}"><b>${lab(x.d)}</b>${t.join("")}</a>`;
            }).join("") + `</div>`;
        }
        
        if(D.length) {
            h+=`<h2>每日試菜紀錄</h2>` + [...D].reverse().map(x=>`<section class="day" id="${idOf(x.d)}"><h3>${lab(x.d)}</h3>
            ${x.ph.length ? `<div class="ph">${x.ph.map(p=>`<img src="${p}" alt="試菜餐點照片" loading="lazy">`).join("")}</div>` : ""}
            ${x.reps.map(r=>`<div class="rep"><strong>${E(r.c.endsWith("代表")?r.c:r.c+"代表")}</strong><ul>${r.l.map(l=>`<li>${E(l)}</li>`).join("")}</ul></div>`).join("")}
            ${x.n.map(n=>`<div class="n ok"><b>${E(n.t)}</b>　${E(n.x)}</div>`).join("")}</section>`).join("");
        }
    }
    document.getElementById("view").innerHTML = h;
}

function init(){
    document.getElementById("sem").innerHTML = DATA.semesters.map((s,i)=>`<option value="${i}">${E(s.name)}</option>`).join("");
    document.getElementById("sem").onchange = e => {
        si = +e.target.value;
        location.hash = "";
        pick();
        render();
    };
    document.getElementById("tabs").onclick = e => {
        const b = e.target.closest("button");
        if(b) location.hash = "m-" + b.dataset.m;
    };
    
    function route(){
        const h = pick();
        render();
        if(/^d-/.test(h)){
            const el = document.getElementById(h);
            if(el) el.scrollIntoView();
        }
    }
    
    window.removeEventListener("hashchange", route);
    window.addEventListener("hashchange", route);
    route();
}
