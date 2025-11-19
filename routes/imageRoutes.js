const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = (uploadDir, alertHistory) => {
  const router = express.Router();

  // Última imagen
  router.get('/last', (req, res) => {
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'))
      .sort((a, b) => fs.statSync(path.join(uploadDir, b)).mtime - fs.statSync(path.join(uploadDir, a)).mtime);
    if (files.length > 0) {
      res.json({ file: files[0] });
    } else {
      res.json({ file: 'placeholder.jpg' });
    }
  });

  // Galería
  router.get('/gallery', (req, res) => {
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'))
      .sort((a, b) => fs.statSync(path.join(uploadDir, b)).mtime - fs.statSync(path.join(uploadDir, a)).mtime)
      .slice(0, 20);
    res.json({ files });
  });

  // Historial de alertas
  router.get('/alerts', (req, res) => {
    res.json({ alerts: alertHistory });
  });

  return router;
};
