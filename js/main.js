/**
 * Proyecto Integrador: Restaurante Chino "Dragón Dorado"
 * Archivo: js/main.js
 * Funciones:
 *  1. Menú móvil ("🥢 Carta / Menú") mediante evento click.
 *  2. Filtrado de platillos por categoría en productos.html.
 *  3. Favoritos (❤️) y carrito (🥡) persistentes en localStorage.
 *  4. Confirmación de pedido con folio DRG-XXXXXX y envío de comprobante al correo.
 *  5. Validación del formulario de opiniones/contacto con alertas visuales.
 */

const EMAILJS_PUBLIC_KEY = "";
const EMAILJS_SERVICE_ID = "";
const EMAILJS_TEMPLATE_ID = "";

document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  // 1. Menú móvil (evento click)
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const abierto = navLinks.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", String(abierto));
      menuToggle.textContent = abierto ? "✕ Cerrar Menú" : "🥢 Carta / Menú";
    });
  }

  // 2. Filtros por categoría en productos.html
  const filterButtons = document.querySelectorAll(".filter-btn");
  const productCards = document.querySelectorAll("#catalogo-platillos .card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const categoria = btn.dataset.filter;
      productCards.forEach((card) => {
        card.style.display =
          categoria === "todos" || card.dataset.category === categoria ? "flex" : "none";
      });
    });
  });

  // 3. Favoritos y Carrito con persistencia en localStorage
  let favoritos = JSON.parse(localStorage.getItem("dragon_dorado_favoritos")) || [];
  let carrito = JSON.parse(localStorage.getItem("dragon_dorado_carrito")) || [];

  const guardarEstado = () => {
    localStorage.setItem("dragon_dorado_favoritos", JSON.stringify(favoritos));
    localStorage.setItem("dragon_dorado_carrito", JSON.stringify(carrito));
  };

  const renderizarEstado = () => {
    const badgeFav = document.getElementById("contador-favoritos");
    const badgeCart = document.getElementById("contador-carrito");
    if (badgeFav) badgeFav.textContent = favoritos.length;
    if (badgeCart) badgeCart.textContent = carrito.length;

    document.querySelectorAll(".btn-favorito").forEach((btn) => {
      btn.classList.toggle("activo", favoritos.includes(btn.dataset.nombre));
    });

    const listaFav = document.getElementById("lista-favoritos");
    if (listaFav) {
      listaFav.innerHTML = "";
      if (favoritos.length === 0) {
        listaFav.innerHTML = '<li class="empty-msg">Aún no has guardado platillos favoritos.</li>';
      } else {
        favoritos.forEach((nombre) => {
          const li = document.createElement("li");
          li.textContent = `❤️ ${nombre}`;
          listaFav.appendChild(li);
        });
      }
    }

    const listaCart = document.getElementById("lista-carrito");
    const totalCart = document.getElementById("total-carrito");
    if (listaCart && totalCart) {
      listaCart.innerHTML = "";
      let total = 0;

      if (carrito.length === 0) {
        listaCart.innerHTML = '<li class="empty-msg">Tu carrito está vacío.</li>';
      } else {
        carrito.forEach((item, idx) => {
          total += Number(item.precio) || 0;
          const li = document.createElement("li");

          const span = document.createElement("span");
          span.textContent = `🥡 ${item.platillo} — $${item.precio} MXN`;

          const btnQuitar = document.createElement("button");
          btnQuitar.type = "button";
          btnQuitar.className = "btn-icon";
          btnQuitar.textContent = "✕";
          btnQuitar.addEventListener("click", () => {
            carrito.splice(idx, 1);
            guardarEstado();
            renderizarEstado();
          });

          li.appendChild(span);
          li.appendChild(btnQuitar);
          listaCart.appendChild(li);
        });
      }

      totalCart.textContent = `$${total} MXN`;
    }
  };

  document.querySelectorAll(".btn-favorito").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nombre = btn.dataset.nombre;
      if (!nombre) return;

      if (favoritos.includes(nombre)) {
        favoritos = favoritos.filter((item) => item !== nombre);
      } else {
        favoritos.push(nombre);
      }
      guardarEstado();
      renderizarEstado();
    });
  });

  document.querySelectorAll(".btn-carrito").forEach((btn) => {
    btn.addEventListener("click", () => {
      const platillo = btn.dataset.nombre;
      const precio = Number(btn.dataset.precio || 0);
      if (!platillo) return;

      carrito.push({ platillo, precio });
      guardarEstado();
      renderizarEstado();
    });
  });

  const btnVaciar = document.getElementById("btn-vaciar-carrito");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      carrito = [];
      guardarEstado();
      renderizarEstado();
    });
  }

  renderizarEstado();

  // 4. Confirmar pedido y mandar confirmación al correo
  const formPedido = document.getElementById("form-confirmar-pedido");
  const alertaPedido = document.getElementById("pedido-alerta");
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const mostrarAlertaPedido = (htmlMensaje, tipo) => {
    if (!alertaPedido) return;
    alertaPedido.innerHTML = htmlMensaje;
    alertaPedido.className = `form-alert ${tipo}`;
  };

  if (formPedido) {
    formPedido.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("pedido-nombre")?.value.trim() || "";
      const correo = document.getElementById("pedido-correo")?.value.trim() || "";

      if (carrito.length === 0) {
        mostrarAlertaPedido("⚠️ Agrega al menos un platillo al carrito antes de confirmar.", "error");
        return;
      }

      if (nombre.length < 2) {
        mostrarAlertaPedido("⚠️ Escribe tu nombre para confirmar el pedido.", "error");
        return;
      }

      if (!regexEmail.test(correo)) {
        mostrarAlertaPedido("⚠️ Ingresa un correo electrónico válido para recibir la confirmación.", "error");
        return;
      }

      const folio = `DRG-${Math.floor(100000 + Math.random() * 900000)}`;
      const total = carrito.reduce((acc, item) => acc + (Number(item.precio) || 0), 0);
      const resumenPlatillos = carrito.map((i) => `• ${i.platillo} ($${i.precio} MXN)`).join("\n");
      const asunto = encodeURIComponent(`Confirmación de Pedido ${folio} - Dragón Dorado`);
      const cuerpo = encodeURIComponent(
        `Hola ${nombre},\n\nTu pedido en Restaurante Chino "Dragón Dorado" ha sido confirmado.\nFolio: ${folio}\n\nDetalle:\n${resumenPlatillos}\n\nTotal: $${total} MXN\nGracias por tu preferencia.`
      );
      const mailtoUrl = `mailto:${encodeURIComponent(correo)}?subject=${asunto}&body=${cuerpo}`;

      const btnConfirmar = document.getElementById("btn-confirmar-pedido");
      if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Confirmando...";
      }

      let enviadoAutomatico = false;
      if (
        typeof emailjs !== "undefined" &&
        EMAILJS_PUBLIC_KEY &&
        EMAILJS_SERVICE_ID &&
        EMAILJS_TEMPLATE_ID
      ) {
        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: correo,
            to_name: nombre,
            folio_pedido: folio,
            detalle_pedido: resumenPlatillos,
            total_pedido: `$${total} MXN`
          });
          enviadoAutomatico = true;
        } catch (_) {
          enviadoAutomatico = false;
        }
      }

      if (btnConfirmar) {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar Pedido";
      }

      carrito = [];
      guardarEstado();
      renderizarEstado();
      formPedido.reset();

      if (enviadoAutomatico) {
        mostrarAlertaPedido(
          `✅ Pedido <strong>${folio}</strong> confirmado. Se envió la confirmación a <strong>${correo}</strong> por $${total} MXN.`,
          "exito"
        );
      } else {
        mostrarAlertaPedido(
          `✅ Pedido <strong>${folio}</strong> confirmado a nombre de <strong>${nombre}</strong> por <strong>$${total} MXN</strong>. Confirmación preparada para <strong>${correo}</strong>.<br><a class="mailto-link" href="${mailtoUrl}">Abrir correo para enviar comprobante a ${correo}</a>`,
          "exito"
        );
      }
    });
  }

  // 5. Validación del formulario de opiniones/contacto con alertas visuales
  const contactForm = document.getElementById("form-contacto");
  const alertBox = document.getElementById("form-alerta");
  const regexTelefono = /^[0-9]{10}$/;

  const mostrarAlertaContacto = (mensaje, tipo) => {
    if (!alertBox) return;
    alertBox.textContent = mensaje;
    alertBox.className = `form-alert ${tipo}`;
  };

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nombre = document.getElementById("nombre")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const telefono = document.getElementById("telefono")?.value.trim() || "";
      const calificacion = document.getElementById("calificacion")?.value || "";
      const mensaje = document.getElementById("mensaje")?.value.trim() || "";

      if (nombre.length < 3) {
        mostrarAlertaContacto("⚠️ Escribe tu nombre completo (mínimo 3 caracteres).", "error");
        return;
      }

      if (!regexEmail.test(email)) {
        mostrarAlertaContacto("⚠️ Ingresa un correo electrónico válido.", "error");
        return;
      }

      if (telefono !== "" && !regexTelefono.test(telefono)) {
        mostrarAlertaContacto("⚠️ El teléfono debe tener exactamente 10 dígitos numéricos.", "error");
        return;
      }

      if (calificacion === "") {
        mostrarAlertaContacto("⚠️ Selecciona una calificación de tu visita.", "error");
        return;
      }

      if (mensaje.length < 10) {
        mostrarAlertaContacto("⚠️ Escribe tu opinión o sugerencia (mínimo 10 caracteres).", "error");
        return;
      }

      mostrarAlertaContacto(
        `✅ ¡Gracias, ${nombre}! Tu opinión (${calificacion}/5) ha sido registrada.`,
        "exito"
      );
      contactForm.reset();
    });
  }
});
