# Guía de Campo: Protocolo de Valoración Continua

## 1. El Propósito de esta Guerra

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Coronar al Jugador Más Versátil:** Determinar al campeón a través de la **Puntuación de Versatilidad**.
2.  **Generar un Campo de Batalla:** Ordenar los juegos según el deseo colectivo.
3.  **Otorgar el Poder del Estratega:** Recompensar al jugador con mayor **Prestigio** con la autoridad final sobre la elección del juego.

El sistema está diseñado para que tu reputación actual sea tu mayor arma, redefiniendo constantemente el valor de tus acciones pasadas.

## 2. El Arsenal: La Economía de la Valoración Continua

### Puntuación de Versatilidad: El Poder Dinámico de la Reputación
La Puntuación de Versatilidad de un jugador es un valor dinámico que el servidor recalcula constantemente. No es una suma fija.
* **Fórmula de Puntuación:** Para cada juego, tus puntos se calculan con: `Puntos = Valor de tu Voto * (1 + Tu Prestigio Actual / 10)`.
* **Valoración Continua:** Tu puntuación total es la suma de los puntos de todos los juegos, recalculada siempre con tu Prestigio más reciente. Esto significa que si tu Prestigio sube, el valor de tus votos pasados también aumenta. Si baja, tus victorias anteriores valen menos. El orden en que votas es irrelevante.

### El Prestigio: Tu Reputación como Arma
El Prestigio es el activo más importante. Alimenta tu capacidad de puntuar y te da poder.
* **Ganancia Positiva:**
    * **+0.5 de Prestigio:** Cada vez que emites un voto "1" (Tolerable).
* **Pérdida Negativa:**
    * **-0.5 de Prestigio:** Cada vez que emites un voto "0" (Rechazo).
    * **-1 de Prestigio:** Cada vez que modificas un voto ya emitido.
    * **-3 de Prestigio:** Si usas tu Veto en un juego (penalización para el que veta).

### Tokens de Prioridad: El Capital para la Ofensiva
* **Voto "3" (Prioridad Máxima):** Cuesta **1 Token**.
* **Voto "0" (Rechazo):** Genera **1 Token**.
* **Votos "2" y "1":** Cuestan **0 Tokens**.
* **Capital Inicial:** Cada jugador comienza con **3 Tokens**.

### Votación y Vetos
* **Lista Abierta:** Cualquier jugador puede añadir juegos a la lista en cualquier momento.
* **Voto Sellado:** Los votos permanecen ocultos hasta que los cuatro jugadores hayan votado. En ese momento, la votación finaliza automáticamente.
* **Vetos:** Cada jugador tiene un (1) Veto. Para usarlo, el juego debe estar "activo" y debes haberle votado "0".

## 3. La Recompensa Final: La Decisión del Estratega
* **La Regla:** El jugador con la puntuación más alta de Prestigio obtiene el poder.
* **El Poder:** Elige a qué juego se juega de entre los tres (3) primeros juegos *jugables* (sin vetos ni votos de "0") de la lista.
* **Empate:** En caso de empate, nadie obtiene el poder y se debe jugar al primer juego jugable.

---
*Este documento es la única fuente de verdad sobre las reglas del Protocolo. Cualquier disputa se resolverá consultando esta guía.*
