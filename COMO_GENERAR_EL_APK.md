# Generar el APK de prueba

El APK aún no está compilado. Este proyecto prepara la cámara y el PDF nativos, pero requiere compilación y prueba en Android.

## Opción: GitHub Actions

1. Crea un repositorio en tu cuenta de GitHub.
2. Sube **el contenido** de esta carpeta a la raíz del repositorio: `web`, `android`, `.github` y los demás archivos. No dejes todo dentro de otra carpeta llamada CivilRaiz_Color.
3. Asegúrate de que se incluya `.github/workflows/compilar-apk.yml`. Algunos exploradores ocultan las carpetas cuyo nombre empieza con punto.
4. Abre la pestaña **Actions** del repositorio.
5. Selecciona **Compilar APK CivilRaiz** y pulsa **Run workflow**.
6. Espera a que finalicen las pruebas, `assembleDebug` y `lintDebug`. Si aparece un error, revisa el registro antes de instalar nada.
7. En la ejecución completada, descarga el artefacto **CivilRaiz-APK-prueba**.
8. Extrae `app-debug.apk`, pásalo a tu Android e instálalo. Android puede pedir autorización para instalar desde la aplicación que abre el archivo; decide si autorizas esa fuente.

Este proceso usa tu cuenta y las condiciones de GitHub Actions. No se ha ejecutado ni publicado un repositorio desde esta conversación. El artefacto solo existe después de una compilación correcta.

Es un APK de depuración firmado para pruebas, no una publicación en Google Play. Cada compilación en un entorno limpio puede usar otra firma de depuración: quizá debas desinstalar la prueba anterior y perder su historial local para instalar la siguiente.

## Opción: Android Studio / Gradle local

Requisitos del proyecto: JDK 17, Gradle 8.9, Android SDK plataforma 35 y Build Tools 34.0.0. Android Gradle Plugin 8.7.3. Android mínimo: 8.0 (API 26); WebView actualizado.

1. Instala los requisitos desde sus fuentes oficiales.
2. Abre `android` como proyecto en Android Studio. Si solicita una distribución Gradle, configura Gradle 8.9 instalado localmente. No se incluye gradle-wrapper.jar descargado.
3. Configura el SDK en Android Studio o en `android/local.properties` con `sdk.dir` y la ruta local correcta.
4. Desde la carpeta raíz ejecuta `python empaquetar.py` si modificaste el contenido web.
5. Con Gradle 8.9 en PATH, ejecuta:

       gradle -p android assembleDebug lintDebug

6. El APK, si la compilación termina correctamente, estará en:

       android/app/build/outputs/apk/debug/app-debug.apk

No se requiere servidor ni conexión para usar los cálculos después de instalar el APK. La primera compilación necesita descargar dependencias.

## Prueba imprescindible en el teléfono

- Abrir cada caso y calcular su ejemplo.
- Revisar que el modo oscuro y los campos se lean bien.
- Pulsar Tomar foto, hacer una foto, aceptarla y comprobar la miniatura.
- Cancelar una captura y comprobar que la app sigue funcionando.
- Subir una imagen de la galería.
- Exportar un informe y verificar que el PDF incluye foto, gráfica y todas las iteraciones.
- Revisar que una entrada incorrecta muestre un aviso.
- Guardar, recuperar y eliminar un resultado del historial.

Si Android cierra el proceso mientras está abierta la cámara, vuelve a seleccionar o tomar la fotografía. Esta versión no conserva un borrador completo tras un cierre del proceso.
