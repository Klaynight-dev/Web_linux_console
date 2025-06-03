// --- Application Core ---
const app = {
    // --- DOM Elements ---
    outputElement: document.getElementById('console-output'),
    commandInputElement: document.getElementById('command-input'),
    commandFormElement: document.getElementById('command-form'),
    consoleEndRefElement: document.getElementById('console-end-ref'),
    promptLabelElement: document.getElementById('prompt-label'),
    loadingLLMIndicator: document.getElementById('loading-llm-indicator'),
    appContainer: document.getElementById('app-container'),

    // Menu Elements
    fileMenuButton: document.getElementById('file-menu-button'),
    fileMenuDropdown: document.getElementById('file-menu-dropdown'),
    toolsMenuButton: document.getElementById('tools-menu-button'),
    toolsMenuDropdown: document.getElementById('tools-menu-dropdown'),
    helpMenuButton: document.getElementById('help-menu-button'),
    helpMenuDropdown: document.getElementById('help-menu-dropdown'),
    openImportModalButton: document.getElementById('import-code-button'),

    // Modal Elements
    codeImportModal: document.getElementById('code-import-modal'),
    codeToImportTextarea: document.getElementById('code-to-import-textarea'),
    cancelImportButton: document.getElementById('cancel-import-button'),
    confirmImportButton: document.getElementById('confirm-import-button'),
    aboutModal: document.getElementById('about-modal'),
    closeAboutModalButton: document.getElementById('close-about-modal'),

    // History Modal Elements
    historyModal: document.getElementById('history-modal'),
    historyList: document.getElementById('history-list'),
    closeHistoryModalButton: document.getElementById('close-history-modal'),
    showHistoryButton: document.getElementById('show-history-button'),

    // --- État ---
    currentDir: '/home/user',
    fileSystem: {
        '/': {
            type: 'directory',
            children: {
                'bin': {
                    type: 'directory',
                    children: {
                        'echo': { type: 'file', content: 'Une commande pour afficher du texte.' },
                        'ls': { type: 'file', content: 'Une commande pour lister le contenu d\'un dossier.' },
                        'cd': { type: 'file', content: 'Une commande pour changer de dossier courant.' },
                        'pwd': { type: 'file', content: 'Une commande pour afficher le dossier courant.' },
                        'clear': { type: 'file', content: 'Une commande pour effacer la console.' },
                        'help': { type: 'file', content: 'Une commande pour afficher l\'aide.' },
                        'cat': { type: 'file', content: 'Une commande pour afficher le contenu d\'un fichier.' },
                        'mkdir': { type: 'file', content: 'Une commande pour créer un dossier.' },
                        'rm': { type: 'file', content: 'Une commande pour supprimer un fichier ou un dossier.' },
                        'touch': { type: 'file', content: 'Une commande pour créer un fichier vide.' },
                        'about': { type: 'file', content: 'Affiche des informations sur cette console.' },
                        'cconnect': { type: 'file', content: 'Change le pseudo utilisateur.' },
                        'cdisconnect': { type: 'file', content: 'Déconnecte l\'utilisateur et réinitialise le pseudo.' },
                        'history': { type: 'file', content: 'Affiche l\'historique des commandes.' }
                    }
                },
                'home': {
                    type: 'directory',
                    children: {
                        'user': {
                            type: 'directory',
                            children: {
                                'welcome.txt': { type: 'file', content: 'Bienvenue sur votre console Linux web!' },
                                'notes.txt': { type: 'file', content: 'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.' }
                            }
                        }
                    }
                },
                'etc': {
                    type: 'directory',
                    children: {
                        'motd': { 
                            type: 'file', 
                            get content() {
                                // Liste de messages du jour
                                const mots = [
                                    "Message du jour : Amusez-vous bien !",
                                    "Message du jour : Apprenez quelque chose de nouveau aujourd'hui.",
                                    "Message du jour : La persévérance paie toujours.",
                                    "Message du jour : Codez avec passion.",
                                    "Message du jour : Prenez une pause et respirez.",
                                    "Message du jour : La curiosité est une qualité.",
                                    "Message du jour : Essayez une nouvelle commande.",
                                    "Message du jour : Partagez vos connaissances.",
                                    "Message du jour : La simplicité est la sophistication suprême.",
                                    "Message du jour : Un bug aujourd'hui, une solution demain.",
                                    "Message du jour : La créativité commence par une idée.",
                                    "Message du jour : Osez sortir de votre zone de confort.",
                                    "Message du jour : La collaboration fait la force.",
                                    "Message du jour : Chaque jour est une nouvelle opportunité.",
                                    "Message du jour : L'échec est le début du succès.",
                                    "Message du jour : Prenez soin de vous.",
                                    "Message du jour : La patience est une vertu.",
                                    "Message du jour : Faites de votre mieux.",
                                    "Message du jour : Le partage, c'est la vie."
                                ];
                                // Utilise le jour de l'année pour choisir un message
                                const now = new Date();
                                const start = new Date(now.getFullYear(), 0, 0);
                                const diff = now - start;
                                const oneDay = 1000 * 60 * 60 * 24;
                                const dayOfYear = Math.floor(diff / oneDay);
                                return mots[dayOfYear % mots.length];
                            }
                        }
                    }
                }
            }
        }
    },
    history: [],
    historyIndex: -1,
    isLoadingLLM: false,
    currentOpenMenu: null, // 'file', 'tools', 'help', ou null
    awaitingPseudo: false,
    defaultMessage: "Console initialisée. Tapez \"help\" pour une liste de commandes.",

    // --- Initialization ---
    init() {
        this.loadHistoryFromCookie();
        this.loadFileSystemFromCookie();
        // Event Listeners for command input
        this.commandFormElement.addEventListener('submit', this.handleCommandSubmit.bind(this));
        this.commandInputElement.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Event Listeners for Menus
        this.fileMenuButton.addEventListener('click', () => this.toggleMenu('file'));
        this.toolsMenuButton.addEventListener('click', () => this.toggleMenu('tools'));
        this.helpMenuButton.addEventListener('click', () => this.toggleMenu('help'));
        document.addEventListener('mousedown', this.handleClickOutsideMenu.bind(this));

        // Event Listeners for Modal
        this.openImportModalButton.addEventListener('click', this.openCodeImportModal.bind(this));
        this.cancelImportButton.addEventListener('click', this.closeCodeImportModal.bind(this));
        this.confirmImportButton.addEventListener('click', this.handleCodeImport.bind(this));
        this.closeAboutModalButton.addEventListener('click', this.closeAboutModal.bind(this));

        // Event Listeners for History Modal
        this.showHistoryButton.addEventListener('click', this.openHistoryModal.bind(this));
        this.closeHistoryModalButton.addEventListener('click', this.closeHistoryModal.bind(this));

        // Drag and Drop
        this.appContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        this.appContainer.addEventListener('drop', this.handleDrop.bind(this));


        this.updatePrompt();
        this.commandInputElement.focus();
        this.addOutput(this.defaultMessage, 'system');

        document.getElementById('font-size-range').addEventListener('input', function() {
            document.getElementById('font-size-value').textContent = this.value + 'px';
            document.getElementById('console-output').style.fontSize = this.value + 'px';
        });

        // Gestion du modal paramètres
        document.getElementById('cancel-settings-modal').onclick = function() {
            document.getElementById('settings-modal').classList.add('hidden');
            app.clearConsole();
            app.history.forEach(entry => {
                if (entry.output) {
                    app.addOutput(entry.output, entry.type || 'command');
                }
            });
        };

        document.getElementById('save-settings-modal').onclick = function() {
            document.getElementById('settings-modal').classList.add('hidden');
            // Ajoute ici la logique de sauvegarde des paramètres si besoin
        };

        this.loadTheme();

        // Gestion du changement de thème
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', function() {
                app.applyTheme(this.value);
            });
        }

        // Gestion du changement de police
        const fontSelect = document.getElementById('font-family-select');
        if (fontSelect) {
            fontSelect.addEventListener('change', function() {
                app.applyFontFamily(this.value);
            });
        }

        this.loadFontFamily();
        this.loadFontSize();
        this.loadConsoleBackground();

        // Fond console
        const bgType = document.getElementById('console-bg-type');
        const bgColor = document.getElementById('console-bg-color');
        const bgUrl = document.getElementById('console-bg-url');
        const bgFile = document.getElementById('console-bg-file');
        const bgImageImportGroup = document.getElementById('console-bg-image-import-group');
            if (bgType && bgColor && bgUrl && bgFile && bgImageImportGroup) {
                bgType.addEventListener('change', function() {
                    if (this.value === 'color') {
                        bgColor.style.display = 'inline-block';
                        bgUrl.style.display = 'none';
                        bgImageImportGroup.style.display = 'none';
                        // Restaure la dernière couleur utilisée
                        const lastColor = localStorage.getItem('console_bg_last_color') || '#18181b';
                        bgColor.value = lastColor;
                        app.applyConsoleBackground('color', lastColor);
                    } else {
                        bgColor.style.display = 'none';
                        bgUrl.style.display = 'inline-block';
                        bgImageImportGroup.style.display = 'block';
                        // Restaure la dernière image utilisée
                        const lastImage = localStorage.getItem('console_bg_last_image') || '';
                        bgUrl.value = lastImage;
                        app.applyConsoleBackground('image', lastImage);
                    }
            });
            
            bgColor.addEventListener('input', function() {
                if (bgType.value === 'color') {
                    app.applyConsoleBackground('color', this.value);
                }
            });
            bgUrl.addEventListener('input', function() {
                if (bgType.value === 'image') {
                    app.applyConsoleBackground('image', this.value);
                }
            });
            bgFile.addEventListener('change', function() {
                if (bgType.value === 'image' && this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        app.applyConsoleBackground('image', e.target.result);
                        // Met à jour l'input URL pour garder la cohérence
                        bgUrl.value = e.target.result;
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }

        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.onclick = function() {
                app.history = [];
                app.saveHistoryToCookie();
                app.openHistoryModal(); // Rafraîchit la vue du modal
            };
        }
    },

    // --- Output Management ---
    addOutput(line, type = 'normal') {
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = line;
        if (type === 'command') {
            lineDiv.classList.add('text-gray-400');
        } else if (type === 'error') {
            lineDiv.classList.add('text-red-400');
        } else if (type === 'system') {
            lineDiv.classList.add('text-purple-400');
        }
        this.outputElement.insertBefore(lineDiv, this.consoleEndRefElement);
        this.scrollToBottom();
    },

    clearConsole() {
        // Remove all children except loadingLLMIndicator and consoleEndRefElement
        const toKeep = [this.loadingLLMIndicator, this.consoleEndRefElement];
        Array.from(this.outputElement.childNodes).forEach(child => {
            if (!toKeep.includes(child)) {
                this.outputElement.removeChild(child);
            }
        });
        // Ensure loadingLLMIndicator is before consoleEndRefElement
        if (this.outputElement.contains(this.loadingLLMIndicator) && this.outputElement.contains(this.consoleEndRefElement)) {
            if (this.loadingLLMIndicator.nextSibling !== this.consoleEndRefElement) {
                this.outputElement.insertBefore(this.loadingLLMIndicator, this.consoleEndRefElement);
            }
        }
        this.addOutput(this.defaultMessage, 'system');
    },

    scrollToBottom() {
        this.consoleEndRefElement.scrollIntoView({ behavior: 'smooth' });
    },

    updatePrompt() {
        // Utilise le pseudo du cookie si présent, sinon "user"
        let pseudo = this.getPseudoFromCookie() || "user";
        this.promptLabelElement.innerHTML = `${pseudo}@webconsole:<span class="text-blue-400">${this.currentDir}</span>$`;
    },

    // --- File System Navigation ---
    getPath(path, fs = this.fileSystem) {
        const parts = path.split('/').filter(p => p !== '');
        let current = fs['/'];
        for (const part of parts) {
            if (!current || current.type !== 'directory' || !current.children[part]) {
                return null; // Path not found
            }
            current = current.children[part];
        }
        return current;
    },

    resolvePath(path) {
        if (path.startsWith('/')) {
            return path === '' ? '/' : path; // Handle empty absolute path as root
        }
        const currentParts = this.currentDir === '/' ? [] : this.currentDir.split('/').filter(p => p !== '');
        const pathParts = path.split('/').filter(p => p !== '');
        const resolvedParts = [...currentParts];

        for (const part of pathParts) {
            if (part === '..') {
                if (resolvedParts.length > 0) {
                    resolvedParts.pop();
                }
            } else if (part !== '.') {
                resolvedParts.push(part);
            }
        }
        const finalPath = '/' + resolvedParts.join('/');
        return finalPath === '/' && resolvedParts.length === 0 ? '/' : finalPath; // Ensure root is '/'
    },

    // --- Command Execution ---
    async handleCommandSubmit(e) {
        if (e) e.preventDefault();
        const commandText = this.commandInputElement.value.trim();

        // Gestion de la saisie du pseudo pour cconnect
        if (this.awaitingPseudo) {
            const pseudo = commandText.trim();
            if (!pseudo) {
                this.addOutput("Erreur : le pseudo ne peut pas être vide.", "error");
            } else {
                this.setPseudoCookie(pseudo);
                this.addOutput(`Connecté en tant que <span class="text-green-400">${pseudo}</span>.`, "system");
                this.updatePrompt();
            }
            this.awaitingPseudo = false;
            this.commandInputElement.value = '';
            this.historyIndex = -1;
            return;
        }

        if (commandText === '') {
            this.addOutput(`<span class="text-green-400">${this.getPseudoFromCookie() || "user"}@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ `, 'command');
            this.commandInputElement.value = '';
            this.historyIndex = -1;
            return;
        }

        const promptLine = `<span class="text-green-400">${this.getPseudoFromCookie() || "user"}@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${commandText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
        this.addOutput(promptLine, 'command');
        this.addToHistory(commandText, promptLine, 'command');


        this.historyIndex = -1;

        const [cmd, ...args] = commandText.split(/\s+/);
        const execute = this.commands[cmd];

        if (execute) {
            try {
                await execute.call(this, args); // Ensure 'this' context is correct for commands
            } catch (error) {
                this.addOutput(`Erreur lors de l'exécution de la commande ${cmd}: ${error.message}`, 'error');
                console.error(`Command execution error (${cmd}):`, error);
            }
        } else {
            this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
        }

        this.commandInputElement.value = '';
        this.updatePrompt(); // Update prompt in case cd changed directory
        this.commandInputElement.focus(); // Re-focus after command execution
    },

    // --- Utilitaire pour marquer une commande en développement ---
    enDev(nom = "Cette commande") {
        this.addOutput(
            `<span class="px-2 py-1 rounded bg-yellow-700 text-yellow-200 font-semibold inline-block">⚠️ ${nom} n'est pas encore implémenté.</span>`,
            'system'
        );
    },

    // --- Command Definitions ---
    commands: {
        echo(args) {
            this.addOutput(args.join(' ').replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        },
        ls(args) {
            const targetPathArg = args[0] || '.';
            const targetPath = this.resolvePath(targetPathArg);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`ls: impossible d'accéder à '${targetPathArg}': Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            if (targetNode.type !== 'directory') {
                this.addOutput(targetPath.split('/').pop() || targetPathArg);
                return;
            }

            const childrenNames = Object.keys(targetNode.children).sort();
            if (childrenNames.length === 0) {
                // this.addOutput(''); // Empty directory, output nothing as per typical ls
                return;
            }
            // Output with HTML for colors
            this.addOutput(childrenNames.map(name => {
                const child = targetNode.children[name];
                return child.type === 'directory' ? `<span class="text-blue-400">${name}/</span>` : name;
            }).join('<span class="mx-1"></span>')); // Use spans for spacing to allow wrapping
        },
        cd(args) {
            if (args.length === 0) {
                this.currentDir = this.resolvePath('/home/user');
                this.updatePrompt();
                return;
            }
            const newPath = this.resolvePath(args[0]);
            const targetNode = this.getPath(newPath);

            if (!targetNode) {
                this.addOutput(`cd: ${args[0]}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            if (targetNode.type !== 'directory') {
                this.addOutput(`cd: ${args[0]}: Pas un dossier`, 'error');
                return;
            }
            this.currentDir = newPath;
            this.updatePrompt();
        },
        pwd() {
            this.addOutput(this.currentDir);
        },
        clear() {
            this.clearConsole();
        },
        cat(args) {
            if (args.length === 0) {
                this.addOutput('cat: manque un opérande', 'error');
                this.addOutput('Utilisez "cat --help" pour plus d\'informations.');
                return;
            }
            const targetPath = this.resolvePath(args[0]);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`cat: ${args[0]}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            if (targetNode.type === 'directory') {
                this.addOutput(`cat: ${args[0]}: Est un dossier`, 'error');
                return;
            }
            // Escape HTML in content
            this.addOutput(targetNode.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").split('\n').join('<br>'));
        },
        help() {
            this.addOutput('<span class="font-bold text-purple-300 text-lg">Commandes disponibles :</span>');
            
            // Section: Navigation
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🗂️ Navigation</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">pwd</span> <span class="text-gray-400">- Affiche le dossier courant.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">cd</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;dossier&gt;</span> <span class="text-gray-400">- Change le dossier courant.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">ls</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[dossier]</span> <span class="text-gray-400">- Liste le contenu du dossier.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Fichiers & Dossiers
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">📁 Fichiers & Dossiers</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">cat</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Affiche le contenu d\'un fichier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">mkdir</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;dossier&gt;</span> <span class="text-gray-400">- Crée un dossier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">touch</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Crée un fichier vide.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">rm</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier/dossier&gt;</span> <span class="text-gray-400">- Supprime un fichier ou dossier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">edit</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Édite un fichier avec un éditeur riche.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Utilitaires
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🛠️ Utilitaires</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">echo</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;texte&gt;</span> <span class="text-gray-400">- Affiche le texte donné.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">clear</span> <span class="text-gray-400">- Efface la console.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">help</span> <span class="text-gray-400">- Affiche cette aide.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">about</span> <span class="text-gray-400">- À propos de la console.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">cconnect</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;username&gt;</span> <span class="text-gray-400">- Change de pseudo utilisateur.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">cdisconnect</span> <span class="text-gray-400">- Déconnecte l\'utilisateur.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">history</span> <span class="text-gray-400">- Affiche l\'historique des commandes.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">github</span> <span class="text-gray-400">- Lien vers le dépôt GitHub du projet.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Gestion Caches
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🧹 Gestion du cache</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">save</span> <span class="text-gray-400">- Enregistre le système de fichiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">load</span> <span class="text-gray-400">- Charge le système de fichiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">clearHistory</span> <span class="text-gray-400">- Efface l\'historique des commandes.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400">delAllCache</span> <span class="text-gray-400">- Efface tous les cookies, le cache et l\'historique.</span></span>');
        },
        mkdir(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('mkdir: manque un nom de dossier', 'error');
            return;
            }
            const dirName = args[0].trim();
            if (dirName.includes('/')) {
            this.addOutput('mkdir: le nom du dossier ne doit pas contenir de "/"', 'error');
            return;
            }
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
            this.addOutput('mkdir: dossier courant invalide', 'error');
            return;
            }
            if (currentNode.children[dirName]) {
            this.addOutput(`mkdir: impossible de créer le dossier '${dirName}': Le fichier existe`, 'error');
            return;
            }
            currentNode.children[dirName] = {
                type: 'directory',
                children: {}
            };
            this.saveFileSystemToCookie();
            this.addOutput(`Dossier '${dirName}' créé.`);
            this.addToHistory(`mkdir ${dirName}`, `Dossier '${dirName}' créé.`, 'system');
        },
        rm(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('rm: manque un nom de fichier ou dossier', 'error');
                return;
            }
            // Retire le slash final éventuel
            let targetName = args[0].trim();
            if (targetName.endsWith('/')) {
                targetName = targetName.slice(0, -1);
            }
            if (targetName === '.' || targetName === '..') {
                this.addOutput(`rm: suppression de '${targetName}' non autorisée`, 'error');
                return;
            }
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
                this.addOutput('rm: dossier courant invalide', 'error');
                return;
            }
            if (!currentNode.children[targetName]) {
                this.addOutput(`rm: impossible de supprimer '${targetName}': Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            // For directories, only allow if empty
            if (currentNode.children[targetName].type === 'directory' &&
                Object.keys(currentNode.children[targetName].children).length > 0) {
                this.addOutput(`rm: impossible de supprimer '${targetName}': Le dossier n'est pas vide`, 'error');
                return;
            }
            delete currentNode.children[targetName];
            this.saveFileSystemToCookie();
            this.addOutput(`'${targetName}' supprimé.`);
        },
        touch(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('touch: manque un nom de fichier', 'error');
            return;
            }
            const fileName = args[0].trim();
            if (fileName.includes('/')) {
            this.addOutput('touch: le nom du fichier ne doit pas contenir de "/"', 'error');
            return;
            }
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
            this.addOutput('touch: dossier courant invalide', 'error');
            return;
            }
            if (currentNode.children[fileName]) {
            // Si le fichier existe déjà, ne rien faire (comportement touch standard)
            this.addOutput(`Fichier '${fileName}' déjà existant.`);
            return;
            }
            currentNode.children[fileName] = {
            type: 'file',
            content: ''
            };
            this.saveFileSystemToCookie();
            this.addOutput(`Fichier '${fileName}' créé.`);
        },
        about() {
            this.openAboutModal();
        },

        cconnect: async function(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('Erreur : veuillez fournir un pseudo. Utilisation : cconnect <username>', 'error');
                return;
            }
            const pseudo = args[0].trim();
            this.setPseudoCookie(pseudo);
            this.addOutput(`Connecté en tant que <span class="text-green-400">${pseudo}</span>.`, "system");
            this.updatePrompt();
        },

        cdisconnect: function() {
            // Supprime le cookie pseudo
            document.cookie = "pseudo=;path=/;max-age=0";
            this.addOutput('Déconnecté. Le pseudo a été réinitialisé à "user".', "system");
            this.updatePrompt();
        },
        history: function() {
            if (this.history.length === 0) {
                this.addOutput('Aucune commande enregistrée.', 'system');
            } else {
                this.openHistoryModal();
            }
        },
        edit(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('edit: manque un nom de fichier', 'error');
            return;
            }
            const fileName = args[0].trim();
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
            this.addOutput(`edit: ${fileName}: Aucun fichier de ce type`, 'error');
            return;
            }
            if (targetNode.type !== 'file') {
            this.addOutput(`edit: ${fileName}: N'est pas un fichier`, 'error');
            return;
            }

            // Crée le modal si pas déjà présent
            let modal = document.getElementById('edit-modal');
            if (!modal) {
            modal = document.createElement('div');
            modal.id = 'edit-modal';
            modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50';
            modal.innerHTML = `
                <div class="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-2xl relative border border-blue-700">
                    <button id="edit-close-x" class="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-150">&times;</button>
                    <div class="mb-4 flex flex-wrap gap-2 items-center">
                        <button type="button" id="edit-bold-btn" class="px-3 py-1 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-600 transition">Gras</button>
                        <button type="button" id="edit-italic-btn" class="px-3 py-1 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-600 transition">Italique</button>
                        <button type="button" id="edit-underline-btn" class="px-3 py-1 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-600 transition">Souligné</button>
                        <button type="button" id="edit-removeformat-btn" class="px-3 py-1 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 transition">Effacer format</button>
                        <input type="color" id="edit-color-picker" title="Couleur du texte" class="w-8 h-8 align-middle ml-3 border-2 border-blue-700 rounded-full shadow">
                        <select id="edit-font-size-picker" class="ml-2 px-2 py-1 rounded-lg bg-gray-800 text-white border border-blue-700 shadow">
                            <option value="2">Petit</option>
                            <option value="3" selected>Moyen</option>
                            <option value="4">Grand</option>
                            <option value="5">Très grand</option>
                        </select>
                    </div>
                    <div id="edit-rich-text-editor" contenteditable="true" class="bg-gray-950 text-white border border-blue-700 rounded-lg p-4 min-h-[140px] mb-6 focus:outline-none shadow-inner transition"></div>
                    <div class="flex gap-3 justify-end">
                        <button id="edit-save-btn" class="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-500 font-semibold transition">💾 Enregistrer</button>
                        <button id="edit-exit-btn" class="px-5 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 font-semibold transition">Quitter</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            }
            modal.classList.remove('hidden');

            // Remplit l'éditeur avec le contenu du fichier
            document.getElementById('edit-rich-text-editor').innerHTML = targetNode.content;

            // Ajoute les fonctionnalités avancées
            setTimeout(() => {
            const editor = document.getElementById('edit-rich-text-editor');
            const colorPicker = document.getElementById('edit-color-picker');
            const fontSizePicker = document.getElementById('edit-font-size-picker');

            document.getElementById('edit-bold-btn').onclick = (ev) => {
                ev.preventDefault();
                document.execCommand('bold', false, null);
            };
            document.getElementById('edit-italic-btn').onclick = (ev) => {
                ev.preventDefault();
                document.execCommand('italic', false, null);
            };
            document.getElementById('edit-underline-btn').onclick = (ev) => {
                ev.preventDefault();
                document.execCommand('underline', false, null);
            };
            document.getElementById('edit-removeformat-btn').onclick = (ev) => {
                ev.preventDefault();
                document.execCommand('removeFormat', false, null);
            };

            colorPicker.addEventListener('input', function() {
                const color = this.value;
                if (window.getSelection) {
                const sel = window.getSelection();
                if (sel.rangeCount) {
                    const range = sel.getRangeAt(0);
                    const span = document.createElement('span');
                    span.style.color = color;
                    span.appendChild(range.extractContents());
                    range.insertNode(span);
                }
                }
            });

            fontSizePicker.addEventListener('change', function() {
                const sizeMap = { '2': '12px', '3': '16px', '4': '20px', '5': '24px' };
                const size = sizeMap[this.value] || '16px';
                if (window.getSelection) {
                const sel = window.getSelection();
                if (sel.rangeCount) {
                    const range = sel.getRangeAt(0);
                    const span = document.createElement('span');
                    span.style.fontSize = size;
                    span.appendChild(range.extractContents());
                    range.insertNode(span);
                }
                }
            });

            // Save
            document.getElementById('edit-save-btn').onclick = () => {
                targetNode.content = editor.innerHTML;
                app.saveFileSystemToCookie();
                modal.classList.add('hidden');
                app.addOutput(`Fichier <span class="text-blue-400">${fileName}</span> enregistré.`, 'system');
                app.updatePrompt();
                app.commandInputElement.focus();
            };
            // Exit
            const closeModal = () => {
                modal.classList.add('hidden');
                app.addOutput('Édition annulée.', 'system');
                app.updatePrompt();
                app.commandInputElement.focus();
            };
            document.getElementById('edit-exit-btn').onclick = closeModal;
            document.getElementById('edit-close-x').onclick = closeModal;

            editor.focus();
            }, 0);
        },
    
        commandeDev : function() {
            this.enDev();
        },
        github : function() {
            this.addOutput(
                '<span class="font-bold text-blue-400">Projet open source !</span><br>' +
                '<a href="https://github.com/Klaynight-dev/Web_linux_console" target="_blank" class="underline text-blue-300 hover:text-blue-500 transition-colors">' +
                '<i class="fab fa-github"></i> Visitez notre dépôt GitHub</a> pour plus d\'informations.',
                'system'
            );
        },
        clearHistory: function() {
            this.history = [];
            this.saveHistoryToCookie();
            this.addOutput('Historique des commandes effacé.', 'system');
        },
        delAllCache: function() {
            // Supprime tous les cookies liés à l'app
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name.trim() + "=;path=/;max-age=0";
            });
            // Réinitialise l'état localStorage et mémoire
            this.clearConsole();
            this.history = [];
            this.saveHistoryToCookie();
            this.fileSystem = { '/': { type: 'directory', children: {} } };
            this.saveFileSystemToCookie();
            this.addOutput('Tous les cookies, le cache et l\'historique ont été effacés.', 'system');
        },
        save: function() {
            this.saveFileSystemToCookie();
            this.addOutput('Système de fichiers enregistré dans le cookie.', 'system');
        },
        load: function() {
            this.loadFileSystemFromCookie();
            this.addOutput('Système de fichiers chargé depuis le cookie.', 'system');
        },
    },

    // --- Event Handlers ---
    handleKeyDown(e) {
        if (this.isLoadingLLM) return; // Don't process keydown if LLM is loading

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const entry = this.history[this.history.length - 1 - this.historyIndex];
                this.commandInputElement.value = entry.cmd;
                this.commandInputElement.setSelectionRange(this.commandInputElement.value.length, this.commandInputElement.value.length); // Move cursor to end
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const entry = this.history[this.history.length - 1 - this.historyIndex];
                this.commandInputElement.value = entry.cmd;
                this.commandInputElement.setSelectionRange(this.commandInputElement.value.length, this.commandInputElement.value.length);
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.commandInputElement.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.handleTabCompletion();
        } else if (e.key === 'l' && e.ctrlKey) { // Ctrl+L for clear
            e.preventDefault();
            this.commands.clear.call(this);
        }
    },

    handleTabCompletion() {
        const currentCommandValue = this.commandInputElement.value;
        const parts = currentCommandValue.split(/\s+/);
        const currentWord = parts.pop() || ""; // The word we're trying to complete
        const baseCommand = parts.join(" "); // The command part before the current word

        let suggestions = [];

        if (parts.length === 0 || (parts.length === 1 && !currentCommandValue.includes(" "))) { // Completing a command name
            suggestions = Object.keys(this.commands).filter(cmdName => cmdName.startsWith(currentWord));
        } else { // Completing a file/directory path
            const dirNode = this.getPath(this.currentDir);
            if (dirNode && dirNode.type === 'directory') {
                    suggestions = Object.keys(dirNode.children).filter(childName => childName.startsWith(currentWord));
                    // Add trailing slash for directories
                    suggestions = suggestions.map(s => dirNode.children[s].type === 'directory' ? s + '/' : s);
            }
        }

        if (suggestions.length === 1) {
            this.commandInputElement.value = (baseCommand ? baseCommand + " " : "") + suggestions[0] + (suggestions[0].endsWith('/') ? '' : ' ');
        } else if (suggestions.length > 1) {
            this.addOutput(suggestions.join('  '));
            const pseudo = this.getPseudoFromCookie() || "user";
            this.addOutput(
                `<span class="text-green-400">${pseudo}@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${currentCommandValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`,
                'command'
            );

        }
    },

    // --- Menu Logic ---
    toggleMenu(menuName) {
        const dropdowns = {
            file: this.fileMenuDropdown,
            tools: this.toolsMenuDropdown,
            help: this.helpMenuDropdown,
        };

        if (this.currentOpenMenu === menuName) {
            dropdowns[menuName].classList.add('hidden');
            this.currentOpenMenu = null;
        } else {
            this.closeAllMenus(); // Close any other open menu
            dropdowns[menuName].classList.remove('hidden');
            this.currentOpenMenu = menuName;
        }
    },

    closeAllMenus() {
        this.fileMenuDropdown.classList.add('hidden');
        this.toolsMenuDropdown.classList.add('hidden');
        this.helpMenuDropdown.classList.add('hidden');
        this.currentOpenMenu = null;
    },

    handleClickOutsideMenu(event) {
        if (this.currentOpenMenu) {
            const menuButton = document.getElementById(`${this.currentOpenMenu}-menu-button`);
            const menuDropdown = document.getElementById(`${this.currentOpenMenu}-menu-dropdown`);
            if (menuButton && !menuButton.contains(event.target) && menuDropdown && !menuDropdown.contains(event.target)) {
                this.closeAllMenus();
            }
        }
    },

    // --- Modal Logic ---
    openCodeImportModal() {
        this.codeImportModal.classList.remove('hidden');
        this.codeToImportTextarea.value = ''; // Clear previous content
        this.codeToImportTextarea.focus();
        this.closeAllMenus();
    },

    closeCodeImportModal() {
        this.codeImportModal.classList.add('hidden');
    },

    handleCodeImport() {
        const codeToImport = this.codeToImportTextarea.value;
        if (codeToImport.trim() === '') {
            this.addOutput('Aucun code à importer.', 'error');
            this.closeCodeImportModal();
            return;
        }
        this.addOutput('Code importé! (Fonctionnalité d\'intégration réelle en développement)', 'system');
        this.addOutput('Contenu du code (pour démonstration):');
        this.addOutput(codeToImport.replace(/</g, "&lt;").replace(/>/g, "&gt;").split('\n').map(line => `&gt; ${line}`).join('<br/>'));
        // In a real scenario, you would parse this code and potentially
        // dynamically add it as a new command or script.
        // For example, using eval() (with extreme caution due to security risks)
        // or a more sophisticated parsing and execution engine.
        this.closeCodeImportModal();
    },

    openAboutModal() {
        this.aboutModal.classList.remove('hidden');
        this.closeAllMenus();
    },
    closeAboutModal() {
        this.aboutModal.classList.add('hidden');
    },

    openHistoryModal() {
        this.historyModal.classList.remove('hidden');
        if (this.history.length === 0) {
            this.historyList.innerHTML = "<em>Aucune commande enregistrée.</em>";
        } else {
            this.historyList.innerHTML = this.history
                .map((entry, idx) =>
                    `<span class="text-gray-400">#${idx + 1}</span> ` +
                    `<span class="text-blue-300">${entry.date} ${entry.time}</span> ` +
                    `<span>${entry.cmd.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`
                )
                .reverse()
                .join('<br>');
        }
        this.closeAllMenus();
    },
    closeHistoryModal() {
        this.historyModal.classList.add('hidden');
    },

    showHistory() {
        this.historyList.innerHTML = ''; // Clear current history list
        this.history.slice().reverse().forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.classList.add('text-gray-300', 'py-1', 'border-b', 'border-gray-700');
            entryElement.innerHTML = `${this.history.length - index}: ${entry.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
            this.historyList.appendChild(entryElement);
        });
    },

    // --- Drag and Drop ---
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        // Optional: Add visual feedback for drag over
        // this.appContainer.classList.add('border-dashed', 'border-2', 'border-blue-500');
    },

    // handleDragLeave(e) {
    //     this.appContainer.classList.remove('border-dashed', 'border-2', 'border-blue-500');
    // },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        // this.appContainer.classList.remove('border-dashed', 'border-2', 'border-blue-500');

        this.addOutput('Fichier détecté! La fonctionnalité de glisser-déposer pour l\'importation est en cours de développement.', 'system');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            this.addOutput(`Nom du fichier: ${file.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}, Type: ${file.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`);

            // Example: Read file content (text files only for this demo)
            if (file.type.startsWith('text/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.addOutput('Contenu du fichier (premiers 200 caractères):', 'system');
                    const contentPreview = event.target.result.substring(0, 200).replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    this.addOutput(contentPreview + (event.target.result.length > 200 ? '...' : ''));
                    // Here you could offer to 'cat' the file, or import it if it's a script
                };
                reader.onerror = () => {
                    this.addOutput(`Erreur de lecture du fichier ${file.name}`, 'error');
                };
                reader.readAsText(file);
            } else {
                this.addOutput('Le type de fichier n\'est pas supporté pour la prévisualisation du contenu.', 'system');
            }
        }
    },

    setPseudoCookie(pseudo) {
        document.cookie = `pseudo=${encodeURIComponent(pseudo)};path=/;max-age=31536000`; // 1 an
    },
    getPseudoFromCookie() {
        const match = document.cookie.match(/(?:^|;\s*)pseudo=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
    },

    saveHistoryToCookie() {
        // Utilise localStorage pour un historique illimité
        localStorage.setItem('history', JSON.stringify(this.history));
    },
    loadHistoryFromCookie() {
        const saved = localStorage.getItem('history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch {
                this.history = [];
            }
        } else {
            this.history = [];
        }
    },
    addToHistory(cmd, output, type = 'command') {
        const now = new Date();
        const entry = {
            cmd,
            output,
            type,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            timestamp: now.getTime()
        };
        this.history = [...this.history, entry]; // Plus de slice(-50)
        this.saveHistoryToCookie();
    },
    showFullHistory() {
        this.clearConsole();
        if (this.history && this.history.length > 0) {
            this.history.forEach(entry => {
                if (entry.output) {
                    this.addOutput(entry.output, entry.type || 'command');
                }
            });
        } else {
            this.addOutput(this.defaultMessage, 'system');
        }
    },
    saveFileSystemToCookie() {
        document.cookie = `filesystem=${encodeURIComponent(JSON.stringify(this.fileSystem))};path=/;max-age=31536000`;
    },
    loadFileSystemFromCookie() {
        const match = document.cookie.match(/(?:^|;\s*)filesystem=([^;]*)/);
        if (match) {
            try {
                this.fileSystem = JSON.parse(decodeURIComponent(match[1]));
            } catch {
                // Si erreur, on garde le système par défaut
            }
        }
    },
    // --- Dans app ---
    applyTheme(theme) {
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add('theme-' + theme);
        localStorage.setItem('console_theme', theme);
    },
    loadTheme() {
        const saved = localStorage.getItem('console_theme') || 'dark';
        this.applyTheme(saved);
        const select = document.getElementById('theme-select');
        if (select) select.value = saved;
    },
    applyFontFamily(font) {
        document.getElementById('console-output').style.fontFamily = font;
        localStorage.setItem('console_font', font);
        document.cookie = `console_font=${encodeURIComponent(font)};path=/;max-age=31536000`; // 1 an
    },
    loadFontFamily() {
        // Prend d'abord le cookie, sinon localStorage, sinon monospace
        const cookieMatch = document.cookie.match(/(?:^|;\s*)console_font=([^;]*)/);
        const saved = cookieMatch ? decodeURIComponent(cookieMatch[1]) : (localStorage.getItem('console_font') || 'monospace');
        this.applyFontFamily(saved);
        const select = document.getElementById('font-family-select');
        if (select) select.value = saved;
    },
    applyFontSize(size) {
        document.getElementById('console-output').style.fontSize = size + 'px';
        localStorage.setItem('console_font_size', size);
        document.cookie = `console_font_size=${encodeURIComponent(size)};path=/;max-age=31536000`; // 1 an
    },
    loadFontSize() {
        // Prend d'abord le cookie, sinon localStorage, sinon 16
        const cookieMatch = document.cookie.match(/(?:^|;\s*)console_font_size=([^;]*)/);
        const saved = cookieMatch ? decodeURIComponent(cookieMatch[1]) : (localStorage.getItem('console_font_size') || '16');
        this.applyFontSize(saved);
        const range = document.getElementById('font-size-range');
        if (range) range.value = saved;
        const value = document.getElementById('font-size-value');
        if (value) value.textContent = saved + 'px';
    },
    applyConsoleBackground(type, value) {
        const el = document.getElementById('console-output');
        if (type === 'color') {
            el.style.backgroundImage = '';
            el.style.backgroundColor = value;
            // Stocke la couleur courante
            document.cookie = `console_bg_type=color;path=/;max-age=31536000`;
            document.cookie = `console_bg_value=${encodeURIComponent(value)};path=/;max-age=31536000`;
            localStorage.setItem('console_bg_type', 'color');
            localStorage.setItem('console_bg_value', value);
            // Sauvegarde la dernière couleur utilisée
            localStorage.setItem('console_bg_last_color', value);
        } else if (type === 'image') {
            el.style.backgroundColor = '';
            el.style.backgroundImage = `url('${value}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            document.cookie = `console_bg_type=image;path=/;max-age=31536000`;
            localStorage.setItem('console_bg_type', 'image');
            localStorage.setItem('console_bg_value', value);
            // Efface la valeur du cookie si besoin
            document.cookie = `console_bg_value=;path=/;max-age=0`;
            // Sauvegarde la dernière image utilisée
            localStorage.setItem('console_bg_last_image', value);
        }
    },
    loadConsoleBackground() {
        const typeMatch = document.cookie.match(/(?:^|;\s*)console_bg_type=([^;]*)/);
        const type = typeMatch ? decodeURIComponent(typeMatch[1]) : (localStorage.getItem('console_bg_type') || 'color');
        let value;
        if (type === 'color') {
            const valueMatch = document.cookie.match(/(?:^|;\s*)console_bg_value=([^;]*)/);
            value = valueMatch ? decodeURIComponent(valueMatch[1]) : (localStorage.getItem('console_bg_last_color') || '#18181b');
        } else if (type === 'image') {
            value = localStorage.getItem('console_bg_last_image') || '';
        }
        this.applyConsoleBackground(type, value);
    
        // Mets à jour les inputs du modal si besoin
        const typeSelect = document.getElementById('console-bg-type');
        const colorInput = document.getElementById('console-bg-color');
        const urlInput = document.getElementById('console-bg-url');
        const bgImageImportGroup = document.getElementById('console-bg-image-import-group');
        if (typeSelect) typeSelect.value = type;
        if (colorInput) colorInput.value = localStorage.getItem('console_bg_last_color') || '#18181b';
        if (urlInput) urlInput.value = localStorage.getItem('console_bg_last_image') || '';
        if (bgImageImportGroup) bgImageImportGroup.style.display = (type === 'image' ? 'block' : 'none');
        if (colorInput) colorInput.style.display = (type === 'color' ? 'inline-block' : 'none');
        if (urlInput) urlInput.style.display = (type === 'image' ? 'inline-block' : 'none');
    },
};

// --- Initialize the App ---
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});