# TourneyPass ⚽🏆

Plataforma web para crear, organizar y gestionar torneos de fútbol (FIFA / EA Sports FC) entre amigos: ligas, copas eliminatorias y fases de grupos con estadísticas y tablas en tiempo real.

---

## 🎨 Identidad de Marca (Branding)

### 1. Nombre & Concepto
* **Nombre oficial**: **TourneyPass**
* **Slogan / Propósito**: *Tu pase a torneos de FIFA & EA Sports FC entre amigos.*
* **Personalidad de marca**: Competitiva, moderna y comunitaria. Inspirada en el ambiente de los torneos de eSports pero diseñada para los piques, la diversión y la camaradería entre amigos ("el tercer tiempo gamer").

---

### 2. Imagotipo y Activos Visuales
El isotipo fusiona la silueta de un **balón de fútbol geométrico** integrado en un **emblema digital / trofeo de torneo**, reforzado con acentos de luz neón sobre fondo oscuro.

* **Activos disponibles en `/public`**:
  * `public/logo.png`: Logotipo oficial con fondo transparente.
  * `public/logo.jpg`: Versión para fondos completos / avatares.
  * `public/favicon.ico`: Favicon multi-resolución para navegadores.
  * `public/apple-touch-icon.png`: Icono para dispositivos móviles y PWA.
  * `public/icon-192x192.png`: Icono para web app manifest.

---

### 3. Paleta de Colores Oficial ("Verde Cancha & Dark Stadium")

Diseñada con un modo oscuro inmersivo que evoca el césped iluminado bajo los reflectores de un estadio nocturno:

| Elemento | Nombre conceptual | Hex | Muestra | Uso recomendado |
| :--- | :--- | :--- | :---: | :--- |
| **Primario** | Verde Cancha | `#22C55E` | ![#22C55E](https://via.placeholder.com/15/22C55E/000000?text=+) | Botones de acción principal (CTA), insignias destacadas, badges de victoria |
| **Primario Oscuro** | Campo Profundo | `#15803D` | ![#15803D](https://via.placeholder.com/15/15803D/000000?text=+) | Gradientes, sombras de acento, estados presionados |
| **Primario Hover** | Verde Brillante | `#4ADE80` | ![#4ADE80](https://via.placeholder.com/15/4ADE80/000000?text=+) | Estados `:hover`, efectos glow, textos de énfasis |
| **Fondo Principal** | Verde Casi Negro | `#071A12` | ![#071A12](https://via.placeholder.com/15/071A12/000000?text=+) | Background global de la aplicación (`body`) |
| **Fondo Secundario** | Superficie Estadio | `#0D2419` | ![#0D2419](https://via.placeholder.com/15/0D2419/000000?text=+) | Header, footer, barras laterales de navegación |
| **Contenedores / Cards** | Tarjeta Cancha | `#122D20` | ![#122D20](https://via.placeholder.com/15/122D20/000000?text=+) | Cards de partidos, tablas de posiciones, modales |
| **Texto Principal** | Blanco Balón | `#F4F4EE` | ![#F4F4EE](https://via.placeholder.com/15/F4F4EE/000000?text=+) | Encabezados, títulos, marcadores principales |
| **Texto Secundario** | Gris Césped | `#B9C5BD` | ![#B9C5BD](https://via.placeholder.com/15/B9C5BD/000000?text=+) | Subtítulos, estadísticas secundarias, fechas |
| **Bordes & Líneas** | Línea de Cal | `#234334` | ![#234334](https://via.placeholder.com/15/234334/000000?text=+) | Divisores de tablas, bordes de tarjetas y tarjetas de fixture |

#### Tokens CSS (disponibles en `app/globals.css`)
```css
:root {
  --color-pitch: #22C55E;
  --color-pitch-dark: #15803D;
  --color-pitch-hover: #4ADE80;
  --color-field-bg: #071A12;
  --color-field-surface: #0D2419;
  --color-field-card: #122D20;
  --color-ball-white: #F4F4EE;
  --color-text-secondary: #B9C5BD;
  --color-field-border: #234334;
}
```

---

### 4. Tipografía & Estilo Visual

| Elemento | Tipografía | Peso / Estilo | Uso & Propósito |
| :--- | :--- | :--- | :--- |
| **Logo / Nombre** | `Barlow Condensed` | **800** (ExtraBold) | Impacto deportivo, identidad eSports |
| **H1 / H2** | `Barlow Condensed` | **700** (Bold) | Títulos de torneos, cabeceras principales |
| **Nombres de equipos** | `Barlow` | **600** (SemiBold) | Legibilidad limpia en tarjetas y listas |
| **Marcadores** | `Barlow Condensed` | **700** (Bold) | Números condensados estilo tablero de estadio |
| **Botones** | `Inter` | **600** (SemiBold) | Llamados a la acción (CTA), interactividad clara |
| **Tablas** | `Inter` | **400–600** (Regular/SemiBold) | Tablas de posiciones, fixtures, estadísticas densas |
| **Texto general** | `Inter` | **400** (Regular) | Párrafos, descripciones y contenido general |

* **Efectos de Iluminación & Estadio**:
  * Glow sutil verde césped (`glow-pitch`: `0 0 25px -5px rgba(34, 197, 94, 0.4)`).
  * Tarjetas con efecto vidrio esmerilado sobre verde profundo (`backdrop-blur-md` + borde `#234334`).

---

## 🚀 Próximas Secciones de la Base del Proyecto
- [ ] **Arquitectura Técnica & Stack** (Next.js App Router, Tailwind CSS, Supabase).
- [ ] **Modelo de Datos** (Torneos, Participantes, Partidos, Clasificación).
- [ ] **Formatos Soportados** (Ligas, Copas/Playoffs, Fases de Grupos).
- [ ] **Guía de Despliegue y Configuración**.
