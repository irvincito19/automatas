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
    genero TEXT,
    semestre TEXT,
    promedio REAL,
    perfil_bachillerato TEXT,
    tiene_equipo INTEGER,
    tiene_internet INTEGER,
    region TEXT,
    habla_dialecto INTEGER,
    grupo TEXT,
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
  db.run(`CREATE TABLE IF NOT EXISTS likert (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    pregunta INTEGER,
    respuesta TEXT,
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
// Preguntas Likert
// -----------------------------
const preguntasLikert = [
  "Me sentí seguro resolviendo el examen",
  "Las preguntas fueron claras",
  "El tiempo fue suficiente",
  "El nivel de dificultad fue adecuado",
  "Me sentí preparado para el examen",
  "Las instrucciones fueron claras",
  "El examen evaluó mis conocimientos",
  "Me sentí cómodo durante el examen",
  "El formato del examen fue adecuado",
  "Recomendaría este tipo de evaluación"
];

const escalaLikert = [
  "Nada",
  "Muy poco",
  "Poco",
  "No tanto",
  "Mucho"
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
  const { 
    nombre, 
    edad, 
    genero, 
    semestre, 
    promedio, 
    perfil_bachillerato, 
    tiene_equipo, 
    tiene_internet, 
    region, 
    habla_dialecto, 
    grupo 
  } = req.body;
  
  const inicio = new Date().toISOString();

  db.run(
    `INSERT INTO usuarios(
      nombre, edad, genero, semestre, promedio, 
      perfil_bachillerato, tiene_equipo, tiene_internet, 
      region, habla_dialecto, grupo, inicio_examen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre, 
      parseInt(edad), 
      genero, 
      semestre, 
      parseFloat(promedio),
      perfil_bachillerato, 
      parseInt(tiene_equipo), 
      parseInt(tiene_internet),
      region, 
      parseInt(habla_dialecto), 
      grupo, 
      inicio
    ],
    function (err) {
      if (err) {
        console.error("Error al guardar usuario:", err);
        return res.send("Error al guardar los datos. Intenta nuevamente.");
      }
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
    [usuario, id, inicio],
    function(err) {
      if (err) console.error("Error al registrar inicio de pregunta:", err);
    }
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
    [respuesta, fin, usuario, pregunta],
    function(err) {
      if (err) console.error("Error al guardar respuesta:", err);
    }
  );

  const siguiente = parseInt(pregunta) + 1;
  if (siguiente > 5) return res.redirect(`/likert?u=${usuario}`);

  res.redirect(`/pregunta/${siguiente}?u=${usuario}`);
});

app.get("/likert", (req, res) => {
  const usuario = req.query.u;
  res.render("likert", {
    usuario,
    preguntasLikert,
    escalaLikert
  });
});

app.post("/likert", (req, res) => {
  const usuario = req.body.usuario;

  preguntasLikert.forEach((_, index) => {
    const respuesta = req.body[`p${index + 1}`];

    db.run(
      `INSERT INTO likert (usuario_id, pregunta, respuesta)
       VALUES (?, ?, ?)`,
      [usuario, index + 1, respuesta]
    );
  });

  res.redirect(`/final?u=${usuario}`);
});




// Página final y exportación CSV
app.get("/final", (req, res) => {
  const usuario = req.query.u;
  const fin = new Date().toISOString();

  db.run(
    `UPDATE usuarios SET fin_examen=? WHERE id=?`,
    [fin, usuario],
    function(err) {
      if (err) console.error("Error al actualizar fin_examen:", err);
    }
  );

  res.render("final", { usuario });
});

