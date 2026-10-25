(function () {
  "use strict";
  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  
  function setStatus(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<i class="fa-solid ' + (type === "ok" ? "fa-circle-check" : "fa-circle-exclamation") + '"></i> ' + msg;
    el.className = "form-status " + (type || "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.LeotechAuth && window.LeotechAuth.getUser()) { location.href = "index.html"; return; }
    
    var loginContainer = document.getElementById("loginContainer");
    var recoverContainer = document.getElementById("recoverContainer");
    
    document.getElementById("recoverLink").addEventListener("click", function(e) {
      e.preventDefault();
      loginContainer.hidden = true;
      recoverContainer.hidden = false;
    });
    document.getElementById("backToLoginLink").addEventListener("click", function(e) {
      e.preventDefault();
      recoverContainer.hidden = true;
      loginContainer.hidden = false;
    });

    // LOGIN
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!loginForm.checkValidity()) { loginForm.reportValidity(); return; }
        
        var btn = document.getElementById("loginBtn");
        var span = btn.querySelector("span");
        var original = span.textContent;
        btn.disabled = true;
        span.textContent = "A entrar...";

        try {
          var loggedUser = await window.LeotechAuth.login(loginForm.email.value.trim(), loginForm.password.value);
          setStatus("loginStatus", "Sessão iniciada com sucesso!", "ok");
          
          setTimeout(function () { 
            var role = loggedUser.user_metadata ? loggedUser.user_metadata.role : 'cliente';
            var email = loggedUser.email;

            if (role === "estafeta") {
              location.href = "estafeta/index.html";
            } else if (role === "tecnico") {
              location.href = "tecnico/index.html";
            } else if (email === "admin@leotech.co.mz" || role === "admin") {
              location.href = "admin/index.html";
            } else {
              location.href = "index.html"; 
            }
          }, 500);

        } catch (err) {
          setStatus("loginStatus", "Erro: " + err.message, "error");
          btn.disabled = false;
          span.textContent = original;
        }
      });
    }

    // RECUPERAR PASSWORD
    var recoverForm = document.getElementById("recoverForm");
    if (recoverForm) {
      recoverForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        var btn = document.getElementById("btnRecover");
        btn.disabled = true;
        
        var email = recoverForm.email.value.trim();
        // Envia o email de recuperação via Supabase
        var res = await window.supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/leotech/login.html' // ajusta caso o link mude
        });

        if (res.error) {
          setStatus("recoverStatus", "Erro: " + res.error.message, "error");
          btn.disabled = false;
        } else {
          setStatus("recoverStatus", "Link enviado! Verifica a tua caixa de entrada e o spam.", "ok");
          btn.disabled = false;
          recoverForm.reset();
        }
      });
    }
  });
})();