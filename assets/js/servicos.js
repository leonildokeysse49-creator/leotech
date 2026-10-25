(function () {
  "use strict";

  var SERVICES = [
    { key: "serv.dev", icon: "fa-code" },
    { key: "serv.db", icon: "fa-database" },
    { key: "serv.support", icon: "fa-headset" },
    { key: "serv.web", icon: "fa-globe" },
    { key: "serv.elec", icon: "fa-bolt" },
    { key: "serv.train", icon: "fa-graduation-cap" }
  ];

  // Função para traduzir (se não encontrar, devolve a chave)
  function t(key) { return window.LeotechLang ? window.LeotechLang.t(key) : key; }

  function renderServices() {
    var grid = document.getElementById("servicosGrid");
    if (!grid) return;

    grid.innerHTML = SERVICES.map(function(s) {
      return '<article class="card service-card">' +
        '<div class="card-icon"><i class="fa-solid ' + s.icon + '"></i></div>' +
        '<h3>' + t(s.key + '.title') + '</h3>' +
        '<p>' + t(s.key + '.desc') + '</p>' +
        '<button class="btn btn-outline btn-sm request-btn" data-name="' + t(s.key + '.title') + '" style="margin-top:16px; align-self:flex-start"><i class="fa-solid fa-paper-plane"></i> ' + t("serv.request") + '</button>' +
      '</article>';
    }).join("");
  }

  function openModal(serviceName) {
    var user = window.LeotechAuth.getUser();
    document.getElementById("serviceNameInput").value = serviceName;
    document.getElementById("modalTitle").textContent = t("serv.request") + ": " + serviceName;
    
    if (user) {
      document.querySelector("#serviceForm input[name='name']").value = user.name;
      document.querySelector("#serviceForm input[name='email']").value = user.email;
      document.querySelector("#serviceForm input[name='phone']").value = user.phone || "";
    }
    
    document.getElementById("serviceModal").classList.add("active");
  }

  document.addEventListener("click", function(e) {
    var btn = e.target.closest(".request-btn");
    if (btn) openModal(btn.getAttribute("data-name"));
  });

  document.getElementById("btnCloseModal").addEventListener("click", function() {
    document.getElementById("serviceModal").classList.remove("active");
  });

  document.getElementById("serviceForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    var form = e.target;
    var btn = document.getElementById("btnSubmitService");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + t("contact.form.sending");

    var newReq = {
      id: "SR" + Date.now().toString().slice(-6),
      customer_name: form.name.value.trim(),
      customer_email: form.email.value.trim(),
      customer_phone: form.phone.value.trim(),
      service_name: document.getElementById("serviceNameInput").value,
      message: form.message.value.trim(),
      status: "pendente"
    };

    var res = await window.supabaseClient.from('service_requests').insert([newReq]);
    
    if (res.error) {
      alert("Erro ao enviar: " + res.error.message);
      btn.disabled = false;
      btn.innerHTML = t("contact.form.submit");
      return;
    }

    alert(t("contact.form.success"));
    form.reset();
    document.getElementById("serviceModal").classList.remove("active");
    btn.disabled = false;
    btn.innerHTML = t("contact.form.submit");
  });

  document.addEventListener("DOMContentLoaded", renderServices);
  
  // A MÁGICA: Ouve a mudança de idioma e desenha os cartões de novo!
  document.addEventListener("languagechange", renderServices);
})();