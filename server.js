const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');

// Configuración de Telegram
const telegramConfig = require('./config/telegram');
const TELEGRAM_BOT_TOKEN = telegramConfig.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = telegramConfig.TELEGRAM_CHAT_ID;
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Carpeta de uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'esp32_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Estado global
let lastImageBufferObj = { buffer: null };
let lastAlertTimeObj = { time: 0 };
const ALERT_COOLDOWN = 30 * 1000;
let alertHistory = [];

// Función para enviar alerta a Telegram
async function sendTelegramAlert() {
  try {
    await axios.post(TELEGRAM_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: '¡Se ha detectado movimiento! ¡Abre vigilive!'
    });
    alertHistory.unshift({ timestamp: Date.now(), message: '¡Se ha detectado movimiento!' });
    if (alertHistory.length > 20) alertHistory = alertHistory.slice(0, 20);
    console.log('[Telegram] Alerta enviada');
  } catch (err) {
    console.error('[Telegram] Error enviando alerta:', err.message);
  }
}

// Controlador de subida y movimiento
const uploadController = require('./controllers/uploadController')(upload, sendTelegramAlert, alertHistory, lastImageBufferObj, ALERT_COOLDOWN, lastAlertTimeObj);
app.post('/upload', uploadController);

// Rutas de imágenes y alertas
const imageRoutes = require('./routes/imageRoutes')(uploadDir, alertHistory);
app.use('/', imageRoutes);

// Hacer accesibles las imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir frontend
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto', PORT);
});
