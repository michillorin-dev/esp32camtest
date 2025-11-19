const fs = require('fs');

function detectMotion(newBuffer, lastImageBufferObj) {
  if (!lastImageBufferObj.buffer || lastImageBufferObj.buffer.length !== newBuffer.length) {
    lastImageBufferObj.buffer = Buffer.from(newBuffer);
    return false;
  }
  let totalDiff = 0;
  for (let i = 0; i < newBuffer.length; i++) {
    totalDiff += Math.abs(newBuffer[i] - lastImageBufferObj.buffer[i]);
  }
  lastImageBufferObj.buffer = Buffer.from(newBuffer);
  // Umbral: si la suma de diferencias es muy grande, hay movimiento
  return totalDiff > 200000; // Ajusta este valor según pruebas
}

module.exports = (upload, sendTelegramAlert, alertHistory, lastImageBufferObj, ALERT_COOLDOWN, lastAlertTimeObj) => async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const now = Date.now();
    const buffer = fs.readFileSync(req.file.path);
    if (detectMotion(buffer, lastImageBufferObj)) {
      if (now - lastAlertTimeObj.time > ALERT_COOLDOWN) {
        await sendTelegramAlert();
        lastAlertTimeObj.time = now;
      }
    }
    res.json({ status: 'ok', file: req.file.filename });
  });
};
