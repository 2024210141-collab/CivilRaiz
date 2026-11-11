# CivilRaíz Color 2.0

## Empezar sin problemas de archivos

Extrae toda la carpeta y abre **ABRIR_CIVILRAIZ.html** en tu navegador. Este archivo contiene el diseño, los cálculos y las imágenes integrados: no depende de rutas de CSS ni de conexión para calcular.

Si prefieres editar por separado, usa `web/index.html` y conserva toda la carpeta `web` con sus archivos. No mezcles esta versión con los archivos de la versión anterior.

## Qué incluye

- Diseño con colores por especialidad y siete ilustraciones SVG originales incluidas.
- Modo claro y oscuro; distribución adaptable a celular y computadora.
- Secciones Calcular, Aprender y Mis resultados.
- Bisección, Newton–Raphson y secante, con comparación de métodos.
- Gráfica de F(x), gráfica del residuo en escala logarítmica y animación de iteraciones.
- Deslizador para explorar un parámetro de cada caso. Después de moverlo, pulsa Calcular.
- Interpretación calculada con tus datos, magnitudes físicas y consejos específicos.
- Polinomios hasta grado 8: nueve coeficientes desde a₈ hasta a₀.
- Fotografía del enunciado mediante cámara o selección de imagen; se incluye en el informe.
- Informe completo para guardar como PDF.
- Historial local de hasta 20 resultados. No incluye fotografías ni nombres. Guarda únicamente los casos que selecciones.

Las imágenes son ilustraciones técnicas, no fotografías ni planos de diseño. La gráfica de resultados sí se calcula a partir de los datos ingresados.

## Los siete casos

1. **Tirante normal:** Manning en canal rectangular o trapezoidal. Resultado en metros; interpretación con área, velocidad, radio hidráulico y Froude.
2. **Tirante crítico:** condición Fr=1, α=1 y presión hidrostática.
3. **Fricción de tubería:** Colebrook–White para factor de Darcy, Re>4000 y rugosidad relativa menor que 0.05.
4. **Altura de viga:** viga simplemente apoyada, carga uniforme, sección rectangular elástica homogénea; resuelve altura por límite de deflexión. No diseña una viga de concreto armado completa.
5. **Ancho de zapata:** presión lineal con excentricidad en una dirección; exige B≥6e. No verifica capacidad portante, asentamientos o punzonamiento.
6. **Diámetro de tubería:** Darcy–Weisbach con factor de fricción conocido y fijo; no incluye pérdidas locales.
7. **Polinomio:** coeficientes editables hasta grado 8. No es un intérprete de cualquier función matemática. Los términos superiores en cero reducen el grado.

Los supuestos y las unidades están visibles en cada apartado. No se convierten unidades automáticamente. Los casos sirven para aprender métodos numéricos; no reemplazan la revisión de un proyecto de ingeniería.

## Cómo usarlo

1. Elige una tarjeta del caso. Desliza horizontalmente para ver todas.
2. Revisa los datos y la sección Supuestos y alcance.
3. Elige método, valores iniciales y tolerancias.
4. Pulsa Calcular solución.
5. Explora la gráfica, las iteraciones y la interpretación.
6. Si modificas datos, vuelve a calcular. La aplicación invalida el resultado anterior.
7. Guarda el resultado en el historial o exporta el informe.

Con nuevos datos, puede ser necesario cambiar el intervalo. Newton y secante pueden no converger aunque exista una raíz; la app lo indica en lugar de convertir un intento fallido en solución.

## Cámara y fotografías

En la web, Tomar foto solicita la cámara del dispositivo si el navegador lo permite. En computadora puede abrir el selector de archivos. Subir imagen permite seleccionar una foto ya tomada.

En el proyecto Android, `MainActivity.java` implementa `onShowFileChooser`: Tomar foto abre la app de cámara mediante `ACTION_IMAGE_CAPTURE` y una URI de `FileProvider`; Subir imagen abre el selector del sistema. La cámara no se abre al iniciar la aplicación: se activa al pulsar el botón.

