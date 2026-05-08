(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=e(o);fetch(o.href,i)}})();const S={de:{"page.title":"Fehler gefunden? Feedback?","page.subtitle":"Melde einen Fehler oder schlage ein Feature vor.","page.context":"{{brand}} ist ein Projekt auf der {{platform}}-Plattform. Dein Feedback wird als Issue im öffentlichen {{platform}}-Repository erfasst.","category.label":"Kategorie","category.bug":"Fehler","category.feature":"Feature","category.other":"Sonstiges","title.label":"Titel","title.hint":"(kurz)","title.placeholder.bug":"z.B. Station-QR funktioniert nicht","title.placeholder.feature":"z.B. Export der Antworten","title.placeholder.other":"z.B. Frage zum Projekt","description.label":"Beschreibung","description.hint":"(Details)","description.placeholder.bug":"Was ist passiert? Was hättest du erwartet?","description.placeholder.feature":"Was wäre hilfreich und warum?","description.placeholder.other":"Was möchtest du wissen?","steps.label":"Schritte","steps.hint":"(optional)","steps.placeholder":"Wie kann man es reproduzieren?",submit:"Absenden","debug.summary":"Technische Details (für Support)","error.required":"Bitte fülle Titel und Beschreibung aus.","error.generic":"Leider ist etwas schiefgelaufen. Bitte versuche es erneut.","footer.for":"für","footer.license":"Lizenziert unter","footer.issues":"Alle Meldungen","success.title":"Danke!","success.body":"Deine Meldung wurde gesendet.","success.again":"Noch eine Meldung senden"},en:{"page.title":"Found a bug? Have some feedback?","page.subtitle":"Report a bug or propose a feature.","page.context":"{{brand}} is a project built on the {{platform}} platform. Your feedback is tracked as an issue in the public {{platform}} repository.","category.label":"Category","category.bug":"Bug","category.feature":"Feature","category.other":"Other","title.label":"Title","title.hint":"(short)","title.placeholder.bug":"e.g. station QR not working","title.placeholder.feature":"e.g. export answers","title.placeholder.other":"e.g. question about the project","description.label":"Description","description.hint":"(details)","description.placeholder.bug":"What happened? What did you expect?","description.placeholder.feature":"What would help and why?","description.placeholder.other":"What do you want to know?","steps.label":"Steps","steps.hint":"(optional)","steps.placeholder":"How can we reproduce it?",submit:"Submit","debug.summary":"Technical details (for support)","error.required":"Please fill in title and description.","error.generic":"Something went wrong. Please try again.","footer.for":"for","footer.license":"Licensed under","footer.issues":"View all issues","success.title":"Thanks!","success.body":"Your report was sent.","success.again":"Send another report"}};function P({initialLang:t}){const r=["de","en"];let e=r.includes(t)?t:"en";const n=new Set;return{t:(a,c=null)=>{const u=S[e]?.[a]??S.en?.[a]??a;return c?Object.entries(c).reduce((h,[d,p])=>h.replaceAll(`{{${d}}}`,String(p)),String(u)):u},getLang:()=>e,setLang:a=>{r.includes(a)&&(e=a,n.forEach(c=>c(e)))},onLangChange:a=>(n.add(a),()=>n.delete(a)),getSupportedLanguages:()=>r.slice()}}function T(t){return t.includes("Firefox/")?"Firefox "+t.split("Firefox/")[1].split(" ")[0]:t.includes("Edg/")?"Edge "+t.split("Edg/")[1].split(" ")[0]:t.includes("Chrome/")?"Chrome "+t.split("Chrome/")[1].split(" ")[0]:t.includes("Safari/")&&t.includes("Version/")?"Safari "+t.split("Version/")[1].split(" ")[0]:"Unknown"}function H(t){return t.includes("Windows NT")?"Windows":t.includes("Mac OS X")?"macOS":t.includes("Android")?"Android":t.includes("iPhone")||t.includes("iPad")?"iOS":t.includes("Linux")?"Linux":"Unknown"}function L({source:t,language:r}){const e=navigator.userAgent,n="v1.0.0-beta.14-5-gd9057ff",o="wohlopti",i=Number(navigator.maxTouchPoints||0),a=i>0||typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches===!0,c=typeof window<"u"?window.matchMedia?.("(pointer: coarse)"):null,u=typeof window<"u"?window.matchMedia?.("(hover: hover)"):null;return{page:"feedback",sourceApp:t,version:n,brand:o,source:t,browser:T(e),os:H(e),touch:a?"yes":"no",maxTouchPoints:String(i),pointerCoarse:c?.matches===!0?"yes":"no",hover:u?.matches===!0?"yes":"no",devicePixelRatio:String(window.devicePixelRatio||1),screen:`${screen.width}×${screen.height}`,viewport:`${window.innerWidth}×${window.innerHeight}`,language:r,referrer:document.referrer||"(none)",timestamp:new Date().toISOString(),userAgent:e}}function F({apiBase:t}){return{async submitIssue(r){const e=await fetch(`${t}/issues.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)}),n=await e.json().catch(()=>({}));if(!e.ok||!n?.success){const o=n?.error||n?.message||"Request failed";throw new Error(o)}return n}}}function s(t){const r=document.createElement("div");return r.textContent=String(t??""),r.innerHTML}const v={displayName:"wohlOpti",wordmarkHtml:"<em>wohl</em><strong>Opti</strong>"},y="lbatschelet/wellspace",O=`https://github.com/${y}/issues`,A=`https://github.com/${y}/blob/main/LICENSE`,E=`https://github.com/${y}/releases`,C=`https://github.com/${y}`;function R(t,{debugInfo:r,t:e,languages:n,currentLang:o,onLangChange:i,onSubmit:a}){const c=new Date().getFullYear(),u=s(v.displayName),h=v.wordmarkHtml,d=v.wordmarkHtml,p=`<a href="${C}" target="_blank" rel="noopener"><em>well</em><strong>Space</strong></a>`,m=e("page.context",{brand:d,platform:p}),l="v1.0.0-beta.14-5-gd9057ff",f=/^v[0-9]/.test(l)&&!/-g[0-9a-f]{7,}$/i.test(l)&&!/dirty/i.test(l)?`${E}#${encodeURIComponent(l)}`:E;t.innerHTML=`
    <nav class="issue-nav">
      <a href="/" class="issue-logo" title="${u}">${h}</a>
      <span class="lang-toggle" id="langToggle">${o.toUpperCase()}</span>
    </nav>

    <header class="issue-header">
      <h1>${e("page.title")}</h1>
      <p>${e("page.subtitle")}</p>
      <p class="issue-context">${m}</p>
    </header>

    <div class="issue-card">
      <form class="issue-form" id="issueForm" novalidate>

        <div class="form-group">
          <label for="category">${s(e("category.label"))}</label>
          <select id="category" name="category" required>
            <option value="bug">${s(e("category.bug"))}</option>
            <option value="feature">${s(e("category.feature"))}</option>
            <option value="other">${s(e("category.other"))}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="title">${s(e("title.label"))} <span class="hint">${s(e("title.hint"))}</span></label>
          <input type="text" id="title" name="title" placeholder="${s(e("title.placeholder.bug"))}" required />
        </div>

        <div class="form-group">
          <label for="description">${s(e("description.label"))} <span class="hint">${s(e("description.hint"))}</span></label>
          <textarea id="description" name="description" rows="5" placeholder="${s(e("description.placeholder.bug"))}" required></textarea>
        </div>

        <div class="form-group" id="stepsGroup">
          <label for="steps">${s(e("steps.label"))} <span class="hint">${s(e("steps.hint"))}</span></label>
          <textarea id="steps" name="steps" rows="3" placeholder="${s(e("steps.placeholder"))}"></textarea>
        </div>

        <div class="form-group form-confirm">
          <label for="website">Please leave this field empty</label>
          <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
        </div>

        <details class="debug-details">
          <summary>${s(e("debug.summary"))}</summary>
          <table class="debug-table">
            <tbody>
              ${Object.entries(r).map(([b,w])=>`<tr><td>${s(b)}</td><td>${s(String(w))}</td></tr>`).join("")}
            </tbody>
          </table>
        </details>

        <div id="formError" class="issue-error" style="display:none"></div>

        <button type="submit" class="submit-btn" id="submitBtn">
          <svg class="send-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          ${s(e("submit"))}
        </button>
      </form>
    </div>

    <footer class="app-footer">
      <div class="footer-left">
        <span class="footer-credit">
          &copy; ${c}
          <a href="https://lukasbatschelet.ch" target="_blank" rel="noopener">Lukas Batschelet</a>
          ${s(e("footer.for"))}
          <a href="https://www.phbern.ch" target="_blank" rel="noopener" class="footer-phbern" title="PHBern"><strong>PH</strong>&thinsp;Bern</a>
        </span>
        <span class="footer-license">
          ${s(e("footer.license"))} <a href="${A}" target="_blank" rel="noopener">AGPL-3.0</a>
        </span>
      </div>
      <div class="footer-right">
        <a class="footer-bug" href="${O}" target="_blank" rel="noopener" title="${s(e("footer.issues"))}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          ${s(e("footer.issues"))}
        </a>
        <a class="footer-version" href="${f}" target="_blank" rel="noopener">
          ${s(l)}
        </a>
      </div>
    </footer>
  `,_({t:e,languages:n,currentLang:o,onLangChange:i,onSubmit:a})}function _({t,languages:r,currentLang:e,onLangChange:n,onSubmit:o}){const i=document.getElementById("category"),a=document.getElementById("stepsGroup"),c=document.getElementById("title"),u=document.getElementById("description");function h(){const l=i.value;c.placeholder=t(`title.placeholder.${l}`),u.placeholder=t(`description.placeholder.${l}`),a.style.display=l==="bug"?"":"none"}i.addEventListener("change",h),h(),document.getElementById("langToggle").addEventListener("click",()=>{const l=r.find(f=>f!==e)||r[0];n(l)});const d=document.getElementById("issueForm"),p=document.getElementById("submitBtn"),m=document.getElementById("formError");d.addEventListener("submit",async l=>{l.preventDefault(),m.style.display="none";const f=d.title.value.trim(),b=d.description.value.trim();if(!f||!b){x(m,t("error.required"));return}const w={category:d.category.value,title:f,description:b,steps:d.steps?.value.trim()||"",website:d.website.value};p.disabled=!0,p.classList.add("loading");try{await o(w)}catch(I){x(m,I.message||t("error.generic")),p.disabled=!1,p.classList.remove("loading")}})}function x(t,r){t.textContent=r,t.style.display=""}function U(t,{t:r,onSubmitAnother:e}){t.innerHTML=`
    <div class="issue-success">
      <div class="success-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2>${r("success.title")}</h2>
      <p>${r("success.body")}</p>
      <a href="#" id="submitAnother">${r("success.again")}</a>
    </div>
  `,t.querySelector("#submitAnother")?.addEventListener("click",n=>{n.preventDefault(),e()})}const M="/api",k=new URLSearchParams(window.location.search),q=k.get("source")||"direct",D=k.get("lang")||navigator.language?.slice(0,2)||"en",g=P({initialLang:D}),W=F({apiBase:M}),B=document.querySelector("#app");g.onLangChange(()=>$());$();function $(){const t={source:q,language:g.getLang()},r=L(t);R(B,{debugInfo:r,t:g.t,languages:g.getSupportedLanguages(),currentLang:g.getLang(),onLangChange:e=>g.setLang(e),onSubmit:async e=>{const n={...e,debug:L(t)};await W.submitIssue(n);const o=B.querySelector(".issue-card");U(o,{t:g.t,onSubmitAnother:$})}})}
