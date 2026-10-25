(function () {
  "use strict";

  var ICON_MAP = {
    "sys-food": "fa-utensils", "sys-fact": "fa-file-invoice-dollar",
    "sys-salao": "fa-scissors", "sys-desp": "fa-futbol",
    "p1": "fa-laptop", "p2": "fa-desktop", "p3": "fa-computer-mouse",
    "p4": "fa-keyboard", "p5": "fa-wifi", "p6": "fa-network-wired",
    "p7": "fa-print", "p8": "fa-hard-drive", "p9": "fa-memory", "p10": "fa-video"
  };

  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  function fmt(v) { return v.toLocaleString("pt-MZ") + " MZN"; }
  function getCart() {
    try { return JSON.parse(localStorage.getItem("leotech_cart")) || []; } catch (e) { return []; }
  }
  function saveCart(arr) {
    localStorage.setItem("leotech_cart", JSON.stringify(arr));
    if (window.LeotechCart) window.LeotechCart.update();
    document.dispatchEvent(new Event("cart-updated"));
  }
  function iconFor(id) { return ICON_MAP[id] || "fa-box"; }

  function calcTotals(cart) {
    var subtotal = cart.reduce(function (s, i) { return s + (Number(i.price) * Number(i.qty)); }, 0);
    var iva = Math.round(subtotal * 0.16);
    return { subtotal: subtotal, iva: iva, total: subtotal + iva };
  }

  function render() {
    var root = document.getElementById("cartRoot");
    if (!root) return;

    var cart = getCart();

    if (!cart.length) {
      root.innerHTML =
        '<div class="cart-empty">' +
          '<i class="fa-solid fa-cart-shopping"></i>' +
          '<h2>' + t("cart.empty") + '</h2>' +
          '<p>&nbsp;</p>' +
          '<a href="loja.html" class="btn btn-primary">' +
            '<i class="fa-solid fa-store"></i> ' + t("cart.emptyCta") +
          '</a>' +
        '</div>';
      return;
    }

    var totals = calcTotals(cart);

    var itemsHtml = cart.map(function (item, idx) {
      var lineTotal = item.price * item.qty;
      return (
        '<div class="cart-item" data-idx="' + idx + '">' +
          '<div class="cart-thumb"><i class="fa-solid ' + iconFor(item.id) + '"></i></div>' +
          '<div class="cart-info">' +
            '<h3>' + item.name + '</h3>' +
            '<span class="price">' + fmt(item.price) + '</span>' +
            '<div class="qty-controls">' +
              '<button type="button" data-act="dec" data-idx="' + idx + '" aria-label="Diminuir"><i class="fa-solid fa-minus"></i></button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-act="inc" data-idx="' + idx + '" aria-label="Aumentar"><i class="fa-solid fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-weight:700">' + fmt(lineTotal) + '</div>' +
            '<button type="button" class="btn-remove" data-act="remove" data-idx="' + idx + '" aria-label="' + t("cart.remove") + '">' +
              '<i class="fa-solid fa-trash"></i>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    var summaryHtml =
      '<div class="cart-side">' +
        '<div class="card">' +
          '<h3 style="margin-bottom:12px"><i class="fa-solid fa-receipt" style="color:var(--primary);margin-right:8px"></i>' + t("cart.summary") + '</h3>' +
          '<div class="cart-line"><span>' + t("cart.subtotal") + '</span><span>' + fmt(totals.subtotal) + '</span></div>' +
          '<div class="cart-line"><span>' + t("cart.iva") + '</span><span>' + fmt(totals.iva) + '</span></div>' +
          '<div class="cart-line total"><span>' + t("cart.total") + '</span><strong>' + fmt(totals.total) + '</strong></div>' +
          '<a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:18px">' +
            '<i class="fa-solid fa-lock"></i> ' + t("cart.checkout") +
          '</a>' +
          '<a href="loja.html" class="link-arrow" style="margin-top:14px;justify-content:center;display:flex">' +
            '<i class="fa-solid fa-arrow-left"></i> ' + t("cart.continue") +
          '</a>' +
        '</div>' +
      '</div>';

    root.innerHTML =
      '<div class="cart-grid">' +
        '<div class="cart-list">' + itemsHtml + '</div>' +
        summaryHtml +
      '</div>';
  }

  function dec(idx) {
    var cart = getCart();
    if (!cart[idx]) return;
    if (cart[idx].qty > 1) cart[idx].qty -= 1;
    else cart.splice(idx, 1);
    saveCart(cart); render();
  }
  function inc(idx) {
    var cart = getCart();
    if (!cart[idx]) return;
    cart[idx].qty = (cart[idx].qty || 1) + 1;
    saveCart(cart); render();
  }
  function remove(idx) {
    if (!confirm(t("cart.removeConfirm"))) return;
    var cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart); render();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var idx = Number(btn.getAttribute("data-idx"));
    if (act === "inc") inc(idx);
    else if (act === "dec") dec(idx);
    else if (act === "remove") remove(idx);
  });

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("languagechange", render);
})();