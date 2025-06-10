# Guía de Campo: Protocolo de la Inercia (Versión Definitiva)

## 1. El Propósito de esta Guerra

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Coronar al Jugador Más Versátil:** Determinar al campeón a través de la **Puntuación de Versatilidad**.
2.  **Generar un Campo de Batalla:** Ordenar los juegos según el deseo colectivo a través de la **Puntuación de Juego**.
3.  **Otorgar el Poder del Estratega:** Recompensar al jugador con mayor **Prestigio** con la autoridad final sobre la elección del juego.

El sistema está diseñado para que tu reputación actual sea tu mayor arma y tu constancia una fuente de poder.

## 2. El Arsenal: La Economía de la Inercia

### Puntuación de Versatilidad: El Poder Dinámico de la Reputación
La Puntuación de Versatilidad de un jugador es un valor dinámico que el servidor recalcula constantemente.
* **Fórmula de Puntuación:** Para cada juego, tus puntos se calculan con: `Puntos = Valor de tu Voto * (1 + Tu Prestigio Actual / 10)`.
* **Valoración Continua:** Tu puntuación total es la suma de los puntos de todos los juegos, recalculada siempre con tu Prestigio más reciente. Si tu Prestigio sube, el valor de tus votos pasados también aumenta.

### El Prestigio: Tu Reputación como Arma
El Prestigio es el activo más importante. Alimenta tu capacidad de puntuar y te da poder.
* **Ganancia Positiva:**
    * **+0.5 de Prestigio:** Cada vez que emites un voto "1" (Tolerable).
    * **+0.1 de Prestigio:** Cada vez que emites un voto "2" (Apoyo Moderado).
* **Pérdida Negativa:**
    * **-0.5 de Prestigio:** Cada vez que emites un voto "0" (Rechazo).
    * **-1 de Prestigio:** Cada vez que modificas un voto ya emitido.

### Tokens de Prioridad y Fragmentos: El Capital para la Ofensiva
El sistema de Tokens se gestiona internamente para evitar trampas.
* **Voto "3" (Prioridad Máxima):** Cuesta **1 Token**. No puedes votar 3 si no tienes Tokens disponibles. El gasto se hace efectivo al finalizar la votación.
* **Voto "2" (Apoyo Moderado):** Genera **1 Fragmento de Token** al finalizar la votación. Al acumular 3 Fragmentos, se convierten automáticamente en 1 Token completo.
* **Voto "1" (Tolerable):** No tiene efecto en los Tokens. Su recompensa es el Prestigio.
* **Voto "0" (Rechazo):** Genera **1 Token** completo al finalizar la votación.
* **Capital Inicial:** Cada jugador comienza con **3 Tokens** y **0 Fragmentos**.

### Votación y Vetos
* **Lista Abierta:** Cualquier jugador puede añadir juegos a la lista en cualquier momento.
* **Voto Sellado:** Los votos permanecen ocultos hasta que los cuatro jugadores hayan votado, momento en el que todas las consecuencias se aplican y la votación finaliza.
* **Vetos:** Cada jugador tiene un (1) Veto. Para usarlo, el juego debe estar "activo" y debes haberle votado "0". El único coste es el Veto en sí.

## 3. La Recompensa Final: La Decisión del Estratega
* **La Regla:** El jugador con la puntuación más alta de Prestigio obtiene el poder.
* **El Poder:** Elige a qué juego se juega de entre los tres (3) primeros juegos *jugables* (sin vetos ni votos de "0") de la lista.

---
*Este documento es la única fuente de verdad sobre las reglas del Protocolo. Cualquier disputa se resolverá consultando esta guía.*
