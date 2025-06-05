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
                        'history': { type: 'file', content: 'Affiche l\'historique des commandes.' },
                        'edit': { type: 'file', content: 'Édite un fichier avec un éditeur riche.' },
                        'github': { type: 'file', content: 'Lien vers le dépôt GitHub du projet.' },
                        'clearHistory': { type: 'file', content: 'Efface l\'historique des commandes.' },
                        'delAllCache': { type: 'file', content: 'Efface tous les cookies, le cache et l\'historique.' },
                        'save': { type: 'file', content: 'Enregistre le système de fichiers.' },
                        'load': { type: 'file', content: 'Charge le système de fichiers.' },
                        'commandeDev': { type: 'file', content: 'Commande en développement.' }
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
    // 'file', 'tools', 'help', ou null
    awaitingPseudo: false,
    defaultMessage: `
<pre class="font-mono leading-none text-xs text-purple-400">
╔═══════════════════════════════════════╗
║        █████╗ ██╗     ██╗  ██╗        ║
║       ██╔══██╗██║     ██║ ██╔╝        ║
║       ██║  ╚═╝██║     █████╔╝         ║
║       ██║  ██╗██║     ██╔═██╗         ║
║       ╚█████╔╝███████╗██║  ██╗        ║
║        ╚════╝ ╚══════╝╚═╝  ╚═╝        ║
║        CONSOLE LINUX KLAYNIGHT        ║
╚═══════════════════════════════════════╝
</pre>
<span class="text-orange-400">⚡ CLK Terminal Ready</span>
<span class="text-gray-300">Tapez "help" pour démarrer votre aventure.</span>`,

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

        document.getElementById('font-size-range').addEventListener('input', function () {
            document.getElementById('font-size-value').textContent = this.value + 'px';
            document.getElementById('console-output').style.fontSize = this.value + 'px';
        });

        // Gestion du modal paramètres
        document.getElementById('cancel-settings-modal').onclick = function () {
            document.getElementById('settings-modal').classList.add('hidden');
        };

        document.getElementById('save-settings-modal').onclick = function () {
            document.getElementById('settings-modal').classList.add('hidden');
            // Ajoute ici la logique de sauvegarde des paramètres si besoin
        };

        this.loadTheme();

        // Gestion du changement de thème
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', function () {
                app.applyTheme(this.value);
            });
        }

        // Gestion du changement de police
        const fontSelect = document.getElementById('font-family-select');
        if (fontSelect) {
            fontSelect.addEventListener('change', function () {
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
            bgType.addEventListener('change', function () {
                if (this.value === 'color') {
                    bgColor.style.display = 'inline-block';
                    bgUrl.style.display = 'none';
                    bgImageImportGroup.style.display = 'none';
                    // Restaure la dernière couleur utilisée
                    const lastColor = localStorage.getItem('console_bg_last_color') || '#1f2934';
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

            bgColor.addEventListener('input', function () {
                if (bgType.value === 'color') {
                    app.applyConsoleBackground('color', this.value);
                }
            });
            bgUrl.addEventListener('input', function () {
                if (bgType.value === 'image') {
                    app.applyConsoleBackground('image', this.value);
                }
            });
            bgFile.addEventListener('change', function () {
                if (bgType.value === 'image' && this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
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
            clearHistoryBtn.onclick = function () {
                app.history = [];
                app.saveHistoryToCookie();
                app.openHistoryModal(); // Rafraîchit la vue du modal
            };
        }

        // Charger les informations de version
        this.loadVersionInfo();

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

    // --- Utility function for parsing command options ---
    parseOptions(args, optionMap) {
        const result = { _: [] };
        let i = 0;

        while (i < args.length) {
            const arg = args[i];

            if (arg.startsWith('-') && arg.length > 1) {
                const option = arg.slice(1);
                if (optionMap[option]) {
                    result[optionMap[option]] = true;
                    result[option] = true;
                } else {
                    result[option] = true;
                }
            } else {
                result._.push(arg);
            }
            i++;
        }

        return result;
    },

    // --- Utility function for formatting bytes ---
    formatBytes(bytes) {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'K', 'M', 'G', 'T'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
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

            // Handle --help option
            if (args[0] === '--help') {
                this.addOutput('<span class="font-bold text-blue-400">cat - concaténer et afficher des fichiers</span>');
                this.addOutput('');
                this.addOutput('<span class="text-green-400">UTILISATION:</span>');
                this.addOutput('    cat [OPTION]... [FICHIER]...');
                this.addOutput('');
                this.addOutput('<span class="text-green-400">DESCRIPTION:</span>');
                this.addOutput('    Concatène et affiche le contenu des fichiers spécifiés.');
                this.addOutput('    Si aucun fichier n\'est spécifié, lit depuis l\'entrée standard.');
                this.addOutput('');
                this.addOutput('<span class="text-green-400">OPTIONS:</span>');
                this.addOutput('    --help     affiche cette aide et quitte');
                this.addOutput('');
                this.addOutput('<span class="text-green-400">EXEMPLES:</span>');
                this.addOutput('    cat fichier.txt        affiche le contenu de fichier.txt');
                this.addOutput('    cat file1 file2        affiche le contenu de file1 puis file2');
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
            // Display content as HTML (allows formatting from rich text editor)
            this.addOutput(targetNode.content);
        },
        help() {
            this.addOutput('<span class="font-bold text-purple-300 text-lg">Commandes disponibles :</span>');

            // Section: Navigation
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🗂️ Navigation</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="pwd">pwd</span> <span class="text-gray-400">- Affiche le dossier courant.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cd ">cd</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;dossier&gt;</span> <span class="text-gray-400">- Change le dossier courant.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="ls ">ls</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[dossier]</span> <span class="text-gray-400">- Liste le contenu du dossier.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Fichiers & Dossiers
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">📁 Fichiers & Dossiers</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cat ">cat</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Affiche le contenu d\'un fichier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="mkdir ">mkdir</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;dossier&gt;</span> <span class="text-gray-400">- Crée un dossier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="touch ">touch</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Crée un fichier vide.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="rm ">rm</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier/dossier&gt;</span> <span class="text-gray-400">- Supprime un fichier ou dossier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="edit ">edit</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier&gt;</span> <span class="text-gray-400">- Édite un fichier avec un éditeur riche.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="find ">find</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options] &lt;chemin&gt;</span> <span class="text-gray-400">- Recherche des fichiers et dossiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cp ">cp</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;source&gt; &lt;dest&gt;</span> <span class="text-gray-400">- Copie un fichier ou dossier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="mv ">mv</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;source&gt; &lt;dest&gt;</span> <span class="text-gray-400">- Déplace/renomme un fichier ou dossier.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Utilitaires
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🛠️ Utilitaires</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="echo ">echo</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;texte&gt;</span> <span class="text-gray-400">- Affiche le texte donné.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="clear">clear</span> <span class="text-gray-400">- Efface la console.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="help">help</span> <span class="text-gray-400">- Affiche cette aide.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="about">about</span> <span class="text-gray-400">- À propos de la console.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cconnect ">cconnect</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;username&gt;</span> <span class="text-gray-400">- Change de pseudo utilisateur.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cdisconnect">cdisconnect</span> <span class="text-gray-400">- Déconnecte l\'utilisateur.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="history">history</span> <span class="text-gray-400">- Affiche l\'historique des commandes.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="github">github</span> <span class="text-gray-400">- Lien vers le dépôt GitHub du projet.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="tree ">tree</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options] [chemin]</span> <span class="text-gray-400">- Affiche l\'arborescence des dossiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="grep ">grep</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options] &lt;motif&gt; &lt;fichier&gt;</span> <span class="text-gray-400">- Recherche un motif dans un fichier.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="wc ">wc</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options] &lt;fichier&gt;</span> <span class="text-gray-400">- Compte les lignes, mots et caractères.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="date">date</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options]</span> <span class="text-gray-400">- Affiche la date et l\'heure.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="sudo ">sudo</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;commande&gt;</span> <span class="text-gray-400">- Exécute une commande avec privilèges admin.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ">man</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[commande]</span> <span class="text-gray-400">- Affiche le manuel d\'une commande.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="whoami">whoami</span> <span class="text-gray-400">- Affiche l\'utilisateur actuel.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="uptime">uptime</span> <span class="text-gray-400">- Affiche le temps de fonctionnement du système.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Système & Processus
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">⚙️ Système & Processus</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="ps ">ps</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options]</span> <span class="text-gray-400">- Affiche les processus en cours.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="top">top</span> <span class="text-gray-400">- Affiche les processus actifs en temps réel.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="free ">free</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options]</span> <span class="text-gray-400">- Affiche l\'utilisation de la mémoire.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="df ">df</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options]</span> <span class="text-gray-400">- Affiche l\'espace disque disponible.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="kill ">kill</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;pid&gt;</span> <span class="text-gray-400">- Termine un processus par son PID.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="killall ">killall</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;nom&gt;</span> <span class="text-gray-400">- Termine tous les processus par nom.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Gestion Internet
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🌐 Gestion Internet</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="lshw">lshw</span> <span class="text-gray-400">- Affiche des informations matérielles sur le navigateur.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="ifconfig">ifconfig</span> <span class="text-gray-400">- Affiche la configuration réseau accessible.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="ping ">ping</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;adresse&gt;</span> <span class="text-gray-400">- Teste la connectivité réseau.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="wget ">wget</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;url&gt;</span> <span class="text-gray-400">- Télécharge un fichier depuis une URL.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="curl ">curl</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">[options] &lt;url&gt;</span> <span class="text-gray-400">- Transfère des données depuis/vers un serveur.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Importation de commandes
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">📦 Importation de commandes</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="import ">import</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier.js&gt; | --url &lt;url&gt;</span> <span class="text-gray-400">- Importe des commandes depuis un fichier ou une URL.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="listCommands">listCommands</span> <span class="text-gray-400">- Liste toutes les commandes disponibles.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="createCommandFile ">createCommandFile</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;fichier.js&gt;</span> <span class="text-gray-400">- Crée un fichier de commandes avec modèle.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Gestion Caches
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🧹 Gestion du cache</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="save">save</span> <span class="text-gray-400">- Enregistre le système de fichiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="load">load</span> <span class="text-gray-400">- Charge le système de fichiers.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="clearHistory">clearHistory</span> <span class="text-gray-400">- Efface l\'historique des commandes.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="delAllCache">delAllCache</span> <span class="text-gray-400">- Efface tous les cookies, le cache et l\'historique.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Section: Divertissement & Jeux
            this.addOutput('<span class="underline text-blue-300 font-semibold mt-2">🎮 Divertissement & Jeux</span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cowsay ">cowsay</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;message&gt;</span> <span class="text-gray-400">- Affiche un message avec une vache ASCII.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="figlet ">figlet</span> <span class="bg-gray-700 text-gray-200 px-1 rounded">&lt;texte&gt;</span> <span class="text-gray-400">- Génère du texte ASCII art.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="fortune">fortune</span> <span class="text-gray-400">- Affiche une citation aléatoire.</span></span>');
            this.addOutput('<span class="ml-4"><span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="cmatrix">cmatrix</span> <span class="text-gray-400">- Simulation de Matrix dans le terminal.</span></span>');

            this.addOutput('<hr class="my-2 border-gray-700">');

            // Ajouter l'event listener pour les commandes cliquables après avoir ajouté tout le contenu
            this.setupClickableCommands();
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

        cconnect: async function (args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('Erreur : veuillez fournir un pseudo. Utilisation : cconnect <username>', 'error');
                return;
            }
            const pseudo = args[0].trim();
            this.setPseudoCookie(pseudo);
            this.addOutput(`Connecté en tant que <span class="text-green-400">${pseudo}</span>.`, "system");
            this.updatePrompt();
        },

        cdisconnect: function () {
            // Supprime le cookie pseudo
            document.cookie = "pseudo=;path=/;max-age=0";
            this.addOutput('Déconnecté. Le pseudo a été réinitialisé à "user".', "system");
            this.updatePrompt();
        },
        history: function () {
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
                <div id="edit-rich-text-editor" contenteditable="true" class="bg-gray-950 text-white border border-blue-700 rounded-lg p-4 h-60 mb-6 focus:outline-none shadow-inner transition overflow-y-auto resize-none"></div>
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

                colorPicker.addEventListener('input', function () {
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

                fontSizePicker.addEventListener('change', function () {
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

        commandeDev: function () {
            this.enDev();
        },
        github: function () {
            this.addOutput(
                '<span class="font-bold text-blue-400">Projet open source !</span><br>' +
                '<a href="https://github.com/Klaynight-dev/Web_linux_console" target="_blank" class="underline text-blue-300 hover:text-blue-500 transition-colors">' +
                '<i class="fab fa-github"></i> Visitez notre dépôt GitHub</a> pour plus d\'informations.',
                'system'
            );
        },
        clearHistory: function () {
            this.history = [];
            this.saveHistoryToCookie();
            this.addOutput('Historique des commandes effacé.', 'system');
        },
        delAllCache: function () {
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
        save: function () {
            this.saveFileSystemToCookie();
            this.addOutput('Système de fichiers enregistré dans le cookie.', 'system');
        },
        load: function () {
            this.loadFileSystemFromCookie();
            this.addOutput('Système de fichiers chargé depuis le cookie.', 'system');
        },
        lshw: function () {
            // Utilise les APIs du navigateur pour obtenir le maximum d'infos accessibles
            const nav = window.navigator;
            const hwInfo = [];

            hwInfo.push('<span class="font-bold text-blue-400 text-lg">Résumé matériel navigateur :</span><br>');
            hwInfo.push(`<span class="text-green-400">User-Agent :</span> ${nav.userAgent}<br>`);
            hwInfo.push(`<span class="text-green-400">Plateforme :</span> ${nav.platform || 'Inconnu'}<br>`);
            hwInfo.push(`<span class="text-green-400">Langue :</span> ${nav.language || 'Inconnu'}<br>`);
            hwInfo.push(`<span class="text-green-400">Langues acceptées :</span> ${(nav.languages || []).join(', ')}<br>`);
            hwInfo.push(`<span class="text-green-400">En ligne :</span> ${navigator.onLine ? 'Oui' : 'Non'}<br>`);
            if (nav.hardwareConcurrency) {
                hwInfo.push(`<span class="text-green-400">Cœurs CPU :</span> ${nav.hardwareConcurrency}<br>`);
            }
            if (nav.deviceMemory) {
                hwInfo.push(`<span class="text-green-400">Mémoire RAM estimée :</span> ${nav.deviceMemory} Go<br>`);
            }
            if (window.screen) {
                hwInfo.push(`<span class="text-green-400">Écran :</span> ${window.screen.width}x${window.screen.height} px (${window.screen.colorDepth} bits)<br>`);
                hwInfo.push(`<span class="text-green-400">Orientation :</span> ${window.screen.orientation ? window.screen.orientation.type : 'Inconnu'}<br>`);
            }
            if (window.devicePixelRatio) {
                hwInfo.push(`<span class="text-green-400">Device Pixel Ratio :</span> ${window.devicePixelRatio}<br>`);
            }
            if (window.innerWidth && window.innerHeight) {
                hwInfo.push(`<span class="text-green-400">Fenêtre visible :</span> ${window.innerWidth}x${window.innerHeight} px<br>`);
            }
            if (nav.maxTouchPoints !== undefined) {
                hwInfo.push(`<span class="text-green-400">Points tactiles max :</span> ${nav.maxTouchPoints}<br>`);
            }
            if (nav.vendor) {
                hwInfo.push(`<span class="text-green-400">Vendor navigateur :</span> ${nav.vendor}<br>`);
            }
            if (nav.product) {
                hwInfo.push(`<span class="text-green-400">Produit navigateur :</span> ${nav.product}<br>`);
            }
            if (nav.webdriver !== undefined) {
                hwInfo.push(`<span class="text-green-400">Webdriver :</span> ${nav.webdriver ? 'Oui' : 'Non'}<br>`);
            }
            if (nav.cookieEnabled !== undefined) {
                hwInfo.push(`<span class="text-green-400">Cookies activés :</span> ${nav.cookieEnabled ? 'Oui' : 'Non'}<br>`);
            }
            if (nav.doNotTrack !== undefined) {
                hwInfo.push(`<span class="text-green-400">Do Not Track :</span> ${nav.doNotTrack}<br>`);
            }
            if (nav.connection) {
                const c = nav.connection;
                hwInfo.push(`<span class="text-green-400">Type de connexion :</span> ${c.effectiveType || c.type || 'Inconnu'}<br>`);
                if (c.downlink) hwInfo.push(`<span class="text-green-400">Débit descendant estimé :</span> ${c.downlink} Mbps<br>`);
                if (c.rtt) hwInfo.push(`<span class="text-green-400">Latence estimée :</span> ${c.rtt} ms<br>`);
                if (c.saveData !== undefined) hwInfo.push(`<span class="text-green-400">Mode économie de données :</span> ${c.saveData ? 'Oui' : 'Non'}<br>`);
            }
            if (window.GPU && window.GPU.getPreferredCanvasFormat) {
                // WebGPU (rarement dispo)
                hwInfo.push(`<span class="text-green-400">GPU (WebGPU):</span> ${window.GPU.getPreferredCanvasFormat()}<br>`);
            } else if (window.WebGLRenderingContext) {
                // WebGL info
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                            hwInfo.push(`<span class="text-green-400">Carte graphique :</span> ${vendor} ${renderer}<br>`);
                        }
                        hwInfo.push(`<span class="text-green-400">WebGL Version :</span> ${gl.getParameter(gl.VERSION)}<br>`);
                        hwInfo.push(`<span class="text-green-400">WebGL Vendor :</span> ${gl.getParameter(gl.VENDOR)}<br>`);
                        hwInfo.push(`<span class="text-green-400">WebGL Renderer :</span> ${gl.getParameter(gl.RENDERER)}<br>`);
                        hwInfo.push(`<span class="text-green-400">WebGL Shading Language :</span> ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}<br>`);
                    }
                } catch { }
            }
            // Battery API
            if (navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    hwInfo.push(`<span class="text-green-400">Batterie :</span> ${Math.round(battery.level * 100)}% ${battery.charging ? '(en charge)' : ''}<br>`);
                    this.addOutput(hwInfo.join('') + '<span class="text-gray-400">Note : Les informations sont limitées par le navigateur pour la confidentialité.</span>', 'system');
                });
                return;
            }
            // Media devices
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices().then(devices => {
                    const audioInputs = devices.filter(d => d.kind === 'audioinput').length;
                    const videoInputs = devices.filter(d => d.kind === 'videoinput').length;
                    hwInfo.push(`<span class="text-green-400">Microphones détectés :</span> ${audioInputs}<br>`);
                    hwInfo.push(`<span class="text-green-400">Caméras détectées :</span> ${videoInputs}<br>`);
                    this.addOutput(hwInfo.join('') + '<span class="text-gray-400">Note : Les informations sont limitées par le navigateur pour la confidentialité.</span>', 'system');
                });
                return;
            }
            this.addOutput(hwInfo.join('') + '<span class="text-gray-400">Note : Les informations sont limitées par le navigateur pour la confidentialité.</span>', 'system');
        },

        ifconfig: function () {
            // Affiche les infos réseau accessibles via le navigateur
            const lines = [];
            lines.push('<span class="font-bold text-blue-400 text-lg">Configuration réseau (ifconfig):</span><br>');

            // Adresse MAC (non accessible côté navigateur pour des raisons de sécurité)
            lines.push('<span class="text-green-400">Adresse MAC :</span> <span class="text-gray-400">Non accessible (limitation navigateur)</span><br>');

            // Adresse IP locale (WebRTC)
            function getLocalIPs(callback) {
                const ips = [];
                const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
                if (!RTCPeerConnection) {
                    callback([]);
                    return;
                }
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));
                pc.onicecandidate = function (e) {
                    if (!e || !e.candidate) {
                        callback(ips);
                        return;
                    }
                    const parts = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
                    if (parts && parts[1] && !ips.includes(parts[1])) {
                        ips.push(parts[1]);
                    }
                };
            }

            // Type de connexion
            if (navigator.connection) {
                const c = navigator.connection;
                lines.push(`<span class="text-green-400">Type de connexion :</span> ${c.effectiveType || c.type || 'Inconnu'}<br>`);
                if (c.downlink) lines.push(`<span class="text-green-400">Débit descendant estimé :</span> ${c.downlink} Mbps<br>`);
                if (c.rtt) lines.push(`<span class="text-green-400">Latence estimée :</span> ${c.rtt} ms<br>`);
                if (c.saveData !== undefined) lines.push(`<span class="text-green-400">Mode économie de données :</span> ${c.saveData ? 'Oui' : 'Non'}<br>`);
            }

            // Adresse IP publique (via service externe)
            fetch('https://api.ipify.org?format=json')
                .then(resp => resp.json())
                .then(data => {
                    lines.push(`<span class="text-green-400">Adresse IP publique :</span> ${data.ip}<br>`);
                    // Adresse IP locale (WebRTC)
                    getLocalIPs(localIps => {
                        if (localIps.length > 0) {
                            lines.push(`<span class="text-green-400">Adresse(s) IP locale(s) :</span> ${localIps.join(', ')}<br>`);
                        } else {
                            lines.push(`<span class="text-green-400">Adresse IP locale :</span> <span class="text-gray-400">Non accessible (limitation navigateur)</span><br>`);
                        }
                        lines.push('<span class="text-gray-400">Note : Les informations réseau sont limitées pour la confidentialité.</span>');
                        this.addOutput(lines.join(''), 'system');
                    });
                })
                .catch(() => {
                    lines.push(`<span class="text-green-400">Adresse IP publique :</span> <span class="text-gray-400">Non accessible</span><br>`);
                    getLocalIPs(localIps => {
                        if (localIps.length > 0) {
                            lines.push(`<span class="text-green-400">Adresse(s) IP locale(s) :</span> ${localIps.join(', ')}<br>`);
                        } else {
                            lines.push(`<span class="text-green-400">Adresse IP locale :</span> <span class="text-gray-400">Non accessible (limitation navigateur)</span><br>`);
                        }
                        lines.push('<span class="text-gray-400">Note : Les informations réseau sont limitées pour la confidentialité.</span>');
                        this.addOutput(lines.join(''), 'system');
                    });
                });
        },


        free(args) {
            const options = this.parseOptions(args, {
                'h': 'human-readable',
                'b': 'bytes',
                'm': 'mega',
                'g': 'giga'
            });

            // Simulation des informations mémoire basée sur navigator.deviceMemory
            const totalMemGB = navigator.deviceMemory || 8; // Par défaut 8GB
            const totalMemMB = totalMemGB * 1024;
            const totalMemKB = totalMemMB * 1024;
            const totalMemB = totalMemKB * 1024;

            // Simulation d'utilisation (70% occupé)
            const usedPercent = 0.7;
            const usedMemB = Math.floor(totalMemB * usedPercent);
            const freeMemB = totalMemB - usedMemB;
            const availableMemB = Math.floor(freeMemB * 0.8);

            let unit = 'KB';
            let divisor = 1024;
            let totalMem = totalMemKB;
            let usedMem = Math.floor(usedMemB / 1024);
            let freeMem = Math.floor(freeMemB / 1024);
            let availableMem = Math.floor(availableMemB / 1024);

            if (options['human-readable']) {
                if (totalMemGB >= 1) {
                    unit = 'G';
                    divisor = 1024 * 1024 * 1024;
                    totalMem = (totalMemB / divisor).toFixed(1);
                    usedMem = (usedMemB / divisor).toFixed(1);
                    freeMem = (freeMemB / divisor).toFixed(1);
                    availableMem = (availableMemB / divisor).toFixed(1);
                } else {
                    unit = 'M';
                    divisor = 1024 * 1024;
                    totalMem = Math.floor(totalMemB / divisor);
                    usedMem = Math.floor(usedMemB / divisor);
                    freeMem = Math.floor(freeMemB / divisor);
                    availableMem = Math.floor(availableMemB / divisor);
                }
            } else if (options.bytes) {
                unit = 'B';
                totalMem = totalMemB;
                usedMem = usedMemB;
                freeMem = freeMemB;
                availableMem = availableMemB;
            } else if (options.mega) {
                unit = 'M';
                divisor = 1024 * 1024;
                totalMem = Math.floor(totalMemB / divisor);
                usedMem = Math.floor(usedMemB / divisor);
                freeMem = Math.floor(freeMemB / divisor);
                availableMem = Math.floor(availableMemB / divisor);
            } else if (options.giga) {
                unit = 'G';
                divisor = 1024 * 1024 * 1024;
                totalMem = (totalMemB / divisor).toFixed(1);
                usedMem = (usedMemB / divisor).toFixed(1);
                freeMem = (freeMemB / divisor).toFixed(1);
                availableMem = (availableMemB / divisor).toFixed(1);
            }

            this.addOutput(`<span class="font-mono">
                        total        used        free      shared  buff/cache   available
        Mem:     ${String(totalMem).padStart(7)}${unit}   ${String(usedMem).padStart(7)}${unit}   ${String(freeMem).padStart(7)}${unit}        0${unit}        0${unit}   ${String(availableMem).padStart(7)}${unit}
        Swap:           0${unit}        0${unit}        0${unit}
        </span>`);
        },

        df(args) {
            const options = this.parseOptions(args, {
                'h': 'human-readable',
                'T': 'print-type',
                'a': 'all'
            });

            // Simulation d'informations de système de fichiers
            const filesystems = [
                { filesystem: '/dev/root', type: 'ext4', size: 20971520, used: 8388608, avail: 11534336, usePercent: 41, mountedOn: '/' },
                { filesystem: '/dev/tmpfs', type: 'tmpfs', size: 2097152, used: 0, avail: 2097152, usePercent: 0, mountedOn: '/tmp' },
                { filesystem: '/dev/home', type: 'ext4', size: 104857600, used: 52428800, avail: 47185920, usePercent: 53, mountedOn: '/home' }
            ];

            let header = options['print-type'] ?
                'Filesystem     Type      Size  Used Avail Use% Mounted on' :
                'Filesystem      Size  Used Avail Use% Mounted on';

            this.addOutput(`<span class="font-mono">${header}</span>`);

            filesystems.forEach(fs => {
                let size, used, avail;
                if (options['human-readable']) {
                    size = this.formatBytes(fs.size * 1024);
                    used = this.formatBytes(fs.used * 1024);
                    avail = this.formatBytes(fs.avail * 1024);
                } else {
                    size = fs.size.toString();
                    used = fs.used.toString();
                    avail = fs.avail.toString();
                }

                let line = options['print-type'] ?
                    `${fs.filesystem.padEnd(14)} ${fs.type.padEnd(9)} ${size.padStart(4)} ${used.padStart(4)} ${avail.padStart(5)} ${fs.usePercent.toString().padStart(3)}% ${fs.mountedOn}` :
                    `${fs.filesystem.padEnd(15)} ${size.padStart(4)} ${used.padStart(4)} ${avail.padStart(5)} ${fs.usePercent.toString().padStart(3)}% ${fs.mountedOn}`;

                this.addOutput(`<span class="font-mono">${line}</span>`);
            });
        },

        tree(args) {
            // Simple option parsing for tree command
            const parseTreeOptions = (args) => {
                const result = { _: [] };
                let i = 0;

                while (i < args.length) {
                    const arg = args[i];

                    if (arg === '-a') {
                        result.all = true;
                    } else if (arg === '-d') {
                        result['dirs-only'] = true;
                    } else if (arg === '-L' && i + 1 < args.length) {
                        result.level = parseInt(args[i + 1]);
                        i++; // Skip next argument as it's the level value
                    } else if (!arg.startsWith('-')) {
                        result._.push(arg);
                    }
                    i++;
                }

                return result;
            };

            const options = parseTreeOptions(args);

            const maxLevel = options.level || 10;
            const targetPath = options._[0] || '.';
            const resolvedPath = this.resolvePath(targetPath);
            const targetNode = this.getPath(resolvedPath);

            if (!targetNode) {
                this.addOutput(`tree: ${targetPath}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            this.addOutput(`<span class="text-blue-400">${resolvedPath}</span>`);

            const treeLines = [];
            const buildTree = (node, prefix = '', level = 0) => {
                if (level >= maxLevel) return;

                if (node.type === 'directory') {
                    const children = Object.keys(node.children).sort();
                    const filteredChildren = options['dirs-only'] ?
                        children.filter(name => node.children[name].type === 'directory') :
                        children.filter(name => options.all || !name.startsWith('.'));

                    filteredChildren.forEach((childName, index) => {
                        const child = node.children[childName];
                        const isLastChild = index === filteredChildren.length - 1;
                        const currentPrefix = prefix + (isLastChild ? '└── ' : '├── ');
                        const nextPrefix = prefix + (isLastChild ? '    ' : '│   ');

                        const displayName = child.type === 'directory' ?
                            `<span class="text-blue-400">${childName}</span>` : childName;

                        treeLines.push(`${currentPrefix}${displayName}`);

                        if (child.type === 'directory') {
                            buildTree(child, nextPrefix, level + 1);
                        }
                    });
                }
            };

            buildTree(targetNode);
            treeLines.forEach(line => this.addOutput(`<span class="font-mono">${line}</span>`));

            const dirCount = treeLines.filter(line => line.includes('text-blue-400')).length;
            const fileCount = treeLines.length - dirCount;
            this.addOutput(`\n${dirCount} directories, ${fileCount} files`);
        },

        find(args) {
            const options = this.parseOptions(args, {
                'name': 'name',
                'type': 'type',
                'maxdepth': 'maxdepth'
            });

            const startPath = options._.find(arg => !arg.startsWith('-') && !arg.match(/^(f|d)$/)) || '.';
            const resolvedPath = this.resolvePath(startPath);
            const startNode = this.getPath(resolvedPath);

            if (!startNode) {
                this.addOutput(`find: '${startPath}': Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            const namePattern = options.name;
            const typeFilter = options.type;
            const maxDepth = options.maxdepth ? parseInt(options.maxdepth) : 50;

            const results = [];
            const search = (node, currentPath, depth = 0) => {
                if (depth > maxDepth) return;

                // Vérifie si le nœud correspond aux critères
                let matches = true;
                if (typeFilter) {
                    matches = matches && ((typeFilter === 'f' && node.type === 'file') ||
                        (typeFilter === 'd' && node.type === 'directory'));
                }
                if (namePattern) {
                    const fileName = currentPath.split('/').pop();
                    const regex = new RegExp(namePattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
                    matches = matches && regex.test(fileName);
                }


                if (matches) {
                    results.push(currentPath);
                }

                // Recherche récursive dans les répertoires
                if (node.type === 'directory') {
                    Object.keys(node.children).forEach(childName => {
                        const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;
                        search(node.children[childName], childPath, depth + 1);
                    });
                }
            };

            search(startNode, resolvedPath);
            results.forEach(result => this.addOutput(result));
        },

        grep(args) {
            const options = this.parseOptions(args, {
                'i': 'ignore-case',
                'n': 'line-number',
                'v': 'invert-match',
                'c': 'count'
            });

            if (options._.length < 2) {
                this.addOutput('grep: utilisation: grep [options] pattern fichier', 'error');
                return;
            }

            const pattern = options._[0];
            const fileName = options._[1];
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);


            if (!targetNode) {
                this.addOutput(`grep: ${fileName}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            if (targetNode.type !== 'file') {
                this.addOutput(`grep: ${fileName}: N'est pas un fichier`, 'error');
                return;
            }

            const content = targetNode.content;
            const lines = content.split('\n');
            const flags = options['ignore-case'] ? 'gi' : 'g';
            const regex = new RegExp(pattern, flags);

            let matchingLines = [];
            lines.forEach((line, index) => {
                const matches = regex.test(line);
                if (options['invert-match'] ? !matches : matches) {
                    matchingLines.push({
                        number: index + 1,
                        content: line,
                        highlighted: line.replace(new RegExp(pattern, flags), `<span class="bg-yellow-400 text-black">$&</span>`)
                    });
                }
            });

            if (options.count) {
                this.addOutput(matchingLines.length.toString());
            } else {
                matchingLines.forEach(line => {
                    const output = options['line-number'] ?
                        `<span class="text-green-400">${line.number}:</span>${line.highlighted}` :
                        line.highlighted;
                    this.addOutput(output);
                });
            }
        },

        wc(args) {
            const options = this.parseOptions(args, {
                'l': 'lines',
                'w': 'words',
                'c': 'bytes',
                'm': 'chars'
            });

            if (options._.length === 0) {
                this.addOutput('wc: manque un nom de fichier', 'error');
                return;
            }

            const fileName = options._[0];
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`wc: ${fileName}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            if (targetNode.type !== 'file') {
                this.addOutput(`wc: ${fileName}: Est un dossier`, 'error');
                return;
            }

            const content = targetNode.content;
            const lines = content.split('\n').length;
            const words = content.split(/\s+/).filter(w => w.length > 0).length;
            const bytes = new Blob([content]).size;
            const chars = content.length;

            let output = [];

            if (!options.lines && !options.words && !options.bytes && !options.chars) {
                // Par défaut, affiche tout
                output = [lines.toString().padStart(7), words.toString().padStart(7), bytes.toString().padStart(7)];
            } else {
                if (options.lines) output.push(lines.toString().padStart(7));
                if (options.words) output.push(words.toString().padStart(7));
                if (options.bytes) output.push(bytes.toString().padStart(7));
                if (options.chars) output.push(chars.toString().padStart(7));
            }

            this.addOutput(`<span class="font-mono">${output.join('')} ${fileName}</span>`);
        },

        ps(args) {
            const options = this.parseOptions(args, {
                'a': 'all',
                'u': 'user',
                'x': 'no-tty',
                'f': 'full'
            });

            // Simulation de processus
            const processes = [
                { pid: 1, ppid: 0, user: 'root', cpu: 0.0, mem: 0.1, vsz: 168, rss: 8, tty: '?', stat: 'S', start: '00:00', time: '00:00:01', command: '/sbin/init' },
                { pid: 2, ppid: 0, user: 'root', cpu: 0.0, mem: 0.0, vsz: 0, rss: 0, tty: '?', stat: 'S', start: '00:00', time: '00:00:00', command: '[kthreadd]' },
                { pid: 1234, ppid: 1, user: this.getPseudoFromCookie() || 'user', cpu: 1.2, mem: 2.5, vsz: 4096, rss: 256, tty: 'pts/0', stat: 'S', start: '09:30', time: '00:00:15', command: '/bin/bash' },
                { pid: 5678, ppid: 1234, user: this.getPseudoFromCookie() || 'user', cpu: 0.5, mem: 1.0, vsz: 2048, rss: 128, tty: 'pts/0', stat: 'R+', start: '10:45', time: '00:00:02', command: 'webconsole' }
            ];

            if (options.full) {
                this.addOutput(`<span class="font-mono">UID        PID  PPID  C STIME TTY          TIME CMD</span>`);
                processes.forEach(proc => {
                    this.addOutput(`<span class="font-mono">${proc.user.padEnd(8)} ${proc.pid.toString().padStart(5)} ${proc.ppid.toString().padStart(5)} ${proc.cpu.toFixed(1).padStart(3)} ${proc.start.padStart(5)} ${proc.tty.padEnd(12)} ${proc.time.padStart(8)} ${proc.command}</span>`);
                });
            } else if (options.user) {
                this.addOutput(`<span class="font-mono">USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND</span>`);
                processes.forEach(proc => {

                    this.addOutput(`<span class="font-mono">${proc.user.padEnd(8)} ${proc.pid.toString().padStart(5)} ${proc.cpu.toFixed(1).padStart(4)} ${proc.mem.toFixed(1).padStart(4)} ${proc.vsz.toString().padStart(6)} ${proc.rss.toString().padStart(5)} ${proc.tty.padEnd(8)} ${proc.stat.padEnd(4)} ${proc.start.padStart(5)} ${proc.time.padStart(7)} ${proc.command}</span>`);
                });
            } else {
                this.addOutput(`<span class="font-mono">  PID TTY          TIME CMD</span>`);
                processes.filter(proc => proc.tty !== '?').forEach(proc => {
                    this.addOutput(`<span class="font-mono">${proc.pid.toString().padStart(5)} ${proc.tty.padEnd(12)} ${proc.time.padStart(8)} ${proc.command}</span>`);
                });
            }
        },

        top(args) {
            this.addOutput(`<span class="text-green-400">top - ${new Date().toLocaleTimeString()} up 1 day, 2:30, 1 user, load average: 0.15, 0.10, 0.05</span>`);
            this.addOutput(`Tasks: 4 total, 1 running, 3 sleeping, 0 stopped, 0 zombie`);
            this.addOutput(`%Cpu(s): 2.5 us, 1.2 sy, 0.0 ni, 96.0 id, 0.3 wa, 0.0 hi, 0.0 si, 0.0 st`);
            this.addOutput(`MiB Mem: ${(navigator.deviceMemory || 8) * 1024} total, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.3)} free, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.7)} used, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.2)} buff/cache`);
            this.addOutput(`MiB Swap: 0 total, 0 free, 0 used. ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.8)} avail Mem\n`);

            this.addOutput(`<span class="font-mono">  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND</span>`);
            this.addOutput(`<span class="font-mono"> 1234 ${(this.getPseudoFromCookie() || 'user').padEnd(8)} 20   0    4096    256      0 S   1.2   2.5   0:00.15 bash</span>`);
            this.addOutput(`<span class="font-mono"> 5678 ${(this.getPseudoFromCookie() || 'user').padEnd(8)} 20   0    2048    128      0 R   0.5   1.0   0:00.02 webconsole</span>`);
            this.addOutput(`<span class="font-mono">    1 root      20   0     168      8      0 S   0.0   0.1   0:00.01 init</span>`);
            this.addOutput(`<span class="font-mono">    2 root      20   0       0      0      0 S   0.0   0.0   0:00.00 kthreadd</span>`);

            this.addOutput(`\n<span class="text-yellow-400">Note: Appuyez sur 'q' pour quitter top (simulation)</span>`);
        },

        date(args) {
            const options = this.parseOptions(args, {
                'u': 'utc',
                'R': 'rfc-2822',
                'I': 'iso-8601'
            });

            const now = new Date();

            if (options.utc) {
                this.addOutput(now.toUTCString());
            } else if (options['rfc-2822']) {
                this.addOutput(now.toUTCString());
            } else if (options['iso-8601']) {
                this.addOutput(now.toISOString());
            } else if (options._.length > 0 && options._[0].startsWith('+')) {
                // Format personnalisé (simplifié)
                const format = options._[0].substring(1);
                let result = format
                    .replace(/%Y/g, now.getFullYear())
                    .replace(/%m/g, String(now.getMonth() + 1).padStart(2, '0'))
                    .replace(/%d/g, String(now.getDate()).padStart(2, '0'))
                    .replace(/%H/g, String(now.getHours()).padStart(2, '0'))
                    .replace(/%M/g, String(now.getMinutes()).padStart(2, '0'))
                    .replace(/%S/g, String(now.getSeconds()).padStart(2, '0'));
                this.addOutput(result);
            } else {
                this.addOutput(now.toString());
            }
        },

        sudo(args) {
            if (args.length === 0) {
                this.addOutput('sudo: une commande doit être spécifiée', 'error');
                return;
            }

            const command = args[0];
            const commandArgs = args.slice(1);

            this.addOutput(`<span class="text-yellow-400">[sudo]</span> Exécution de la commande avec privilèges administrateur...`);

            // Vérifie si la commande existe
            if (this.commands[command]) {
                try {
                    this.commands[command].call(this, commandArgs);
                } catch (error) {
                    this.addOutput(`sudo: erreur lors de l'exécution de ${command}: ${error.message}`, 'error');
                }
            } else {
                this.addOutput(`sudo: ${command}: commande introuvable`, 'error');
            }
        },

        man: function (args) {
            const command = args && args[0] ? args[0].toLowerCase() : '';

            const manPages = {
                'ls': {
                    name: 'ls',
                    synopsis: 'ls [OPTION]... [FILE]...',
                    description: 'Liste le contenu des répertoires',
                    options: [
                        '-l : format de liste détaillée',
                        '-a : affiche tous les fichiers (y compris cachés)',
                        '-h : tailles lisibles par l\'homme'
                    ]
                },
                'cd': {
                    name: 'cd',
                    synopsis: 'cd [DIRECTORY]',
                    description: 'Change le répertoire de travail courant',
                    options: [
                        'cd .. : remonte d\'un niveau',
                        'cd ~ : va au répertoire home',
                        'cd - : retourne au répertoire précédent'
                    ]
                },
                'pwd': {
                    name: 'pwd',
                    synopsis: 'pwd',
                    description: 'Affiche le chemin du répertoire courant',
                    options: []
                },
                'mkdir': {
                    name: 'mkdir',
                    synopsis: 'mkdir [OPTION] DIRECTORY...',
                    description: 'Crée des répertoires',
                    options: [
                        '-p : crée les répertoires parents si nécessaire'
                    ]
                },
                'touch': {
                    name: 'touch',
                    synopsis: 'touch FILE...',
                    description: 'Crée des fichiers vides ou met à jour leur timestamp',
                    options: []
                },
                'rm': {
                    name: 'rm',
                    synopsis: 'rm [OPTION] FILE...',
                    description: 'Supprime des fichiers et répertoires',
                    options: [
                        '-r : suppression récursive',
                        '-f : force la suppression'
                    ]
                },
                'cp': {
                    name: 'cp',
                    synopsis: 'cp [OPTION] SOURCE DEST',
                    description: 'Copie des fichiers ou répertoires',
                    options: [
                        '-r : copie récursive'
                    ]
                },
                'mv': {
                    name: 'mv',
                    synopsis: 'mv SOURCE DEST',
                    description: 'Déplace/renomme des fichiers ou répertoires',
                    options: []
                },
                'cat': {
                    name: 'cat',
                    synopsis: 'cat [FILE]...',
                    description: 'Affiche le contenu d\'un fichier',
                    options: []
                },
                'echo': {
                    name: 'echo',
                    synopsis: 'echo [STRING]...',
                    description: 'Affiche du texte',
                    options: []
                },
                'clear': {
                    name: 'clear',
                    synopsis: 'clear',
                    description: 'Efface l\'écran du terminal',
                    options: []
                },
                'help': {
                    name: 'help',
                    synopsis: 'help',
                    description: 'Affiche la liste des commandes disponibles',
                    options: []
                },
                'history': {
                    name: 'history',
                    synopsis: 'history',
                    description: 'Affiche l\'historique des commandes',
                    options: []
                },
                'man': {
                    name: 'man',
                    synopsis: 'man [COMMAND]',
                    description: 'Affiche le manuel d\'une commande',
                    options: [
                        'man : affiche la liste des manuels disponibles',
                        'man [commande] : affiche le manuel de la commande'
                    ]
                }
            };

            if (!command) {
                // Affiche la liste des manuels disponibles
                this.addOutput(`<div class="text-blue-300 font-bold mb-2">MANUELS DISPONIBLES</div>`);
                this.addOutput(`<div class="text-gray-300 mb-2">Utilisez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ">man [commande]</span>' pour afficher le manuel d'une commande spécifique.</div>`);
                this.addOutput(`<div class="text-yellow-300 mb-2">Commandes disponibles :</div>`);

                const commands = Object.keys(manPages).sort();
                let output = '<div class="grid grid-cols-4 gap-4 text-sm">';

                for (let i = 0; i < commands.length; i++) {
                    output += `<div class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ${commands[i]}">${commands[i]}</div>`;
                }
                output += '</div>';

                this.addOutput(output);
                this.setupClickableCommands();
                return;
            }

            const manPage = manPages[command];
            if (!manPage) {
                this.addOutput(`<div class="text-red-400">man: aucune entrée de manuel pour ${command}</div>`);
                this.addOutput(`<div class="text-gray-300">Essayez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ${command}">man ${command}</span>' pour voir si cette commande est disponible.</div>`);
                this.setupClickableCommands();
                return;
            }

            // Affiche le manuel de la commande
            let output = `
                    <div class="man-page">
                        <div class="text-blue-300 font-bold text-lg mb-2">${manPage.name.toUpperCase()}(1)</div>
                        <div class="mb-4">
                            <div class="text-yellow-300 font-bold mb-1">NOM</div>
                            <div class="ml-4 text-gray-300">${manPage.name} - ${manPage.description}</div>
                        </div>
                        <div class="mb-4">
                            <div class="text-yellow-300 font-bold mb-1">SYNOPSIS</div>
                            <div class="ml-4 text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command" data-command="${manPage.synopsis.split('[')[0].trim()}">${manPage.synopsis}</div>
                        </div>
                        <div class="mb-4">
                            <div class="text-yellow-300 font-bold mb-1">DESCRIPTION</div>
                            <div class="ml-4 text-gray-300">${manPage.description}</div>
                        </div>
                `;

            if (manPage.options && manPage.options.length > 0) {
                output += `
                        <div class="mb-4">
                            <div class="text-yellow-300 font-bold mb-1">OPTIONS</div>
                            <div class="ml-4">
                    `;

                manPage.options.forEach(option => {
                    output += `<div class="text-gray-300 mb-1">${option}</div>`;
                });

                output += `
                            </div>
                        </div>
                    `;
            }

            output += `
                        <div class="mt-4 text-xs text-gray-500">
                            WebConsole Manual - Tapez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man">man</span>' pour voir tous les manuels disponibles
                        </div>
                    </div>
                `;

            this.addOutput(output);
            this.setupClickableCommands();
        },

        // Ajouter ces commandes dans l'objet commands:

        cp(args) {
            if (args.length < 2) {
                this.addOutput('cp: utilisation: cp [options] <source> <dest>', 'error');
                return;
            }

            const options = this.parseOptions(args, { 'r': 'recursive' });
            const source = options._[0];
            const dest = options._[1];

            if (!source || !dest) {
                this.addOutput('cp: source et destination requises', 'error');
                return;
            }

            const sourcePath = this.resolvePath(source);
            const sourceNode = this.getPath(sourcePath);

            if (!sourceNode) {
                this.addOutput(`cp: ${source}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            const destPath = this.resolvePath(dest);
            const destParent = this.getPath(destPath.substring(0, destPath.lastIndexOf('/')) || '/');
            const destName = destPath.split('/').pop();

            if (!destParent || destParent.type !== 'directory') {
                this.addOutput(`cp: ${dest}: Répertoire parent non trouvé`, 'error');
                return;
            }

            // Fonction de copie récursive
            const copyNode = (node) => {
                if (node.type === 'file') {
                    return { type: 'file', content: node.content };
                } else if (node.type === 'directory') {
                    const newDir = { type: 'directory', children: {} };
                    Object.keys(node.children).forEach(childName => {
                        newDir.children[childName] = copyNode(node.children[childName]);
                    });
                    return newDir;
                }
            };

            if (sourceNode.type === 'directory' && !options.recursive) {
                this.addOutput(`cp: ${source}: Est un répertoire (non copié)`, 'error');
                this.addOutput('Utilisez -r pour copier les répertoires', 'error');
                return;
            }

            destParent.children[destName] = copyNode(sourceNode);
            this.saveFileSystemToCookie();
            this.addOutput(`'${source}' copié vers '${dest}'`);
        },

        mv(args) {
            if (args.length < 2) {
                this.addOutput('mv: utilisation: mv <source> <dest>', 'error');
                return;
            }

            const source = args[0];
            const dest = args[1];
            const sourcePath = this.resolvePath(source);
            const sourceNode = this.getPath(sourcePath);

            if (!sourceNode) {
                this.addOutput(`mv: ${source}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            // Obtenir le répertoire parent de la source
            const sourceParentPath = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '/';
            const sourceParent = this.getPath(sourceParentPath);
            const sourceName = sourcePath.split('/').pop();

            const destPath = this.resolvePath(dest);
            const destParent = this.getPath(destPath.substring(0, destPath.lastIndexOf('/')) || '/');
            const destName = destPath.split('/').pop();

            if (!destParent || destParent.type !== 'directory') {
                this.addOutput(`mv: ${dest}: Répertoire parent non trouvé`, 'error');
                return;
            }

            // Effectuer le déplacement
            destParent.children[destName] = sourceNode;
            delete sourceParent.children[sourceName];

            this.saveFileSystemToCookie();
            this.addOutput(`'${source}' déplacé vers '${dest}'`);
        },

        whoami() {
            const pseudo = this.getPseudoFromCookie() || 'user';
            this.addOutput(pseudo);
        },

        uptime() {
            // Simuler un temps de fonctionnement basé sur le temps depuis le chargement de la page
            const now = new Date();
            const loadTime = window.performance.timing.navigationStart;
            const uptimeMs = now.getTime() - loadTime;

            const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

            let uptimeStr = '';
            if (days > 0) uptimeStr += `${days} jour${days > 1 ? 's' : ''}, `;
            if (hours > 0) uptimeStr += `${hours} heure${hours > 1 ? 's' : ''}, `;
            uptimeStr += `${minutes} minute${minutes > 1 ? 's' : ''}`;

            const loadAvg = (Math.random() * 2).toFixed(2);
            this.addOutput(`${now.toLocaleTimeString()} up ${uptimeStr}, 1 utilisateur, charge moyenne: ${loadAvg}`);
        },

        kill(args) {
            if (args.length === 0) {
                this.addOutput('kill: utilisation: kill <pid>', 'error');
                return;
            }

            const pid = parseInt(args[0]);
            if (isNaN(pid)) {
                this.addOutput(`kill: ${args[0]}: arguments incorrects`, 'error');
                return;
            }

            // Simulation - quelques PIDs prédéfinis
            const processes = [1, 2, 1234, 5678];
            if (processes.includes(pid)) {
                if (pid === 1) {
                    this.addOutput('kill: (1) - Operation non permise', 'error');
                } else {
                    this.addOutput(`Processus ${pid} terminé`);
                }
            } else {
                this.addOutput(`kill: (${pid}) - Aucun processus trouvé`, 'error');
            }
        },

        killall(args) {
            if (args.length === 0) {
                this.addOutput('killall: utilisation: killall <nom>', 'error');
                return;
            }

            const processName = args[0];
            const knownProcesses = ['bash', 'webconsole', 'init', 'kthreadd'];

            if (knownProcesses.includes(processName)) {
                if (processName === 'init') {
                    this.addOutput('killall: init: Operation non permise', 'error');
                } else {
                    this.addOutput(`Tous les processus '${processName}' ont été terminés`);
                }
            } else {
                this.addOutput(`killall: ${processName}: aucun processus trouvé`);
            }
        },

        ping(args) {
            if (args.length === 0) {
                this.addOutput('ping: utilisation: ping <adresse>', 'error');
                return;
            }

            const address = args[0];
            this.addOutput(`PING ${address} (simulation):`);

            // Simuler quelques pings
            let pingCount = 0;
            const pingInterval = setInterval(() => {
                pingCount++;
                const time = (Math.random() * 50 + 10).toFixed(1);
                this.addOutput(`64 bytes from ${address}: icmp_seq=${pingCount} time=${time}ms`);

                if (pingCount >= 4) {
                    clearInterval(pingInterval);
                    this.addOutput(`\n--- ${address} statistiques ping ---`);
                    this.addOutput(`4 paquets transmis, 4 reçus, 0% perte de paquets`);
                }
            }, 1000);
        },

        wget(args) {
            if (args.length === 0) {
                this.addOutput('wget: utilisation: wget <url>', 'error');
                return;
            }

            const url = args[0];
            this.addOutput(`--${new Date().toISOString()} ${url}`);
            this.addOutput('Résolution de l\'hôte... fait.');
            this.addOutput('Connexion à l\'hôte... connecté.');
            this.addOutput('Requête HTTP envoyée, en attente de la réponse...');

            // Simuler le téléchargement
            setTimeout(() => {
                const fileName = url.split('/').pop() || 'index.html';
                this.addOutput('200 OK');
                this.addOutput(`Sauvegarde en : '${fileName}'`);
                this.addOutput(`100%[===================>] ${Math.floor(Math.random() * 1000)}K en 0,5s`);
                this.addOutput(`'${fileName}' sauvegardé (simulation)`);
            }, 1500);
        },

        curl(args) {
            if (args.length === 0) {
                this.addOutput('curl: utilisation: curl [options] <url>', 'error');
                return;
            }

            const options = this.parseOptions(args, {
                'I': 'head',
                'o': 'output',
                'v': 'verbose'
            });

            const url = options._[0];
            if (!url) {
                this.addOutput('curl: aucune URL spécifiée', 'error');
                return;
            }

            if (options.head) {
                this.addOutput('HTTP/1.1 200 OK');
                this.addOutput('Content-Type: text/html');
                this.addOutput('Content-Length: 1234');
                this.addOutput(`Date: ${new Date().toUTCString()}`);
                this.addOutput('Server: nginx/1.18.0');
            } else {
                this.addOutput(`Simulation de requête GET vers ${url}`);
                this.addOutput('<!DOCTYPE html><html><head><title>Page simulée</title></head>');
                this.addOutput('<body><h1>Contenu simulé</h1><p>Ceci est une simulation de curl.</p></body></html>');
            }
        },

        cowsay(args) {
            const message = args.join(' ') || 'Moo!';
            const messageLength = message.length;
            const topBorder = ' ' + '_'.repeat(messageLength + 2);
            const bottomBorder = ' ' + '-'.repeat(messageLength + 2);

            this.addOutput(`<pre>
${topBorder}
< ${message} >
${bottomBorder}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
</pre>`);
        },

        figlet(args) {
            const text = args.join(' ') || 'HELLO';
            const asciiArt = {
                'A': ['  █████  ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
                'B': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██   ██ ', ' ██████  '],
                'C': [' ██████  ', ' ██      ', ' ██      ', ' ██      ', ' ██████  '],
                'D': [' ██████  ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██████  '],
                'E': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ███████ '],
                'F': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ██      '],
                'G': [' ██████  ', ' ██      ', ' ██  ███ ', ' ██   ██ ', ' ██████  '],
                'H': [' ██   ██ ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
                'I': [' ██ ', ' ██ ', ' ██ ', ' ██ ', ' ██ '],
                'J': ['      ██ ', '      ██ ', '      ██ ', ' ██   ██ ', ' ██████  '],
                'K': [' ██   ██ ', ' ██  ██  ', ' █████   ', ' ██  ██  ', ' ██   ██ '],
                'L': [' ██      ', ' ██      ', ' ██      ', ' ██      ', ' ███████ '],
                'M': [' ███    ███ ', ' ████  ████ ', ' ██ ████ ██ ', ' ██  ██  ██ ', ' ██      ██ '],
                'N': [' ███    ██ ', ' ████   ██ ', ' ██ ██  ██ ', ' ██  ██ ██ ', ' ██   ████ '],
                'O': [' ███████ ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ███████ '],
                'P': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██      ', ' ██      '],
                'Q': [' ██████  ', ' ██   ██ ', ' ██   ██ ', ' ██  ███ ', ' ███████ '],
                'R': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██   ██ ', ' ██   ██ '],
                'S': [' ███████ ', ' ██      ', ' ███████ ', '      ██ ', ' ███████ '],
                'T': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
                'U': [' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██████  '],
                'V': [' ██   ██ ', ' ██   ██ ', ' ██   ██ ', '  ██ ██  ', '   ███   '],
                'W': [' ██      ██ ', ' ██  ██  ██ ', ' ██ ████ ██ ', ' ████  ████ ', ' ███    ███ '],
                'X': [' ██   ██ ', '  ██ ██  ', '   ███   ', '  ██ ██  ', ' ██   ██ '],
                'Y': [' ██   ██ ', '  ██ ██  ', '   ███   ', '    ██   ', '    ██   '],
                'Z': [' ███████ ', '     ██  ', '    ██   ', '   ██    ', ' ███████ '],
                ' ': ['    ', '    ', '    ', '    ', '    ']
            };

            const lines = ['', '', '', '', ''];
            for (let char of text.toUpperCase()) {
                const charArt = asciiArt[char] || asciiArt[' '];
                for (let i = 0; i < 5; i++) {
                    lines[i] += charArt[i] + ' ';
                }
            }

            this.addOutput(`<pre class="text-blue-400">${lines.join('\n')}</pre>`);
        },

        fortune() {
            const fortunes = [
                "La programmation, c'est comme un iceberg : 90% du travail est invisible.",
                "Il n'y a que deux choses difficiles en informatique : l'invalidation de cache et nommer les choses.",
                "Un bon programmeur est quelqu'un qui regarde des deux côtés avant de traverser une rue à sens unique.",
                "Le débogage, c'est comme être détective dans un film policier où vous êtes aussi le meurtrier.",
                "Il y a 10 types de personnes : celles qui comprennent le binaire et celles qui ne le comprennent pas.",
                "Les meilleurs codes sont ceux qui n'ont pas besoin de commentaires... mais qui en ont quand même.",
                "La patience est une vertu, surtout quand on attend que le code compile.",
                "Un programme qui fonctionne du premier coup est suspect.",
                "L'expérience, c'est le nom que chacun donne à ses erreurs de programmation.",
                "La première règle de l'optimisation : ne pas optimiser.",
                "Il est plus facile d'optimiser du code correct que de corriger du code optimisé.",
                "Un développeur sans café est comme un ordinateur sans électricité."
            ];

            const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
            this.addOutput(`<span class="text-yellow-300">${randomFortune}</span>`);
        },

        cmatrix() {
            this.addOutput('<span class="text-green-400">Lancement de la simulation Matrix...</span>');
            this.addOutput('<span class="text-yellow-300">Appuyez sur "q" pour quitter</span>');

            // Créer un overlay pour le canvas Matrix dans console-output
            const matrixOverlay = document.createElement('div');
            matrixOverlay.id = 'matrix-overlay';
            matrixOverlay.className = 'absolute inset-0 z-50 bg-black';
            matrixOverlay.innerHTML = `
            <canvas id="matrix-canvas" class="w-full h-full"></canvas>
            <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/30">
            <div class="text-green-400 text-sm font-mono mb-1">🔴 MATRIX SIMULATION</div>
            <div class="text-green-300 text-xs font-mono opacity-80">Appuyez sur "q" pour quitter</div>
            </div>
            <button id="matrix-fullscreen-btn" class="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 hover:bg-green-500/20 transition-colors duration-200">
            <div class="text-green-400 text-sm font-mono">⛶ Plein écran</div>
            </button>
            `;
            
            // Assurer que console-output a une position relative pour l'overlay
            this.outputElement.style.position = 'relative';
            this.outputElement.appendChild(matrixOverlay);

            // Effet Matrix intégré
            const canvas = document.getElementById('matrix-canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Caractères Matrix (katakana, hiragana, chiffres)
            const matrixChars = "田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            const fontSize = 16;
            const columns = canvas.width / fontSize;
            const drops = [];

            const speed = 0.5; // Vitesse de chute des gouttes

            // Initialiser les gouttes
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }

            let animationId;
            let frameCount = 0;
            const draw = () => {
                frameCount++;

                // Fond noir semi-transparent pour l'effet de traînée
                ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Utiliser speed pour contrôler la fréquence de mise à jour
                if (frameCount % (speed + 1) === 0) {
                    ctx.fillStyle = '#0F0'; // Vert Matrix
                    ctx.font = fontSize + 'px monospace';

                    for (let i = 0; i < drops.length; i++) {
                        // Caractère aléatoire
                        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                        
                        // Position X et Y
                        const x = i * fontSize;
                        const y = drops[i] * fontSize;

                        ctx.fillText(text, x, y);

                        // Redémarrer la goutte aléatoirement ou quand elle sort de l'écran
                        if (y > canvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i] += 1;
                    }
                }

                // Continue the animation loop
                animationId = requestAnimationFrame(draw);
            }

        animationId = requestAnimationFrame(draw);

    // Démarrer l'animation
    draw();

    // Bouton plein écran
    document.getElementById('matrix-fullscreen-btn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            matrixOverlay.requestFullscreen().then(() => {
                canvas.width = screen.width;
                canvas.height = screen.height;
                document.getElementById('matrix-fullscreen-btn').innerHTML = '<div class="text-green-400 text-sm font-mono flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Quitter</div>';
            }).catch(err => {
                console.error('Erreur plein écran:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                document.getElementById('matrix-fullscreen-btn').innerHTML = '<div class="text-green-400 text-sm font-mono"> Plein écran</div>';
            });
        }
    });

    // Gestionnaire pour les changements de plein écran
    const handleFullscreenChange = () => {
        if (document.fullscreenElement) {
            canvas.width = screen.width;
            canvas.height = screen.height;
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Gestionnaire d'événements pour quitter avec "q"
    const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'q') {
            // Arrêter l'animation
            if (animationId) {
            cancelAnimationFrame(animationId);
            }
            
            // Nettoyer l'overlay (supprimer du DOM)
            if (matrixOverlay && matrixOverlay.parentNode) {
            matrixOverlay.parentNode.removeChild(matrixOverlay);
            }
            
            // Retirer l'écouteur d'événements
            document.removeEventListener('keypress', handleKeyPress);
            window.removeEventListener('resize', handleResize);
            
            // Nettoyer la console et afficher le message de sortie
            this.addOutput('<span class="text-red-400">Matrix simulation terminée</span>');
            this.commandInputElement.focus();
            }
            };

            // Gestionnaire pour redimensionner le canvas
            const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            };

            document.addEventListener('keypress', handleKeyPress);
            window.addEventListener('resize', handleResize);
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

        // Importer les commandes
        const success = this.importCommands(codeToImport);
        if (success) {
            this.addOutput('✅ Commandes importées avec succès!', 'system');
            this.addOutput('Tapez "listCommands" pour voir les nouvelles commandes disponibles.', 'system');
        }

        this.closeCodeImportModal();
    },

    openAboutModal() {
        this.aboutModal.classList.remove('hidden');
        this.closeAllMenus();

        // Load version info from version.json
        fetch("./version.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(versionData => {
                // Update modal content with version info
                const versionElement = document.getElementById('app-version');
                const dateElement = document.getElementById('build-date');
                if (!versionData || typeof versionData !== 'object') {
                    throw new Error('Invalid version data format');
                }
                if (versionElement) {
                    versionElement.textContent = versionData.version || 'N/A';
                }
                if (dateElement) {
                    dateElement.textContent = versionData.buildDate || 'N/A';
                }

                // Display changelog
                this.showChangelog(versionData);
            })
            .catch(error => {
                console.error('Error loading version info:', error);
                // Fallback values if version.json can't be loaded
                const versionElement = document.getElementById('app-version');
                const dateElement = document.getElementById('build-date');

                if (versionElement) {
                    versionElement.textContent = 'Version indisponible';
                }
                if (dateElement) {
                    dateElement.textContent = 'Date indisponible';
                }
            });
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
    loadVersionInfo: async function () {
        try {
            const response = await fetch('./version.json');
            const versionData = await response.json();

            // Mettre à jour les éléments de version dans la modal about
            const versionElement = document.getElementById('app-version');
            const buildDateElement = document.getElementById('build-date');

            if (versionElement) {
                versionElement.textContent = versionData.version;
            }

            if (buildDateElement) {
                buildDateElement.textContent = versionData.buildDate;
            }

        } catch (error) {
            console.error('Erreur lors du chargement des informations de version:', error);
        }
    },
    // --- Command Import System ---
    importCommands(jsCode) {
        try {
            // Créer un contexte sécurisé pour l'exécution
            const commandContext = {
                app: this,
                addOutput: this.addOutput.bind(this),
                getPath: this.getPath.bind(this),
                resolvePath: this.resolvePath.bind(this),
                currentDir: this.currentDir,
                fileSystem: this.fileSystem,
                history: this.history,
                saveFileSystemToCookie: this.saveFileSystemToCookie.bind(this),
                addToHistory: this.addToHistory.bind(this),
                clearConsole: this.clearConsole.bind(this),
                updatePrompt: this.updatePrompt.bind(this),
                getPseudoFromCookie: this.getPseudoFromCookie.bind(this),
                // Utilitaires pour les nouvelles commandes
                utils: {
                    parseOptions: this.commands.parseOptions.bind(this),
                    formatBytes: this.commands.formatBytes.bind(this),
                    enDev: this.enDev.bind(this)
                }
            };

            // Fonction pour enregistrer de nouvelles commandes
            const registerCommand = (name, func) => {
                if (typeof name !== 'string' || typeof func !== 'function') {
                    throw new Error('registerCommand nécessite un nom (string) et une fonction');
                }
                if (this.commands[name]) {
                    this.addOutput(`⚠️ La commande '${name}' existe déjà et sera remplacée`, 'system');
                }
                this.commands[name] = func.bind(this);
                return true;
            };

            // Créer une fonction d'évaluation sécurisée
            const evalInContext = new Function(
                'context',
                'registerCommand',
                'console',
                jsCode
            );

            // Exécuter le code avec le contexte
            evalInContext(commandContext, registerCommand, console);

            return true;
        } catch (error) {
            this.addOutput(`Erreur lors de l'importation des commandes: ${error.message}`, 'error');
            console.error('Command import error:', error);
            return false;
        }
    },

};


