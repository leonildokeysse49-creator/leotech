(function () {
  "use strict";

  var user = window.LeotechAuth && window.LeotechAuth.getUser();
  
  if (!user || (user.role !== "tecnico" && user.role !== "admin")) {
    alert("Acesso Restrito. Faz login com uma conta de Técnico.");
    window.location.href = "../login.html";
    return;
  }

  document.getElementById("adminName").textContent = user.name;
  document.getElementById("adminLogout").addEventListener("click", function(e) {
    e.preventDefault(); window.LeotechAuth.logout();
  });

  async function renderServicos() {
    var root = document.getElementById("tecnicoRoot");
    root.innerHTML = '<tr><td colspan="5" style="text-align:center">A carregar...</td></tr>';

    var res = await window.supabaseClient.from('service_requests')
      .select('*')
      .eq('tecnico_email', user.email)
      .order('created_at', { ascending: false });

    var myServices = res.data || [];

    if (myServices.length === 0) {
      root.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Nenhum serviço atribuído de momento.</td></tr>';
      return;
    }

    root.innerHTML = myServices.map(function(s) {
      var isDone = s.status === "concluido";
      var btnAction = isDone 
        ? '<span class="badge-status badge-concluido"><i class="fa-solid fa-check"></i> Concluído</span>' 
        : '<button class="btn btn-primary btn-sm finish-service" data-id="' + s.id + '"><i class="fa-solid fa-check-double"></i> Concluir Serviço</button>';

      return (
        '<tr>' +
          '<td>' + new Date(s.created_at).toLocaleDateString("pt-MZ") + '</td>' +
          '<td><strong>' + s.customer_name + '</strong></td>' +
          '<td><strong>' + s.service_name + '</strong><br><small style="color:#666">' + s.message + '</small></td>' +
          '<td><a href="https://wa.me/' + (s.customer_phone || '') + '" target="_blank" class="btn btn-outline btn-sm"><i class="fa-brands fa-whatsapp" style="color:#25D366"></i> ' + s.customer_phone + '</a></td>' +
          '<td>' + btnAction + '</td>' +
        '</tr>'
      );
    }).join("");

    root.querySelectorAll(".finish-service").forEach(function(btn) {
      btn.addEventListener("click", async function() {
        if (!confirm("Confirmas que o serviço foi concluído?")) return;
        btn.disabled = true;
        btn.innerHTML = "A processar...";
        await window.supabaseClient.from('service_requests').update({ status: 'concluido' }).eq('id', btn.getAttribute("data-id"));
        renderServicos();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", renderServicos);
})();