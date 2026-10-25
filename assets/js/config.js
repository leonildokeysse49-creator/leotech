window.LEOTECH_CONFIG = {
  SUPABASE_URL: "https://tzdsyebdcowpihilundl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_0iIAzzqO4azhx8qgx9Mf9w__wy_Dt2f",
  CURRENCY: "MZN"
};

// Carrega a biblioteca do Supabase automaticamente
(function loadSupabase() {
  var script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = function() {
    if (window.LEOTECH_CONFIG.SUPABASE_URL && window.LEOTECH_CONFIG.SUPABASE_ANON_KEY) {
      window.supabaseClient = supabase.createClient(
        window.LEOTECH_CONFIG.SUPABASE_URL,
        window.LEOTECH_CONFIG.SUPABASE_ANON_KEY
      );
      console.log("Supabase ligado com sucesso!");
    } else {
      console.warn("Supabase não configurado.");
    }
  };
  document.head.appendChild(script);
})();