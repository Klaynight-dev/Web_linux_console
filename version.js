const fs = require('fs');
const path = require('path');

const versionFile = './version.json';
const indexFile = './index.html';

function createVersionFileIfNotExists() {
    if (!fs.existsSync(versionFile)) {
        const initialVersion = {
            version: '1.0.0',
            date: new Date().toISOString().split('T')[0],
            changelog: 'Version initiale',
            history: [{
                version: '1.0.0',
                date: new Date().toISOString().split('T')[0],
                changelog: 'Version initiale',
                type: 'initial'
            }]
        };
        fs.writeFileSync(versionFile, JSON.stringify(initialVersion, null, 2));
        console.log('Fichier version.json créé avec la version 1.0.0');
    }
}

function updateVersion(type = 'patch', changelog) {
    // Vérifier que le changelog est fourni
    if (!changelog) {
        console.error('Erreur: Un changelog est obligatoire pour la mise à jour de version.');
        console.log('Usage: node version.js [major|minor|patch] add "changelog des changements"');
        process.exit(1);
    }
    
    // Créer le fichier version.json s'il n'existe pas
    createVersionFileIfNotExists();
    
    // Lire la version actuelle
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    const [major, minor, patch] = versionData.version.split('.').map(Number);
    
    let newVersion;
    const normalizedType = type.toLowerCase();
    switch(normalizedType) {
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'patch':
        default:
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
    }
    
    // Mettre à jour version.json avec le changelog
    const currentDate = new Date().toISOString().split('T')[0];
    versionData.version = newVersion;
    versionData.date = currentDate; // Changé de buildDate à date
    versionData.changelog = changelog;
    
    // Ajouter l'historique des versions
    if (!versionData.history) {
        versionData.history = [];
    }
    versionData.history.unshift({
        version: newVersion,
        date: currentDate,
        changelog: changelog,
        type: type
    });

    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
    
    // Mettre à jour index.html
    let htmlContent = fs.readFileSync(indexFile, 'utf8');
    htmlContent = htmlContent.replace(
        /Version: <span id="app-version">[\d.]+<\/span>/,
        `Version: <span id="app-version">${newVersion}</span>`
    );
    fs.writeFileSync(indexFile, htmlContent);
    
    console.log(`Version mise à jour vers ${newVersion}`);
    console.log(`Changelog: ${changelog}`);
}

function showCurrentVersion() {
    createVersionFileIfNotExists();
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    console.log(`Version actuelle: ${versionData.version}`);
}

function showCurrentChangelog() {
    createVersionFileIfNotExists();
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    console.log(`Changelog actuel: ${versionData.changelog}`);
}

// Gérer les arguments de ligne de commande
const args = process.argv.slice(2);

// Si "now" est le premier argument, utiliser patch par défaut
if (args[0] === 'now') {
    const changelog = args.slice(1).join(' ');
    if (!changelog) {
        showCurrentVersion();
        showCurrentChangelog();
        process.exit(0);
    }
    updateVersion('patch', changelog);
} else if (args[0] === 'version') {
    showCurrentVersion();
} else if (args[0] === 'changelog') {
    showCurrentChangelog();
} else if (args[0] === 'add') {
    // Format: node version.js add "changelog" (patch par défaut)
    const changelog = args.slice(1).join(' ');
    if (!changelog) {
        showCurrentVersion();
        process.exit(0);
    }
    updateVersion('patch', changelog);
} else {
    // Format: node version.js [major|minor|patch] add "changelog"
    const type = args[0] || 'patch';
    const addKeyword = args[1];
    const changelog = args.slice(2).join(' ');

    if (addKeyword !== 'add') {
        console.error('Erreur: Le mot-clé "add" est requis.');
        console.log('Usage: node version.js [major|minor|patch] add "changelog des changements"');
        console.log('Ou: node version.js add "changelog des changements" (pour patch par défaut)');
        process.exit(1);
    }

    if (!changelog) {
        showCurrentVersion();
        process.exit(0);
    }

    updateVersion(type, changelog);
}