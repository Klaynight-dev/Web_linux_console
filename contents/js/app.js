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
    fileSystem: {'/':{type:'directory',children:{'bin':{type:'directory',children:{}},'home':{type:'directory',children:{'user':{type:'directory',children:{'welcome.txt':{type:'file',content:'Bienvenue sur votre console Linux web!'},'notes.txt':{type:'file',content:'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.'}}}}},'etc':{type:'directory',children:{'motd':{type:'file',get content(){const mots=["Message du jour : Amusez-vous bien !","Message du jour : Apprenez quelque chose de nouveau aujourd'hui.","Message du jour : La persévérance paie toujours.","Message du jour : Codez avec passion.","Message du jour : Prenez une pause et respirez.","Message du jour : La curiosité est une qualité.","Message du jour : Essayez une nouvelle commande.","Message du jour : Partagez vos connaissances.","Message du jour : La simplicité est la sophistication suprême.","Message du jour : Un bug aujourd'hui, une solution demain.","Message du jour : La créativité commence par une idée.","Message du jour : Osez sortir de votre zone de confort.","Message du jour : La collaboration fait la force.","Message du jour : Chaque jour est une nouvelle opportunité.","Message du jour : L'échec est le début du succès.","Message du jour : Prenez soin de vous.","Message du jour : La patience est une vertu.","Message du jour : Faites de votre mieux.","Message du jour : Le partage, c'est la vie."];const now=new Date();const start=new Date(now.getFullYear(),0,0);const diff=now-start;const oneDay=1000*60*60*24;const dayOfYear=Math.floor(diff/oneDay);return mots[dayOfYear%mots.length];}}}}}}},
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
        this.populateBinDirectory();

    },

    generateBinCommands() {
        const commands = COMMAND_METADATA;
        const binCommands = {};
        
        Object.keys(commands).forEach(commandName => {
            binCommands[commandName] = {
                type: 'file',
                content: `Executable: ${commandName}`
            };
        });
        
        return binCommands;
    },

    populateBinDirectory() {
        const binCommands = this.generateBinCommands();
        const binPath = this.getPath('/bin');
        
        if (binPath && binPath.type === 'directory') {
            Object.keys(binCommands).forEach(commandName => {
                binPath.children[commandName] = binCommands[commandName];
            });
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
        help(args) {
            if (args.length > 0) {
                const helpOption = args[0];
                if (helpOption === '--help') {
                    this.addOutput('<span class="font-bold text-blue-400">help - afficher l\'aide des commandes</span>');
                    this.addOutput('');
                    this.addOutput('<span class="text-green-400">UTILISATION:</span>');
                    this.addOutput('    help [OPTION]');
                    this.addOutput('');
                    this.addOutput('<span class="text-green-400">DESCRIPTION:</span>');
                    this.addOutput('    Affiche la liste des commandes disponibles organisées par catégorie.');
                    this.addOutput('');
                    this.addOutput('<span class="text-green-400">OPTIONS:</span>');
                    this.addOutput('    --help     affiche cette aide et quitte');
                    this.addOutput('');
                    this.addOutput('<span class="text-green-400">EXEMPLES:</span>');
                    this.addOutput('    help       affiche toutes les commandes');
                    return;
                }
            }

            this.addOutput('<span class="font-bold text-purple-300 text-lg">Commandes disponibles :</span>');

            const grouped = commandHelpers.groupCommandsByCategory();
            const categoryOrder = commandHelpers.getCategoryOrder();

            categoryOrder.forEach((category, index) => {
                if (grouped[category]) {
                    const icon = commandHelpers.getCategoryIcon(category);
                    
                    this.addOutput(`<span class="underline text-blue-300 font-semibold mt-2">${icon} ${category}</span>`);
                    
                    grouped[category].forEach(cmdName => {
                        const metadata = COMMAND_METADATA[cmdName];
                        if (metadata) {
                            let commandLine = `<span class="ml-4"><span class="text-green-400 cursor-pointer clickable-command" data-command="${cmdName}">${cmdName}</span>`;
                            
                            // Ajouter helpOption avec style si présent ET différent de "None"
                            if (metadata.helpOption && metadata.helpOption !== "None" && metadata.helpOption.trim() !== "") {
                                // Échapper les caractères < et > pour l'affichage HTML
                                const escapedHelpOption = metadata.helpOption.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                commandLine += ` <span class="bg-gray-700 text-gray-200 px-1 rounded">${escapedHelpOption}</span>`;
                            }
                            
                            commandLine += ` <span class="text-gray-400">- ${metadata.description}</span></span>`;
                            this.addOutput(commandLine);
                        }
                    });
                    
                    // Ajouter séparateur sauf pour la dernière catégorie
                    if (index < categoryOrder.length - 1) {
                        this.addOutput('<hr class="my-2 border-gray-700">');
                    }
                }
            });

            this.addOutput('<hr class="my-2 border-gray-700">');
            
            // Configurer les commandes cliquables
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
        github: async function () {

            // Animation de chargement
            const loadingHTML = `
            <div id="github-loading" class="mt-3 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                <div class="flex items-center justify-center space-x-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span class="text-blue-300 font-medium">Connexion à l'API GitHub...</span>
                </div>
                <div class="mt-3 bg-gray-700 rounded-full h-2">
                <div id="github-progress" class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
            `;
            this.addOutput(loadingHTML, 'system');

            // Animation de la barre de progression
            let progress = 0;
            const progressBar = document.getElementById('github-progress');
            const progressInterval = setInterval(() => {
            progress += Math.random() * 20 + 10;
            if (progress > 95) progress = 95;
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            }, 200);

            try {
            // Appel à l'API GitHub
            const response = await fetch('https://api.github.com/repos/Klaynight-dev/Web_linux_console');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const repoData = await response.json();

            // Terminer l'animation de chargement
            clearInterval(progressInterval);
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            setTimeout(() => {
                // Supprimer l'animation de chargement
                const loadingElement = document.getElementById('github-loading');
                if (loadingElement) {
                loadingElement.remove();
                }

                const githubHTML = `
                <div class="border border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                    <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-gray-600">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        </div>
                        <div>
                        <h2 class="text-2xl font-bold text-white">${repoData.name}</h2>
                        <p class="text-blue-300 text-sm">${repoData.description || 'Console Linux Web Interactive'}</p>
                        </div>
                    </div>
                    <div class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                        ${repoData.private ? 'Private' : 'Open Source'}
                    </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-blue-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        À propos du projet
                        </h3>
                        <p class="text-gray-300 text-sm leading-relaxed">
                        ${repoData.description || 'Une console Linux interactive entièrement développée en JavaScript. Explorez les commandes Unix/Linux directement dans votre navigateur !'}
                        </p>
                        <div class="flex items-center space-x-4 text-xs text-gray-400">
                        <span>📅 Créé le ${new Date(repoData.created_at).toLocaleDateString('fr-FR')}</span>
                        <span>🔄 Mis à jour le ${new Date(repoData.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-purple-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Fonctionnalités
                        </h3>
                        <ul class="text-gray-300 text-sm space-y-1">
                        <li class="flex items-center"><span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>+${Object.keys(COMMAND_METADATA).length} commandes</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>Système de fichiers virtuel</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>Historique persistant</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>Interface personnalisable</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>Langage: ${repoData.language || 'JavaScript'}</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>Taille: ${(repoData.size / 1024).toFixed(1)} MB</li>
                        </ul>
                    </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-3 justify-center">
                    <a href="${repoData.html_url}" target="_blank" 
                       class="flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border border-gray-600 hover:border-gray-500">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span class="font-semibold">Voir le code source</span>
                    </a>
                    
                    <a href="${repoData.html_url}/issues" target="_blank" 
                       class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-semibold">Signaler un bug (${repoData.open_issues})</span>
                    </a>
                    
                    <a href="${repoData.html_url}/fork" target="_blank" 
                       class="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-semibold">Fork le projet</span>
                    </a>
                    
                    ${repoData.clone_url ? `
                    <button onclick="navigator.clipboard.writeText('${repoData.clone_url}').then(() => app.addOutput('URL de clonage copiée!', 'system'))" 
                           class="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-semibold">Copier git clone</span>
                    </button>
                    ` : ''}
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-600">
                    <div class="flex items-center justify-between text-sm text-gray-400">
                        <div class="flex items-center space-x-4">
                        <span>📅 Créé le ${new Date(repoData.created_at).toLocaleDateString('fr-FR')}</span>
                        <span>🔄 Mis à jour le ${new Date(repoData.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="text-xs">
                        Made with ❤️ by <a href="${repoData.owner.html_url}" target="_blank" class="text-blue-400 hover:text-blue-300">${repoData.owner.login}</a>
                        </div>
                    </div>
                    </div>
                </div>
                `;
                
                this.addOutput(githubHTML, 'system');
            }, 800);

            } catch (error) {
            // En cas d'erreur, nettoyer l'animation et afficher l'erreur
            clearInterval(progressInterval);
            const loadingElement = document.getElementById('github-loading');
            if (loadingElement) {
                loadingElement.remove();
            }

            this.addOutput(`
                <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                <div class="flex items-center mb-2">
                    <span class="text-red-400 mr-2">❌</span>
                    <span class="text-red-300 font-medium">Erreur lors de la récupération des données GitHub</span>
                </div>
                <div class="text-red-400 text-sm">${error.message}</div>
                <div class="text-gray-400 text-xs mt-2">
                    Vérifiez votre connexion internet ou que le dépôt existe bien.
                </div>
                </div>
            `, 'error');

            // Fallback vers l'affichage statique
            setTimeout(() => {
                const fallbackHTML = `
                <div class="border border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                    <div class="text-center">
                    <div class="w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-gray-600 mx-auto mb-4">
                        <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">CLK Console</h2>
                    <p class="text-gray-300 mb-4">Console Linux Web Interactive (Mode hors ligne)</p>
                    <a href="https://github.com/Klaynight-dev/Web_linux_console" target="_blank" 
                       class="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-300">
                        <span class="font-semibold">Visitez le dépôt GitHub</span>
                    </a>
                    </div>
                </div>
                `;
                this.addOutput(fallbackHTML, 'system');
            }, 1000);
            }
        },
        clearHistory: function () {
            this.history = [];
            this.saveHistoryToCookie();
            this.addOutput('Historique des commandes effacé.', 'system');
        },
        resetAllCache: function () {
            this.addOutput('<span class="text-red-400 font-bold">⚠️ ATTENTION ⚠️</span>');
            this.addOutput('<span class="text-yellow-400">Cette action va supprimer définitivement :</span>');
            this.addOutput('• Tous les cookies de l\'application');
            this.addOutput('• L\'historique des commandes');
            this.addOutput('• Le système de fichiers personnalisé');
            this.addOutput('• Les paramètres de personnalisation');
            this.addOutput('');
            this.addOutput('<span class="text-red-400">Cette action est IRRÉVERSIBLE !</span>');
            this.addOutput('<span class="text-white">Voulez-vous vraiment continuer ? (y/N)</span>');
            
            // Sauvegarder les gestionnaires d'événements actuels
            const originalSubmitHandler = this.handleCommandSubmit.bind(this);
            const originalKeydownHandler = this.handleKeyDown.bind(this);
            
            // Créer un nouveau gestionnaire pour la confirmation
            const confirmationHandler = (e) => {
                e.preventDefault();
                // Ne rien faire lors du submit, on gère tout dans keydown
                return false;
            };
            
            // Gestionnaire pour les touches (pour détecter y/n directement)
            const keydownHandler = (e) => {
                // Détecter la pression sur 'y' ou 'n' directement
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    
                    // Exécuter la suppression
                    document.cookie.split(";").forEach(cookie => {
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                        document.cookie = name.trim() + "=;path=/;max-age=0";
                    });
                    
                    // Vider localStorage
                    localStorage.clear();
                    
                    // Réinitialiser l'état de l'application
                    this.history = [];
                    
                    // Réinitialiser le système de fichiers à l'état par défaut
                    this.fileSystem = {'/':{type:'directory',children:{'bin':{type:'directory',children:{}},'home':{type:'directory',children:{'user':{type:'directory',children:{'welcome.txt':{type:'file',content:'Bienvenue sur votre console Linux web!'},'notes.txt':{type:'file',content:'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.'}}}}},'etc':{type:'directory',children:{'motd':{type:'file',get content(){const mots=["Message du jour : Amusez-vous bien !","Message du jour : Apprenez quelque chose de nouveau aujourd'hui.","Message du jour : La persévérance paie toujours.","Message du jour : Codez avec passion.","Message du jour : Prenez une pause et respirez.","Message du jour : La curiosité est une qualité.","Message du jour : Essayez une nouvelle commande.","Message du jour : Partagez vos connaissances.","Message du jour : La simplicité est la sophistication suprême.","Message du jour : Un bug aujourd'hui, une solution demain.","Message du jour : La créativité commence par une idée.","Message du jour : Osez sortir de votre zone de confort.","Message du jour : La collaboration fait la force.","Message du jour : Chaque jour est une nouvelle opportunité.","Message du jour : L'échec est le début du succès.","Message du jour : Prenez soin de vous.","Message du jour : La patience est une vertu.","Message du jour : Faites de votre mieux.","Message du jour : Le partage, c'est la vie."];const now=new Date();const start=new Date(now.getFullYear(),0,0);const diff=now-start;const oneDay=1000*60*60*24;const dayOfYear=Math.floor(diff/oneDay);return mots[dayOfYear%mots.length];}}}}}}};
                    
                    this.currentDir = '/home/user';
                    this.populateBinDirectory();
                    this.saveFileSystemToCookie();
                    
                    // Vider complètement la console
                    this.clearConsole();
                    
                    // Afficher les messages de confirmation
                    this.addOutput('<span class="text-green-400 font-bold">✅ SUPPRESSION TERMINÉE</span>', 'system');
                    this.addOutput('<span class="text-green-400">• Tous les cookies ont été supprimés</span>', 'system');
                    this.addOutput('<span class="text-green-400">• L\'historique des commandes a été effacé</span>', 'system');
                    this.addOutput('<span class="text-green-400">• Le système de fichiers a été réinitialisé</span>', 'system');
                    this.addOutput('<span class="text-green-400">• Les paramètres ont été remis par défaut</span>', 'system');
                    this.addOutput('');
                    this.addOutput('<span class="text-blue-400">L\'application a été complètement réinitialisée à son état initial.</span>', 'system');
                    
                    this.updatePrompt();
                    
                    // Restaurer les gestionnaires originaux
                    this.commandFormElement.removeEventListener('submit', confirmationHandler);
                    this.commandInputElement.removeEventListener('keydown', keydownHandler);
                    this.commandFormElement.addEventListener('submit', originalSubmitHandler);
                    this.commandInputElement.addEventListener('keydown', originalKeydownHandler);
                    
                    // Nettoyer et remettre le focus
                    this.commandInputElement.value = '';
                    this.historyIndex = -1;
                    this.commandInputElement.focus();
                    
                } else if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    
                    this.addOutput('<span class="text-gray-400">Opération annulée.</span>', 'system');
                    
                    // Restaurer les gestionnaires originaux
                    this.commandFormElement.removeEventListener('submit', confirmationHandler);
                    this.commandInputElement.removeEventListener('keydown', keydownHandler);
                    this.commandFormElement.addEventListener('submit', originalSubmitHandler);
                    this.commandInputElement.addEventListener('keydown', originalKeydownHandler);
                    
                    // Nettoyer et remettre le focus
                    this.commandInputElement.value = '';
                    this.historyIndex = -1;
                    this.commandInputElement.focus();
                }
                
                // Bloquer les autres fonctionnalités pendant la confirmation
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab' || (e.key === 'l' && e.ctrlKey) || e.key === 'Enter') {
                    e.preventDefault();
                }
            };
            
            // Remplacer temporairement les gestionnaires
            this.commandFormElement.removeEventListener('submit', originalSubmitHandler);
            this.commandInputElement.removeEventListener('keydown', originalKeydownHandler);
            this.commandFormElement.addEventListener('submit', confirmationHandler);
            this.commandInputElement.addEventListener('keydown', keydownHandler);
            
            // Vider le champ de saisie et donner le focus
            this.commandInputElement.value = '';
            this.historyIndex = -1;
            this.commandInputElement.focus();
        },
        lshw: function () {
            // Affiche les vraies informations matérielles du PC
            const headerHTML = `
                <div class="border border-green-500 rounded-lg p-4 bg-green-900/20 backdrop-blur-sm">
                    <div class="flex items-center mb-3">
                        <span class="text-2xl mr-2">🖥️</span>
                        <span class="font-bold text-green-400 text-xl">Informations matérielles système (lshw)</span>
                    </div>
                    <div class="text-gray-300 text-sm mb-2">Récupération des informations matérielles réelles...</div>
                    <div class="text-yellow-400 text-xs italic">⚠️ Le navigateur étant limité, certaines informations peuvent être erronées ou incomplètes</div>
                </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Ajouter l'animation de chargement
            const loadingHTML = `
                <div id="lshw-loading" class="mt-3 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                    <div class="flex items-center justify-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                        <span class="text-green-300 font-medium">Analyse matérielle en cours...</span>
                    </div>
                    <div class="mt-3 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span class="text-sm text-gray-400">Détection CPU et mémoire...</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-purple-400 rounded-full" style="animation-delay: 0.3s"></div>
                            <span class="text-sm text-gray-400">Analyse GPU via WebGL...</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style="animation-delay: 0.6s"></div>
                            <span class="text-sm text-gray-400">Inventaire des périphériques...</span>
                        </div>
                    </div>
                    <div class="mt-3 bg-gray-700 rounded-full h-2">
                        <div id="lshw-progress" class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            `;
            this.addOutput(loadingHTML, 'system');

            // Animation de la barre de progression
            let progress = 0;
            const progressBar = document.getElementById('lshw-progress');
            const progressInterval = setInterval(() => {
                progress += Math.random() * 12 + 8;
                if (progress > 95) progress = 95;
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
            }, 250);

            // Fonction pour récupérer les vraies informations matérielles
            const getRealHardwareInfo = async () => {
                const hwInfo = {};
                
                try {
                    const nav = window.navigator;
                    
                    // Informations système de base
                    hwInfo.system = {
                        userAgent: nav.userAgent,
                        platform: nav.platform || 'Inconnu',
                        language: nav.language || 'Inconnu',
                        languages: (nav.languages || []).join(', '),
                        online: navigator.onLine,
                        cookieEnabled: nav.cookieEnabled,
                        doNotTrack: nav.doNotTrack,
                        vendor: nav.vendor,
                        product: nav.product,
                        webdriver: nav.webdriver
                    };

                    // Informations CPU et mémoire
                    hwInfo.cpu = {
                        cores: nav.hardwareConcurrency || 'Inconnu',
                        memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Inconnu'
                    };

                    // Informations d'affichage
                    if (window.screen) {
                        hwInfo.display = {
                            resolution: `${window.screen.width}x${window.screen.height}`,
                            colorDepth: `${window.screen.colorDepth} bits`,
                            orientation: window.screen.orientation ? window.screen.orientation.type : 'Inconnu',
                            pixelRatio: window.devicePixelRatio || 'Inconnu',
                            viewport: `${window.innerWidth}x${window.innerHeight}`
                        };
                    }

                    // Informations tactiles
                    if (nav.maxTouchPoints !== undefined) {
                        hwInfo.touch = {
                            maxPoints: nav.maxTouchPoints,
                            supported: nav.maxTouchPoints > 0
                        };
                    }

                    // Informations réseau
                    if (nav.connection) {
                        const c = nav.connection;
                        hwInfo.network = {
                            type: c.effectiveType || c.type || 'Inconnu',
                            downlink: c.downlink ? `${c.downlink} Mbps` : 'Inconnu',
                            rtt: c.rtt ? `${c.rtt} ms` : 'Inconnu',
                            saveData: c.saveData !== undefined ? (c.saveData ? 'Activé' : 'Désactivé') : 'Inconnu'
                        };
                    }

                    // Informations WebGL/GPU
                    try {
                        const canvas = document.createElement('canvas');
                        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                            hwInfo.gpu = {
                                version: gl.getParameter(gl.VERSION),
                                vendor: gl.getParameter(gl.VENDOR),
                                renderer: gl.getParameter(gl.RENDERER),
                                shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
                            };

                            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                            if (debugInfo) {
                                hwInfo.gpu.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                                hwInfo.gpu.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                            }
                        }
                    } catch (error) {
                        hwInfo.gpu = { error: 'Non accessible' };
                    }

                    // Informations batterie
                    if (navigator.getBattery) {
                        try {
                            const battery = await navigator.getBattery();
                            hwInfo.battery = {
                                level: `${Math.round(battery.level * 100)}%`,
                                charging: battery.charging,
                                chargingTime: battery.chargingTime !== Infinity ? `${Math.round(battery.chargingTime / 60)} min` : 'Indéfini',
                                dischargingTime: battery.dischargingTime !== Infinity ? `${Math.round(battery.dischargingTime / 60)} min` : 'Indéfini'
                            };
                        } catch (error) {
                            hwInfo.battery = { error: 'Non accessible' };
                        }
                    }

                    // Informations batterie
                    if (navigator.getBattery) {
                        try {
                            const battery = await navigator.getBattery();
                            hwInfo.battery = {
                                level: `${Math.round(battery.level * 100)}%`,
                                charging: battery.charging,
                                chargingTime: battery.chargingTime !== Infinity ? `${Math.round(battery.chargingTime / 60)} min` : 'Indéfini',
                                dischargingTime: battery.dischargingTime !== Infinity ? `${Math.round(battery.dischargingTime / 60)} min` : 'Indéfini'
                            };
                        } catch (error) {
                            hwInfo.battery = { error: 'Non accessible' };
                        }
                    }

                    // Informations périphériques média
                    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                        try {
                            const devices = await navigator.mediaDevices.enumerateDevices();
                            hwInfo.media = {
                                audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                                videoInputs: devices.filter(d => d.kind === 'videoinput').length,
                                audioOutputs: devices.filter(d => d.kind === 'audiooutput').length
                            };
                        } catch (error) {
                            hwInfo.media = { error: 'Non accessible' };
                        }
                    }

                    return hwInfo;

                } catch (error) {
                    console.error('Erreur récupération matériel:', error);
                    return {};
                }
            };

            // Fonction pour afficher les informations matérielles
            const displayHardwareInfo = (hwInfo) => {
                let output = '';

                // Système de base
                if (hwInfo.system) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">💻</span>
                                <span class="font-bold text-blue-400 text-lg">Système</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                    <span class="text-blue-300 font-medium">Plateforme:</span>
                                    <span class="text-white font-mono">${hwInfo.system.platform}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                    <span class="text-green-300 font-medium">Langue:</span>
                                    <span class="text-white font-mono">${hwInfo.system.language}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                    <span class="text-purple-300 font-medium">Navigateur:</span>
                                    <span class="text-white font-mono">${hwInfo.system.vendor || 'Inconnu'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                    <span class="text-yellow-300 font-medium">En ligne:</span>
                                    <span class="text-white font-mono">${hwInfo.system.online ? 'Oui' : 'Non'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // CPU et Mémoire
                if (hwInfo.cpu) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🧠</span>
                                <span class="font-bold text-cyan-400 text-lg">Processeur & Mémoire</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                    <span class="text-cyan-300 font-medium">Cœurs CPU:</span>
                                    <span class="text-white font-mono">${hwInfo.cpu.cores}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                    <span class="text-cyan-300 font-medium">RAM estimée:</span>
                                    <span class="text-white font-mono">${hwInfo.cpu.memory}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Affichage
                if (hwInfo.display) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🖥️</span>
                                <span class="font-bold text-purple-400 text-lg">Affichage</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                    <span class="text-purple-300 font-medium">Résolution:</span>
                                    <span class="text-white font-mono">${hwInfo.display.resolution}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                    <span class="text-purple-300 font-medium">Profondeur couleur:</span>
                                    <span class="text-white font-mono">${hwInfo.display.colorDepth}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                    <span class="text-purple-300 font-medium">Pixel Ratio:</span>
                                    <span class="text-white font-mono">${hwInfo.display.pixelRatio}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                    <span class="text-purple-300 font-medium">Fenêtre visible:</span>
                                    <span class="text-white font-mono">${hwInfo.display.viewport}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // GPU
                if (hwInfo.gpu && !hwInfo.gpu.error) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🎮</span>
                                <span class="font-bold text-red-400 text-lg">Carte Graphique (WebGL)</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                ${hwInfo.gpu.unmaskedVendor ? `
                                    <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                        <span class="text-red-300 font-medium">Fabricant:</span>
                                        <span class="text-white font-mono">${hwInfo.gpu.unmaskedVendor}</span>
                                    </div>
                                ` : ''}
                                ${hwInfo.gpu.unmaskedRenderer ? `
                                    <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                        <span class="text-red-300 font-medium">Modèle:</span>
                                        <span class="text-white font-mono">${hwInfo.gpu.unmaskedRenderer}</span>
                                    </div>
                                ` : ''}
                                <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                    <span class="text-red-300 font-medium">WebGL Version:</span>
                                    <span class="text-white font-mono">${hwInfo.gpu.version}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                    <span class="text-red-300 font-medium">Shading Language:</span>
                                    <span class="text-white font-mono">${hwInfo.gpu.shadingLanguage}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Réseau
                if (hwInfo.network) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🌐</span>
                                <span class="font-bold text-yellow-400 text-lg">Réseau</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                    <span class="text-yellow-300 font-medium">Type connexion:</span>
                                    <span class="text-white font-mono">${hwInfo.network.type}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                    <span class="text-yellow-300 font-medium">Débit estimé:</span>
                                    <span class="text-white font-mono">${hwInfo.network.downlink}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                    <span class="text-yellow-300 font-medium">Latence:</span>
                                    <span class="text-white font-mono">${hwInfo.network.rtt}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Batterie
                if (hwInfo.battery && !hwInfo.battery.error) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🔋</span>
                                <span class="font-bold text-orange-400 text-lg">Batterie</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                    <span class="text-orange-300 font-medium">Niveau:</span>
                                    <span class="text-white font-mono">${hwInfo.battery.level}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                    <span class="text-orange-300 font-medium">En charge:</span>
                                    <span class="text-white font-mono">${hwInfo.battery.charging ? 'Oui' : 'Non'}</span>
                                </div>
                                ${hwInfo.battery.chargingTime !== 'Indéfini' ? `
                                    <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                        <span class="text-orange-300 font-medium">Temps charge:</span>
                                        <span class="text-white font-mono">${hwInfo.battery.chargingTime}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }

                // Périphériques média
                if (hwInfo.media && !hwInfo.media.error) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">🎤</span>
                                <span class="font-bold text-pink-400 text-lg">Périphériques Média</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-pink-900/30 rounded">
                                    <span class="text-pink-300 font-medium">Microphones:</span>
                                    <span class="text-white font-mono">${hwInfo.media.audioInputs}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-pink-900/30 rounded">
                                    <span class="text-pink-300 font-medium">Caméras:</span>
                                    <span class="text-white font-mono">${hwInfo.media.videoInputs}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-pink-900/30 rounded">
                                    <span class="text-pink-300 font-medium">Haut-parleurs:</span>
                                    <span class="text-white font-mono">${hwInfo.media.audioOutputs}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Informations tactiles
                if (hwInfo.touch) {
                    output += `
                        <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                            <div class="flex items-center mb-3">
                                <span class="text-lg mr-2">👆</span>
                                <span class="font-bold text-teal-400 text-lg">Interface Tactile</span>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between p-2 bg-teal-900/30 rounded">
                                    <span class="text-teal-300 font-medium">Points tactiles max:</span>
                                    <span class="text-white font-mono">${hwInfo.touch.maxPoints}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-teal-900/30 rounded">
                                    <span class="text-teal-300 font-medium">Support tactile:</span>
                                    <span class="text-white font-mono">${hwInfo.touch.supported ? 'Oui' : 'Non'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                return output;
            };

            // Exécution et affichage
            getRealHardwareInfo().then(hwInfo => {
                // Terminer l'animation de chargement
                clearInterval(progressInterval);
                if (progressBar) {
                    progressBar.style.width = '100%';
                }

                setTimeout(() => {
                    // Supprimer l'animation de chargement
                    const loadingElement = document.getElementById('lshw-loading');
                    if (loadingElement) {
                        loadingElement.remove();
                    }

                    if (Object.keys(hwInfo).length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations matérielles</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = displayHardwareInfo(hwInfo);

                    // Message de succès
                    const successHTML = `
                        <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <div class="flex items-center">
                                <span class="text-green-400 mr-2">✅</span>
                                <span class="text-green-300 font-medium">Analyse matérielle terminée avec succès</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                Les informations sont limitées par le navigateur pour des raisons de sécurité et de confidentialité.
                            </div>
                        </div>
                    `;

                    this.addOutput(output + successHTML, 'system');
                }, 600);
            }).catch(error => {
                // En cas d'erreur, nettoyer l'animation
                clearInterval(progressInterval);
                const loadingElement = document.getElementById('lshw-loading');
                if (loadingElement) {
                    loadingElement.remove();
                }

                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <span class="text-red-400">❌ Erreur lors de la récupération des informations matérielles: ${error.message}</span>
                    </div>
                `, 'error');
            });
        },

        ifconfig: function () {
            // Affiche les vraies informations réseau du PC
            const headerHTML = `
                <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                    <div class="flex items-center mb-3">
                        <span class="text-2xl mr-2">🌐</span>
                        <span class="font-bold text-blue-400 text-xl">Configuration réseau système (ifconfig)</span>
                    </div>
                    <div class="text-gray-300 text-sm mb-2">Récupération des informations réseau réelles...</div>
                    <div class="text-yellow-400 text-xs italic">⚠️ Le navigateur étant limité, certaines informations peuvent être erronées ou incomplètes</div>
                </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Ajouter l'animation de chargement
            const loadingHTML = `
                <div id="ifconfig-loading" class="mt-3 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                    <div class="flex items-center justify-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                        <span class="text-blue-300 font-medium">Analyse des interfaces réseau en cours...</span>
                    </div>
                    <div class="mt-3 space-y-2">
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-sm text-gray-400">Récupération IP publique...</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style="animation-delay: 0.3s"></div>
                            <span class="text-sm text-gray-400">Détection des IPs locales via WebRTC...</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-purple-400 rounded-full" style="animation-delay: 0.6s"></div>
                            <span class="text-sm text-gray-400">Analyse des capacités réseau...</span>
                        </div>
                    </div>
                    <div class="mt-3 bg-gray-700 rounded-full h-2">
                        <div id="ifconfig-progress" class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            `;
            this.addOutput(loadingHTML, 'system');

            // Animation de la barre de progression
            let progress = 0;
            const progressBar = document.getElementById('ifconfig-progress');
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15 + 5;
                if (progress > 95) progress = 95;
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
            }, 200);

            // Fonction pour récupérer les vraies informations réseau
            const getRealNetworkInfo = async () => {
                const interfaces = [];
                
                try {
                    // Utilise l'API Navigator pour récupérer des infos réelles
                    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                    
                    // Interface principale (WiFi/Ethernet)
                    const mainInterface = {
                        name: 'eth0',
                        type: connection ? (connection.type || 'ethernet') : 'ethernet',
                        state: navigator.onLine ? 'UP RUNNING' : 'DOWN',
                        speed: connection ? connection.downlink : null,
                        effectiveType: connection ? connection.effectiveType : null,
                        rtt: connection ? connection.rtt : null
                    };

                    // Récupération de l'IP publique réelle
                    try {
                        const publicResponse = await fetch('https://httpbin.org/ip');
                        const publicData = await publicResponse.json();
                        mainInterface.publicIP = publicData.origin;
                    } catch {
                        // Fallback vers un autre service
                        try {
                            const fallbackResponse = await fetch('https://api64.ipify.org?format=json');
                            const fallbackData = await fallbackResponse.json();
                            mainInterface.publicIP = fallbackData.ip;
                        } catch {
                            mainInterface.publicIP = 'Non accessible';
                        }
                    }

                    // Récupération des IPs locales via WebRTC (plus précise)
                    const localIPs = await new Promise((resolve) => {
                        const ips = new Set();
                        const rtc = new RTCPeerConnection({
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:stun1.l.google.com:19302' }
                            ]
                        });

                        rtc.createDataChannel('');
                        rtc.onicecandidate = (e) => {
                            if (e.candidate) {
                                const parts = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
                                if (parts && parts[1] && parts[1] !== '127.0.0.1') {
                                    ips.add(parts[1]);
                                }
                            }
                        };

                        rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
                        
                        setTimeout(() => {
                            rtc.close();
                            resolve(Array.from(ips));
                        }, 3000);
                    });

                    mainInterface.localIPs = localIPs;

                    // Récupération d'informations système via Battery API
                    if ('getBattery' in navigator) {
                        try {
                            const battery = await navigator.getBattery();
                            mainInterface.powerInfo = {
                                charging: battery.charging,
                                level: Math.round(battery.level * 100),
                                chargingTime: battery.chargingTime,
                                dischargingTime: battery.dischargingTime
                            };
                        } catch {}
                    }

                    // Informations sur les capacités réseau
                    if ('serviceWorker' in navigator) {
                        mainInterface.serviceWorkerSupport = true;
                    }

                    interfaces.push(mainInterface);

                    // Interface de bouclage (simulation réaliste)
                    interfaces.push({
                        name: 'lo',
                        type: 'loopback',
                        state: 'UP LOOPBACK RUNNING',
                        ip: '127.0.0.1',
                        netmask: '255.0.0.0',
                        mtu: 65536
                    });

                    return interfaces;

                } catch (error) {
                    console.error('Erreur récupération réseau:', error);
                    return [];
                }
            };

            // Fonction pour afficher les interfaces réseau
            const displayInterface = (iface) => {
                let interfaceHTML = `
                    <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center">
                                <span class="text-lg mr-2">${iface.type === 'loopback' ? '🔄' : '🌐'}</span>
                                <span class="font-bold text-green-400 text-lg">${iface.name}</span>
                                <span class="ml-2 text-gray-400 text-sm">(${iface.type})</span>
                            </div>
                            <span class="px-2 py-1 ${iface.state.includes('UP') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'} rounded text-xs font-semibold">
                                ${iface.state}
                            </span>
                        </div>
                        <div class="space-y-2 text-sm">
                `;

                if (iface.name === 'eth0') {
                    if (iface.publicIP) {
                        interfaceHTML += `
                            <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                <span class="text-blue-300 font-medium">IP Publique:</span>
                                <span class="text-white font-mono">${iface.publicIP}</span>
                            </div>
                        `;
                    }

                    if (iface.localIPs && iface.localIPs.length > 0) {
                        iface.localIPs.forEach((ip, index) => {
                            interfaceHTML += `
                                <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                    <span class="text-green-300 font-medium">IP Locale ${index + 1}:</span>
                                    <span class="text-white font-mono">${ip}/24</span>
                                </div>
                            `;
                        });
                    }

                    if (iface.speed) {
                        interfaceHTML += `
                            <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                <span class="text-yellow-300 font-medium">Débit:</span>
                                <span class="text-white font-mono">${iface.speed} Mbps</span>
                            </div>
                        `;
                    }

                    if (iface.effectiveType) {
                        interfaceHTML += `
                            <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                <span class="text-purple-300 font-medium">Type de connexion:</span>
                                <span class="text-white font-mono">${iface.effectiveType}</span>
                            </div>
                        `;
                    }

                    if (iface.rtt) {
                        interfaceHTML += `
                            <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                                <span class="text-cyan-300 font-medium">Latence RTT:</span>
                                <span class="text-white font-mono">${iface.rtt} ms</span>
                            </div>
                        `;
                    }

                    if (iface.powerInfo) {
                        interfaceHTML += `
                            <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                <span class="text-orange-300 font-medium">Batterie:</span>
                                <span class="text-white font-mono">${iface.powerInfo.level}% ${iface.powerInfo.charging ? '(en charge)' : ''}</span>
                            </div>
                        `;
                    }

                    // MTU standard pour ethernet
                    interfaceHTML += `
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">MTU:</span>
                            <span class="text-white font-mono">1500</span>
                        </div>
                    `;

                } else if (iface.name === 'lo') {
                    interfaceHTML += `
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-green-300 font-medium">IP:</span>
                            <span class="text-white font-mono">${iface.ip}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-blue-300 font-medium">Netmask:</span>
                            <span class="text-white font-mono">${iface.netmask}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">MTU:</span>
                            <span class="text-white font-mono">${iface.mtu}</span>
                        </div>
                    `;
                }

                interfaceHTML += `
                        </div>
                    </div>
                `;

                return interfaceHTML;
            };

            // Exécution et affichage
            getRealNetworkInfo().then(interfaces => {
                // Terminer l'animation de chargement
                clearInterval(progressInterval);
                if (progressBar) {
                    progressBar.style.width = '100%';
                }

                setTimeout(() => {
                    // Supprimer l'animation de chargement
                    const loadingElement = document.getElementById('ifconfig-loading');
                    if (loadingElement) {
                        loadingElement.remove();
                    }

                    if (interfaces.length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations réseau système</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = '';
                    interfaces.forEach(iface => {
                        output += displayInterface(iface);
                    });

                    // Informations système additionnelles
                    output += `
                        <div class="mt-4 p-3 bg-gray-800/30 border border-gray-600 rounded-lg">
                            <div class="flex items-center mb-2">
                                <span class="text-lg mr-2">🖥️</span>
                                <span class="font-semibold text-blue-300">Informations système</span>
                            </div>
                            <div class="text-xs text-gray-400 space-y-1">
                                <div>• Platform: ${navigator.platform}</div>
                                <div>• User Agent: ${navigator.userAgent.substring(0, 80)}...</div>
                                <div>• Cores CPU: ${navigator.hardwareConcurrency || 'Inconnu'}</div>
                                <div>• RAM estimée: ${navigator.deviceMemory || 'Inconnu'} GB</div>
                                <div>• Résolution: ${screen.width}x${screen.height}</div>
                            </div>
                        </div>
                    `;

                    // Message de succès
                    const successHTML = `
                        <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <div class="flex items-center">
                                <span class="text-green-400 mr-2">✅</span>
                                <span class="text-green-300 font-medium">Analyse terminée avec succès</span>
                            </div>
                        </div>
                    `;

                    this.addOutput(output + successHTML, 'system');
                }, 500);
            }).catch(error => {
                // En cas d'erreur, nettoyer l'animation
                clearInterval(progressInterval);
                const loadingElement = document.getElementById('ifconfig-loading');
                if (loadingElement) {
                    loadingElement.remove();
                }

                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <span class="text-red-400">❌ Erreur lors de la récupération des informations réseau: ${error.message}</span>
                    </div>
                `, 'error');
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

            // En-tête avec icône et titre
            const headerHTML = `
            <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm mb-3">
                <div class="flex items-center mb-2">
                <span class="text-2xl mr-2">🧠</span>
                <span class="font-bold text-blue-400 text-xl">Utilisation mémoire système (free)</span>
                </div>
                <div class="text-gray-300 text-sm">Affichage des informations de mémoire vive et swap</div>
            </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Calcul des pourcentages pour les barres de progression
            const memUsedPercent = (usedMem / totalMem * 100);
            const memAvailablePercent = (availableMem / totalMem * 100);

            // Tableau stylisé avec des cartes
            const memoryHTML = `
            <div class="space-y-4">
                <!-- Mémoire RAM -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                <div class="flex items-center mb-3">
                    <span class="text-lg mr-2">💾</span>
                    <span class="font-bold text-green-400 text-lg">Mémoire RAM</span>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Total</div>
                    <div class="text-lg font-mono text-white">${totalMem}${unit}</div>
                    </div>
                    <div class="bg-red-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Utilisé</div>
                    <div class="text-lg font-mono text-red-300">${usedMem}${unit}</div>
                    </div>
                    <div class="bg-green-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Libre</div>
                    <div class="text-lg font-mono text-green-300">${freeMem}${unit}</div>
                    </div>
                    <div class="bg-blue-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Disponible</div>
                    <div class="text-lg font-mono text-blue-300">${availableMem}${unit}</div>
                    </div>
                </div>

                <!-- Barre de progression RAM -->
                <div class="mb-2">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Utilisation: ${memUsedPercent.toFixed(1)}%</span>
                    <span>Disponible: ${memAvailablePercent.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500" style="width: ${memUsedPercent}%"></div>
                    </div>
                </div>
                
                <div class="text-xs text-gray-400 text-center">
                    ${memUsedPercent < 50 ? '✅ Utilisation normale' : 
                      memUsedPercent < 80 ? '⚠️ Utilisation modérée' : 
                      '🔴 Utilisation élevée'}
                </div>
                </div>

                <!-- Mémoire SWAP -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                <div class="flex items-center mb-3">
                    <span class="text-lg mr-2">💿</span>
                    <span class="font-bold text-purple-400 text-lg">Mémoire SWAP</span>
                </div>
                
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Total</div>
                    <div class="text-lg font-mono text-white">0${unit}</div>
                    </div>
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Utilisé</div>
                    <div class="text-lg font-mono text-gray-300">0${unit}</div>
                    </div>
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Libre</div>
                    <div class="text-lg font-mono text-gray-300">0${unit}</div>
                    </div>
                </div>

                <div class="text-xs text-gray-400 text-center">
                    ℹ️ Aucune mémoire SWAP configurée
                </div>
                </div>

                <!-- Informations additionnelles -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/30">
                <div class="text-xs text-gray-400 space-y-1">
                    <div><span class="text-yellow-300">•</span> Mémoire détectée via Navigator API: ${navigator.deviceMemory || 'Non disponible'} GB</div>
                    <div><span class="text-blue-300">•</span> Shared/Buffer/Cache: Non applicable dans le navigateur</div>
                    <div><span class="text-green-300">•</span> Utilisation simulée à ${(usedPercent * 100).toFixed(0)}% pour démonstration</div>
                </div>
                </div>
            </div>
            `;

            this.addOutput(memoryHTML, 'system');
        },

        cookies(args) {
            const options = this.parseOptions(args, {
            'a': 'all',
            'c': 'count',
            's': 'size',
            'l': 'list',
            'd': 'delete'
            });

            if (args.length > 0 && args[0] === '--help') {
            this.addOutput('<span class="font-bold text-blue-400">cookies - gestion des cookies du navigateur</span>');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">UTILISATION:</span>');
            this.addOutput('    cookies [OPTION]...');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">DESCRIPTION:</span>');
            this.addOutput('    Affiche et gère les cookies stockés dans le navigateur.');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">OPTIONS:</span>');
            this.addOutput('    -a, --all      affiche tous les détails des cookies');
            this.addOutput('    -c, --count    affiche seulement le nombre de cookies');
            this.addOutput('    -s, --size     affiche la taille totale des cookies');
            this.addOutput('    -l, --list     liste les noms des cookies');
            this.addOutput('    -d, --delete   supprime tous les cookies (dangereux!)');
            this.addOutput('        --help     affiche cette aide et quitte');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">EXEMPLES:</span>');
            this.addOutput('    cookies        affiche un résumé des cookies');
            this.addOutput('    cookies -a     affiche tous les détails');
            this.addOutput('    cookies -c     compte les cookies');
            return;
            }

            // Récupération des cookies ET du localStorage
            const cookies = document.cookie.split(';').filter(cookie => cookie.trim() !== '');
            const localStorageData = {};
            const sessionStorageData = {};
            
            // Récupération du localStorage
            for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            localStorageData[key] = value;
            }
            
            // Récupération du sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            sessionStorageData[key] = value;
            }

            const cookieCount = cookies.length;
            const localStorageCount = Object.keys(localStorageData).length;
            const sessionStorageCount = Object.keys(sessionStorageData).length;
            const totalDataCount = cookieCount + localStorageCount + sessionStorageCount;

            // Calcul des tailles
            let cookiesTotalSize = 0;
            let localStorageTotalSize = 0;
            let sessionStorageTotalSize = 0;
            
            const cookieDetails = [];
            const localStorageDetails = [];
            const sessionStorageDetails = [];

            // Traitement des cookies
            cookies.forEach(cookie => {
            const trimmedCookie = cookie.trim();
            const [name, ...valueParts] = trimmedCookie.split('=');
            const value = valueParts.join('=');
            const size = new Blob([trimmedCookie]).size;
            
            cookiesTotalSize += size;
            cookieDetails.push({
            name: name?.trim() || 'Inconnu',
            value: value || '',
            size: size,
            length: trimmedCookie.length
            });
            });

            // Traitement du localStorage
            Object.entries(localStorageData).forEach(([key, value]) => {
            const size = new Blob([key + value]).size;
            localStorageTotalSize += size;
            localStorageDetails.push({
            name: key,
            value: value,
            size: size,
            length: (key + value).length
            });
            });

            // Traitement du sessionStorage
            Object.entries(sessionStorageData).forEach(([key, value]) => {
            const size = new Blob([key + value]).size;
            sessionStorageTotalSize += size;
            sessionStorageDetails.push({
            name: key,
            value: value,
            size: size,
            length: (key + value).length
            });
            });

            const totalSize = cookiesTotalSize + localStorageTotalSize + sessionStorageTotalSize;

            // Options spécifiques
            if (options.count) {
            this.addOutput(`${cookieCount} cookies, ${localStorageCount} localStorage, ${sessionStorageCount} sessionStorage`);
            this.addOutput(`Total: ${totalDataCount} éléments stockés`);
            return;
            }

            if (options.size) {
            this.addOutput(`Cookies: ${this.formatBytes(cookiesTotalSize)}`);
            this.addOutput(`localStorage: ${this.formatBytes(localStorageTotalSize)}`);
            this.addOutput(`sessionStorage: ${this.formatBytes(sessionStorageTotalSize)}`);
            this.addOutput(`Taille totale: ${this.formatBytes(totalSize)}`);
            return;
            }

            if (options.list) {
            this.addOutput('<span class="font-bold text-blue-400">Liste des données stockées:</span>');
            
            if (cookieCount > 0) {
            this.addOutput('<span class="text-green-400 font-semibold">🍪 Cookies:</span>');
            cookieDetails.forEach((cookie, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-green-400">${cookie.name}</span>`);
            });
            }
            
            if (localStorageCount > 0) {
            this.addOutput('<span class="text-purple-400 font-semibold">💾 localStorage:</span>');
            localStorageDetails.forEach((item, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-purple-400">${item.name}</span>`);
            });
            }
            
            if (sessionStorageCount > 0) {
            this.addOutput('<span class="text-yellow-400 font-semibold">⚡ sessionStorage:</span>');
            sessionStorageDetails.forEach((item, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-yellow-400">${item.name}</span>`);
            });
            }
            
            if (totalDataCount === 0) {
            this.addOutput('<span class="text-gray-400">Aucune donnée trouvée</span>');
            }
            return;
            }

            if (options.delete) {
            this.addOutput('<span class="text-red-400 font-bold">⚠️ ATTENTION ⚠️</span>');
            this.addOutput('<span class="text-yellow-400">Cette action va supprimer TOUTES les données stockées !</span>');
            this.addOutput('<span class="text-red-400">Cela inclut cookies, localStorage et sessionStorage.</span>');
            this.addOutput('<span class="text-red-400">L\'application perdra tous ses paramètres et données.</span>');
            this.addOutput('');
            this.addOutput('Données qui seront supprimées:');
            
            if (cookieCount > 0) {
            this.addOutput('<span class="text-green-400">🍪 Cookies:</span>');
            cookieDetails.forEach(cookie => {
            this.addOutput(`  • <span class="text-gray-300">${cookie.name}</span>`);
            });
            }
            
            if (localStorageCount > 0) {
            this.addOutput('<span class="text-purple-400">💾 localStorage:</span>');
            localStorageDetails.forEach(item => {
            this.addOutput(`  • <span class="text-gray-300">${item.name}</span>`);
            });
            }
            
            if (sessionStorageCount > 0) {
            this.addOutput('<span class="text-yellow-400">⚡ sessionStorage:</span>');
            sessionStorageDetails.forEach(item => {
            this.addOutput(`  • <span class="text-gray-300">${item.name}</span>`);
            });
            }
            
            this.addOutput('');
            this.addOutput('<span class="text-white">Voulez-vous vraiment continuer ? Tapez "cookies --confirm-delete" pour confirmer.</span>');
            return;
            }

            if (args.includes('--confirm-delete')) {
            // Suppression effective de toutes les données
            cookies.forEach(cookie => {
            const name = cookie.trim().split('=')[0];
            document.cookie = `${name}=;path=/;max-age=0`;
            });
            localStorage.clear();
            sessionStorage.clear();
            
            this.addOutput('<span class="text-green-400">✅ Toutes les données ont été supprimées</span>');
            this.addOutput('<span class="text-yellow-400">⚠️ Rechargez la page pour voir les effets complets</span>');
            return;
            }

            // Affichage par défaut ou avec --all
            const headerHTML = `
            <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
            <div class="flex items-center mb-3">
            <span class="text-2xl mr-2">💾</span>
            <span class="font-bold text-blue-400 text-xl">Gestion des données navigateur</span>
            </div>
            <div class="text-gray-300 text-sm">Analyse complète des données stockées (cookies, localStorage, sessionStorage)</div>
            </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Statistiques générales
            const statsHTML = `
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
            <div class="flex items-center mb-3">
            <span class="text-lg mr-2">📊</span>
            <span class="font-bold text-green-400 text-lg">Statistiques globales</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">🍪 Cookies</div>
                <div class="text-2xl font-mono text-green-300">${cookieCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(cookiesTotalSize)}</div>
            </div>
            <div class="bg-purple-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">💾 localStorage</div>
                <div class="text-2xl font-mono text-purple-300">${localStorageCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(localStorageTotalSize)}</div>
            </div>
            <div class="bg-yellow-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">⚡ sessionStorage</div>
                <div class="text-2xl font-mono text-yellow-300">${sessionStorageCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(sessionStorageTotalSize)}</div>
            </div>
            <div class="bg-blue-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">📦 Total</div>
                <div class="text-2xl font-mono text-blue-300">${totalDataCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(totalSize)}</div>
            </div>
            </div>
            </div>
            `;
            this.addOutput(statsHTML, 'system');

            if (totalDataCount === 0) {
            this.addOutput(`
            <div class="mt-3 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <span class="text-yellow-400">ℹ️ Aucune donnée trouvée sur ce site</span>
            </div>
            `, 'system');
            return;
            }

            // Fonction helper pour créer une section déroulante avec les détails
            const createDropdownSection = (title, icon, data, color, sectionId) => {
            if (data.length === 0) return '';
            
            const uniqueId = `cookies-dropdown-${sectionId}-${Date.now()}`;
            
            let html = `
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                <div class="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors duration-200 p-2 rounded" onclick="
                    const content = document.getElementById('${uniqueId}');
                    const arrow = document.getElementById('${uniqueId}-arrow');
                    if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    arrow.innerHTML = '▼';
                    } else {
                    content.style.display = 'none';
                    arrow.innerHTML = '▶';
                    }
                ">
                    <div class="flex items-center">
                    <span class="text-lg mr-2">${icon}</span>
                    <span class="font-bold ${color} text-lg">${title} (${data.length})</span>
                    </div>
                    <span id="${uniqueId}-arrow" class="text-gray-400 text-sm transition-transform">▶</span>
                </div>
                
                <div id="${uniqueId}" style="display: none;" class="mt-3 space-y-3">
            `;

            data.forEach((item, index) => {
                // Tronquer la valeur si elle est trop longue
                const displayValue = item.value.length > 100 ? 
                item.value.substring(0, 100) + '...' : 
                item.value;

                // Déterminer le type de données
                let dataType = 'Personnalisé';
                let typeColor = 'text-gray-400';
                
                // Analyse spécifique pour les données de l'application
                if (item.name === 'history') {
                dataType = 'Historique';
                typeColor = 'text-blue-400';
                } else if (item.name === 'filesystem') {
                dataType = 'Système de fichiers';
                typeColor = 'text-green-400';
                } else if (item.name.includes('theme') || item.name.includes('font') || item.name.includes('bg')) {
                dataType = 'Préférences';
                typeColor = 'text-purple-400';
                } else if (item.name === 'pseudo') {
                dataType = 'Utilisateur';
                typeColor = 'text-yellow-400';
                } else if (item.name.toLowerCase().includes('session')) {
                dataType = 'Session';
                typeColor = 'text-blue-400';
                } else if (item.name.toLowerCase().includes('auth') || item.name.toLowerCase().includes('login')) {
                dataType = 'Authentification';
                typeColor = 'text-red-400';
                }

                // Essayer de parser le JSON pour afficher des infos supplémentaires
                let additionalInfo = '';
                try {
                const parsed = JSON.parse(item.value);
                if (Array.isArray(parsed)) {
                    additionalInfo = `<div class="text-xs text-gray-500 mt-1">Array avec ${parsed.length} éléments</div>`;
                } else if (typeof parsed === 'object') {
                    const keys = Object.keys(parsed);
                    additionalInfo = `<div class="text-xs text-gray-500 mt-1">Objet avec ${keys.length} propriétés</div>`;
                }
                } catch (e) {
                // Pas du JSON, pas grave
                }

                html += `
                <div class="bg-gray-700/30 rounded-lg p-3 border-l-4 ${
                    typeColor.includes('blue') ? 'border-blue-500' : 
                    typeColor.includes('green') ? 'border-green-500' :
                    typeColor.includes('purple') ? 'border-purple-500' :
                    typeColor.includes('yellow') ? 'border-yellow-500' :
                    typeColor.includes('red') ? 'border-red-500' : 'border-gray-500'
                }">
                    <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-white text-lg break-all">${item.name}</span>
                    <span class="px-2 py-1 rounded text-xs font-semibold ${typeColor} bg-gray-800 ml-2 flex-shrink-0">${dataType}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Valeur:</span>
                        <span class="text-gray-200 font-mono text-xs max-w-xs truncate">${displayValue || '(vide)'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Taille:</span>
                        <span class="text-gray-200 font-mono">${this.formatBytes(item.size)} (${item.length} caractères)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Pourcentage:</span>
                        <span class="text-gray-200 font-mono">${((item.size / totalSize) * 100).toFixed(1)}%</span>
                    </div>
                    </div>
                    ${additionalInfo}
                </div>
                `;
            });

            html += `
                </div>
                </div>
            `;

            return html;
            };

            // Détails des données si --all ou par défaut
            if (options.all || (!options.count && !options.size && !options.list)) {
            // Afficher les cookies
            if (cookieCount > 0) {
                this.addOutput(createDropdownSection('Cookies', '🍪', cookieDetails, 'text-green-400', 'cookies'), 'system');
            }
            
            // Afficher localStorage
            if (localStorageCount > 0) {
                this.addOutput(createDropdownSection('localStorage', '💾', localStorageDetails, 'text-purple-400', 'localstorage'), 'system');
            }
            
            // Afficher sessionStorage
            if (sessionStorageCount > 0) {
                this.addOutput(createDropdownSection('sessionStorage', '⚡', sessionStorageDetails, 'text-yellow-400', 'sessionstorage'), 'system');
            }
            }

            // Limites et avertissements
            const warningsHTML = `
            <div class="mt-3 p-3 bg-gray-800/30 border border-gray-600 rounded-lg">
            <div class="text-xs text-gray-400 space-y-1">
            <div><span class="text-yellow-300">•</span> Limites cookies: ~4KB par cookie, ~4MB total par domaine</div>
            <div><span class="text-purple-300">•</span> Limites localStorage: ~5-10MB selon le navigateur</div>
            <div><span class="text-blue-300">•</span> Utilisation actuelle: ${this.formatBytes(totalSize)} / ~10MB (${((totalSize / (10 * 1024 * 1024)) * 100).toFixed(2)}%)</div>
            <div><span class="text-green-300">•</span> Utilisez "cookies -d" pour supprimer toutes les données</div>
            <div><span class="text-red-300">•</span> sessionStorage est supprimé à la fermeture de l'onglet</div>
            </div>
            </div>
            `;
            this.addOutput(warningsHTML, 'system');
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
            // Enhanced option parsing for tree command
            const parseTreeOptions = (args) => {
            const result = { _: [] };
            let i = 0;

            while (i < args.length) {
                const arg = args[i];

                if (arg === '-a') {
                result.all = true;
                } else if (arg === '-d') {
                result['dirs-only'] = true;
                } else if (arg === '-f') {
                result['full-path'] = true;
                } else if (arg === '-i') {
                result['no-indent'] = true;
                } else if (arg === '-C') {
                result.colorize = true;
                } else if (arg === '-s') {
                result.size = true;
                } else if (arg === '-h') {
                result['human-readable'] = true;
                } else if (arg === '-D') {
                result['date-modified'] = true;
                } else if (arg === '-F') {
                result.classify = true;
                } else if (arg === '--help') {
                result.help = true;
                } else if (arg === '-L' && i + 1 < args.length) {
                result.level = parseInt(args[i + 1]);
                i++; // Skip next argument as it's the level value
                } else if (arg === '-P' && i + 1 < args.length) {
                result.pattern = args[i + 1];
                i++; // Skip next argument as it's the pattern
                } else if (!arg.startsWith('-')) {
                result._.push(arg);
                }
                i++;
            }

            return result;
            };

            const options = parseTreeOptions(args);

            // Help option
            if (options.help) {
            this.addOutput('<span class="font-bold text-blue-400">tree - afficher l\'arborescence des répertoires</span>');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">UTILISATION:</span>');
            this.addOutput('    tree [OPTION]... [RÉPERTOIRE]...');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">DESCRIPTION:</span>');
            this.addOutput('    Affiche l\'arborescence des répertoires sous forme d\'arbre visuel.');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">OPTIONS:</span>');
            this.addOutput('    -a             affiche tous les fichiers (y compris cachés)');
            this.addOutput('    -d             affiche seulement les répertoires');
            this.addOutput('    -f             affiche le chemin complet pour chaque fichier');
            this.addOutput('    -i             désactive l\'indentation, affiche une liste plate');
            this.addOutput('    -C             colorise la sortie (activé par défaut)');
            this.addOutput('    -s             affiche la taille des fichiers');
            this.addOutput('    -h             format lisible pour les tailles (avec -s)');
            this.addOutput('    -D             affiche la date de modification');
            this.addOutput('    -F             ajoute des indicateurs de type de fichier');
            this.addOutput('    -L <niveau>    limite la profondeur d\'affichage');
            this.addOutput('    -P <motif>     liste seulement les fichiers correspondant au motif');
            this.addOutput('    --help         affiche cette aide et quitte');
            this.addOutput('');
            this.addOutput('<span class="text-green-400">EXEMPLES:</span>');
            this.addOutput('    tree           affiche l\'arborescence du répertoire courant');
            this.addOutput('    tree -a        affiche tous les fichiers y compris cachés');
            this.addOutput('    tree -d -L 2   affiche seulement les répertoires sur 2 niveaux');
            this.addOutput('    tree -s -h     affiche avec les tailles en format lisible');
            return;
            }

            const maxLevel = options.level || 20;
            const targetPath = options._[0] || '.';
            const resolvedPath = this.resolvePath(targetPath);
            const targetNode = this.getPath(resolvedPath);

            if (!targetNode) {
            this.addOutput(`tree: ${targetPath}: Aucun fichier ou dossier de ce type`, 'error');
            return;
            }

            if (targetNode.type !== 'directory') {
            this.addOutput(`tree: ${targetPath}: N'est pas un répertoire`, 'error');
            return;
            }

            let dirCount = 0;
            let fileCount = 0;
            const treeLines = [];

            // Helper function to get file info
            const getFileInfo = (node, name, currentPath) => {
            let info = '';
            let size = 0;

            if (node.type === 'file') {
                size = new Blob([node.content || '']).size;
                fileCount++;
                
                if (options.size) {
                const sizeStr = options['human-readable'] ? 
                    this.formatBytes(size) : 
                    size.toString();
                info += ` <span class="text-gray-400">[${sizeStr}]</span>`;
                }
            } else if (node.type === 'directory') {
                dirCount++;
            }

            if (options['date-modified']) {
                // Simulate last modified date
                const now = new Date();
                const modDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
                info += ` <span class="text-yellow-400">${modDate.toLocaleDateString()}</span>`;
            }

            return { info, size };
            };

            // Helper function to format name with colors and classifiers
            const formatName = (name, node, currentPath) => {
            let displayName = name;
            let color = 'text-white';

            if (node.type === 'directory') {
                color = 'text-blue-400';
                if (options.classify) displayName += '/';
            } else if (node.type === 'file') {
                // Color based on file extension
                const ext = name.split('.').pop().toLowerCase();
                switch (ext) {
                case 'txt':
                case 'md':
                case 'readme':
                    color = 'text-gray-300';
                    break;
                case 'js':
                case 'json':
                case 'html':
                case 'css':
                    color = 'text-green-400';
                    if (options.classify) displayName += '*';
                    break;
                case 'exe':
                case 'bin':
                    color = 'text-red-400';
                    if (options.classify) displayName += '*';
                    break;
                case 'zip':
                case 'tar':
                case 'gz':
                    color = 'text-purple-400';
                    break;
                default:
                    color = 'text-gray-300';
                }
            }

            // Apply pattern filter if specified
            if (options.pattern) {
                const regex = new RegExp(options.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
                if (!regex.test(name)) {
                return null; // Skip this file
                }
            }

            const finalPath = options['full-path'] ? currentPath : displayName;
            return `<span class="${color}">${finalPath}</span>`;
            };

            // Enhanced tree building function
            const buildTree = (node, currentPath, prefix = '', level = 0, isLast = true) => {
            if (level >= maxLevel) return;

            if (node.type === 'directory') {
                const children = Object.keys(node.children).sort((a, b) => {
                const aNode = node.children[a];
                const bNode = node.children[b];
                
                // Directories first, then files
                if (aNode.type === 'directory' && bNode.type === 'file') return -1;
                if (aNode.type === 'file' && bNode.type === 'directory') return 1;
                return a.localeCompare(b);
                });

                let filteredChildren = children;

                // Apply filters
                if (!options.all) {
                filteredChildren = filteredChildren.filter(name => !name.startsWith('.'));
                }

                if (options['dirs-only']) {
                filteredChildren = filteredChildren.filter(name => 
                    node.children[name].type === 'directory'
                );
                }

                filteredChildren.forEach((childName, index) => {
                const child = node.children[childName];
                const isLastChild = index === filteredChildren.length - 1;
                const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;

                // Format the tree line
                let line;
                if (options['no-indent']) {
                    line = '';
                } else {
                    const connector = isLastChild ? '└── ' : '├── ';
                    line = prefix + connector;
                }

                const formattedName = formatName(childName, child, childPath);
                if (formattedName === null) return; // Skip if filtered out

                const { info } = getFileInfo(child, childName, childPath);
                
                const fullLine = `<span class="font-mono">${line}${formattedName}${info}</span>`;
                treeLines.push(fullLine);

                // Recurse into subdirectories
                if (child.type === 'directory' && level < maxLevel - 1) {
                    const nextPrefix = options['no-indent'] ? '' : 
                    prefix + (isLastChild ? '    ' : '│   ');
                    buildTree(child, childPath, nextPrefix, level + 1, isLastChild);
                }
                });
            }
            };

            // Build and display the tree
            buildTree(targetNode, resolvedPath);
            
            if (treeLines.length === 0) {
            this.addOutput('<span class="text-gray-400 italic">Répertoire vide ou aucun fichier correspondant au filtre</span>');
            } else {
            treeLines.forEach(line => this.addOutput(line));
            }

            // Enhanced statistics with styling
            const statsHTML = `
            <div class="border border-gray-600 rounded-lg p-3 bg-gray-800/30 mt-3">
                <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                    <span class="text-blue-400 mr-1">📁</span>
                    <span class="text-blue-300 font-medium">${dirCount} répertoire${dirCount > 1 ? 's' : ''}</span>
                    </div>
                    <div class="flex items-center">
                    <span class="text-gray-400 mr-1">📄</span>
                    <span class="text-gray-300 font-medium">${fileCount} fichier${fileCount > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${maxLevel < 20 ? `Limité à ${maxLevel} niveau${maxLevel > 1 ? 'x' : ''}` : 'Profondeur complète'}
                </div>
                </div>
                ${options.pattern ? `<div class="text-xs text-yellow-400 mt-2">Filtré par motif: "${options.pattern}"</div>` : ''}
            </div>
            `;
            this.addOutput(statsHTML, 'system');
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
                this.addOutput(now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));
            }
        },

        sudo(args) {
            this.enDev("sudo")
            this.addOutput('sudo: Cette commande est en développement et n\'est pas encore implémentée complètement.', 'error');
        },
        man: function (args) {
            const command = args && args[0] ? args[0].toLowerCase() : '';

            if (!command) {
                // Affiche la liste des manuels disponibles
                this.addOutput(`<div class="text-blue-300 font-bold mb-2">MANUELS DISPONIBLES</div>`);
                this.addOutput(`<div class="text-gray-300 mb-2">Utilisez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ">man [commande]</span>' pour afficher le manuel d'une commande spécifique.</div>`);
                this.addOutput(`<div class="text-yellow-300 mb-2">Commandes disponibles :</div>`);

                const commands = Object.keys(COMMAND_METADATA).sort();
                let output = '<div class="grid grid-cols-4 gap-4 text-sm">';

                for (let i = 0; i < commands.length; i++) {
                    output += `<div class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ${commands[i]}">${commands[i]}</div>`;
                }
                output += '</div>';

                this.addOutput(output);
                this.setupClickableCommands();
                return;
            }

            const metadata = COMMAND_METADATA[command];
            if (!metadata) {
                this.addOutput(`<div class="text-red-400">man: aucune entrée de manuel pour ${command}</div>`);
                this.addOutput(`<div class="text-gray-300">Essayez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man">man</span>' pour voir toutes les commandes disponibles.</div>`);
                this.setupClickableCommands();
                return;
            }

            // Affiche le manuel de la commande
            let output = `
                <div class="man-page">
                    <div class="text-blue-300 font-bold text-lg mb-2">${command.toUpperCase()}(1)</div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">NOM</div>
                        <div class="ml-4 text-gray-300">${command} - ${metadata.description}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">SYNOPSIS</div>
                        <div class="ml-4 text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command" data-command="${metadata.synopsis.split('[')[0].trim()}">${metadata.synopsis}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">DESCRIPTION</div>
                        <div class="ml-4 text-gray-300">${metadata.description}</div>
                    </div>
            `;

            if (metadata.options && metadata.options.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">OPTIONS</div>
                        <div class="ml-4">
                `;

                metadata.options.forEach(option => {
                    output += `<div class="text-gray-300 mb-1">${option}</div>`;
                });

                output += `
                        </div>
                    </div>
                `;
            }

            if (metadata.examples && metadata.examples.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">EXEMPLES</div>
                        <div class="ml-4">
                `;

                metadata.examples.forEach(example => {
                    output += `<div class="text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command mb-1" data-command="${example}">${example}</div>`;
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

        listCommands: function() {
            this.addOutput('<span class="font-bold text-blue-400 text-lg">Liste complète des commandes :</span>');
            
            const grouped = commandHelpers.groupCommandsByCategory();
            let totalCommands = 0;
            
            Object.entries(grouped).forEach(([category, commands]) => {
                const icon = commandHelpers.getCategoryIcon(category);
                
                this.addOutput(`\n<span class="text-yellow-300 font-semibold">${icon} ${category} (${commands.length} commandes)</span>`);
                
                commands.sort().forEach(cmdName => {
                    const metadata = COMMAND_METADATA[cmdName];
                    if (metadata) {
                        this.addOutput(`  <span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="${cmdName} ">${cmdName}</span> - ${metadata.description}`);
                        totalCommands++;
                    }
                });
            });
            
            this.addOutput(`\n<span class="text-purple-400">Total : ${totalCommands} commandes disponibles</span>`);
            this.addOutput(`<span class="text-gray-400">Utilisez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ">man [commande]</span>' pour plus d'informations sur une commande spécifique.</span>`);
            
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
            this.addOutput(`PING ${address}:`);

            // Fonction pour mesurer la latence avec fetch
            const measureLatency = async (url) => {
                const start = performance.now();
                try {
                    const response = await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                    const end = performance.now();
                    return end - start;
                } catch (error) {
                    throw error;
                }
            };

            // Effectuer 4 pings réels
            let pingCount = 0;
            const results = [];
            
            const performPing = async () => {
                pingCount++;
                try {
                    // Essayer différents protocoles/formats d'URL
                    let testUrl = address;
                    if (!address.startsWith('http://') && !address.startsWith('https://')) {
                        testUrl = `https://${address}`;
                    }
                    
                    const latency = await measureLatency(testUrl);
                    results.push(latency);
                    this.addOutput(`64 bytes from ${address}: seq=${pingCount} time=${latency.toFixed(1)}ms`);
                } catch (error) {
                    this.addOutput(`ping: ${address}: Host inaccessible ou erreur réseau`, 'error');
                    results.push(null);
                }

                if (pingCount < 4) {
                    setTimeout(performPing, 1000);
                } else {
                    // Afficher les statistiques
                    const successfulPings = results.filter(r => r !== null);
                    const packetLoss = ((4 - successfulPings.length) / 4 * 100).toFixed(0);
                    
                    this.addOutput(`\n--- ${address} statistiques ping ---`);
                    this.addOutput(`4 paquets transmis, ${successfulPings.length} reçus, ${packetLoss}% perte de paquets`);
                    
                    if (successfulPings.length > 0) {
                        const min = Math.min(...successfulPings).toFixed(1);
                        const max = Math.max(...successfulPings).toFixed(1);
                        const avg = (successfulPings.reduce((a, b) => a + b, 0) / successfulPings.length).toFixed(1);
                        this.addOutput(`round-trip min/avg/max = ${min}/${avg}/${max} ms`);
                    }
                }
            };

            performPing();
        },

        wget(args) {
            this.enDev("wget");
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
    setupClickableCommands() {
        // Remove existing listeners to avoid duplicates
        document.querySelectorAll('.clickable-command').forEach(el => {
            el.replaceWith(el.cloneNode(true));
        });

        // Add new listeners
        document.querySelectorAll('.clickable-command').forEach(command => {
            command.addEventListener('click', (e) => {
                e.preventDefault();
                const commandText = command.getAttribute('data-command');
                if (commandText) {
                    this.commandInputElement.value = commandText;
                    this.commandInputElement.focus();
                    // Place cursor at end
                    this.commandInputElement.setSelectionRange(commandText.length, commandText.length);
                }
            });
        });
    },

    showChangelog(versionData) {
        const changelogContainer = document.getElementById('changelog-container');
        if (!changelogContainer || !versionData.changelog) return;

        let changelogHTML = '<div class="text-sm text-gray-300 space-y-2">';
        
        Object.entries(versionData.changelog).forEach(([version, changes]) => {
            changelogHTML += `
                <div class="border-l-2 border-blue-500 pl-3 mb-3">
                    <h4 class="font-semibold text-blue-400">${version}</h4>
                    <ul class="list-disc list-inside text-xs space-y-1 mt-1">
            `;
            
            changes.forEach(change => {
                changelogHTML += `<li>${change}</li>`;
            });
            
            changelogHTML += '</ul></div>';
        });
        
        changelogHTML += '</div>';
        changelogContainer.innerHTML = changelogHTML;
    },

    setupClickableConsole() {
        const consoleOutput = document.getElementById('console-output');
        if (!consoleOutput) return;

        // Ajouter un gestionnaire de clic pour copier le texte
        consoleOutput.addEventListener('click', (e) => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                if (selectedText) {
                    navigator.clipboard.writeText(selectedText).then(() => {
                        this.addOutput(`Texte copié: ${selectedText}`, 'system');
                    }).catch(err => {
                        this.addOutput(`Erreur de copie: ${err}`, 'error');
                    });
                }
            }
        });
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