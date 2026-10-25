(function () {
  "use strict";
  var user = window.LeotechAuth && window.LeotechAuth.getUser();
  if (!user) { window.location.href = "../login.html"; return; }

  function initSidebar() {
    document.querySelectorAll(".js-user-name").forEach(function(el) { el.textContent = user.name; });
    document.querySelectorAll(".js-user-email").forEach(function(el) { el.textContent = user.email; });
    document.querySelectorAll(".account-avatar").forEach(function(el) { el.textContent = user.name.charAt(0).toUpperCase(); });
    var logoutBtn = document.querySelector(".js-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", function(e) { e.preventDefault(); window.LeotechAuth.logout(); });
  }

  async function waitForSupabase() {
    return new Promise(function(resolve) {
      if (window.supabaseClient) { resolve(); return; }
      var interval = setInterval(function() { if (window.supabaseClient) { clearInterval(interval); resolve(); } }, 100);
    });
  }

  async function initPedidos() {
    var root = document.getElementById("pedidosRoot");
    if (!root) return;
    root.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> A carregar...</div>';
    await waitForSupabase();
    
    var res = await window.supabaseClient.from('orders').select('*, order_items (*)').eq('customer_email', user.email).order('created_at', { ascending: false });
    var myOrders = res.data || [];

    if (myOrders.length === 0) {
      root.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-box-open"></i><h3>Ainda não fizeste nenhum pedido.</h3><br><a href="../loja.html" class="btn btn-primary">Ir à loja</a></div>';
      return;
    }

    root.innerHTML = myOrders.map(function(o) {
      var date = new Date(o.created_at).toLocaleDateString("pt-MZ");
      var statusClass = o.status === "entregue" || o.status === "concluido" ? "status-concluido" : (o.status === "cancelado" ? "status-cancelado" : "status-pendente");
      var itemsHtml = (o.order_items || []).map(function(i) { return '<div>' + i.quantity + 'x ' + i.product_name + ' - ' + (i.price * i.quantity).toLocaleString("pt-MZ") + ' MZN</div>'; }).join("");
      
      return '<div class="order-card"><div class="order-header"><div><span class="order-id">#' + o.id + '</span> <span class="order-date">(' + date + ')</span></div><span class="order-status ' + statusClass + '">' + o.status.toUpperCase() + '</span></div><div class="order-body">' + itemsHtml + '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">Total: <strong>' + Number(o.total).toLocaleString("pt-MZ") + ' MZN</strong></div></div></div>';
    }).join("");
  }

  async function initServicos() {
    var root = document.getElementById("servicosRoot");
    if (!root) return;
    root.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> A carregar...</div>';
    await waitForSupabase();

    var res = await window.supabaseClient.from('service_requests').select('*').eq('customer_email', user.email).order('created_at', { ascending: false });
    var myServices = res.data || [];

    if (myServices.length === 0) {
      root.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-screwdriver-wrench"></i><h3>Ainda não pediste nenhum serviço.</h3><br><a href="../servicos.html" class="btn btn-primary">Ver serviços</a></div>';
      return;
    }

    root.innerHTML = myServices.map(function(s) {
      var date = new Date(s.created_at).toLocaleDateString("pt-MZ");
      var statusClass = s.status === "concluido" ? "status-concluido" : (s.status === "em_curso" ? "status-enviado" : "status-pendente");
      
      return (
        '<div class="order-card">' +
          '<div class="order-header">' +
            '<div><span class="order-id">' + s.id + '</span> <span class="order-date">(' + date + ')</span></div>' +
            '<span class="order-status ' + statusClass + '">' + s.status.replace("_", " ").toUpperCase() + '</span>' +
          '</div>' +
          '<div class="order-body">' +
            '<strong>' + s.service_name + '</strong><br>' +
            '<p style="font-size:.85rem;margin-top:4px;color:var(--muted)">' + s.message + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function initPerfil() {
    var form = document.getElementById("perfilForm");
    if (!form) return;
    form.name.value = user.name; form.email.value = user.email; form.phone.value = user.phone || "";
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      await waitForSupabase();
      await window.supabaseClient.from('profiles').update({ name: form.name.value.trim() }).eq('id', user.id);
      await window.supabaseClient.auth.updateUser({ data: { name: form.name.value.trim(), phone: form.phone.value.trim() } });
      var status = document.getElementById("perfilStatus"); status.hidden = false; status.className = "form-status ok"; status.innerHTML = '<i class="fa-solid fa-circle-check"></i> Perfil atualizado!';
      setTimeout(function() { status.hidden = true; }, 3000);
    });
  }

  function initSuporte() {
    var form = document.getElementById("suporteForm");
    if (!form) return;
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      var btn = form.querySelector("button"); btn.disabled = true;
      await waitForSupabase();
      await window.supabaseClient.from('tickets').insert([{ id: "TK" + Date.now().toString().slice(-6), customer_email: user.email, subject: form.subject.value, message: form.message.value, status: "aberto" }]);
      form.reset(); btn.disabled = false;
      var status = document.getElementById("suporteStatus"); status.hidden = false; status.className = "form-status ok"; status.innerHTML = '<i class="fa-solid fa-circle-check"></i> Ticket aberto!';
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    initSidebar(); initPerfil(); initPedidos(); initServicos(); initSuporte();
  });
})();