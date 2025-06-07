# Guía de Campo: Protocolo Tirano (Versión Final)

## 1. ¿Qué es esta Guerra? (El Propósito)

Esta aplicación es el árbitro digital de nuestra competición. Su misión es:

1.  **Medir la Versatilidad:** Determinar matemáticamente quién es el jugador más versátil a través de un sistema de puntuación que refleja la disposición real a jugar.
2.  **Eliminar el Debate:** Generar una lista de juegos ordenada por el deseo colectivo del grupo. Cuando nos juntemos, esta **Lista Jerarquizada** dictará a qué se juega.

El sistema está diseñado para que cada acción estratégica tenga un coste o una consecuencia. No hay lugar para la explotación.

## 2. El Arsenal: Reglas de Combate

Cada jugador gestiona una serie de recursos que definen su influencia en la partida.

### Tokens de Prioridad: La Moneda de la Influencia
* **Votar "3" (Prioridad Alta):** Cuesta **1 Token de Prioridad**. Úsalo para los juegos que de verdad quieres jugar.
* **Votar "0" (Rechazo Absoluto):** Genera **1 Token de Prioridad**. Es la única forma de ganar nuevos tokens.
* **Votos "2" y "1":** No tienen coste ni recompensa. Son el pan de cada día.
* **Capital Inicial:** Cada jugador comienza con **3 Tokens**.

### El Prestigio: El Marcador de Honor y Vergüenza
* Ganas **+1 de Prestigio** cada vez que otro jugador vota "3" a un juego que tú nominaste.
* Sufres **-5 de Prestigio** si una de tus nominaciones es vetada.

### Nominaciones: Responsabilidad y Control
* **Cola de Nominación:** No puedes nominar un juego nuevo si ya tienes una propuesta tuya esperando a ser votada por al menos otra persona.
* **Cancelación Táctica:** Puedes cancelar tu propia nominación pendiente. Al hacerlo, sufres un **cooldown de 24 horas** durante el cual no podrás volver a nominar.

### Votos: Individuales y Modificables
* Las votaciones son individuales. Cada jugador vota desde su sesión cuando quiera.
* Un juego nominado pasa a la lista de "activos" en cuanto recibe el primer voto (de alguien que no sea el nominador).
* Puedes **modificar tu voto** en cualquier momento haciendo clic de nuevo en el botón "Votar" del juego. El coste/beneficio de Tokens se ajustará automáticamente (ej. cambiar de un "3" a un "2" te devuelve 1 Token).

### Vetos: La Bala de Plata
* **Asignación:** Cada jugador tiene **un (1) Veto**. No se regenera.
* **Condición de Uso:** Para vetar un juego, es **obligatorio** haberle votado **"0"** previamente.

## 3. Manual de Operaciones

* **Iniciar Sesión:** Usa tus credenciales. **Cambia tu contraseña** desde "Perfil" la primera vez.
* **Votar/Modificar Voto:** Haz clic en el botón "Votar" de cualquier juego. Si ya has votado, te permitirá modificar tu voto.
* **Vetar:** El botón de "Vetar" aparecerá junto a los juegos en los que has votado "0" (si te queda tu Veto).

## 4. El Rol del Administrador

Un usuario "Admin" tiene acceso a un panel especial desde el Dashboard con las siguientes capacidades:

* **Gestionar Jugadores:**
    * Cambiar la contraseña de cualquier usuario (sin saber la actual).
    * Modificar manualmente los Tokens, Vetos y Prestigio de cualquier jugador.
* **Gestionar Juegos:** Eliminar permanentemente cualquier juego de la lista.
* **Resetear Aplicación:** Restaurar todos los juegos y estadísticas (Tokens, Vetos, Prestigio) a sus valores por defecto, sin afectar a las contraseñas de los usuarios.

---
*Este documento es la única fuente de verdad sobre las reglas del Protocolo. Cualquier disputa se resolverá consultando esta guía.*
