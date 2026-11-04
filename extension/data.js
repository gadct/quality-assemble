// Static guidance content. Edit freely: add checklists, glossary terms or items here.
// Each checklist item: id (unique, never reuse), que (what to do), porque (why it matters), falla (what a failure looks like).

const CHECKLISTS = [
  {
    id: 'general',
    nombre: 'Cualquier pantalla',
    cuando: 'Revisa esto en todas las pantallas que pruebes, además de la lista específica.',
    items: [
      { id: 'gen-01', que: 'Recarga la página (F5) en medio de una tarea.', porque: 'Los usuarios recargan sin querer. La pantalla debe volver a un estado coherente.', falla: 'Pantalla en blanco, datos duplicados, error o te saca del sistema sin avisar.' },
      { id: 'gen-02', que: 'Usa el botón "Atrás" del navegador y luego "Adelante".', porque: 'Es la forma de navegar más usada y la que menos prueban los programadores.', falla: 'Te lleva a una pantalla equivocada, pierde lo escrito o reenvía un formulario.' },
      { id: 'gen-03', que: 'Abre la misma pantalla en otra pestaña (clic derecho > abrir en pestaña nueva).', porque: 'Muchas personas trabajan con varias pestañas a la vez.', falla: 'La pestaña nueva no carga, pide login otra vez o muestra otra cosa.' },
      { id: 'gen-04', que: 'Achica la ventana hasta el ancho de un teléfono (o usa F12 > icono de móvil).', porque: 'Una parte de los usuarios entra desde el celular o pantallas pequeñas.', falla: 'Textos cortados, botones fuera de la pantalla, cosas encimadas, barra horizontal.' },
      { id: 'gen-05', que: 'Revisa ortografía, mayúsculas y que los textos digan lo mismo en toda la app.', porque: 'Los errores de texto dan mala imagen y confunden ("Guardar" en un lado y "Grabar" en otro).', falla: 'Faltas de ortografía, textos en inglés mezclados, nombres distintos para lo mismo.' },
      { id: 'gen-06', que: 'Pasa por todos los botones y campos usando solo la tecla Tab.', porque: 'Hay personas que no usan mouse. También revela elementos que no se pueden alcanzar.', falla: 'No se ve dónde estás parado, el orden salta de forma rara o un botón no se alcanza.' },
      { id: 'gen-07', que: 'Deja la pantalla quieta un buen rato (30-60 min) y luego intenta hacer algo.', porque: 'La sesión expira. El sistema debe avisar y no perder datos en silencio.', falla: 'Da error raro, no guarda y no avisa, o se queda cargando para siempre.' },
      { id: 'gen-08', que: 'Mira si hay algo que "carga" para siempre o tarda más de unos segundos.', porque: 'Si algo tarda y no hay indicador, el usuario cree que se rompió y vuelve a hacer clic.', falla: 'No hay indicador de carga, o el indicador nunca termina.' },
      { id: 'gen-09', que: 'Revisa que colores, tipos de letra, tamaños y botones se vean igual que en otras pantallas.', porque: 'La consistencia hace que la app se sienta confiable y fácil de aprender.', falla: 'Un botón de otro color o tamaño, una fuente distinta, alineaciones diferentes.' },
      { id: 'gen-10', que: 'Si algo falla, lee el mensaje de error: ¿se entiende qué pasó y qué hacer?', porque: 'Un mensaje claro evita llamadas a soporte y frustración.', falla: 'Mensajes técnicos ("Error 500", "null", "undefined"), en inglés, o ningún mensaje.' }
    ]
  },
  {
    id: 'login',
    nombre: 'Inicio de sesión',
    cuando: 'Pantallas donde se entra con usuario y contraseña, o se recupera la contraseña.',
    items: [
      { id: 'log-01', que: 'Entra con usuario y contraseña correctos.', porque: 'Es el camino principal. Si falla, nadie puede usar el sistema.', falla: 'No entra, entra a una pantalla equivocada o tarda demasiado.' },
      { id: 'log-02', que: 'Intenta entrar con contraseña incorrecta.', porque: 'El sistema debe rechazar y explicar sin dar pistas de más.', falla: 'Entra igual, no muestra mensaje, o dice "el usuario existe pero la contraseña no" (pista para atacantes).' },
      { id: 'log-03', que: 'Deja los campos vacíos y presiona entrar.', porque: 'Es el error más común del usuario.', falla: 'No pasa nada, error técnico, o el mensaje no dice qué falta.' },
      { id: 'log-04', que: 'Escribe el usuario con espacios al inicio/final o con mayúsculas distintas.', porque: 'Al copiar y pegar se cuelan espacios. El usuario no debería quedar bloqueado por eso.', falla: 'No te deja entrar con el mismo usuario por un espacio o una mayúscula.' },
      { id: 'log-05', que: 'Presiona Enter en vez del botón para entrar.', porque: 'Casi todos usan Enter.', falla: 'Enter no hace nada o recarga la página sin entrar.' },
      { id: 'log-06', que: 'Revisa que la contraseña se vea como puntos y, si hay "ojito", que la muestre y oculte.', porque: 'Privacidad básica.', falla: 'La contraseña se ve en texto, o el ojito no funciona.' },
      { id: 'log-07', que: 'Cierra sesión y luego usa "Atrás" en el navegador.', porque: 'Después de salir no se debe poder ver información privada.', falla: 'Con "Atrás" vuelves a ver pantallas internas o puedes seguir operando.' },
      { id: 'log-08', que: 'Prueba "Olvidé mi contraseña" de principio a fin, si existe.', porque: 'Es el camino de rescate. Si falla, el usuario queda fuera.', falla: 'No llega el correo, el enlace no funciona, o el enlace sirve más de una vez.' },
      { id: 'log-09', que: 'Copia la URL de una pantalla interna, cierra sesión y pégala en el navegador.', porque: 'Nadie debería ver pantallas internas sin entrar.', falla: 'La pantalla se abre sin pedir login.' },
      { id: 'log-10', que: 'Si hay usuarios con distintos roles, entra con cada uno y mira qué ve.', porque: 'Cada rol debe ver solo lo que le corresponde.', falla: 'Un usuario común ve opciones de administrador, o un admin no ve lo suyo.' }
    ]
  },
  {
    id: 'formulario',
    nombre: 'Formularios',
    cuando: 'Cualquier pantalla donde se escriben o eligen datos y se presiona Guardar/Enviar.',
    items: [
      { id: 'for-01', que: 'Llena todo bien y guarda.', porque: 'Camino principal: debe funcionar siempre.', falla: 'No guarda, guarda datos distintos a los escritos, o no confirma que guardó.' },
      { id: 'for-02', que: 'Guarda con los campos obligatorios vacíos.', porque: 'El sistema debe decir qué falta, en el campo correcto.', falla: 'Guarda igual, error técnico, o no se sabe qué campo falta.' },
      { id: 'for-03', que: 'Revisa que los campos obligatorios estén marcados (por ejemplo con *).', porque: 'El usuario debe saber antes de enviar qué es obligatorio.', falla: 'No se distinguen los obligatorios hasta que da error.' },
      { id: 'for-04', que: 'Escribe textos muy largos (pega un párrafo enorme) en campos de texto.', porque: 'Revela límites no controlados que rompen la pantalla o la base de datos.', falla: 'Se rompe el diseño, da error al guardar o corta el texto sin avisar.' },
      { id: 'for-05', que: 'Escribe caracteres especiales: tildes, ñ, comillas, emojis, <b>hola</b>.', porque: 'Nombres reales tienen tildes y ñ. Y los símbolos raros revelan fallas de seguridad.', falla: 'Aparecen símbolos raros (Ã±), se pierde texto o el texto <b> sale en negrita.' },
      { id: 'for-06', que: 'En campos de número, escribe letras, negativos, decimales y cero.', porque: 'Los números mal validados generan cálculos y datos incorrectos.', falla: 'Acepta letras, acepta negativos donde no tiene sentido, o se cae.' },
      { id: 'for-07', que: 'En correos, teléfonos y fechas, escribe formatos incorrectos.', porque: 'Datos mal escritos se guardan y luego no sirven.', falla: 'Acepta "juan@" o "abc" como teléfono, o fechas imposibles (31/02).' },
      { id: 'for-08', que: 'Haz doble clic rápido (o varios clics) en Guardar.', porque: 'Muy común cuando el sistema tarda.', falla: 'Se crean registros duplicados.' },
      { id: 'for-09', que: 'Llena medio formulario y sal de la pantalla sin guardar.', porque: 'El usuario puede perder trabajo sin darse cuenta.', falla: 'Se pierde todo sin avisar (en formularios largos debería preguntar).' },
      { id: 'for-10', que: 'Cuando da error de validación, revisa si se mantienen los datos ya escritos.', porque: 'Volver a escribir todo por un error genera mucha frustración.', falla: 'Se borra todo el formulario tras un error.' },
      { id: 'for-11', que: 'Revisa listas desplegables: que tengan opciones, ordenadas y sin repetidos.', porque: 'Listas vacías o desordenadas impiden completar el formulario.', falla: 'Lista vacía, opciones repetidas, textos técnicos (ID_01) o sin orden lógico.' }
    ]
  },
  {
    id: 'tabla',
    nombre: 'Tablas y listados',
    cuando: 'Pantallas que muestran varios registros en filas: clientes, pedidos, usuarios, etc.',
    items: [
      { id: 'tab-01', que: 'Revisa que los datos de la tabla coincidan con el detalle de cada registro.', porque: 'Es común que la tabla muestre un dato viejo o de otro registro.', falla: 'La tabla dice una cosa y al abrir el registro dice otra.' },
      { id: 'tab-02', que: 'Mira cómo se ve la tabla sin registros (usa un filtro que no encuentre nada).', porque: 'Una tabla vacía debe explicar por qué está vacía.', falla: 'Se ve rota, en blanco sin mensaje, o muestra error.' },
      { id: 'tab-03', que: 'Ordena por cada columna (clic en el título), ascendente y descendente.', porque: 'El orden incorrecto hace que la gente tome decisiones con datos mal ordenados.', falla: 'No ordena, ordena mal (10 antes que 2, fechas como texto) o se pierde al cambiar de página.' },
      { id: 'tab-04', que: 'Cambia de página: siguiente, anterior, última. Revisa el total.', porque: 'Los errores de paginación esconden o repiten registros.', falla: 'Registros repetidos entre páginas, total que no cuadra, página vacía al final.' },
      { id: 'tab-05', que: 'Busca textos muy largos en celdas y números grandes.', porque: 'Los datos reales son más largos que los de prueba.', falla: 'El texto se sale de la celda, se encima o la tabla se deforma.' },
      { id: 'tab-06', que: 'Revisa formatos: fechas, monedas, decimales, separador de miles.', porque: 'Un formato inconsistente confunde (01/02 ¿es enero o febrero?).', falla: 'Formatos mezclados, montos sin decimales o con demasiados.' },
      { id: 'tab-07', que: 'Prueba las acciones de cada fila (ver, editar, eliminar) en la primera y la última fila.', porque: 'Los errores suelen aparecer en los bordes.', falla: 'La acción se aplica a otra fila o no hace nada.' },
      { id: 'tab-08', que: 'Si hay exportar (Excel/PDF), exporta y abre el archivo.', porque: 'Los usuarios confían en estos archivos para informes.', falla: 'Archivo vacío, columnas distintas a la pantalla, tildes rotas.' },
      { id: 'tab-09', que: 'Mira la tabla en pantalla angosta (ancho de teléfono).', porque: 'Las tablas son lo primero que se rompe en móvil.', falla: 'Columnas cortadas sin poder desplazar, texto ilegible.' }
    ]
  },
  {
    id: 'busqueda',
    nombre: 'Búsqueda y filtros',
    cuando: 'Buscadores, filtros por fecha/estado/categoría, cajas de "buscar".',
    items: [
      { id: 'bus-01', que: 'Busca algo que sabes que existe.', porque: 'Camino principal.', falla: 'No lo encuentra o trae resultados que no tienen relación.' },
      { id: 'bus-02', que: 'Busca algo que no existe.', porque: 'Debe decir claramente que no hay resultados.', falla: 'Pantalla en blanco sin mensaje, o error.' },
      { id: 'bus-03', que: 'Busca con mayúsculas/minúsculas distintas y con o sin tildes ("Jose" vs "José").', porque: 'Los usuarios no escriben exacto.', falla: 'Encuentra "José" pero no "jose".' },
      { id: 'bus-04', que: 'Busca solo una parte de la palabra ("Gonz" para "González").', porque: 'Es como busca la mayoría.', falla: 'Solo encuentra si escribes la palabra completa (puede ser decisión del negocio: pregunta).' },
      { id: 'bus-05', que: 'Busca con espacios al inicio/final, o solo espacios.', porque: 'Pasa mucho al copiar y pegar.', falla: 'No encuentra por un espacio, o buscar solo espacios da error.' },
      { id: 'bus-06', que: 'Combina varios filtros a la vez y revisa que los resultados cumplan todos.', porque: 'Las combinaciones son donde más fallan los filtros.', falla: 'Aparecen resultados que no cumplen algún filtro.' },
      { id: 'bus-07', que: 'Limpia los filtros. ¿Vuelve todo a como estaba?', porque: 'Un filtro "pegado" esconde datos sin que el usuario lo note.', falla: 'Quedan filtros aplicados sin verse, o no hay forma de limpiarlos.' },
      { id: 'bus-08', que: 'En filtros de fecha, prueba el mismo día como inicio y fin, y fecha fin antes que inicio.', porque: 'Los rangos de fecha suelen fallar en los bordes.', falla: 'No incluye registros del último día, o acepta un rango imposible sin avisar.' },
      { id: 'bus-09', que: 'Filtra, entra a un registro y vuelve atrás. ¿Se mantiene el filtro?', porque: 'Rehacer filtros cada vez es muy frustrante.', falla: 'Se pierden los filtros al volver.' }
    ]
  },
  {
    id: 'crud',
    nombre: 'Crear, editar y eliminar',
    cuando: 'Cuando se puede agregar un registro nuevo, modificarlo o borrarlo.',
    items: [
      { id: 'cru-01', que: 'Crea un registro y búscalo en el listado.', porque: 'Debe aparecer de inmediato con los datos correctos.', falla: 'No aparece, aparece con datos distintos o solo tras recargar.' },
      { id: 'cru-02', que: 'Crea un registro igual a uno existente (mismo nombre, mismo documento).', porque: 'Los duplicados ensucian los datos.', falla: 'Permite duplicados donde no debería (pregunta si es regla del negocio).' },
      { id: 'cru-03', que: 'Edita un registro, guarda y vuelve a abrirlo.', porque: 'Hay que confirmar que el cambio quedó guardado de verdad.', falla: 'Al reabrir aparece el dato viejo, o se borraron otros campos.' },
      { id: 'cru-04', que: 'Edita y cancela. Revisa que nada haya cambiado.', porque: 'Cancelar debe ser seguro.', falla: 'Se guardó el cambio aunque cancelaste.' },
      { id: 'cru-05', que: 'Elimina un registro. ¿Pide confirmación?', porque: 'Borrar sin confirmar provoca pérdida de datos por accidente.', falla: 'Borra con un solo clic, sin preguntar.' },
      { id: 'cru-06', que: 'Elimina y revisa que desaparezca del listado y de las búsquedas.', porque: 'Registros "fantasma" generan confusión.', falla: 'Sigue apareciendo en algún lugar.' },
      { id: 'cru-07', que: 'Intenta eliminar algo que está en uso (un cliente con pedidos, por ejemplo).', porque: 'Borrar datos relacionados puede romper otras partes del sistema.', falla: 'Lo borra y luego otras pantallas dan error, o el mensaje no explica por qué no se puede.' },
      { id: 'cru-08', que: 'Abre el mismo registro en dos pestañas, edita en ambas y guarda las dos.', porque: 'Dos personas pueden editar lo mismo a la vez.', falla: 'Se pierde un cambio sin aviso (anótalo como observación, no siempre es bug).' },
      { id: 'cru-09', que: 'Revisa que después de crear/editar/eliminar aparezca un mensaje de éxito.', porque: 'El usuario necesita saber que su acción funcionó.', falla: 'No hay ningún aviso, o el aviso dice "éxito" aunque falló.' }
    ]
  }
];

