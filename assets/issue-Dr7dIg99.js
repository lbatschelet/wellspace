import{b as v}from"./config-D5aLXqMH.js";const $={de:{"page.title":"Fehler gefunden? Idee gehabt?","page.subtitle":"Hilf uns, <em>feel</em><strong>vonRoll</strong> zu verbessern.","category.label":"Kategorie","category.bug":"Fehlermeldung","category.feature":"Idee / Wunsch","category.other":"Sonstiges","title.label":"Titel","title.hint":"(erforderlich)","title.placeholder.bug":"Was ist passiert?","title.placeholder.feature":"Was wünschst du dir?","title.placeholder.other":"Worum geht es?","description.label":"Beschreibung","description.hint":"(erforderlich)","description.placeholder.bug":"Beschreibe so genau wie möglich, was passiert ist. Was hast du erwartet? Was ist stattdessen passiert? Wann und wo ist der Fehler aufgetreten?","description.placeholder.feature":"Beschreibe deine Idee. Was soll möglich sein und warum wäre das hilfreich?","description.placeholder.other":"Beschreibe dein Anliegen…","steps.label":"Schritte zum Reproduzieren","steps.hint":"(optional)","steps.placeholder":`1. Gehe zu…
2. Klicke auf…
3. Fehler erscheint`,"email.label":"E-Mail","email.hint":"(optional, für Rückfragen)","email.placeholder":"deine@email.ch","debug.summary":"Debug-Informationen (werden automatisch gesendet)",submit:"Absenden","error.required":"Bitte Titel und Beschreibung ausfüllen.","error.generic":"Etwas ist schiefgelaufen. Bitte versuche es erneut.","success.title":"Vielen Dank!","success.message":"Deine Meldung wurde erfolgreich übermittelt.","success.another":"Weitere Meldung senden","footer.for":"für","footer.license":"Lizenziert unter","footer.issues":"Alle Meldungen"},en:{"page.title":"Found a bug? Have an idea?","page.subtitle":"Help us improve <em>feel</em><strong>vonRoll</strong>.","category.label":"Category","category.bug":"Bug Report","category.feature":"Feature Request","category.other":"Other","title.label":"Title","title.hint":"(required)","title.placeholder.bug":"What happened?","title.placeholder.feature":"What would you like to see?","title.placeholder.other":"What is this about?","description.label":"Description","description.hint":"(required)","description.placeholder.bug":"Describe as precisely as possible what happened. What did you expect? What happened instead? When and where did the error occur?","description.placeholder.feature":"Describe your idea. What should be possible and why would it be helpful?","description.placeholder.other":"Describe your request…","steps.label":"Steps to Reproduce","steps.hint":"(optional)","steps.placeholder":`1. Go to…
2. Click on…
3. Error appears`,"email.label":"Email","email.hint":"(optional, for follow-up)","email.placeholder":"your@email.com","debug.summary":"Debug information (sent automatically)",submit:"Submit","error.required":"Please fill in the title and description.","error.generic":"Something went wrong. Please try again.","success.title":"Thank you!","success.message":"Your submission has been received.","success.another":"Submit another","footer.for":"for","footer.license":"Licensed under","footer.issues":"View all issues"}},b=["de","en"],E="en";function T({initialLang:e}){let s=b.includes(e)?e:E,t=[];function n(i){return $[s]?.[i]??$[E]?.[i]??i}function o(){return s}function d(i){!b.includes(i)||i===s||(s=i,t.forEach(u=>u(s)))}function g(i){t.push(i)}function h(){return b}return{t:n,getLang:o,setLang:d,onLangChange:g,getSupportedLanguages:h}}function C(e){return e.includes("Firefox/")?"Firefox "+e.split("Firefox/")[1].split(" ")[0]:e.includes("Edg/")?"Edge "+e.split("Edg/")[1].split(" ")[0]:e.includes("Chrome/")?"Chrome "+e.split("Chrome/")[1].split(" ")[0]:e.includes("Safari/")&&e.includes("Version/")?"Safari "+e.split("Version/")[1].split(" ")[0]:"Unknown"}function W(e){return e.includes("Windows NT")?"Windows":e.includes("Mac OS X")?"macOS":e.includes("Android")?"Android":e.includes("iPhone")||e.includes("iPad")?"iOS":e.includes("Linux")?"Linux":"Unknown"}function L({source:e,language:s}){const t=navigator.userAgent;return{source:e,browser:C(t),os:W(t),screen:`${screen.width}×${screen.height}`,viewport:`${window.innerWidth}×${window.innerHeight}`,language:s,referrer:document.referrer||"(none)",timestamp:new Date().toISOString(),userAgent:t}}function P({apiBase:e}){async function s(t){const n=await fetch(`${e}/issues.php`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),o=await n.json();if(!n.ok)throw new Error(o.error||`HTTP ${n.status}`);return o}return{submitIssue:s}}function r(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}const I="lbatschelet/wellspace",F=`https://github.com/${I}/issues`,H=`https://github.com/${I}/blob/main/LICENSE`;function D(e,{debugInfo:s,t,languages:n,currentLang:o,onLangChange:d,onSubmit:g}){const h=new Date().getFullYear(),i=r(v.displayName),u=v.wordmarkHtml;e.innerHTML=`
    <nav class="issue-nav">
      <a href="/" class="issue-logo" title="${i}">${u}</a>
      <span class="lang-toggle" id="langToggle">${o.toUpperCase()}</span>
    </nav>

    <header class="issue-header">
      <h1>${t("page.title")}</h1>
      <p>${t("page.subtitle")}</p>
    </header>

    <div class="issue-card">
      <form class="issue-form" id="issueForm" novalidate>

        <div class="form-group">
          <label for="category">${r(t("category.label"))}</label>
          <select id="category" name="category" required>
            <option value="bug">${r(t("category.bug"))}</option>
            <option value="feature">${r(t("category.feature"))}</option>
            <option value="other">${r(t("category.other"))}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="title">${r(t("title.label"))} <span class="hint">${r(t("title.hint"))}</span></label>
          <input type="text" id="title" name="title" placeholder="${r(t("title.placeholder.bug"))}" required />
        </div>

        <div class="form-group">
          <label for="description">${r(t("description.label"))} <span class="hint">${r(t("description.hint"))}</span></label>
          <textarea id="description" name="description" rows="5" placeholder="${r(t("description.placeholder.bug"))}" required></textarea>
        </div>

        <div class="form-group" id="stepsGroup">
          <label for="steps">${r(t("steps.label"))} <span class="hint">${r(t("steps.hint"))}</span></label>
          <textarea id="steps" name="steps" rows="3" placeholder="${r(t("steps.placeholder"))}"></textarea>
        </div>

        <div class="form-group form-confirm">
          <label for="website">Please leave this field empty</label>
          <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
        </div>

        <details class="debug-details">
          <summary>${r(t("debug.summary"))}</summary>
          <table class="debug-table">
            <tbody>
              ${Object.entries(s).map(([a,p])=>`<tr><td>${r(a)}</td><td>${r(String(p))}</td></tr>`).join("")}
            </tbody>
          </table>
        </details>

        <div id="formError" class="issue-error" style="display:none"></div>

        <button type="submit" class="submit-btn" id="submitBtn">
          <svg class="send-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          ${r(t("submit"))}
        </button>
      </form>
    </div>

    <footer class="app-footer">
      <div class="footer-left">
        <span class="footer-credit">
          &copy; ${h}
          <a href="https://lukasbatschelet.ch" target="_blank" rel="noopener">Lukas Batschelet</a>
          ${r(t("footer.for"))}
          <a href="https://www.phbern.ch" target="_blank" rel="noopener" class="footer-phbern" title="PHBern"><strong>PH</strong>&thinsp;Bern</a>
        </span>
        <span class="footer-license">
          ${r(t("footer.license"))} <a href="${H}" target="_blank" rel="noopener">AGPL-3.0</a>
        </span>
      </div>
      <a class="footer-bug" href="${F}" target="_blank" rel="noopener" title="${r(t("footer.issues"))}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        ${r(t("footer.issues"))}
      </a>
    </footer>
  `,G({t,languages:n,currentLang:o,onLangChange:d,onSubmit:g})}function G({t:e,languages:s,currentLang:t,onLangChange:n,onSubmit:o}){const d=document.getElementById("category"),g=document.getElementById("stepsGroup"),h=document.getElementById("title"),i=document.getElementById("description");function u(){const l=d.value;h.placeholder=e(`title.placeholder.${l}`),i.placeholder=e(`description.placeholder.${l}`),g.style.display=l==="bug"?"":"none"}d.addEventListener("change",u),u(),document.getElementById("langToggle").addEventListener("click",()=>{const l=s.find(m=>m!==t)||s[0];n(l)});const a=document.getElementById("issueForm"),p=document.getElementById("submitBtn"),f=document.getElementById("formError");a.addEventListener("submit",async l=>{l.preventDefault(),f.style.display="none";const m=a.title.value.trim(),w=a.description.value.trim();if(!m||!w){S(f,e("error.required"));return}const A={category:a.category.value,title:m,description:w,steps:a.steps?.value.trim()||"",website:a.website.value};p.disabled=!0,p.classList.add("loading");try{await o(A)}catch(x){S(f,x.message||e("error.generic")),p.disabled=!1,p.classList.remove("loading")}})}function S(e,s){e.textContent=s,e.style.display=""}function R(e,{t:s,onSubmitAnother:t}){e.innerHTML=`
    <div class="issue-success">
      <div class="success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2>${s("success.title")}</h2>
      <p>${s("success.message")}</p>
      <p style="margin-top:1rem"><a href="#" id="submitAnother">${s("success.another")}</a></p>
    </div>
  `,document.getElementById("submitAnother").addEventListener("click",n=>{n.preventDefault(),t()})}const U="/api",k=new URLSearchParams(window.location.search),q=k.get("source")||"direct",O=k.get("lang")||navigator.language?.slice(0,2)||"en",c=T({initialLang:O}),_=P({apiBase:U}),B=document.querySelector("#app");c.onLangChange(()=>y());y();function y(){const e={source:q,language:c.getLang()},s=L(e);D(B,{debugInfo:s,t:c.t,languages:c.getSupportedLanguages(),currentLang:c.getLang(),onLangChange:t=>c.setLang(t),onSubmit:async t=>{const n={...t,debug:L(e)};await _.submitIssue(n);const o=B.querySelector(".issue-card");R(o,{t:c.t,onSubmitAnother:y})}})}
