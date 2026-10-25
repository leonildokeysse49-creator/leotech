(function () {
  "use strict";

  var OPTIONS = {
    servico: ["Assistência técnica", "Desenvolvimento web", "Aplicações e sistemas", "Redes e segurança", "Formação", "Contratos de manutenção"],
    produto: ["Computadores", "Acessórios", "Redes", "Impressoras", "Componentes"],
    suporte: ["Problema técnico", "Dúvida sobre pedido", "Garantia", "Outro"],
    orcamento: ["Orçamento — site", "Orçamento — aplicação", "Orçamento — sistema de gestão"],
    sistema: ["FoodManager — Restaurantes", "FacturacaoPro — Faturação", "Sistema Salão de Beleza", "Gestão Desportiva"]
  };

  async function waitForSupabase() {
    return new Promise(function(resolve) {
      if (window.supabaseClient) { resolve(); return; }
      var interval = setInterval(function() { if (window.supabaseClient) { clearInterval(interval); resolve(); } }, 100);
    });
  }

  function t(key) { return (window.LeotechLang && window.LeotechLang.t(key)) || key; }

  function rebuildCategories() {
    var assunto = document.getElementById("assunto");
    var field = document.getElementById("categoriaField");
    var select = document.getElementById("categoria");
    if (!assunto || !field || !select) return;

    var list = OPTIONS[assunto.value];
    select.innerHTML = "";

    if (!list) { field.hidden = true; select.required = false; return; }

    var first = document.createElement("option");
    first.value = "";
    first.textContent = "Seleciona a categoria";
    select.appendChild(first);

    list.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key;
      select.appendChild(opt);
    });

    field.hidden = false;
    select.required = true;
  }

  function setStatus(msg, type) {
    var el = document.getElementById("formStatus");
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<i class="fa-solid ' + (type === "ok" ? "fa-circle-check" : "fa-circle-exclamation") + '"></i> ' + msg;
    el.className = "form-status " + (type || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var btn = document.getElementById("submitBtn");
    var labelSpan = btn.querySelector("span");
    var original = labelSpan.textContent;
    btn.disabled = true;
    labelSpan.textContent = "A enviar...";

    await waitForSupabase();

    var payload = {
      name: form.nome.value.trim(),
      email: form.email.value.trim(),
      phone: form.telefone.value.trim(),
      subject: form.assunto.options[form.assunto.selectedIndex].text,
      message: form.mensagem.value.trim(),
      status: "novo"
    };

    try {
      var res = await window.supabaseClient.from('messages').insert([payload]);
      if (res.error) throw res.error;

      setStatus("Mensagem enviada com sucesso! Entraremos em contacto em breve.", "ok");
      form.reset();
      document.getElementById("categoriaField").hidden = true;
    } catch (err) {
      setStatus("Erro ao enviar. Tenta novamente.", "error");
    } finally {
      btn.disabled = false;
      labelSpan.textContent = original;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var assunto = document.getElementById("assunto");
    var form = document.getElementById("contactForm");
    if (assunto) assunto.addEventListener("change", rebuildCategories);
    if (form) form.addEventListener("submit", handleSubmit);
  });
})();