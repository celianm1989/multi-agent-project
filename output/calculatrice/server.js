/*
 * server.js — Petit serveur statique sans dépendance (Node.js intégré).
 * Sert les fichiers du dossier courant. Lancement : node server.js [port]
 */
var http = require("http");
var fs = require("fs");
var path = require("path");

var PORT = parseInt(process.argv[2], 10) || 8000;
var ROOT = __dirname;

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

var server = http.createServer(function (req, res) {
  var urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  // Empêche de sortir du dossier racine.
  var filePath = path.normalize(path.join(ROOT, urlPath));
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403);
    res.end("403 Interdit");
    return;
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Introuvable : " + urlPath);
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log("Calculatrice disponible sur http://localhost:" + PORT);
  console.log("Arrêter le serveur : Ctrl + C");
});