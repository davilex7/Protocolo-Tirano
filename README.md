# Guía de Campo: Protocolo del Convicto (Versión Definitiva)

## 1. El Propósito de esta Guerra

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Coronar al Jugador Más Versátil:** Determinar al campeón a través de la **Puntuación de Versatilidad**.
2.  **Generar un Campo de Batalla:** Ordenar los juegos según el deseo colectivo a través de la **Puntuación de Juego**.
3.  **Otorgar el Poder del Estratega:** Recompensar al jugador con mayor **Prestigio** con la autoridad final sobre la elección del juego.

El sistema está diseñado para que tu reputación sea tu mayor arma y tu convicción la clave de la victoria.

## 2. El Arsenal: La Economía del Convicto

### Puntuación de Versatilidad: El Poder de la Reputación
La Puntuación de Versatilidad es un valor dinámico que el servidor recalcula constantemente. No es una suma fija.
* **Fórmula de Puntuación:** `Puntos de Juego = Valor del Voto + ((Prestigio Actual / 10) * Factor de Especialización)`
* **Factores de Especialización:**
    * **Voto `3`:** Factor **4** (El Prestigio tiene un impacto masivo)
    * **Voto `2`:** Factor **0** (El Prestigio no afecta a este voto)
    * **Voto `1`:** Factor **1** (El Prestigio tiene un impacto moderado)
* **Valoración Continua:** Tu puntuación total es la suma de los puntos de todos los juegos, recalculada siempre con tu Prestigio más reciente.

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
* **Voto "3" (Prioridad Máxima):** Cuesta **1 Token**.
* **Voto "2" (Apoyo Moderado):** Genera **1 Fragmento de Token**. Al acumular 3 Fragmentos, se convierten automáticamente en 1 Token completo.
* **Voto "1" (Tolerable):** No tiene efecto en los Tokens.
* **Voto "0" (Rechazo):** Genera **1 Token** completo.
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
