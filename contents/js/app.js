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

    // --- State ---
    currentDir: '/home/user',
    fileSystem: {
        '/': {
            type: 'directory',
            children: {
                'bin': {
                    type: 'directory',
                    children: {
                        'echo': { type: 'file', content: 'A command to display text.' },
                        'ls': { type: 'file', content: 'A command to list directory contents.' },
                        'cd': { type: 'file', content: 'A command to change the current directory.' },
                        'pwd': { type: 'file', content: 'A command to print the current working directory.' },
                        'clear': { type: 'file', content: 'A command to clear the console.' },
                        'help': { type: 'file', content: 'A command to display help information.' },
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
                        'motd': { type: 'file', content: 'Message du jour: Amusez-vous bien!' }
                    }
                }
            }
        }
    },
    history: [],
    historyIndex: -1,
    isLoadingLLM: false,
    currentOpenMenu: null, // 'file', 'tools', 'help', or null
    awaitingPseudo: false,
    defaultMessage: "Console initialisée. Tapez \"help\" pour une liste de commandes.",

    // --- Initialization ---
    init() {
        this.loadHistoryFromCookie();
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

    },

    // --- Output Management ---
    addOutput(line, type = 'normal') {
        const lineDiv = document.createElement('div');
        // Sanitize HTML to prevent XSS, but allow specific tags for styling (like span for colors)
        // For simplicity, we're using innerHTML. In a production app, a more robust sanitizer is recommended.
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
            this.addOutput(`<span class="text-green-400">user@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ `, 'command');
            this.commandInputElement.value = '';
            this.historyIndex = -1;
            return;
        }

        this.addOutput(`<span class="text-green-400">user@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${commandText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, 'command');

        // Ajout à l'historique avec date/heure
        const now = new Date();
        const entry = {
            cmd: commandText,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            timestamp: now.getTime()
        };
        this.history = [...this.history, entry].slice(-50);
        this.saveHistoryToCookie();
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
            this.addOutput('<span class="font-bold text-purple-300">Commandes disponibles :</span>');
            // Section: Navigation
            this.addOutput('<span class="underline text-blue-300">Navigation :</span>');
            this.addOutput('  pwd                   - Affiche le dossier courant.');
            this.addOutput('  cd <span class="bg-gray-700 text-gray-300 px-1 rounded">[dossier]</span>          - Change le dossier courant.');
            this.addOutput('  ls <span class="bg-gray-700 text-gray-300 px-1 rounded">[dossier]</span>          - Liste le contenu du dossier.');
            this.addOutput('<hr class="my-1 border-gray-600">');

            // Section: Fichiers & Dossiers
            this.addOutput('<span class="underline text-blue-300">Gestion de fichiers & dossiers :</span>');
            this.addOutput('  cat <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;fichier&gt;</span>         - Affiche le contenu d\'un fichier.');
            this.addOutput('  mkdir <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;dossier&gt;</span>       - Crée un dossier ' +
            '<span class="px-2 py-1 rounded bg-yellow-700 text-yellow-200 font-semibold inline-block">(en développement)</span>.');
            this.addOutput('  touch <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;fichier&gt;</span>       - Crée un fichier ' +
            '<span class="px-2 py-1 rounded bg-yellow-700 text-yellow-200 font-semibold inline-block">(en développement)</span>.');
            this.addOutput('  rm <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;fichier/dossier&gt;</span> - Supprime un fichier/dossier ' +
            '<span class="px-2 py-1 rounded bg-yellow-700 text-yellow-200 font-semibold inline-block">(en développement)</span>.');
            this.addOutput('<hr class="my-1 border-gray-600">');

            // Section: Utilitaires
            this.addOutput('<span class="underline text-blue-300">Utilitaires :</span>');
            this.addOutput('  echo <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;texte&gt;</span>          - Affiche le texte donné.');
            this.addOutput('  clear                 - Efface la console.');
            this.addOutput('  help                  - Affiche cette aide.');
            this.addOutput('  about                 - Affiche des informations sur cette console.');
            this.addOutput('  cconnect <span class="bg-gray-700 text-gray-300 px-1 rounded">&lt;username&gt;</span>   - Change de pseudo utilisateur.');
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
            this.addOutput(`Dossier '${dirName}' créé.`);
        },
        rm(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('rm: manque un nom de fichier ou dossier', 'error');
            return;
            }
            const targetName = args[0].trim();
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
        }
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
            // Re-add current input line below suggestions for better UX
            this.addOutput(`<span class="text-green-400">user@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${currentCommandValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`, 'command');

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
        // On ne garde que les 50 dernières commandes
        const toSave = this.history.slice(-50);
        document.cookie = `history=${encodeURIComponent(JSON.stringify(toSave))};path=/;max-age=31536000`;
    },
    loadHistoryFromCookie() {
        const match = document.cookie.match(/(?:^|;\s*)history=([^;]*)/);
        if (match) {
            try {
                this.history = JSON.parse(decodeURIComponent(match[1]));
            } catch {
                this.history = [];
            }
        } else {
            this.history = [];
        }
    },
};

// --- Initialize the App ---
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});