function updatePromptDisplay() {
        const promptLabel = document.getElementById('prompt-label');
        const consoleName = document.getElementById('console-name');
        const appContainer = document.getElementById('app-container');

        if (window.innerWidth <= 520) {
            promptLabel.style.display = 'none';
        } else {
            promptLabel.style.display = 'flex';
        }

        if (window.innerWidth <= 365) {
            consoleName.style.display = 'none';
        } else {
            consoleName.style.display = 'flex';
        }

        if (window.innerWidth <= 330) {
            appContainer.style.display = 'none';
            // Créer ou afficher le message d'écran trop petit
            let smallScreenMessage = document.getElementById('small-screen-message');
            if (!smallScreenMessage) {
                smallScreenMessage = document.createElement('div');
                smallScreenMessage.id = 'small-screen-message';
                smallScreenMessage.className = 'fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-50';
                smallScreenMessage.innerHTML = `
                    <div class="bg-gray-800 rounded-lg p-6 text-center max-w-sm border border-gray-700">
                        <div class="text-red-400 text-4xl mb-4">⚠️</div>
                        <h2 class="text-xl font-bold text-white mb-3">Écran trop petit</h2>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            Votre écran est trop petit, par conséquent la console n'est pas supportée. 
                            Veuillez utiliser un écran plus large ou tourner votre appareil.
                        </p>
                    </div>
                `;
                document.body.appendChild(smallScreenMessage);
            } else {
                smallScreenMessage.style.display = 'flex';
            }
        } else {
            appContainer.style.display = 'block';
            // Masquer le message si l'écran est assez grand
            const smallScreenMessage = document.getElementById('small-screen-message');
            if (smallScreenMessage) {
                smallScreenMessage.style.display = 'none';
            }
        }
           
    }

// --- Initialize the App ---

document.addEventListener('DOMContentLoaded', function () {
    app.init();
    // Appel initial
    updatePromptDisplay();

    // Écoute du redimensionnement
    window.addEventListener('resize', updatePromptDisplay);
});