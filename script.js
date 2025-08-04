document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  const searchInput = document.getElementById("searchInput");
  const categoriaSelect = document.getElementById("categoriaSelect");
  const origenSelect = document.getElementById("origenSelect");
  const paginacion = document.getElementById("paginacion");

  const productosPorPagina = 20;
  let productos = [];
  let paginaActual = 1;
  let categoriaActual = "todos";
  let origenActual = "todos";
  let busquedaActual = "";

  fetch("catalogo_productos_con_categorias.json")
    .then(res => res.json())
    .then(data => {
      productos = data;
      cargarFiltros();
      render();
    });

  function cargarFiltros() {
    const categorias = ["todos", ...new Set(productos.map(p => p.categoria))];
    const origenes = ["todos", ...new Set(productos.map(p => p.origen))];

    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaSelect.appendChild(option);
    });

    origenes.forEach(o => {
      const option = document.createElement("option");
      option.value = o;
      option.textContent = o;
      origenSelect.appendChild(option);
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

  origenSelect.addEventListener("change", e => {
    origenActual = e.target.value;
    paginaActual = 1;
    render();
  });

  function render() {
    const filtrados = productos.filter(p => {
      const coincideBusqueda =
        p.nombre.toLowerCase().includes(busquedaActual) ||
        p.id.toLowerCase().includes(busquedaActual);
      const coincideCategoria = categoriaActual === "todos" || p.categoria === categoriaActual;
      const coincideOrigen = origenActual === "todos" || p.origen === origenActual;
      return coincideBusqueda && coincideCategoria && coincideOrigen;
    });

    const totalPaginas = Math.ceil(filtrados.length / productosPorPagina);
    const inicio = (paginaActual - 1) * productosPorPagina;
    const visibles = filtrados.slice(inicio, inicio + productosPorPagina);

    catalogo.innerHTML = visibles.map(p => `
      <div class="card">
        <h3>${p.nombre}</h3>
        <p><strong>ID:</strong> ${p.id}</p>
        <p><strong>Categoría:</strong> ${p.categoria}</p>
        <p><strong>Origen:</strong> ${p.origen}</p>
      </div>
    `).join("");

    // paginación
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
