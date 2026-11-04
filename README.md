# Quality Assemble

Extensión de navegador para hacer QA manual con orientación: checklists de qué probar, registro de sesiones, reporte de bugs con captura y errores técnicos automáticos, registro de dudas y exportación a Excel.

- Sin IA, sin servidor, sin costo.
- Todo se guarda en el navegador de este equipo. Los datos de QA nunca salen del equipo. La única conexión a internet es para buscar actualizaciones en GitHub.
- No guarda contraseñas: inicias sesión en la web como siempre.
- Los reportes salen en PDF, Excel o texto, con el nombre de quien los reportó.
- Funciona en Opera GX, Opera, Chrome, Edge, Brave y Vivaldi. En Firefox funciona, pero solo de forma temporal (ver abajo).

## Instalación (una sola vez)

1. Presiona **Windows + R**, pega esta línea y presiona **Enter**:
   ```
   powershell -ep bypass -c "irm https://github.com/gadct/quality-assemble/releases/latest/download/instalar.ps1 | iex"
   ```
   No necesita permisos de administrador. No hay que descargar ni descomprimir nada.
2. El instalador detecta el navegador predeterminado. Abre su página de extensiones y una guía con los 4 pasos para ese navegador, y deja la ruta copiada en el portapapeles.
3. Sigue la guía: **Modo de desarrollador** > **Cargar descomprimida** > pega la ruta (`Ctrl + V`) > **Seleccionar carpeta**.
4. Se abre una página de bienvenida: escribe tu nombre, fija el icono y abre la herramienta.

No hace falta recargar las pestañas abiertas: la herramienta se activa sola en ellas.

Ese paso manual no se puede automatizar: los navegadores no permiten que un programa instale extensiones fuera de su tienda. Para eliminarlo habría que publicar la extensión en la Chrome Web Store, que sirve también para Opera y Edge. Eso tiene un costo único de 5 USD y una revisión de Google.

### Cómo se abre según el navegador

- **Chrome, Edge, Brave y Opera reciente**: panel lateral a la derecha de la página.
- **Navegadores sin panel lateral**: ventana aparte acoplada a la derecha. Las capturas se toman de la última pestaña que usaste.
- **Opera GX**: si al hacer clic en el icono no aparece nada, ve a **Datos > Tus datos > Cómo se abre la herramienta** y elige **Ventana aparte**. Abre la herramienta desde la página de bienvenida para llegar a esa opción.
- **Firefox**: barra lateral de Firefox. Se carga como complemento **temporal** desde `about:debugging`, así que hay que repetir la carga cada vez que se abre Firefox. Además, Firefox puede borrar los datos al quitar un complemento temporal. Para el trabajo diario conviene un navegador de la lista anterior. Para dejarlo permanente en Firefox hay que firmarlo en addons.mozilla.org; es gratis, pero no está hecho.

## Actualizaciones automáticas

- Al iniciar Windows, un actualizador oculto revisa GitHub y descarga la versión nueva si existe.
- Para actualizar en el momento, usa el acceso directo **Actualizar Quality Assemble** del escritorio.
- La versión descargada se aplica sola cuando la herramienta está cerrada (revisa cada 30 minutos), o al reiniciar el navegador. Si la herramienta está abierta, el panel muestra **Aplicar ahora**, para que nunca se pierda un bug a medio escribir.
- Los datos no se tocan al actualizar: viven en el navegador, no en la carpeta de la extensión.
- Para reparar una instalación, vuelve a ejecutar la línea de instalación.
- Registro del actualizador: `%LOCALAPPDATA%QualityAssembleactualizar.log`.

## Uso diario

