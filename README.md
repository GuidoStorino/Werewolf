# 🌕 Werewolf — Setup Guide

## Pasos para poner el juego en marcha

### 1. Crear proyecto en Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear nuevo proyecto (cualquier nombre, p.ej. `werewolf-game`)
3. **No** es necesario activar Google Analytics
4. En el menú lateral → **Realtime Database** → Crear base de datos
   - Elegir región (cualquiera)
   - Empezar en **modo de prueba** (por ahora)
5. En **Configuración del proyecto** (⚙️) → **Tus apps** → Agregar app web (`</>`)
   - Registrar la app con cualquier nombre
   - Copiar el objeto `firebaseConfig`

### 2. Configurar el proyecto

```bash
# Instalar dependencias
npm install

# Editar src/firebase.js con tu configuración
```

Abrir `src/firebase.js` y reemplazar los valores:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 3. Reglas de seguridad en Firebase

En Firebase Console → Realtime Database → **Reglas**, pegá esto:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

> ⚠️ Para producción, configurar reglas más estrictas.

### 4. Correr el juego

```bash
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

### 5. Deployar (opcional)

```bash
npm run build
```

El contenido de `/dist` se puede subir a:
- **Firebase Hosting**: `firebase deploy`
- **Netlify**: arrastrar carpeta `/dist`
- **Vercel**: `vercel --prod`

---

## Cómo jugar

### El host:
1. Crea una sala configurando cantidad de jugadores y roles
2. Comparte el **código de 6 letras** con los demás
3. Cuando todos se unan, presiona **Comenzar el juego**
4. Durante el juego, el host controla el avance de las fases

### Los jugadores:
1. Ingresan a `werewolf.tudominio.com`
2. Ponen su nombre y el código de sala
3. Esperan a que el host inicie

### Flujo del juego:
```
LOBBY → NOCHE (lobos/alquimista/cazador) → DÍA (anuncio + discusión) → VOTACIÓN → [repite]
```

---

## Roles

| Rol | Equipo | Descripción |
|-----|--------|-------------|
| 🧑‍🌾 Forastero | Pueblo | Aldeano sin habilidades especiales |
| 🐺 Hombre Lobo | Lobos | Elimina a alguien cada noche |
| 🏹 Cazador | Pueblo | Espía el rol de alguien cada noche |
| ⚗️ Alquimista | Pueblo | Da una poción que salva de la muerte |

---

## Estructura del proyecto

```
src/
├── firebase.js          ← Configuración Firebase (EDITAR)
├── App.jsx              ← Router principal
├── styles.css           ← Estilos globales
├── hooks/
│   ├── useGame.js       ← Suscripción a Firebase en tiempo real
│   └── useCountdown.js  ← Timer de discusión
├── utils/
│   ├── game.js          ← Lógica del juego y constantes
│   └── actions.js       ← Todas las operaciones con Firebase
└── components/
    ├── HomeScreen.jsx    ← Crear/unirse a sala
    ├── LobbyScreen.jsx   ← Sala de espera
    ├── NightScreen.jsx   ← Fase nocturna
    ├── DayScreen.jsx     ← Anuncio y discusión
    ├── VoteScreen.jsx    ← Votación
    ├── VoteResolveScreen.jsx ← Resultado de votación
    └── EndScreen.jsx     ← Fin del juego
```
