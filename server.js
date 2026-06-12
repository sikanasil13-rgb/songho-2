const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Le serveur distribue les fichiers de ton dossier actuel (HTML, CSS, JS)
app.use(express.static(__dirname));

let joueurs = {}; // Pour stocker les 2 joueurs connectés

io.on('connection', (socket) => {
    console.log('Un joueur s\'est connecté : ' + socket.id);

    // Assigner un rôle (Joueur 1 ou Joueur 2)
    if (!joueurs.j1) {
        joueurs.j1 = socket.id;
        socket.emit('role', 1);
        console.log('Assigné : Joueur 1');
    } else if (!joueurs.j2) {
        joueurs.j2 = socket.id;
        socket.emit('role', 2);
        console.log('Assigné : Joueur 2');
    } else {
        socket.emit('role', 'spectateur');
    }

    // Quand un joueur clique sur une case, on relaie l'info à l'autre ordinateur
    socket.on('coupJoue', (indexCase) => {
        io.emit('adversaireAJoue', indexCase);
    });

    // Quand un joueur se déconnecte
    socket.on('disconnect', () => {
        if (socket.id === joueurs.j1) joueurs.j1 = null;
        if (socket.id === joueurs.j2) joueurs.j2 = null;
        console.log('Un joueur est parti.');
    });
});

// Le serveur écoute sur le port 3000
server.listen(3000, () => {
    console.log('=== SERVEUR AWALÉ LANCÉ SUR http://localhost:3000 ===');
});