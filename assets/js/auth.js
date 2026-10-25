(function () {
  "use strict";
  var USER_KEY = "leotech_user";

  function getUser() {
    var keys = Object.keys(localStorage);
    var authKey = keys.find(function(k) { return k.startsWith('sb-') && k.endsWith('-auth-token'); });
    
    if (authKey) {
      try {
        var data = JSON.parse(localStorage.getItem(authKey));
        if (data && data.user) {
          return {
            id: data.user.id,
            name: data.user.user_metadata.name || "Utilizador",
            email: data.user.email,
            role: data.user.user_metadata.role || "cliente",
            phone: data.user.user_metadata.phone || ""
          };
        }
      } catch(e) {}
    }
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
  }

  async function register(data) {
    if (window.supabaseClient) {
      var res = await window.supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name, role: "cliente" }
        }
      });
      if (res.error) throw new Error(res.error.message);
      return res.data.user;
    } else {
      throw new Error("Supabase não carregado");
    }
  }

  async function login(email, password) {
    if (window.supabaseClient) {
      var res = await window.supabaseClient.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw new Error(res.error.message);
      return res.data.user;
    } else {
      throw new Error("Supabase não carregado");
    }
  }

  async function logout() {
    try {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
    } catch (e) {
      console.error("Erro no logout do Supabase:", e);
    }
    localStorage.removeItem(USER_KEY);
    
    // Redireciona para o index independentemente da pasta onde está
    var inSub = window.location.pathname.includes('/conta/') || window.location.pathname.includes('/admin/');
    window.location.href = inSub ? "../index.html" : "index.html";
  }

  window.LeotechAuth = { getUser: getUser, register: register, login: login, logout: logout };
})();