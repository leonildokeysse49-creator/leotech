(function () {
  "use strict";
  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  
  function setStatus(msg, type) {
    var el = document.getElementById("registoStatus");
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<i class="fa-solid ' + (type === "ok" ? "fa-circle-check" : "fa-circle-exclamation") + '"></i> ' + msg;
    el.className = "form-status " + (type || "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.LeotechAuth && window.LeotechAuth.getUser()) { location.href = "index.html"; return; }
    
    var form = document.getElementById("registoForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var btn = document.getElementById("registoBtn");
      var span = btn.querySelector("span");
      var original = span.textContent;
      btn.disabled = true;
      span.textContent = "A criar conta...";

      try {
        await window.LeotechAuth.register({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
          password2: form.password2.value
        });
        setStatus("Conta criada com sucesso! A entrar...", "ok");
        setTimeout(function () { location.href = "index.html"; }, 1000);
      } catch (err) {
        setStatus("Erro ao criar conta. O email pode já estar registado ou a palavra-passe é curta.", "error");
        btn.disabled = false;
        span.textContent = original;
      }
    });
  });
})();