# Quality Assemble

Extensión de Chrome para hacer QA manual con orientación: checklists de qué probar, registro de sesiones, reporte de bugs con captura y errores técnicos automáticos, registro de dudas y exportación a Excel.

- Sin IA, sin servidor, sin costo.
- Todo se guarda en el navegador de este equipo. Los datos de QA nunca salen del equipo. La única conexión a internet es para buscar actualizaciones en GitHub.
- No guarda contraseñas: inicias sesión en la web como siempre.
- Los reportes salen en PDF, Excel o texto, con el nombre de quien los reportó.

## Instalación (una sola vez)

1. Descarga el instalador: `https://github.com/gadct/quality-assemble/releases/latest/download/quality-assemble-instalador.zip`
2. Descomprímelo y haz doble clic en `instalar.cmd`. No necesita permisos de administrador.
3. El instalador descarga la extensión en `%LOCALAPPDATA%\QualityAssemble\extension`, copia esa ruta al portapapeles y muestra los pasos para Chrome:
   1. Abre `chrome://extensions` y activa **Modo de desarrollador**.
   2. Presiona **Cargar descomprimida**, pega la ruta y elige la carpeta.
   3. Fija el icono de **Quality Assemble** (pieza de rompecabezas de Chrome).
   4. **Recarga (F5) las pestañas que ya tenías abiertas.** Sin esto no se capturan los errores técnicos.

Para abrir la herramienta, haz clic en su icono. Se abre un panel a la derecha de la página.

## Actualizaciones automáticas

- Al iniciar Windows, un actualizador oculto revisa GitHub y descarga la versión nueva si existe.
- Para actualizar en el momento, usa el acceso directo **Actualizar Quality Assemble** del escritorio.
- Cuando hay una versión descargada, el panel muestra **Aplicar ahora**. También se aplica sola al reiniciar Chrome.
- Los datos no se tocan al actualizar: viven en Chrome, no en la carpeta de la extensión.
- Registro del actualizador: `%LOCALAPPDATA%\QualityAssemble\actualizar.log`.

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

Los datos solo existen en este navegador. Si se desinstala la extensión o se borran los datos de Chrome, **se pierden**.

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
4. GitHub Actions (`.github/workflows/release.yml`) crea el release con `quality-assemble.zip` y el instalador. Si la versión del manifest no coincide con el tag, falla a propósito.

Los equipos instalados toman la versión nueva al iniciar Windows.

**Seguridad:** quien controle este repositorio puede enviar código al navegador de quien usa la extensión, con acceso a todas las páginas que visita. Protege la cuenta de GitHub con verificación en dos pasos y no des permisos de escritura a nadie más.

**ID fijo:** `manifest.json` lleva una `key` que fija el ID de la extensión (`hkebcbhnekmndofnbedbdomnfphanppe`). Así los datos sobreviven aunque cambie la carpeta. No la borres. En un mismo Chrome no se pueden cargar dos copias a la vez (por ejemplo la de desarrollo y la instalada).

## Editar el contenido

Las checklists, el glosario, las severidades y la guía "¿Es un bug?" están en `extension/data.js`. Agrega o cambia puntos ahí. Cada punto necesita un `id` único: no reutilices un id que ya existió, porque las sesiones antiguas lo usan.

## Limitaciones conocidas

- No captura errores en páginas internas de Chrome (`chrome://`) ni en la Chrome Web Store.
- Los errores técnicos solo se registran desde que la pestaña se cargó con la extensión instalada.
- Los errores dentro de marcos incrustados (iframes) no se capturan.
- El .csv no incluye las imágenes. Se descargan aparte con el nombre del bug (BUG-001.jpg).
