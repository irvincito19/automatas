# AI Coding Instructions for automatas-prueba-piloto

## Project Overview
Academic evaluation system for automata exercises with Likert survey assessments. Users complete 5 programming exercises and respond to Likert-scale surveys (post-task and general). Built with Express.js, SQLite, EJS templates, and CSV export functionality.

## Architecture

### Data Flow: Registration → Exercise → Survey → Export
1. **Registration** (`/registro`) - Collects user demographics (age, gender, semester, academic background, equipment/internet access, region)
2. **Exercise Loop** (`/pregunta/1-5`) - Each exercise displays image, starts timer (10 min), saves response time  
3. **Post-Task Survey** (`/likert-pregunta/:id`) - 5-item Likert survey after each exercise (runs loop: question → survey → question)
4. **General Survey** (`/likert`) - 10-item survey on GenAI usage attitudes
5. **Results Export** (`/exportar-todo`) - CSV with all demographics, response times, and Likert data

### Database Schema
- **usuarios**: Demographics + exam start/end timestamps (14 fields)
- **respuestas**: Exercise responses with timing (inicio_pregunta, fin_pregunta in ISO format)
- **likert**: Final general survey (10 questions, Likert scale values)
- **likert_pregunta**: Post-task surveys (5 items per exercise × 5 exercises)

**Key Pattern**: User ID via `?u=` query param throughout flow; always pass in hidden form inputs.

## Critical Implementation Details

### Timing Measurement
- Timestamps stored as ISO format strings (`.toISOString()`)
- Time calculations in `/resultados` and `/exportar-todo` use SQLite's `strftime('%s', col)` to convert to Unix seconds
- **Frontend timer**: `pregunta.ejs` runs countdown (10:00), stores elapsed time in hidden input `tiempoUsado`

### Survey Structure
- **preguntasLikert** (10 items): General attitudes about GenAI
- **preguntasPosTarea** (5 items): Per-exercise reflection
- **escalaLikert** array: ["Nada", "Muy poco", "Poco", "No tanto", "Mucho"]
- Form inputs named `p1`, `p2`, etc.; stored as text in DB (not numeric)

### Exercise Routing Loop
```
/pregunta/:id → POST → /likert-pregunta/:id → POST → 
  if (pregunta < 5) /pregunta/:id+1 else /likert
```
**Never** skip post-task survey (line 197 comment: "SIEMPRE ir primero al Likert post-tarea").

## Modifying Question Content

Edit in `server.js`:
- **preguntas array** (line ~63): Exercise texts + image filenames (p1.png through p5.png in `public/`)
- **preguntasLikert array** (line ~73): General survey items
- **preguntasPosTarea array** (line ~85): Post-task items

Images must be placed manually in `public/` folder; app does NOT generate them.

## CSV Export Queries

### `/exportar/:u` (Individual User)
- **Output columns**: Tipo (Examen/LikertFinal/LikertPosTarea), pregunta, item, respuesta, inicio/fin timestamps
- Creates `respuestas_usuario_{id}.csv` file

### `/exportar-todo` (All Users)
- **Output**: `resultados_completos.csv`
- **Aggregates**: Demographics, exercise times (p1–p5 in seconds), 10 general Likert responses (L1–L10), post-task responses (PT{exercise}_{item} format)
- Uses `MAX()` on Likert columns (assumes single response per question per user)
- **Header**: 120+ columns; hardcoded in lines 517–552

## Running & Debugging

**Start server**: `node server.js` (Express on default port, likely 3000 or 8080)  
**Database**: Auto-created as `./db.sqlite` on first run  
**Views**: EJS templates in `views/` – pass data as JS objects (e.g., `res.render("likert", { usuario, preguntasLikert, escalaLikert })`)

### Common Issues
- **Post-task responses not saving**: Verify `likert_pregunta.ejs` has `<input type="hidden" name="usuario">` (user ID required)
- **Timing null**: Check `inicio_pregunta` is inserted before rendering; `fin_pregunta` updates on form submit
- **CSV export fails**: Ensure user exists in `usuarios` table; verify path permissions for file write

## Patterns & Conventions

- **User tracking**: Pass user ID as URL query param (`?u={id}`) throughout session
- **Timestamps**: ISO 8601 format for DB storage; convert to Unix seconds for calculations
- **Likert responses**: Stored as text strings matching `escalaLikert` array values
- **Error handling**: Basic console.log errors; send HTML error response to user
- **No authentication**: Open system; user ID from DB auto-increment only

## Key Files
- [server.js](server.js) – All routes, DB logic, CSV generation (662 lines)
- [views/pregunta.ejs](views/pregunta.ejs) – Exercise display + timer countdown
- [views/likert_pregunta.ejs](views/likert_pregunta.ejs) – Post-task Likert UI
- [views/likert.ejs](views/likert.ejs) – General survey UI
- [views/resultados.ejs](views/resultados.ejs) – Admin results dashboard
- [package.json](package.json) – Dependencies: Express, SQLite3, EJS, csv-writer
