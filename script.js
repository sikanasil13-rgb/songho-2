const socket = io(https://songho-2-7gs0.onrender.com/);
let monRole = null; // Va stocker si on est Joueur 1 ou Joueur 2

// Écouter le serveur pour savoir quel rôle on a reçu
socket.on('role', (role) => {
    monRole = role;
    console.log("Mon rôle pour cette partie : Joueur " + monRole);
});
alert("javaScript fonctionnel !");
// ==========================================
// 1. ÉTAT DU JEU (VARIABLES GLOBALES)
// ==========================================

// Le plateau de jeu : un tableau de 12 cases (index 0 à 11)
// Chaque case commence avec 4 graines
let plateau = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

// Les scores des joueurs
let scoreJoueur1 = 0;
let scoreJoueur2 = 0;

// Le tour de jeu : 1 pour le Joueur 1, 2 pour le Joueur 2
let tour = 1;

// ==========================================
// 2. FONCTIONS D'AFFICHAGE (MISES À JOUR DU HTML)
// ==========================================

/**
 * Cette fonction parcourt le tableau 'plateau' et met à jour 
 * l'affichage du nombre de graines dans chaque case HTML.
 */
function mettreAJourAffichage() {
    for (let i = 0; i < 12; i++) {
        let caseHtml = document.getElementById("case-" + i);
        if (caseHtml) {
            caseHtml.innerHTML = "";
            let nombreGraines = plateau[i];
            for (let g = 0; g < nombreGraines; g++) {
                let graineElement = document.createElement("span");
                graineElement.className = "graine";
                caseHtml.appendChild(graineElement);
            }
            caseHtml.onclick = function() { distribuerGraines(i); };
        }
    }
    document.getElementById("score-j1").innerText = scoreJoueur1;
    document.getElementById("score-j2").innerText = scoreJoueur2;
    let messageTour = document.getElementById("message-tour");
    if (messageTour) {
        messageTour.innerText = "Au tour du Joueur " + tour;
    }
}

// ==========================================
// 3. INITIALISATION AU CHARGEMENT DE LA PAGE
// ==========================================

// On appelle la fonction une première fois pour afficher les 4 graines au départ
mettreAJourAffichage();
function distribuerGraines(indexCase, estUnCoupReseau = false) {
    // SÉCURITÉ RÉSEAU : Empêche de cliquer si ce n'est pas notre tour
    if (!estUnCoupReseau && monRole !== tour) {
        alert("Ce n'est pas votre tour de jouer ! Attendez l'adversaire.");
        return; 
    }

    // 1. SÉCURITÉ : Vérifier le camp
    if (tour === 1 && (indexCase < 0 || indexCase > 5)) {
        alert("Joueur 1 : Choisissez une case dans votre camp (0 à 5) !");
        return;
    }
    if (tour === 2 && (indexCase < 6 || indexCase > 11)) {
        alert("Joueur 2 : Choisissez une case dans votre camp (6 à 11) !");
        return;
    }

    let nombreGraines = plateau[indexCase];
    if (nombreGraines === 0) {
        alert("Cette case est vide !");
        return;
    }

    // --- ICI : LOGIQUE DE DISTRIBUTION DES GRAINES ---
    let indexCourant = indexCase;
    plateau[indexCase] = 0; // On vide la case cliquée

    while (nombreGraines > 0) {
        indexCourant = (indexCourant + 1) % 12;
        // Règle de l'Awalé : on saute la case de départ si on fait un tour complet
        if (indexCourant === indexCase) {
            indexCourant = (indexCourant + 1) % 12;
        }
        plateau[indexCourant]++;
        nombreGraines--;
    }

    // --- ICI : LOGIQUE DE RÉCOLTE ET SÉCURITÉS (Camp adverse) ---
    let campAdversaire = (tour === 1) ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
    
    if (campAdversaire.includes(indexCourant)) {
        while (campAdversaire.includes(indexCourant) && (plateau[indexCourant] === 2 || plateau[indexCourant] === 3)) {
            if (tour === 1) {
                scoreJoueur1 += plateau[indexCourant];
            } else {
                scoreJoueur2 += plateau[indexCourant];
            }
            plateau[indexCourant] = 0;
            indexCourant = (indexCourant - 1 + 12) % 12;
        }
    }

    // --- FIN DU TOUR : Changement de joueur ---
    tour = (tour === 1) ? 2 : 1;
    
    // Mettre à jour le plateau sur l'écran
    mettreAJourAffichage();
    verifierFinPartie();

    // SÉCURITÉ RÉSEAU : On envoie le coup à l'autre seulement si c'est nous qui avons cliqué
    if (!estUnCoupReseau) {
        socket.emit('coupJoue', indexCase);
    }
}
function verifierFinPartie() {
    // 1. Vérification par score (si un joueur a déjà 25 graines ou plus)
    if (scoreJoueur1 >= 25 || scoreJoueur2 >= 25) {
        let gagnant = (scoreJoueur1 > scoreJoueur2) ? "Joueur 1" : "Joueur 2";
        alert("Partie terminée ! Le gagnant est le " + gagnant + " avec un score de choc !");
        location.reload();
        return;
    }

    // 2. Vérification de la famine (si le joueur qui doit jouer n'a plus de graines)
    let grainesCamp1 = 0;
    let grainesCamp2 = 0;

    // On compte les graines restantes dans chaque camp
    for (let i = 0; i < 6; i++) grainesCamp1 += plateau[i];      // Camp du bas (J1)
    for (let i = 6; i < 12; i++) grainesCamp2 += plateau[i];    // Camp du haut (J2)

    // Si c'est au tour du Joueur 1 et qu'il n'a rien, ou Joueur 2 et qu'il n'a rien
    if ((tour === 1 && grainesCamp1 === 0) || (tour === 2 && grainesCamp2 === 0)) {
        
        // Règle officielle : les graines restantes vont au joueur qui a encore des graines dans son camp
        scoreJoueur1 += grainesCamp1;
        scoreJoueur2 += grainesCamp2;

        // On vide le plateau pour l'affichage final
        for (let i = 0; i < 12; i++) plateau[i] = 0;
        mettreAJourAffichage();

        // On détermine le grand vainqueur
        let messageFinal = "";
        if (scoreJoueur1 > scoreJoueur2) {
            messageFinal = "Partie terminée par famine ! Le Joueur 1 gagne avec " + scoreJoueur1 + " graines contre " + scoreJoueur2 + ".";
        } else if (scoreJoueur2 > scoreJoueur1) {
            messageFinal = "Partie terminée par famine ! Le Joueur 2 gagne avec " + scoreJoueur2 + " graines contre " + scoreJoueur1 + ".";
        } else {
            messageFinal = "Match nul parfait ! " + scoreJoueur1 + " partout !";
        }

        // Petite feinte : on laisse l'affichage se mettre à jour une fraction de seconde avant l'alerte
        setTimeout(() => {
            alert(messageFinal);
            location.reload(); // Recommencer une partie propre
        }, 100);
    }
}
// Écouter quand l'adversaire joue depuis un autre onglet/PC
socket.on('adversaireAJoue', (indexCaseAdversaire) => {
    console.log("L'adversaire a joué la case : " + indexCaseAdversaire);
    
    // On contourne temporairement le rôle pour appliquer le coup de l'autre sur notre écran
    let ancienRole = monRole;
    monRole = tour; 
    
    // On exécute la distribution avec la case reçue
    distribuerGraines(indexCaseAdversaire); 
    
    monRole = ancienRole; // On reprend notre rôle normal
});
