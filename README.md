# Guía de Campo: Protocolo Tirano (Edición Final)

## 1. El Propósito de esta Guerra

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Medir la Versatilidad:** Determinar matemáticamente quién es el jugador más versátil a través de una puntuación. El ganador de este ranking es el campeón de la temporada.
2.  **Generar una Lista Jerarquizada:** Ordenar los juegos según el deseo colectivo para eliminar el debate sobre "a qué jugar".
3.  **Otorgar Poder:** Recompensar al jugador con mayor influencia y reputación con el poder de dirigir la sesión de juego.

El sistema está diseñado para que cada acción estratégica tenga un coste. No hay lugar para la explotación.

## 2. El Arsenal: Reglas de Combate

Cada jugador gestiona una serie de recursos que definen su influencia en la partida.

### Tokens de Prioridad: La Moneda de la Influencia
* **Votar "3" (Prioridad Alta):** Cuesta **1 Token de Prioridad**.
* **Votar "0" (Rechazo Absoluto):** Genera **1 Token de Prioridad**.
* **Votos "2" y "1":** Son gratuitos en términos de Tokens.
* **Capital Inicial:** Cada jugador comienza con **3 Tokens**.

### La Economía del Prestigio
El Prestigio es una puntuación de carrera que mide tu reputación y buen hacer.
* **Ganancia Positiva:**
    * Ganas **+1 de Prestigio** por el **primer voto de "3"** que reciba un juego que tú nominaste (emitido por otro jugador).
    * Ganas **+0.5 de Prestigio** cada vez que emites un voto **"1" (Tolerable)**.
* **Pérdida Negativa:**
    * Sufres **-3 de Prestigio** si una de tus nominaciones es vetada.
    * Sufres **-1 de Prestigio** cada vez que **modificas un voto** ya emitido.

### Vetos: La Bala de Plata
* **Asignación:** Cada jugador tiene **un (1) Veto**. No se regenera.
* **Condición de Uso:** Para vetar un juego, es **obligatorio** haberle votado **"0"** previamente.

## 3. El Campo de Batalla: La Votación

### Nominaciones
* **Cola de Nominación:** No puedes nominar un juego nuevo si ya tienes una propuesta tuya en curso.
* **Cancelación Táctica:** Puedes cancelar tu propia nominación pendiente, pero al hacerlo, sufres un **cooldown de 24 horas**.

### El Voto Sellado
Para eliminar el "voto parásito" y forzar la honestidad, las votaciones son secretas.
1.  **Inicio:** Al nominar un juego, se inicia un **temporizador de 24 horas**.
2.  **Votación:** Durante ese tiempo, los jugadores emiten su voto. Solo podrás ver *quién* ha votado, pero no el valor (aparecerá como "?").
3.  **Revelación:** Pasadas las 24h (o si el admin lo fuerza), todos los votos se revelan y se calculan los efectos.
4.  **Penalización por Inacción:** Los jugadores que no voten en el plazo sufrirán una penalización de **-1 de Prestigio** y su voto se registrará automáticamente como un "0".

## 4. La Recompensa Final: La Decisión del Estratega

Este es el poder que otorga el Prestigio.
* **La Regla:** El jugador con la puntuación más alta de **Prestigio** en el momento de decidir a qué jugar obtiene el poder de **"La Decisión del Estratega"**.
* **El Poder:** El Estratega tiene la autoridad final para **elegir a qué juego se juega de entre los tres (3) primeros juegos *jugables*** de la Lista Jerarquizada.
    * Un juego "jugable" es aquel que no está vetado ni bloqueado por un voto de "0".
* **Empate:** En caso de empate en el Prestigio, el poder no se otorga y se debe jugar al primer juego jugable de la lista.

## 5. Doctrina del Meta-juego (Cláusula de Guerra Psicológica)
Se reconoce explícitamente que la competición no se limita a la interfaz.
* **Todas las tácticas de comunicación, negociación, alianzas, amenazas y faroles que ocurran fuera de la aplicación son consideradas parte legítima del meta-juego.**
* La habilidad de un jugador para manipular a sus oponentes es tan válida como su habilidad para gestionar sus recursos.

---
*Este documento es la única fuente de verdad sobre las reglas del Protocolo. Cualquier disputa se resolverá consultando esta guía.*
