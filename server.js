const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configurar Multer para guardar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        const fileName = "esp32_" + Date.now() + ext;
        cb(null, fileName);
    },
});

const upload = multer({ storage });

// ========== TELEGRAM CONFIG ==========
const TELEGRAM_BOT_TOKEN = "8119253260:AAH6iCv5R78HErMkiceFcVR_TZYmCHXX62U";
const TELEGRAM_CHAT_ID = "1596475928";
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// ========== MOTION DETECTION STATE ==========
let lastImageBuffer = null;
let lastAlertTime = 0;
const ALERT_COOLDOWN = 30 * 1000; // 30 segundos

// ========== FUNCION PARA ENVIAR MENSAJE A TELEGRAM ==========
async function sendTelegramAlert() {
    try {
        await axios.post(TELEGRAM_URL, {
            chat_id: TELEGRAM_CHAT_ID,
            text: "¡Se ha detectado movimiento! ¡Abre vigilive!",
        });
        console.log("[Telegram] Alerta enviada");
    } catch (err) {
        console.error("[Telegram] Error enviando alerta:", err.message);
    }
}

// ========== FUNCION DE DETECCION DE MOVIMIENTO ==========
function detectMotion(newBuffer) {
    if (!lastImageBuffer || lastImageBuffer.length !== newBuffer.length) {
        lastImageBuffer = Buffer.from(newBuffer);
        return false;
    }
    let diff = 0;
    for (let i = 0; i < newBuffer.length; i += 20) { // sample cada 20 bytes
        if (Math.abs(newBuffer[i] - lastImageBuffer[i]) > 30) diff++;
    }
    lastImageBuffer = Buffer.from(newBuffer);
    return diff > 100; // umbral simple
}

// Ruta principal
app.get("/", (req, res) => {
    res.send("Servidor funcionando");
});

// Ruta para recibir imágenes
app.post("/upload", upload.single("image"), async (req, res) => {
    console.log("Imagen recibida:", req.file.filename);
    const now = Date.now();
    const buffer = fs.readFileSync(req.file.path);
    if (detectMotion(buffer)) {
        if (now - lastAlertTime > ALERT_COOLDOWN) {
            await sendTelegramAlert();
            lastAlertTime = now;
        } else {
            console.log("[Telegram] En cooldown, no se envía alerta");
        }
    }
    res.json({ status: "ok", file: req.file.filename });
});

// Hacer accesibles las imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

// Endpoint para obtener la última imagen
app.get("/last", (req, res) => {
    const files = fs.readdirSync(uploadDir)
        .filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg"))
        .sort((a, b) => fs.statSync(path.join(uploadDir, b)).mtime - fs.statSync(path.join(uploadDir, a)).mtime);
    if (files.length > 0) {
        res.json({ file: files[0] });
    } else {
        res.json({ file: "placeholder.jpg" });
    }
});

// Endpoint para obtener la galería de imágenes (últimas 20)
app.get("/gallery", (req, res) => {
    const files = fs.readdirSync(uploadDir)
        .filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg"))
        .sort((a, b) => fs.statSync(path.join(uploadDir, b)).mtime - fs.statSync(path.join(uploadDir, a)).mtime)
        .slice(0, 20);
    res.json({ files });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});
