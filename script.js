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

  searchInput.addEventListener("input", e => {
    busquedaActual = e.target.value.toLowerCase();
    paginaActual = 1;
    render();
  });

  categoriaSelect.addEventListener("change", e => {
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
        </div>
      </div>
    `).join("");

    // Paginación
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
});
