document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  const searchInput = document.getElementById("searchInput");
  const categoriaSelect = document.getElementById("categoriaSelect");
  const paginacion = document.getElementById("paginacion");
  const errorMsg = document.getElementById("error-message");
  const loadingMsg = document.getElementById("loading");

  const productosPorPagina = 20;
  let productos = [];
  let paginaActual = 1;
  let categoriaActual = "todos";
  let busquedaActual = "";

  fetch("catalogo_desde_texto.json")
    .then(res => {
      if (!res.ok) throw new Error('Error de red al cargar el catálogo');
      return res.json();
    })
    .then(data => {
      for (const origen in data.productos) {
        data.productos[origen].forEach(p => {
          if (p.producto && p.codigo && p.precio != null) {
            productos.push({
              nombre: p.producto,
              id: p.codigo.toString(),
              precio: parseFloat(p.precio),
              categoria: p.categoria || "Sin categoría",
              origen: p.origen || origen
            });
          }
        });
      }

      loadingMsg.style.display = "none";
      if (productos.length === 0) {
        errorMsg.style.display = "block";
        catalogo.innerHTML = "";
      } else {
        cargarFiltros();
        render();
      }
    })
    .catch(err => {
      console.error("Error loading JSON:", err);
      loadingMsg.style.display = "none";
      errorMsg.style.display = "block";
    });

  function cargarFiltros() {
    const categorias = ["todos", ...new Set(productos.map(p => p.categoria))];
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });
  }

  searchInput?.addEventListener("input", e => {
    busquedaActual = e.target.value.toLowerCase();
    paginaActual = 1;
    render();
  });

  categoriaSelect?.addEventListener("change", e => {
    categoriaActual = e.target.value;
    paginaActual = 1;
    render();
  });

  function render() {
    const filtrados = productos.filter(p => {
      const coincideBusqueda =
        (p.nombre?.toLowerCase() || "").includes(busquedaActual) ||
        (p.id?.toLowerCase() || "").includes(busquedaActual);
      const coincideCategoria = categoriaActual === "todos" || p.categoria === categoriaActual;
      return coincideBusqueda && coincideCategoria;
    });

    const totalPaginas = Math.ceil(filtrados.length / productosPorPagina);
    const inicio = (paginaActual - 1) * productosPorPagina;
    const visibles = filtrados.slice(inicio, inicio + productosPorPagina);

    if (filtrados.length === 0) {
      catalogo.innerHTML = `<p style="text-align:center;">No se encontraron productos para tu búsqueda.</p>`;
      paginacion.innerHTML = "";
      return;
    }

    catalogo.innerHTML = visibles.map(p => `
      <div class="card">
        <img class="card-img" src="images/${p.id}.jpg" alt="${p.nombre || 'Imagen de producto'}" onerror="this.src='images/default.png'">
        <div class="card-content">
          <h3>${p.nombre || 'Producto sin nombre'}</h3>
          <p><strong>ID:</strong> <span class="card-codigo">${p.id}</span></p>
          <p><strong>Categoría:</strong> ${p.categoria || 'Sin categoría'}</p>
          <p class="card-price"><strong>Precio:</strong> $${p.precio?.toFixed(2) || '0.00'}</p>
          <button onclick='agregarAlCarrito(${JSON.stringify(p)})'>Agregar al carrito</button>
        </div>
      </div>
    `).join("");

    paginacion.innerHTML = "";
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === paginaActual) btn.classList.add("active");
      btn.addEventListener("click", () => {
        paginaActual = i;
        render();
      });
      paginacion.appendChild(btn);
    }
  }

  // Eventos de modales y formulario (agregados al DOMContentLoaded para evitar errores)

  const abrirCarritoBtn = document.getElementById('abrir-carrito');
  const cerrarModalCarritoBtn = document.getElementById('cerrar-modal-carrito');
  const finalizarBtn = document.getElementById('finalizar-btn');
  const cerrarFormularioBtn = document.getElementById('cerrar-modal-formulario');
  const enviarWppBtn = document.getElementById('enviar-wpp');

  abrirCarritoBtn?.addEventListener('click', () => {
    document.getElementById('modal-carrito').style.display = 'block';
  });

  cerrarModalCarritoBtn?.addEventListener('click', () => {
    document.getElementById('modal-carrito').style.display = 'none';
  });

  finalizarBtn?.addEventListener('click', () => {
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }
    document.getElementById('modal-carrito').style.display = 'none';
    document.getElementById('modal-formulario').style.display = 'block';
  });

  cerrarFormularioBtn?.addEventListener('click', () => {
    document.getElementById('modal-formulario').style.display = 'none';
  });

  window.addEventListener('click', function(event) {
    const modalCarrito = document.getElementById('modal-carrito');
    const modalFormulario = document.getElementById('modal-formulario');
    if (event.target === modalCarrito) modalCarrito.style.display = 'none';
    if (event.target === modalFormulario) modalFormulario.style.display = 'none';
  });

  enviarWppBtn?.addEventListener('click', (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    if (!nombre || !correo || !direccion || !telefono) {
      alert("Por favor completá todos los datos.");
      return;
    }

    let mensaje = `Hola, quiero hacer un pedido:\n\n`;
    carrito.forEach(p => {
      mensaje += `• ${p.nombre} (Código: ${p.id}) x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(2)}\n`;
    });

    const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    mensaje += `\n💰 Total a pagar: $${total.toFixed(2)}\n\n`;
    mensaje += `🧾 Datos del cliente:\n`;
    mensaje += `• Nombre: ${nombre}\n`;
    mensaje += `• Correo: ${correo}\n`;
    mensaje += `• Dirección: ${direccion}\n`;
    mensaje += `• Teléfono: ${telefono}`;

    const url = `https://wa.me/5492241540585?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  });
});

// Carrito y funciones auxiliares

const carrito = [];

function agregarAlCarrito(producto) {
  const existente = carrito.find(item => item.id === producto.id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarCarrito();
  mostrarToast();
  actualizarCarritoUI();
}

function actualizarCarrito() {
  const lista = document.getElementById('carrito-lista');
  const totalDiv = document.getElementById('carrito-total');
  if (!lista || !totalDiv) return;

  lista.innerHTML = '';
  let total = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const li = document.createElement('li');
    li.innerHTML = `
      ${item.nombre} (Cod: ${item.id}) - $${item.precio.toFixed(2)} c/u
      <input type="number" min="1" value="${item.cantidad}" style="width: 50px; margin-left: 10px;" onchange="cambiarCantidad(${index}, this.value)">
      <button onclick="eliminarDelCarrito(${index})" style="margin-left: 10px;">❌</button>
    `;
    lista.appendChild(li);
  });

  totalDiv.textContent = `Total a pagar: $${total.toFixed(2)}`;
  actualizarCarritoUI();
}

function cambiarCantidad(index, valor) {
  const nuevaCantidad = parseInt(valor);
  carrito[index].cantidad = nuevaCantidad > 0 ? nuevaCantidad : 1;
  actualizarCarrito();
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

function actualizarCarritoUI() {
  const totalCantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const contador = document.getElementById('contador-carrito');
  if (contador) contador.textContent = totalCantidad;
}

function mostrarToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.add('mostrar');
    setTimeout(() => {
      toast.classList.remove('mostrar');
    }, 2000);
  }
}
