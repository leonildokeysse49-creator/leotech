(function () {
  "use strict";

  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  function fmt(v) { return Number(v).toLocaleString("pt-MZ") + " MZN"; }

  function getTranslated(id, field, fallback) {
    var lang = window.LeotechLang ? window.LeotechLang.get() : 'pt';
    var key = "product." + id + "." + field;
    if (window.LEOTECH_I18N && window.LEOTECH_I18N[lang] && window.LEOTECH_I18N[lang][key]) {
      return window.LEOTECH_I18N[lang][key];
    }
    return fallback;
  }

  async function waitForSupabase() {
    return new Promise(function(resolve) {
      if (window.supabaseClient) { resolve(); return; }
      var interval = setInterval(function() { if (window.supabaseClient) { clearInterval(interval); resolve(); } }, 100);
    });
  }

  async function loadProduct() {
    await waitForSupabase();
    var root = document.getElementById("productDetailRoot");
    
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get('id');

    if (!productId) {
      root.innerHTML = '<h2>' + t("produto.notFound") + '</h2>';
      return;
    }

    var res = await window.supabaseClient.from('products').select('*').eq('id', productId).single();
    var p = res.data;

    if (!p) {
      root.innerHTML = '<h2>' + t("produto.notFound") + '</h2>';
      return;
    }

    var pName = getTranslated(p.id, 'name', p.name);
    var pDesc = getTranslated(p.id, 'desc', p.description);

    var inStock = p.stock_quantity > 0;
    var stockHtml = inStock 
      ? '<span class="stock-status in-stock"><i class="fa-solid fa-check"></i> ' + t("produto.inStock") + ' (' + p.stock_quantity + ' ' + t("produto.available") + ')</span>' 
      : '<span class="stock-status out-stock"><i class="fa-solid fa-xmark"></i> ' + t("produto.outOfStock") + '</span>';
      
    var btnHtml = inStock
      ? '<button class="btn btn-primary btn-block add-cart-btn" data-id="' + p.id + '"><i class="fa-solid fa-cart-plus"></i> ' + t("produto.addToCart") + '</button>'
      : '<button class="btn btn-outline btn-block" disabled><i class="fa-solid fa-ban"></i> ' + t("produto.unavailable") + '</button>';

    root.innerHTML = 
      '<div class="product-detail-grid">' +
        '<div>' +
          '<img src="' + (p.image_url || '') + '" alt="' + pName + '" class="product-image">' +
        '</div>' +
        '<div class="product-info">' +
          '<span class="badge">' + t("cat." + p.category) + '</span>' +
          '<h1>' + pName + '</h1>' +
          '<div class="product-price">' + fmt(p.price) + '</div>' +
          stockHtml +
          '<p style="margin-bottom: 24px;">' + pDesc + '</p>' +
          btnHtml +
        '</div>' +
      '</div>';

    // Lógica para adicionar ao carrinho
    var addBtn = root.querySelector(".add-cart-btn");
    if (addBtn) {
      addBtn.addEventListener("click", function() {
        var cart = JSON.parse(localStorage.getItem("leotech_cart")) || [];
        var existing = cart.find(function (c) { return c.id === p.id; });
        
        if (existing) {
          existing.qty = (existing.qty || 1) + 1;
        } else {
          cart.push({ id: p.id, name: pName, price: p.price, qty: 1 });
        }
        
        localStorage.setItem("leotech_cart", JSON.stringify(cart));
        if (window.LeotechCart) window.LeotechCart.update();
        
        addBtn.innerHTML = '<i class="fa-solid fa-check"></i> ' + t("produto.added");
        addBtn.style.background = "var(--success)";
        setTimeout(function() {
          addBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> ' + t("produto.addToCart");
          addBtn.style.background = "";
        }, 2000);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", loadProduct);
  
  // Recarregar se o idioma mudar
  document.addEventListener("languagechange", loadProduct);
})();