No se solicita acceso directo al sensor de cámara; la captura se delega en la app de cámara. No se solicitan permisos generales de almacenamiento. La fotografía se procesa localmente, se reduce a un máximo de 1600 píxeles y puede adjuntarse al PDF. Se aceptan archivos de hasta 20 MB.

No hay reconocimiento de texto (OCR). Debes ingresar manualmente los datos del enunciado. Las fotos se pierden al recargar/cerrar la página; exporta el PDF antes de hacerlo. El historial no guarda fotos.

## PDF

- **Navegador:** Exportar PDF abre el informe; pulsa Guardar como PDF / Imprimir y elige Guardar como PDF como destino. Permite ventanas emergentes si se bloquean.
- **Proyecto Android:** el botón usa el puente `Android.printReport` y el sistema de impresión nativo. Selecciona Guardar como PDF. No depende de `window.print()` dentro de WebView.

Incluye el enunciado/foto, ilustración, ecuación, datos, método, criterio de parada, dos gráficas, todas las iteraciones, comparación si se realizó, interpretación y consejos.

## Archivos editables

- `web/index.html`: estructura.
- `web/styles.css`: estilos base.
- `web/experience.css`: nuevo diseño y estilos móvil/oscuro.
- `web/core.js`: siete modelos, derivadas y métodos numéricos.
- `web/app.js`: cálculo en pantalla, fotografía, gráfica y reporte.
- `web/experience.js`: ilustraciones integradas, consejos, interpretación, historial y navegación.
- `web/imagenes/`: siete archivos SVG editables.
- `android/`: proyecto Android con WebView, cámara y PDF nativos.
- `.github/workflows/compilar-apk.yml`: flujo manual para compilar el APK en GitHub Actions.
- `empaquetar.py`: regenera el HTML único y copia la web al proyecto Android.

Si modificas los SVG, ejecuta `python empaquetar.py` para actualizar también las imágenes integradas. Después de cualquier cambio web, ejecuta ese mismo comando antes de compilar Android.

## Estado real de la entrega

**Esta carpeta NO contiene un APK compilado.** El entorno de creación no tiene Android SDK ni Gradle; la descarga del SDK no estuvo disponible. Se incluye el proyecto fuente y un flujo de compilación, pero no se ha ejecutado la compilación ni probado el proyecto nativo en un teléfono.

Se completaron 89 comprobaciones numéricas y pruebas de lógica para 21 combinaciones (7 casos × 3 métodos) con DOM simulado. Incluyen derivadas, raíces conocidas, polinomio de grado 8, errores, interpretación, gráficas SVG, historial e informe. Se validaron recursos, IDs HTML y los siete SVG; las ilustraciones fueron renderizadas e inspeccionadas.

La revisión visual completa de la app en un navegador y las pruebas de cámara/PDF en teléfono quedan pendientes por restricciones del entorno. No se afirma que el APK ni su integración estén validados.

## Repetir pruebas

Desde esta carpeta con Node.js instalado:

    node web/tests/core.test.js
    node web/tests/app.test.js

## Referencias

Manning: https://www.hec.usace.army.mil/confluence/hmsdocs/hmstrm/channel-flow/normal-depth-model

Condición crítica: https://www.hec.usace.army.mil/confluence/rasdocs/ras1dtechref/6.6/theoretical-basis-for-one-dimensional-and-two-dimensional-hydrodynamic-calculations/1d-steady-flow-water-surface-profiles/critical-depth-determination

Tuberías y régimen de flujo: https://www.epa.gov/water-research/epanet

Viga: δ=5wL⁴/(384EI), I=bh³/12, teoría elástica de Euler–Bernoulli para carga uniforme y apoyos simples.

Zapata: q=N/A±M/W; A=LB, M=Ne y W=LB²/6. Al sustituir se obtiene qmáx=N/(LB)(1+6e/B).

Android local: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content

Captura: https://developer.android.com/media/camera/camera-deprecated/photobasics

Impresión: https://developer.android.com/training/printing/html-docs
