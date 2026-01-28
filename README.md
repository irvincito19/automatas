# Sistema de Evaluación Académica para Ejercicios de Autómatas

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

## Preparación

### Colocar imágenes de ejercicios en `public/`

Asegúrate de colocar las siguientes imágenes dentro de la carpeta `public/`:

- `p1.png`
- `p2.png`
- `p3.png`
- `p4.png`
- `p5.png`

## Ejecución del Servidor

Ejecutar el servidor con el siguiente comando:
   ```bash
   node server.js
   ```
# Rutas Principales del Proyecto

## 📋 Formularios
- **`/registro`** - Formulario de datos del estudiante
- **`/final`** - Página de finalización del estudio

## 📝 Ejercicios
- **`/pregunta/1`** a **`/pregunta/5`** - Ejercicios de programación

## 📊 Cuestionarios
- **`/likert-pregunta/1`** a **`/likert-pregunta/5`** - Cuestionario post-tarea (por ejercicio)
- **`/likert`** - Cuestionario general final

## 🔧 Administración
- **`/resultados`** - Panel de administración y visualización de datos
- **`/exportar-todo`** - Descargar todos los datos en formato CSV

## Base de Datos

### 🗃️ Tablas Automáticamente Creadas

| Tabla | Descripción | Contenido Principal |
|-------|-------------|---------------------|
| **`usuarios`** | Datos demográficos de los participantes | Información personal, fecha de registro, etc. |
| **`respuestas`** | Respuestas a los ejercicios | Soluciones, tiempos de respuesta, etc. |
| **`likert`** | Respuestas del cuestionario general | Valoraciones escala Likert general |
| **`likert_pregunta`** | Respuestas post-tarea | Valoraciones por ejercicio individual |

## Exportación de Datos

### 📥 Rutas de Exportación

| Ruta | Descripción | Formato |
|------|-------------|---------|
| **`/exportar/:id`** | Exportación individual de un usuario específico | CSV |
| **`/exportar-todo`** | Exportación completa de todos los datos | CSV |

### 📊 Contenido Exportado
Los archivos CSV incluyen:
- ✅ **Datos demográficos** completos de los usuarios
- ✅ **Tiempos** de respuesta por cada ejercicio
- ✅ **Respuestas Likert** de todos los cuestionarios
- ✅ **Metadatos** del estudio

---

## ⚙️ Configuración

### 🔧 Modificar en `server.js`:

#### **1. Preguntas del Estudio**
```javascript
// Configuración de preguntas
const preguntas = [ /* ... */ ];           // Ejercicios principales
const preguntasLikert = [ /* ... */ ];     // Cuestionario general
const preguntasPosTarea = [ /* ... */ ];   // Cuestionarios post-tarea
```
## Solución de Problemas
Las respuestas post-tarea no se guardan
 - Verificar que en likert_pregunta.ejs exista:

```html
<input type="hidden" name="usuario" value="<%= usuario %>">
```

Imágenes no se muestran
 - Verificar que los archivos existan en public/
 - Nombres deben coincidir: p1.png, p2.png, etc.

No se crea la base de datos
 - Dar permisos de escritura
 - Eliminar db.sqlite y reiniciar servidor

## Uso para Investigación
Los datos exportados incluyen:

Tiempos por pregunta

 - Respuestas a 5 preguntas post-tarea por ejercicio
 - Respuestas a 10 preguntas generales
 - Datos demográficos completos

## Licencia
Uso académico y de investigación.
