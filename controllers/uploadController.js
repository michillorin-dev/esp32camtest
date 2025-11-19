const fs = require('fs');
const imageHash = require('image-hash');
const sharp = require('sharp');

let lastImageHash = null;

function detectMotionByHash(imagePath, cb) {
  imageHash.hash(imagePath, 8, 'hex', (err, hash) => {
    if (err) {
      cb(false);
      return;
    }
    if (!lastImageHash) {
      lastImageHash = hash;
      cb(false);
      return;
    }
    // Distancia de Hamming
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] !== lastImageHash[i]) diff++;
    }
    lastImageHash = hash;
    cb(diff > 10); // Umbral: ajusta según pruebas
  });
}

module.exports = (upload, sendTelegramAlert, alertHistory, lastImageBufferObj, ALERT_COOLDOWN, lastAlertTimeObj) => async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const now = Date.now();
    const imagePath = req.file.path;
    detectMotionByHash(imagePath, async (motion) => {
      if (motion) {
        if (now - lastAlertTimeObj.time > ALERT_COOLDOWN) {
          await sendTelegramAlert();
          lastAlertTimeObj.time = now;
        }
      }
      res.json({ status: 'ok', file: req.file.filename });
    });
  });
};
