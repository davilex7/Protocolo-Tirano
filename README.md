# Protocolo Tirano IV: Sistema de Gestión de Competición

## 1. Propósito

Esta aplicación es la implementación del **Protocolo Tirano IV**, una evolución del sistema diseñada para resolver un problema fundamental en un grupo de juego altamente competitivo: la necesidad de un método objetivo, cuantificable y a prueba de manipulación para:

1.  **Determinar objetivamente la versatilidad** de cada miembro del grupo, es decir, su disposición real a participar en una variedad de juegos.

2.  **Generar una lista jerarquizada** de juegos para jugar cuando el grupo se reúne, eliminando debates subjetivos y el "consenso mediocre".

Este protocolo neutraliza las estrategias de explotación táctica (votos de "sí falsos", "3 falsos" o "vetos estratégicos") mediante una economía interna y reglas condicionales estrictas.

## 2. Conceptos Fundamentales

El sistema se rige por una serie de mecanismos diseñados para imponer un coste a la opinión, forzando así la honestidad estratégica.

### Puntos de Convicción (PC)

Es el recurso central de la economía del sistema.

* **Asignación:** Cada jugador recibe **10 PC** al inicio de cada ciclo mensual.

* **Ciclo:** Los ciclos se resetean automáticamente el día 1 de cada mes. Los PC no gastados **no se acumulan**.

* **Función:** Los PC se gastan para emitir votos de alto valor. Este mecanismo es la principal defensa contra la inflación de votos. Obliga a cada jugador a gestionar un presupuesto de "convicción".

### El Coste del Voto

* **Votar 3 (Prioridad Alta):** Cuesta **3 PC**.

* **Votar 2 (Aceptable):** Cuesta **1 PC**.

* **Votar 1 (Tolerable):** Cuesta **0 PC**.

* **Votar 0 (Rechazo Absoluto):** Cuesta **0 PC**.

### Vetos de Temporada (Regla Clave)

El Veto es el recurso más poderoso y está sujeto a una condición estricta para prevenir su uso táctico:

* **Asignación:** Cada jugador dispone de **un (1) Veto** por temporada (ej. 3-6 meses).

* **Condición de Uso:** Para poder ejercer un Veto sobre un juego, es **requisito indispensable** que el jugador que veta le haya asignado previamente una puntuación de **0 (Rechazo Absoluto)** durante la fase de votación.

* **Función:** Esta regla asegura que el Veto se utilice como una herramienta de rechazo genuino contra un juego que un miembro aborrece, y no como un movimiento estratégico para alterar el ranking a su favor. Un Veto elimina el juego de la competición de forma definitiva.

## 3. Funcionamiento de la Aplicación

### Flujo de Trabajo Estándar

1.  **Nominar Juego:** Cualquier miembro puede nominar un título. Aparecerá en estado "Pendiente de Voto".

2.  **Votar:** Todos los miembros votan por el juego nominado. El sistema valida que cada jugador tenga suficientes PC para su voto. Una vez votado, el juego pasa a estado "Activo".

3.  **Vetar (Post-Votación):** **Solo después de que un juego ha sido votado**, si un jugador cumple las condiciones (tiene un Veto disponible y votó '0' a ese juego), aparecerá el botón "Vetar". Al hacer clic, podrá confirmar el Veto y eliminar el juego.

### El Marcador

* **Ranking de Versatilidad:** Muestra la puntuación total de cada jugador (la suma de los valores de sus votos).

* **Lista de Juegos Jerarquizada:** Ordena los juegos "Activos" según su puntuación total. Esta es la guía indiscutible del orden de juego.

## 4. Sincronización de Datos (MUY IMPORTANTE)

Esta aplicación es 100% cliente y no tiene servidor. Para mantener la consistencia, es **OBLIGATORIO** seguir este protocolo:

1.  **Designar un "Admin"** para registrar los cambios.

2.  El Admin **registra** las acciones (votos, etc.).

3.  El Admin hace clic en **"Exportar Datos"** para descargar el fichero `tirano4_db.json`.

4.  El Admin **comparte** el fichero `.json` con el resto del grupo.

5.  Los demás miembros hacen clic en **"Importar Datos"** y seleccionan el fichero recibido para actualizar su estado.

**Este proceso debe repetirse con cada cambio para evitar la desincronización.**

## 5. Gestión de la Temporada

* **Forzar Reseteo de Ciclo:** Resetea los PC de todos los jugadores a 10.

* **Resetear Temporada:** Es el "reinicio nuclear". Borra todos los juegos y puntuaciones, y restaura los PC y Vetos a sus valores iniciales.

## 6. Ficha Técnica

* **Tecnología:** HTML, Tailwind CSS, JavaScript.

* **Alojamiento:** Diseñada para ser desplegada gratuitamente en **GitHub Pages**.
