(function () {
  "use strict";

  var state = { cat: "all", search: "", sort: "name" };
  var allProducts = [];

  function t(k) { return window.LeotechLang ? window.LeotechLang.t(k) : k; }
  function fmt(v) { return Number(v).toLocaleString("pt-MZ") + " MZN"; }

  // Vai buscar a tradução do produto ao i18n.js
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

  async function fetchProducts() {
    var grid = document.getElementById("productGrid");
    if (!grid) return;
    
    grid.innerHTML = '<p class="empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:10px"></i><br>A carregar...</p>';

    await waitForSupabase();
    
    try {
      var res = await window.supabaseClient.from('products').select('*').order('name');
      if (res.error) throw res.error;
      
      allProducts = res.data.map(function(p) {
        return {
          id: p.id, name: p.name, desc: p.description, price: Number(p.price),
          category: p.category, img: p.image_url, icon: p.icon, stock: p.stock_quantity
        };
      });
      render();
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      grid.innerHTML = '<p class="empty" style="color:var(--danger)">Erro ao carregar a loja.</p>';
    }
  }

  function render() {
    var grid = document.getElementById("productGrid");
    if (!grid) return;

    var list = allProducts.slice();

    if (state.cat !== "all") list = list.filter(function (p) { return p.category === state.cat; });
    if (state.search) {
      var q = state.search.toLowerCase();
      list = list.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 || (p.desc && p.desc.toLowerCase().indexOf(q) !== -1);
      });
    }
    
    if (state.sort === "priceAsc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "priceDesc") list.sort(function (a, b) { return b.price - a.price; });
    else list.sort(function (a, b) { return a.name.localeCompare(b.name); });

    if (!list.length) {
      grid.innerHTML = '<p class="empty"><i class="fa-solid fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px"></i>' + t("shop.empty") + '</p>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var outOfStock = p.stock <= 0;
      var btnHtml = outOfStock 
        ? '<button type="button" class="btn btn-outline btn-sm" disabled style="opacity:0.5"><i class="fa-solid fa-ban"></i> Esgotado</button>'
        : '<button type="button" class="btn btn-primary btn-sm add-cart" data-id="' + p.id + '"><i class="fa-solid fa-cart-plus"></i> ' + t("shop.addCart") + '</button>';

      // Traduzir o nome e a descrição
      var pName = getTranslated(p.id, 'name', p.name);
      var pDesc = getTranslated(p.id, 'desc', p.desc);

      return '' +
        '<article class="product-card" data-id="' + p.id + '">' +
          '<a href="produto.html?id=' + p.id + '" style="display:block; position:relative; overflow:hidden;">' +
            '<div class="product-img">' +
              '<div class="img-fallback"><i class="fa-solid ' + p.icon + '"></i></div>' +
              '<img src="' + p.img + '" alt="' + pName + '" loading="lazy" onerror="this.style.display=\'none\'">' +
              '<span class="product-badge">' + t("cat." + p.category) + '</span>' +
            '</div>' +
          '</a>' +
          '<div class="product-body">' +
            '<a href="produto.html?id=' + p.id + '"><h3>' + pName + '</h3></a>' +
            '<p>' + pDesc + '</p>' +
            '<div class="product-foot">' +
              '<strong>' + fmt(p.price) + '</strong>' +
              btnHtml +
            '</div>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  function addToCart(id) {
    var p = allProducts.find(function (x) { return x.id === id; });
    if (!p) return;
    if (p.stock <= 0) { alert("Este produto está esgotado."); return; }

    var cart = [];
    try { cart = JSON.parse(localStorage.getItem("leotech_cart")) || []; } catch (e) {}
    var existing = cart.find(function (c) { return c.id === id; });
    
    if (existing) {
      if (existing.qty >= p.stock) { alert("Não há mais stock disponível deste produto."); return; }
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ id: p.id, name: getTranslated(p.id, 'name', p.name), price: p.price, qty: 1 });
    }
    
    localStorage.setItem("leotech_cart", JSON.stringify(cart));
    if (window.LeotechCart) window.LeotechCart.update();
    document.dispatchEvent(new Event("cart-updated"));
    
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + t("shop.added");
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 300);
    }, 2200);
  }

  function initFilters() {
    document.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-cat]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.cat = btn.getAttribute("data-cat");
        render();
      });
    });
    var s = document.getElementById("shopSearch");
    if (s) s.addEventListener("input", function (e) { state.search = e.target.value; render(); });
    var so = document.getElementById("shopSort");
    if (so) so.addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".add-cart");
    if (btn) addToCart(btn.getAttribute("data-id"));
  });

  document.addEventListener("DOMContentLoaded", function () {
    initFilters();
    fetchProducts();
  });

  document.addEventListener("languagechange", function () {
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    render();
  });
})();