const SEVERIDADES = [
  { id: 'critico', nombre: 'Crítico', regla: 'Impide usar el sistema o una función principal, pierde o daña datos, o es un problema de seguridad. No hay forma de rodearlo.', ejemplo: 'No se puede iniciar sesión. Guardar borra otros registros. Se ven datos de otro usuario.' },
  { id: 'alto', nombre: 'Alto', regla: 'Una función importante no funciona, pero existe otra forma de lograrlo, o afecta a muchos usuarios.', ejemplo: 'El filtro por fecha no funciona (pero se puede ordenar la tabla). El botón Exportar da error.' },
  { id: 'medio', nombre: 'Medio', regla: 'Funciona, pero mal o de forma confusa. Molesta, pero no bloquea.', ejemplo: 'El mensaje de error no explica qué falta. La paginación muestra un total incorrecto.' },
  { id: 'bajo', nombre: 'Bajo', regla: 'Detalle visual o de texto que no afecta el funcionamiento.', ejemplo: 'Falta de ortografía. Un botón desalineado. Un color distinto al resto.' }
];

// "Is it a bug?" decision guide. Each step: question, and where yes/no leads (another step id or a result).
const GUIA_BUG = {
  inicio: 'p1',
  pasos: {
    p1: { pregunta: '¿El sistema muestra un error, se cae, se queda cargando o pierde datos?', si: 'r_bug_claro', no: 'p2' },
    p2: { pregunta: '¿Sabes con certeza cómo debería funcionar (te lo dijeron, está escrito o es obvio para cualquiera)?', si: 'p3', no: 'p4' },
    p3: { pregunta: '¿Lo que pasa es distinto a lo que debería pasar?', si: 'p5', no: 'r_no_bug' },
    p4: { pregunta: '¿Un usuario normal se confundiría o se equivocaría por cómo funciona?', si: 'r_observacion', no: 'r_duda' },
    p5: { pregunta: '¿Lo puedes repetir? Intenta hacer exactamente los mismos pasos otra vez.', si: 'r_bug_claro', no: 'r_intermitente' }
  },
  resultados: {
    r_bug_claro: { titulo: 'Es un bug', texto: 'Repórtalo. Anota los pasos exactos y adjunta la captura (la herramienta guarda los errores técnicos sola).', accion: 'bug' },
    r_intermitente: { titulo: 'Bug intermitente', texto: 'Repórtalo igual, pero indica que no siempre pasa y cuántas veces lo intentaste. Anota la hora: ayuda a los programadores a buscar en sus registros.', accion: 'bug' },
    r_observacion: { titulo: 'Observación de usabilidad', texto: 'Puede no ser un error técnico, pero es un problema real para el usuario. Repórtalo con severidad Baja o Media y explica qué confunde y por qué.', accion: 'bug' },
    r_duda: { titulo: 'Es una duda', texto: 'No hay forma de saber si está bien sin preguntar. Regístrala en Dudas y pregúntale a quien corresponda. Así queda constancia.', accion: 'duda' },
    r_no_bug: { titulo: 'No es un bug', texto: 'Funciona como se espera. Si quieres, anótalo en las notas de la sesión como probado.', accion: null }
  }
};

