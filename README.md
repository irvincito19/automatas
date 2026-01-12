# Sistema de Evaluación Académica

## Descripción
Sistema web para administrar evaluaciones con cuestionarios Likert. Incluye 5 ejercicios matemáticos con cuestionarios post-tarea y un cuestionario general final.

## Instalación

### Requisitos
- Node.js (v14+)
- npm

### Pasos
1. Descargar el proyecto
2. Instalar dependencias:
   ```bash
   npm install express ejs sqlite3 csv-writer


Colocar imágenes de ejercicios en public/:

p1.png, p2.png, p3.png, p4.png, p5.png

Ejecutar el servidor:

bash
node server.js
Abrir en el navegador: http://localhost:3003

Estructura del Proyecto
text
/
├── server.js          # Servidor principal
├── db.sqlite         # Base de datos
├── package.json      # Dependencias
├── public/           # Archivos estáticos
│   ├── p1.png       # Imágenes
│   └── bootstrap.min.css
└── views/            # Plantillas EJS
    ├── registro.ejs
    ├── pregunta.ejs
    ├── likert_pregunta.ejs
    ├── likert.ejs
    ├── final.ejs
    └── resultados.ejs
Rutas Principales
/registro - Formulario de datos del estudiante

/pregunta/1 a /pregunta/5 - Ejercicios

/likert-pregunta/1 a /likert-pregunta/5 - Cuestionario post-tarea

/likert - Cuestionario general final

/final - Página de finalización

/resultados - Panel de administración

/exportar-todo - Descargar todos los datos en CSV

Base de Datos
Se crean 4 tablas automáticamente:

usuarios - Datos demográficos

respuestas - Respuestas a ejercicios

likert - Respuestas cuestionario general

likert_pregunta - Respuestas post-tarea

Exportación de Datos
Individual: /exportar/:id - CSV de un usuario

Completo: /exportar-todo - CSV con todos los datos

Incluye: datos demográficos, tiempos, respuestas Likert

Configuración
Modificar en server.js:

Preguntas: preguntas, preguntasLikert, preguntasPosTarea

Escalas Likert: escalaLikertPequeña, escalaLikertGrande

Imágenes: actualizar nombres en array preguntas

Solución de Problemas
Las respuestas post-tarea no se guardan
Verificar que en likert_pregunta.ejs exista:

html
<input type="hidden" name="usuario" value="<%= usuario %>">
Imágenes no se muestran
Verificar que los archivos existan en public/

Nombres deben coincidir: p1.png, p2.png, etc.

No se crea la base de datos
Dar permisos de escritura

Eliminar db.sqlite y reiniciar servidor

Uso para Investigación
Los datos exportados incluyen:

Tiempos por pregunta

Respuestas a 5 preguntas post-tarea por ejercicio

Respuestas a 10 preguntas generales

Datos demográficos completos

Licencia
Uso académico y de investigación.