app.get("/exportar/:u", (req, res) => {
  const userId = req.params.u;

  db.all(
    `SELECT 
      'Examen' AS tipo,
      pregunta,
      respuesta,
      inicio_pregunta,
      fin_pregunta
    FROM respuestas
    WHERE usuario_id=?

    UNION ALL

    SELECT
      'Likert' AS tipo,
      pregunta,
      respuesta,
      NULL,
      NULL
    FROM likert
    WHERE usuario_id=?

    ORDER BY tipo, pregunta`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener respuestas:", err);
        return res.send("Error al exportar respuestas");
      }

      const writer = createObjectCsvWriter({
        path: `respuestas_usuario_${userId}.csv`,
        header: [
          { id: "tipo", title: "Tipo" },
          { id: "pregunta", title: "Pregunta" },
          { id: "respuesta", title: "Respuesta" },
          { id: "inicio_pregunta", title: "Inicio" },
          { id: "fin_pregunta", title: "Fin" }
        ]
      });

      writer.writeRecords(rows).then(() => {
        res.download(`respuestas_usuario_${userId}.csv`);
      }).catch((writeErr) => {
        console.error("Error escribiendo CSV:", writeErr);
        res.send("Error al escribir archivo CSV");
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
      u.genero,
      u.semestre,
      u.promedio,
      u.perfil_bachillerato,
      CASE u.tiene_equipo WHEN 1 THEN 'Sí' ELSE 'No' END AS tiene_equipo,
      CASE u.tiene_internet WHEN 1 THEN 'Sí' ELSE 'No' END AS tiene_internet,
      u.region,
      CASE u.habla_dialecto WHEN 1 THEN 'Sí' ELSE 'No' END AS habla_dialecto,
      u.grupo,
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
      u.genero,
      u.semestre,
      u.promedio,
      u.perfil_bachillerato,
      CASE u.tiene_equipo WHEN 1 THEN 'Sí' ELSE 'No' END AS tiene_equipo,
      CASE u.tiene_internet WHEN 1 THEN 'Sí' ELSE 'No' END AS tiene_internet,
      u.region,
      CASE u.habla_dialecto WHEN 1 THEN 'Sí' ELSE 'No' END AS habla_dialecto,
      u.grupo,
      u.inicio_examen,
      u.fin_examen,
      (strftime('%s', u.fin_examen) - strftime('%s', u.inicio_examen)) AS tiempo_total,

      SUM(CASE WHEN r.pregunta = 1 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p1,
      SUM(CASE WHEN r.pregunta = 2 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p2,
      SUM(CASE WHEN r.pregunta = 3 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p3,
      SUM(CASE WHEN r.pregunta = 4 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p4,
      SUM(CASE WHEN r.pregunta = 5 THEN (strftime('%s', r.fin_pregunta) - strftime('%s', r.inicio_pregunta)) END) AS p5,
      -- Likert (promedios por usuario)
      MAX(CASE WHEN l.pregunta = 1 THEN l.respuesta END) AS L1,
      MAX(CASE WHEN l.pregunta = 2 THEN l.respuesta END) AS L2,
      MAX(CASE WHEN l.pregunta = 3 THEN l.respuesta END) AS L3,
      MAX(CASE WHEN l.pregunta = 4 THEN l.respuesta END) AS L4,
      MAX(CASE WHEN l.pregunta = 5 THEN l.respuesta END) AS L5,
      MAX(CASE WHEN l.pregunta = 6 THEN l.respuesta END) AS L6,
      MAX(CASE WHEN l.pregunta = 7 THEN l.respuesta END) AS L7,
      MAX(CASE WHEN l.pregunta = 8 THEN l.respuesta END) AS L8,
      MAX(CASE WHEN l.pregunta = 9 THEN l.respuesta END) AS L9,
      MAX(CASE WHEN l.pregunta = 10 THEN l.respuesta END) AS L10

    FROM usuarios u
    LEFT JOIN respuestas r ON u.id = r.usuario_id
    LEFT JOIN likert l ON u.id = l.usuario_id
    GROUP BY u.id
    ORDER BY u.id;
  `;

  db.all(query, async (err, filas) => {
    if (err) {
      console.error("Error generando CSV:", err);
      return res.send("Error generando CSV");
    }

    // Preparar datos para CSV
    const datosParaCSV = filas.map(fila => ({
      id: fila.id,
      nombre: fila.nombre,
      edad: fila.edad,
      genero: fila.genero,
      semestre: fila.semestre,
      promedio: fila.promedio,
      perfil_bachillerato: fila.perfil_bachillerato,
      tiene_equipo: fila.tiene_equipo,
      tiene_internet: fila.tiene_internet,
      region: fila.region,
      habla_dialecto: fila.habla_dialecto,
      grupo: fila.grupo,
      inicio_examen: fila.inicio_examen,
      fin_examen: fila.fin_examen,
      tiempo_total: fila.tiempo_total,
      p1: fila.p1 || 0,
      p2: fila.p2 || 0,
      p3: fila.p3 || 0,
      p4: fila.p4 || 0,
      p5: fila.p5 || 0,
      L1: fila.L1,
      L2: fila.L2,
      L3: fila.L3,
      L4: fila.L4,
      L5: fila.L5,
      L6: fila.L6,
      L7: fila.L7,
      L8: fila.L8,
      L9: fila.L9,
      L10: fila.L10
    }));

    const writer = createObjectCsvWriter({
      path: "resultados_completos.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "nombre", title: "Nombre" },
        { id: "edad", title: "Edad" },
        { id: "genero", title: "Género" },
        { id: "semestre", title: "Semestre" },
        { id: "promedio", title: "Promedio" },
        { id: "perfil_bachillerato", title: "Perfil Bachillerato" },
        { id: "tiene_equipo", title: "Tiene Equipo" },
        { id: "tiene_internet", title: "Tiene Internet" },
        { id: "region", title: "Región" },
        { id: "habla_dialecto", title: "Habla Dialecto" },
        { id: "grupo", title: "Grupo" },
        { id: "inicio_examen", title: "Inicio Examen" },
        { id: "fin_examen", title: "Fin Examen" },
        { id: "tiempo_total", title: "Tiempo Total (s)" },
        { id: "p1", title: "P1 Tiempo (s)" },
        { id: "p2", title: "P2 Tiempo (s)" },
        { id: "p3", title: "P3 Tiempo (s)" },
        { id: "p4", title: "P4 Tiempo (s)" },
        { id: "p5", title: "P5 Tiempo (s)" },
        { id: "L1", title: "Likert 1" },
        { id: "L2", title: "Likert 2" },
        { id: "L3", title: "Likert 3" },
        { id: "L4", title: "Likert 4" },
        { id: "L5", title: "Likert 5" },
        { id: "L6", title: "Likert 6" },
        { id: "L7", title: "Likert 7" },
        { id: "L8", title: "Likert 8" },
        { id: "L9", title: "Likert 9" },
        { id: "L10", title: "Likert 10" }
      ]
    });

    try {
      await writer.writeRecords(datosParaCSV);
      res.download("resultados_completos.csv");
    } catch (writeErr) {
      console.error("Error escribiendo CSV:", writeErr);
      res.send("Error escribiendo archivo CSV");
    }
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

// Ruta para ver todos los datos en JSON (para debug)
app.get("/debug-usuarios", (req, res) => {
  db.all("SELECT * FROM usuarios", (err, rows) => {
    if (err) {
      console.error("Error en debug:", err);
      return res.json({ error: err.message });
    }
    res.json(rows);
  });
});

// -----------------------------
app.listen(3003, () =>
  console.log("Servidor corriendo en http://localhost:3003")
);