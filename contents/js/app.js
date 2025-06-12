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
    clearHistoryBtn: document.getElementById('clear-history-button'),

    // --- État ---
    currentDir: '/home/user',
    fileSystem: {'/':{type:'directory',children:{'bin':{type:'directory',children:{}},'home':{type:'directory',children:{'user':{type:'directory',children:{'welcome.txt':{type:'file',content:'Bienvenue sur votre console Linux web!'},'notes.txt':{type:'file',content:'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.'}}}}},'etc':{type:'directory',children:{'motd':{type:'file',get content(){const mots=["Message du jour : Amusez-vous bien !","Message du jour : Apprenez quelque chose de nouveau aujourd'hui.","Message du jour : La persévérance paie toujours.","Message du jour : Codez avec passion.","Message du jour : Prenez une pause et respirez.","Message du jour : La curiosité est une qualité.","Message du jour : Essayez une nouvelle commande.","Message du jour : Partagez vos connaissances.","Message du jour : La simplicité est la sophistication suprême.","Message du jour : Un bug aujourd'hui, une solution demain.","Message du jour : La créativité commence par une idée.","Message du jour : Osez sortir de votre zone de confort.","Message du jour : La collaboration fait la force.","Message du jour : Chaque jour est une nouvelle opportunité.","Message du jour : L'échec est le début du succès.","Message du jour : Prenez soin de vous.","Message du jour : La patience est une vertu.","Message du jour : Faites de votre mieux.","Message du jour : Le partage, c'est la vie."];const now=new Date();const start=new Date(now.getFullYear(),0,0);const diff=now-start;const oneDay=1000*60*60*24;const dayOfYear=Math.floor(diff/oneDay);return mots[dayOfYear%mots.length];}}}}}}},
    history: [],
    historyIndex: -1,
    isLoadingLLM: false,

    // --- Tabs ---
    tabs: [],
    tabsContainer: null,
    newTabButton: null,
    activeTabId: null,
    nextTabId: 1,
    compactTabs: false,

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
        
        // Event Listeners for command input - vérification de sécurité
        if (this.commandFormElement) {
            this.commandFormElement.addEventListener('submit', this.handleCommandSubmit.bind(this));
        }
        if (this.commandInputElement) {
            this.commandInputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        // Event Listeners for Menus - vérification de sécurité
        if (this.fileMenuButton) {
            this.fileMenuButton.addEventListener('click', () => this.toggleMenu('file'));
        }
        if (this.toolsMenuButton) {
            this.toolsMenuButton.addEventListener('click', () => this.toggleMenu('tools'));
        }
        if (this.helpMenuButton) {
            this.helpMenuButton.addEventListener('click', () => this.toggleMenu('help'));
        }
        document.addEventListener('mousedown', this.handleClickOutsideMenu.bind(this));

        // Event Listeners for Modal - vérification de sécurité
        if (this.openImportModalButton) {
            this.openImportModalButton.addEventListener('click', this.openCodeImportModal.bind(this));
        }
        if (this.cancelImportButton) {
            this.cancelImportButton.addEventListener('click', this.closeCodeImportModal.bind(this));
        }
        if (this.confirmImportButton) {
            this.confirmImportButton.addEventListener('click', this.handleCodeImport.bind(this));
        }
        if (this.closeAboutModalButton) {
            this.closeAboutModalButton.addEventListener('click', this.closeAboutModal.bind(this));
        }

        // Event Listeners for History Modal - vérification de sécurité
        if (this.showHistoryButton) {
            this.showHistoryButton.addEventListener('click', this.openHistoryModal.bind(this));
        }
        if (this.closeHistoryModalButton) {
            this.closeHistoryModalButton.addEventListener('click', this.closeHistoryModal.bind(this));
        }

        // Drag and Drop - vérification de sécurité
        if (this.appContainer) {
            this.appContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            this.appContainer.addEventListener('drop', this.handleDrop.bind(this));
        }

        // Tab Management
        this.tabsContainer = document.getElementById('tabs-container');
        this.newTabButton = document.getElementById('new-tab-button');

        // Charger les onglets depuis les cookies
        this.loadTabsFromCookie();

        this.initFileSystem();

        if (this.newTabButton) {
            this.newTabButton.addEventListener('click', this.createNewTab.bind(this));
        }

        const toggleTabsSizeButton = document.getElementById('toggle-tabs-size-button');
        if (toggleTabsSizeButton) {
            toggleTabsSizeButton.addEventListener('click', this.toggleTabsSize.bind(this));
        }

        this.updatePrompt();
        if (this.commandInputElement) {
            this.commandInputElement.focus();
        }

        // Gestion de la taille de police (avec vérification)
        const fontSizeRange = document.getElementById('font-size-range');
        const fontSizeValue = document.getElementById('font-size-value');
        const consoleOutput = document.getElementById('console-output');
        
        if (fontSizeRange && fontSizeValue && consoleOutput) {
            fontSizeRange.addEventListener('input', function () {
                fontSizeValue.textContent = this.value + 'px';
                consoleOutput.style.fontSize = this.value + 'px';
            });
        }

        // Gestion du modal paramètres
        const cancelSettingsModal = document.getElementById('cancel-settings-modal');
        const saveSettingsModal = document.getElementById('save-settings-modal');
        
        if (cancelSettingsModal) {
            cancelSettingsModal.onclick = function () {
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('hidden');
                }
            };
        }

        if (saveSettingsModal) {
            saveSettingsModal.onclick = function () {
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('hidden');
                }
                // Ajoute ici la logique de sauvegarde des paramètres si besoin
            };
        }

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
                    const lastColor = localStorage.getItem('console_bg_last_color') || '#1f2937';
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
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => {
                this.history = [];
                this.saveHistoryToCookie();
                
                if (this.historyModal && !this.historyModal.classList.contains('hidden')) {
                    this.showHistory();
                }
                
                this.addOutput('<span class="text-green-400">✅ Historique des commandes effacé</span>', 'system');
                const history_empty = document.getElementById('history-empty');
                if (history_empty) {
                    history_empty.classList.remove('hidden');
                }
            });
        }

        // Charger les informations de version
        this.loadVersionInfo();
        this.populateBinDirectory();
        this.updateWindowTitle();

        // Initialiser la gestion de l'écran pour mobile
        this.updatePromptDisplay();
        window.addEventListener('resize', this.updatePromptDisplay.bind(this));

        // Initialiser les gestionnaires de plein écran
        this.initFullscreenHandlers();
    },

    saveTabsToCookie() {
        const tabsData = {
            tabs: this.tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                currentDir: tab.currentDir,
                outputHistory: tab.outputHistory || [],
                isActive: tab.isActive,
                history: tab.history || [], // CORRIGER : Sauvegarder l'historique
                historyIndex: tab.historyIndex || -1, // AJOUTER : Sauvegarder l'index
                commandCount: tab.commandCount || 0
            })),
            activeTabId: this.activeTabId,
            nextTabId: this.nextTabId
        };
        
        try {
            const jsonString = JSON.stringify(tabsData);
            localStorage.setItem('console_tabs', jsonString);
            
            const essentialData = {
                activeTabId: this.activeTabId,
                nextTabId: this.nextTabId,
                tabCount: this.tabs.length
            };
            document.cookie = `console_tabs_backup=${encodeURIComponent(JSON.stringify(essentialData))};path=/;max-age=31536000`;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des onglets:', error);
            this.addOutput('❌ Erreur de sauvegarde des onglets', 'error');
        }
    },

    loadTabsFromCookie() {
        try {
            const savedData = localStorage.getItem('console_tabs');
            if (savedData) {
                const tabsData = JSON.parse(savedData);
                
                if (tabsData.tabs && Array.isArray(tabsData.tabs) && tabsData.tabs.length > 0) {
                    this.tabs = tabsData.tabs.map(tab => ({
                        id: tab.id || this.nextTabId++,
                        title: tab.title || `Terminal ${tab.id}`,
                        currentDir: tab.currentDir || '/home/user',
                        outputHistory: tab.outputHistory || [],
                        isActive: false, // Sera défini après
                        history: tab.history || [], // CORRIGER : S'assurer que l'historique est chargé
                        historyIndex: tab.historyIndex || -1, // AJOUTER : Charger l'index d'historique
                        commandCount: tab.commandCount || 0
                    }));
                    
                    this.nextTabId = tabsData.nextTabId || this.tabs.length + 1;
                    this.activeTabId = tabsData.activeTabId || this.tabs[0]?.id || null;
                    
                    // Mettre à jour l'état actif
                    this.tabs.forEach(tab => {
                        tab.isActive = tab.id === this.activeTabId;
                    });
                    
                    this.renderTabs();
                    this.loadTabState(this.activeTabId);
                    return;
                }
            }
            
            // Fallback vers les cookies si localStorage échoue
            const cookieMatch = document.cookie.match(/(?:^|;\s*)console_tabs_backup=([^;]*)/);
            if (cookieMatch) {
                const backupData = JSON.parse(decodeURIComponent(cookieMatch[1]));
                if (backupData.tabCount > 0) {
                    this.nextTabId = backupData.nextTabId || 2;
                    for (let i = 1; i <= backupData.tabCount; i++) {
                        this.tabs.push({
                            id: i,
                            title: `Terminal ${i}`,
                            currentDir: '/home/user',
                            outputHistory: [],
                            isActive: i === backupData.activeTabId,
                            history: [], // AJOUTER : Initialiser l'historique vide
                            historyIndex: -1, // AJOUTER : Initialiser l'index
                            commandCount: 0
                        });
                    }
                    this.activeTabId = backupData.activeTabId || 1;
                    this.renderTabs();
                    
                    // AJOUTER : Charger l'historique global si pas d'onglets sauvegardés
                    this.loadHistoryFromCookie();
                    
                    this.addOutput(this.defaultMessage, 'system');
                    return;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des onglets:', error);
        }
        
        // Si aucune sauvegarde trouvée, créer le premier onglet
        this.createFirstTab();
    },

    createFirstTab() {
        // AJOUTER : Charger l'historique global existant
        this.loadHistoryFromCookie();
        
        const firstTab = {
            id: this.nextTabId++,
            title: 'Terminal 1',
            currentDir: '/home/user',
            outputHistory: [],
            isActive: true,
            history: [...this.history], // CORRIGER : Utiliser l'historique global
            historyIndex: this.historyIndex || -1, // AJOUTER : Utiliser l'index actuel
            commandCount: 0
        };
        
        this.tabs.push(firstTab);
        this.activeTabId = firstTab.id;
        this.renderTabs();
        this.saveTabsToCookie();
        
        // Ajouter le message de bienvenue seulement pour le premier onglet
        this.addOutput(this.defaultMessage, 'system');
    },

    createNewTab() {
        const newTab = {
            id: this.nextTabId++,
            title: `Terminal ${this.nextTabId - 1}`,
            currentDir: '/home/user',
            outputHistory: [],
            isActive: false,
            history: [],
            commandCount: 0  // AJOUTER cette ligne
        };
        
        // Sauvegarder l'état actuel avant de créer le nouvel onglet
        this.saveCurrentTabState();
        
        this.tabs.push(newTab);
        this.switchToTab(newTab.id);
        this.renderTabs();
        
        // Sauvegarder immédiatement
        this.saveTabsToCookie();
    },

    saveCurrentTabState() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        // CORRIGER : Sauvegarder le répertoire courant
        activeTab.currentDir = this.currentDir;
        
        // CORRIGER : Sauvegarder l'historique et l'index de l'onglet actuel
        activeTab.history = [...this.history];
        activeTab.historyIndex = this.historyIndex;
        
        // Sauvegarder l'output de manière plus efficace en excluant les animations de chargement
        const outputElements = Array.from(this.outputElement.children)
            .filter(child => 
                child.id !== 'loading-llm-indicator' && 
                child.id !== 'console-end-ref' &&
                !child.classList.contains('loading-animation') // Exclure les animations de chargement
            );
        
        // Limiter à 100 éléments pour éviter les problèmes de taille
        const limitedElements = outputElements.slice(-100);
        
        activeTab.outputHistory = limitedElements.map(child => ({
            html: child.innerHTML,
            className: child.className || ''
        }));

        // Remettre les éléments système si nécessaire
        if (this.loadingLLMIndicator && !this.outputElement.contains(this.loadingLLMIndicator)) {
            this.outputElement.appendChild(this.loadingLLMIndicator);
        }

        if (this.consoleEndRefElement && !this.outputElement.contains(this.consoleEndRefElement)) {
            this.outputElement.appendChild(this.consoleEndRefElement);
        }

        // Sauvegarder immédiatement
        this.saveTabsToCookie();
        
        // Re-rendre les onglets pour s'assurer que les compteurs sont à jour
        this.renderTabs();
    },

    loadTabState(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        // CORRIGER : Charger le répertoire courant
        this.currentDir = tab.currentDir || '/home/user';
        
        // CORRIGER : Charger l'historique de l'onglet OU l'historique global
        if (tab.history && tab.history.length > 0) {
            // Si l'onglet a son propre historique, l'utiliser
            this.history = [...tab.history];
            this.historyIndex = tab.historyIndex || -1;
        } else {
            // Sinon, charger l'historique global
            this.loadHistoryFromCookie();
            this.historyIndex = -1;
        }

        this.clearConsoleKeepIndicators();
        
        if (tab.outputHistory && tab.outputHistory.length > 0) {
            tab.outputHistory.forEach(item => {
                const div = document.createElement('div');
                div.innerHTML = item.html;
                if (item.className) {
                    div.className = item.className;
                }
                this.outputElement.insertBefore(div, this.consoleEndRefElement);
            });
        } else {
            // Si pas d'historique, afficher le message par défaut
            this.addOutput(this.defaultMessage, 'system');
        }

        this.updatePrompt();
        this.scrollToBottom();
    },

    clearConsoleKeepIndicators() {
        const toKeep = [this.loadingLLMIndicator, this.consoleEndRefElement];
        Array.from(this.outputElement.childNodes).forEach(child => {
            if (!toKeep.includes(child)) {
                this.outputElement.removeChild(child);
            }
        });
    },

    renameTab(tabId, newTitle) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = newTitle;
            this.renderTabs();
            this.saveTabsToCookie();
        }
    },

    renderTabs() {
        if (!this.tabsContainer) return;

        this.tabsContainer.innerHTML = '';

        this.tabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = `group relative flex items-center px-3 py-2 cursor-pointer transition-all duration-150 ease-out
                ${tab.isActive 
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-white border-t-2 border-blue-400 shadow-xl shadow-blue-400/10' 
                    : 'bg-gradient-to-b from-gray-900/80 to-gray-950/60 text-gray-400 hover:bg-gradient-to-b hover:from-gray-800/90 hover:to-gray-900/70 hover:text-gray-200 hover:shadow-lg'
                } border-r border-gray-700/30 backdrop-blur-sm rounded-lg relative overflow-hidden`;

            // Indicateur d'activité animé à gauche
            const activityIndicator = tab.isActive 
                ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-r-full shadow-lg shadow-blue-400/50 animate-pulse"></div>'
                : '';

            // Badge de notification pour les nouvelles activités
            const hasNewActivity = (tab.commandCount && tab.commandCount > 0 && !tab.isActive) || (tab.outputHistory && tab.outputHistory.length > 0 && !tab.isActive);
            const notificationBadge = hasNewActivity
                ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce shadow-lg"></div>'
                : '';

            tabElement.innerHTML = `
                ${activityIndicator}
                ${notificationBadge}
                
                <div class="flex items-center min-w-0 flex-1 relative">
                    <!-- Icône du terminal avec animation -->
                    <div class="flex-shrink-0 mr-3 p-1.5 rounded-lg transition-all duration-150 ${
                        tab.isActive 
                            ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400 shadow-inner shadow-blue-400/20' 
                            : 'bg-gradient-to-br from-gray-700/40 to-gray-800/30 text-gray-500 group-hover:bg-gradient-to-br group-hover:from-gray-600/50 group-hover:to-gray-700/40 group-hover:text-gray-400'
                    }">
                        <svg class="w-4 h-4 transition-transform duration-150 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l3 3-3 3m5 0h3"/>
                        </svg>
                    </div>
                    
                    <!-- Titre de l'onglet avec effet de typing -->
                    <span class="truncate text-sm font-semibold select-none pointer-events-none flex-1 min-w-0 relative ${
                        tab.isActive ? 'text-white' : 'text-gray-300'
                    }" title="${tab.title}">
                        ${tab.title}
                        <!-- Curseur clignotant pour l'onglet actif -->
                        ${tab.isActive ? '<span class="inline-block w-px h-4 ml-1 bg-blue-400 animate-pulse"></span>' : ''}
                    </span>
                    
                    <!-- Badge moderne avec le nombre de commandes actualisé en temps réel -->
                    ${tab.commandCount && tab.commandCount > 0 ? `
                        <div class="flex-shrink-0 ml-2 px-2 py-1 text-xs rounded-full font-medium transition-all duration-150 ${
                            tab.isActive 
                                ? 'bg-gradient-to-r from-blue-500/25 to-blue-600/20 text-blue-300 border border-blue-400/30 shadow-inner' 
                                : 'bg-gradient-to-r from-gray-700/40 to-gray-800/30 text-gray-500 border border-gray-600/30 group-hover:bg-gradient-to-r group-hover:from-gray-600/50 group-hover:to-gray-700/40'
                        }">
                            <span class="flex items-center">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                </svg>
                                ${tab.commandCount}
                            </span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Bouton de fermeture moderne avec animations -->
                ${this.tabs.length > 1 ? `
                    <button class="close-tab-btn flex-shrink-0 ml-3 w-7 h-7 rounded-lg 
                                transition-all duration-150 flex items-center justify-center text-xs
                                opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0
                                bg-gradient-to-br from-gray-700/0 to-gray-800/0
                                hover:from-red-500/20 hover:to-red-600/10 hover:text-red-400 hover:scale-110 hover:shadow-lg
                                focus:opacity-100 focus:from-red-500/20 focus:to-red-600/10 focus:text-red-400 focus:ring-2 focus:ring-red-400/50
                                active:scale-95
                                ${tab.isActive ? 'text-gray-400' : 'text-gray-500'}" 
                            data-tab-id="${tab.id}" 
                            title="Fermer l'onglet (Ctrl+W)">
                        <svg class="w-4 h-4 transition-all duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                ` : ''}
                
                <!-- Bordure inférieure animée pour l'onglet actif -->
                ${tab.isActive ? `
                    <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 
                                shadow-lg shadow-blue-400/50 animate-pulse"></div>
                ` : ''}
                
                <!-- Indicateur de status à droite -->
                <div class="absolute right-1 top-1 w-2 h-2 rounded-full transition-all duration-150 ${
                    tab.isActive 
                        ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' 
                        : 'bg-gray-600 group-hover:bg-gray-500'
                }"></div>
            `;

            // Variables pour gérer les clics
            let clickTimeout = null;
            let clickCount = 0;

            // Gestionnaire unifié pour tous les clics
            tabElement.addEventListener('click', (e) => {
                if (e.target.closest('.close-tab-btn')) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                clickCount++;
                
                if (clickCount === 1) {
                    // Premier clic - programmer l'action de clic simple
                    clickTimeout = setTimeout(() => {
                        // Clic simple - changer d'onglet
                        this.switchToTab(tab.id);
                        clickCount = 0;
                    }, 250); // Délai pour détecter le double-clic
                } else if (clickCount === 2) {
                    // Double-clic détecté - annuler le clic simple et exécuter le renommage
                    clearTimeout(clickTimeout);
                    this.startTabRename(tab.id, tabElement);
                    clickCount = 0;
                }
            });

            // Gestionnaire pour le bouton de fermeture
            const closeBtn = tabElement.querySelector('.close-tab-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeTab(tab.id);
                });
            }

            // Support des raccourcis clavier
            tabElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.switchToTab(tab.id);
                } else if (e.key === 'Delete' && this.tabs.length > 1) {
                    e.preventDefault();
                    this.closeTab(tab.id);
                } else if (e.key === 'F2') {
                    e.preventDefault();
                    this.startTabRename(tab.id, tabElement);
                }
            });

            // Accessibilité avec compteur mis à jour
            tabElement.setAttribute('tabindex', '0');
            tabElement.setAttribute('role', 'tab');
            tabElement.setAttribute('aria-selected', tab.isActive);
            tabElement.setAttribute('aria-label', `Onglet ${tab.title}, ${tab.commandCount || 0} commandes. Double-clic pour renommer, F2 pour renommer.`);

            this.tabsContainer.appendChild(tabElement);
        });

        // Délimiteur final simplifié
        const delimiter = document.createElement('div');
        delimiter.className = 'flex-1 bg-gradient-to-r from-gray-900/50 via-gray-800/30 to-gray-900/20 border-b border-gray-700/20';
        this.tabsContainer.appendChild(delimiter);
    },

    startTabRename(tabId, tabElement) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        const titleSpan = tabElement.querySelector('span');
        if (!titleSpan) return;
        
        const currentTitle = tab.title;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'bg-gray-600 text-white px-1 py-0 rounded text-sm border-none outline-none focus:ring-1 focus:ring-blue-500';
        input.style.width = '100px';
        input.style.minWidth = '80px';
        input.style.maxWidth = '150px';

        titleSpan.style.display = 'none';
        titleSpan.parentNode.insertBefore(input, titleSpan);

        input.focus();
        input.select();

        const finishRename = () => {
            const newTitle = input.value.trim() || currentTitle;
            
            // Échapper le HTML pour éviter l'interprétation
            const escapedTitle = newTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            titleSpan.style.display = '';
            
            this.renameTab(tabId, escapedTitle);
        };

        const cancelRename = () => {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            titleSpan.style.display = '';
        };

        input.addEventListener('blur', finishRename);
        
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
            }
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },

    switchToTab(tabId) {
        // Sauvegarder l'état de l'onglet actuel avant de changer
        this.saveCurrentTabState();
        
        // Mettre à jour les états
        this.tabs.forEach(tab => {
            tab.isActive = tab.id === tabId;
        });
        
        this.activeTabId = tabId;
        
        // Charger l'état du nouvel onglet
        this.loadTabState(tabId);
        
        // Mettre à jour l'affichage
        this.renderTabs();
        
        // Sauvegarder la nouvelle configuration
        this.saveTabsToCookie();
    },

    closeTab(tabId) {
        if (this.tabs.length <= 1) {
            this.addOutput('<span class="text-yellow-400">⚠️ Impossible de fermer le dernier onglet</span>', 'system');
            return;
        }

        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        const wasActive = this.tabs[tabIndex].isActive;
        this.tabs.splice(tabIndex, 1);

        if (wasActive) {
            // Activer l'onglet suivant ou précédent
            const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
            const newActiveTab = this.tabs[newActiveIndex];
            this.switchToTab(newActiveTab.id);
        }

        this.renderTabs();
        this.saveTabsToCookie();
    },

    updatePromptDisplay() {
        const appContainer = document.getElementById('app-container');
        let smallScreenMessage = document.getElementById('small-screen-message');

        if (window.innerWidth <= 330) {
            appContainer.style.display = 'none';
            
            if (!smallScreenMessage) {
                smallScreenMessage = document.createElement('div');
                smallScreenMessage.id = 'small-screen-message';
                smallScreenMessage.className = 'fixed inset-0 bg-gray-900 flex items-center justify-center z-50';
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

            const smallScreenMessage = document.getElementById('small-screen-message');
            if (smallScreenMessage) {
                smallScreenMessage.style.display = 'none';
            }
        }
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

        this.updateActiveTabOutputCount();
    },

    incrementActiveTabCommandCount(arg) {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        // Incrémenter le compteur de commandes
        if (!activeTab.commandCount) {
            activeTab.commandCount = 0;
        }
        if (arg === "clear") {
            activeTab.commandCount = 0; // Réinitialiser le compteur si la commande est "clear"
            return;
        } else {
            activeTab.commandCount++;
        }

        // Re-rendre les onglets pour actualiser le compteur
        this.renderTabs();
        
        // Sauvegarder immédiatement
        this.saveTabsToCookie();
    },

    updateActiveTabOutputCount() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        // Compter les éléments de sortie (exclure les indicateurs système)
        const outputElements = Array.from(this.outputElement.children)
            .filter(child => child.id !== 'loading-llm-indicator' && child.id !== 'console-end-ref');
        
        // Mettre à jour le compteur pour l'onglet actif
        activeTab.outputHistory = outputElements.map(child => ({
            html: child.innerHTML,
            className: child.className || ''
        }));

        // Re-rendre les onglets pour actualiser le compteur
        this.renderTabs();
        
        // Sauvegarder les modifications dans les cookies
        this.saveTabsToCookie();
    },

    scrollToBottom() {
        if (this.consoleEndRefElement) {
            this.consoleEndRefElement.scrollIntoView({ behavior: 'smooth' });
        }
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
        // Toujours afficher le message après clear
        this.addOutput(this.defaultMessage, 'system');
        
        // Mettre à jour le compteur après le nettoyage
        this.updateActiveTabOutputCount();
        this.scrollToBottom();
        this.incrementActiveTabCommandCount("clear");

        // Sauvegarder l'état de l'onglet après le nettoyage
        this.saveCurrentTabState();
    },

    updatePrompt() {
        // Utilise le pseudo du cookie si présent, sinon "user"
        let pseudo = this.getPseudoFromCookie() || "user";
        this.promptLabelElement.innerHTML = `${pseudo}@webconsole:<span class="text-blue-400">${this.currentDir}</span>$`;
    },

    updateWindowTitle() {
        const pseudo = this.getPseudoFromCookie() || "user";
        document.title = `${pseudo} - CLK Console `;
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

        // Traitement du chaînage de commandes
        if (this.hasCommandChaining(commandText)) {
            await this.executeCommandChain(commandText);
            this.commandInputElement.value = '';
            this.historyIndex = -1;
            return;
        }

        // Exécution d'une commande simple
        await this.executeSingleCommand(commandText);
        this.commandInputElement.value = '';
        this.historyIndex = -1;
    },

    // Nouvelle méthode pour détecter le chaînage de commandes
    hasCommandChaining(commandText) {
        return commandText.includes('&&') || commandText.includes('||') || commandText.includes(';');
    },

    // Nouvelle méthode pour exécuter une chaîne de commandes
    async executeCommandChain(commandText) {
        const promptLine = `<span class="text-green-400">${this.getPseudoFromCookie() || "user"}@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${commandText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
        this.addOutput(promptLine, 'command');
        this.addToHistory(commandText, promptLine, 'command');

        // INCRÉMENTER LE COMPTEUR DE COMMANDES ICI POUR LES CHAÎNES
        this.incrementActiveTabCommandCount();

        // Parser la chaîne de commandes en respectant les opérateurs
        const commands = this.parseCommandChain(commandText);
        
        let lastExitCode = 0; // 0 = succès, 1 = échec

        for (let i = 0; i < commands.length; i++) {
            const { command, operator } = commands[i];
            
            // Déterminer si on doit exécuter cette commande
            let shouldExecute = true;
            
            if (i > 0) {
                const prevOperator = commands[i - 1].operator;
                if (prevOperator === '&&' && lastExitCode !== 0) {
                    shouldExecute = false;
                    this.addOutput(`<span class="text-yellow-400">⏭️ Commande ignorée (commande précédente a échoué): ${command}</span>`, 'system');
                } else if (prevOperator === '||' && lastExitCode === 0) {
                    shouldExecute = false;
                    this.addOutput(`<span class="text-yellow-400">⏭️ Commande ignorée (commande précédente a réussi): ${command}</span>`, 'system');
                }
            }

            if (shouldExecute) {
                try {
                    lastExitCode = await this.executeSingleCommandWithExitCode(command.trim());
                } catch (error) {
                    lastExitCode = 1;
                    this.addOutput(`Erreur lors de l'exécution de "${command}": ${error.message}`, 'error');
                }
            }
        }

        // Afficher un résumé si plusieurs commandes
        if (commands.length > 1) {
            const successColor = lastExitCode === 0 ? 'text-green-400' : 'text-red-400';
            const statusText = lastExitCode === 0 ? 'réussie' : 'échouée';
            if (lastExitCode !== 0) {
                this.addOutput(`<span class="${successColor}">⏭️ Chaîne de commandes ${statusText} (code de sortie: ${lastExitCode})</span>`, 'system');
            }
        }

        this.updatePrompt();
        this.commandInputElement.focus();
    },

    // Nouvelle méthode pour parser une chaîne de commandes
    parseCommandChain(commandText) {
        const commands = [];
        let currentCommand = '';
        let i = 0;
        
        while (i < commandText.length) {
            const char = commandText[i];
            const nextChar = commandText[i + 1];
            
            if (char === '&' && nextChar === '&') {
                commands.push({ command: currentCommand.trim(), operator: '&&' });
                currentCommand = '';
                i += 2;
            } else if (char === '|' && nextChar === '|') {
                commands.push({ command: currentCommand.trim(), operator: '||' });
                currentCommand = '';
                i += 2;
            } else if (char === ';') {
                commands.push({ command: currentCommand.trim(), operator: ';' });
                currentCommand = '';
                i += 1;
            } else {
                currentCommand += char;
                i += 1;
            }
        }
        
        // Ajouter la dernière commande
        if (currentCommand.trim()) {
            commands.push({ command: currentCommand.trim(), operator: null });
        }
        
        return commands.filter(cmd => cmd.command.length > 0);
    },

    // Méthode pour exécuter une commande simple avec gestion des codes de sortie
    async executeSingleCommandWithExitCode(commandText) {
        const [cmd, ...args] = commandText.split(/\s+/);
        const execute = this.commands[cmd];

        if (execute) {
            try {
                const result = await execute.call(this, args);
                // Retourner un code de sortie basé sur le résultat
                return result === false ? 1 : 0;
            } catch (error) {
                this.addOutput(`Erreur lors de l'exécution de la commande ${cmd}: ${error.message}`, 'error');
                return 1;
            }
        } else {
            this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
            return 1;
        }
    },

    async executeSingleCommand(commandText) {
        const promptLine = `<span class="text-green-400">${this.getPseudoFromCookie() || "user"}@webconsole</span>:<span class="text-blue-400">${this.currentDir}</span>$ ${commandText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
        this.addOutput(promptLine, 'command');
        this.addToHistory(commandText, promptLine, 'command');

        // INCRÉMENTER LE COMPTEUR DE COMMANDES ICI SEULEMENT POUR LES COMMANDES SIMPLES
        this.incrementActiveTabCommandCount();

        this.historyIndex = -1;

        const [cmd, ...args] = commandText.split(/\s+/);
        const execute = this.commands[cmd];

        if (execute) {
            try {
                await execute.call(this, args);
            } catch (error) {
                this.addOutput(`Erreur lors de l'exécution de la commande ${cmd}: ${error.message}`, 'error');
                console.error(`Command execution error (${cmd}):`, error);
            }
        } else {
            this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
        }

        this.updatePrompt();
        this.commandInputElement.focus();
    },

    // Méthode pour exécuter une commande simple (refactorisée)
    async executeSingleCommandWithExitCode(commandText) {
        const [cmd, ...args] = commandText.split(/\s+/);
        const execute = this.commands[cmd];

        if (execute) {
            try {
                const result = await execute.call(this, args);
                // Retourner un code de sortie basé sur le résultat
                return result === false ? 1 : 0;
            } catch (error) {
                this.addOutput(`Erreur lors de l'exécution de la commande ${cmd}: ${error.message}`, 'error');
                return 1;
            }
        } else {
            this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
            return 1;
        }
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
            // Parse options
            const options = this.parseOptions(args, {
            'o': 'old',
            'old': 'old'
            });

            // Help option
            if (args.includes('--help')) {
                this.commands.man.call(this, ['echo']);
                return;
            }

            // Get text from remaining args
            const text = options._.join(' ').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            // Use old style if --old or -o option is provided
            if (options.old) {
            this.addOutput(text);
            return;
            }
            
            // Créer une interface plus moderne pour echo avec améliorations visuelles
            const echoHTML = `
            <div class="border border-blue-500/50 rounded-xl p-4 bg-gradient-to-br from-blue-900/20 to-gray-900/30 backdrop-blur-sm mt-2 shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <span class="text-white text-sm">📢</span>
                </div>
                <span class="font-bold text-blue-300 text-lg">Echo Output</span>
                </div>
                <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-xs text-gray-400 font-medium">Active</span>
                </div>
            </div>
            <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg"></div>
                <div class="relative bg-gray-800/60 rounded-lg p-4 border border-gray-600/50 shadow-inner">
                <div class="flex items-start space-x-3">
                    <div class="w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    <div class="flex-1 min-w-0">
                    <span class="text-white font-mono text-lg leading-relaxed break-words">${text}</span>
                    </div>
                </div>
                </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
                <div class="flex items-center space-x-2 text-xs text-gray-400">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="flex items-center space-x-1 text-xs text-gray-500">
                <span>Length: ${text.length}</span>
                <span>•</span>
                <span>Type: String</span>
                </div>
            </div>
            </div>
            `;

            this.addOutput(echoHTML, 'system');
        },
        say (args) {
            this.commands.echo.call(this, args);
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
                this.commands.man.call(this, ['cat']);
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
                this.commands.man.call(this, ['help']);
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
            
            // Configurer les commandes cliquables après avoir ajouté tout l'output
            setTimeout(() => this.setupClickableCommands(), 0);
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
        version: async function() {
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Récupération des informations de version...',
                progressBarColors: 'from-purple-500 to-blue-500',
                steps: [
                    { text: 'Lecture du fichier version.json...', color: 'text-purple-400', delay: 0 },
                    { text: 'Validation des données...', color: 'text-blue-400', delay: 200 },
                    { text: 'Génération de l\'affichage...', color: 'text-green-400', delay: 400 }
                ]
            });

            try {
                const response = await fetch('/version.json');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const versionData = await response.json();

                // Terminer l'animation
                loadingAnimation.complete();

                const versionHTML = `
                <div class="border border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/20 backdrop-blur-sm mt-3">
                    <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-purple-400">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        </div>
                        <div>
                        <h2 class="text-2xl font-bold text-white">CLK Console</h2>
                        <p class="text-purple-300 text-sm">Console Linux Web Interactive</p>
                        </div>
                    </div>
                    <div class="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-lg font-bold border border-purple-500/30">
                        v${versionData.version || 'N/A'}
                    </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-blue-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Informations Version
                        </h3>
                        <div class="space-y-2 text-sm">
                        <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                            <span class="text-purple-300 font-medium">Version:</span>
                            <span class="text-white font-mono">${versionData.version || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                            <span class="text-blue-300 font-medium">Date de build:</span>
                            <span class="text-white font-mono">${versionData.buildDate || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-green-900/30 rounded">
                            <span class="text-green-300 font-medium">Auteur:</span>
                            <span class="text-white font-mono">${versionData.author || 'Klaynight'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                            <span class="text-yellow-300 font-medium">Environnement:</span>
                            <span class="text-white font-mono">${versionData.environment || 'Production'}</span>
                        </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-purple-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Statistiques Système
                        </h3>
                        <div class="space-y-2 text-sm">
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Commandes:</span>
                            <span class="text-white font-mono">${Object.keys(COMMAND_METADATA).length}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Runtime:</span>
                            <span class="text-white font-mono">JavaScript</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Plateforme:</span>
                            <span class="text-white font-mono">${navigator.userAgentData?.platform || navigator.userAgent.match(/\(([^)]+)\)/)?.[1]?.split(';')[0]?.trim() || 'Inconnu'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Navigateur:</span>
                            <span class="text-white font-mono">${navigator.userAgent.split(' ')[0]}</span>
                        </div>
                        </div>
                    </div>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-600">
                    <div class="flex items-center justify-end text-sm text-gray-400">
                        <div class="text-xs">
                        Made with ❤️ by <span class="text-purple-400">${versionData.author || versionData.owner?.login || 'Klaynight'}</span>
                        </div>
                    </div>
                    </div>
                </div>
                `;
                
                this.addOutput(versionHTML, 'system');

            } catch (error) {
                loadingAnimation.complete();

                // Affichage d'erreur avec fallback
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                    <div class="flex items-center mb-2">
                        <span class="text-red-400 mr-2">❌</span>
                        <span class="text-red-300 font-medium">Erreur lors de la récupération de la version</span>
                    </div>
                    <div class="text-red-400 text-sm">${error.message}</div>
                    <div class="text-gray-400 text-xs mt-2">
                        Affichage des informations de base disponibles...
                    </div>
                    </div>
                `, 'error');

                // Fallback vers l'affichage basique
                setTimeout(() => {
                    const fallbackHTML = `
                    <div class="border border-gray-500 rounded-xl p-6 bg-gray-800/50 mt-3">
                        <div class="text-center">
                        <div class="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-500 mx-auto mb-4">
                            <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">CLK Console</h2>
                        <p class="text-gray-300 mb-4">Console Linux Web Interactive (Mode hors ligne)</p>
                        <div class="text-sm text-gray-400">
                            <div>Version: Information indisponible</div>
                            <div>Date: ${new Date().toLocaleDateString()}</div>
                            <div>Commandes disponibles: ${Object.keys(COMMAND_METADATA).length}</div>
                        </div>
                        </div>
                    </div>
                    `;
                    this.addOutput(fallbackHTML, 'system');
                }, 1000);
            }
        },
        cconnect: async function (args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('Erreur : veuillez fournir un pseudo. Utilisation : cconnect <username>', 'error');
            return;
            }
            const pseudo = args[0].trim();
            this.setPseudoCookie(pseudo);
            
            // Interface améliorée pour la connexion
            const connectionHTML = `
            <div class="border border-green-500 rounded-lg p-4 bg-green-900/20 backdrop-blur-sm mt-3">
                <div class="flex items-center mb-3">
                <span class="text-2xl mr-2">🔗</span>
                <span class="font-bold text-green-400 text-xl">Connexion réussie</span>
                </div>
                <div class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Utilisateur:</span>
                    <span class="text-white font-mono font-bold">${pseudo}</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Statut:</span>
                    <span class="text-green-400 font-mono">✅ Connecté</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Session:</span>
                    <span class="text-white font-mono">${new Date().toLocaleString()}</span>
                </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">
                Titre de la fenêtre mis à jour automatiquement
                </div>
            </div>
            `;
            this.addOutput(connectionHTML, "system");
            this.updatePrompt();
            this.updateWindowTitle();
            this.updatePromptDisplay();
        },

        cdisconnect: async function () {
            const currentPseudo = this.getPseudoFromCookie() || 'user';
            
            // Supprime le cookie pseudo
            document.cookie = "pseudo=;path=/;max-age=0";
            
            // Interface améliorée pour la déconnexion
            const disconnectionHTML = `
            <div class="border border-orange-500 rounded-lg p-4 bg-orange-900/20 backdrop-blur-sm mt-3">
                <div class="flex items-center mb-3">
                <span class="text-2xl mr-2">🔌</span>
                <span class="font-bold text-orange-400 text-xl">Déconnexion</span>
                </div>
                <div class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Ancien utilisateur:</span>
                    <span class="text-white font-mono line-through">${currentPseudo}</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Nouvel utilisateur:</span>
                    <span class="text-white font-mono font-bold">user</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Statut:</span>
                    <span class="text-orange-400 font-mono">⚡ Déconnecté</span>
                </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">
                Session réinitialisée - Titre de la fenêtre mis à jour
                </div>
            </div>
            `;
            this.addOutput(disconnectionHTML, "system");
            this.updatePrompt();
            this.updateWindowTitle();
            this.updatePromptDisplay();
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

            this.openRichTextEditor(fileName, targetNode);
        },
        github: async function () {
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Connexion à l\'API GitHub...',
                progressBarColors: 'from-blue-500 to-purple-500',
                steps: [
                    { text: 'Connexion au serveur GitHub...', color: 'text-blue-400', delay: 0 },
                    { text: 'Récupération des données du dépôt...', color: 'text-purple-400', delay: 300 },
                    { text: 'Analyse des informations...', color: 'text-green-400', delay: 600 }
                ]
            });

            try {
                const response = await fetch('https://api.github.com/repos/Klaynight-dev/Web_linux_console');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const repoData = await response.json();

                // Terminer l'animation
                loadingAnimation.complete();

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

            } catch (error) {
                loadingAnimation.complete();
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
            this.addOutput('<span class="text-green-400">✅ Historique des commandes effacé</span>', 'system');
        },
        resetAllCache: function () {
            // Créer le modal de confirmation
            let modal = document.getElementById('reset-cache-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'reset-cache-modal';
                modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50';
                modal.innerHTML = `
                    <div class="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-red-500 relative">
                        <!-- Bouton fermer -->
                        <button id="reset-close-x" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-150">&times;</button>
                        
                        <!-- Header avec animation -->
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mr-4 animate-pulse">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-red-400 mb-2">RÉINITIALISATION COMPLÈTE</h2>
                                <p class="text-red-300 text-lg">Cette action est IRRÉVERSIBLE !</p>
                            </div>
                        </div>
                        
                        <!-- Données à supprimer -->
                        <div class="bg-red-900/40 border border-red-600/50 rounded-lg p-4 mb-6">
                            <h3 class="text-yellow-300 font-bold text-lg mb-3 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Données qui seront supprimées définitivement :
                            </h3>
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🍪</span>
                                        <span class="text-white text-sm">Tous les cookies</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">📜</span>
                                        <span class="text-white text-sm">Historique des commandes</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">📁</span>
                                        <span class="text-white text-sm">Système de fichiers</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🎨</span>
                                        <span class="text-white text-sm">Paramètres personnalisés</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🗂️</span>
                                        <span class="text-white text-sm">Onglets et historique</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">💾</span>
                                        <span class="text-white text-sm">Stockage local</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Avertissement -->
                        <div class="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/50 rounded-lg p-4 mb-6">
                            <div class="flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-400 mr-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <span class="text-orange-300 font-bold text-lg text-center">
                                    L'application sera complètement réinitialisée à son état initial
                                </span>
                            </div>
                        </div>
                        
                        <!-- Zone de progression (cachée initialement) -->
                        <div id="reset-progress" class="hidden mb-6">
                            <div class="flex items-center justify-center space-x-3 mb-4">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                <span class="text-blue-300 font-bold text-xl">Suppression en cours...</span>
                            </div>
                            <div class="space-y-3">
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-red-400 rounded-full"></div>
                                    <span class="text-gray-300">Suppression des cookies...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-yellow-400 rounded-full" style="animation-delay: 0.2s"></div>
                                    <span class="text-gray-300">Effacement de l'historique...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-green-400 rounded-full" style="animation-delay: 0.4s"></div>
                                    <span class="text-gray-300">Réinitialisation du système de fichiers...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-purple-400 rounded-full" style="animation-delay: 0.6s"></div>
                                    <span class="text-gray-300">Nettoyage du stockage local...</span>
                                </div>
                            </div>
                            <div class="mt-4 bg-gray-700 rounded-full h-3">
                                <div id="reset-progress-bar" class="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <!-- Boutons d'action -->
                        <div id="reset-buttons" class="flex items-center justify-center space-x-4">
                            <button id="reset-confirm-btn" class="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Oui, supprimer tout
                            </button>
                            <button id="reset-cancel-btn" class="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Annuler
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            modal.classList.remove('hidden');
            
            // Gestionnaires d'événements pour les boutons
            const confirmBtn = document.getElementById('reset-confirm-btn');
            const cancelBtn = document.getElementById('reset-cancel-btn');
            const closeBtn = document.getElementById('reset-close-x');
            const buttonsDiv = document.getElementById('reset-buttons');
            const progressDiv = document.getElementById('reset-progress');

            let closeModal = () => {
                modal.classList.add('hidden');
                this.commandInputElement.focus();
            };

            const performReset = () => {
                // Masquer les boutons et afficher la progression
                buttonsDiv.classList.add('hidden');
                progressDiv.classList.remove('hidden');
                
                // Simulation de progression
                let progress = 0;
                const progressBar = document.getElementById('reset-progress-bar');
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 15 + 10;
                    if (progress > 100) progress = 100;
                    if (progressBar) {
                        progressBar.style.width = progress + '%';
                    }
                }, 200);
                
                setTimeout(() => {
                    clearInterval(progressInterval);
                    
                    // Effectuer la réinitialisation
                    try {
                        // Supprimer tous les cookies
                        document.cookie.split(";").forEach(function(c) { 
                            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                        });
                        
                        // Vider localStorage
                        localStorage.clear();
                        
                        // Vider sessionStorage
                        sessionStorage.clear();
                        
                        // Réinitialiser les données de l'application
                        this.history = [];
                        this.tabs = [];
                        this.currentDir = '/home/user';
                        this.fileSystem = {
                            '/': {
                                type: 'directory',
                                children: {
                                    'bin': { type: 'directory', children: {} },
                                    'home': {
                                        type: 'directory',
                                        children: {
                                            'user': {
                                                type: 'directory',
                                                children: {
                                                    'welcome.txt': {
                                                        type: 'file',
                                                        content: 'Bienvenue sur votre console Linux web!'
                                                    },
                                                    'notes.txt': {
                                                        type: 'file',
                                                        content: 'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.'
                                                    }
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
                                                    const mots = ["Message du jour : Amusez-vous bien !", "Message du jour : Apprenez quelque chose de nouveau aujourd'hui.", "Message du jour : La persévérance paie toujours.", "Message du jour : Codez avec passion.", "Message du jour : Prenez une pause et respirez.", "Message du jour : La curiosité est une qualité.", "Message du jour : Essayez une nouvelle commande.", "Message du jour : Partagez vos connaissances.", "Message du jour : La simplicité est la sophistication suprême.", "Message du jour : Un bug aujourd'hui, une solution demain.", "Message du jour : La créativité commence par une idée.", "Message du jour : Osez sortir de votre zone de confort.", "Message du jour : La collaboration fait la force.", "Message du jour : Chaque jour est une nouvelle opportunité.", "Message du jour : L'échec est le début du succès.", "Message du jour : Prenez soin de vous.", "Message du jour : La patience est une vertu.", "Message du jour : Faites de votre mieux.", "Message du jour : Le partage, c'est la vie."];
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
                        };
                        
                        // Populer le répertoire bin
                        this.populateBinDirectory();
                        this.saveFileSystemToCookie();
                        
                        // Réinitialiser les onglets
                        this.tabs = [];
                        this.activeTabId = null;
                        this.nextTabId = 1;
                        this.createFirstTab();
                        
                        // Fermer le modal
                        closeModal();
                        
                        // Vider complètement la console
                        this.clearConsole();
                        
                        // Utiliser la méthode reboot existante pour redémarrer
                        this.commands.reboot.call(this);
                        
                        // Mettre à jour le prompt et remettre le focus
                        this.updatePrompt();
                        this.commandInputElement.focus();
                        
                    } catch (error) {
                        // En cas d'erreur, afficher une notification d'erreur
                        closeModal();
                        this.showNotification({
                            type: 'error',
                            title: '❌ Erreur de réinitialisation',
                            message: 'Une erreur est survenue : ' + error.message,
                            duration: 8000,
                            actions: [
                                {
                                    text: '🔄 Réessayer',
                                    callback: () => {
                                        this.commands.resetAllCache.call(this);
                                    }
                                },
                                {
                                    text: '⚠️ Recharger manuellement',
                                    callback: () => {
                                        window.location.reload();
                                    }
                                }
                            ]
                        });
                    }
                }, 1500);
            };

            // Événements
            confirmBtn.onclick = performReset;
            cancelBtn.onclick = closeModal;
            closeBtn.onclick = closeModal;

            // Fermer en cliquant à l'extérieur
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            };

            // Support des touches
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'Enter') {
                    performReset();
                }
            };

            document.addEventListener('keydown', keyHandler);

            // Nettoyer les événements lors de la fermeture
            const originalCloseModal = closeModal;
            closeModal = () => {
                document.removeEventListener('keydown', keyHandler);
                originalCloseModal();
            };
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

            const loadingAnimation = this.createLoadingAnimation({
                title: 'Analyse matérielle en cours...',
                progressBarColors: 'from-green-500 to-blue-500',
                steps: [
                    { text: 'Détection CPU et mémoire...', color: 'text-blue-400', delay: 0 },
                    { text: 'Analyse GPU via WebGL...', color: 'text-purple-400', delay: 300 },
                    { text: 'Inventaire des périphériques...', color: 'text-yellow-400', delay: 600 }
                ]
            });

            // Simulation de l'analyse matérielle
            setTimeout(() => {
                loadingAnimation.complete();
                
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

                        // Informations de performance
                        if (window.performance) {
                            hwInfo.performance = {
                                memory: window.performance.memory ? {
                                    usedJSHeapSize: this.formatBytes(window.performance.memory.usedJSHeapSize),
                                    totalJSHeapSize: this.formatBytes(window.performance.memory.totalJSHeapSize),
                                    jsHeapSizeLimit: this.formatBytes(window.performance.memory.jsHeapSizeLimit)
                                } : 'Non disponible',
                                timing: {
                                    loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                                    domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
                                    networkLatency: window.performance.timing.responseStart - window.performance.timing.fetchStart
                                }
                            };
                        }

                        // Informations de géolocalisation
                        hwInfo.geolocation = {
                            supported: 'geolocation' in navigator,
                            status: navigator.geolocation ? 'Disponible' : 'Non supporté'
                        };

                        // Informations diverses
                        hwInfo.misc = {
                            localStorage: typeof Storage !== 'undefined',
                            sessionStorage: typeof sessionStorage !== 'undefined',
                            webWorkers: typeof Worker !== 'undefined',
                            serviceWorkers: 'serviceWorker' in navigator,
                            notifications: 'Notification' in window,
                            permissions: 'permissions' in navigator,
                            vibration: 'vibrate' in navigator,
                            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled,
                            clipboard: navigator.clipboard !== undefined,
                            share: navigator.share !== undefined
                        };

                        return hwInfo;

                    } catch (error) {
                        console.error('Erreur récupération matériel:', error);
                        return {};
                    }
                };

                // Exécution et affichage avec le nouveau constructeur
                getRealHardwareInfo().then(hwInfo => {
                    if (Object.keys(hwInfo).length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations matérielles</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = '';

                    // Système de base
                    if (hwInfo.system) {
                        output += this.createInfoBlock({
                            title: 'Système',
                            icon: '💻',
                            color: 'text-blue-400',
                            items: [
                                { label: 'Plateforme', value: hwInfo.system.platform, labelColor: 'text-blue-300' },
                                { label: 'Langue', value: hwInfo.system.language, labelColor: 'text-green-300' },
                                { label: 'Navigateur', value: hwInfo.system.vendor || 'Inconnu', labelColor: 'text-purple-300' },
                                { label: 'En ligne', value: hwInfo.system.online ? 'Oui' : 'Non', labelColor: 'text-yellow-300' },
                                { label: 'Cookies', value: hwInfo.system.cookieEnabled ? 'Activés' : 'Désactivés', labelColor: 'text-cyan-300' }
                            ]
                        });
                    }

                    // CPU et Mémoire
                    if (hwInfo.cpu) {
                        output += this.createInfoBlock({
                            title: 'Processeur & Mémoire',
                            icon: '🧠',
                            color: 'text-cyan-400',
                            itemBgColor: 'bg-blue-900/30',
                            items: [
                                { label: 'Cœurs CPU', value: hwInfo.cpu.cores, labelColor: 'text-cyan-300' },
                                { label: 'RAM estimée', value: hwInfo.cpu.memory, labelColor: 'text-cyan-300' }
                            ]
                        });
                    }

                    // Affichage
                    if (hwInfo.display) {
                        output += this.createInfoBlock({
                            title: 'Affichage',
                            icon: '🖥️',
                            color: 'text-purple-400',
                            itemBgColor: 'bg-purple-900/30',
                            items: [
                                { label: 'Résolution', value: hwInfo.display.resolution, labelColor: 'text-purple-300' },
                                { label: 'Profondeur couleur', value: hwInfo.display.colorDepth, labelColor: 'text-purple-300' },
                                { label: 'Pixel Ratio', value: hwInfo.display.pixelRatio, labelColor: 'text-purple-300' },
                                { label: 'Fenêtre visible', value: hwInfo.display.viewport, labelColor: 'text-purple-300' },
                                { label: 'Orientation', value: hwInfo.display.orientation, labelColor: 'text-purple-300' }
                            ]
                        });
                    }

                    // GPU
                    if (hwInfo.gpu && !hwInfo.gpu.error) {
                        const gpuItems = [
                            { label: 'WebGL Version', value: hwInfo.gpu.version, labelColor: 'text-red-300' },
                            { label: 'Shading Language', value: hwInfo.gpu.shadingLanguage, labelColor: 'text-red-300' },
                            { label: 'Vendor (masqué)', value: hwInfo.gpu.vendor, labelColor: 'text-red-300' },
                            { label: 'Renderer (masqué)', value: hwInfo.gpu.renderer, labelColor: 'text-red-300' }
                        ];

                        // Ajouter les infos non masquées si disponibles
                        if (hwInfo.gpu.unmaskedVendor) {
                            gpuItems.unshift({ label: 'Fabricant', value: hwInfo.gpu.unmaskedVendor, labelColor: 'text-red-300' });
                        }
                        if (hwInfo.gpu.unmaskedRenderer) {
                            gpuItems.splice(hwInfo.gpu.unmaskedVendor ? 1 : 0, 0, 
                                { label: 'Modèle', value: hwInfo.gpu.unmaskedRenderer, labelColor: 'text-red-300' }
                            );
                        }

                        output += this.createInfoBlock({
                            title: 'Carte Graphique (WebGL)',
                            icon: '🎮',
                            color: 'text-red-400',
                            itemBgColor: 'bg-red-900/30',
                            items: gpuItems
                        });
                    }

                    // Réseau
                    if (hwInfo.network) {
                        output += this.createInfoBlock({
                            title: 'Réseau',
                            icon: '🌐',
                            color: 'text-yellow-400',
                            itemBgColor: 'bg-yellow-900/30',
                            items: [
                                { label: 'Type connexion', value: hwInfo.network.type, labelColor: 'text-yellow-300' },
                                { label: 'Débit estimé', value: hwInfo.network.downlink, labelColor: 'text-yellow-300' },
                                { label: 'Latence', value: hwInfo.network.rtt, labelColor: 'text-yellow-300' },
                                { label: 'Économie données', value: hwInfo.network.saveData, labelColor: 'text-yellow-300' }
                            ]
                        });
                    }

                    // Batterie
                    if (hwInfo.battery && !hwInfo.battery.error) {
                        const batteryItems = [
                            { label: 'Niveau', value: hwInfo.battery.level, labelColor: 'text-orange-300' },
                            { label: 'En charge', value: hwInfo.battery.charging ? 'Oui' : 'Non', labelColor: 'text-orange-300' }
                        ];

                        if (hwInfo.battery.chargingTime !== 'Indéfini') {
                            batteryItems.push({ label: 'Temps charge', value: hwInfo.battery.chargingTime, labelColor: 'text-orange-300' });
                        }
                        if (hwInfo.battery.dischargingTime !== 'Indéfini') {
                            batteryItems.push({ label: 'Autonomie', value: hwInfo.battery.dischargingTime, labelColor: 'text-orange-300' });
                        }

                        output += this.createInfoBlock({
                            title: 'Batterie',
                            icon: '🔋',
                            color: 'text-orange-400',
                            itemBgColor: 'bg-orange-900/30',
                            items: batteryItems
                        });
                    }

                    // Périphériques média
                    if (hwInfo.media && !hwInfo.media.error) {
                        output += this.createInfoBlock({
                            title: 'Périphériques Média',
                            icon: '🎤',
                            color: 'text-pink-400',
                            itemBgColor: 'bg-pink-900/30',
                            items: [
                                { label: 'Microphones', value: hwInfo.media.audioInputs, labelColor: 'text-pink-300' },
                                { label: 'Caméras', value: hwInfo.media.videoInputs, labelColor: 'text-pink-300' },
                                { label: 'Haut-parleurs', value: hwInfo.media.audioOutputs, labelColor: 'text-pink-300' }
                            ]
                        });
                    }

                    // Interface tactile
                    if (hwInfo.touch) {
                        output += this.createInfoBlock({
                            title: 'Interface Tactile',
                            icon: '👆',
                            color: 'text-teal-400',
                            itemBgColor: 'bg-teal-900/30',
                            items: [
                                { label: 'Points tactiles max', value: hwInfo.touch.maxPoints, labelColor: 'text-teal-300' },
                                { label: 'Support tactile', value: hwInfo.touch.supported ? 'Oui' : 'Non', labelColor: 'text-teal-300' }
                            ]
                        });
                    }

                    // Performance
                    if (hwInfo.performance) {
                        const perfItems = [];
                        
                        if (hwInfo.performance.memory !== 'Non disponible') {
                            perfItems.push(
                                { label: 'Mémoire JS utilisée', value: hwInfo.performance.memory.usedJSHeapSize, labelColor: 'text-green-300' },
                                { label: 'Mémoire JS totale', value: hwInfo.performance.memory.totalJSHeapSize, labelColor: 'text-green-300' },
                                { label: 'Limite mémoire JS', value: hwInfo.performance.memory.jsHeapSizeLimit, labelColor: 'text-green-300' }
                            );
                        }
                        
                        perfItems.push(
                            { label: 'Temps de chargement', value: `${hwInfo.performance.timing.loadTime} ms`, labelColor: 'text-green-300' },
                            { label: 'DOM prêt en', value: `${hwInfo.performance.timing.domContentLoaded} ms`, labelColor: 'text-green-300' },
                            { label: 'Latence réseau', value: `${hwInfo.performance.timing.networkLatency} ms`, labelColor: 'text-green-300' }
                        );

                        output += this.createInfoBlock({
                            title: 'Performance & Mémoire JS',
                            icon: '⚡',
                            color: 'text-green-400',
                            itemBgColor: 'bg-green-900/30',
                            items: perfItems
                        });
                    }

                    // Capacités diverses (en grille)
                    if (hwInfo.misc) {
                        const miscHTML = `
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">localStorage:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.localStorage ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">sessionStorage:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.sessionStorage ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Web Workers:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.webWorkers ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Service Workers:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.serviceWorkers ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Notifications:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.notifications ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Permissions:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.permissions ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Vibration:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.vibration ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Fullscreen:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.fullscreen ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Clipboard:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.clipboard ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Web Share:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.share ? '✅' : '❌'}</span>
                                </div>
                            </div>
                        `;

                        output += this.createInfoBlock({
                            title: 'Capacités & APIs',
                            icon: '🔧',
                            color: 'text-indigo-400',
                            items: [], // Pas d'items standards
                            customHTML: miscHTML
                        });
                    }

                    // Géolocalisation
                    if (hwInfo.geolocation) {
                        output += this.createInfoBlock({
                            title: 'Géolocalisation',
                            icon: '📍',
                            color: 'text-emerald-400',
                            itemBgColor: 'bg-emerald-900/30',
                            items: [
                                { label: 'Support', value: hwInfo.geolocation.supported ? 'Oui' : 'Non', labelColor: 'text-emerald-300' },
                                { label: 'Statut', value: hwInfo.geolocation.status, labelColor: 'text-emerald-300' }
                            ]
                        });
                    }

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
                }).catch(error => {
                    this.addOutput(`
                        <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                            <span class="text-red-400">❌ Erreur lors de la récupération des informations matérielles: ${error.message}</span>
                        </div>
                    `, 'error');
                });
            }, 10);
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

            const loadingAnimation = this.createLoadingAnimation({
                title: 'Analyse des interfaces réseau en cours...',
                progressBarColors: 'from-blue-500 to-green-500',
                steps: [
                    { text: 'Récupération IP publique...', color: 'text-green-400', delay: 0 },
                    { text: 'Détection des IPs locales via WebRTC...', color: 'text-yellow-400', delay: 300 },
                    { text: 'Analyse des capacités réseau...', color: 'text-purple-400', delay: 600 }
                ]
            });

            // Simulation de l'analyse réseau
            setTimeout(() => {
                loadingAnimation.complete();
                
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
                            }, 100);
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

                // Exécution et affichage avec le constructeur createInfoBlock
                getRealNetworkInfo().then(interfaces => {
                    if (interfaces.length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations réseau système</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = '';
                    
                    // Traiter chaque interface
                    interfaces.forEach(iface => {
                        if (iface.name === 'eth0') {
                            // Interface principale Ethernet
                            const eth0Items = [];
                            
                            // Ajouter l'IP publique si disponible
                            if (iface.publicIP) {
                                eth0Items.push({ 
                                    label: 'IP Publique', 
                                    value: iface.publicIP, 
                                    labelColor: 'text-blue-300' 
                                });
                            }

                            // Ajouter les IPs locales
                            if (iface.localIPs && iface.localIPs.length > 0) {
                                iface.localIPs.forEach((ip, index) => {
                                    eth0Items.push({ 
                                        label: `IP Locale ${index + 1}`, 
                                        value: `${ip}/24`, 
                                        labelColor: 'text-green-300' 
                                    });
                                });
                            }

                            // Ajouter les informations de connexion
                            if (iface.speed) {
                                eth0Items.push({ 
                                    label: 'Débit', 
                                    value: `${iface.speed} Mbps`, 
                                    labelColor: 'text-yellow-300' 
                                });
                            }

                            if (iface.effectiveType) {
                                eth0Items.push({ 
                                    label: 'Type de connexion', 
                                    value: iface.effectiveType, 
                                    labelColor: 'text-purple-300' 
                                });
                            }

                            if (iface.rtt) {
                                eth0Items.push({ 
                                    label: 'Latence RTT', 
                                    value: `${iface.rtt} ms`, 
                                    labelColor: 'text-cyan-300' 
                                });
                            }

                            // Ajouter les informations de batterie si disponibles
                            if (iface.powerInfo) {
                                eth0Items.push({ 
                                    label: 'Batterie', 
                                    value: `${iface.powerInfo.level}% ${iface.powerInfo.charging ? '(en charge)' : ''}`, 
                                    labelColor: 'text-orange-300',
                                    bgColor: 'bg-orange-900/30'
                                });
                            }

                            // MTU standard pour ethernet
                            eth0Items.push({ 
                                label: 'MTU', 
                                value: '1500', 
                                labelColor: 'text-gray-300' 
                            });

                            // Créer le bloc pour eth0 avec badge de statut
                            const statusBadgeHTML = `
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">🌐</span>
                                        <span class="font-bold text-green-400 text-lg">${iface.name}</span>
                                        <span class="ml-2 text-gray-400 text-sm">(${iface.type})</span>
                                    </div>
                                    <span class="px-2 py-1 ${iface.state.includes('UP') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'} rounded text-xs font-semibold">
                                        ${iface.state}
                                    </span>
                                </div>
                            `;

                            output += this.createInfoBlock({
                                title: '', // Pas de titre car on utilise le HTML personnalisé en haut
                                icon: '',
                                color: 'text-green-400',
                                items: eth0Items,
                                customHTML: statusBadgeHTML
                            });

                        } else if (iface.name === 'lo') {
                            // Interface de bouclage
                            const loItems = [
                                { label: 'IP', value: iface.ip, labelColor: 'text-green-300' },
                                { label: 'Netmask', value: iface.netmask, labelColor: 'text-blue-300' },
                                { label: 'MTU', value: iface.mtu.toString(), labelColor: 'text-gray-300' }
                            ];

                            const loStatusBadgeHTML = `
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">🔄</span>
                                        <span class="font-bold text-blue-400 text-lg">${iface.name}</span>
                                        <span class="ml-2 text-gray-400 text-sm">(${iface.type})</span>
                                    </div>
                                    <span class="px-2 py-1 ${iface.state.includes('UP') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'} rounded text-xs font-semibold">
                                        ${iface.state}
                                    </span>
                                </div>
                            `;

                            output += this.createInfoBlock({
                                title: '',
                                icon: '',
                                color: 'text-blue-400',
                                items: loItems,
                                customHTML: loStatusBadgeHTML
                            });
                        }
                    });

                    // Bloc d'informations système additionnelles
                    const systemItems = [
                        { label: 'Platform', value: navigator.platform, labelColor: 'text-blue-300' },
                        { label: 'Cores CPU', value: navigator.hardwareConcurrency || 'Inconnu', labelColor: 'text-green-300' },
                        { label: 'RAM estimée', value: `${navigator.deviceMemory || 'Inconnu'} GB`, labelColor: 'text-purple-300' },
                        { label: 'Résolution', value: `${screen.width}x${screen.height}`, labelColor: 'text-yellow-300' }
                    ];

                    const userAgentHTML = `
                        <div class="mt-2 p-2 bg-gray-700/30 rounded">
                            <span class="text-cyan-300 font-medium text-sm">User Agent:</span>
                            <div class="text-white font-mono text-xs mt-1 break-all">${navigator.userAgent.substring(0, 120)}...</div>
                        </div>
                    `;

                    output += this.createInfoBlock({
                        title: 'Informations système',
                        icon: '🖥️',
                        color: 'text-blue-300',
                        itemBgColor: 'bg-gray-700/20',
                        borderColor: 'border-gray-600',
                        items: systemItems,
                        customHTML: userAgentHTML
                    });

                    // Message de succès
                    const successHTML = `
                        <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <div class="flex items-center">
                                <span class="text-green-400 mr-2">✅</span>
                                <span class="text-green-300 font-medium">Analyse des interfaces réseau terminée avec succès</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                Toutes les interfaces réseau disponibles ont été détectées et analysées.
                            </div>
                        </div>
                    `;

                    this.addOutput(output + successHTML, 'system');
                }).catch(error => {
                    this.addOutput(`
                        <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                            <span class="text-red-400">❌ Erreur lors de la récupération des informations réseau: ${error.message}</span>
                        </div>
                    `, 'error');
                });
            }, 100);
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
                this.commands.man.call(this, ['cookies']);
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
                this.commands.man.call(this, ['tree']);
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

            // Recherche récursive dans TOUS les répertoires enfants
            if (node.type === 'directory' && node.children) {
                Object.keys(node.children).forEach(childName => {
                const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;
                const childNode = node.children[childName];
                
                // Continuer la recherche récursivement pour chaque enfant
                search(childNode, childPath, depth + 1);
                });
            }
            };

            // Commencer la recherche depuis le nœud de départ
            search(startNode, resolvedPath);
            
            // Afficher tous les résultats trouvés
            if (results.length === 0) {
            this.addOutput(`find: aucun fichier trouvé correspondant aux critères`);
            } else {
            results.forEach(result => this.addOutput(result));
            }
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

            if (metadata.seeAlso && metadata.seeAlso.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">VOIR AUSSI</div>
                        <div class="ml-4">
                `;

                metadata.seeAlso.forEach(relatedCmd => {
                    output += `<span class="text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command mr-3" data-command="${relatedCmd}">${relatedCmd}</span>`;
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

        // Générateur de mots de passe
        genpass(args) {
            const options = this.parseOptions(args, {
            'l': 'length',
            'n': 'numbers',
            's': 'symbols',
            'u': 'uppercase',
            'c': 'count',
            'h': 'help'
            });
            
            // Help option
            if (options.help) {
                this.commands.man.call(this, ['genpass']);
                return;
            }
            
            // Rechercher un nombre dans les arguments pour la longueur
            let length = parseInt(options.length) || 12;
            const numberArg = args.find(arg => /^\d+$/.test(arg));
            if (numberArg) {
            length = parseInt(numberArg);
            }
            
            // Nombre de mots de passe à générer
            let count = parseInt(options.count) || 1;
            if (count > 10) count = 10; // Limite pour éviter le spam
            
            // Support des options négatives avec "-"
            const includeNumbers = !args.includes('-n') && options.numbers !== false;
            const includeSymbols = !args.includes('-s') && options.symbols !== false;
            const includeUppercase = !args.includes('-u') && options.uppercase !== false;
            
            // Validation de la longueur
            if (length < 4 || length > 128) {
            this.addOutput('<span class="text-red-400">❌ Erreur: la longueur doit être entre 4 et 128 caractères</span>', 'error');
            return;
            }
            
            let chars = 'abcdefghijklmnopqrstuvwxyz';
            if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (includeNumbers) chars += '0123456789';
            if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.?';
            
            // Génération des mots de passe
            for (let p = 0; p < count; p++) {
            let password = '';
            for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // Calculer la force du mot de passe
            let strength = 0;
            let strengthText = '';
            let strengthColor = '';
            
            if (password.length >= 8) strength += 20;
            if (password.length >= 12) strength += 10;
            if (/[a-z]/.test(password)) strength += 15;
            if (/[A-Z]/.test(password)) strength += 15;
            if (/[0-9]/.test(password)) strength += 15;
            if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
            
            if (strength < 40) {
            strengthText = 'Faible';
            strengthColor = 'text-red-400';
            } else if (strength < 70) {
            strengthText = 'Moyen';
            strengthColor = 'text-yellow-400';
            } else if (strength < 90) {
            strengthText = 'Fort';
            strengthColor = 'text-green-400';
            } else {
            strengthText = 'Très fort';
            strengthColor = 'text-green-300';
            }
            
            const passwordHTML = `
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-2">
            <div class="flex items-center justify-between mb-3">
                <span class="font-bold text-blue-400">Mot de passe ${count > 1 ? '#' + (p + 1) : ''}</span>
                <span class="px-2 py-1 rounded text-xs font-semibold ${strengthColor} bg-gray-700">${strengthText}</span>
            </div>
            
            <div class="bg-gray-900 rounded-lg p-3 border border-gray-600 mb-3">
                <div class="flex items-center">
                <span class="font-mono text-lg text-green-300 select-all break-all flex-1 min-w-0 mr-3">${password}</span>
                <button onclick="navigator.clipboard.writeText('${password}').then(() => app.addOutput('🔐 Mot de passe copié!', 'system'))" 
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors duration-200 flex-shrink-0 whitespace-nowrap">
                📋 Copier
                </button>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Longueur</div>
                <div class="text-white font-mono">${password.length}</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Force</div>
                <div class="${strengthColor} font-semibold">${strength}/100</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Entropie</div>
                <div class="text-white font-mono">${Math.floor(Math.log2(Math.pow(chars.length, length)))} bits</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Charset</div>
                <div class="text-white font-mono">${chars.length}</div>
                </div>
            </div>
            </div>
            `;
            
            this.addOutput(passwordHTML, 'system');
            }
        },



        // Calculatrice
        calc(args) {
            const expression = args.join(' ');
            if (!expression) {
                this.addOutput('calc: utilisation: calc <expression>', 'error');
                return;
            }
            
            try {
                // Remplacer les opérateurs textuels
                let safeExpression = expression
                    .replace(/[^0-9+\-*/().\s]/g, '') // Sécurité basique
                    .replace(/\s+/g, '');
                    
                const result = Function('"use strict"; return (' + safeExpression + ')')();
                this.addOutput(`<span class="text-blue-400">📊 ${expression} = <span class="text-yellow-300 font-mono">${result}</span></span>`);
            } catch (error) {
                this.addOutput('calc: expression invalide', 'error');
            }
        },
        
        reboot() {
            // Notification de début de redémarrage
            this.showNotification({
            type: 'warning',
            title: '🔄 Redémarrage du système',
            message: 'Le système va redémarrer dans quelques secondes...',
            duration: 3000,
            actions: [
                {
                text: '⚡ Redémarrer maintenant',
                callback: () => {
                    window.location.reload();
                }
                }
            ]
            });

            // Notification de progression (après 1 seconde)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '⚙️ Arrêt des services',
                message: 'Fermeture des processus système en cours...',
                duration: 3000,
                closable: false
            });
            }, 1000);

            // Notification de sauvegarde (après 2.5 secondes)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '💾 Sauvegarde',
                message: 'Sauvegarde des données utilisateur...',
                duration: 2500,
                closable: false
            });
            }, 2500);

            // Notification de nettoyage (après 4 secondes)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '🧹 Nettoyage',
                message: 'Nettoyage de la mémoire système...',
                duration: 2000,
                closable: false
            });
            }, 4000);

            // Notification de compte à rebours (après 5.5 secondes)
            setTimeout(() => {
            let countdown = 5;
            const countdownNotificationId = this.showNotification({
                type: 'warning',
                title: `🔄 Redémarrage dans ${countdown} secondes`,
                message: 'Le système va redémarrer automatiquement',
                duration: 0,
                closable: false,
                showProgress: false,
                actions: [
                {
                    text: '⚡ Redémarrer immédiatement',
                    callback: () => {
                    window.location.reload();
                    }
                }
                ]
            });

            // Mise à jour du compte à rebours
            const countdownInterval = setInterval(() => {
                countdown--;
                const notification = document.getElementById(countdownNotificationId);
                if (notification && countdown > 0) {
                const titleElement = notification.querySelector('.font-semibold');
                if (titleElement) {
                    titleElement.textContent = `🔄 Redémarrage dans ${countdown} seconde${countdown > 1 ? 's' : ''}`;
                }
                } else {
                clearInterval(countdownInterval);
                }
            }, 1000);

            // Redémarrage final (après 5 secondes)
            setTimeout(() => {
                clearInterval(countdownInterval);
                this.closeNotification(countdownNotificationId);
                
                this.showNotification({
                type: 'success',
                title: '✨ Redémarrage en cours...',
                message: 'Le système redémarre maintenant',
                duration: 2000,
                closable: false,
                showProgress: true
                });
                
                // Rechargement final
                setTimeout(() => {
                window.location.reload();
                }, 1000);
            }, 5000);
            }, 5500);
        },

        newtab(args) {
            const title = args.join(' ').trim();
            const newTab = {
                id: this.nextTabId++,
                title: title || `Terminal ${this.nextTabId - 1}`,
                currentDir: '/home/user',
                outputHistory: [],
                isActive: false,
                history: []
            };
            
            this.saveCurrentTabState();
            this.tabs.push(newTab);
            this.switchToTab(newTab.id);
            this.renderTabs();
            
            
            this.addOutput(`<span class="text-green-400">✅ Nouvel onglet créé : ${newTab.title}</span>`, 'system');
        },

        closetab(args) {
            if (this.tabs.length <= 1) {
                this.addOutput('<span class="text-yellow-400">⚠️ Impossible de fermer le dernier onglet</span>', 'system');
                return;
            }

            let targetTabId = this.activeTabId;
            
            if (args.length > 0) {
                const tabNumber = parseInt(args[0]);
                if (!isNaN(tabNumber) && tabNumber > 0 && tabNumber <= this.tabs.length) {
                    targetTabId = this.tabs[tabNumber - 1].id;
                }
            }

            const tab = this.tabs.find(t => t.id === targetTabId);
            if (tab) {
                this.addOutput(`<span class="text-red-400">🗑️ Fermeture de l'onglet : ${tab.title}</span>`, 'system');
                this.closeTab(targetTabId);
            }
        },

        renametab(args) {
            const newTitle = args.join(' ').trim();
            if (!newTitle) {
                this.addOutput('renametab: utilisation: renametab <nouveau nom>', 'error');
                return;
            }

            this.renameTab(this.activeTabId, newTitle);
            this.addOutput(`<span class="text-blue-400">📝 Onglet renommé : ${newTitle}</span>`, 'system');
        },

        listtabs() {
            this.addOutput('<span class="font-bold text-blue-400">📋 Liste des onglets :</span>');
            this.tabs.forEach((tab, index) => {
                const activeIndicator = tab.isActive ? '<span class="text-green-400">●</span>' : '<span class="text-gray-500">○</span>';
                this.addOutput(`  ${activeIndicator} ${index + 1}. ${tab.title} <span class="text-gray-400">(${tab.currentDir})</span>`);
            });
        },

        switchtab(args) {
            if (args.length === 0) {
                this.addOutput('switchtab: utilisation: switchtab <numéro>', 'error');
                return;
            }

            const tabNumber = parseInt(args[0]);
            if (isNaN(tabNumber) || tabNumber < 1 || tabNumber > this.tabs.length) {
                this.addOutput(`switchtab: numéro d'onglet invalide (1-${this.tabs.length})`, 'error');
                return;
            }

            const targetTab = this.tabs[tabNumber - 1];
            this.switchToTab(targetTab.id);
            this.addOutput(`<span class="text-blue-400">🔄 Basculé vers l'onglet : ${targetTab.title}</span>`, 'system');
        },
        fullscreen() {
            app.fullscreen();
        },
        notify (args) {
            // Vérifier d'abord si --help est présent avant de parser les options
            if (args.includes('--help') || args.includes('-h')) {
            // Utiliser la fonction man pour afficher l'aide de notify
            this.commands.man.call(this, ['notify']);
            return;
            }

            // Parser manuellement les arguments pour gérer correctement les espaces dans les valeurs
            let type = 'info';
            let title = 'Notification';
            let duration = 5000;
            let persistent = false;
            let action = null;
            let messageArgs = [];
            
            // Fonction pour extraire les valeurs entre guillemets ou un seul argument
            const extractQuotedValue = (args, startIndex) => {
            if (startIndex >= args.length) return { value: null, nextIndex: startIndex };
            
            const firstArg = args[startIndex];
            
            // Si l'argument commence par des guillemets
            if (firstArg.startsWith('"')) {
                // Si c'est un argument complet entre guillemets
                if (firstArg.endsWith('"') && firstArg.length > 1) {
                return { 
                    value: firstArg.slice(1, -1), // Enlever les guillemets
                    nextIndex: startIndex + 1 
                };
                }
                
                // Sinon, chercher la fin des guillemets dans les arguments suivants
                let result = firstArg.slice(1); // Enlever le guillemet du début
                let currentIndex = startIndex + 1;
                
                while (currentIndex < args.length) {
                const currentArg = args[currentIndex];
                if (currentArg.endsWith('"')) {
                    result += ' ' + currentArg.slice(0, -1); // Enlever le guillemet de fin
                    return { value: result, nextIndex: currentIndex + 1 };
                } else {
                    result += ' ' + currentArg;
                }
                currentIndex++;
                }
                
                // Si on arrive ici, les guillemets ne sont pas fermés
                return { value: result, nextIndex: currentIndex };
            } else {
                // Pas de guillemets, prendre juste l'argument
                return { value: firstArg, nextIndex: startIndex + 1 };
            }
            };
            
            for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '-t' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                type = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-T' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                title = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-d' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                const parsedDuration = parseInt(result.value);
                if (!isNaN(parsedDuration) && parsedDuration >= 0) {
                    duration = parsedDuration;
                }
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-p') {
                persistent = true;
            } else if (arg === '-a' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                action = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (!arg.startsWith('-')) {
                // C'est un argument du message
                messageArgs.push(arg);
            }
            }

            if (messageArgs.length === 0) {
            this.addOutput('notify: manque le message à afficher', 'error');
            this.addOutput('Utilisez "notify --help" pour plus d\'informations.');
            return;
            }

            const message = messageArgs.join(' ');
            
            // Déterminer le type de notification
            const validTypes = ['info', 'success', 'warning', 'error'];
            const notificationType = validTypes.includes(type) ? type : 'info';
            
            // Déterminer la durée finale
            if (persistent) {
            duration = 0; // Permanent
            }
            
            // Préparer les actions
            const actions = [];
            if (action) {
            actions.push({
                text: action,
                callback: () => {
                this.addOutput(`Action "${action}" exécutée`, 'system');
                }
            });
            }

            // Afficher la notification
            this.showNotification({
            type: notificationType,
            title: title,
            message: message,
            duration: duration,
            closable: true,
            actions: actions
            });

            // Utiliser la fonction existante createInfoBlock pour créer un bloc d'information structuré
            const notificationInfo = this.createInfoBlock({
            title: 'Configuration de la notification',
            icon: '📱',
            color: 'text-blue-400',
            bgColor: 'bg-blue-900/20',
            borderColor: 'border-blue-500',
            items: [
                { label: 'Type', value: notificationType, labelColor: 'text-blue-300' },
                { label: 'Titre', value: `"${title}"`, labelColor: 'text-purple-300' },
                { label: 'Message', value: `"${message}"`, labelColor: 'text-green-300' },
                { label: 'Durée', value: duration === 0 ? '∞ permanente' : duration + 'ms', labelColor: 'text-yellow-300' },
                { label: 'Persistante', value: persistent ? '✅ oui' : '❌ non', labelColor: 'text-orange-300' },
                { label: 'Action', value: action || '❌ aucune', labelColor: 'text-cyan-300' },
            ]
            });

            this.addOutput(notificationInfo, 'system');

            // Confirmer dans la console
            const durationText = duration === 0 ? 'permanente' : `${duration}ms`;
            this.addOutput(`📱 Notification ${notificationType} affichée (durée: ${durationText})`, 'system');
        },

        checkfile(args) {
            if (!args || args.length === 0) {
                this.addOutput('checkfile: manque un nom de fichier', 'error');
                return;
            }
            
            const fileName = args[0].trim();
            this.checkFileContent(fileName);
        },

    },

    // Nouvelle fonction helper pour l'éditeur
    openRichTextEditor(fileName, targetNode) {
        let modal = document.getElementById('edit-modal');
        if (!modal) {
        modal = this.createEditorModal();
        document.body.appendChild(modal);
        }
        
        modal.classList.remove('hidden');
        this.setupEditorContent(fileName, targetNode);
        
        // Setup handlers with safety check
        this.setupFormattingButtons();
        
        // Check if setupActionButtons exists before calling it
        if (typeof this.setupActionButtons === 'function') {
            this.setupActionButtons(fileName, targetNode, modal);
        } else {
            console.error('setupActionButtons n\'est pas définie');
            // Fallback pour les boutons
            const saveBtn = document.getElementById('edit-save-btn');
            const exitBtn = document.getElementById('edit-exit-btn');
            const closeBtn = document.getElementById('edit-close-x');
            
            if (saveBtn) {
                saveBtn.onclick = () => {
                    const editor = document.getElementById('edit-rich-text-editor');
                    if (editor) {
                        targetNode.content = editor.innerHTML;
                        this.saveFileSystemToCookie();
                        this.saveCurrentTabState();
                        this.addOutput(`✅ Fichier "${fileName}" sauvegardé`, 'system');
                        modal.classList.add('hidden');
                        this.commandInputElement.focus();
                    }
                };
            }
            
            // Fallback for close buttons
            const closeEditor = () => {
                modal.classList.add('hidden');
                this.commandInputElement.focus();
            };
            
            if (exitBtn) exitBtn.onclick = closeEditor;
            if (closeBtn) closeBtn.onclick = closeEditor;
        }
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts(fileName, targetNode, modal);
        
        // Focus the editor
        const editor = document.getElementById('edit-rich-text-editor');
        if (editor) {
            editor.focus();
        }
    },

    // Fonction pour créer le modal d'éditeur
    createEditorModal() {
        const modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4';
        modal.innerHTML = this.getEditorModalHTML();
        return modal;
    },

    // HTML du modal (séparé pour plus de lisibilité)
    getEditorModalHTML() {
        return `
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-4xl relative border border-gray-600/50 backdrop-blur-md">
            ${this.createEditorHeader()}
            ${this.createEditorToolbar()}
            ${this.createEditorTextArea()}
            ${this.createEditorFooter()}
        </div>
        `;
    },

    // Header de l'éditeur
    createEditorHeader() {
        return `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
            </div>
            <div>
                <h2 class="text-xl font-bold text-white">Éditeur de texte</h2>
                <p class="text-gray-400 text-sm" id="edit-filename-display">Modifiez votre fichier</p>
            </div>
            </div>
            <button id="edit-close-x" class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            </button>
        </div>
        `;
    },

    // Toolbar de l'éditeur
    createEditorToolbar() {
        const tools = [
        { id: 'bold', icon: 'B', title: 'Gras (Ctrl+B)', class: 'font-bold' },
        { id: 'italic', icon: 'I', title: 'Italique (Ctrl+I)', class: 'italic' },
        { id: 'underline', icon: 'U', title: 'Souligné (Ctrl+U)', class: 'underline' }
        ];

        const toolButtons = tools.map(tool => `
        <button type="button" id="edit-${tool.id}-btn" title="${tool.title}" 
            class="px-3 py-2 text-gray-300 hover:text-white hover:bg-blue-600 rounded-md transition-all duration-200 ${tool.class}">
            ${tool.icon}
        </button>
        `).join('');

        return `
        <div class="bg-gray-800/50 rounded-xl p-3 mb-4 border border-gray-600/30">
            <div class="flex flex-wrap gap-2 items-center">
            <div class="flex items-center bg-gray-700/50 rounded-lg p-1 space-x-1">
                ${toolButtons}
            </div>
            <div class="w-px h-6 bg-gray-600"></div>
            ${this.createColorAndSizeControls()}
            <div class="w-px h-6 bg-gray-600"></div>
            <button type="button" id="edit-removeformat-btn" title="Effacer le formatage" 
                class="px-3 py-2 bg-gray-700/50 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-all duration-200">
                🗑️ Effacer
            </button>
            </div>
        </div>
        `;
    },

    // Contrôles de couleur et taille
    createColorAndSizeControls() {
        return `
        <div class="flex items-center space-x-2">
            <label class="text-gray-400 text-sm">Couleur:</label>
            <input type="color" id="edit-color-picker" value="#ffffff" 
            class="w-8 h-8 rounded border border-gray-600 cursor-pointer">
        </div>
        <div class="flex items-center space-x-2">
            <label class="text-gray-400 text-sm">Taille:</label>
            <select id="edit-font-size-picker" class="px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 text-sm">
            <option value="1">Petit</option>
            <option value="3" selected>Normal</option>
            <option value="5">Grand</option>
            </select>
        </div>
        `;
    },

    // Zone de texte de l'éditeur
    createEditorTextArea() {
        return `
        <div class="relative mb-4">
            <div id="edit-rich-text-editor" contenteditable="true" 
            class="bg-gray-900/50 text-white border border-gray-600/50 rounded-xl p-4 h-64 focus:outline-none focus:border-blue-500 transition-all duration-200 overflow-y-auto"
            style="min-height: 256px; line-height: 1.5;">
            </div>
            <div class="absolute bottom-2 right-2 bg-gray-800/80 rounded px-2 py-1 text-xs text-gray-400">
            <span id="edit-char-count">0 caractères</span>
            </div>
        </div>
        `;
    },

    // Footer avec boutons
    createEditorFooter() {
        return `
        <div class="flex justify-between items-center">
            <div class="text-xs text-gray-400 flex items-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Ctrl+S pour sauvegarder • Échap pour quitter</span>
            </div>
            <div class="flex gap-2">
            <button id="edit-exit-btn" 
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200">
                ❌ Annuler
            </button>
            <button id="edit-save-btn" 
                class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200">
                💾 Enregistrer
            </button>
            </div>
        </div>
        `;
    },

    // Configuration du contenu de l'éditeur
    setupEditorContent(fileName, targetNode) {
        const editor = document.getElementById('edit-rich-text-editor');
        const filenameDisplay = document.getElementById('edit-filename-display');
        const charCount = document.getElementById('edit-char-count');

        editor.innerHTML = targetNode.content;
        filenameDisplay.textContent = `Édition de: ${fileName}`;
        
        // Compteur de caractères
        const updateCharCount = () => {
        const text = editor.textContent || editor.innerText || '';
        charCount.textContent = `${text.length} caractères`;
        };
        
        editor.addEventListener('input', updateCharCount);
        updateCharCount();
    },

    // Configuration des gestionnaires d'événements
    setupEditorHandlers(fileName, targetNode, modal) {
        const editor = document.getElementById('edit-rich-text-editor');
        
        // Boutons de formatage
        this.setupFormattingButtons();
        
        // Boutons d'action
        this.setupActionButtons(fileName, targetNode, modal);
        
        // Raccourcis clavier
        this.setupKeyboardShortcuts(fileName, targetNode, modal);
        
        editor.focus();
    },

    // Configuration des boutons de formatage
    setupFormattingButtons() {
        const buttons = [
        { id: 'edit-bold-btn', command: 'bold' },
        { id: 'edit-italic-btn', command: 'italic' },
        { id: 'edit-underline-btn', command: 'underline' },
        { id: 'edit-removeformat-btn', command: 'removeFormat' }
        ];

        buttons.forEach(({ id, command }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = (e) => {
            e.preventDefault();
            document.execCommand(command, false, null);
            };
        }
        });

        // Gestion des couleurs et tailles
        this.setupColorAndSizeHandlers();
    },

    // Gestion couleur et taille
    setupColorAndSizeHandlers() {
        const colorPicker = document.getElementById('edit-color-picker');
        const fontSizePicker = document.getElementById('edit-font-size-picker');

        if (colorPicker) {
        colorPicker.addEventListener('change', function() {
            document.execCommand('foreColor', false, this.value);
        });
        }

        if (fontSizePicker) {
        fontSizePicker.addEventListener('change', function() {
            document.execCommand('fontSize', false, this.value);
        });
        }
    },

    saveFileSystemToLocalStorage() {
        try {
            const fileSystemData = JSON.stringify(this.fileSystem);
            localStorage.setItem('console_linux_filesystem', fileSystemData);
            localStorage.setItem('console_linux_filesystem_timestamp', Date.now().toString());
            console.log('Système de fichiers sauvegardé dans localStorage');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde dans localStorage:', error);
            return false;
        }
    },

    loadFileSystemFromLocalStorage() {
        try {
            const fileSystemData = localStorage.getItem('console_linux_filesystem');
            if (fileSystemData) {
                this.fileSystem = JSON.parse(fileSystemData);
                console.log('Système de fichiers chargé depuis localStorage');
                return true;
            }
        } catch (error) {
            console.error('Erreur lors du chargement depuis localStorage:', error);
        }
        return false;
    },

    // Boutons d'action (Sauvegarder/Annuler)
    setupActionButtons(fileName, targetNode, modal) {
        const saveBtn = document.getElementById('edit-save-btn');
        const exitBtn = document.getElementById('edit-exit-btn');
        const closeBtn = document.getElementById('edit-close-x');

        const saveFile = () => {
            const editor = document.getElementById('edit-rich-text-editor');
            if (!editor) {
                console.error('Éditeur non trouvé');
                return;
            }

            // CORRECTION: Sauvegarder le contenu dans le nœud
            targetNode.content = editor.innerHTML;
            
            // CORRECTION: Sauvegarder immédiatement dans le localStorage/cookie
            this.saveFileSystemToLocalStorage();
            
            // CORRECTION: Sauvegarder aussi dans les cookies comme backup
            this.saveFileSystemToCookie();
            
            // Notification de succès
            this.showNotification({
                type: 'success',
                title: '💾 Fichier sauvegardé',
                message: `${fileName} a été enregistré avec succès`,
                duration: 3000
            });
            
            // Confirmer dans la console
            this.addOutput(`<span class="text-green-400">✅ Fichier "${fileName}" sauvegardé avec succès</span>`, 'system');
            
            this.closeEditor(modal);
        };

        const closeEditor = () => {
            this.closeEditor(modal);
            this.addOutput('Édition annulée.', 'system');
        };

        // CORRECTION: Supprimer les doublons - utiliser seulement onclick OU addEventListener, pas les deux
        if (saveBtn) {
            saveBtn.onclick = saveFile;
            // SUPPRIMER cette ligne qui crée le doublon :
            // saveBtn.addEventListener('click', saveFile);
        }
        if (exitBtn) {
            exitBtn.onclick = closeEditor;
            // SUPPRIMER cette ligne qui crée le doublon :
            // exitBtn.addEventListener('click', closeEditor);
        }
        if (closeBtn) {
            closeBtn.onclick = closeEditor;
            // SUPPRIMER cette ligne qui crée le doublon :
            // closeBtn.addEventListener('click', closeEditor);
        }
    },
    
    // Raccourcis clavier
    setupKeyboardShortcuts(fileName, targetNode, modal) {
        const handleKeydown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        // CORRECTION: Déclencher la sauvegarde via le bouton pour assurer la cohérence
                        const saveBtn = document.getElementById('edit-save-btn');
                        if (saveBtn) {
                            saveBtn.click();
                        }
                        break;
                    case 'b':
                        e.preventDefault();
                        document.getElementById('edit-bold-btn').click();
                        break;
                    case 'i':
                        e.preventDefault();
                        document.getElementById('edit-italic-btn').click();
                        break;
                    case 'u':
                        e.preventDefault();
                        document.getElementById('edit-underline-btn').click();
                        break;
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.getElementById('edit-exit-btn').click();
            }
        };

        document.addEventListener('keydown', handleKeydown);
        
        // Nettoyer l'écouteur quand le modal se ferme
        modal.addEventListener('transitionend', () => {
            if (modal.classList.contains('hidden')) {
                document.removeEventListener('keydown', handleKeydown);
            }
        });
    },

    initFileSystem() {
        // Essayer de charger depuis localStorage d'abord
        if (this.loadFileSystemFromLocalStorage()) {
            console.log('Système de fichiers chargé depuis localStorage');
            return;
        }
        
        // Sinon essayer les cookies
        if (this.loadFileSystemFromCookie()) {
            console.log('Système de fichiers chargé depuis les cookies');
            return;
        }
        
        console.log('Utilisation du système de fichiers par défaut');
    },

    checkFileContent(fileName) {
        const targetPath = this.resolvePath(fileName);
        const targetNode = this.getPath(targetPath);
        
        if (targetNode && targetNode.type === 'file') {
            this.addOutput(`<div class="bg-blue-900/20 border border-blue-500 rounded-lg p-3 mt-2">
                <div class="text-blue-400 font-bold mb-2">📄 Contenu actuel de "${fileName}":</div>
                <div class="bg-gray-800/50 p-2 rounded text-sm">
                    ${targetNode.content || '<span class="text-gray-400">Fichier vide</span>'}
                </div>
            </div>`, 'system');
        } else {
            this.addOutput(`Fichier "${fileName}" non trouvé`, 'error');
        }
    },

    

    // Fermeture de l'éditeur
    closeEditor(modal) {
        modal.classList.add('hidden');
        this.updatePrompt();
        this.commandInputElement.focus();
    },

    // --- Système de notifications popup à droite ---
    showNotification: function(options = {}) {
        // Configuration par défaut
        const config = {
            type: 'info', // 'success', 'warning', 'error', 'info'
            title: 'Notification',
            message: '',
            duration: 4000, // Durée en millisecondes (0 = permanent)
            closable: true,
            showProgress: true,
            icon: null, // Icône personnalisée ou null pour l'icône par défaut
            actions: [], // Tableau d'actions [{text: 'Action', callback: function() {}}]
            ...options
        };

        // Définir les styles et icônes par type
        const typeConfig = {
            success: {
                gradient: 'from-green-600 to-green-500',
                borderColor: 'border-green-400/30',
                bgColor: 'bg-green-600',
                icon: `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>`
            },
            error: {
                gradient: 'from-red-600 to-red-500',
                borderColor: 'border-red-400/30',
                bgColor: 'bg-red-600',
                icon: `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>`
            },
            warning: {
                gradient: 'from-yellow-600 to-orange-500',
                borderColor: 'border-yellow-400/30',
                bgColor: 'bg-yellow-600',
                icon: `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>`
            },
            info: {
                gradient: 'from-blue-600 to-blue-500',
                borderColor: 'border-blue-400/30',
                bgColor: 'bg-blue-600',
                icon: `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>`
            }
        };

        // Obtenir la configuration du type
        const currentTypeConfig = typeConfig[config.type] || typeConfig.info;

        // Générer un ID unique
        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

        // Créer le conteneur de notifications s'il n'existe pas
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'fixed bottom-4 right-4 z-50 pointer-events-none space-y-2';
            notificationContainer.style.maxWidth = '300px';
            document.body.appendChild(notificationContainer);
        }

        // Créer la notification
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `transform translate-x-full transition-all duration-500 ease-out pointer-events-auto`;
        
        // Construire le HTML des actions (plus compactes)
        const actionsHTML = config.actions.length > 0 ? `
            <div class="flex items-center space-x-1 mt-2 pt-2 border-t border-white/10">
                ${config.actions.map((action, index) => `
                    <button onclick="app.handleNotificationAction('${notificationId}', ${index})" 
                        class="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors duration-200 font-medium">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        notification.innerHTML = `
            <div class="bg-gradient-to-r ${currentTypeConfig.gradient} text-white rounded-lg shadow-lg border ${currentTypeConfig.borderColor} backdrop-blur-sm min-w-[240px] max-w-[300px] transform transition-all duration-300 hover:scale-105">
                <div class="p-3">
                    <div class="flex items-start space-x-2">
                        <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            ${config.icon || currentTypeConfig.icon}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm leading-tight">${config.title}</div>
                            ${config.message ? `<div class="text-white/90 text-xs mt-1 leading-relaxed">${config.message}</div>` : ''}
                            ${actionsHTML}
                        </div>
                        ${config.closable ? `
                            <button onclick="app.closeNotification('${notificationId}')" 
                                class="text-white/60 hover:text-white transition-colors flex-shrink-0 ml-1 p-0.5 rounded hover:bg-white/10">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${config.showProgress && config.duration > 0 ? `
                    <div class="bg-white/10 h-0.5 overflow-hidden rounded-b-lg">
                        <div class="bg-white h-full transition-transform ease-linear" 
                            style="animation: slideProgress ${config.duration}ms linear forwards; transform: translateX(-100%);"></div>
                    </div>
                ` : ''}
            </div>
        `;

        // Ajouter les styles CSS pour l'animation de la barre de progression si nécessaire
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideProgress {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0%); }
                }
                
                #notification-container .notification-enter {
                    animation: notificationSlideIn 0.5s ease-out forwards;
                }
                
                #notification-container .notification-exit {
                    animation: notificationSlideOut 0.4s ease-in forwards;
                }
                
                @keyframes notificationSlideIn {
                    from { 
                        transform: translateX(100%) scale(0.8); 
                        opacity: 0;
                    }
                    to { 
                        transform: translateX(0) scale(1); 
                        opacity: 1;
                    }
                }
                
                @keyframes notificationSlideOut {
                    from { 
                        transform: translateX(0) scale(1); 
                        opacity: 1;
                    }
                    to { 
                        transform: translateX(100%) scale(0.8); 
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Stocker les actions dans une propriété globale pour y accéder depuis les callbacks
        if (!window.notificationActions) {
            window.notificationActions = {};
        }
        window.notificationActions[notificationId] = config.actions;

        // Ajouter la notification au conteneur
        notificationContainer.appendChild(notification);

        // Faire apparaître la notification avec une animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('notification-enter');
        }, 50);

        // Programmer la fermeture automatique si une durée est définie
        if (config.duration > 0) {
            setTimeout(() => {
                this.closeNotification(notificationId);
            }, config.duration);
        }

        // Retourner l'ID de la notification pour un contrôle externe si nécessaire
        return notificationId;
    },

    // Fonction pour fermer une notification
    closeNotification: function(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.classList.add('notification-exit');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                // Nettoyer les actions stockées
                if (window.notificationActions && window.notificationActions[notificationId]) {
                    delete window.notificationActions[notificationId];
                }
                
                // Réorganiser les notifications restantes
                this.reorganizeNotifications();
            }, 400);
        }
    },

    // Fonction pour réorganiser les notifications après fermeture
    reorganizeNotifications: function() {
        const container = document.getElementById('notification-container');
        if (container && container.children.length === 0) {
            // Si plus de notifications, on peut optionnellement masquer le conteneur
            // container.style.display = 'none';
        }
    },

    // Fonction pour gérer les actions des notifications
    handleNotificationAction: function(notificationId, actionIndex) {
        if (window.notificationActions && 
            window.notificationActions[notificationId] && 
            window.notificationActions[notificationId][actionIndex]) {
            
            const action = window.notificationActions[notificationId][actionIndex];
            if (typeof action.callback === 'function') {
                action.callback();
            }
            
            // Fermer la notification après l'action
            this.closeNotification(notificationId);
        }
    },

    // --- Event Handlers ---
    handleKeyDown(e) {
        if (this.isLoadingLLM) return;

        // Gestion spécifique des raccourcis Ctrl/Cmd dans le champ de commande SEULEMENT
        if (e.ctrlKey || e.metaKey) {
            const key = e.key ? e.key.toLowerCase() : String.fromCharCode(e.keyCode).toLowerCase();
            
            // Ne gérer que les raccourcis autorisés dans le champ de commande
            if (['l'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
                
                switch (key) {                                                
                    case 'l':
                        // Ctrl+L - Clear console
                        this.clearConsole();
                        break;
                    default:
                        break;
                }
            }
            return;
        }

        // Gestion des autres touches (navigation, etc.)
        if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const historyEntry = this.history[this.history.length - 1 - this.historyIndex];
                this.commandInputElement.value = historyEntry.cmd;
            }
        } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const historyEntry = this.history[this.history.length - 1 - this.historyIndex];
                this.commandInputElement.value = historyEntry.cmd;
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.commandInputElement.value = '';
            }
        } else if (e.key === 'Tab' || e.keyCode === 9) {
            e.preventDefault();
            this.handleTabCompletion();
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
        // Vérification de sécurité pour s'assurer que l'élément existe
        if (!this.historyModal) {
            this.addOutput('<span class="text-red-400">❌ Modal d\'historique non trouvé</span>', 'error');
            return;
        }
        
        this.historyModal.classList.remove('hidden');
        
        // Toujours appeler showHistory() pour remplir la liste
        this.showHistory();
        
        this.closeAllMenus();
    },

    closeHistoryModal() {
        if (this.historyModal) {
            this.historyModal.classList.add('hidden');
        }
    },

    showHistory() {
        // Vérification de sécurité
        if (!this.historyList) {
            this.addOutput('<span class="text-red-400">❌ Liste d\'historique non trouvée</span>', 'error');
            return;
        }
        
        // Nettoyer la liste existante
        this.historyList.innerHTML = '';
        
        // Vérifier si l'historique est vide
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="text-gray-400 text-center py-8">Aucun historique disponible</div>';
            return;
        }
        
        const history_empty = document.getElementById('history-empty');
        if (history_empty) {
            history_empty.classList.add('hidden');
        }

        this.history.slice().reverse().forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item bg-gray-800 rounded-lg p-4 mb-3 border border-gray-600 hover:bg-gray-700 transition-colors';
            
            const timeString = entry.time && entry.date ? 
                `${entry.date} ${entry.time}` : 
                'Date inconnue';
                
            historyItem.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-green-400 font-mono text-sm cursor-pointer hover:text-green-300 clickable-command" data-command="${entry.cmd}">${entry.cmd}</span>
                    <span class="text-gray-500 text-xs">${timeString}</span>
                </div>
                <div class="text-gray-300 text-sm">${entry.output}</div>
            `;
            
            this.historyList.appendChild(historyItem);
        });
        
        // Configurer les commandes cliquables
        this.setupClickableCommands();
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
        
        this.history = [...this.history, entry];
        this.saveHistoryToCookie();
        
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab) {
            activeTab.history = [...this.history];
            activeTab.historyIndex = this.historyIndex;
            this.saveTabsToCookie();
        }
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
        try {
            const fileSystemData = JSON.stringify(this.fileSystem);
            const compressedData = btoa(fileSystemData);
            
            // Diviser en chunks si trop gros
            const maxCookieSize = 4000; // Limite de sécurité pour les cookies
            const chunks = [];
            
            for (let i = 0; i < compressedData.length; i += maxCookieSize) {
                chunks.push(compressedData.slice(i, i + maxCookieSize));
            }
            
            // Sauvegarder le nombre de chunks
            document.cookie = `console_filesystem_chunks=${chunks.length};path=/;max-age=${365*24*60*60}`;
            
            // Sauvegarder chaque chunk
            chunks.forEach((chunk, index) => {
                document.cookie = `console_filesystem_${index}=${chunk};path=/;max-age=${365*24*60*60}`;
            });
            
            console.log(`Système de fichiers sauvegardé dans ${chunks.length} cookies`);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde dans les cookies:', error);
            return false;
        }
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

    setupClickableCommands() {
        const clickableCommands = document.querySelectorAll('.clickable-command');
        clickableCommands.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const command = element.getAttribute('data-command');
                if (command) {
                    this.commandInputElement.value = command;
                    this.commandInputElement.focus();
                    
                    // Auto-execute si la commande se termine par un espace (commande complète)
                    if (command.endsWith(' ')) {
                        // Supprimer l'espace final et exécuter
                        this.commandInputElement.value = command.trim();
                        this.handleCommandSubmit();
                    }
                }
            });
        });
    },

    fullscreen() {
        // Vérifier si l'API Fullscreen est supportée
        if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled && !document.mozFullScreenEnabled && !document.msFullscreenEnabled) {
            this.showNotification({
                type: 'error',
                title: '❌ Pleine écran non supporté',
                message: 'Votre navigateur ne supporte pas l\'API Fullscreen',
                duration: 5000
            });
            return;
        }

        const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

        if (isCurrentlyFullscreen) {
            // Sortir du mode pleine écran
            this.exitFullscreen();
        } else {
            // Entrer en mode pleine écran
            this.enterFullscreen();
        }
    },

    enterFullscreen() {
        const element = document.documentElement;
        
        const enterPromise = element.requestFullscreen ? element.requestFullscreen() :
                            element.webkitRequestFullscreen ? element.webkitRequestFullscreen() :
                            element.mozRequestFullScreen ? element.mozRequestFullScreen() :
                            element.msRequestFullscreen ? element.msRequestFullscreen() : 
                            Promise.reject('Fullscreen not supported');

        enterPromise.then(() => {
            // Mettre à jour l'icône du bouton fullscreen
            this.updateFullscreenButton(true);
            
            this.showNotification({
                type: 'success',
                title: '⛶ Mode pleine écran activé',
                message: 'Appuyez sur F11 ou Échap pour quitter',
                duration: 4000,
                actions: [
                    {
                        text: '🔲 Quitter',
                        callback: () => this.exitFullscreen()
                    }
                ]
            });

            // Ajouter l'écouteur pour la touche Échap
            this.addEscapeListener();
        }).catch(error => {
            console.error('Erreur lors de l\'entrée en pleine écran:', error);
            this.showNotification({
                type: 'error',
                title: '❌ Erreur pleine écran',
                message: 'Impossible d\'entrer en mode pleine écran',
                duration: 3000
            });
        });
    },

    exitFullscreen() {
        const exitPromise = document.exitFullscreen ? document.exitFullscreen() :
                           document.webkitExitFullscreen ? document.webkitExitFullscreen() :
                           document.mozCancelFullScreen ? document.mozCancelFullScreen() :
                           document.msExitFullscreen ? document.msExitFullscreen() :
                           Promise.reject('Exit fullscreen not supported');

        exitPromise.then(() => {
            // Mettre à jour l'icône du bouton fullscreen
            this.updateFullscreenButton(false);
            
            this.showNotification({
                type: 'info',
                title: '🔲 Mode fenêtré activé',
                message: 'Sortie du mode pleine écran',
                duration: 3000
            });

            // Supprimer l'écouteur pour la touche Échap
            this.removeEscapeListener();
        }).catch(error => {
            console.error('Erreur lors de la sortie de pleine écran:', error);
        });
    },

    updateFullscreenButton(isFullscreen) {
        // Chercher le bouton par son contenu ou sa fonction onclick
        const fullscreenButtons = document.querySelectorAll('button');
        let fullscreenButton = null;
        
        // Chercher le bon bouton par son contenu
        fullscreenButtons.forEach(button => {
            if (button.textContent.includes('Pleine écran') || 
                button.textContent.includes('plein écran') ||
                button.querySelector('svg')) {
                const hasFullscreenText = button.innerHTML.includes('Pleine écran') || 
                                        button.innerHTML.includes('plein écran');
                if (hasFullscreenText) {
                    fullscreenButton = button;
                }
            }
        });

        if (!fullscreenButton) return;

        const svgElement = fullscreenButton.querySelector('svg');
        if (!svgElement) return;

        if (isFullscreen) {
            // Icône pour sortir du pleine écran (compress/réduire)
            svgElement.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5M15 15l5.5 5.5"/>
            `;
            
            // Mettre à jour le texte du bouton
            const textElement = fullscreenButton.querySelector('div');
            if (textElement) {
                textElement.textContent = '🔲 Quitter plein écran';
            }
            
            fullscreenButton.title = "Quitter le pleine écran (Échap)";
        } else {
            // Icône pour entrer en pleine écran (expand/agrandir)
            svgElement.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            `;
            
            // Mettre à jour le texte du bouton
            const textElement = fullscreenButton.querySelector('div');
            if (textElement) {
                textElement.textContent = '⛶ Pleine écran';
            }
            
            fullscreenButton.title = "Pleine écran";
        }
    },

    addEscapeListener() {
        // Supprimer l'écouteur existant s'il y en a un
        this.removeEscapeListener();
        
        this.escapeHandler = (e) => {
            // Vérifier si la touche Échap est pressée
            if (e.key === 'Escape' || e.keyCode === 27) {
                const isCurrentlyFullscreen = !!(
                    document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement
                );
                
                if (isCurrentlyFullscreen) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.exitFullscreen();
                }
            }
        };
        
        // Ajouter l'écouteur avec capture pour s'assurer qu'il se déclenche en premier
        document.addEventListener('keydown', this.escapeHandler, true);
    },

    removeEscapeListener() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler, true);
            this.escapeHandler = null;
        }
    },

    initFullscreenHandlers() {
        // Gestionnaire pour les changements de pleine écran automatiques (F11, etc.)
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!(
                document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement || 
                document.msFullscreenElement
            );
            
            console.log('Fullscreen state changed:', isNowFullscreen); // Debug
            
            // Mettre à jour l'icône du bouton
            this.updateFullscreenButton(isNowFullscreen);
            
            if (isNowFullscreen) {
                this.addEscapeListener();
                console.log('Escape listener added'); // Debug
            } else {
                this.removeEscapeListener();
                console.log('Escape listener removed'); // Debug
            }
            
            // Mettre à jour l'affichage si nécessaire
            this.updatePromptDisplay();
        };

        // Écouter les événements de changement de pleine écran (support multi-navigateur)
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // Vérifier l'état initial au cas où on serait déjà en pleine écran
        const initialFullscreenState = !!(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement
        );
        
        if (initialFullscreenState) {
            this.updateFullscreenButton(true);
            this.addEscapeListener();
        }
    },

    updatePromptDisplay() {
        const promptLabel = document.getElementById('prompt-label');
        const consoleName = document.getElementById('console-name');
        const menuButtons = document.getElementById('menu-buttons');
        const appContainer = document.getElementById('app-container');
        const commandInput = document.getElementsByClassName('command-prompt');
        const commandForm = document.getElementById('command-form');

        if (promptLabel && commandInput && commandForm) {
            requestAnimationFrame(() => {

                const tempPromptElement = document.createElement('span');
                tempPromptElement.style.visibility = 'hidden';
                tempPromptElement.style.position = 'absolute';
                tempPromptElement.style.whiteSpace = 'nowrap';
                tempPromptElement.style.zIndex = '-1';
                tempPromptElement.innerHTML = promptLabel.innerHTML;
                tempPromptElement.className = promptLabel.className;
                document.body.appendChild(tempPromptElement);
                
                const promptWidth = tempPromptElement.getBoundingClientRect().width;
                document.body.removeChild(tempPromptElement);
                
                const formWidth = commandForm.getBoundingClientRect().width;
                const inputMinWidth = 150;
                const margin = 150;
                
                if (promptWidth + inputMinWidth + margin > formWidth) {
                    promptLabel.style.display = 'none';
                } else {
                    promptLabel.style.display = 'inline-flex';
                }
            });
        }

        if (consoleName && menuButtons) {
            requestAnimationFrame(() => {
            const consoleNameRect = consoleName.getBoundingClientRect();
            const menuButtonsRect = menuButtons.getBoundingClientRect();
            
            // Vérifier si les éléments se chevauchent horizontalement
            const overlap = !(consoleNameRect.right + 10 < menuButtonsRect.left || 
                    menuButtonsRect.right + 10 < consoleNameRect.left);
                        
            if (overlap) {
                consoleName.style.display = 'none';
            } else {
                consoleName.style.display = 'flex';
            }
            });
        }

        if (window.innerWidth <= 330) {
            appContainer.style.display = 'none';

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

            const smallScreenMessage = document.getElementById('small-screen-message');
            if (smallScreenMessage) {
                smallScreenMessage.style.display = 'none';
            }
        }
    },

    // --- Fonction utilitaire pour créer des blocs d'information stylisés ---
    createInfoBlock: function(options = {}) {
        const config = {
            title: 'Information',
            icon: '📄',
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-600',
            itemBgColor: 'bg-gray-700/30',
            items: [], // Array of {label: string, value: string, color?: string}
            collapsible: false,
            collapsed: false,
            id: null,
            customHTML: null, // HTML personnalisé à ajouter après les items
            ...options
        };

        // Générer un ID unique si non fourni
        const blockId = config.id || `info-block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Construire le HTML des items
        let itemsHTML = '';
        if (config.items && config.items.length > 0) {
            config.items.forEach(item => {
                const itemColor = item.color || config.color;
                const labelColor = item.labelColor || itemColor;
                const valueColor = item.valueColor || 'text-white';
                
                itemsHTML += `
                    <div class="flex justify-between p-2 ${item.bgColor || config.itemBgColor} rounded">
                        <span class="${labelColor} font-medium">${item.label}:</span>
                        <span class="${valueColor} font-mono">${item.value}</span>
                    </div>
                `;
            });
        }

        // Ajouter le HTML personnalisé si fourni
        if (config.customHTML) {
            itemsHTML += config.customHTML;
        }

        // Créer le bloc collapsible ou normal
        if (config.collapsible) {
            return `
                <div class="border ${config.borderColor} rounded-lg p-4 ${config.bgColor} mt-3">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors duration-200 p-2 rounded" onclick="
                        const content = document.getElementById('${blockId}-content');
                        const arrow = document.getElementById('${blockId}-arrow');
                        if (content.style.display === 'none' || content.style.display === '') {
                            content.style.display = 'block';
                            arrow.innerHTML = '▼';
                        } else {
                            content.style.display = 'none';
                            arrow.innerHTML = '▶';
                        }
                    ">
                        <div class="flex items-center">
                            <span class="text-lg mr-2">${config.icon}</span>
                            <span class="font-bold ${config.color} text-lg">${config.title}</span>
                        </div>
                        <span id="${blockId}-arrow" class="text-gray-400 text-sm transition-transform">${config.collapsed ? '▶' : '▼'}</span>
                    </div>
                    
                    <div id="${blockId}-content" style="display: ${config.collapsed ? 'none' : 'block'};" class="mt-3">
                        <div class="space-y-2 text-sm">
                            ${itemsHTML}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="border ${config.borderColor} rounded-lg p-4 ${config.bgColor} mt-3">
                    <div class="flex items-center mb-3">
                        <span class="text-lg mr-2">${config.icon}</span>
                        <span class="font-bold ${config.color} text-lg">${config.title}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        }
    },

    // --- Fonction utilitaire pour les animations de chargement ---
    createLoadingAnimation: function(options = {}) {
        const config = {
            id: 'loading-animation-' + Date.now(),
            title: 'Chargement en cours...',
            progressBarColors: 'from-blue-500 to-green-500',
            steps: [
                { text: 'Initialisation...', color: 'text-blue-400', delay: 0 },
                { text: 'Traitement des données...', color: 'text-yellow-400', delay: 300 },
                { text: 'Finalisation...', color: 'text-green-400', delay: 600 }
            ],
            duration: 1000, // Durée totale approximative
            ...options
        };

        // Créer le HTML de l'animation
        const loadingHTML = `
            <div id="${config.id}" class="mt-3 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
                <div class="flex items-center justify-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    <span class="text-blue-300 font-medium">${config.title}</span>
                </div>
                <div class="mt-3 space-y-2" id="${config.id}-steps">
                    ${config.steps.map((step, index) => `
                        <div class="flex items-center space-x-2 opacity-0 step-${index}" style="animation-delay: ${step.delay}ms">
                            <div class="animate-pulse w-2 h-2 bg-${step.color.split('-')[1]}-400 rounded-full" style="animation-delay: ${step.delay}ms"></div>
                            <span class="text-sm ${step.color}">${step.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 bg-gray-700 rounded-full h-2">
                    <div id="${config.id}-progress" class="bg-gradient-to-r ${config.progressBarColors} h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        `;

        // Ajouter directement au DOM sans passer par addOutput pour éviter la sauvegarde
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = loadingHTML;
        lineDiv.classList.add('loading-animation'); // Classe spéciale pour identifier les animations
        this.outputElement.insertBefore(lineDiv, this.consoleEndRefElement);
        this.scrollToBottom();

        // Animer les étapes
        setTimeout(() => {
            const stepsContainer = document.getElementById(`${config.id}-steps`);
            if (stepsContainer) {
                config.steps.forEach((step, index) => {
                    setTimeout(() => {
                        const stepElement = stepsContainer.querySelector(`.step-${index}`);
                        if (stepElement) {
                            stepElement.style.opacity = '1';
                            stepElement.style.transition = 'opacity 0.3s ease-in-out';
                        }
                    }, step.delay);
                });
            }
        }, 50);

        // Animation de la barre de progression
        let progress = 0;
        const progressBar = document.getElementById(`${config.id}-progress`);
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 95) progress = 95;
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }, 200);

        // Retourner un objet pour contrôler l'animation
        return {
            complete: () => {
                clearInterval(progressInterval);
                if (progressBar) {
                    progressBar.style.width = '100%';
                }
                setTimeout(() => {
                    const loadingElement = document.getElementById(config.id);
                    if (loadingElement && loadingElement.parentNode) {
                        // Supprimer l'élément parent (lineDiv) qui contient l'animation
                        const parentDiv = loadingElement.closest('.loading-animation');
                        if (parentDiv && parentDiv.parentNode) {
                            parentDiv.parentNode.removeChild(parentDiv);
                        }
                    }
                }, 500);
            },
            updateProgress: (percent) => {
                if (progressBar) {
                    progressBar.style.width = percent + '%';
                }
            },
            addStep: (text, color = 'text-gray-400') => {
                const stepsContainer = document.getElementById(`${config.id}-steps`);
                if (stepsContainer) {
                    const stepDiv = document.createElement('div');
                    stepDiv.className = 'flex items-center space-x-2';
                    stepDiv.innerHTML = `
                        <div class="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span class="text-sm ${color}">${text}</span>
                    `;
                    stepsContainer.appendChild(stepDiv);
                }
            }
        };
    },

};

// --- Initialize the App ---
document.addEventListener('DOMContentLoaded', function () {
    app.init();
    // Appel initial
    app.updatePromptDisplay();

    // Écoute du redimensionnement
    window.addEventListener('resize', () => app.updatePromptDisplay());
});