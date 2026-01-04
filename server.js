const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// -----------------------------
// DB
// -----------------------------
const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    edad INTEGER,
    semestre TEXT,
    inicio_examen TEXT,
    fin_examen TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    pregunta INTEGER,
    respuesta TEXT,
    inicio_pregunta TEXT,
    fin_pregunta TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`);
});

// -----------------------------
// Preguntas
// -----------------------------
const preguntas = [
  { id: 1, texto: "Resuelve el ejercicio 1", img: "p1.png" },
  { id: 2, texto: "Resuelve el ejercicio 2", img: "p2.png" },
  { id: 3, texto: "Resuelve el ejercicio 3", img: "p3.png" },
  { id: 4, texto: "Resuelve el ejercicio 4", img: "p4.png" },
  { id: 5, texto: "Resuelve el ejercicio 5", img: "p5.png" }
];

// -----------------------------
// RUTAS
// -----------------------------
app.get("/", (req, res) => {
  res.redirect("/registro");
});

// Formulario de registro
app.get("/registro", (req, res) => {
  res.render("registro");
});

// Guardar usuario e iniciar examen
app.post("/registro", (req, res) => {
  const { nombre, edad, semestre } = req.body;
  const inicio = new Date().toISOString();

  db.run(
    `INSERT INTO usuarios(nombre, edad, semestre, inicio_examen)
     VALUES (?, ?, ?, ?)`,
    [nombre, edad, semestre, inicio],
    function (err) {
      res.redirect(`/pregunta/1?u=${this.lastID}`);
    }
  );
});

// Mostrar pregunta
app.get("/pregunta/:id", (req, res) => {
  const usuario = req.query.u;
  const id = parseInt(req.params.id);
  const pregunta = preguntas.find((p) => p.id === id);

  if (!pregunta) return res.redirect(`/final?u=${usuario}`);

  const inicio = new Date().toISOString();

  db.run(
    `INSERT INTO respuestas(usuario_id, pregunta, inicio_pregunta)
     VALUES (?, ?, ?)`,
    [usuario, id, inicio]
  );

  res.render("pregunta", { pregunta, usuario });
});

// Guardar respuesta y pasar a la siguiente
app.post("/pregunta/:id", (req, res) => {
  const usuario = req.body.usuario;
  const pregunta = req.params.id;
  const respuesta = req.body.respuesta;
  const fin = new Date().toISOString();

  db.run(
    `UPDATE respuestas SET respuesta=?, fin_pregunta=?
     WHERE usuario_id=? AND pregunta=?`,
    [respuesta, fin, usuario, pregunta]
  );

  const siguiente = parseInt(pregunta) + 1;
  if (siguiente > 5) return res.redirect(`/final?u=${usuario}`);

  res.redirect(`/pregunta/${siguiente}?u=${usuario}`);
});

// Página final y exportación CSV
app.get("/final", (req, res) => {
  const usuario = req.query.u;
  const fin = new Date().toISOString();

  db.run(
    `UPDATE usuarios SET fin_examen=? WHERE id=?`,
    [fin, usuario],
    () => {}
  );

  res.render("final", { usuario });
});

app.get("/exportar/:u", (req, res) => {
  const userId = req.params.u;

  db.all(
    `SELECT * FROM respuestas WHERE usuario_id=?`,
    [userId],
    (err, rows) => {
      const writer = createObjectCsvWriter({
        path: `respuestas_usuario_${userId}.csv`,
        header: [
          { id: "pregunta", title: "Pregunta" },
          { id: "respuesta", title: "Respuesta" },
          { id: "inicio_pregunta", title: "Inicio" },
          { id: "fin_pregunta", title: "Fin" }
        ]
      });

      writer.writeRecords(rows).then(() => {
        res.download(`respuestas_usuario_${userId}.csv`);
      });
    }
  );
});






app.get("/resultados", (req, res) => {
  db.all(
    `
    SELECT 
      u.id,
      u.nombre,
      u.edad,
      u.semestre,
      u.inicio_examen,
      u.fin_examen,
      (strftime('%s', u.fin_examen) - strftime('%s', u.inicio_examen)) AS tiempo_total,

      -- Tiempos por pregunta
      SUM(CASE WHEN r.pregunta = 1 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p1,
      SUM(CASE WHEN r.pregunta = 2 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p2,
      SUM(CASE WHEN r.pregunta = 3 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p3,
      SUM(CASE WHEN r.pregunta = 4 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p4,
      SUM(CASE WHEN r.pregunta = 5 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p5

    FROM usuarios u
    LEFT JOIN respuestas r ON u.id = r.usuario_id
    GROUP BY u.id
    ORDER BY u.id DESC
  `,
    (err, filas) => {
      if (err) {
        console.error(err);
        return res.send("Error al obtener resultados");
      }

      res.render("resultados", { filas });
    }
  );
});



app.get("/exportar-todo", (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.edad,
      u.semestre,
      u.inicio_examen,
      u.fin_examen,
      (strftime('%s', u.fin_examen) - strftime('%s', u.inicio_examen)) AS tiempo_total,

      SUM(CASE WHEN r.pregunta = 1 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p1,
      SUM(CASE WHEN r.pregunta = 2 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p2,
      SUM(CASE WHEN r.pregunta = 3 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p3,
      SUM(CASE WHEN r.pregunta = 4 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p4,
      SUM(CASE WHEN r.pregunta = 5 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p5

    FROM usuarios u
    LEFT JOIN respuestas r ON u.id = r.usuario_id
    GROUP BY u.id
    ORDER BY u.id;
  `;

  db.all(query, async (err, filas) => {
    if (err) return res.send("Error generando CSV");

    const writer = createObjectCsvWriter({
      path: "resultados_completos.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "nombre", title: "Nombre" },
        { id: "edad", title: "Edad" },
        { id: "semestre", title: "Semestre" },
        { id: "inicio_examen", title: "Inicio Examen" },
        { id: "fin_examen", title: "Fin Examen" },
        { id: "tiempo_total", title: "Tiempo Total (s)" },
        { id: "p1", title: "P1 Tiempo (s)" },
        { id: "p2", title: "P2 Tiempo (s)" },
        { id: "p3", title: "P3 Tiempo (s)" },
        { id: "p4", title: "P4 Tiempo (s)" },
        { id: "p5", title: "P5 Tiempo (s)" }
      ]
    });

    await writer.writeRecords(filas);

    res.download("resultados_completos.csv");
  });
});


app.get("/borrar-todo", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM respuestas");
    db.run("DELETE FROM usuarios");
  });

  res.redirect("/resultados");
});



app.get("/borrar-usuario/:id", (req, res) => {
  const id = req.params.id;

  db.serialize(() => {
    db.run("DELETE FROM respuestas WHERE usuario_id = ?", [id]);
    db.run("DELETE FROM usuarios WHERE id = ?", [id]);
  });

  res.redirect("/resultados");
});


app.get('/borrar/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM respuestas WHERE id = ?", [id], function(err) {
        if (err) {
            console.error("Error al borrar registro:", err);
            return res.send("Error al borrar");
        }
        res.redirect('/resultados');
    });
});





// -----------------------------
app.listen(3000, () =>
  console.log("Servidor corriendo en http://localhost:3000")
);
