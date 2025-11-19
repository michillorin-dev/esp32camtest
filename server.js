import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());

// Configuración de Multer (guardar imágenes en /uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + ".jpg";
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

// ----------- RUTA PARA RECIBIR IMÁGENES -----------
app.post("/upload", upload.single("photo"), (req, res) => {
  console.log("📸 Imagen recibida del ESP32:", req.file.filename);

  // Aquí más adelante ponemos la IA o la detección de movimiento
  // Ejemplo:
  // const isMovement = analizarImagen(req.file.path);

  res.json({ status: "ok", file: req.file.filename });
});

// ----------- RUTA PARA SABER SI EL SERVIDOR ESTÁ VIVO -----------
app.get("/", (req, res) => {
  res.send("Servidor ESP32 activo.");
});

// ----------- INICIAR SERVIDOR -----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});