1. **Sesión**: inicia una sesión con proyecto, módulo, ambiente y objetivo.
2. **Probar**: elige el tipo de pantalla (formulario, tabla, login...) y marca cada punto como Funciona, Falla o No aplica. Abre "Por qué y cómo se ve si falla" si tienes dudas.
3. **Bugs**: con la pantalla del problema a la vista, presiona "Nuevo bug". Se guarda la captura, la URL, el navegador y los errores técnicos. Completa título, pasos, esperado y actual.
   - Tip: "Limpiar errores y repetir" borra los errores registrados para que, al repetir los pasos, solo queden los del problema.
4. **Dudas**: anota lo que preguntas, a quién, y la respuesta cuando llegue.
5. **Ayuda**: guía "¿Es un bug?", cómo elegir la severidad y glosario.
6. **Datos**:
   - "Descargar Excel" genera un .csv con los bugs, que se abre en Excel.
   - "Copiar texto" (dentro de cada bug) sirve para pegarlo en la aplicación de la empresa.
   - "Resumen de actividad" copia un texto con lo trabajado en un rango de fechas.
   - Después de reportarlos, márcalos como "Reportado".
7. Al terminar, cierra la sesión y copia el resumen si lo necesitas.

## Respaldo (importante)

Los datos solo existen en este navegador. Si se desinstala la extensión o se borran los datos del navegador, **se pierden**.

- Haz **Datos > Descargar respaldo** al menos una vez por semana. La herramienta avisa cuando pasan 7 días.
- Guarda el archivo en OneDrive, Google Drive o un pendrive.
- Para recuperar los datos, usa **Datos > Restaurar respaldo**.

## Reportes en PDF

- **Un bug**: dentro del bug, "Descargar PDF".
- **Varios bugs**: Datos > Exportar bugs > "Descargar PDF". Incluye una tabla resumen y una página por bug con captura.
- **Sesión**: al terminar la sesión (o desde Sesiones anteriores), "Descargar PDF".
- **Actividad por fechas**: Datos > Resumen de actividad > "Descargar PDF".

Se abre una pestaña con el reporte y la ventana de impresión. En **Destino** elige **Guardar como PDF**.

Todos los reportes muestran quién los hizo. El nombre se configura al iniciar una sesión o en Datos > Tus datos.

## Publicar una versión nueva (desarrollo)

1. Cambia el código y sube `version` en `extension/manifest.json` (por ejemplo `0.2.0` a `0.3.0`).
2. Commit y push.
3. Crea y sube el tag con la misma versión:
   ```
   git tag v0.3.0
   git push origin v0.3.0
   ```
4. GitHub Actions (`.github/workflows/release.yml`) crea el release con `quality-assemble.zip` (para Chromium), `quality-assemble-firefox.zip` (manifest adaptado), `instalar.ps1` y `actualizar.ps1`. Si la versión del manifest no coincide con el tag, falla a propósito.

Los equipos instalados toman la versión nueva al iniciar Windows.

**Seguridad:** quien controle este repositorio puede enviar código al navegador de quien usa la extensión, con acceso a todas las páginas que visita. Protege la cuenta de GitHub con verificación en dos pasos y no des permisos de escritura a nadie más.

**ID fijo:** `manifest.json` lleva una `key` que fija el ID de la extensión (`hkebcbhnekmndofnbedbdomnfphanppe`). Así los datos sobreviven aunque cambie la carpeta. No la borres. En un mismo navegador no se pueden cargar dos copias a la vez (por ejemplo la de desarrollo y la instalada).

## Editar el contenido

Las checklists, el glosario, las severidades y la guía "¿Es un bug?" están en `extension/data.js`. Agrega o cambia puntos ahí. Cada punto necesita un `id` único: no reutilices un id que ya existió, porque las sesiones antiguas lo usan.

## Limitaciones conocidas

- No captura errores en páginas internas del navegador (`chrome://`, `opera://`...) ni en las tiendas de extensiones.
- Los errores técnicos solo se registran desde que la pestaña se cargó con la extensión instalada.
- Los errores dentro de marcos incrustados (iframes) no se capturan.
- El .csv no incluye las imágenes. Se descargan aparte con el nombre del bug (BUG-001.jpg).
