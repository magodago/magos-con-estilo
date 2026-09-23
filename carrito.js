/* Carrito unico de Magos con Estilo.
   Un solo carrito para toda la web, guardado en el navegador, con pago real por Stripe. */
(function () {
  'use strict';

  var TRABAJADOR = 'https://magos-pedidos.dortizs76.workers.dev';
  var CLAVE = 'mce_carrito_v2';

  // Obra -> nombre de serie, precio y si ya se puede fabricar
  var OBRAS = {
    impossible: { n: 'The Impossible', s: 'Essential', p: 39, ok: true },
    choice:     { n: 'The Choice',     s: 'Essential', p: 39, ok: true },
    promise:    { n: 'The Promise',    s: 'Essential', p: 39, ok: true },
    magician:   { n: 'Little Magician',s: 'Essential', p: 39, ok: true },
    smile:      { n: 'The Smile',      s: 'Essential', p: 39, ok: true },
    hypnotist:  { n: 'The Hypnotist',  s: 'Essential', p: 39, ok: true },
    escapist:   { n: 'The Escapist',   s: 'Essential', p: 39, ok: false },
    thought:    { n: 'The Thought',    s: 'Essential', p: 39, ok: false },
    silver:     { n: 'The Silver',     s: 'Essential', p: 39, ok: false },
    emblem:     { n: 'The Emblem',     s: 'Essential', p: 39, ok: false },
    secret:     { n: 'The Secret',     s: 'The Gallery', p: 59, ok: true },
    architect:  { n: 'The Architect of Impossible', s: 'The Gallery', p: 59, ok: false },
    onetoone:   { n: 'The Moment Before', s: 'One of One', p: 149, ok: true }
  };

  // Cada ficha dice que obra es
  var POR_PAGINA = {
    'artwork-the-impossible.html': 'impossible',
    'artwork-the-choice.html': 'choice',
    'artwork-the-promise.html': 'promise',
    'artwork-little-magician.html': 'magician',
    'artwork-the-smile.html': 'smile',
    'artwork-the-hypnotist.html': 'hypnotist',
    'artwork-the-escapist.html': 'escapist',
    'artwork-the-thought.html': 'thought',
    'artwork-the-silver.html': 'silver',
    'artwork-the-emblem.html': 'emblem',
    'artwork-the-secret.html': 'secret',
    'artwork-the-architect.html': 'architect',
    'one-to-one-the-moment-before.html': 'onetoone'
  };

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (e) { return []; }
  }
  function guardar(l) {
    try { localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) {}
  }
  function euros(n) {
    return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €';
  }
  function total() {
    return leer().reduce(function (s, i) { return s + i.p * i.c; }, 0);
  }
  function piezas() {
    return leer().reduce(function (s, i) { return s + i.c; }, 0);
  }
  function obraDePagina() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (POR_PAGINA[f]) return POR_PAGINA[f];
    if (window.NEO_OBRA && window.NEO_OBRA.diseno) return window.NEO_OBRA.diseno;
    return null;
  }
  function tallaElegida() {
    var a = document.querySelector('.size-btn.active, .size-btn[aria-pressed="true"]');
    if (a) return (a.getAttribute('data-size') || 'M').toUpperCase();
    var s = document.querySelector('#talla, select[name="talla"]');
    if (s && s.value) return String(s.value).toUpperCase();
    return 'M';
  }

  function aviso(texto, malo) {
    var caja = document.getElementById('mceAviso');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'mceAviso';
      caja.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:99999;' +
        'background:#12100e;color:#f3ede2;border:1px solid rgba(243,237,226,.25);padding:14px 22px;' +
        'font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:inherit;max-width:86vw;text-align:center';
      document.body.appendChild(caja);
    }
    caja.style.borderColor = malo ? 'rgba(230,120,90,.6)' : 'rgba(200,168,104,.6)';
    caja.textContent = texto;
    caja.style.display = 'block';
    clearTimeout(caja._t);
    caja._t = setTimeout(function () { caja.style.display = 'none'; }, 3200);
  }

  function anyadir(id, talla, cantidad) {
    var o = OBRAS[id];
    if (!o) return false;
    var l = leer();
    var tam = (talla || 'M').toUpperCase();
    var repetida = null;
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id && l[i].t === tam) { repetida = l[i]; break; }
    }
    if (repetida) { repetida.c += (cantidad || 1); } else {
      l.push({ id: id, n: o.n, s: o.s, p: o.p, t: tam, c: cantidad || 1, f: null });
    }
    guardar(l);
    pintar();
    return true;
  }

  function quitar(i) {
    var l = leer();
    l.splice(i, 1);
    guardar(l);
    pintar();
  }

  function cambiar(i, delta) {
    var l = leer();
    if (!l[i]) return;
    l[i].c = Math.max(1, Math.min(20, l[i].c + delta));
    guardar(l);
    pintar();
  }

  function abrir() {
    var s = document.getElementById('cartSidebar');
    var o = document.getElementById('cartOverlay');
    if (!s) return;
    pintar();
    s.style.display = 'block';
    s.classList.add('open');
    s.style.transform = 'translateX(0)';
    if (o) { o.classList.add('open'); o.style.display = 'block'; o.style.opacity = '1'; }
  }
  function cerrar() {
    var s = document.getElementById('cartSidebar');
    var o = document.getElementById('cartOverlay');
    if (s) {
      s.classList.remove('open');
      s.style.transform = 'translateX(100%)';
      setTimeout(function () { if (!s.classList.contains('open')) s.style.display = 'none'; }, 380);
    }
    if (o) { o.classList.remove('open'); o.style.display = 'none'; }
  }

  function pintar() {
    var l = leer();

    var contador = document.getElementById('cartCount');
    if (contador) {
      var n = piezas();
      contador.textContent = n;
      contador.style.display = n ? 'flex' : 'none';
    }

    var caja = document.getElementById('cartItems');
    if (caja) {
      if (!l.length) {
        caja.innerHTML = '<div class="cart-empty">Your collection is empty.</div>';
      } else {
        caja.innerHTML = l.map(function (it, i) {
          return '<div class="cart-item" style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(243,237,226,.08)">' +
            '<div style="flex:1;text-align:left">' +
              '<div class="cart-item-title">' + it.n + '</div>' +
              '<div class="cart-item-detail">' + it.t + ' · ' + it.s + '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">' +
                '<button class="cart-remove" style="border:1px solid rgba(243,237,226,.2);width:22px;height:22px;line-height:1" data-menos="' + i + '">−</button>' +
                '<span style="font-size:11px;color:#f3ede2;min-width:14px;text-align:center">' + it.c + '</span>' +
                '<button class="cart-remove" style="border:1px solid rgba(243,237,226,.2);width:22px;height:22px;line-height:1" data-mas="' + i + '">+</button>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div class="cart-item-price">' + euros(it.p * it.c) + '</div>' +
              '<button class="cart-remove" data-quitar="' + i + '" style="margin-top:6px">×</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }

    var t = document.getElementById('cartTotal');
    if (t) t.textContent = euros(total());

    var boton = document.querySelector('.cart-checkout');
    if (boton) {
      boton.textContent = l.length ? 'Pagar · ' + euros(total()) : 'Checkout';
      boton.disabled = !l.length;
      boton.style.opacity = l.length ? '1' : '.5';
    }
  }

  function pagar() {
    var l = leer();
    if (!l.length) { aviso('Tu carrito esta vacio'); return; }
    var boton = document.querySelector('.cart-checkout');
    if (boton) { boton.textContent = 'Abriendo el pago...'; boton.disabled = true; }
    var cuerpo = {
      items: l.map(function (i) { return { diseno: i.id, talla: i.t, cantidad: i.c }; })
    };
    fetch(TRABAJADOR + '/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.url) { location.href = d.url; return; }
      aviso((d && d.error) || 'No se pudo abrir el pago', true);
      pintar();
    }).catch(function () {
      aviso('No se pudo conectar con el pago', true);
      pintar();
    });
  }

  // Deja el boton de anadir de la ficha con el carrito de verdad
  function engancharAnadir() {
    window.addToCart = function () {
      var id = obraDePagina();
      if (!id) return;
      var o = OBRAS[id];
      if (o && !o.ok) { aviso(o.n + ': sale a la venta muy pronto'); return; }
      if (anyadir(id, tallaElegida(), 1)) {
        var b = document.getElementById('addToCartBtn');
        if (b) { b.textContent = 'AÑADIDO'; setTimeout(function () { b.textContent = 'ADD TO COLLECTION'; }, 1600); }
        aviso(o.n + ' en la talla ' + tallaElegida() + ', en tu carrito');
        abrir();
      }
    };
  }

  function engancharPortada() {
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('#addToCartBtn, [data-anadir], .add-to-cart, .card-add') : null;
      if (!b) return;
      if (obraDePagina()) return;
      var tarjeta = b.closest ? (b.closest('.card, .product-card, article, .obra, .item') || document) : document;
      var enlace = tarjeta.querySelector ? tarjeta.querySelector('a[href*="artwork-"], a[href*="one-to-one"]') : null;
      if (!enlace) return;
      var f = (enlace.getAttribute('href') || '').split('/').pop().toLowerCase();
      var id = POR_PAGINA[f];
      if (!id) return;
      var o = OBRAS[id];
      if (!o.ok) { aviso(o.n + ': sale a la venta muy pronto'); return; }
      ev.preventDefault();
      ev.stopPropagation();
      anyadir(id, 'M', 1);
      aviso(o.n + ' en la talla M, en tu carrito');
      abrir();
    }, true);
  }

  function engancharCarrito() {
    window.openCart = abrir;
    window.closeCart = cerrar;
    window.checkout = pagar;
    window.removeFromCart = quitar;
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      var q = t.getAttribute('data-quitar');
      if (q !== null) { ev.preventDefault(); quitar(parseInt(q, 10)); return; }
      var m = t.getAttribute('data-mas');
      if (m !== null) { ev.preventDefault(); cambiar(parseInt(m, 10), 1); return; }
      var n = t.getAttribute('data-menos');
      if (n !== null) { ev.preventDefault(); cambiar(parseInt(n, 10), -1); return; }
    });
  }

  function arrancar() {
    if (!document.getElementById('cartSidebar') && document.getElementById('cartItems') === null) {
      // paginas sin carrito propio: se les pone uno flotante (salvo que ya tengan icono de carrito arriba)
      if (!document.querySelector('.cart-btn')) {
        var b = document.createElement('button');
        b.className = 'cart-btn';
        b.setAttribute('aria-label', 'Cart');
        b.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:9998;background:rgba(18,16,14,.92);' +
          'border:1px solid rgba(243,237,226,.3);color:#f3ede2;padding:14px 18px;font-size:10px;letter-spacing:2px;' +
          'text-transform:uppercase;cursor:pointer';
        b.textContent = 'CARRITO';
        b.onclick = abrir;
        b.innerHTML = 'CARRITO <span id="cartCount" style="display:none;margin-left:8px;background:#c8a868;color:#12100e;' +
          'border-radius:50%;padding:1px 6px;font-size:9px">0</span>';
        document.body.appendChild(b);
      }
      var ov = document.createElement('div');
      ov.id = 'cartOverlay';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;display:none';
      ov.onclick = cerrar;
      document.body.appendChild(ov);
      var sd = document.createElement('div');
      sd.id = 'cartSidebar';
      sd.style.cssText = 'position:fixed;top:0;right:0;width:min(92vw,420px);height:100%;background:#12100e;z-index:9999;' +
        'transform:translateX(100%);transition:transform .35s ease;padding:26px;overflow-y:auto;color:#f3ede2';
      sd.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">' +
        '<h3 style="font-size:14px;letter-spacing:3px;text-transform:uppercase">Tu carrito</h3>' +
        '<button class="cart-close" style="background:none;border:none;color:#f3ede2;font-size:22px;cursor:pointer">×</button></div>' +
        '<div class="cart-items" id="cartItems"></div>' +
        '<div style="display:flex;justify-content:space-between;margin:22px 0 14px;font-size:14px">' +
        '<span>Total</span><span id="cartTotal">0,00 €</span></div>' +
        '<button class="cart-checkout" style="width:100%;padding:14px;background:transparent;border:1px solid #f3ede2;' +
        'color:#f3ede2;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer">Checkout</button>';
      document.body.appendChild(sd);
      sd.querySelector('.cart-close').onclick = cerrar;
    }
    engancharCarrito();
    engancharAnadir();
    engancharPortada();
    pintar();
    var b2 = document.querySelector('.cart-checkout');
    if (b2) { b2.onclick = pagar; b2.setAttribute('onclick', ''); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(arrancar, 60); });
  } else {
    setTimeout(arrancar, 60);
  }
  window.MCE_CARRITO = { anyadir: anyadir, leer: leer, pintar: pintar, OBRAS: OBRAS };
})();
