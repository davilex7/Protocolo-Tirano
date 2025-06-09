# Guía de Campo: Protocolo Tirano (Edición Final)

## 1. El Propósito de esta Guerra

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Medir la Versatilidad:** Determinar matemáticamente quién es el jugador más versátil a través de la **Puntuación de Versatilidad**. El ganador de este ranking al final de la temporada es el campeón. Esta puntuación es la suma total de los valores de los votos (0, 1, 2, 3) que un jugador ha emitido en todos los juegos activos.
2.  **Generar una Lista Jerarquizada:** Ordenar los juegos según el deseo colectivo para eliminar el debate sobre "a qué jugar".
3.  **Otorgar Poder:** Recompensar al jugador con mayor reputación (medida por el **Prestigio**) con el poder de dirigir la sesión de juego.

El sistema está diseñado para que cada acción estratégica tenga un coste. No hay lugar para la explotación.

## 2. El Arsenal: Reglas de Combate

Cada jugador gestiona dos puntuaciones distintas y una serie de recursos que definen su influencia.

### Tokens de Prioridad: La Moneda de la Influencia
* **Votar "3" (Prioridad Alta):** Cuesta **1 Token de Prioridad**.
* **Votar "0" (Rechazo Absoluto):** Genera **1 Token de Prioridad**. También se genera 1 Token si no se vota y el sistema asigna un "0" automático.
* **Votos "2" y "1":** Son gratuitos en términos de Tokens.
* **Capital Inicial:** Cada jugador comienza con **3 Tokens**.

### La Economía del Prestigio
El Prestigio es una puntuación de carrera que mide tu reputación y buen hacer. **Su única función es determinar quién obtiene "La Decisión del Estratega"**.
* **Ganancia Positiva:**
    * Ganas **+1 de Prestigio** por el **primer voto de "3"** que reciba un juego que tú nominaste (emitido por otro jugador).
    * Ganas **+0.5 de Prestigio** cada vez que emites un voto **"1" (Tolerable)**.
* **Pérdida Negativa:**
    * Sufres **-3 de Prestigio** si una de tus nominaciones es vetada.
    * Sufres **-1 de Prestigio** cada vez que **modificas un voto** ya emitido.
    * Sufres **-1 de Prestigio** si no votas en el plazo de 24 horas.

### Vetos: La Bala de Plata
* **Asignación:** Cada jugador tiene **un (1) Veto**. No se regenera.
* **Condición de Uso:** Para vetar un juego, se deben cumplir dos condiciones:
    1.  El juego debe estar en estado **"activo"** (es decir, su período de votación ya ha finalizado).
    2.  Es **obligatorio** haberle votado **"0"** previamente durante la fase de votación.

## 3. El Campo de Batalla: La Votación

### Nominaciones
* **Cola de Nominación:** No puedes nominar un juego nuevo si ya tienes una propuesta tuya en curso (en estado de "votación").

### El Voto Sellado
Para eliminar el "voto parásito" y forzar la honestidad, las votaciones son secretas.
1.  **Inicio:** Al nominar un juego, se inicia un **temporizador de 24 horas**.
2.  **Votación:** Durante ese tiempo, los jugadores emiten su voto. Solo podrás ver *quién* ha votado, pero no el valor (aparecerá como "?").
3.  **Revelación:** Pasadas las 24h (o si el admin lo fuerza), todos los votos se revelan y se calculan los efectos.
4.  **Penalización por Inacción:** Los jugadores que no voten en el plazo sufrirán una penalización de **-1 de Prestigio** y su voto se registrará automáticamente como un "0", con las subsecuentes consecuencias.

## 4. La Recompensa Final: La Decisión del Estratega

Este es el poder que otorga el Prestigio.
* **La Regla:** El jugador con la puntuación más alta de **Prestigio** en el momento de decidir a qué jugar obtiene el poder de **"La Decisión del Estratega"**.
* **El Poder:** El Estratega tiene la autoridad final para **elegir a qué juego se juega de entre los tres (3) primeros juegos *jugables*** de la Lista Jerarquizada.
    * Un juego "jugable" es aquel que **no está vetado** y **no tiene ningún voto de "0"** en su registro final.
* **Empate:** En caso de empate en el Prestigio, el poder no se otorga a nadie y se debe jugar al primer juego jugable de la lista.

## 5. Doctrina del Meta-juego (Cláusula de Guerra Psicológica)
Se reconoce explícitamente que la competición no se limita a la interfaz.
* **Todas las tácticas de comunicación, negociación, alianzas, amenazas y faroles que ocurran fuera de la aplicación son consideradas parte legítima del meta-juego.**
* La habilidad de un jugador para manipular a sus oponentes es tan válida como su habilidad para gestionar sus recursos.

---
*Este documento es la única fuente de verdad sobre las reglas del Protocolo. Cualquier disputa se resolverá consultando esta guía.*