const GLOSARIO = [
  { termino: 'Bug', def: 'Un error: el sistema hace algo distinto a lo que debería.' },
  { termino: 'QA', def: 'Quality Assurance, aseguramiento de calidad. Revisar que el software funcione bien antes de que lo usen los clientes.' },
  { termino: 'Ambiente / entorno', def: 'Copia del sistema en un lugar específico. "Pruebas" o "QA" o "staging" es para probar. "Producción" es el real que usan los clientes. Nunca pruebes en producción salvo que te lo pidan.' },
  { termino: 'Producción (prod)', def: 'El sistema real, el que usan los clientes. Un error aquí afecta a personas reales.' },
  { termino: 'Staging / QA / pruebas', def: 'Ambiente de prueba, lo más parecido a producción. Aquí se puede romper sin consecuencias.' },
  { termino: 'Frontend', def: 'Lo que ves: pantallas, botones, colores. Corre en el navegador.' },
  { termino: 'Backend', def: 'Lo que no ves: el servidor que guarda datos, calcula y responde a las pantallas.' },
  { termino: 'API', def: 'La forma en que el frontend le pide cosas al backend ("dame la lista de clientes"). Cuando falla, la pantalla suele quedar vacía o mostrar error.' },
  { termino: 'Endpoint', def: 'Una dirección específica de la API. Por ejemplo /api/clientes. Aparece en los errores de red que captura la herramienta.' },
  { termino: 'Base de datos (BD)', def: 'Donde se guarda toda la información del sistema.' },
  { termino: 'Error 400', def: 'El sistema rechazó lo que se le envió porque estaba mal formado o incompleto. Suele ser un problema de validación.' },
  { termino: 'Error 401 / 403', def: '401: no hay sesión o expiró. 403: hay sesión, pero ese usuario no tiene permiso.' },
  { termino: 'Error 404', def: 'No encontrado: la página o el dato no existe en esa dirección. Común en enlaces rotos.' },
  { termino: 'Error 500', def: 'Error interno del servidor: algo falló en el backend. Casi siempre es un bug que vale la pena reportar.' },
  { termino: 'Consola', def: 'Panel oculto del navegador (se abre con F12) donde aparecen errores técnicos. La herramienta los guarda sola al crear un bug.' },
  { termino: 'Caché', def: 'Copia guardada para cargar más rápido. A veces muestra una versión vieja. Si algo "ya debería estar arreglado" y no lo está, prueba Ctrl + Shift + R.' },
  { termino: 'Ctrl + Shift + R', def: 'Recarga la página ignorando la caché. Úsalo antes de decir que un arreglo no funciona.' },
  { termino: 'Cookie / sesión', def: 'La forma en que el sistema recuerda que entraste. Si se borra o expira, te saca.' },
  { termino: 'Deploy / despliegue', def: 'Subir una nueva versión del sistema a un ambiente. Después de un deploy conviene volver a probar.' },
  { termino: 'Release / versión', def: 'Conjunto de cambios que se publican juntos.' },
  { termino: 'Regresión', def: 'Algo que funcionaba y dejó de funcionar después de un cambio. Muy importante de reportar.' },
  { termino: 'Retest', def: 'Volver a probar un bug que dicen que ya arreglaron, para confirmar.' },
  { termino: 'Caso de prueba', def: 'Pasos concretos para probar algo y el resultado esperado.' },
  { termino: 'Caso límite (edge case)', def: 'Una situación en los bordes: campo vacío, texto enorme, número cero, fecha de fin de mes. Ahí se esconden muchos bugs.' },
  { termino: 'Camino feliz (happy path)', def: 'Usar la función tal como se diseñó, sin errores del usuario. Siempre se prueba primero.' },
  { termino: 'Validación', def: 'Revisión de que los datos escritos sean correctos antes de guardar (correo con @, campo obligatorio, etc.).' },
  { termino: 'Responsive', def: 'Que la pantalla se adapte a distintos tamaños: computador, tablet, teléfono.' },
  { termino: 'Rol / permisos', def: 'Tipo de usuario (administrador, vendedor, etc.) y lo que puede ver o hacer.' },
  { termino: 'Intermitente', def: 'Un error que pasa a veces sí y a veces no. Se reporta igual, indicando cuántas veces se intentó.' },
  { termino: 'Reproducir', def: 'Hacer que el error vuelva a pasar siguiendo los mismos pasos. Si el programador no puede reproducirlo, no puede arreglarlo.' },
  { termino: 'Severidad', def: 'Qué tan grave es el bug para el usuario. Ver la guía de severidad.' },
  { termino: 'Prioridad', def: 'Qué tan pronto se debe arreglar. La suele decidir el equipo o la jefatura, no QA.' },
  { termino: 'UX', def: 'Experiencia de usuario: qué tan fácil, claro y agradable es usar el sistema.' },
  { termino: 'UI', def: 'Interfaz de usuario: la parte visual (botones, colores, textos, distribución).' },
  { termino: 'Hotfix', def: 'Arreglo urgente que se sube rápido, normalmente a producción.' }
];

const CONSEJOS_REPORTE = [
  'Un bug por reporte. Si encuentras dos problemas, haz dos reportes.',
  'El título dice qué pasa y dónde: "Guardar cliente duplica el registro al hacer doble clic".',
  'Los pasos deben permitir que otra persona repita el error sin preguntarte nada.',
  'Escribe lo que pasa, no lo que crees que causa el problema.',
  'Incluye el usuario de prueba que usaste (nunca la contraseña).',
  'Antes de reportar, recarga con Ctrl + Shift + R e inténtalo otra vez.'
];
