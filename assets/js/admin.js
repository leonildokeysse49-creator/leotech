(function () {
  "use strict";

  // 1. VERIFICAÇÃO DE SEGURANÇA E CARGO
  var user = window.LeotechAuth && window.LeotechAuth.getUser();
  
  if (user && user.email === "admin@leotech.co.mz") {
    user.role = "admin";
  }

  if (!user || user.role === "cliente" || !user.role) {
    alert("Acesso Restrito. Apenas funcionários da Leotech podem entrar aqui.");
    window.location.href = "../login.html";
    return;
  }

  var path = window.location.pathname;
  
  if (path.includes("utilizadores.html") && user.role !== "admin") {
    alert("Acesso negado. Apenas Administradores gerem utilizadores.");
    window.location.href = "index.html"; return;
  }
  if (path.includes("produtos.html") && user.role !== "admin" && user.role !== "stock") {
    alert("Acesso negado. Apenas Gestores de Stock gerem produtos.");
    window.location.href = "index.html"; return;
  }
  if (path.includes("pedidos.html") && user.role !== "admin" && user.role !== "vendedor") {
    alert("Acesso negado. Apenas Vendedores gerem pedidos.");
    window.location.href = "index.html"; return;
  }
  if (path.includes("servicos.html") && user.role !== "admin" && user.role !== "tecnico") {
    alert("Acesso negado. Apenas Técnicos gerem serviços.");
    window.location.href = "index.html"; return;
  }

  function setupSidebar() {
    var nav = document.querySelector(".admin-nav");
    if (!nav) return;
    if (user.role === "admin") return;
    nav.querySelectorAll("a").forEach(function(link) {
      var href = link.getAttribute("href");
      if (user.role === "vendedor" && (href.includes("produtos") || href.includes("servicos") || href.includes("utilizadores"))) link.style.display = "none";
      if (user.role === "tecnico" && (href.includes("produtos") || href.includes("pedidos") || href.includes("utilizadores"))) link.style.display = "none";
      if (user.role === "stock" && (href.includes("servicos") || href.includes("pedidos") || href.includes("utilizadores"))) link.style.display = "none";
    });
  }

  function initHeader() {
    var nameEl = document.getElementById("adminName");
    if (nameEl) nameEl.textContent = user.name;
    
    var logoutBtn = document.getElementById("adminLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function(e) {
        e.preventDefault();
        window.LeotechAuth.logout();
      });
    }
  }

  // --- DASHBOARD ---
  async function initDashboard() {
    var elOrders = document.getElementById("statOrders");
    if (!elOrders) return;

    try {
      var resOrders = await window.supabaseClient.from('orders').select('*');
      var resTickets = await window.supabaseClient.from('tickets').select('*');
      
      var orders = resOrders.data || [];
      var tickets = resTickets.data || [];
      
      var validOrders = orders.filter(function(o) { return o.status !== "cancelado"; });
      var totalSales = validOrders.reduce(function(acc, o) { return acc + Number(o.total); }, 0);
      
      var pending = orders.filter(function(o) { return o.status === "pendente"; }).length;
      var openTickets = tickets.filter(function(t) { return t.status === "aberto"; }).length;

      elOrders.textContent = orders.length;
      document.getElementById("statSales").textContent = totalSales.toLocaleString("pt-MZ") + " MZN";
      document.getElementById("statPending").textContent = pending;
      document.getElementById("statTickets").textContent = openTickets;

      var recentRoot = document.getElementById("recentOrders");
      if (recentRoot) {
        var recent = orders.slice(-5).reverse();
        if (recent.length === 0) {
          recentRoot.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888">Nenhum pedido recente.</td></tr>';
        } else {
          recentRoot.innerHTML = recent.map(function(o) {
            return '<tr><td><strong>#' + o.id + '</strong></td><td>' + o.customer_name + '</td><td>' + new Date(o.created_at).toLocaleDateString("pt-MZ") + '</td><td>' + Number(o.total).toLocaleString("pt-MZ") + ' MZN</td></tr>';
          }).join("");
        }
      }
    } catch (err) {
      console.error("Erro no Dashboard:", err);
    }
  }

  // --- PEDIDOS ---
  async function initPedidos() {
    var root = document.getElementById("adminPedidosRoot");
    if (!root) return;

    var resProfiles = await window.supabaseClient.from('profiles').select('*').eq('role', 'estafeta');
    var estafetas = resProfiles.data || [];
    
    async function renderOrders() {
      root.innerHTML = '<tr><td colspan="7" style="text-align:center">A carregar...</td></tr>';
      var res = await window.supabaseClient.from('orders').select(`*, order_items (*)`).order('created_at', { ascending: false });
      var orders = res.data || [];

      if (orders.length === 0) {
        root.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Nenhum pedido.</td></tr>'; return;
      }

      root.innerHTML = orders.map(function(o) {
        var items = (o.order_items || []).map(function(i) { return i.quantity + 'x ' + i.product_name; }).join("<br>");
        
        var estafetaSelect = '<select class="status-select estafeta-select" data-id="' + o.id + '">' + 
          '<option value="">Sem estafeta</option>';
        estafetas.forEach(function(e) {
          estafetaSelect += '<option value="' + e.email + '" ' + (o.estafeta_email === e.email ? "selected" : "") + '>' + e.name + '</option>';
        });
        estafetaSelect += '</select>';

        return (
          '<tr>' +
            '<td><strong>#' + o.id + '</strong><br><small>' + new Date(o.created_at).toLocaleDateString("pt-MZ") + '</small></td>' +
            '<td>' + o.customer_name + '<br><small>' + o.customer_phone + '</small></td>' +
            '<td style="font-size:.8rem">' + items + '</td>' +
            '<td><strong>' + Number(o.total).toLocaleString("pt-MZ") + ' MZN</strong></td>' +
            '<td>' + estafetaSelect + '</td>' +
            '<td>' +
              '<select class="status-select" data-id="' + o.id + '">' +
                '<option value="pendente" ' + (o.status === "pendente" ? "selected" : "") + '>Pendente</option>' +
                '<option value="em_entrega" ' + (o.status === "em_entrega" ? "selected" : "") + '>Em Entrega</option>' +
                '<option value="entregue" ' + (o.status === "entregue" ? "selected" : "") + '>Entregue</option>' +
                '<option value="cancelado" ' + (o.status === "cancelado" ? "selected" : "") + '>Cancelado</option>' +
              '</select>' +
            '</td>' +
            '<td><button class="btn btn-outline btn-sm del-order" data-id="' + o.id + '" style="color:var(--danger);border-color:#f8d7da;"><i class="fa-solid fa-trash"></i></button></td>' +
          '</tr>'
        );
      }).join("");

      root.querySelectorAll(".status-select:not(.estafeta-select)").forEach(function(select) {
        select.addEventListener("change", async function(e) {
          await window.supabaseClient.from('orders').update({ status: e.target.value }).eq('id', e.target.getAttribute("data-id"));
          e.target.style.borderColor = "var(--success)";
          setTimeout(function() { e.target.style.borderColor = ""; }, 1500);
        });
      });

      root.querySelectorAll(".estafeta-select").forEach(function(select) {
        select.addEventListener("change", async function(e) {
          await window.supabaseClient.from('orders').update({ estafeta_email: e.target.value }).eq('id', e.target.getAttribute("data-id"));
          e.target.style.borderColor = "var(--success)";
          setTimeout(function() { e.target.style.borderColor = ""; }, 1500);
        });
      });
      
      root.querySelectorAll(".del-order").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          if (!confirm("Apagar pedido permanentemente?")) return;
          await window.supabaseClient.from('orders').delete().eq('id', btn.getAttribute("data-id"));
          renderOrders();
        });
      });
    }
    renderOrders();
  }

  // --- SERVIÇOS (ADMIN) ---
  async function initServicos() {
    var root = document.getElementById("adminServicosRoot");
    if (!root) return;

    var resProfiles = await window.supabaseClient.from('profiles').select('*').eq('role', 'tecnico');
    var tecnicos = resProfiles.data || [];

    async function renderServices() {
      root.innerHTML = '<tr><td colspan="6" style="text-align:center">A carregar...</td></tr>';
      var res = await window.supabaseClient.from('service_requests').select('*').order('created_at', { ascending: false });
      var requests = res.data || [];

      if (requests.length === 0) {
        root.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Nenhum pedido de serviço.</td></tr>'; return;
      }

      root.innerHTML = requests.map(function(r) {
        var tecnicoSelect = '<select class="status-select tecnico-select" data-id="' + r.id + '">' +
          '<option value="">Sem técnico</option>';
        tecnicos.forEach(function(t) {
          tecnicoSelect += '<option value="' + t.email + '" ' + (r.tecnico_email === t.email ? "selected" : "") + '>' + t.name + '</option>';
        });
        tecnicoSelect += '</select>';

        return (
          '<tr>' +
            '<td>' + new Date(r.created_at).toLocaleDateString("pt-MZ") + '</td>' +
            '<td><strong>' + r.customer_name + '</strong><br><small>' + r.customer_phone + '</small></td>' +
            '<td><strong>' + r.service_name + '</strong><br><small>' + r.message + '</small></td>' +
            '<td>' + tecnicoSelect + '</td>' +
            '<td>' +
              '<select class="status-select" data-id="' + r.id + '">' +
                '<option value="pendente" ' + (r.status === "pendente" ? "selected" : "") + '>Pendente</option>' +
                '<option value="em_curso" ' + (r.status === "em_curso" ? "selected" : "") + '>Em Curso</option>' +
                '<option value="concluido" ' + (r.status === "concluido" ? "selected" : "") + '>Concluído</option>' +
              '</select>' +
            '</td>' +
            '<td><button class="btn btn-outline btn-sm del-service" data-id="' + r.id + '" style="color:var(--danger);border-color:#f8d7da;"><i class="fa-solid fa-trash"></i></button></td>' +
          '</tr>'
        );
      }).join("");

      root.querySelectorAll(".status-select:not(.tecnico-select)").forEach(function(select) {
        select.addEventListener("change", async function(e) {
          await window.supabaseClient.from('service_requests').update({ status: e.target.value }).eq('id', e.target.getAttribute("data-id"));
          e.target.style.borderColor = "var(--success)";
          setTimeout(function() { e.target.style.borderColor = ""; }, 1500);
        });
      });

      root.querySelectorAll(".tecnico-select").forEach(function(select) {
        select.addEventListener("change", async function(e) {
          await window.supabaseClient.from('service_requests').update({ tecnico_email: e.target.value }).eq('id', e.target.getAttribute("data-id"));
          e.target.style.borderColor = "var(--success)";
          setTimeout(function() { e.target.style.borderColor = ""; }, 1500);
        });
      });

      root.querySelectorAll(".del-service").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          if (!confirm("Apagar este pedido de serviço?")) return;
          await window.supabaseClient.from('service_requests').delete().eq('id', btn.getAttribute("data-id"));
          renderServices();
        });
      });
    }
    renderServices();
  }

  // --- SUPORTE ---
  async function initSuporte() {
    var root = document.getElementById("adminSuporteRoot");
    if (!root) return;

    async function renderTickets() {
      root.innerHTML = '<tr><td colspan="5" style="text-align:center">A carregar...</td></tr>';
      var res = await window.supabaseClient.from('tickets').select('*').order('created_at', { ascending: false });
      var tickets = res.data || [];

      if (tickets.length === 0) {
        root.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Nenhum ticket de suporte.</td></tr>'; return;
      }

      root.innerHTML = tickets.map(function(t) {
        return (
          '<tr>' +
            '<td><strong>#' + t.id + '</strong></td>' +
            '<td>' + t.customer_email + '</td>' +
            '<td><strong>' + t.subject + '</strong><br><small style="color:#666">' + t.message + '</small></td>' +
            '<td>' +
              '<select class="status-select" data-tid="' + t.id + '">' +
                '<option value="aberto" ' + (t.status === "aberto" ? "selected" : "") + '>Aberto</option>' +
                '<option value="fechado" ' + (t.status === "fechado" ? "selected" : "") + '>Fechado</option>' +
              '</select>' +
            '</td>' +
            '<td><button class="btn btn-outline btn-sm del-ticket" data-tid="' + t.id + '" style="color:var(--danger);border-color:#f8d7da;"><i class="fa-solid fa-trash"></i></button></td>' +
          '</tr>'
        );
      }).join("");

      root.querySelectorAll(".status-select").forEach(function(select) {
        select.addEventListener("change", async function(e) {
          await window.supabaseClient.from('tickets').update({ status: e.target.value }).eq('id', e.target.getAttribute("data-tid"));
        });
      });

      root.querySelectorAll(".del-ticket").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          if (!confirm("Apagar este ticket?")) return;
          await window.supabaseClient.from('tickets').delete().eq('id', btn.getAttribute("data-tid"));
          renderTickets();
        });
      });
    }
    renderTickets();
  }

  // --- INICIALIZAÇÃO COM PROTEÇÃO DE CARREGAMENTO ---
  async function waitForSupabase() {
    return new Promise(function(resolve) {
      if (window.supabaseClient) { resolve(); return; }
      var interval = setInterval(function() { 
        if (window.supabaseClient) { 
          clearInterval(interval); 
          resolve(); 
        } 
      }, 100);
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await waitForSupabase(); // <--- Espera o Supabase ligar antes de fazer as chamadas

    setupSidebar();
    initHeader();
    initDashboard();
    initPedidos();
    initServicos();
    initSuporte();
  });
})();