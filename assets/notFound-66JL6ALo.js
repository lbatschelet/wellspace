import{b as s}from"./config-BMoUhhdH.js";const t=document.querySelector("#app");function i(){return(new URL(window.location.href).searchParams.get("lang")||navigator.language||"en").slice(0,2).toLowerCase()==="de"?"de":"en"}const a={de:{title:"Ups … hier ist gerade kein Wohlfühl‑Pin.",body:"Diese Seite existiert nicht (mehr). Vielleicht hat sie sich im Gebäude verlaufen.",home:"Zur Startseite",bug:"Found a bug? / Feedback"},en:{title:"Oops … there’s no wellbeing pin here.",body:"This page doesn’t exist (anymore). Maybe it got lost in the building.",home:"Back to home",bug:"Found a bug? / Feedback"}},n=i(),e=a[n],o=`/feedback/?source=viewer&path=${encodeURIComponent(window.location.pathname)}`,c=s?.wordmarkHtml;t.innerHTML=`
  <div class="ws-404">
    <div class="ws-404-card">
      <div class="ws-404-code">HTTP 404</div>
      <div class="ws-404-brand">${c}</div>
      <h1 class="ws-404-title">${e.title}</h1>
      <p class="ws-404-body">${e.body}</p>
      <div class="ws-404-actions">
        <a class="ws-404-btn" href="/">${e.home}</a>
        <a class="ws-404-link" href="${o}">${e.bug}</a>
      </div>
    </div>
  </div>
`;
