(function () {
  "use strict";

  var SHIPPING = { pickup: 0, maputo: 500, other: 1500 };
  var state = { delivery: "pickup" };

  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  function fmt(v) { return v.toLocaleString("pt-MZ") + " MZN"; }
  
  function getCart() {
    try { return JSON.parse(localStorage.getItem("leotech_cart")) || []; } catch (e) { return []; }
  }

  // Função para esperar que o Supabase carregue
  async function waitForSupabase() {
    return new Promise(function(resolve) {
      if (window.supabaseClient) { resolve(); return; }
      var interval = setInterval(function() { if (window.supabaseClient) { clearInterval(interval); resolve(); } }, 100);
    });
  }

  function calcTotals() {
    var cart = getCart();
    var subtotal = cart.reduce(function (s, i) { return s + (Number(i.price) * Number(i.qty)); }, 0);
    var iva = Math.round(subtotal * 0.16);
    var ship = SHIPPING[state.delivery] || 0;
    return { subtotal: subtotal, iva: iva, ship: ship, total: subtotal + iva + ship, items: cart };
  }

  function render() {
    var root = document.getElementById("checkoutRoot");
    if (!root) return;

    var totals = calcTotals();

    if (!totals.items.length) {
      root.innerHTML =
        '<div class="cart-empty">' +
          '<i class="fa-solid fa-cart-shopping"></i>' +
          '<h2>' + t("checkout.empty") + '</h2>' +
          '<p>&nbsp;</p>' +
          '<a href="loja.html" class="btn btn-primary"><i class="fa-solid fa-store"></i> ' + t("cart.emptyCta") + '</a>' +
        '</div>';
      return;
    }

    var user = window.LeotechAuth && window.LeotechAuth.getUser();

    var miniItems = totals.items.map(function (item) {
      return '<div class="mini-item"><span class="name">' + item.name + '</span><span class="qty">x' + item.qty + '</span><span>' + fmt(item.price * item.qty) + '</span></div>';
    }).join("");

    var html =
      '<div class="checkout-grid">' +
        '<form class="card checkout-form" id="checkoutForm" novalidate>' +
          '<div class="checkout-section">' +
            '<h3><i class="fa-solid fa-user"></i> ' + t("checkout.info") + '</h3>' +
            '<div class="form-row">' +
              '<label class="field"><span>' + t("checkout.name") + '</span>' +
                '<input class="input" type="text" name="name" required value="' + (user ? user.name : "") + '" placeholder="' + t("checkout.namePh") + '">' +
              '</label>' +
              '<label class="field"><span>' + t("checkout.email") + '</span>' +
                '<input class="input" type="email" name="email" required value="' + (user ? user.email : "") + '" placeholder="' + t("checkout.emailPh") + '">' +
              '</label>' +
            '</div>' +
            '<label class="field"><span>' + t("checkout.phone") + '</span>' +
              '<input class="input" type="tel" name="phone" required placeholder="' + t("checkout.phonePh") + '">' +
            '</label>' +
          '</div>' +

          '<div class="checkout-section">' +
            '<h3><i class="fa-solid fa-truck"></i> ' + t("checkout.delivery") + '</h3>' +
            '<div class="radio-group" id="deliveryGroup">' +
              '<label class="radio-opt checked"><input type="radio" name="delivery" value="pickup" checked><span>' + t("checkout.delivery.pickup") + '</span></label>' +
              '<label class="radio-opt"><input type="radio" name="delivery" value="maputo"><span>' + t("checkout.delivery.maputo") + '</span></label>' +
              '<label class="radio-opt"><input type="radio" name="delivery" value="other"><span>' + t("checkout.delivery.other") + '</span></label>' +
            '</div>' +
            '<label class="field" id="addressField" hidden style="margin-top:12px">' +
              '<span>' + t("checkout.address") + '</span>' +
              '<textarea class="textarea" name="address" placeholder="' + t("checkout.addressPh") + '"></textarea>' +
            '</label>' +
          '</div>' +

          '<div class="checkout-section">' +
            '<h3><i class="fa-solid fa-wallet"></i> ' + t("checkout.payment") + '</h3>' +
            '<div class="radio-group">' +
              '<label class="radio-opt checked"><input type="radio" name="payment" value="emola" checked><span><i class="fa-solid fa-mobile-screen" style="color:#0b5ed7;margin-right:6px"></i> ' + t("checkout.pay.emola") + '</span></label>' +
              '<label class="radio-opt"><input type="radio" name="payment" value="mpesa"><span><i class="fa-solid fa-mobile-screen" style="color:#c81e1e;margin-right:6px"></i> ' + t("checkout.pay.mpesa") + '</span></label>' +
              '<label class="radio-opt"><input type="radio" name="payment" value="transfer"><span><i class="fa-solid fa-building-columns" style="color:#0e7a4b;margin-right:6px"></i> ' + t("checkout.pay.transfer") + '</span></label>' +
              '<label class="radio-opt"><input type="radio" name="payment" value="cash"><span><i class="fa-solid fa-money-bill-wave" style="color:#b8860b;margin-right:6px"></i> ' + t("checkout.pay.cash") + '</span></label>' +
            '</div>' +
          '</div>' +

          '<button type="submit" class="btn btn-primary btn-block" id="checkoutBtn">' +
            '<i class="fa-solid fa-check"></i> <span>' + t("checkout.submit") + '</span>' +
          '</button>' +
          '<p class="form-status" id="checkoutStatus" hidden></p>' +
        '</form>' +

        '<aside class="checkout-summary">' +
          '<div class="card">' +
            '<h3 style="margin-bottom:14px"><i class="fa-solid fa-receipt" style="color:var(--primary);margin-right:8px"></i>' + t("checkout.summary") + '</h3>' +
            miniItems +
            '<div class="cart-line" style="margin-top:10px"><span>' + t("cart.subtotal") + '</span><span>' + fmt(totals.subtotal) + '</span></div>' +
            '<div class="cart-line"><span>' + t("checkout.iva") + '</span><span>' + fmt(totals.iva) + '</span></div>' +
            '<div class="cart-line"><span>' + t("checkout.shipping") + '</span><span id="shipLine">' + (totals.ship ? fmt(totals.ship) : "—") + '</span></div>' +
            '<div class="cart-line total"><span>' + t("checkout.total") + '</span><strong id="totalLine">' + fmt(totals.total) + '</strong></div>' +
          '</div>' +
        '</aside>' +
      '</div>';

    root.innerHTML = html;

    root.querySelectorAll(".radio-opt input").forEach(function (radio) {
      radio.addEventListener("change", function () {
        var group = radio.closest(".radio-group");
        group.querySelectorAll(".radio-opt").forEach(function (l) { l.classList.remove("checked"); });
        radio.closest(".radio-opt").classList.add("checked");

        if (radio.name === "delivery") {
          state.delivery = radio.value;
          document.getElementById("addressField").hidden = (state.delivery === "pickup");
          updateShipping();
        }
      });
    });

    document.getElementById("checkoutForm").addEventListener("submit", handleSubmit);
  }

  function updateShipping() {
    var totals = calcTotals();
    document.getElementById("shipLine").textContent = totals.ship ? fmt(totals.ship) : "—";
    document.getElementById("totalLine").textContent = fmt(totals.total);
  }

  function setStatus(msg, type) {
    var el = document.getElementById("checkoutStatus");
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<i class="fa-solid ' + (type === "ok" ? "fa-circle-check" : "fa-circle-exclamation") + '"></i> ' + msg;
    el.className = "form-status " + (type || "");
  }

  function showConfirmation(orderId) {
    document.getElementById("checkoutRoot").innerHTML =
      '<div class="confirm-card card">' +
        '<div class="confirm-icon"><i class="fa-solid fa-check"></i></div>' +
        '<h2>' + t("checkout.success") + '</h2>' +
        '<p>' + t("checkout.successMsg") + '</p>' +
        '<div class="order-num">' + t("checkout.orderNumber") + ': #' + orderId + '</div>' +
        '<div><a href="index.html" class="btn btn-primary"><i class="fa-solid fa-house"></i> ' + t("checkout.backHome") + '</a></div>' +
      '</div>';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var delivery = form.delivery.value;
    var address = form.address ? form.address.value.trim() : "";
    
    if (delivery !== "pickup" && !address) {
      setStatus(t("checkout.addressRequired"), "error");
      form.address.focus();
      return;
    }

    var btn = document.getElementById("checkoutBtn");
    var span = btn.querySelector("span");
    var original = span.textContent;
    btn.disabled = true;
    span.textContent = t("checkout.submitting");

    await waitForSupabase(); // Espera o Supabase ligar

    var totals = calcTotals();
    var orderId = "LT" + Date.now().toString().slice(-8);
    var user = window.LeotechAuth.getUser();

    // 1. Preparar o Pedido Principal
    var orderData = {
      id: orderId,
      user_id: user ? user.id : null,
      customer_name: form.name.value.trim(),
      customer_email: form.email.value.trim(),
      customer_phone: form.phone.value.trim(),
      address: address,
      delivery_method: delivery,
      payment_method: form.payment.value,
      subtotal: totals.subtotal,
      iva: totals.iva,
      shipping: totals.ship,
      total: totals.total,
      status: "pendente"
    };

    try {
      // 2. Gravar o Pedido na tabela 'orders'
      var resOrder = await window.supabaseClient.from('orders').insert([orderData]);
      if (resOrder.error) throw resOrder.error;

      // 3. Preparar e gravar os Itens na tabela 'order_items'
      var itemsData = totals.items.map(function(item) {
        return {
          order_id: orderId,
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.qty
        };
      });

      var resItems = await window.supabaseClient.from('order_items').insert(itemsData);
      if (resItems.error) throw resItems.error;

      // 4. Abater o Stock na Base de Dados para cada item
      for (var i = 0; i < totals.items.length; i++) {
        var item = totals.items[i];
        await window.supabaseClient.rpc('decrement_stock', { 
          product_id: item.id, 
          quantity: item.qty 
        });
      }

      // 5. Limpar o carrinho e mostrar sucesso
      localStorage.removeItem("leotech_cart");
      if (window.LeotechCart) window.LeotechCart.update();
      document.dispatchEvent(new Event("cart-updated"));

      showConfirmation(orderId);

    } catch (err) {
      console.error("Erro ao gravar pedido:", err);
      setStatus("Erro ao processar o pedido: " + err.message, "error");
      btn.disabled = false;
      span.textContent = original;
    }
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("languagechange", function () {
    var root = document.getElementById("checkoutRoot");
    if (root && !root.querySelector(".confirm-card")) render();
  });
})();