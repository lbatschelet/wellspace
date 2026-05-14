import{g as o}from"./webappBase-C-OK_qxg.js";import"./config-DvzYGSBB.js";const t=o()||"",s=t?`${t}/feedback/?source=admin`:"#";function c(){const e=document.createElement("footer");e.className="app-footer";const a=new Date().getFullYear(),r="v1.0.0-beta.14-10-ga9a5d08";return e.innerHTML=`
    <div class="footer-left">
      <span class="footer-credit">
        © ${a}
        <a href="https://lukasbatschelet.ch" target="_blank" rel="noopener">Lukas Batschelet</a>
        for
        <a href="https://www.phbern.ch" target="_blank" rel="noopener" class="footer-phbern" title="PHBern"><strong>PH</strong>&thinsp;Bern</a>
      </span>
      <span class="footer-license">
        Licensed under <a href="https://github.com/lbatschelet/wellspace/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a>
      </span>
      <a class="footer-version" href="https://wellspace.ch" target="_blank" rel="noopener">
        Wellspace ${r}
      </a>
    </div>
    <a class="footer-bug" href="${s}" target="_blank" rel="noopener" title="Report a bug or request a feature">
      Report a bug
    </a>
  `,{element:e}}export{c as createFooter};
