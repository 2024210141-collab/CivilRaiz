package edu.civil.raiz;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintDocumentAdapter;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.ArrayList;

/** Página local, cámara externa con URI segura e impresión PDF nativa. */
public class MainActivity extends Activity {
    private static final int PICK_IMAGE = 201;
    private static final int TAKE_PHOTO = 202;
    private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private Uri pendingPhoto;
    private final ArrayList<WebView> printViews = new ArrayList<>();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Solo para la foto seleccionada por el usuario.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        final WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse resource = assets.shouldInterceptRequest(request.getUrl());
                if (resource != null) return resource;
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // La interfaz nativa solo se expone a esta página de confianza.
                return !HOME.equals(request.getUrl().toString());
            }
        });
        web.addJavascriptInterface(new PrintBridge(), "Android");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                pendingPhoto = null;
                try {
                    if (params.isCaptureEnabled()) launchCamera();
                    else {
                        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("image/*");
                        startActivityForResult(intent, PICK_IMAGE);
                    }
                } catch (Exception e) {
                    finishChooser(null);
                    Toast.makeText(MainActivity.this, "No se pudo abrir. Prueba Subir imagen o revisa la app de cámara.", Toast.LENGTH_LONG).show();
                }
                return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("Sí", (dialog, which) -> result.confirm())
                    .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
        });
        web.loadUrl(HOME);
    }

    private void launchCamera() throws Exception {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(getPackageManager()) == null) throw new IllegalStateException("Sin cámara");
        File directory = new File(getCacheDir(), "photos");
        if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("No se pudo crear caché");
        // Elimina solo capturas temporales de más de un día, no la galería del usuario.
        File[] files = directory.listFiles();
        if (files != null) for (File f : files) {
            if (System.currentTimeMillis() - f.lastModified() > 86400000L) f.delete();
        }
        File output = File.createTempFile("civil_", ".jpg", directory);
        pendingPhoto = FileProvider.getUriForFile(this, getPackageName() + ".photos", output);
        intent.putExtra(MediaStore.EXTRA_OUTPUT, pendingPhoto);
        intent.setClipData(ClipData.newRawUri("Foto del enunciado", pendingPhoto));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(intent, TAKE_PHOTO);
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != TAKE_PHOTO && request != PICK_IMAGE) return;
        if (chooser == null) {
            Toast.makeText(this, "La sesión se reinició. Vuelve a seleccionar o tomar la foto.", Toast.LENGTH_LONG).show();
            return;
        }
        Uri selected = null;
        if (result == RESULT_OK) {
            if (request == TAKE_PHOTO) selected = pendingPhoto;
            else if (data != null) selected = data.getData();
        }
        if (selected != null && !"content".equals(selected.getScheme())) selected = null;
        finishChooser(selected == null ? null : new Uri[]{selected});
        pendingPhoto = null;
    }

    private void finishChooser(Uri[] values) {
        if (chooser != null) { chooser.onReceiveValue(values); chooser = null; }
    }

    public class PrintBridge {
        @JavascriptInterface public void printReport(String html) {
            if (html == null || html.length() > 12000000) return;
            runOnUiThread(() -> openPrintReport(html));
        }
    }

    private void openPrintReport(String html) {
        final PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
        if (manager == null) {
            Toast.makeText(this, "El dispositivo no tiene servicio de impresión.", Toast.LENGTH_LONG).show();
            return;
        }
        final WebView report = new WebView(this);
        printViews.add(report); // Conserva la vista durante todo el trabajo de impresión.
        report.getSettings().setJavaScriptEnabled(false);
        report.getSettings().setAllowFileAccess(false);
        report.getSettings().setAllowContentAccess(false);
        report.setWebViewClient(new WebViewClient() {
            private boolean submitted;
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public void onPageFinished(WebView view, String url) {
                if (submitted || isFinishing()) return;
                submitted = true;
                final PrintDocumentAdapter delegate = report.createPrintDocumentAdapter("CivilRaiz_Informe");
                PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                    @Override public void onStart() { delegate.onStart(); }
                    @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                            CancellationSignal signal, LayoutResultCallback callback, Bundle extras) {
                        delegate.onLayout(oldAttributes, newAttributes, signal, callback, extras);
                    }
                    @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                            CancellationSignal signal, WriteResultCallback callback) {
                        delegate.onWrite(pages, destination, signal, callback);
                    }
                    @Override public void onFinish() {
                        delegate.onFinish();
                        if (printViews.remove(report)) report.destroy();
                    }
                };
                manager.print("CivilRaiz_Informe", adapter,
                    new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR).build());
            }
        });
        // En Android el PDF se genera por PrintManager; no usa window.print().
        // Oculta el botón de impresión del informe porque la impresión ya es nativa.
        html = html.replace("</head>", "<style>.screen{display:none!important}</style></head>");
        report.loadDataWithBaseURL("https://appassets.androidplatform.net/", html, "text/html", "UTF-8", null);
    }

    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("¿Salir de CivilRaíz? Exporta las fotos y los datos no guardados antes de cerrar.")
            .setPositiveButton("Salir", (dialog, which) -> finish())
            .setNegativeButton("Seguir", null).show();
    }

    @Override protected void onDestroy() {
        finishChooser(null);
        for (WebView view : printViews) view.destroy();
        if (web != null) { web.removeJavascriptInterface("Android"); web.destroy(); }
        super.onDestroy();
    }
}
