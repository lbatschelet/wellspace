import{g as a}from"./webappBase-DtC13hAE.js";import"./config-dcVj4wuk.js";const t=a()||"",o=t?`${t}/issue/?source=admin`:"#";function l(){const e=document.createElement("footer");e.className="app-footer";const r=new Date().getFullYear();return e.innerHTML=`
    <div class="footer-left">
      <span class="footer-credit">
        © ${r}
        <a href="https://lukasbatschelet.ch" target="_blank" rel="noopener">Lukas Batschelet</a>
        for
        <a href="https://www.phbern.ch" target="_blank" rel="noopener" class="footer-phbern" title="PHBern"><strong>PH</strong>&thinsp;Bern</a>
      </span>
      <span class="footer-license">
        Licensed under <a href="https://github.com/lbatschelet/wellspace/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a>
      </span>
    </div>
    <a class="footer-bug" href="${o}" target="_blank" rel="noopener" title="Report a bug or request a feature">
      Report a bug
    </a>
  `,{element:e}}export{l as createFooter};
