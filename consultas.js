const { Pool } = require("pg");
const format = require("pg-format");

/* conexión  */
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "1234",
  database: "joyas",
  allowExitOnIdle: true,
});

const columnasPermitidas = [
  "id",
  "nombre",
  "categoria",
  "metal",
  "precio",
  "stock",
];

// Función para obtener joyas
const obtenerJoyas = async ({ limits = 10, order_by = "id_ASC", page = 0 }) => {
  const [columna, orden] = order_by.split("_");

  const offset = page * limits;
  const consulta = format(
    "SELECT * FROM inventario ORDER BY %s %s LIMIT %s OFFSET %s",
    columna,
    orden,
    limits,
    offset
  );

  try {
    const { rows: inventario } = await pool.query(consulta);

    // Calcular stockTotal
    const stockTotal = inventario.reduce(
      (total, item) => total + item.stock,
      0
    );

    return { totalJoyas: inventario.length, stockTotal, results: inventario };
  } catch (error) {
    console.error("Error ejecutando la consulta:", error);
    throw new Error("Error al obtener las joyas.");
  }
};

// Función para filtrar joyas
const filtrarJoyas = async (filtros) => {
  const { precio_min, precio_max, categoria, metal } = filtros;

  let condiciones = [];
  let valores = [];

  // Construir condiciones SQL
  if (precio_min) {
    condiciones.push(`precio >= $${valores.length + 1}`);
    valores.push(precio_min);
  }
  if (precio_max) {
    condiciones.push(`precio <= $${valores.length + 1}`);
    valores.push(precio_max);
  }
  if (categoria) {
    condiciones.push(`categoria = $${valores.length + 1}`);
    valores.push(categoria);
  }
  if (metal) {
    condiciones.push(`metal = $${valores.length + 1}`);
    valores.push(metal);
  }

  //consulta SQL
  let consulta = "SELECT * FROM inventario";
  if (condiciones.length > 0) {
    consulta += " WHERE " + condiciones.join(" AND ");
  }

  try {
    const { rows: inventario } = await pool.query(consulta, valores);
    const stockTotal = inventario.reduce(
      (total, item) => total + item.stock,
      0
    );
    return { totalJoyas: inventario.length, stockTotal, results: inventario };
  } catch (error) {
    console.error("Error ejecutando la consulta:", error);
    throw new Error("Error al obtener las joyas.");
  }
};

module.exports = { obtenerJoyas, filtrarJoyas };
