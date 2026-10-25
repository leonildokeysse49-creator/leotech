(function () {
  "use strict";

  var user = window.LeotechAuth && window.LeotechAuth.getUser();
  
  // Proteção: Só entra se for estafeta ou admin
  if (!user || (user.role !== "estafeta" && user.role !== "admin")) {
    alert("Acesso Restrito. Faz login com uma conta de Estafeta.");
    window.location.href = "../login.html";
    return;
  }

  document.getElementById("adminName").textContent = user.name;
  document.getElementById("adminLogout").addEventListener("click", function(e) {
    e.preventDefault(); window.LeotechAuth.logout();
  });

  async function renderEntregas() {
    var root = document.getElementById("estafetaRoot");
    root.innerHTML = '<tr><td colspan="5" style="text-align:center">A carregar...</td></tr>';

    // Vai buscar os pedidos que têm o email deste estafeta
    var res = await window.supabaseClient.from('orders')
      .select('*')
      .eq('estafeta_email', user.email)
      .order('created_at', { ascending: false });

    var myDeliveries = res.data || [];

    if (myDeliveries.length === 0) {
      root.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Nenhuma entrega atribuída de momento.</td></tr>';
      return;
    }

    root.innerHTML = myDeliveries.map(function(o) {
      var isEntregue = o.status === "entregue" || o.status === "concluido";
      var btnAction = isEntregue 
        ? '<span class="badge-status badge-concluido"><i class="fa-solid fa-check"></i> Entregue</span>' 
        : '<button class="btn btn-primary btn-sm confirm-delivery" data-id="' + o.id + '"><i class="fa-solid fa-box-open"></i> Marcar como Entregue</button>';

      return (
        '<tr>' +
          '<td><strong>#' + o.id + '</strong><br><small>' + new Date(o.created_at).toLocaleDateString("pt-MZ") + '</small></td>' +
          '<td><strong>' + o.customer_name + '</strong></td>' +
          '<td><a href="https://wa.me/' + (o.customer_phone || '') + '" target="_blank" class="btn btn-outline btn-sm"><i class="fa-brands fa-whatsapp" style="color:#25D366"></i> ' + o.customer_phone + '</a></td>' +
          '<td>' + (o.address || 'Recolha na loja') + '</td>' +
          '<td>' + btnAction + '</td>' +
        '</tr>'
      );
    }).join("");

    // Ação de confirmar entrega
    root.querySelectorAll(".confirm-delivery").forEach(function(btn) {
      btn.addEventListener("click", async function() {
        if (!confirm("Confirmas que entregaste este pedido?")) return;
        btn.disabled = true;
        btn.innerHTML = "A processar...";
        
        await window.supabaseClient.from('orders').update({ status: 'entregue' }).eq('id', btn.getAttribute("data-id"));
        renderEntregas(); // Atualiza a lista
      });
    });
  }

  document.addEventListener("DOMContentLoaded", renderEntregas);
})();