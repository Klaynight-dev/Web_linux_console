import { COMMAND_METADATA, commandHelpers } from './assets/cmdList.js';
import INodeFileSystem from './assets/I-Nodes/inode-filesystem.js';
import INodeAdapter from './assets/I-Nodes/inode-adapter.js';
import { inodeCommands, inodeUtilities } from './assets/I-Nodes/inode-commands.js';
import TabManager from './assets/tabs.js';
import { PluginManager } from './assets/plugin-manager.js';
import { SettingsManager } from './assets/settings-manager.js';
import { commands } from './assets/commands.js';
import StorageManager from './storage-manager.js';

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
    toggleTabsSizeButton: document.getElementById('toggle-tabs-size-button'),
    
    // Plugin Elements
    pluginManagerModal: document.getElementById('plugin-manager-modal'),
    pluginManagerButton: document.getElementById('plugin-manager-button'),
    closePluginManagerButton: document.getElementById('close-plugin-manager'),

    // Modal Elements
    codeImportModal: document.getElementById('code-import-modal'),
    codeToImportTextarea: document.getElementById('code-to-import-textarea'),
    cancelImportButton: document.getElementById('cancel-import-button'),
    confirmImportButton: document.getElementById('confirm-import-button'),
    aboutModal: document.getElementById('about-modal'),
    closeAboutModalButton: document.getElementById('close-about-modal'),
    cancelSettingsModal: document.getElementById('cancel-settings-modal'),
    saveSettingsModal: document.getElementById('save-settings-modal'),

    // History Modal Elements
    historyModal: document.getElementById('history-modal'),
    historyList: document.getElementById('history-list'),
    closeHistoryModalButton: document.getElementById('close-history-modal'),
    showHistoryButton: document.getElementById('show-history-button'),
    clearHistoryBtn: document.getElementById('clear-history-button'),

    // Settings Elements
    fontSizeRange: document.getElementById('font-size-range'),
    fontSizeValue: document.getElementById('font-size-value'),
    consoleOutput: document.getElementById('console-output'),
    themeSelect: document.getElementById('theme-select'),
    fontSelect: document.getElementById('font-family-select'),

    // Fond console
    bgType : document.getElementById('console-bg-type'),
    bgColor : document.getElementById('console-bg-color'),
    bgUrl : document.getElementById('console-bg-url'),
    bgFile : document.getElementById('console-bg-file'),
    bgImageImportGroup : document.getElementById('console-bg-image-import-group'),

    // --- État ---
    currentDir: '/home/user',
    history: [],
    historyIndex: -1,
    isLoadingLLM: false,
    disabledCommands: new Set(), // Commandes désactivées

    // 'file', 'tools', 'help', ou null
    awaitingPseudo: false,
    defaultMessage: `
<pre class="font-mono leading-none text-xs text-purple-400">
╔═══════════════════════════════════════╗
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;█████╗&nbsp;██╗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██╗&nbsp;&nbsp;██╗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██╔══██╗██║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██║&nbsp;██╔╝&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██║&nbsp;&nbsp;╚═╝██║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;█████╔╝&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██║&nbsp;&nbsp;██╗██║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██╔═██╗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;╚█████╔╝███████╗██║&nbsp;&nbsp;██╗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;╚════╝&nbsp;╚══════╝╚═╝&nbsp;&nbsp;╚═╝&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CONSOLE&nbsp;LINUX&nbsp;KLAYNIGHT&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
╚═══════════════════════════════════════╝
</pre>
<span class="text-orange-400">⚡ CLK Terminal Ready</span>
<span class="text-gray-300">Tapez "help" pour démarrer votre aventure.</span>`,


    // --- Initialization ---
    init() {
        // Initialiser le gestionnaire de paramètres
        this.settingsManager = new SettingsManager();
        
        // Initialiser le gestionnaire de plugins
        this.pluginManager = new PluginManager();
        
        // Initialiser le gestionnaire d'onglets EN PREMIER
        TabManager.init(this);
        
        // Event Listeners for command input - vérification de sécurité
        if (this.commandFormElement) {this.commandFormElement.addEventListener('submit', this.handleCommandSubmit.bind(this));}
        if (this.commandInputElement) {this.commandInputElement.addEventListener('keydown', this.handleKeyDown.bind(this));}

        // Event Listeners for Menus - vérification de sécurité
        if (this.fileMenuButton) {this.fileMenuButton.addEventListener('click', () => this.toggleMenu('file'));}
        if (this.toolsMenuButton) {this.toolsMenuButton.addEventListener('click', () => this.toggleMenu('tools'));}
        if (this.helpMenuButton) {this.helpMenuButton.addEventListener('click', () => this.toggleMenu('help'));}
        document.addEventListener('mousedown', this.handleClickOutsideMenu.bind(this));

        // Event Listeners for Modal - vérification de sécurité
        if (this.cancelImportButton) {this.cancelImportButton.addEventListener('click', this.closeCodeImportModal.bind(this));}
        if (this.confirmImportButton) {this.confirmImportButton.addEventListener('click', this.handleCodeImport.bind(this));}
        if (this.closeAboutModalButton) {this.closeAboutModalButton.addEventListener('click', this.closeAboutModal.bind(this));}

        // Event Listeners for Plugin Manager Modal
        if (this.pluginManagerButton) {
            this.pluginManagerButton.addEventListener('click', () => {
                this.closeAllMenus();
                this.openPluginManager();
            });
        }
        if (this.closePluginManagerButton) {this.closePluginManagerButton.addEventListener('click', this.closePluginManager.bind(this));}

        // Event Listeners for History Modal - vérification de sécurité
        if (this.showHistoryButton) {this.showHistoryButton.addEventListener('click', this.openHistoryModal.bind(this));}
        if (this.closeHistoryModalButton) {this.closeHistoryModalButton.addEventListener('click', this.closeHistoryModal.bind(this));}

        // Drag and Drop - vérification de sécurité
        if (this.appContainer) {
            this.appContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            this.appContainer.addEventListener('drop', this.handleDrop.bind(this));
        }
        if (this.toggleTabsSizeButton) {this.toggleTabsSizeButton.addEventListener('click', this.toggleTabsSize.bind(this));}

        this.updatePrompt();

        if (this.commandInputElement) {this.commandInputElement.focus();}

        // Initialiser les boutons de la modal de paramètres
        if (this.cancelSettingsModal) {
            this.cancelSettingsModal.onclick = function () {
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('hidden');
                }
            };
        }

        if (this.saveSettingsModal) {
            this.saveSettingsModal.onclick = function () {
                app.saveAllSettings();
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.classList.add('hidden');
                }
                app.showNotification({
                    type: 'success',
                    title: 'Paramètres sauvegardés',
                    message: 'Tous les paramètres ont été sauvegardés avec succès.',
                    duration: 2000
                });
            };
        }

        // Initialiser les gestionnaires des onglets de paramètres
        this.initSettingsModal();

        // Charger tous les paramètres sauvegardés
        this.loadAllSavedSettings();

        this.loadTheme();

        // Gestion du changement de police
        if (this.fontSelect) {
            this.fontSelect.addEventListener('change', function () {
                app.applyFontFamily(this.value);
            });
        }
        // Gestion de la taille de la police
        if (this.fontSizeRange && this.fontSizeValue && this.consoleOutput) {
            this.fontSizeRange.addEventListener('input', function () {
                app.fontSizeValue.textContent = this.value + 'px';
                app.applyFontSize(this.value);
            });
        }

        this.loadFontFamily();
        this.loadFontSize();
        this.loadConsoleBackground();

        // Gestion de l'arrière-plan de la console
        if (this.bgType && this.bgColor && this.bgUrl && this.bgFile && this.bgImageImportGroup) {
            this.bgType.addEventListener('change', function () {
                if (this.value === 'color') {
                    this.bgColor.style.display = 'inline-block';
                    this.bgUrl.style.display = 'none';
                    this.bgImageImportGroup.style.display = 'none';
                    // Restaure la dernière couleur utilisée
                    const lastColor = localStorage.getItem('console_bg_last_color') || '#1f2937';
                    this.bgColor.value = lastColor;
                    app.applyConsoleBackground('color', lastColor);
                } else {
                    this.bgColor.style.display = 'none';
                    this.bgUrl.style.display = 'inline-block';
                    this.bgImageImportGroup.style.display = 'block';
                    // Restaure la dernière image utilisée
                    const lastImage = localStorage.getItem('console_bg_last_image') || '';
                    this.bgUrl.value = lastImage;
                    app.applyConsoleBackground('image', lastImage);
                }
            });

            this.bgColor.addEventListener('input', function () {
                if (this.bgType.value === 'color') {
                    app.applyConsoleBackground('color', this.value);
                }
            });

            this.bgUrl.addEventListener('input', function () {
                if (this.bgType.value === 'image') {
                    app.applyConsoleBackground('image', this.value);
                }
            });

            this.bgFile.addEventListener('change', function () {
                if (this.bgType.value === 'image' && this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        app.applyConsoleBackground('image', e.target.result);
                        // Met à jour l'input URL pour garder la cohérence
                        this.bgUrl.value = e.target.result;
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

        this.loadHistoryFromCookie();
        this.initInodeSystem();

        // Charger les informations de version
        this.loadVersionInfo();
        this.updateWindowTitle();

        // Initialiser la gestion de l'écran pour mobile
        this.updatePromptDisplay();
        window.addEventListener('resize', this.updatePromptDisplay.bind(this));

        // Initialiser les gestionnaires de plein écran
        this.initFullscreenHandlers();
        
        // Charger les plugins au démarrage
        if (this.pluginManager) {
            this.pluginManager.loadAllPlugins().then(() => {
                console.log('Plugins chargés:', this.pluginManager.listPlugins());
                // Mettre à jour les statistiques dans l'interface si elle est ouverte
                if (document.getElementById('settings-modal') && !document.getElementById('settings-modal').classList.contains('hidden')) {
                    this.updateAdvancedSettingsStats();
                }
            }).catch(error => {
                console.warn('Erreur lors du chargement des plugins:', error);
            });
        }
        
        // Charger les commandes désactivées
        this.loadDisabledCommands();
        
        // Charger et appliquer tous les paramètres sauvegardés
        setTimeout(() => {
            this.loadAllSavedSettings();
            console.log('✅ Paramètres utilisateur chargés depuis les cookies');
        }, 50);
        
        // Peupler le répertoire bin après que tous les imports soient chargés
        // Utiliser un délai plus long pour s'assurer que tous les modules sont chargés
        setTimeout(() => {
            console.log('Attempting to populate bin directory...');
            this.populateBinDirectory();
        }, 100);

        // Initialiser le système d'optimisation pour éviter les erreurs HTTP 431
        setTimeout(() => {
            console.log('🔧 Initialisation du système d\'optimisation...');
            
            // Diagnostic initial
            this.diagnoseAndRepairStorage();
            
            // Démarrer le nettoyage automatique périodique
            this.cleanupStoragePeriodically();
            
            console.log('✅ Système d\'optimisation activé');
        }, 200);
    },

    // Méthode d'initialisation simplifiée en cas d'erreur de quota
    initWithDefaults() {
        console.log('🔄 Initialisation en mode récupération...');
        
        try {
            // Initialisation basique sans accès au localStorage
            this.settingsManager = new SettingsManager();
            this.pluginManager = new PluginManager();
            TabManager.init(this);
            
            // Event listeners essentiels seulement
            if (this.commandFormElement) {
                this.commandFormElement.addEventListener('submit', this.handleCommandSubmit.bind(this));
            }
            if (this.commandInputElement) {
                this.commandInputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
                this.commandInputElement.focus();
            }
            
            // Interface basique
            this.updatePrompt();
            this.initInodeSystem();
            
            console.log('✅ Mode récupération activé - fonctionnalités de base disponibles');
            
        } catch (error) {
            console.error('❌ Échec du mode récupération:', error);
            throw error;
        }
    },

    // Méthodes pour gérer les commandes désactivées
    loadDisabledCommands() {
        try {
            const savedDisabled = StorageManager.load('clk_disabled_commands', []);
            this.disabledCommands = new Set(Array.isArray(savedDisabled) ? savedDisabled : []);
        } catch (error) {
            console.warn('Erreur lors du chargement des commandes désactivées:', error);
            this.disabledCommands = new Set();
        }
    },

    saveDisabledCommands() {
        try {
            StorageManager.save('clk_disabled_commands', [...this.disabledCommands], true);
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde des commandes désactivées:', error);
        }
    },

    toggleCommandEnabled(commandName, enabled = null) {
        const isCurrentlyDisabled = this.disabledCommands.has(commandName);
        const newState = enabled !== null ? enabled : isCurrentlyDisabled;
        
        if (newState) {
            // Activer la commande (la retirer des désactivées)
            this.disabledCommands.delete(commandName);
        } else {
            // Désactiver la commande
            this.disabledCommands.add(commandName);
        }
        
        this.saveDisabledCommands();
        return newState;
    },

    isCommandEnabled(commandName) {
        return !this.disabledCommands.has(commandName);
    },

    // Modal pour gérer les commandes
    showCommandManagerModal() {
        // Vérifier si COMMAND_METADATA est disponible
        if (typeof COMMAND_METADATA === 'undefined' || !COMMAND_METADATA) {
            this.showNotification({
                type: 'error',
                title: 'Erreur',
                message: 'Les métadonnées des commandes ne sont pas encore chargées. Veuillez réessayer dans quelques instants.',
                duration: 3000
            });
            return;
        }
        
        // Collecter toutes les commandes disponibles
        const allCommands = new Map();
        
        // Commandes natives
        Object.keys(this.commands).forEach(cmd => {
            if (COMMAND_METADATA[cmd]) {
                allCommands.set(cmd, {
                    name: cmd,
                    description: COMMAND_METADATA[cmd].description,
                    category: COMMAND_METADATA[cmd].category,
                    type: 'native'
                });
            }
        });
        
        // Commandes des plugins
        if (this.pluginManager) {
            const pluginCommands = this.pluginManager.getAllCommands();
            pluginCommands.forEach(cmd => {
                allCommands.set(cmd.name, {
                    name: cmd.name,
                    description: cmd.description,
                    category: cmd.category || 'Plugin',
                    type: 'plugin'
                });
            });
        }
        
        // Grouper par catégorie
        const commandsByCategory = {};
        allCommands.forEach(cmd => {
            const category = cmd.category || 'Autre';
            if (!commandsByCategory[category]) {
                commandsByCategory[category] = [];
            }
            commandsByCategory[category].push(cmd);
        });
        
        // Construire le HTML du modal
        let categoriesHtml = '';
        Object.keys(commandsByCategory).sort().forEach(category => {
            const commands = commandsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
            const categoryId = category.replace(/\s+/g, '_').toLowerCase();
            const enabledCommandsInCategory = commands.filter(cmd => this.isCommandEnabled(cmd.name)).length;
            const totalCommandsInCategory = commands.length;
            
            categoriesHtml += `
                <div class="mb-6 category-section" data-category="${category}">
                    <div class="category-header bg-slate-700/40 border border-slate-600/40 rounded-xl p-4 cursor-pointer hover:bg-slate-600/40 transition-colors" data-target="category-${categoryId}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <svg class="category-chevron w-5 h-5 mr-3 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                                <svg class="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                <h3 class="text-lg font-bold text-white">${category}</h3>
                                <span class="ml-3 px-2 py-1 bg-slate-600/40 text-slate-300 rounded-lg text-xs font-medium category-count">
                                    ${enabledCommandsInCategory}/${totalCommandsInCategory}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="category-disable-btn px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-xs font-medium border border-red-500/30 hover:border-red-500/50" data-category="${category}" title="Désactiver toute la catégorie">
                                    <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                    </svg>
                                    Désactiver tout
                                </button>
                                <button class="category-enable-btn px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-xs font-medium border border-green-500/30 hover:border-green-500/50" data-category="${category}" title="Activer toute la catégorie">
                                    <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Activer tout
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="category-${categoryId}" class="category-content mt-3 grid gap-2">
                        ${commands.map(cmd => {
                            const isEnabled = this.isCommandEnabled(cmd.name);
                            const typeColor = cmd.type === 'native' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-purple-600/20 text-purple-300 border-purple-500/30';
                            
                            return `
                                <div class="command-item bg-slate-700/30 border border-slate-600/40 rounded-lg p-3 flex items-center justify-between">
                                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                                        <div class="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3"></path>
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center space-x-2 mb-1">
                                                <span class="text-white font-mono font-medium">${cmd.name}</span>
                                                <span class="px-2 py-1 rounded text-xs ${typeColor} border">${cmd.type === 'native' ? 'Native' : 'Plugin'}</span>
                                            </div>
                                            <p class="text-slate-400 text-sm truncate">${cmd.description}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-3 flex-shrink-0">
                                        <div class="flex items-center space-x-2">
                                            <span class="text-lg ${isEnabled ? 'text-green-400' : 'text-red-400'}">
                                                ${isEnabled ? '✓' : '✗'}
                                            </span>
                                            <span class="text-xs ${isEnabled ? 'text-green-400' : 'text-red-400'} font-medium">
                                                ${isEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
                                            </span>
                                        </div>
                                        <button class="command-info-btn w-7 h-7 bg-blue-600/30 hover:bg-blue-500/40 text-blue-300 rounded-full flex items-center justify-center transition-colors text-xs font-bold" data-command="${cmd.name}" title="Voir les détails de la commande">
                                            i
                                        </button>
                                        <div class="command-toggle ${isEnabled ? 'enabled' : ''}" data-command="${cmd.name}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        const modalHtml = `
        <div id="command-manager-modal" class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div class="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl max-w-4xl w-full text-slate-100 border border-slate-600/40 animate-slide-up max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between mb-6 flex-shrink-0">
                    <h2 class="text-2xl font-bold flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                            <svg class="w-5 h-5 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                            </svg>
                        </div>
                        Gestionnaire de Commandes
                    </h2>
                    <button id="close-command-manager-modal" class="w-8 h-8 bg-slate-600/50 text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-500/60 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                    <div class="flex items-center mb-2">
                        <svg class="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-blue-300 font-medium">Information</span>
                    </div>
                    <p class="text-slate-300 text-sm">
                        Gérez la visibilité des commandes dans l'aide et les manuels. Les commandes désactivées restent fonctionnelles mais n'apparaissent plus dans <code class="bg-slate-700 px-1 rounded">help</code> et <code class="bg-slate-700 px-1 rounded">man</code>.
                    </p>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    ${categoriesHtml}
                </div>
                
                <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-600/40 flex-shrink-0">
                    <div class="text-sm text-slate-400">
                        <span id="enabled-count">${allCommands.size - this.disabledCommands.size}</span> / ${allCommands.size} commandes activées
                    </div>
                    <div class="flex space-x-3">
                        <button id="export-commands-btn" class="px-3 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm" title="Exporter la configuration">
                            Exporter
                        </button>
                        <button id="import-commands-btn" class="px-3 py-2 bg-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors text-sm" title="Importer une configuration">
                            Importer
                        </button>
                        <button id="reset-commands-btn" class="px-4 py-2 bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 rounded-lg hover:bg-yellow-600/30 transition-colors text-sm">
                            Réinitialiser
                        </button>
                        <button id="close-command-manager-btn" class="px-6 py-2 bg-slate-600/50 text-white rounded-lg hover:bg-slate-500/60 transition-colors font-medium">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Ajouter le modal au body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Gestionnaires d'événements
        const modal = document.getElementById('command-manager-modal');
        const closeBtn = document.getElementById('close-command-manager-modal');
        const closeBtnBottom = document.getElementById('close-command-manager-btn');
        const resetBtn = document.getElementById('reset-commands-btn');
        const enabledCountSpan = document.getElementById('enabled-count');
        const exportBtn = document.getElementById('export-commands-btn');
        const importBtn = document.getElementById('import-commands-btn');

        // Ajout d'une barre de recherche
        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = 'Rechercher une commande...';
        searchBar.className = 'command-search-bar px-3 py-2 mb-4 w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400';
        modal.querySelector('.flex-1.overflow-y-auto').insertBefore(searchBar, modal.querySelector('.flex-1.overflow-y-auto').firstChild);
        
        const updateEnabledCount = () => {
            enabledCountSpan.textContent = allCommands.size - this.disabledCommands.size;
        };
        
        // Fonction pour mettre à jour le compteur d'une catégorie
        const updateCategoryCount = (categoryElement) => {
            const category = categoryElement.dataset.category;
            const commandItems = categoryElement.querySelectorAll('.command-item');
            const enabledItems = Array.from(commandItems).filter(item => {
                const toggle = item.querySelector('.command-toggle');
                return toggle.classList.contains('enabled');
            });
            
            const countElement = categoryElement.querySelector('.category-count');
            countElement.textContent = `${enabledItems.length}/${commandItems.length}`;
        };
        
        const closeModal = () => {
            modal.remove();
        };
        
        // Gestionnaires pour les toggles de commandes
        modal.querySelectorAll('.command-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const commandName = toggle.dataset.command;
                const isEnabled = toggle.classList.contains('enabled');
                const newState = !isEnabled;
                
                this.toggleCommandEnabled(commandName, newState);
                
                // Mettre à jour l'affichage du toggle
                if (newState) {
                    toggle.classList.add('enabled');
                } else {
                    toggle.classList.remove('enabled');
                }
                
                // Mettre à jour l'icône et le texte de statut
                const commandItem = toggle.closest('.command-item');
                const statusContainer = commandItem.querySelector('.flex.items-center.space-x-3.flex-shrink-0 .flex.items-center.space-x-2');
                const iconSpan = statusContainer.children[0]; // Premier enfant = icône
                const textSpan = statusContainer.children[1]; // Deuxième enfant = texte
                
                if (newState) {
                    // Commande activée
                    iconSpan.textContent = '✓';
                    iconSpan.className = 'text-lg text-green-400';
                    textSpan.textContent = 'ACTIVÉE';
                    textSpan.className = 'text-xs text-green-400 font-medium';
                } else {
                    // Commande désactivée
                    iconSpan.textContent = '✗';
                    iconSpan.className = 'text-lg text-red-400';
                    textSpan.textContent = 'DÉSACTIVÉE';
                    textSpan.className = 'text-xs text-red-400 font-medium';
                }
                
                // Mettre à jour le compteur de la catégorie
                const categoryElement = toggle.closest('.category-section');
                updateCategoryCount(categoryElement);
                updateEnabledCount();
                
                this.showNotification({
                    type: 'info',
                    title: 'Commande ' + (newState ? 'activée' : 'désactivée'),
                    message: `La commande "${commandName}" a été ${newState ? 'activée' : 'désactivée'}.`,
                    duration: 2000
                });
            });

            // Ajout d'une info-bulle sur chaque commande
            const commandItem = toggle.closest('.command-item');
            if (commandItem && commandItem.dataset.description) {
                toggle.title = commandItem.dataset.description;
            }
        });

        // Gestionnaires pour les boutons d'information
        modal.querySelectorAll('.command-info-btn').forEach(infoBtn => {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher la propagation du clic
                const commandName = infoBtn.dataset.command;
                this.showCommandInfoModal(commandName);
            });
        });
        
        // Réinitialiser toutes les commandes
        resetBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir réactiver toutes les commandes ?')) {
                this.disabledCommands.clear();
                this.saveDisabledCommands();
                
                // Mettre à jour l'affichage de tous les toggles
                modal.querySelectorAll('.command-toggle').forEach(toggle => {
                    toggle.classList.add('enabled');
                    
                    // Mettre à jour l'icône et le texte de statut
                    const commandItem = toggle.closest('.command-item');
                    const statusContainer = commandItem.querySelector('.flex.items-center.space-x-3.flex-shrink-0 .flex.items-center.space-x-2');
                    const iconSpan = statusContainer.children[0]; // Premier enfant = icône
                    const textSpan = statusContainer.children[1]; // Deuxième enfant = texte
                    
                    // Commande activée
                    iconSpan.textContent = '✓';
                    iconSpan.className = 'text-lg text-green-400';
                    textSpan.textContent = 'ACTIVÉE';
                    textSpan.className = 'text-xs text-green-400 font-medium';
                });
                
                // Mettre à jour tous les compteurs de catégories
                modal.querySelectorAll('.category-section').forEach(categoryElement => {
                    updateCategoryCount(categoryElement);
                });
                
                updateEnabledCount();
                
                this.showNotification({
                    type: 'success',
                    title: 'Commandes réinitialisées',
                    message: 'Toutes les commandes ont été réactivées.',
                    duration: 2000
                });
            }
        });

        // Exporter la configuration des commandes activées
        exportBtn.addEventListener('click', () => {
            const enabled = [];
            modal.querySelectorAll('.command-toggle.enabled').forEach(toggle => {
                enabled.push(toggle.dataset.command);
            });
            const config = { enabledCommands: enabled };
            const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'commandes_config.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Importer une configuration de commandes
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const config = JSON.parse(evt.target.result);
                        if (Array.isArray(config.enabledCommands)) {
                            modal.querySelectorAll('.command-toggle').forEach(toggle => {
                                const name = toggle.dataset.command;
                                if (config.enabledCommands.includes(name)) {
                                    toggle.classList.add('enabled');
                                } else {
                                    toggle.classList.remove('enabled');
                                }
                                // Mettre à jour l'icône et le texte de statut
                                const commandItem = toggle.closest('.command-item');
                                const statusContainer = commandItem.querySelector('.flex.items-center.space-x-3.flex-shrink-0 .flex.items-center.space-x-2');
                                const iconSpan = statusContainer.children[0];
                                const textSpan = statusContainer.children[1];
                                if (toggle.classList.contains('enabled')) {
                                    iconSpan.textContent = '✓';
                                    iconSpan.className = 'text-lg text-green-400';
                                    textSpan.textContent = 'ACTIVÉE';
                                    textSpan.className = 'text-xs text-green-400 font-medium';
                                } else {
                                    iconSpan.textContent = '✗';
                                    iconSpan.className = 'text-lg text-red-400';
                                    textSpan.textContent = 'DÉSACTIVÉE';
                                    textSpan.className = 'text-xs text-red-400 font-medium';
                                }
                            });
                            modal.querySelectorAll('.category-section').forEach(section => updateCategoryCount(section));
                            updateEnabledCount();
                            this.showNotification({
                                type: 'success',
                                title: 'Import réussi',
                                message: 'Configuration importée avec succès.',
                                duration: 2000
                            });
                        }
                    } catch (err) {
                        this.showNotification({
                            type: 'error',
                            title: 'Erreur import',
                            message: 'Fichier de configuration invalide.',
                            duration: 3000
                        });
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        // Recherche dynamique des commandes
        searchBar.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            modal.querySelectorAll('.command-item').forEach(item => {
                const name = item.querySelector('.command-name').textContent.toLowerCase();
                item.style.display = name.includes(value) ? '' : 'none';
            });
        });
        
        // Gestionnaires pour l'ouverture/fermeture des catégories
        modal.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Ne pas fermer si on clique sur les boutons d'action
                if (e.target.closest('.category-disable-btn') || e.target.closest('.category-enable-btn')) {
                    return;
                }
                
                const targetId = header.dataset.target;
                const content = document.getElementById(targetId);
                const chevron = header.querySelector('.category-chevron');
                
                if (content.style.display === 'none' || content.style.display === '') {
                    // Ouvrir
                    content.style.display = 'grid';
                    chevron.style.transform = 'rotate(90deg)';
                } else {
                    // Fermer
                    content.style.display = 'none';
                    chevron.style.transform = 'rotate(0deg)';
                }
            });
        });
        
        // Gestionnaire pour désactiver toute une catégorie
        modal.querySelectorAll('.category-disable-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                const categoryElement = btn.closest('.category-section');
                
                if (confirm(`Êtes-vous sûr de vouloir désactiver toutes les commandes de la catégorie "${category}" ?`)) {
                    const commandToggles = categoryElement.querySelectorAll('.command-toggle');
                    
                    commandToggles.forEach(toggle => {
                        const commandName = toggle.dataset.command;
                        this.toggleCommandEnabled(commandName, false);
                        toggle.classList.remove('enabled');
                        
                        // Mettre à jour l'affichage
                        const commandItem = toggle.closest('.command-item');
                        const statusContainer = commandItem.querySelector('.flex.items-center.space-x-3.flex-shrink-0 .flex.items-center.space-x-2');
                        const iconSpan = statusContainer.children[0];
                        const textSpan = statusContainer.children[1];
                        
                        iconSpan.textContent = '✗';
                        iconSpan.className = 'text-lg text-red-400';
                        textSpan.textContent = 'DÉSACTIVÉE';
                        textSpan.className = 'text-xs text-red-400 font-medium';
                    });
                    
                    updateCategoryCount(categoryElement);
                    updateEnabledCount();
                    
                    this.showNotification({
                        type: 'info',
                        title: 'Catégorie désactivée',
                        message: `Toutes les commandes de "${category}" ont été désactivées.`,
                        duration: 2000
                    });
                }
            });
        });
        
        // Gestionnaire pour activer toute une catégorie
        modal.querySelectorAll('.category-enable-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                const categoryElement = btn.closest('.category-section');
                const commandToggles = categoryElement.querySelectorAll('.command-toggle');
                
                commandToggles.forEach(toggle => {
                    const commandName = toggle.dataset.command;
                    this.toggleCommandEnabled(commandName, true);
                    toggle.classList.add('enabled');
                    
                    // Mettre à jour l'affichage
                    const commandItem = toggle.closest('.command-item');
                    const statusContainer = commandItem.querySelector('.flex.items-center.space-x-3.flex-shrink-0 .flex.items-center.space-x-2');
                    const iconSpan = statusContainer.children[0];
                    const textSpan = statusContainer.children[1];
                    
                    iconSpan.textContent = '✓';
                    iconSpan.className = 'text-lg text-green-400';
                    textSpan.textContent = 'ACTIVÉE';
                    textSpan.className = 'text-xs text-green-400 font-medium';
                });
                
                updateCategoryCount(categoryElement);
                updateEnabledCount();
                
                this.showNotification({
                    type: 'success',
                    title: 'Catégorie activée',
                    message: `Toutes les commandes de "${category}" ont été activées.`,
                    duration: 2000
                });
            });
        });
        
        // Mettre à jour les compteurs de catégories et configurer l'état d'ouverture/fermeture
        modal.querySelectorAll('.category-section').forEach((categoryElement, index) => {
            updateCategoryCount(categoryElement);
            
            const categoryId = categoryElement.querySelector('.category-header').dataset.target;
            const content = document.getElementById(categoryId);
            const chevron = categoryElement.querySelector('.category-chevron');
            
            // Fermer toutes les catégories par défaut
            content.style.display = 'none';
            chevron.style.transform = 'rotate(0deg)';
        });
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnBottom.addEventListener('click', closeModal);
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Support des touches
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    },

    showCommandInfoModal(commandName) {
        // Vérifier si COMMAND_METADATA est disponible
        if (typeof COMMAND_METADATA === 'undefined' || !COMMAND_METADATA) {
            this.showNotification({
                type: 'error',
                title: 'Erreur',
                message: 'Les métadonnées des commandes ne sont pas encore chargées. Veuillez réessayer dans quelques instants.',
                duration: 3000
            });
            return;
        }
        
        // Obtenir les métadonnées de la commande
        let metadata = COMMAND_METADATA[commandName];
        let isPluginCommand = false;
        let pluginCommand = null;
        
        // Si pas trouvé dans les commandes natives, chercher dans les plugins
        if (!metadata && this.pluginManager) {
            pluginCommand = this.pluginManager.getCommand(commandName);
            if (pluginCommand) {
                isPluginCommand = true;
                // Créer des métadonnées compatibles à partir de la commande du plugin
                metadata = {
                    description: pluginCommand.description || 'Commande de plugin',
                    synopsis: pluginCommand.name + (pluginCommand.usage ? ' ' + pluginCommand.usage : ''),
                    category: pluginCommand.category || 'Plugin',
                    options: pluginCommand.options || [],
                    examples: pluginCommand.examples || [],
                    seeAlso: pluginCommand.seeAlso || []
                };
            }
        }
        
        if (!metadata) {
            this.showNotification({
                type: 'error',
                title: 'Erreur',
                message: `Aucune information disponible pour la commande "${commandName}".`,
                duration: 3000
            });
            return;
        }

        // Construire le HTML du modal d'informations
        const infoModalHtml = `
        <div id="command-info-modal" class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center modal-content p-6">
            <div class="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl max-w-2xl w-full text-slate-100 border border-slate-600/40 animate-slide-up max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        Détails de la commande
                    </h2>
                    <button id="close-command-info-modal" class="w-8 h-8 bg-slate-600/50 text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-500/60 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="space-y-6">
                    <!-- Nom et description -->
                    <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                        <div class="flex items-center space-x-3 mb-3">
                            <div class="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3"></path>
                                </svg>
                            </div>
                            <span class="text-xl font-mono font-bold text-white">${commandName}</span>
                            <span class="px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30">
                                ${metadata.category || 'Autre'}
                            </span>
                            ${isPluginCommand ? '<span class="px-2 py-1 rounded text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30">PLUGIN</span>' : ''}
                        </div>
                        <p class="text-slate-300 leading-relaxed">${metadata.description}</p>
                        ${isPluginCommand && pluginCommand.plugin ? `<p class="text-slate-400 text-sm mt-2">Plugin: <span class="text-purple-400">${pluginCommand.plugin}</span></p>` : ''}
                    </div>

                    <!-- Synopsis -->
                    <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                        <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Synopsis
                        </h3>
                        <div class="bg-black/40 rounded-lg p-3 border border-slate-500/30">
                            <code class="text-green-400 font-mono">${metadata.synopsis}${metadata.helpOption && metadata.helpOption !== "None" ? ' ' + metadata.helpOption : ''}</code>
                        </div>
                    </div>

                    ${metadata.options && metadata.options.length > 0 ? `
                    <!-- Options -->
                    <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                        <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            Options disponibles
                        </h3>
                        <div class="space-y-2">
                            ${metadata.options.map(option => `
                                <div class="bg-black/20 rounded-lg p-3 border border-slate-500/20">
                                    <code class="text-blue-300 font-mono text-sm">${option}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${metadata.examples && metadata.examples.length > 0 ? `
                    <!-- Exemples -->
                    <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                        <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            Exemples d'utilisation
                        </h3>
                        <div class="space-y-3">
                            ${metadata.examples.map((example, index) => `
                                <div class="bg-black/40 rounded-lg p-3 border border-slate-500/30">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-xs text-slate-400 font-medium">Exemple ${index + 1}</span>
                                        <button class="copy-example-btn text-xs text-blue-400 hover:text-blue-300 transition-colors" data-command="${example}">
                                            Copier
                                        </button>
                                    </div>
                                    <code class="text-green-400 font-mono text-sm">${example}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="flex justify-end mt-6 pt-4 border-t border-slate-600/40">
                    <button id="close-command-info-modal-bottom" class="px-6 py-2 bg-slate-600/50 hover:bg-slate-500/60 text-slate-200 rounded-lg transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
        `;

        // Ajouter le modal au DOM
        document.body.insertAdjacentHTML('beforeend', infoModalHtml);
        const infoModal = document.getElementById('command-info-modal');

        // Gestionnaires d'événements pour fermer le modal
        const closeInfoModal = () => {
            infoModal.remove();
        };

        const closeBtn = document.getElementById('close-command-info-modal');
        const closeBtnBottom = document.getElementById('close-command-info-modal-bottom');

        closeBtn.addEventListener('click', closeInfoModal);
        closeBtnBottom.addEventListener('click', closeInfoModal);

        // Fermer en cliquant à l'extérieur
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                closeInfoModal();
            }
        });

        // Gestionnaires pour copier les exemples
        infoModal.querySelectorAll('.copy-example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                navigator.clipboard.writeText(command).then(() => {
                    btn.textContent = 'Copié !';
                    btn.classList.add('text-green-400');
                    setTimeout(() => {
                        btn.textContent = 'Copier';
                        btn.classList.remove('text-green-400');
                        btn.classList.add('text-blue-400');
                    }, 2000);
                }).catch(() => {
                    this.showNotification({
                        type: 'error',
                        title: 'Erreur de copie',
                        message: 'Impossible de copier la commande dans le presse-papiers.',
                        duration: 3000
                    });
                });
            });
        });

        // Support des touches
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeInfoModal();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
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
        // Vérifier si COMMAND_METADATA est disponible
        if (typeof COMMAND_METADATA === 'undefined' || !COMMAND_METADATA) {
            console.warn('COMMAND_METADATA not available yet, skipping bin commands generation');
            return {};
        }
        
        try {
            const commands = COMMAND_METADATA;
            const binCommands = {};
            
            Object.keys(commands).forEach(commandName => {
                binCommands[commandName] = {
                    type: 'file',
                    content: `Executable: ${commandName}`
                };
            });
            
            return binCommands;
        } catch (error) {
            console.error('Error generating bin commands:', error);
            return {};
        }
    },

    populateBinDirectory() {
        // Vérifier si COMMAND_METADATA est disponible
        if (typeof COMMAND_METADATA === 'undefined' || !COMMAND_METADATA) {
            console.warn('COMMAND_METADATA not available yet, bin directory not populated');
            return;
        }
        
        try {
            const binCommands = this.generateBinCommands();
            const binPath = this.getPath('/bin');
            
            if (binPath && binPath.type === 'directory') {
                Object.keys(binCommands).forEach(commandName => {
                    binPath.children[commandName] = binCommands[commandName];
                });
                console.log('Bin directory populated with', Object.keys(binCommands).length, 'commands');
            }
        } catch (error) {
            console.error('Error populating bin directory:', error);
        }
    },

    // --- Output Management ---
    addOutput(line, type = 'normal') {
        // Vérifier les paramètres d'affichage
        const showTimestamps = this.getSetting('show_timestamps', false);
        const showLineNumbers = this.getSetting('show_line_numbers', false);
        
        // Obtenir le compteur de ligne actuel
        if (!this.lineCounter) {
            this.lineCounter = 1;
        }
        
        const lineDiv = document.createElement('div');
        lineDiv.classList.add('console-line');
        
        // Construire le contenu de la ligne avec les préfixes optionnels
        let lineContent = '';
        
        // Ajouter le numéro de ligne si activé
        if (showLineNumbers) {
            const lineNumber = String(this.lineCounter).padStart(3, ' ');
            lineContent += `<span class="line-number text-gray-500 text-xs mr-2 font-mono select-none">${lineNumber}:</span>`;
            this.lineCounter++;
        }
        
        // Ajouter le timestamp si activé
        if (showTimestamps) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('fr-FR', { 
                hour12: false,
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit'
            });
            lineContent += `<span class="timestamp text-gray-500 text-xs mr-2 font-mono select-none">[${timeStr}]</span>`;
        }
        
        // Ajouter le contenu principal de la ligne
        lineContent += `<span class="line-content">${line}</span>`;
        
        lineDiv.innerHTML = lineContent;
        
        // Appliquer les styles selon le type
        if (type === 'command') {
            lineDiv.classList.add('text-gray-400');
        } else if (type === 'error') {
            lineDiv.classList.add('text-red-400');
        } else if (type === 'system') {
            lineDiv.classList.add('text-purple-400');
        }
        
        // Ajouter des classes CSS pour le styling
        if (showTimestamps) {
            lineDiv.classList.add('has-timestamp');
        }
        if (showLineNumbers) {
            lineDiv.classList.add('has-line-numbers');
        }
        
        this.outputElement.insertBefore(lineDiv, this.consoleEndRefElement);
        this.scrollToBottom();

        this.updateActiveTabOutputCount();
    },

    incrementActiveTabCommandCount(arg) {
        if (TabManager && typeof TabManager.incrementActiveTabCommandCount === 'function') {
            TabManager.incrementActiveTabCommandCount(arg);
        }
    },

    updateActiveTabOutputCount() {
        if (TabManager && typeof TabManager.updateActiveTabOutputCount === 'function') {
            TabManager.updateActiveTabOutputCount();
        }
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
        
        // Réinitialiser le compteur de ligne
        this.lineCounter = 1;
        
        // Toujours afficher le message après clear
        this.addOutput(this.defaultMessage, 'system');
        
        this.scrollToBottom();

        if (TabManager && typeof TabManager.updateActiveTabOutputCount === 'function') {
            TabManager.updateActiveTabOutputCount();
        }
        if (TabManager && typeof TabManager.incrementActiveTabCommandCount === 'function') {
            TabManager.incrementActiveTabCommandCount("clear");
        }
        if (TabManager && typeof TabManager.saveCurrentTabState === 'function') {
            TabManager.saveCurrentTabState();
        }
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

        if (TabManager && typeof TabManager.incrementActiveTabCommandCount === 'function') {
            TabManager.incrementActiveTabCommandCount();
        }

        this.historyIndex = -1;

        const [cmd, ...args] = commandText.split(/\s+/);
        
        // Vérifier d'abord dans les commandes natives
        const execute = this.commands[cmd];

        if (execute) {
            // Vérifier si la commande est activée
            if (!this.isCommandEnabled(cmd)) {
                this.addOutput(`bash: ${cmd}: commande désactivée`, 'error');
                this.addOutput(`<div class="text-gray-400 text-sm">Utilisez le menu Aide → Gestionnaire de commandes pour réactiver cette commande.</div>`);
                this.updatePrompt();
                this.commandInputElement.focus();
                return;
            }
            
            try {
                await execute.call(this, args);
            } catch (error) {
                this.addOutput(`Erreur lors de l'exécution de la commande ${cmd}: ${error.message}`, 'error');
                console.error(`Command execution error (${cmd}):`, error);
            }
        } else {
            // Vérifier dans les plugins si la commande n'existe pas nativement
            const pluginCommand = this.pluginManager ? this.pluginManager.getCommand(cmd) : null;
            
            if (pluginCommand) {
                // Vérifier si la commande plugin est activée
                if (!this.isCommandEnabled(cmd)) {
                    this.addOutput(`bash: ${cmd}: commande désactivée`, 'error');
                    this.addOutput(`<div class="text-gray-400 text-sm">Utilisez le menu Aide → Gestionnaire de commandes pour réactiver cette commande.</div>`);
                    this.updatePrompt();
                    this.commandInputElement.focus();
                    return;
                }
                
                try {
                    await pluginCommand.execute.call(this, args);
                } catch (error) {
                    this.addOutput(`Erreur lors de l'exécution du plugin ${cmd}: ${error.message}`, 'error');
                    console.error(`Plugin execution error (${cmd}):`, error);
                }
            } else {
                this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
            }
        }

        this.updatePrompt();
        this.commandInputElement.focus();
    },

    // Méthode pour exécuter une commande simple (refactorisée)
    async executeSingleCommandWithExitCode(commandText) {
        const [cmd, ...args] = commandText.split(/\s+/);
        
        // Vérifier si la commande est activée
        if (!this.isCommandEnabled(cmd)) {
            this.addOutput(`bash: ${cmd}: commande désactivée`, 'error');
            return 1; // Code d'erreur
        }
        
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
            // Vérifier dans les plugins
            const pluginCommand = this.pluginManager ? this.pluginManager.getCommand(cmd) : null;
            
            if (pluginCommand) {
                try {
                    await pluginCommand.execute.call(this, args);
                    return 0;
                } catch (error) {
                    this.addOutput(`Erreur lors de l'exécution du plugin ${cmd}: ${error.message}`, 'error');
                    return 1;
                }
            } else {
                this.addOutput(`bash: ${cmd}: commande introuvable`, 'error');
                return 1;
            }
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

    // Propriété commands pour les commandes natives
    commands: commands,

    // Fonction utilitaire pour télécharger le QR Code
    downloadQRCode(imgId, filename, format) {
        const img = document.getElementById(imgId);
        if (!img) {
            this.addOutput('❌ Erreur: Image QR Code non trouvée', 'error');
            return;
        }

        // Utiliser fetch pour télécharger l'image directement sans canvas
        const qrUrl = img.src;
        const cleanFilename = `qrcode-${filename.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
        
        fetch(qrUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = cleanFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.addOutput(`📥 QR Code téléchargé: ${cleanFilename}`, 'system');
            })
            .catch(error => {
                console.error('Erreur lors du téléchargement:', error);
                this.addOutput('❌ Erreur lors du téléchargement. Ouverture dans un nouvel onglet...', 'error');
                // Fallback: ouvrir l'image dans un nouvel onglet
                window.open(qrUrl, '_blank');
            });
    },

    // Fonction globale accessible depuis d'autres sites
    generateQRCodeAPI(text, options = {}) {
        const config = {
            size: options.size || 200,
            color: options.color || '000000',
            bgcolor: options.bgcolor || 'ffffff',
            format: options.format || 'png',
            errorLevel: options.errorLevel || 'M'
        };
        
        // Validation
        if (!text) {
            throw new Error('Le texte est requis pour générer un QR Code');
        }
        
        if (config.size < 50 || config.size > 1000) {
            throw new Error('La taille doit être entre 50 et 1000 pixels');
        }
        
        // Construire l'URL de l'API
        const encodedText = encodeURIComponent(text);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${config.size}x${config.size}&data=${encodedText}&color=${config.color}&bgcolor=${config.bgcolor}&format=${config.format}&ecc=${config.errorLevel}`;
        
        return {
            url: qrUrl,
            config: config,
            text: text,
            // Fonction pour obtenir l'image en tant que Promise
            getImage: () => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Impossible de charger le QR Code'));
                img.src = qrUrl;
            });
            },
            // Fonction pour télécharger directement l'image
            download: (filename = 'qrcode') => {
                // Utiliser fetch pour contourner les restrictions CORS
                fetch(qrUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${filename}.${config.format}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    })
                    .catch(error => {
                        console.error('Erreur lors du téléchargement:', error);
                        // Fallback: ouvrir l'image dans un nouvel onglet
                        window.open(qrUrl, '_blank');
                    });
            }
        };
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
                        const newContent = editor.innerHTML;
                        
                        // Utiliser le système I-Node si disponible
                        if (this.inodeAdapter) {
                            const filePath = this.resolvePath(fileName);
                            const success = this.inodeAdapter.writeFile(filePath, newContent);
                            if (success) {
                                this.addOutput(`✅ Fichier "${fileName}" sauvegardé (I-Node)`, 'system');
                            } else {
                                this.addOutput(`❌ Erreur lors de la sauvegarde de "${fileName}"`, 'error');
                                return;
                            }
                        } else {
                            // Fallback vers l'ancien système
                            targetNode.content = newContent;
                        }
                        
                        this.saveFileSystemToCookie();
                        this.saveFileSystemToLocalStorage();
                        this.saveCurrentTabState();
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

            const newContent = editor.innerHTML;
            
            // Utiliser le système I-Node si disponible
            if (this.inodeAdapter) {
                const filePath = this.resolvePath(fileName);
                const success = this.inodeAdapter.writeFile(filePath, newContent);
                if (!success) {
                    this.showNotification({
                        type: 'error',
                        title: '❌ Erreur de sauvegarde',
                        message: `Impossible de sauvegarder ${fileName}`,
                        duration: 3000
                    });
                    return;
                }
            } else {
                // Fallback vers l'ancien système
                targetNode.content = newContent;
            }
            
            // Sauvegarder immédiatement dans localStorage ET cookies
            this.saveFileSystemToLocalStorage();
            this.saveFileSystemToCookie();
            
            // UNE SEULE notification de succès
            this.showNotification({
                type: 'success',
                title: '💾 Fichier sauvegardé',
                message: `${fileName} a été enregistré avec succès`,
                duration: 3000
            });
            
            // UN SEUL message dans la console
            this.addOutput(`<span class="text-green-400">✅ Fichier "${fileName}" sauvegardé avec succès</span>`, 'system');
            
            this.closeEditor(modal);
        };

        const closeEditor = () => {
            this.closeEditor(modal);
            this.addOutput('Édition annulée.', 'system');
        };

        // NETTOYER et réaffecter les gestionnaires d'événements
        if (saveBtn) {
            // Supprimer tous les anciens écouteurs
            saveBtn.removeEventListener('click', saveBtn._saveFileHandler);
            saveBtn.onclick = null;
            
            // Fonction de sauvegarde avec vérification des changements
            const saveFileWithChanges = () => {
            const editor = document.getElementById('edit-rich-text-editor');
            if (!editor) {
                console.error('Éditeur non trouvé');
                return;
            }

            const currentContent = editor.innerHTML;
            const originalContent = targetNode.content;

            // Vérifier si le contenu a changé
            if (currentContent === originalContent) {
                this.showNotification({
                type: 'info',
                title: 'ℹ️ Aucun changement',
                message: 'Le fichier n\'a pas été modifié',
                duration: 2000
                });
                this.closeEditor(modal);
                this.addOutput(`<span class="text-yellow-400">ℹ️ Aucune modification détectée dans "${fileName}"</span>`, 'system');
                return;
            }

            // Il y a des changements, procéder à la sauvegarde
            
            // Utiliser le système I-Node si disponible
            if (this.inodeAdapter) {
                const filePath = this.resolvePath(fileName);
                const success = this.inodeAdapter.writeFile(filePath, currentContent);
                if (!success) {
                    this.showNotification({
                        type: 'error',
                        title: '❌ Erreur de sauvegarde',
                        message: `Impossible de sauvegarder ${fileName}`,
                        duration: 3000
                    });
                    return;
                }
            } else {
                // Fallback vers l'ancien système
                targetNode.content = currentContent;
            }
            
            // Sauvegarder immédiatement dans localStorage ET cookies
            this.saveFileSystemToLocalStorage();
            this.saveFileSystemToCookie();
            
            // UNE SEULE notification de succès
            this.showNotification({
                type: 'success',
                title: '💾 Fichier sauvegardé',
                message: `${fileName} a été enregistré avec succès`,
                duration: 3000
            });


            this.addOutput(`<span class="text-green-400">✅ Fichier "${fileName}" sauvegardé avec succès</span>`, 'system');

            this.closeEditor(modal);
            };
            
            // Ajouter le nouveau gestionnaire
            saveBtn._saveFileHandler = saveFileWithChanges;
            saveBtn.onclick = saveFileWithChanges;
        }
        
        if (exitBtn) {
            exitBtn.removeEventListener('click', exitBtn._closeHandler);
            exitBtn.onclick = null;
            exitBtn._closeHandler = closeEditor;
            exitBtn.onclick = closeEditor;
        }
        
        if (closeBtn) {
            closeBtn.removeEventListener('click', closeBtn._closeHandler);
            closeBtn.onclick = null;
            closeBtn._closeHandler = closeEditor;
            closeBtn.onclick = closeEditor;
        }
    },
    
    // Raccourcis clavier
    setupKeyboardShortcuts(fileName, targetNode, modal) {
        // Supprimer l'ancien gestionnaire s'il existe
        if (modal._keydownHandler) {
            document.removeEventListener('keydown', modal._keydownHandler, true);
        }

        const handleKeydown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        e.stopPropagation();
                        // Déclencher la sauvegarde UNE SEULE FOIS
                        const saveBtn = document.getElementById('edit-save-btn');
                        if (saveBtn && typeof saveBtn._saveFileHandler === 'function') {
                            saveBtn._saveFileHandler();
                        }
                        break;
                    case 'b':
                        e.preventDefault();
                        const boldBtn = document.getElementById('edit-bold-btn');
                        if (boldBtn) boldBtn.click();
                        break;
                    case 'i':
                        e.preventDefault();
                        const italicBtn = document.getElementById('edit-italic-btn');
                        if (italicBtn) italicBtn.click();
                        break;
                    case 'u':
                        e.preventDefault();
                        const underlineBtn = document.getElementById('edit-underline-btn');
                        if (underlineBtn) underlineBtn.click();
                        break;
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                const exitBtn = document.getElementById('edit-exit-btn');
                if (exitBtn && typeof exitBtn._closeHandler === 'function') {
                    exitBtn._closeHandler();
                }
            }
        };

        // Stocker la référence du gestionnaire sur le modal
        modal._keydownHandler = handleKeydown;
        
        // Ajouter l'écouteur avec capture
        document.addEventListener('keydown', handleKeydown, true);
    },

    initFileSystem() {
        // Essayer de charger depuis localStorage d'abord
        if (this.loadFileSystemFromLocalStorage()) {
            console.log('Système de fichiers chargé depuis localStorage');
            // Sauvegarder aussi dans les cookies pour backup
            this.saveFileSystemToCookie();
            return;
        }
        
        // Utiliser la nouvelle méthode optimisée
        if (this.loadFileSystemOptimized()) {
            console.log('Système de fichiers chargé avec succès');
        } else {
            console.log('Utilisation du système de fichiers par défaut');
            // Sauvegarder le système par défaut avec la méthode optimisée
            this.saveFileSystemOptimized();
        }

        // Charger le système I-Node depuis les cookies si disponible
        if (this.inodeAdapter) {
            if (this.loadInodeSystemFromCookie()) {
                console.log('Système I-Node chargé depuis les cookies');
            } else {
                console.log('Aucun système I-Node sauvegardé trouvé - utilisation du système par défaut');
                // Sauvegarder le système I-Node par défaut
                this.saveInodeSystemToCookie();
            }
        }
    },

    // --- Système I-Node ---
    initInodeSystem() {
        try {
            console.log('🔧 Initialisation du système I-Node...');
            
            // Créer l'adaptateur I-Node (les dépendances sont maintenant importées)
            this.inodeAdapter = new INodeAdapter(this);
            
            // Intégrer les nouvelles commandes
            Object.assign(this.commands, inodeCommands);
            
            // Intégrer les méthodes utilitaires
            Object.assign(this, inodeUtilities);
            
            // Redéfinir les méthodes de gestion du système de fichiers
            this.setupInodeCompatibility();
            
            // Charger le système de fichiers sauvegardé
            this.loadInodeFileSystem();
            
            // Peupler le répertoire bin après un court délai
            setTimeout(() => {
                if (this.inodeAdapter) {
                    this.inodeAdapter.populateBinDirectory();
                }
            }, 100);
            
            // Ajouter les métadonnées des nouvelles commandes
            this.addInodeCommandMetadata();
            
            console.log('✅ Système I-Node initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du système I-Node:', error);
            // Fallback vers l'ancien système
            this.initFileSystem();
        }
    },

    setupInodeCompatibility() {
        // Sauvegarder les méthodes originales
        this._originalGetPath = this.getPath;
        this._originalSaveFileSystem = this.saveFileSystemToCookie;
        this._originalLoadFileSystem = this.loadFileSystemFromCookie;
        this._originalSaveToLocalStorage = this.saveFileSystemToLocalStorage;
        this._originalLoadFromLocalStorage = this.loadFileSystemFromLocalStorage;

        // Redéfinir getPath pour utiliser l'adaptateur I-Node
        this.getPath = (path, fs = null) => {
            if (this.inodeAdapter) {
                return this.inodeAdapter.getPath(path);
            }
            return this._originalGetPath(path, fs || this.fileSystem);
        };

        // Redéfinir les méthodes de sauvegarde
        this.saveFileSystemToCookie = () => {
            if (this.inodeAdapter) {
                try {
                    const inodeData = this.inodeAdapter.export();
                    const compressedData = btoa(JSON.stringify(inodeData));
                    document.cookie = `console_inode_system=${compressedData};path=/;max-age=${365*24*60*60}`;
                    
                    const legacyFS = this.inodeAdapter.saveToLegacyFormat();
                    if (legacyFS) {
                        this.fileSystem = legacyFS;
                        this._originalSaveFileSystem.call(this);
                    }
                    
                    console.log('💾 Système I-Node sauvegardé');
                    return true;
                } catch (error) {
                    console.error('Erreur sauvegarde I-Node:', error);
                    return false;
                }
            }
            return this._originalSaveFileSystem.call(this);
        };

        this.loadFileSystemFromCookie = () => {
            try {
                const inodeCookieMatch = document.cookie.match(/(?:^|;\s*)console_inode_system=([^;]*)/);
                if (inodeCookieMatch && this.inodeAdapter) {
                    const inodeData = JSON.parse(atob(inodeCookieMatch[1]));
                    this.inodeAdapter.import(inodeData);
                    console.log('📁 Système I-Node chargé depuis cookie');
                    return true;
                }
            } catch (error) {
                console.warn('Erreur chargement I-Node, fallback vers ancien système:', error);
            }
            
            return this._originalLoadFileSystem.call(this);
        };

        this.saveFileSystemToLocalStorage = () => {
            if (this.inodeAdapter) {
                try {
                    const inodeData = this.inodeAdapter.export();
                    localStorage.setItem('console_inode_system', JSON.stringify(inodeData));
                    localStorage.setItem('console_inode_timestamp', Date.now().toString());
                    
                    const legacyFS = this.inodeAdapter.saveToLegacyFormat();
                    if (legacyFS) {
                        this.fileSystem = legacyFS;
                        return this._originalSaveToLocalStorage.call(this);
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Erreur sauvegarde localStorage I-Node:', error);
                    return false;
                }
            }
            return this._originalSaveToLocalStorage.call(this);
        };

        this.loadFileSystemFromLocalStorage = () => {
            try {
                const inodeData = localStorage.getItem('console_inode_system');
                if (inodeData && this.inodeAdapter) {
                    this.inodeAdapter.import(JSON.parse(inodeData));
                    console.log('📁 Système I-Node chargé depuis localStorage');
                    return true;
                }
            } catch (error) {
                console.warn('Erreur chargement localStorage I-Node, fallback:', error);
            }
            
            return this._originalLoadFromLocalStorage.call(this);
        };
    },

    loadInodeFileSystem() {
        // Essayer de charger depuis localStorage d'abord
        if (this.loadFileSystemFromLocalStorage()) {
            console.log('Système I-Node chargé depuis localStorage');
            // Sauvegarder aussi dans les cookies pour backup
            this.saveFileSystemToCookie();
            return;
        }
        
        // Utiliser la nouvelle méthode optimisée
        if (this.loadFileSystemOptimized()) {
            console.log('Système I-Node chargé avec succès');
            return;
        }
        
        console.log('Utilisation du système I-Node par défaut');
        // Sauvegarder le système par défaut avec la méthode optimisée
        this.saveFileSystemOptimized();
    },

    addInodeCommandMetadata() {
        // Ajouter les métadonnées des nouvelles commandes I-Node
        if (typeof COMMAND_METADATA !== 'undefined' && COMMAND_METADATA) {
            COMMAND_METADATA.ln = {
                category: 'Fichiers & Dossiers',
                description: 'Crée un lien dur vers un fichier',
                synopsis: 'ln [OPTIONS] SOURCE LIEN',
                helpOption: "[OPTIONS] <source> <lien>",
                options: ['-v : mode verbeux', '--help : affiche cette aide'],
                examples: ['ln file1.txt file2.txt', 'ln /home/user/important.txt /tmp/backup.txt'],
                seeAlso: ['cp', 'mv', 'stat', 'links']
            };

            COMMAND_METADATA.stat = {
                category: 'Fichiers & Dossiers',
                description: 'Affiche les informations détaillées d\'un fichier',
                synopsis: 'stat FICHIER',
                helpOption: "<fichier>",
                options: ['--help : affiche cette aide'],
                examples: ['stat welcome.txt', 'stat /home/user', 'stat .'],
                seeAlso: ['ls', 'links', 'du']
            };

            COMMAND_METADATA.links = {
                category: 'Fichiers & Dossiers',
                description: 'Affiche tous les liens vers un fichier',
                synopsis: 'links FICHIER',
                helpOption: "<fichier>",
                options: ['--help : affiche cette aide'],
                examples: ['links important.txt', 'links /home/user/document.pdf'],
                seeAlso: ['ln', 'stat', 'find']
            };

            COMMAND_METADATA.fsck = {
                category: 'Système & Processus',
                description: 'Vérifie l\'intégrité du système de fichiers',
                synopsis: 'fsck [OPTIONS]',
                helpOption: "[options]",
                options: ['-v : mode verbeux', '-f : force la vérification', '--help : affiche cette aide'],
                examples: ['fsck', 'fsck -v', 'fsck -f'],
                seeAlso: ['du', 'stat']
            };
        }
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

    // === COMMANDES DE GESTION DES PLUGINS ===
    
    plugins: function(args) {
        if (args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-gray-600 rounded-lg p-4 my-2">
                    <div class="text-purple-400 font-bold text-lg mb-2">PLUGINS - Gestionnaire de plugins</div>
                    <div class="text-gray-300 mb-2">Gère les plugins personnalisés pour étendre les fonctionnalités de la console.</div>
                    <div class="text-yellow-300 font-bold mb-1">UTILISATION:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">plugins [option]</div>
                    <div class="text-yellow-300 font-bold mb-1">OPTIONS:</div>
                    <div class="ml-4 space-y-1">
                        <div class="text-gray-300">list, ls        - Liste tous les plugins</div>
                        <div class="text-gray-300">enable &lt;nom&gt;   - Active un plugin</div>
                        <div class="text-gray-300">disable &lt;nom&gt;  - Désactive un plugin</div>
                        <div class="text-gray-300">remove &lt;nom&gt;   - Supprime un plugin</div>
                        <div class="text-gray-300">export         - Exporte la configuration</div>
                        <div class="text-gray-300">import &lt;json&gt;  - Importe une configuration</div>
                        <div class="text-gray-300">manager        - Ouvre l'interface de gestion</div>
                    </div>
                </div>
            `, 'system');
            return;
        }

        const action = args[0] || 'list';
        
        switch (action) {
            case 'list':
            case 'ls':
                this.listPlugins();
                break;
            case 'enable':
                if (args[1]) {
                    this.togglePlugin(args[1], true);
                } else {
                    this.addOutput('Erreur: nom du plugin requis. Usage: plugins enable &lt;nom&gt;', 'error');
                }
                break;
            case 'disable':
                if (args[1]) {
                    this.togglePlugin(args[1], false);
                } else {
                    this.addOutput('Erreur: nom du plugin requis. Usage: plugins disable &lt;nom&gt;', 'error');
                }
                break;
            case 'remove':
                if (args[1]) {
                    this.removePlugin(args[1]);
                } else {
                    this.addOutput('Erreur: nom du plugin requis. Usage: plugins remove &lt;nom&gt;', 'error');
                }
                break;
            case 'export':
                this.exportPluginConfig(false); // fromUI = false pour la commande console
                break;
            case 'import':
                if (args[1]) {
                    // Créer une méthode temporaire pour l'import via console
                    const jsonString = args.slice(1).join(' ');
                    try {
                        const result = this.pluginManager.importPluginConfig(jsonString);
                        if (result.success) {
                            this.addOutput(`
                                <div class="bg-green-900/30 border border-green-600 rounded-lg p-3 my-2">
                                    <div class="text-green-400 font-bold">Import réussi</div>
                                    <div class="text-gray-300 text-sm">${result.message}</div>
                                </div>
                            `, 'system');
                        } else {
                            this.addOutput(`Erreur lors de l'import: ${result.error}`, 'error');
                        }
                    } catch (error) {
                        this.addOutput(`Erreur lors de l'import: ${error.message}`, 'error');
                    }
                } else {
                    this.addOutput('Erreur: configuration JSON requise. Usage: plugins import &lt;json&gt;', 'error');
                }
                break;
            case 'manager':
                this.openPluginManager();
                break;
            default:
                this.addOutput(`Action inconnue: ${action}. Utilisez "plugins --help" pour l'aide.`, 'error');
        }
    },

    listPlugins() {
        const plugins = this.pluginManager.listPlugins();
        
        if (plugins.length === 0) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-gray-600 rounded-lg p-4 my-2">
                    <div class="text-yellow-400 font-bold">Aucun plugin installé</div>
                    <div class="text-gray-300 text-sm mt-2">Utilisez "plugins manager" pour ouvrir l'interface de gestion.</div>
                </div>
            `, 'system');
            return;
        }

        let output = `
            <div class="bg-gray-800/50 border border-purple-600 rounded-lg p-4 my-2">
                <div class="text-purple-400 font-bold text-lg mb-3">📦 Plugins installés (${plugins.length})</div>
        `;

        plugins.forEach(plugin => {
            const statusColor = plugin.enabled ? 'text-green-400' : 'text-red-400';
            const statusIcon = plugin.enabled ? '✅' : '❌';
            const typeColor = plugin.type === 'permanent' ? 'text-blue-400' : 'text-yellow-400';
            
            output += `
                <div class="border border-gray-600 rounded-lg p-3 mb-2 bg-gray-700/30">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                            <span class="${statusColor}">${statusIcon}</span>
                            <span class="text-white font-bold">${plugin.name}</span>
                            <span class="px-2 py-1 rounded text-xs ${typeColor} bg-gray-600">${plugin.type}</span>
                        </div>
                        <div class="${statusColor} text-sm">${plugin.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}</div>
                    </div>
                    <div class="text-gray-300 text-sm">
                        Commandes: ${plugin.commands.length > 0 ? plugin.commands.join(', ') : 'Aucune'}
                    </div>
                </div>
            `;
        });

        output += `</div>`;
        this.addOutput(output, 'system');
    },

    togglePlugin(pluginName, enabled) {
        const result = this.pluginManager.togglePlugin(pluginName, enabled);
        const action = enabled ? 'activé' : 'désactivé';
        const color = enabled ? 'text-green-400' : 'text-orange-400';
        
        this.addOutput(`<span class="${color}">Plugin "${pluginName}" ${action} avec succès.</span>`, 'system');
    },

    removePlugin(pluginName) {
        const result = this.pluginManager.removePlugin(pluginName);
        this.addOutput(`<span class="text-red-400">Plugin "${pluginName}" supprimé avec succès.</span>`, 'system');
    },

    exportPluginConfig(fromUI = false) {
        const config = this.pluginManager.exportPluginConfig();
        if (config) {
            // Créer un blob et déclencher le téléchargement
            const blob = new Blob([config], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clk-plugins-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (fromUI) {
                // Utiliser une notification popup pour l'interface utilisateur
                this.showNotification({
                    type: 'success',
                    title: 'Configuration exportée',
                    message: 'Le fichier a été téléchargé dans votre dossier de téléchargements.',
                    duration: 3000
                });
            } else {
                // Utiliser addOutput pour la console
                this.addOutput(`
                    <div class="bg-green-900/30 border border-green-600 rounded-lg p-3 my-2">
                        <div class="text-green-400 font-bold">Configuration exportée avec succès</div>
                        <div class="text-gray-300 text-sm">Le fichier a été téléchargé dans votre dossier de téléchargements.</div>
                    </div>
                `, 'system');
            }
        } else {
            if (fromUI) {
                this.showNotification({
                    type: 'error',
                    title: 'Erreur d\'export',
                    message: 'Erreur lors de l\'export de la configuration.'
                });
            } else {
                this.addOutput('Erreur lors de l\'export de la configuration.', 'error');
            }
        }
    },

    importplugin: function(args) {
        if (args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-gray-600 rounded-lg p-4 my-2">
                    <div class="text-blue-400 font-bold text-lg mb-2">IMPORTPLUGIN - Import de code plugin</div>
                    <div class="text-gray-300 mb-2">Importe du code JavaScript comme plugin personnalisé.</div>
                    <div class="text-yellow-300 font-bold mb-1">UTILISATION:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">importplugin &lt;nom&gt; &lt;code&gt;</div>
                    <div class="text-yellow-300 font-bold mb-1">EXEMPLE:</div>
                    <div class="ml-4 text-green-400 font-mono text-sm">importplugin mon_plugin "module.exports = { hello: { name: 'hello', description: 'Dit bonjour', execute: () => 'Bonjour!' } }"</div>
                </div>
            `, 'system');
            return;
        }

        if (args.length < 2) {
            this.addOutput('Erreur: nom du plugin et code requis. Usage: importplugin &lt;nom&gt; &lt;code&gt;', 'error');
            return;
        }

        const pluginName = args[0];
        const pluginCode = args.slice(1).join(' ');

        const result = this.pluginManager.importPluginFromCode(pluginCode, pluginName);
        
        if (result.success) {
            // Utiliser uniquement addOutput pour l'import via commande console
            this.addOutput(`
                <div class="bg-green-900/30 border border-green-600 rounded-lg p-3 my-2">
                    <div class="text-green-400 font-bold">Plugin importé avec succès</div>
                    <div class="text-gray-300 text-sm">Nom: ${result.name}</div>
                    <div class="text-gray-300 text-sm">Commandes: ${result.commands.join(', ')}</div>
                </div>
            `, 'system');
        } else {
            this.addOutput(`Erreur lors de l'import: ${result.error}`, 'error');
        }
    },

    // === MÉTHODES POUR L'INTERFACE PLUGIN MANAGER ===
    
    openPluginManager() {
        if (this.pluginManagerModal) {
            this.pluginManagerModal.classList.remove('hidden');
            this.refreshPluginManagerContent();
        } else {
            this.addOutput('Interface de gestion des plugins non disponible.', 'error');
        }
    },

    closePluginManager() {
        if (this.pluginManagerModal) {
            this.pluginManagerModal.classList.add('hidden');
        }
    },

    refreshPluginManagerContent() {
        // Configurer les gestionnaires d'événements pour les onglets
        const tabs = document.querySelectorAll('.plugin-tab');
        const contents = document.querySelectorAll('.plugin-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer la classe active de tous les onglets
                tabs.forEach(t => {
                    t.classList.remove('active-tab');
                    t.classList.add('bg-slate-600/20', 'text-slate-300', 'hover:bg-slate-600/30');
                    t.classList.remove('bg-purple-600/20', 'text-purple-300');
                });
                
                // Ajouter la classe active à l'onglet cliqué
                tab.classList.add('active-tab');
                tab.classList.remove('bg-slate-600/20', 'text-slate-300', 'hover:bg-slate-600/30');
                tab.classList.add('bg-purple-600/20', 'text-purple-300');
                
                // Cacher tous les contenus
                contents.forEach(content => content.classList.add('hidden'));
                
                // Afficher le contenu correspondant
                const tabId = tab.id.replace('plugin-tab-', '');
                const contentId = `plugin-content-${tabId}`;
                const targetContent = document.getElementById(contentId);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
                
                // Rafraîchir le contenu si nécessaire
                if (tabId === 'manage') {
                    this.refreshPluginsList();
                }
            });
        });
        
        // Configurer les gestionnaires d'événements pour les boutons
        this.setupPluginManagerEvents();
        
        // Rafraîchir la liste des plugins
        this.refreshPluginsList();
    },

    setupPluginManagerEvents() {
        // Bouton d'import de plugin
        const importBtn = document.getElementById('import-plugin-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const name = document.getElementById('plugin-name-input').value.trim();
                const code = document.getElementById('plugin-code-input').value.trim();
                
                if (!name) {
                    this.showNotification({
                        type: 'warning',
                        title: 'Nom requis',
                        message: 'Veuillez entrer un nom pour le plugin.'
                    });
                    return;
                }
                
                if (!code) {
                    this.showNotification({
                        type: 'warning',
                        title: 'Code requis',
                        message: 'Veuillez entrer le code du plugin.'
                    });
                    return;
                }
                
                const result = this.pluginManager.importPluginFromCode(code, name);
                
                if (result.success) {
                    this.showNotification({
                        type: 'success',
                        title: 'Plugin importé',
                        message: `Plugin "${result.name}" importé avec ${result.commands.length} commande(s).`
                    });
                    
                    // Vider les champs
                    document.getElementById('plugin-name-input').value = '';
                    document.getElementById('plugin-code-input').value = '';
                    
                    // Rafraîchir la liste
                    this.refreshPluginsList();
                } else {
                    this.showNotification({
                        type: 'error',
                        title: 'Erreur d\'import',
                        message: result.error
                    });
                }
            });
        }
        
        // Bouton pour effacer le code
        const clearBtn = document.getElementById('clear-plugin-code-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('plugin-name-input').value = '';
                document.getElementById('plugin-code-input').value = '';
            });
        }
        
        // Bouton d'export de configuration
        const exportBtn = document.getElementById('export-config-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportPluginConfig(true); // fromUI = true pour l'interface utilisateur
            });
        }
        
        // Bouton pour choisir un fichier de configuration
        const fileBtn = document.getElementById('import-config-file-btn');
        const fileInput = document.getElementById('config-file-input');
        if (fileBtn && fileInput) {
            fileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const config = e.target.result;
                        this.importPluginConfigFromText(config);
                    };
                    reader.readAsText(file);
                }
            });
        }
        
        // Bouton d'import depuis JSON
        const importJsonBtn = document.getElementById('import-config-json-btn');
        if (importJsonBtn) {
            importJsonBtn.addEventListener('click', () => {
                const jsonText = document.getElementById('config-json-input').value.trim();
                if (!jsonText) {
                    this.showNotification({
                        type: 'warning',
                        title: 'JSON requis',
                        message: 'Veuillez coller une configuration JSON.'
                    });
                    return;
                }
                
                this.importPluginConfigFromText(jsonText);
            });
        }
    },

    importPluginConfigFromText(jsonText) {
        const result = this.pluginManager.importPluginConfig(jsonText);
        
        if (result.success) {
            this.showNotification({
                type: 'success',
                title: 'Configuration importée',
                message: result.message
            });
            
            document.getElementById('config-json-input').value = '';
            this.refreshPluginsList();
        } else {
            this.showNotification({
                type: 'error',
                title: 'Erreur d\'import',
                message: result.error
            });
        }
    },

    refreshPluginsList() {
        const listContainer = document.getElementById('plugins-list');
        if (!listContainer) return;
        
        const plugins = this.pluginManager.listPlugins();
        
        if (plugins.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 text-lg mb-2">📦</div>
                    <div class="text-slate-400 font-medium">Aucun plugin installé</div>
                    <div class="text-slate-500 text-sm">Utilisez l'onglet "Importer" pour ajouter des plugins.</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        plugins.forEach(plugin => {
            const statusColor = plugin.enabled ? 'text-green-400' : 'text-red-400';
            const statusText = plugin.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ';
            const typeColor = plugin.type === 'permanent' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
            const typeText = plugin.type === 'permanent' ? 'Permanent' : 'Temporaire';
            
            html += `
                <div class="plugin-item bg-slate-700/30 border border-slate-600/40 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                <span class="text-purple-400">🔌</span>
                            </div>
                            <div>
                                <div class="text-white font-medium">${plugin.name}</div>
                                <div class="text-slate-400 text-xs">${plugin.commands.length} commande(s)</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button class="w-6 h-6 bg-blue-600/20 text-blue-300 rounded-full flex items-center justify-center hover:bg-blue-600/40 transition-colors plugin-info-btn" data-plugin="${plugin.name}" title="Informations sur le plugin">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                            <span class="px-2 py-1 rounded text-xs ${typeColor} border">${typeText}</span>
                            <span class="${statusColor} text-sm font-medium">${statusText}</span>
                        </div>
                    </div>
                    
                    <div class="text-slate-300 text-sm mb-3">
                        <strong>Commandes:</strong> ${plugin.commands.length > 0 ? plugin.commands.join(', ') : '<span class="text-slate-500 italic">Aucune commande disponible</span>'}
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-slate-400 text-sm">Activer/Désactiver:</span>
                            <div class="plugin-toggle ${plugin.enabled ? 'enabled' : ''}" data-plugin="${plugin.name}"></div>
                        </div>
                        <button class="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm remove-plugin-btn" data-plugin="${plugin.name}">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            `;
        });
        
        listContainer.innerHTML = html;
        
        // Ajouter les gestionnaires d'événements pour les toggles et boutons de suppression
        listContainer.querySelectorAll('.plugin-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const pluginName = toggle.dataset.plugin;
                const isEnabled = toggle.classList.contains('enabled');
                
                this.pluginManager.togglePlugin(pluginName, !isEnabled);
                
                this.showNotification({
                    type: 'info',
                    title: 'Plugin ' + (!isEnabled ? 'activé' : 'désactivé'),
                    message: `Plugin "${pluginName}" ${!isEnabled ? 'activé' : 'désactivé'} avec succès.`,
                    duration: 2000
                });
                
                // Rafraîchir la liste
                setTimeout(() => this.refreshPluginsList(), 100);
            });
        });

        listContainer.querySelectorAll('.plugin-info-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pluginName = btn.dataset.plugin;
                this.showPluginInfoModal(pluginName);
            });
        });
        
        listContainer.querySelectorAll('.remove-plugin-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pluginName = btn.dataset.plugin;
                
                if (confirm(`Êtes-vous sûr de vouloir supprimer le plugin "${pluginName}" ?`)) {
                    this.pluginManager.removePlugin(pluginName);
                    
                    this.showNotification({
                        type: 'success',
                        title: 'Plugin supprimé',
                        message: `Plugin "${pluginName}" supprimé avec succès.`,
                        duration: 2000
                    });
                    
                    this.refreshPluginsList();
                }
            });
        });
    },

    // Méthode pour afficher les informations détaillées d'un plugin
    showPluginInfoModal(pluginName) {
        const pluginInfo = this.pluginManager.getPluginInfo(pluginName);
        
        const modalHtml = `
        <div id="plugin-info-modal" class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div class="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl max-w-2xl w-full text-slate-100 border border-slate-600/40 animate-slide-up max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between mb-6 flex-shrink-0">
                    <h2 class="text-2xl font-bold flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                            <span class="text-white">🔌</span>
                        </div>
                        Informations du Plugin
                    </h2>
                    <button id="close-plugin-info-modal" class="w-8 h-8 bg-slate-600/50 text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-500/60 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="space-y-6">
                        <!-- Informations générales -->
                        <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                            <h3 class="text-lg font-bold text-white mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                </svg>
                                Informations générales
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span class="text-slate-400 text-sm">Nom:</span>
                                    <div class="text-white font-medium">${pluginInfo.name}</div>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-sm">Version:</span>
                                    <div class="text-white font-medium">${pluginInfo.version}</div>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-sm">Auteur:</span>
                                    <div class="text-white font-medium">${pluginInfo.author}</div>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-sm">Type:</span>
                                    <div class="text-white font-medium">
                                        <span class="px-2 py-1 rounded text-xs ${pluginInfo.type === 'permanent' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'}">
                                            ${pluginInfo.type === 'permanent' ? 'Permanent' : 'Temporaire'}
                                        </span>
                                    </div>
                                </div>
                                <div class="md:col-span-2">
                                    <span class="text-slate-400 text-sm">Statut:</span>
                                    <div class="text-white font-medium">
                                        <span class="${pluginInfo.enabled ? 'text-green-400' : 'text-red-400'} font-bold">
                                            ${pluginInfo.enabled ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                            <h3 class="text-lg font-bold text-white mb-3 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"></path>
                                </svg>
                                Description
                            </h3>
                            <p class="text-slate-300">${pluginInfo.description}</p>
                        </div>

                        <!-- Commandes -->
                        <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/40">
                            <h3 class="text-lg font-bold text-white mb-3 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                Commandes disponibles (${pluginInfo.commands.length})
                            </h3>
                            ${pluginInfo.commands.length > 0 ? 
                                pluginInfo.commands.map(cmd => `
                                    <div class="bg-slate-800/40 rounded-lg p-3 mb-3 border border-slate-600/30">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-green-400 font-mono font-bold text-lg">${cmd.name}</span>
                                            <div class="flex items-center space-x-2">
                                                ${cmd.category ? `<span class="text-xs text-slate-400 px-2 py-1 bg-slate-600/30 rounded">${cmd.category}</span>` : ''}
                                                <span class="text-xs text-slate-500 px-2 py-1 bg-slate-600/30 rounded">commande</span>
                                            </div>
                                        </div>
                                        <p class="text-slate-300 text-sm mb-2">${cmd.description}</p>
                                        ${cmd.synopsis ? `
                                            <div class="mb-2">
                                                <span class="text-yellow-300 text-xs font-semibold">Usage:</span>
                                                <code class="text-green-300 font-mono text-sm bg-slate-900/40 px-2 py-1 rounded ml-2">${cmd.synopsis}</code>
                                            </div>
                                        ` : ''}
                                        ${cmd.examples && cmd.examples.length > 0 ? `
                                            <div>
                                                <span class="text-blue-300 text-xs font-semibold">Exemples:</span>
                                                <div class="mt-1 space-y-1">
                                                    ${cmd.examples.map(example => `
                                                        <code class="block text-cyan-300 font-mono text-xs bg-slate-900/40 px-2 py-1 rounded cursor-pointer hover:bg-slate-900/60 transition-colors">${example}</code>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('') 
                                : 
                                '<div class="text-slate-400 italic text-center py-4">Aucune commande disponible</div>'
                            }
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-center mt-6 flex-shrink-0">
                    <button id="close-plugin-info-modal-btn" class="px-6 py-3 bg-slate-600/50 text-white rounded-xl hover:bg-slate-500/60 focus:outline-none focus:ring-2 focus:ring-slate-400/50 transition-all duration-300 border border-slate-500/40 font-medium">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
        `;

        // Ajouter le modal au body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Gestionnaires d'événements pour fermer le modal
        const modal = document.getElementById('plugin-info-modal');
        const closeBtn = document.getElementById('close-plugin-info-modal');
        const closeBtnBottom = document.getElementById('close-plugin-info-modal-btn');
        
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnBottom.addEventListener('click', closeModal);
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Support des touches
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
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
            useDesktopNotification: false, // Nouveau: utiliser les notifications de bureau natives
            useHybridMode: false, // Nouveau: afficher à la fois interface ET bureau
            ...options
        };

        // Si demandé, essayer d'afficher une notification de bureau native
        if (config.useDesktopNotification || config.useHybridMode) {
            this.showDesktopNotification(config);
        }

        // Si mode hybride OU si pas de notification bureau demandée, afficher l'interface
        if (!config.useDesktopNotification || config.useHybridMode) {
            return this.showUINotification(config);
        }
    },

    // Nouvelle fonction pour les notifications de bureau natives
    showDesktopNotification: function(config) {
        // Vérifier si les notifications de bureau sont supportées
        if (!('Notification' in window)) {
            console.warn('Les notifications de bureau ne sont pas supportées par ce navigateur');
            return false;
        }

        // Fonction pour créer la notification
        const createNotification = () => {
            // Icônes par type de notification
            const icons = {
                success: '/contents/img/logo.svg',
                error: '/contents/img/logo.svg', 
                warning: '/contents/img/logo.svg',
                info: '/contents/img/logo.svg'
            };

            const notificationConfig = {
                body: config.message,
                icon: config.icon || icons[config.type] || icons.info,
                badge: '/contents/img/logo.svg',
                tag: 'clk-console-' + config.type, // Remplace les notifications du même type
                requireInteraction: config.duration === 0, // Persiste si durée = 0
                silent: false
            };

            try {
                const notification = new Notification(config.title, notificationConfig);
                
                // Gérer les clics sur la notification
                notification.onclick = () => {
                    window.focus(); // Ramener l'application au premier plan
                    notification.close();
                };

                // Auto-fermeture si durée définie
                if (config.duration > 0) {
                    setTimeout(() => {
                        notification.close();
                    }, config.duration);
                }

                return notification;
            } catch (error) {
                console.warn('Erreur lors de la création de la notification de bureau:', error);
                return false;
            }
        };

        // Gérer les permissions
        if (Notification.permission === 'granted') {
            return createNotification();
        } else if (Notification.permission !== 'denied') {
            // Demander la permission
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    createNotification();
                } else {
                    console.warn('Permission refusée pour les notifications de bureau');
                }
            });
        } else {
            console.warn('Les notifications de bureau sont bloquées');
            return false;
        }
    },

    // Refactoriser l'ancienne fonction en fonction séparée pour l'interface
    showUINotification: function(config) {

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
            notificationContainer.className = 'fixed bottom-4 right-4 pointer-events-none space-y-2 notification-container';
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
                    dateElement.textContent = versionData.date || 'N/A';
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
        // Utiliser StorageManager pour le pseudo (garde les cookies pour compatibilité)
        StorageManager.save('pseudo', pseudo);
    },
    getPseudoFromCookie() {
        // Utiliser StorageManager pour le pseudo
        return StorageManager.load('pseudo', null);
    },

    saveHistoryToCookie() {
        // Utilise le nouveau StorageManager pour éviter les cookies volumineux
        StorageManager.save('console_history', this.history, true);
    },
    loadHistoryFromCookie() {
        const saved = StorageManager.load('console_history', []);
        this.history = Array.isArray(saved) ? saved : [];
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
        
        if (TabManager && TabManager.tabs && Array.isArray(TabManager.tabs) && TabManager.activeTabId) {
            const activeTab = TabManager.tabs.find(tab => tab.id === TabManager.activeTabId);
            if (activeTab) {
                activeTab.history = [...this.history];
                activeTab.historyIndex = this.historyIndex;
                TabManager.saveTabsToCookie();
            }
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
            // Utiliser le nouveau StorageManager au lieu des cookies
            const success = StorageManager.save('console_filesystem', this.fileSystem, true);
            if (success) {
                console.log('Système de fichiers sauvegardé dans localStorage');
                return true;
            } else {
                console.error('Erreur lors de la sauvegarde du système de fichiers');
                return false;
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du système de fichiers:', error);
            return false;
        }
    },

    // Méthodes pour la sauvegarde du système I-Node
    saveInodeSystemToCookie() {
        if (!this.inodeAdapter || !this.inodeAdapter.inodeFS) {
            return false;
        }

        try {
            // Exporter le système I-Node
            const inodeData = this.inodeAdapter.export();
            const inodeDataString = JSON.stringify(inodeData);
            const compressedData = btoa(inodeDataString);

            // Nettoyer les anciens cookies I-Node
            this.clearInodeSystemCookies();

            // Diviser en chunks si trop gros
            const maxCookieSize = 4000;
            const chunks = [];
            
            for (let i = 0; i < compressedData.length; i += maxCookieSize) {
                chunks.push(compressedData.slice(i, i + maxCookieSize));
            }
            
            // Sauvegarder le nombre de chunks
            document.cookie = `console_inode_chunks=${chunks.length};path=/;max-age=${365*24*60*60}`;
            
            // Sauvegarder chaque chunk
            chunks.forEach((chunk, index) => {
                document.cookie = `console_inode_${index}=${chunk};path=/;max-age=${365*24*60*60}`;
            });
            
            console.log(`Système I-Node sauvegardé dans ${chunks.length} cookies`);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du système I-Node:', error);
            return false;
        }
    },

    clearInodeSystemCookies() {
        try {
            // Supprimer les chunks existants
            const chunksMatch = document.cookie.match(/(?:^|;\s*)console_inode_chunks=([^;]*)/);
            if (chunksMatch) {
                const numChunks = parseInt(chunksMatch[1]);
                for (let i = 0; i < numChunks; i++) {
                    document.cookie = `console_inode_${i}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                }
            }
            
            // Supprimer le cookie de compte de chunks
            document.cookie = `console_inode_chunks=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } catch (error) {
            console.error('Erreur lors de la suppression des cookies I-Node:', error);
        }
    },

    loadInodeSystemFromCookie() {
        if (!this.inodeAdapter || !this.inodeAdapter.inodeFS) {
            return false;
        }

        try {
            // Vérifier le nombre de chunks
            const chunksMatch = document.cookie.match(/(?:^|;\s*)console_inode_chunks=([^;]*)/);
            if (!chunksMatch) return false;
            
            const numChunks = parseInt(chunksMatch[1]);
            if (isNaN(numChunks) || numChunks <= 0) return false;
            
            // Reconstituer les chunks
            let compressedData = '';
            for (let i = 0; i < numChunks; i++) {
                const chunkMatch = document.cookie.match(new RegExp(`(?:^|;\\s*)console_inode_${i}=([^;]*)`));
                if (!chunkMatch) {
                    console.warn(`Chunk I-Node ${i} manquant`);
                    return false;
                }
                compressedData += chunkMatch[1];
            }
            
            // Décompresser et parser les données
            const inodeDataString = atob(compressedData);
            const inodeData = JSON.parse(inodeDataString);
            
            // Importer dans le système I-Node
            this.inodeAdapter.import(inodeData);
            
            console.log('Système I-Node chargé depuis les cookies');
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement du système I-Node depuis les cookies:', error);
            return false;
        }
    },

    loadFileSystemFromCookie() {
        try {
            // Utiliser le nouveau StorageManager au lieu des cookies
            const fileSystemData = StorageManager.load('console_filesystem', null);
            if (fileSystemData) {
                this.fileSystem = fileSystemData;
                console.log('Système de fichiers chargé depuis localStorage');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors du chargement du système de fichiers:', error);
            return false;
        }
    },

    clearFileSystemCookies() {
        // Nettoyer les anciens chunks
        const chunksMatch = document.cookie.match(/(?:^|;\s*)console_filesystem_chunks=([^;]*)/);
        if (chunksMatch) {
            const oldNumChunks = parseInt(chunksMatch[1]);
            if (!isNaN(oldNumChunks)) {
                for (let i = 0; i < oldNumChunks; i++) {
                    document.cookie = `console_filesystem_${i}=;path=/;max-age=0`;
                }
            }
        }
        // Nettoyer le compteur de chunks
        document.cookie = `console_filesystem_chunks=;path=/;max-age=0`;
    },

    // === NOUVELLES MÉTHODES OPTIMISÉES POUR ÉVITER LES GROS COOKIES ===
    
    // Sauvegarde optimisée du système de fichiers avec compression intelligente
    saveFileSystemOptimized() {
        try {
            // Utiliser StorageManager qui gère automatiquement localStorage vs cookies
            const success = StorageManager.save('console_filesystem', this.fileSystem, true);
            
            if (success) {
                // Optionnel: sauvegarder également une version compressée pour les situations critiques
                this.saveCompressedBackup();
                return true;
            } else {
                console.error('Erreur lors de la sauvegarde optimisée du système de fichiers');
                return false;
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde optimisée du système de fichiers:', error);
            // Fallback vers localStorage direct en cas de problème
            try {
                localStorage.setItem('clk_filesystem_backup', JSON.stringify(this.fileSystem));
                console.log('Fallback: système de fichiers sauvegardé en localStorage direct');
                return true;
            } catch (fallbackError) {
                console.error('Erreur fallback:', fallbackError);
                return false;
            }
        }
    },

    // Sauvegarde optimisée du système I-Node avec gestion intelligente de l'espace
    saveInodeSystemOptimized() {
        if (!this.inodeAdapter || !this.inodeAdapter.inodeFS) {
            return false;
        }

        try {
            // Exporter et compresser les données I-Node
            const inodeData = this.inodeAdapter.export();
            
            // Utiliser StorageManager qui gère automatiquement localStorage vs cookies
            const success = StorageManager.save('console_inode_system', inodeData, true);
            
            if (success) {
                // Nettoyer les anciens cookies I-Node pour éviter l'accumulation
                this.clearInodeSystemCookies();
                return true;
            } else {
                console.error('Erreur lors de la sauvegarde optimisée du système I-Node');
                return false;
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde optimisée du système I-Node:', error);
            // Fallback vers localStorage direct
            try {
                const inodeData = this.inodeAdapter.export();
                localStorage.setItem('clk_inode_backup', JSON.stringify(inodeData));
                console.log('Fallback: système I-Node sauvegardé en localStorage direct');
                return true;
            } catch (fallbackError) {
                console.error('Erreur fallback I-Node:', fallbackError);
                return false;
            }
        }
    },

    // Sauvegarde compressée de secours pour les situations critiques
    saveCompressedBackup() {
        try {
            // Créer une version minifiée du système de fichiers
            const compressedFS = this.compressFileSystem(this.fileSystem);
            const compressedData = JSON.stringify(compressedFS);
            
            // Sauvegarder uniquement si la taille est raisonnable
            if (compressedData.length < 50000) { // 50KB max
                localStorage.setItem('clk_fs_compressed_backup', compressedData);
                console.log('Backup compressé sauvegardé:', compressedData.length, 'caractères');
            } else {
                console.warn('Backup compressé trop volumineux, ignoré');
            }
        } catch (error) {
            console.warn('Erreur lors de la création du backup compressé:', error);
        }
    },

    // Compression intelligente du système de fichiers
    compressFileSystem(fs) {
        const compressed = JSON.parse(JSON.stringify(fs)); // Deep clone
        
        // Fonction récursive pour compresser les nœuds
        const compressNode = (node) => {
            if (node.type === 'file') {
                // Tronquer les fichiers très volumineux mais conserver les petits
                if (node.content && node.content.length > 1000) {
                    node.content = node.content.substring(0, 1000) + '...[tronqué]';
                }
            } else if (node.type === 'directory' && node.children) {
                // Compresser récursivement les enfants
                Object.values(node.children).forEach(compressNode);
            }
        };
        
        compressNode(compressed);
        return compressed;
    },

    // Chargement optimisé avec fallback intelligent
    loadFileSystemOptimized() {
        try {
            // Essayer de charger depuis le StorageManager
            const fileSystemData = StorageManager.load('console_filesystem', null);
            if (fileSystemData) {
                this.fileSystem = fileSystemData;
                console.log('Système de fichiers chargé depuis le StorageManager');
                return true;
            }
            
            // Fallback vers l'ancien système de cookies si nécessaire
            if (this.loadFileSystemFromCookie()) {
                console.log('Système de fichiers chargé depuis les cookies (migration nécessaire)');
                // Migrer immédiatement vers le nouveau système
                this.saveFileSystemOptimized();
                return true;
            }
            
            // Fallback vers le backup direct localStorage
            const backupData = localStorage.getItem('clk_filesystem_backup');
            if (backupData) {
                this.fileSystem = JSON.parse(backupData);
                console.log('Système de fichiers restauré depuis le backup localStorage');
                return true;
            }
            
            console.log('Aucun système de fichiers trouvé, utilisation du système par défaut');
            return false;
        } catch (error) {
            console.error('Erreur lors du chargement optimisé du système de fichiers:', error);
            return false;
        }
    },

    // Chargement optimisé du système I-Node
    loadInodeSystemOptimized() {
        if (!this.inodeAdapter || !this.inodeAdapter.inodeFS) {
            return false;
        }

        try {
            // Essayer de charger depuis le StorageManager
            const inodeData = StorageManager.load('console_inode_system', null);
            if (inodeData) {
                this.inodeAdapter.import(inodeData);
                console.log('Système I-Node chargé depuis le StorageManager');
                return true;
            }
            
            // Fallback vers l'ancien système de cookies
            if (this.loadInodeSystemFromCookie()) {
                console.log('Système I-Node chargé depuis les cookies (migration nécessaire)');
                // Migrer immédiatement vers le nouveau système
                this.saveInodeSystemOptimized();
                return true;
            }
            
            // Fallback vers le backup direct localStorage
            const backupData = localStorage.getItem('clk_inode_backup');
            if (backupData) {
                const inodeData = JSON.parse(backupData);
                this.inodeAdapter.import(inodeData);
                console.log('Système I-Node restauré depuis le backup localStorage');
                return true;
            }
            
            console.log('Aucun système I-Node trouvé');
            return false;
        } catch (error) {
            console.error('Erreur lors du chargement optimisé du système I-Node:', error);
            return false;
        }
    },

    // Nettoyage préventif pour éviter l'accumulation de données
    cleanupStoragePeriodically() {
        try {
            // Lancer le nettoyage d'urgence du StorageManager
            if (window.StorageManager && typeof window.StorageManager.emergencyCleanup === 'function') {
                const cleanedCount = window.StorageManager.emergencyCleanup();
                if (cleanedCount > 0) {
                    console.log(`Nettoyage préventif effectué: ${cleanedCount} éléments traités`);
                }
            }
            
            // Nettoyer les anciens cookies fragmentés
            this.clearInodeSystemCookies();
            this.clearFileSystemCookies();
            
            // Programmer le prochain nettoyage (toutes les 5 minutes)
            setTimeout(() => this.cleanupStoragePeriodically(), 5 * 60 * 1000);
        } catch (error) {
            console.warn('Erreur lors du nettoyage préventif:', error);
        }
    },

    // Diagnostic et réparation automatique
    diagnoseAndRepairStorage() {
        try {
            console.log('🔧 Diagnostic du stockage...');
            
            // Vérifier la santé du StorageManager
            if (window.StorageManager && typeof window.StorageManager.getStorageStats === 'function') {
                const stats = window.StorageManager.getStorageStats();
                console.log('📊 Statistiques de stockage:', stats);
                
                // Si trop de données fragmentées, déclencher un nettoyage
                if (stats.fragmentedCookieCount > 5 || stats.fragmentedCookieSize > 10) {
                    console.log('🧹 Nettoyage des cookies fragmentés...');
                    window.StorageManager.emergencyCleanup();
                }
            }
            
            // Vérifier la cohérence des données
            this.verifyDataConsistency();
            
            console.log('✅ Diagnostic terminé');
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
        }
    },

    // Vérification de cohérence des données
    verifyDataConsistency() {
        try {
            // Vérifier la structure du système de fichiers
            if (this.fileSystem && typeof this.fileSystem === 'object') {
                if (!this.fileSystem['/'] || typeof this.fileSystem['/'] !== 'object') {
                    console.warn('⚠️ Structure de système de fichiers corrompue, réinitialisation...');
                    this.initializeDefaultFileSystem();
                    this.saveFileSystemOptimized();
                }
            }
            
            // Vérifier le système I-Node si présent
            if (this.inodeAdapter && this.inodeAdapter.inodeFS) {
                const isValid = this.inodeAdapter.validateFileSystem();
                if (!isValid) {
                    console.warn('⚠️ Système I-Node corrompu détecté');
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la vérification de cohérence:', error);
        }
    },

    // --- Dans app ---
    loadTheme() {
        // Utiliser le nouveau système unifié de gestion des paramètres
        const saved = this.getSetting('theme', 'dark');
        console.log('🎨 loadTheme: chargement du thème', saved);
        this.switchTheme(saved);
        
        // Mettre à jour le select si il existe
        const select = document.getElementById('theme-select');
        if (select) {
            select.value = saved;
            console.log('🎨 loadTheme: select mis à jour avec', saved);
        }
    },
    applyFontFamily(font) {
        if (this.consoleOutput) {
            this.consoleOutput.style.fontFamily = font;
        }
        // Utiliser le système unifié de sauvegarde
        this.applySetting('font_family', font);
    },
    loadFontFamily() {
        // Prend d'abord le cookie, sinon localStorage, sinon monospace
        const cookieMatch = document.cookie.match(/(?:^|;\s*)console_font=([^;]*)/);
        const saved = cookieMatch ? decodeURIComponent(cookieMatch[1]) : (localStorage.getItem('console_font') || 'monospace');
        this.applyFontFamily(saved);
        const select = document.getElementById('font-family-select');
        if (select) select.value = saved;
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
            // Utiliser le système unifié de sauvegarde
            this.applySetting('console_bg_type', 'color');
            this.applySetting('console_bg_color', value);
            // Sauvegarde la dernière couleur utilisée pour compatibilité
            localStorage.setItem('console_bg_last_color', value);
        } else if (type === 'image') {
            el.style.backgroundColor = '';
            el.style.backgroundImage = `url('${value}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            // Utiliser le système unifié de sauvegarde
            this.applySetting('console_bg_type', 'image');
            this.applySetting('console_bg_image_url', value);
            // Note: console_bg_last_image sera nettoyé par le système de cleanup
        }
    },
    loadConsoleBackground() {
        // Utiliser le nouveau système unifié
        const type = this.getSetting('console_bg_type', 'color');
        const consoleOutput = document.getElementById('console-output');
        
        if (!consoleOutput) return;

        if (type === 'color') {
            const value = this.getSetting('console_bg_color', '#18181b');
            consoleOutput.style.backgroundImage = '';
            consoleOutput.style.background = '';
            consoleOutput.style.backgroundColor = value;
        } else if (type === 'image') {
            const value = this.getSetting('console_bg_image_url', '');
            if (value) {
                consoleOutput.style.backgroundColor = '';
                consoleOutput.style.background = '';
                consoleOutput.style.backgroundImage = `url('${value}')`;
                consoleOutput.style.backgroundSize = 'cover';
                consoleOutput.style.backgroundPosition = 'center';
            }
        } else if (type === 'gradient') {
            const gradient = this.getSetting('console_bg_gradient', { color1: '#1e293b', color2: '#0f172a' });
            consoleOutput.style.backgroundColor = '';
            consoleOutput.style.backgroundImage = '';
            consoleOutput.style.background = `linear-gradient(135deg, ${gradient.color1}, ${gradient.color2})`;
        } else {
            // Type 'default' ou non reconnu - utiliser le dégradé par défaut
            const gradient = this.getSetting('console_bg_gradient', { color1: '#1e293b', color2: '#0f172a' });
            consoleOutput.style.backgroundColor = '';
            consoleOutput.style.backgroundImage = '';
            consoleOutput.style.background = `linear-gradient(135deg, ${gradient.color1}, ${gradient.color2})`;
        }

        // Mets à jour les inputs du modal si besoin (pour compatibilité avec l'ancienne interface)
        const typeSelect = document.getElementById('console-bg-type');
        const colorInput = document.getElementById('console-bg-color');
        const urlInput = document.getElementById('console-bg-url');
        const bgImageImportGroup = document.getElementById('console-bg-image-import-group');
        if (typeSelect) typeSelect.value = type;
        if (colorInput) colorInput.value = this.getSetting('console_bg_color', '#18181b');
        if (urlInput) urlInput.value = this.getSetting('console_bg_image_url', '');
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
        if (!changelogContainer) return;

        let changelogHTML = '<div class="text-sm text-slate-300 space-y-3">';
        
        // Utiliser l'historique pour afficher les dernières versions
        if (versionData.history && Array.isArray(versionData.history)) {
            // Prendre les 10 dernières versions
            const recentVersions = versionData.history;
            
            recentVersions.forEach(entry => {
                const typeColor = entry.type === 'Major' ? 'text-red-400 border-red-500' : 
                                 entry.type === 'minor' ? 'text-yellow-400 border-yellow-500' : 
                                 'text-green-400 border-green-500';
                
                changelogHTML += `
                    <div class="border-l-2 ${typeColor} pl-4 mb-4 bg-slate-800/30 rounded-r-lg p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold ${typeColor.split(' ')[0]}">${entry.version}</h4>
                            <span class="text-xs text-slate-400">${entry.date}</span>
                        </div>
                        <p class="text-slate-300 text-sm leading-relaxed">${entry.changelog}</p>
                        <span class="inline-block mt-2 px-2 py-1 bg-slate-700/50 text-xs ${typeColor.split(' ')[0]} rounded-full border border-current/20">
                            ${entry.type}
                        </span>
                    </div>
                `;
            });
        } else {
            // Fallback pour la version actuelle
            changelogHTML += `
                <div class="border-l-2 border-blue-500 pl-4 mb-4 bg-slate-800/30 rounded-r-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-blue-400">${versionData.version || 'Version actuelle'}</h4>
                        <span class="text-xs text-slate-400">${versionData.date || 'Date inconnue'}</span>
                    </div>
                    <p class="text-slate-300 text-sm">${versionData.changelog || 'Aucune information disponible'}</p>
                </div>
            `;
        }
        
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

    // Gestionnaire pour la modal des paramètres nouvelle génération
    initSettingsModal() {
        // Créer et injecter la nouvelle interface de paramètres
        this.createAdvancedSettingsModal();
        
        // Initialiser les gestionnaires d'événements
        this.initAdvancedSettingsHandlers();
    },

    // Créer la nouvelle interface de paramètres
    createAdvancedSettingsModal() {
        // Vérifier si le modal existe déjà
        let settingsModal = document.getElementById('settings-modal');
        
        const modalHTML = `
        <div id="settings-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md settings-modal hidden">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] border border-slate-700/50 flex flex-col">
                    
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 border-b border-slate-700/50 flex-shrink-0">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-3xl font-bold text-white">Centre de Configuration</h2>
                                    <p class="text-slate-400 mt-1">Personnalisez votre expérience terminal</p>
                                </div>
                            </div>
                            <button id="close-settings-modal" class="w-10 h-10 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-200">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-1 min-h-0">
                        <!-- Sidebar Navigation -->
                        <div class="w-80 bg-slate-800/50 border-r border-slate-700/50 p-6 overflow-y-auto custom-scrollbar flex-shrink-0">
                            <nav class="space-y-2">
                                <button class="settings-nav-btn active w-full text-left p-4 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all duration-200 flex items-center space-x-3" data-section="appearance">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                                    </svg>
                                    <span class="font-medium">Apparence</span>
                                </button>
                                
                                <button class="settings-nav-btn w-full text-left p-4 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-all duration-200 flex items-center space-x-3" data-section="behavior">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="font-medium">Comportement</span>
                                </button>
                                
                                <button class="settings-nav-btn w-full text-left p-4 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-all duration-200 flex items-center space-x-3" data-section="commands">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3"></path>
                                    </svg>
                                    <span class="font-medium">Commandes</span>
                                </button>
                                
                                <button class="settings-nav-btn w-full text-left p-4 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-all duration-200 flex items-center space-x-3" data-section="plugins">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                    <span class="font-medium">Plugins</span>
                                </button>
                                
                                <button class="settings-nav-btn w-full text-left p-4 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-all duration-200 flex items-center space-x-3" data-section="performance">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                    <span class="font-medium">Performance</span>
                                </button>
                                
                                <button class="settings-nav-btn w-full text-left p-4 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-all duration-200 flex items-center space-x-3" data-section="backup">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H20"></path>
                                    </svg>
                                    <span class="font-medium">Sauvegarde</span>
                                </button>
                            </nav>
                            
                            <!-- Stats rapides -->
                            <div class="mt-8 p-4 bg-slate-800/60 rounded-xl border border-slate-700/40">
                                <h3 class="text-sm font-semibold text-slate-400 mb-3">Statistiques</h3>
                                <div class="space-y-2 text-xs">
                                    <div class="flex justify-between">
                                        <span class="text-slate-500">Plugins actifs</span>
                                        <span class="text-green-400" id="active-plugins-count">0</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-500">Commandes activées</span>
                                        <span class="text-blue-400" id="enabled-commands-count">0</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-500">Thème</span>
                                        <span class="text-purple-400" id="current-theme">Default</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="flex-1 flex flex-col min-h-0">
                            <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div id="settings-content">
                                    <!-- Le contenu sera injecté dynamiquement -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="bg-slate-800/50 border-t border-slate-700/50 p-6 flex justify-between items-center flex-shrink-0">
                        <div class="text-sm text-slate-400">
                            Dernière sauvegarde: <span id="last-save-time">Jamais</span>
                        </div>
                        <div class="flex space-x-3">
                            <button id="cancel-settings-modal" class="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:text-white rounded-xl transition-all duration-200 font-medium">
                                Annuler
                            </button>
                            <button id="save-settings-modal" class="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg">
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        if (settingsModal) {
            settingsModal.outerHTML = modalHTML;
        } else {
            // Ajouter les styles CSS pour le modal si nécessaire
            if (!document.getElementById('settings-modal-styles')) {
                const style = document.createElement('style');
                style.id = 'settings-modal-styles';
                style.textContent = `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(51, 65, 85, 0.3);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(100, 116, 139, 0.6);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(148, 163, 184, 0.8);
                    }
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(100, 116, 139, 0.6) rgba(51, 65, 85, 0.3);
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    },

    // Initialiser les gestionnaires d'événements pour la nouvelle interface
    initAdvancedSettingsHandlers() {
        // Navigation entre les sections
        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = btn.dataset.section;
                this.switchAdvancedSettingsSection(section);
                
                // Mettre à jour l'apparence des boutons
                document.querySelectorAll('.settings-nav-btn').forEach(b => {
                    b.classList.remove('active', 'bg-purple-600/20', 'text-purple-300', 'border-purple-500/30');
                    b.classList.add('bg-slate-700/60', 'text-slate-300');
                });
                
                btn.classList.remove('bg-slate-700/60', 'text-slate-300');
                btn.classList.add('active', 'bg-purple-600/20', 'text-purple-300', 'border', 'border-purple-500/30');
            });
        });

        // Boutons de fermeture et sauvegarde
        const closeBtn = document.getElementById('close-settings-modal');
        const cancelBtn = document.getElementById('cancel-settings-modal');
        const saveBtn = document.getElementById('save-settings-modal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAdvancedSettings());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeAdvancedSettings());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAdvancedSettings());
        }

        // Initialiser la première section
        this.switchAdvancedSettingsSection('appearance');
        this.updateAdvancedSettingsStats();
    },

    // Basculer entre les sections de paramètres
    switchAdvancedSettingsSection(section) {
        const contentArea = document.getElementById('settings-content');
        if (!contentArea) return;

        let content = '';

        switch (section) {
            case 'appearance':
                content = this.createAppearanceSection();
                break;
            case 'behavior':
                content = this.createBehaviorSection();
                break;
            case 'commands':
                content = this.createCommandsSection();
                break;
            case 'plugins':
                content = this.createPluginsSection();
                break;
            case 'performance':
                content = this.createPerformanceSection();
                break;
            case 'backup':
                content = this.createBackupSection();
                break;
            default:
                content = '<div class="text-center text-slate-400 py-12">Section non trouvée</div>';
        }

        contentArea.innerHTML = content;
        
        // Initialiser les gestionnaires spécifiques à la section
        this.initSectionHandlers(section);
    },

    // Créer la section Apparence
    createAppearanceSection() {
        return this.settingsManager ? this.settingsManager.createAppearanceSection() : '<p>Chargement des paramètres...</p>';
    },

    // Méthodes de compatibilité pour l'ancien système

    // Créer la section Comportement
    createBehaviorSection() {
        return `
        <div class="space-y-8">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Configuration du comportement</h3>
                <p class="text-slate-400">Ajustez le fonctionnement de votre terminal</p>
            </div>

            <!-- Affichage -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Options d'affichage
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Afficher les timestamps</label>
                            <p class="text-xs text-slate-500">Horodatage des commandes</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="show-timestamps" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Numéros de ligne</label>
                            <p class="text-xs text-slate-500">Numérotation des sorties</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="show-line-numbers" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Historique -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Gestion de l'historique
                </h4>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Sauvegarde automatique</label>
                            <p class="text-xs text-slate-500">Sauvegarder l'historique automatiquement</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="auto-save-history" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Taille maximale de l'historique</label>
                        <select id="history-max-size" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent">
                            <option value="100">100 commandes</option>
                            <option value="500">500 commandes</option>
                            <option value="1000">1000 commandes</option>
                            <option value="5000">5000 commandes</option>
                            <option value="-1">Illimité</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Autocomplétion -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Autocomplétion intelligente
                </h4>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Activer l'autocomplétion</label>
                            <p class="text-xs text-slate-500">Suggestions automatiques de commandes</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="enable-autocomplete" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Autocomplétion des fichiers</label>
                            <p class="text-xs text-slate-500">Suggestions de noms de fichiers</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="autocomplete-files" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notifications et sons -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.266 3.666a8.97 8.97 0 016.28 15.98 8.97 8.97 0 01-6.28-15.98zM14 3a8.97 8.97 0 012.734 17.334A8.97 8.97 0 0114 3z"></path>
                    </svg>
                    Audio et notifications
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Sons activés</label>
                            <p class="text-xs text-slate-500">Effets sonores du terminal</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="enable-sounds" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Notifications</label>
                            <p class="text-xs text-slate-500">Alertes système</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="enable-notifications" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Animations -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Effets visuels
                </h4>
                <div class="flex items-center justify-between">
                    <div>
                        <label class="text-sm font-medium text-slate-300">Animations fluides</label>
                        <p class="text-xs text-slate-500">Transitions et effets animés</p>
                    </div>
                    <div class="relative">
                        <input type="checkbox" id="smooth-animations" class="sr-only">
                        <div class="toggle-bg">
                            <div class="toggle-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // Créer la section Commandes
    createCommandsSection() {
        // Vérifier si COMMAND_METADATA est disponible
        if (typeof COMMAND_METADATA === 'undefined' || !COMMAND_METADATA) {
            return `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">Chargement en cours...</h3>
                <p class="text-slate-400">Les métadonnées des commandes sont en cours de chargement.</p>
                <button onclick="app.switchAdvancedSettingsSection('commands')" class="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Réessayer
                </button>
            </div>
            `;
        }

        // Collecter toutes les commandes disponibles
        const allCommands = new Map();
        
        // Commandes natives
        Object.keys(this.commands).forEach(cmd => {
            if (COMMAND_METADATA[cmd]) {
                allCommands.set(cmd, {
                    name: cmd,
                    description: COMMAND_METADATA[cmd].description,
                    category: COMMAND_METADATA[cmd].category || 'Autre',
                    isPlugin: false,
                    enabled: this.isCommandEnabled(cmd)
                });
            }
        });
        
        // Commandes des plugins
        if (this.pluginManager) {
            this.pluginManager.getAllCommands().forEach(pluginCmd => {
                allCommands.set(pluginCmd.name, {
                    name: pluginCmd.name,
                    description: pluginCmd.description || 'Commande de plugin',
                    category: 'Plugins',
                    isPlugin: true,
                    plugin: pluginCmd.plugin,
                    enabled: this.isCommandEnabled(pluginCmd.name)
                });
            });
        }

        // Grouper par catégorie
        const commandsByCategory = {};
        allCommands.forEach(cmd => {
            if (!commandsByCategory[cmd.category]) {
                commandsByCategory[cmd.category] = [];
            }
            commandsByCategory[cmd.category].push(cmd);
        });

        let categoriesHtml = '';
        Object.keys(commandsByCategory).sort().forEach(category => {
            const commands = commandsByCategory[category];
            const enabledCount = commands.filter(cmd => cmd.enabled).length;
            
            categoriesHtml += `
            <div class="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden">
                <div class="category-header p-4 cursor-pointer hover:bg-slate-700/30 transition-colors flex items-center justify-between" data-target="category-${category.replace(/\s+/g, '-').toLowerCase()}">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span class="text-xs font-bold text-white">${category.charAt(0)}</span>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-white">${category}</h4>
                            <p class="text-xs text-slate-400">
                                <span class="category-count">${enabledCount}/${commands.length}</span> commandes activées
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="category-enable-btn px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded hover:bg-green-600/30 transition-colors" title="Tout activer">
                            ✓ Tout
                        </button>
                        <button class="category-disable-btn px-2 py-1 bg-red-600/20 text-red-300 text-xs rounded hover:bg-red-600/30 transition-colors" title="Tout désactiver">
                            ✗ Rien
                        </button>
                        <svg class="category-chevron w-5 h-5 text-slate-400 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
                <div id="category-${category.replace(/\s+/g, '-').toLowerCase()}" class="category-content hidden">
                    <div class="p-4 pt-0 space-y-2">
                        ${commands.map(cmd => `
                            <div class="command-item flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors" data-command="${cmd.name}" data-description="${cmd.description}">
                                <div class="flex items-center space-x-3">
                                    <div class="relative">
                                        <div class="command-toggle w-10 h-6 rounded-full cursor-pointer transition-colors duration-200 ${cmd.enabled ? 'bg-green-600 enabled' : 'bg-slate-600'}" data-command="${cmd.name}">
                                            <div class="toggle-dot w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 mt-1 ${cmd.enabled ? 'translate-x-5' : 'translate-x-1'}"></div>
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <code class="text-blue-300 font-mono text-sm font-semibold">${cmd.name}</code>
                                            ${cmd.isPlugin ? '<span class="px-1.5 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded border border-purple-500/30">PLUGIN</span>' : ''}
                                        </div>
                                        <p class="text-slate-400 text-xs mt-1 line-clamp-1">${cmd.description}</p>
                                        ${cmd.isPlugin && cmd.plugin ? `<p class="text-purple-400 text-xs">Plugin: ${cmd.plugin}</p>` : ''}
                                    </div>
                                </div>
                                <button class="command-info-btn p-2 text-slate-400 hover:text-white transition-colors" data-command="${cmd.name}" title="Plus d'informations">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            `;
        });

        return `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Gestion des commandes</h3>
                <p class="text-slate-400">Contrôlez la visibilité et l'activation des commandes</p>
            </div>

            <!-- Actions rapides -->
            <div class="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-slate-400">Total:</span>
                            <span class="text-white font-semibold">${allCommands.size}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-slate-400">Activées:</span>
                            <span class="text-green-400 font-semibold" id="enabled-commands-count-detail">${allCommands.size - this.disabledCommands.size}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-slate-400">Désactivées:</span>
                            <span class="text-red-400 font-semibold" id="disabled-commands-count-detail">${this.disabledCommands.size}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="enable-all-commands-btn" class="px-3 py-2 bg-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors text-sm">
                            Tout activer
                        </button>
                        <button id="reset-commands-btn" class="px-3 py-2 bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 rounded-lg hover:bg-yellow-600/30 transition-colors text-sm">
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <!-- Barre de recherche -->
            <div class="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input type="text" id="command-search-input" placeholder="Rechercher une commande..." class="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                </div>
            </div>

            <!-- Liste des commandes par catégorie -->
            <div class="space-y-4" id="commands-categories">
                ${categoriesHtml}
            </div>
        </div>
        `;
    },

    // Créer la section Plugins
    createPluginsSection() {
        const installedPlugins = this.pluginManager ? this.pluginManager.listPlugins() : [];
        const enabledPlugins = installedPlugins.filter(plugin => plugin.enabled);
        
        return `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Gestion des plugins</h3>
                <p class="text-slate-400">Gérez vos extensions et plugins personnalisés</p>
            </div>

            <!-- Statistiques des plugins -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Aperçu
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-400">${installedPlugins.length}</div>
                        <div class="text-sm text-slate-400">Plugins installés</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-blue-400">${this.pluginManager ? this.pluginManager.getAllCommands().length : 0}</div>
                        <div class="text-sm text-slate-400">Commandes ajoutées</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-purple-400">${enabledPlugins.length}</div>
                        <div class="text-sm text-slate-400">Plugins actifs</div>
                    </div>
                </div>
            </div>

            <!-- Actions sur les plugins -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Actions rapides
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button id="open-plugin-manager-btn" class="p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <div>
                                <h5 class="text-purple-300 font-semibold">Gestionnaire complet</h5>
                                <p class="text-slate-400 text-sm">Interface complète de gestion</p>
                            </div>
                        </div>
                    </button>
                    <button id="import-plugin-btn" class="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                            <div>
                                <h5 class="text-blue-300 font-semibold">Importer un plugin</h5>
                                <p class="text-slate-400 text-sm">Depuis un fichier local</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Liste des plugins installés -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Plugins installés (${installedPlugins.length})
                </h4>
                ${installedPlugins.length > 0 ? `
                    <div class="space-y-3">
                        ${installedPlugins.map(plugin => `
                            <div class="bg-slate-700/40 rounded-lg p-4 border border-slate-600/40">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-gradient-to-br ${plugin.enabled ? 'from-green-500 to-blue-500' : 'from-gray-500 to-gray-600'} rounded-lg flex items-center justify-center">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h5 class="font-semibold text-white">${plugin.name}</h5>
                                            <p class="text-sm text-slate-400">${plugin.commands.length} commande(s) • Type: ${plugin.type}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="px-2 py-1 text-xs rounded-full ${plugin.enabled ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'}">
                                            ${plugin.enabled ? 'Activé' : 'Désactivé'}
                                        </span>
                                        <button onclick="app.togglePluginFromSettings('${plugin.name}', ${!plugin.enabled})" class="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-500/30 transition-colors">
                                            ${plugin.enabled ? 'Désactiver' : 'Activer'}
                                        </button>
                                    </div>
                                </div>
                                ${plugin.commands.length > 0 ? `
                                    <div class="mt-3 pt-3 border-t border-slate-600/40">
                                        <p class="text-xs text-slate-500 mb-2">Commandes disponibles:</p>
                                        <div class="flex flex-wrap gap-1">
                                            ${plugin.commands.map(cmd => `
                                                <span class="px-2 py-1 text-xs bg-slate-600/40 text-slate-300 rounded border border-slate-500/30">${cmd}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8">
                        <svg class="w-12 h-12 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <p class="text-slate-400">Aucun plugin installé</p>
                        <p class="text-slate-500 text-sm mt-1">Utilisez les boutons ci-dessus pour importer ou gérer vos plugins</p>
                    </div>
                `}
            </div>
        </div>
        `;
    },

    // Créer la section Performance
    createPerformanceSection() {
        return `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Optimisation des performances</h3>
                <p class="text-slate-400">Ajustez les paramètres pour optimiser les performances</p>
            </div>

            <!-- Actions de nettoyage -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Nettoyage et optimisation
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button id="clear-cache-btn" class="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            <div>
                                <h5 class="text-blue-300 font-semibold">Vider le cache</h5>
                                <p class="text-slate-400 text-sm">Libère la mémoire cache</p>
                            </div>
                        </div>
                    </button>
                    <button id="optimize-performance-btn" class="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            <div>
                                <h5 class="text-green-300 font-semibold">Optimiser maintenant</h5>
                                <p class="text-slate-400 text-sm">Lance une optimisation complète</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        `;
    },

    // Créer la section Sauvegarde
    createBackupSection() {
        return `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Sauvegarde et synchronisation</h3>
                <p class="text-slate-400">Gérez vos données et paramètres</p>
            </div>

            <!-- Export/Import -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H20"></path>
                    </svg>
                    Export et import de données
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button id="export-settings-btn" class="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <div>
                                <h5 class="text-blue-300 font-semibold">Exporter les paramètres</h5>
                                <p class="text-slate-400 text-sm">Télécharger la configuration</p>
                            </div>
                        </div>
                    </button>
                    <button id="import-settings-btn" class="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors text-left">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                            <div>
                                <h5 class="text-green-300 font-semibold">Importer les paramètres</h5>
                                <p class="text-slate-400 text-sm">Restaurer depuis un fichier</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Réinitialisation -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-red-500/30">
                <h4 class="text-lg font-semibold text-red-300 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    Zone de danger
                </h4>
                <div class="space-y-4">
                    <div class="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <h5 class="text-red-300 font-semibold mb-2">Réinitialiser tous les paramètres</h5>
                        <p class="text-slate-400 text-sm mb-3">
                            Restaure tous les paramètres aux valeurs par défaut. Cette action est irréversible.
                        </p>
                        <button id="reset-settings-btn" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg transition-colors">
                            Réinitialiser
                        </button>
                    </div>
                    <div class="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <h5 class="text-red-300 font-semibold mb-2">Effacer toutes les données</h5>
                        <p class="text-slate-400 text-sm mb-3">
                            Supprime définitivement tous les paramètres, l'historique et les fichiers.
                        </p>
                        <button id="clear-all-data-btn" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg transition-colors">
                            Effacer toutes les données
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // Initialiser les gestionnaires spécifiques à chaque section
    initSectionHandlers(section) {
        switch (section) {
            case 'appearance':
                this.initAppearanceHandlers();
                break;
            case 'behavior':
                this.initBehaviorHandlers();
                break;
            case 'commands':
                this.initCommandsHandlers();
                break;
            case 'plugins':
                this.initPluginsHandlers();
                break;
            case 'performance':
                this.initPerformanceHandlers();
                break;
            case 'backup':
                this.initBackupHandlers();
                break;
        }
    },

    // Gestionnaires pour la section Apparence
    initAppearanceHandlers() {
        // Gestionnaires pour les toggles
        this.initToggleButtons();
        
        // Gestionnaires pour les contrôles d'arrière-plan (utiliser le SettingsManager)
        if (this.settingsManager) {
            this.settingsManager.initBackgroundControls(this);
            this.settingsManager.initSettingsActionButtons();
            // Charger tous les paramètres dans l'interface
            setTimeout(() => {
                this.settingsManager.loadAllSettingsIntoUI();
            }, 100); // Petit délai pour s'assurer que les éléments DOM sont prêts
        }
        
        // Gestionnaire pour la taille de police
        const fontSizeRange = document.getElementById('font-size-range');
        const fontSizeValue = document.getElementById('font-size-value');
        
        if (fontSizeRange && fontSizeValue) {
            fontSizeRange.addEventListener('input', (e) => {
                const size = e.target.value;
                fontSizeValue.textContent = size + 'px';
                this.applyFontSize(size);
            });
        }
        
        // Gestionnaire pour le changement de thème
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            console.log('🎨 Event listener du thème attaché');
            themeSelect.addEventListener('change', (e) => {
                console.log('🎨 Changement de thème détecté:', e.target.value);
                this.switchTheme(e.target.value);
                // Sauvegarder immédiatement le thème
                this.applySetting('theme', e.target.value);
            });
        } else {
            console.warn('🎨 Élément theme-select non trouvé');
        }
        
        // Gestionnaire pour le changement de police
        const fontSelect = document.getElementById('font-family-select');
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                this.applyFontFamily(e.target.value);
                // Sauvegarder immédiatement la police
                this.applySetting('font_family', e.target.value);
            });
        }
        
        // Charger les valeurs actuelles
        this.loadAppearanceSettings();
    },

    // Gestionnaires pour la section Comportement
    initBehaviorHandlers() {
        this.initToggleButtons();
        this.loadBehaviorSettings();
    },

    // Gestionnaires pour la section Commandes
    initCommandsHandlers() {
        // Gestionnaires pour les toggles de commandes
        document.querySelectorAll('.command-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const commandName = toggle.dataset.command;
                const isEnabled = toggle.classList.contains('enabled');
                
                this.toggleCommandEnabled(commandName, !isEnabled);
                
                // Mettre à jour l'apparence
                const dot = toggle.querySelector('.toggle-dot');
                if (!isEnabled) {
                    toggle.classList.add('enabled', 'bg-green-600');
                    toggle.classList.remove('bg-slate-600');
                    dot.classList.remove('translate-x-1');
                    dot.classList.add('translate-x-5');
                } else {
                    toggle.classList.remove('enabled', 'bg-green-600');
                    toggle.classList.add('bg-slate-600');
                    dot.classList.remove('translate-x-5');
                    dot.classList.add('translate-x-1');
                }
                
                // Mettre à jour les compteurs
                this.updateCommandsCounters();
            });
        });

        // Gestionnaires pour les boutons d'information
        document.querySelectorAll('.command-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const commandName = btn.dataset.command;
                this.showCommandInfoModal(commandName);
            });
        });

        // Gestionnaires pour l'ouverture/fermeture des catégories
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.category-enable-btn') || e.target.closest('.category-disable-btn')) {
                    return;
                }
                
                const targetId = header.dataset.target;
                const content = document.getElementById(targetId);
                const chevron = header.querySelector('.category-chevron');
                
                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    chevron.style.transform = 'rotate(180deg)';
                } else {
                    content.style.display = 'none';
                    chevron.style.transform = 'rotate(0deg)';
                }
            });
        });

        // Gestionnaires pour les boutons de catégorie
        document.querySelectorAll('.category-enable-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryElement = btn.closest('.bg-slate-800\\/40');
                const commandToggles = categoryElement.querySelectorAll('.command-toggle');
                
                commandToggles.forEach(toggle => {
                    const commandName = toggle.dataset.command;
                    this.toggleCommandEnabled(commandName, true);
                    
                    toggle.classList.add('enabled', 'bg-green-600');
                    toggle.classList.remove('bg-slate-600');
                    const dot = toggle.querySelector('.toggle-dot');
                    dot.classList.remove('translate-x-1');
                    dot.classList.add('translate-x-5');
                });
                
                this.updateCommandsCounters();
            });
        });

        document.querySelectorAll('.category-disable-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryElement = btn.closest('.bg-slate-800\\/40');
                const commandToggles = categoryElement.querySelectorAll('.command-toggle');
                
                commandToggles.forEach(toggle => {
                    const commandName = toggle.dataset.command;
                    this.toggleCommandEnabled(commandName, false);
                    
                    toggle.classList.remove('enabled', 'bg-green-600');
                    toggle.classList.add('bg-slate-600');
                    const dot = toggle.querySelector('.toggle-dot');
                    dot.classList.remove('translate-x-5');
                    dot.classList.add('translate-x-1');
                });
                
                this.updateCommandsCounters();
            });
        });

        // Barre de recherche
        const searchInput = document.getElementById('command-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.command-item').forEach(item => {
                    const commandName = item.dataset.command.toLowerCase();
                    const commandDesc = item.dataset.description.toLowerCase();
                    
                    if (commandName.includes(searchTerm) || commandDesc.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        // Boutons d'action
        const enableAllBtn = document.getElementById('enable-all-commands-btn');
        const resetBtn = document.getElementById('reset-commands-btn');

        if (enableAllBtn) {
            enableAllBtn.addEventListener('click', () => {
                this.disabledCommands.clear();
                this.saveDisabledCommands();
                this.switchAdvancedSettingsSection('commands'); // Rafraîchir la vue
                this.updateCommandsCounters();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir réactiver toutes les commandes ?')) {
                    this.disabledCommands.clear();
                    this.saveDisabledCommands();
                    this.switchAdvancedSettingsSection('commands'); // Rafraîchir la vue
                    this.updateCommandsCounters();
                }
            });
        }
    },

    // Gestionnaires pour la section Plugins
    initPluginsHandlers() {
        const openPluginManagerBtn = document.getElementById('open-plugin-manager-btn');
        const importPluginBtn = document.getElementById('import-plugin-btn');

        if (openPluginManagerBtn) {
            openPluginManagerBtn.addEventListener('click', () => {
                // Ouvrir le gestionnaire de plugins existant
                if (this.pluginManagerModal) {
                    this.pluginManagerModal.classList.remove('hidden');
                    this.refreshPluginManagerContent();
                }
            });
        }

        if (importPluginBtn) {
            importPluginBtn.addEventListener('click', () => {
                // Ouvrir un dialogue de sélection de fichier pour importer un plugin
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.js,.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const content = event.target.result;
                                
                                // Essayer d'importer comme code JavaScript
                                if (file.name.endsWith('.js') && this.pluginManager) {
                                    const result = this.pluginManager.importPluginFromCode(content, file.name.replace('.js', ''));
                                    
                                    if (result.success) {
                                        this.showNotification({
                                            type: 'success',
                                            title: 'Plugin importé',
                                            message: `Plugin "${result.name}" importé avec succès`,
                                            duration: 4000
                                        });
                                        
                                        // Actualiser l'interface
                                        this.switchAdvancedSettingsSection('plugins');
                                        this.updateAdvancedSettingsStats();
                                    } else {
                                        this.showNotification({
                                            type: 'error',
                                            title: 'Erreur d\'import',
                                            message: `Échec de l'import: ${result.error}`,
                                            duration: 4000
                                        });
                                    }
                                } 
                                // Essayer d'importer comme configuration JSON
                                else if (file.name.endsWith('.json') && this.pluginManager) {
                                    const result = this.pluginManager.importPluginConfig(content);
                                    
                                    if (result.success) {
                                        this.showNotification({
                                            type: 'success',
                                            title: 'Configuration importée',
                                            message: result.message,
                                            duration: 4000
                                        });
                                        
                                        // Actualiser l'interface
                                        this.switchAdvancedSettingsSection('plugins');
                                        this.updateAdvancedSettingsStats();
                                    } else {
                                        this.showNotification({
                                            type: 'error',
                                            title: 'Erreur d\'import',
                                            message: `Échec de l'import: ${result.error}`,
                                            duration: 4000
                                        });
                                    }
                                }
                            } catch (error) {
                                this.showNotification({
                                    type: 'error',
                                    title: 'Erreur de lecture',
                                    message: `Impossible de lire le fichier: ${error.message}`,
                                    duration: 4000
                                });
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
        }
    },

    // Gestionnaires pour la section Performance
    initPerformanceHandlers() {
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        const optimizeBtn = document.getElementById('optimize-performance-btn');

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                // Vider le cache
                if (typeof caches !== 'undefined') {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                
                this.showNotification({
                    type: 'success',
                    title: 'Cache vidé',
                    message: 'Le cache a été vidé avec succès.',
                    duration: 3000
                });
            });
        }

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                // Optimisation générale
                this.clearConsole();
                if (this.history.length > 1000) {
                    this.history = this.history.slice(-500);
                    this.saveHistoryToCookie();
                }
                
                this.showNotification({
                    type: 'success',
                    title: 'Optimisation terminée',
                    message: 'Le système a été optimisé.',
                    duration: 3000
                });
            });
        }
    },

    // Gestionnaires pour la section Sauvegarde
    initBackupHandlers() {
        // Réutiliser les méthodes existantes
        this.initSettingsActionButtons();
    },

    // Mettre à jour les compteurs de commandes
    updateCommandsCounters() {
        const enabledCountDetail = document.getElementById('enabled-commands-count-detail');
        const disabledCountDetail = document.getElementById('disabled-commands-count-detail');
        
        if (enabledCountDetail && disabledCountDetail) {
            const totalCommands = Object.keys(this.commands).length + (this.pluginManager ? this.pluginManager.getAllCommands().length : 0);
            const enabledCount = totalCommands - this.disabledCommands.size;
            
            enabledCountDetail.textContent = enabledCount;
            disabledCountDetail.textContent = this.disabledCommands.size;
        }
        
        // Mettre à jour les compteurs de catégories
        document.querySelectorAll('.category-count').forEach(countElement => {
            const categoryElement = countElement.closest('.bg-slate-800\\/40');
            if (categoryElement) {
                const commandItems = categoryElement.querySelectorAll('.command-item');
                const enabledItems = Array.from(commandItems).filter(item => {
                    const toggle = item.querySelector('.command-toggle');
                    return toggle && toggle.classList.contains('enabled');
                });
                
                countElement.textContent = `${enabledItems.length}/${commandItems.length}`;
            }
        });
    },

    // Mettre à jour les statistiques dans la sidebar
    updateAdvancedSettingsStats() {
        const activePluginsCount = document.getElementById('active-plugins-count');
        const enabledCommandsCount = document.getElementById('enabled-commands-count');
        const currentTheme = document.getElementById('current-theme');

        if (activePluginsCount) {
            const pluginCount = this.pluginManager ? this.pluginManager.listPlugins().length : 0;
            activePluginsCount.textContent = pluginCount;
        }

        if (enabledCommandsCount) {
            const totalCommands = Object.keys(this.commands).length + (this.pluginManager ? this.pluginManager.getAllCommands().length : 0);
            const enabledCount = totalCommands - this.disabledCommands.size;
            enabledCommandsCount.textContent = enabledCount;
        }

        if (currentTheme) {
            const theme = this.getSetting('theme', 'Default');
            currentTheme.textContent = theme;
        }
    },

    // Charger les paramètres d'apparence
    loadAppearanceSettings() {
        // Charger les paramètres sauvegardés et les appliquer aux contrôles
        const themeSelect = document.getElementById('theme-select');
        const fontSelect = document.getElementById('font-family-select');
        const fontSizeRange = document.getElementById('font-size-range');
        const fontSizeValue = document.getElementById('font-size-value');

        if (themeSelect) {
            const savedTheme = this.getSetting('theme', 'default'); // Changé de 'dark' à 'default'
            themeSelect.value = savedTheme;
            // Appliquer le thème immédiatement
            this.switchTheme(savedTheme);
        }
        if (fontSelect) {
            const savedFont = this.getSetting('font_family', "'Courier New', monospace");
            fontSelect.value = savedFont;
            // Appliquer la police immédiatement
            if (this.consoleOutput) {
                this.consoleOutput.style.fontFamily = savedFont;
            }
        }
        if (fontSizeRange && fontSizeValue) {
            const fontSize = this.getSetting('font_size', 14);
            fontSizeRange.value = fontSize;
            fontSizeValue.textContent = fontSize + 'px';
            // Appliquer la taille de police immédiatement
            if (this.consoleOutput) {
                this.consoleOutput.style.fontSize = fontSize + 'px';
            }
        }
        
        // Charger les paramètres de contraste élevé
        const highContrastElement = document.getElementById('high-contrast-mode');
        if (highContrastElement) {
            const highContrastValue = this.getSetting('high_contrast', false);
            highContrastElement.checked = highContrastValue;
            this.updateToggleAppearance(highContrastElement);
            this.applyHighContrast(highContrastValue);
        }
    },

    // Charger les paramètres de comportement
    loadBehaviorSettings() {
        // Charger et appliquer les paramètres de comportement
        const settings = [
            'show-timestamps',
            'show-line-numbers', 
            'auto-save-history',
            'enable-autocomplete',
            'autocomplete-files',
            'enable-sounds',
            'enable-notifications',
            'smooth-animations'
        ];

        settings.forEach(settingId => {
            const element = document.getElementById(settingId);
            if (element) {
                const key = settingId.replace(/-/g, '_');
                const savedValue = this.getSetting(key, settingId === 'auto-save-history' || settingId === 'enable-autocomplete' || settingId === 'enable-sounds' || settingId === 'enable-notifications' || settingId === 'smooth-animations');
                element.checked = savedValue;
                this.updateToggleAppearance(element);
                
                // Appliquer le paramètre immédiatement
                this.applySetting(key, savedValue);
            }
        });

        // Charger et appliquer le contraste élevé
        const highContrastElement = document.getElementById('high-contrast-mode');
        if (highContrastElement) {
            const highContrastValue = this.getSetting('high_contrast', false);
            highContrastElement.checked = highContrastValue;
            this.updateToggleAppearance(highContrastElement);
            this.applyHighContrast(highContrastValue);
        }
    },

    // Fonction pour mettre à jour l'apparence d'un toggle
    updateToggleAppearance(toggleElement) {
        const toggleBg = toggleElement.parentElement.querySelector('.toggle-bg');
        
        if (toggleBg) {
            if (toggleElement.checked) {
                toggleBg.classList.add('active');
            } else {
                toggleBg.classList.remove('active');
            }
        }
    },

    // Initialiser les gestionnaires de toggles
    initToggleButtons() {
        // Gestionnaires pour tous les toggles
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const toggleContainer = checkbox.parentElement;
            
            // Ajouter le gestionnaire de clic au conteneur toggle
            if (toggleContainer.querySelector('.toggle-bg')) {
                toggleContainer.addEventListener('click', (e) => {
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    this.updateToggleAppearance(checkbox);
                    
                    // Sauvegarder immédiatement le paramètre
                    const settingKey = checkbox.id.replace(/-/g, '_');
                    this.applySetting(settingKey, checkbox.checked);
                    
                    // Appliquer certains paramètres immédiatement
                    if (checkbox.id === 'high-contrast-mode') {
                        this.applyHighContrast(checkbox.checked);
                    } else if (checkbox.id === 'show-timestamps') {
                        this.applySetting('show_timestamps', checkbox.checked);
                    }
                });
            }
        });
    },

    // Fermer l'interface avancée
    closeAdvancedSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Sauvegarder tous les paramètres avancés
    saveAdvancedSettings() {
        this.saveAllSettings();
        this.updateAdvancedSettingsStats();
        
        // Mettre à jour le timestamp de dernière sauvegarde
        const lastSaveTime = document.getElementById('last-save-time');
        if (lastSaveTime) {
            lastSaveTime.textContent = new Date().toLocaleString('fr-FR');
        }
        
        this.showNotification({
            type: 'success',
            title: 'Paramètres sauvegardés',
            message: 'Tous vos paramètres ont été sauvegardés avec succès.',
            duration: 3000
        });

        // Ne pas fermer automatiquement - laisser l'utilisateur fermer manuellement
    },

    // Ouvrir la nouvelle interface de paramètres
    showAdvancedSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateAdvancedSettingsStats();
        }
    },

    // Activer/désactiver un plugin depuis l'interface de paramètres
    togglePluginFromSettings(pluginName, enabled) {
        if (this.pluginManager) {
            const result = this.pluginManager.togglePlugin(pluginName, enabled);
            
            // Actualiser la section plugins
            this.switchAdvancedSettingsSection('plugins');
            this.updateAdvancedSettingsStats();
            
            // Afficher une notification
            this.showNotification({
                type: enabled ? 'success' : 'info',
                title: `Plugin ${enabled ? 'activé' : 'désactivé'}`,
                message: `Le plugin "${pluginName}" a été ${enabled ? 'activé' : 'désactivé'} avec succès`,
                duration: 3000
            });
        }
    },

    // Méthodes de compatibilité pour l'ancien système
    switchSettingsTab(activeTab) {
        // Rediriger vers la nouvelle interface
        this.showAdvancedSettingsModal();
        
        // Mapper les anciens onglets vers les nouvelles sections
        const sectionMap = {
            'general': 'behavior',
            'appearance': 'appearance',
            'advanced': 'performance'
        };
        
        const newSection = sectionMap[activeTab] || 'appearance';
        setTimeout(() => {
            this.switchAdvancedSettingsSection(newSection);
        }, 100);
    },

    // Appliquer la taille de police
    applyFontSize(size) {
        const consoleOutput = document.getElementById('console-output');
        if (consoleOutput) {
            consoleOutput.style.fontSize = size + 'px';
        }
        this.applySetting('font_size', parseInt(size));
    },

    switchSettingsTab(activeTab) {
        // Mettre à jour les boutons d'onglets
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            if (btn.dataset.tab === activeTab) {
                btn.classList.remove('bg-slate-700/60', 'text-slate-300');
                btn.classList.add('active', 'bg-purple-600/30', 'text-purple-300');
            } else {
                btn.classList.remove('active', 'bg-purple-600/30', 'text-purple-300');
                btn.classList.add('bg-slate-700/60', 'text-slate-300');
            }
        });

        // Mettre à jour le contenu des onglets
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(activeTab + '-tab');
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    },

    initToggleButtons() {
        document.querySelectorAll('.toggle-bg').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const checkbox = e.target.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.updateToggleAppearance(checkbox);
                    this.handleToggleChange(checkbox);
                }
            });
        });

        // Initialiser l'apparence des toggles
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            this.updateToggleAppearance(checkbox);
        });
    },

    handleToggleChange(checkbox) {
        const setting = checkbox.id;
        const value = checkbox.checked;
        
        switch (setting) {
            case 'high-contrast-mode':
                this.applyHighContrast(value);
                break;
            case 'show-timestamps':
                this.applySetting('show_timestamps', value);
                break;
            case 'show-line-numbers':
                this.applySetting('show_line_numbers', value);
                break;
            case 'auto-save-history':
                this.applySetting('auto_save_history', value);
                break;
            case 'enable-autocomplete':
                this.applySetting('enable_autocomplete', value);
                break;
            case 'autocomplete-files':
                this.applySetting('autocomplete_files', value);
                break;
            case 'enable-sounds':
                this.applySetting('enable_sounds', value);
                break;
            case 'enable-notifications':
                this.applySetting('enable_notifications', value);
                break;
            case 'smooth-animations':
                this.applySetting('smooth_animations', value);
                break;
        }
    },

    initBackgroundControls() {
        const bgTypeSelect = document.getElementById('console-bg-type');
        if (bgTypeSelect) {
            bgTypeSelect.addEventListener('change', (e) => {
                this.switchBackgroundType(e.target.value);
                // Sauvegarder le type d'arrière-plan
                this.applySetting('console_bg_type', e.target.value);
            });
        }

        // Gestionnaire pour la couleur unie avec feedback visuel
        const bgColorInput = document.getElementById('console-bg-color');
        if (bgColorInput) {
            bgColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                this.applyConsoleBackground('color', color);
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_color', color);
            });
            
            bgColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                this.applyConsoleBackground('color', color);
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_color', color);
            });
        }

        // Gestionnaire pour l'URL d'image
        const bgUrlInput = document.getElementById('console-bg-url');
        if (bgUrlInput) {
            bgUrlInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (url) {
                    this.applyConsoleBackground('image', url);
                    // Sauvegarder immédiatement pour la mémoire
                    this.applySetting('console_bg_image_url', url);
                }
            });
            
            bgUrlInput.addEventListener('blur', (e) => {
                const url = e.target.value.trim();
                if (url) {
                    this.applyConsoleBackground('image', url);
                    // Sauvegarder immédiatement pour la mémoire
                    this.applySetting('console_bg_image_url', url);
                }
            });
        }

        // Gestionnaire pour le fichier d'image avec feedback
        const bgFileInput = document.getElementById('console-bg-file');
        if (bgFileInput) {
            bgFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) { // 5MB max
                        alert('Le fichier est trop volumineux. Taille maximum : 5MB');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        this.applyConsoleBackground('image', dataUrl);
                        // Sauvegarder immédiatement pour la mémoire
                        this.applySetting('console_bg_image_url', dataUrl);
                        // Aussi mettre à jour l'input URL pour cohérence
                        if (bgUrlInput) {
                            bgUrlInput.value = ''; // Vider l'URL car on utilise un fichier
                        }
                    };
                    reader.onerror = () => {
                        alert('Erreur lors de la lecture du fichier');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Gestionnaires pour les couleurs de dégradé avec aperçu en temps réel
        const gradientColor1 = document.getElementById('gradient-color1');
        const gradientColor2 = document.getElementById('gradient-color2');
        
        if (gradientColor1 && gradientColor2) {
            // Événement 'input' pour l'aperçu en temps réel et sauvegarde
            gradientColor1.addEventListener('input', () => {
                this.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_start', gradientColor1.value);
            });
            gradientColor2.addEventListener('input', () => {
                this.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_end', gradientColor2.value);
            });
            
            // Événement 'change' pour la sauvegarde finale
            gradientColor1.addEventListener('change', () => {
                this.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_start', gradientColor1.value);
            });
            gradientColor2.addEventListener('change', () => {
                this.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_end', gradientColor2.value);
            });
        }

        // Charger les paramètres d'arrière-plan actuels
        this.loadBackgroundSettings();
    },

    loadBackgroundSettings() {
        // Force la couleur unie comme défaut si c'était "default" avant
        let bgType = this.getSetting('console_bg_type', 'color');
        if (bgType === 'default') {
            bgType = 'color';
            this.applySetting('console_bg_type', 'color');
        }
        
        const bgTypeSelect = document.getElementById('console-bg-type');
        if (bgTypeSelect) {
            bgTypeSelect.value = bgType;
            this.switchBackgroundType(bgType);
        }

        // Force l'affichage des contrôles de couleur si le type est "color"
        if (bgType === 'color') {
            setTimeout(() => {
                const colorControls = document.getElementById('color-controls');
                const gradientControls = document.getElementById('gradient-controls');
                const imageControls = document.getElementById('image-controls');
                
                if (colorControls) colorControls.classList.remove('hidden');
                if (gradientControls) gradientControls.classList.add('hidden');
                if (imageControls) imageControls.classList.add('hidden');
            }, 100);
        }

        // Charger la couleur unie
        const bgColor = this.getSetting('console_bg_color', '#18181b');
        const bgColorInput = document.getElementById('console-bg-color');
        if (bgColorInput) {
            bgColorInput.value = bgColor;
            if (bgType === 'color') {
                this.applyConsoleBackground('color', bgColor);
            }
        }

        // Charger l'URL d'image
        const bgImageUrl = this.getSetting('console_bg_image_url', '');
        const bgUrlInput = document.getElementById('console-bg-url');
        if (bgUrlInput) {
            bgUrlInput.value = bgImageUrl;
            if (bgType === 'image' && bgImageUrl) {
                this.applyConsoleBackground('image', bgImageUrl);
            }
        }

        // Charger les couleurs de dégradé avec les vraies valeurs par défaut
        const bgGradient = this.getSetting('console_bg_gradient', { color1: '#000000', color2: '#1a1a1a' });
        const gradientColor1 = document.getElementById('gradient-color1');
        const gradientColor2 = document.getElementById('gradient-color2');
        if (gradientColor1 && gradientColor2) {
            gradientColor1.value = bgGradient.color1;
            gradientColor2.value = bgGradient.color2;
            
            // Mettre à jour l'aperçu du dégradé
            const gradientPreview = document.getElementById('gradient-preview');
            if (gradientPreview) {
                gradientPreview.style.background = `linear-gradient(135deg, ${bgGradient.color1}, ${bgGradient.color2})`;
            }
            
            if (bgType === 'gradient' || bgType === 'default') {
                this.updateGradientBackground();
            }
        }
    },

    switchBackgroundType(type) {
        // Masquer tous les contrôles
        document.querySelectorAll('.bg-control-group').forEach(group => {
            group.classList.add('hidden');
        });

        // Afficher le contrôle approprié et appliquer les derniers paramètres sauvegardés
        switch (type) {
            case 'color':
                const colorControls = document.getElementById('color-controls');
                if (colorControls) {
                    colorControls.classList.remove('hidden');
                    // Appliquer la dernière couleur sauvegardée
                    const lastColor = this.getSetting('console_bg_color', '#18181b');
                    const colorInput = document.getElementById('console-bg-color');
                    if (colorInput) {
                        colorInput.value = lastColor;
                    }
                    this.applyConsoleBackground('color', lastColor);
                }
                break;
            case 'image':
                const imageControls = document.getElementById('image-controls');
                if (imageControls) {
                    imageControls.classList.remove('hidden');
                    // Appliquer la dernière image sauvegardée
                    const lastImageUrl = this.getSetting('console_bg_image_url', '');
                    if (lastImageUrl) {
                        this.applyConsoleBackground('image', lastImageUrl);
                    }
                }
                break;
            case 'gradient':
                const gradientControls = document.getElementById('gradient-controls');
                if (gradientControls) {
                    gradientControls.classList.remove('hidden');
                    // Appliquer le dernier dégradé sauvegardé
                    this.updateGradientBackground();
                }
                break;
            case 'default':
                // Pour le type par défaut, utiliser une couleur unie #18181b
                const consoleOutput = document.getElementById('console-output');
                if (consoleOutput) {
                    consoleOutput.style.backgroundImage = '';
                    consoleOutput.style.background = '';
                    consoleOutput.style.backgroundColor = '#18181b';
                }
                this.applySetting('console_bg_type', 'default');
                this.applySetting('console_bg_color', '#18181b');
                break;
        }
        
        // Sauvegarder le type sélectionné
        this.applySetting('console_bg_type', type);
    },

    updateGradientBackground() {
        const gradientColor1 = document.getElementById('gradient-color1');
        const gradientColor2 = document.getElementById('gradient-color2');
        
        if (!gradientColor1 || !gradientColor2) {
            console.warn('Éléments de dégradé non trouvés');
            return;
        }
        
        const color1 = gradientColor1.value;
        const color2 = gradientColor2.value;
        const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;
        
        // Mettre à jour l'aperçu du dégradé
        const gradientPreview = document.getElementById('gradient-preview');
        if (gradientPreview) {
            gradientPreview.style.background = gradient;
        }
        
        // Appliquer au console output
        const consoleOutput = document.getElementById('console-output');
        if (consoleOutput) {
            consoleOutput.style.backgroundColor = '';
            consoleOutput.style.backgroundImage = '';
            consoleOutput.style.background = gradient;
        }
        
        this.applySetting('console_bg_type', 'gradient');
        this.applySetting('console_bg_gradient', { color1, color2 });
    },

    initSettingsActionButtons() {
        // Export des paramètres
        const exportBtn = document.getElementById('export-settings-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }

        // Import des paramètres
        const importBtn = document.getElementById('import-settings-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }

        // Réinitialisation
        const resetBtn = document.getElementById('reset-settings-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Effacement des données
        const clearBtn = document.getElementById('clear-all-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }
    },

    applySetting(key, value) {
        return this.settingsManager ? this.settingsManager.applySetting(key, value) : false;
    },

    getSetting(key, defaultValue = null) {
        return this.settingsManager ? this.settingsManager.getSetting(key, defaultValue) : defaultValue;
    },

    applyHighContrast(enabled) {
        const body = document.body;
        if (enabled) {
            body.classList.add('high-contrast');
        } else {
            body.classList.remove('high-contrast');
        }
        this.applySetting('high_contrast', enabled);
    },

    saveAllSettings() {
        // Sauvegarder tous les paramètres visibles dans la modal
        const form = document.getElementById('settings-form');
        
        // Collecter tous les paramètres
        const settings = {};

        // Sélects (chercher dans toute la page, pas seulement dans le form)
        document.querySelectorAll('select[id]').forEach(select => {
            if (select.id) {
                settings[select.id] = select.value;
                // Sauvegarder immédiatement avec le système unifié
                const settingKey = select.id.replace(/-/g, '_');
                this.applySetting(settingKey, select.value);
            }
        });

        // Inputs (chercher dans toute la page)
        document.querySelectorAll('input[type="number"], input[type="color"], input[type="text"], input[type="range"], input[type="url"]').forEach(input => {
            if (input.id) {
                settings[input.id] = input.value;
                // Sauvegarder immédiatement avec le système unifié
                const settingKey = input.id.replace(/-/g, '_');
                this.applySetting(settingKey, input.value);
            }
        });

        // Checkboxes (chercher dans toute la page)
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id) {
                settings[checkbox.id] = checkbox.checked;
                // Sauvegarder immédiatement avec le système unifié
                const settingKey = checkbox.id.replace(/-/g, '_');
                this.applySetting(settingKey, checkbox.checked);
            }
        });

        // Sauvegarder en lot pour compatibilité
        try {
            localStorage.setItem('clk_all_settings', JSON.stringify(settings));
            this.applySetting('last_save', new Date().toISOString());
            
            // Appliquer immédiatement les changements critiques
            this.applySettingsChanges(settings);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
        }
    },

    // Appliquer immédiatement les changements de paramètres
    applySettingsChanges(settings) {
        // Changement de thème
        if (settings['theme-select']) {
            this.switchTheme(settings['theme-select']);
        }
        
        // Changement de police
        if (settings['font-family-select']) {
            this.applyFontFamily(settings['font-family-select']);
        }
        
        // Changement de taille de police
        if (settings['font-size-range']) {
            this.applyFontSize(settings['font-size-range']);
        }
        
        // Paramètres d'arrière-plan
        if (settings['console-bg-type']) {
            this.switchBackgroundType(settings['console-bg-type']);
            
            if (settings['console-bg-type'] === 'color' && settings['console-bg-color']) {
                this.applyConsoleBackground('color', settings['console-bg-color']);
            } else if (settings['console-bg-type'] === 'image' && settings['console-bg-url']) {
                this.applyConsoleBackground('image', settings['console-bg-url']);
            } else if (settings['console-bg-type'] === 'gradient' && settings['gradient-color1'] && settings['gradient-color2']) {
                this.updateGradientBackground();
            }
        }
        
        // Paramètres de comportement
        if (settings['high-contrast-mode'] !== undefined) {
            this.applyHighContrast(settings['high-contrast-mode']);
        }
    },

    // Appliquer la famille de police
    applyFontFamily(fontFamily) {
        const consoleOutput = document.getElementById('console-output');
        const commandInput = document.getElementById('command-input');
        
        if (consoleOutput) {
            consoleOutput.style.fontFamily = fontFamily;
        }
        if (commandInput) {
            commandInput.style.fontFamily = fontFamily;
        }
        
        this.applySetting('font_family', fontFamily);
    },

    // Changer le thème de l'application
    switchTheme(theme) {
        console.log('🎨 switchTheme appelée avec:', theme);
        const body = document.body;
        
        // Supprimer les anciennes classes de thème
        body.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon', 'theme-matrix', 'theme-default', 'theme-minimal');
        console.log('🎨 Classes supprimées, classes actuelles:', body.className);
        
        // Appliquer le nouveau thème
        switch (theme) {
            case 'dark':
                body.classList.add('theme-dark');
                break;
            case 'light':
                body.classList.add('theme-light');
                break;
            case 'cyberpunk':
                body.classList.add('theme-cyberpunk');
                break;
            case 'neon':
                body.classList.add('theme-neon');
                break;
            case 'matrix':
                body.classList.add('theme-matrix');
                break;
            case 'minimal':
                body.classList.add('theme-minimal');
                break;
            case 'default':
            default:
                body.classList.add('theme-dark'); // Default à dark
                break;
        }
        
        console.log('🎨 Nouveau thème appliqué:', theme, 'Classes finales:', body.className);
        
        // Sauvegarder le thème
        this.applySetting('theme', theme);
        console.log('🎨 Thème sauvegardé en cookies');
        
        // Mettre à jour l'affichage du thème actuel si l'élément existe
        const currentThemeElement = document.getElementById('current-theme');
        if (currentThemeElement) {
            const themeNames = {
                'default': 'CLK Default',
                'dark': 'Dark Mode',
                'light': 'Light Mode',
                'cyberpunk': 'Cyberpunk',
                'neon': 'Neon',
                'matrix': 'Matrix',
                'minimal': 'Minimal'
            };
            currentThemeElement.textContent = themeNames[theme] || 'Dark Mode';
            console.log('🎨 Affichage du thème actuel mis à jour:', themeNames[theme]);
        }
    },

    // Nouvelle fonction pour charger tous les paramètres sauvegardés au démarrage
    loadAllSavedSettings() {
        try {
            // Charger et appliquer le thème
            const savedTheme = this.getSetting('theme', 'default'); // Changé de 'dark' à 'default'
            this.switchTheme(savedTheme);
            
            // Charger et appliquer la police
            const savedFont = this.getSetting('font_family', "'Courier New', monospace");
            if (this.consoleOutput) {
                this.consoleOutput.style.fontFamily = savedFont;
            }
            
            // Charger et appliquer la taille de police
            const savedFontSize = this.getSetting('font_size', 14);
            if (this.consoleOutput) {
                this.consoleOutput.style.fontSize = savedFontSize + 'px';
            }
            
            // Charger les paramètres de comportement
            const showTimestamps = this.getSetting('show_timestamps', false);
            this.applySetting('show_timestamps', showTimestamps);
            
            const showLineNumbers = this.getSetting('show_line_numbers', false);
            this.applySetting('show_line_numbers', showLineNumbers);
            
            const autoSaveHistory = this.getSetting('auto_save_history', true);
            this.applySetting('auto_save_history', autoSaveHistory);
            
            const enableAutocomplete = this.getSetting('enable_autocomplete', true);
            this.applySetting('enable_autocomplete', enableAutocomplete);
            
            const autocompleteFiles = this.getSetting('autocomplete_files', true);
            this.applySetting('autocomplete_files', autocompleteFiles);
            
            const enableSounds = this.getSetting('enable_sounds', true);
            this.applySetting('enable_sounds', enableSounds);
            
            const enableNotifications = this.getSetting('enable_notifications', true);
            this.applySetting('enable_notifications', enableNotifications);
            
            const smoothAnimations = this.getSetting('smooth_animations', true);
            this.applySetting('smooth_animations', smoothAnimations);
            
            const highContrast = this.getSetting('high_contrast', false);
            this.applyHighContrast(highContrast);
            
            // Charger les paramètres d'arrière-plan (couleur unie par défaut)
            const bgType = this.getSetting('console_bg_type', 'color');
            const bgGradient = this.getSetting('console_bg_gradient', { color1: '#1e293b', color2: '#0f172a' });
            const bgColor = this.getSetting('console_bg_color', '#18181b');
            const bgImageUrl = this.getSetting('console_bg_image_url', '');
            
            if (this.consoleOutput) {
                if (bgType === 'gradient') {
                    this.consoleOutput.style.backgroundColor = '';
                    this.consoleOutput.style.backgroundImage = '';
                    this.consoleOutput.style.background = `linear-gradient(135deg, ${bgGradient.color1}, ${bgGradient.color2})`;
                } else if (bgType === 'color') {
                    this.consoleOutput.style.backgroundImage = '';
                    this.consoleOutput.style.background = '';
                    this.consoleOutput.style.backgroundColor = bgColor;
                } else if (bgType === 'image' && bgImageUrl) {
                    this.consoleOutput.style.backgroundColor = '';
                    this.consoleOutput.style.background = '';
                    this.consoleOutput.style.backgroundImage = `url('${bgImageUrl}')`;
                    this.consoleOutput.style.backgroundSize = 'cover';
                    this.consoleOutput.style.backgroundPosition = 'center';
                } else {
                    // Type 'default' ou non reconnu - utiliser le dégradé par défaut
                    this.consoleOutput.style.backgroundColor = '';
                    this.consoleOutput.style.backgroundImage = '';
                    this.consoleOutput.style.background = `linear-gradient(135deg, ${bgGradient.color1}, ${bgGradient.color2})`;
                }
            }
            
            console.log('✅ Tous les paramètres ont été chargés depuis les cookies');
        } catch (error) {
            console.warn('Erreur lors du chargement des paramètres:', error);
        }
    },

    loadAllSettings() {
        try {
            const savedSettings = localStorage.getItem('clk_all_settings');
            if (!savedSettings) return;

            const settings = JSON.parse(savedSettings);
            
            // Appliquer les paramètres
            Object.entries(settings).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                        this.updateToggleAppearance(element);
                    } else {
                        element.value = value;
                    }
                }
            });

            // Appliquer les paramètres spéciaux
            if (settings['high-contrast-mode']) {
                this.applyHighContrast(settings['high-contrast-mode']);
            }
            
            if (settings['console-bg-type']) {
                this.switchBackgroundType(settings['console-bg-type']);
            }
        } catch (error) {
            console.warn('Erreur lors du chargement des paramètres:', error);
        }
    },

    exportSettings() {
        const settings = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            settings: {}
        };

        // Collecter tous les paramètres
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('clk_')) {
                    settings.settings[key] = localStorage.getItem(key);
                }
            }

            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clk_settings.json';
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification({
                type: 'success',
                title: 'Export réussi',
                message: 'Les paramètres ont été exportés avec succès.',
                duration: 3000
            });
        } catch (error) {
            this.showNotification({
                type: 'error',
                title: 'Erreur d\'export',
                message: 'Impossible d\'exporter les paramètres.',
                duration: 3000
            });
        }
    },

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const importedData = JSON.parse(evt.target.result);
                    
                    if (importedData.settings) {
                        Object.entries(importedData.settings).forEach(([key, value]) => {
                            localStorage.setItem(key, value);
                        });

                        // Recharger les paramètres
                        this.loadAllSettings();
                        
                        this.showNotification({
                            type: 'success',
                            title: 'Import réussi',
                            message: 'Les paramètres ont été importés avec succès.',
                            duration: 3000
                        });
                    }
                } catch (error) {
                    this.showNotification({
                        type: 'error',
                        title: 'Erreur d\'import',
                        message: 'Fichier de paramètres invalide.',
                        duration: 3000
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    resetSettings() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
            // Supprimer tous les paramètres
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('clk_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Recharger la page pour appliquer les valeurs par défaut
            location.reload();
        }
    },

    clearAllData() {
        if (confirm('⚠️ ATTENTION: Cette action supprimera TOUTES vos données (paramètres, historique, plugins, etc.). Cette action est irréversible. Continuer ?')) {
            try {
                // Vider localStorage
                localStorage.clear();
                
                // Vider les cookies
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                
                this.showNotification({
                    type: 'success',
                    title: 'Données effacées',
                    message: 'Toutes les données ont été supprimées. Rechargement...',
                    duration: 2000
                });
                
                setTimeout(() => location.reload(), 2000);
            } catch (error) {
                this.showNotification({
                    type: 'error',
                    title: 'Erreur',
                    message: 'Impossible d\'effacer toutes les données.',
                    duration: 3000
                });
            }
        }
    },

    updateSettingsStats() {
        try {
            // Mettre à jour les statistiques
            const commandsCount = this.history ? this.history.length : 0;
            const historySize = commandsCount;
            const pluginsCount = this.pluginManager ? this.pluginManager.listPlugins().length : 0;
            
            // Calculer l'espace de stockage utilisé
            let storageSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    storageSize += localStorage[key].length + key.length;
                }
            }
            storageSize = Math.round(storageSize / 1024); // Convertir en KB

            // Mettre à jour l'affichage
            const statsCommands = document.getElementById('stats-commands');
            const statsHistory = document.getElementById('stats-history');
            const statsPlugins = document.getElementById('stats-plugins');
            const statsStorage = document.getElementById('stats-storage');

            if (statsCommands) statsCommands.textContent = commandsCount;
            if (statsHistory) statsHistory.textContent = historySize;
            if (statsPlugins) statsPlugins.textContent = pluginsCount;
            if (statsStorage) statsStorage.textContent = storageSize + ' KB';
        } catch (error) {
            console.warn('Erreur lors de la mise à jour des statistiques:', error);
        }
    },

    // === FONCTIONS HELPER POUR LA COMMANDE LS ===

    // Obtenir la liste des fichiers selon les options
    getFileList(targetNode, options) {
        const files = [];
        
        for (const [name, node] of Object.entries(targetNode.children)) {
            // Filtrer les fichiers cachés selon les options
            if (name.startsWith('.')) {
                if (!options.all && !options['almost-all']) {
                    continue; // Ignorer les fichiers cachés
                }
                if (options['almost-all'] && (name === '.' || name === '..')) {
                    continue; // Ignorer . et .. avec -A
                }
            }
            
            files.push(this.getFileStats(node, name));
        }

        // Ajouter . et .. si -a est utilisé
        if (options.all) {
            files.unshift(
                this.getFileStats({ type: 'directory', children: {} }, '..'),
                this.getFileStats(targetNode, '.')
            );
        }

        return files;
    },

    // Obtenir les statistiques d'un fichier/dossier
    getFileStats(node, name) {
        const now = new Date();
        const size = node.type === 'directory' ? 4096 : (node.content ? node.content.length : 0);
        
        return {
            name: name,
            type: node.type,
            size: size,
            permissions: node.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--',
            owner: 'user',
            group: 'user',
            modified: now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            links: 1,
            node: node
        };
    },

    // Trier la liste des fichiers
    sortFileList(files, options) {
        let sortedFiles = [...files];

        // Trier par nom par défaut
        sortedFiles.sort((a, b) => a.name.localeCompare(b.name));

        // Trier par taille si demandé
        if (options.size) {
            sortedFiles.sort((a, b) => b.size - a.size);
        }

        // Trier par temps de modification si demandé
        if (options.time) {
            sortedFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        }

        // Inverser l'ordre si demandé
        if (options.reverse) {
            sortedFiles.reverse();
        }

        return sortedFiles;
    },

    // Formater le nom d'un fichier avec couleurs et indicateurs
    formatFileName(file, options) {
        let name = file.name;
        let color = '';
        let suffix = '';

        // Couleurs selon le type
        if (file.type === 'directory') {
            color = 'text-blue-400';
            if (options.classify) suffix = '/';
        } else {
            // Déterminer le type de fichier par extension
            const ext = name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
                color = 'text-purple-400';
            } else if (['txt', 'md', 'log'].includes(ext)) {
                color = 'text-green-400';
            } else if (['js', 'html', 'css', 'json'].includes(ext)) {
                color = 'text-yellow-400';
            } else {
                color = 'text-white';
            }
        }

        return color ? `<span class="${color}">${name}${suffix}</span>` : name + suffix;
    },

    // Formater l'affichage long (-l)
    formatLongListing(files, options) {
        if (files.length === 0) return '';

        const lines = [];
        
        // Calculer les largeurs maximales pour l'alignement
        const maxSizeWidth = Math.max(...files.map(f => this.formatSize(f.size, options).length));
        const maxOwnerWidth = Math.max(...files.map(f => f.owner.length));
        const maxGroupWidth = options['no-group'] ? 0 : Math.max(...files.map(f => f.group.length));

        files.forEach(file => {
            const permissions = file.permissions;
            const links = file.links.toString().padStart(3);
            const owner = file.owner.padEnd(maxOwnerWidth);
            const group = options['no-group'] ? '' : file.group.padEnd(maxGroupWidth) + ' ';
            const size = this.formatSize(file.size, options).padStart(maxSizeWidth);
            const modified = file.modified;
            const name = this.formatFileName(file, options);

            const line = `${permissions} ${links} ${owner} ${group}${size} ${modified} ${name}`;
            lines.push(line);
        });

        return lines.join('\n');
    },

    // Formater la taille avec option human-readable
    formatSize(size, options) {
        if (options['human-readable']) {
            const units = ['B', 'K', 'M', 'G', 'T'];
            let unitIndex = 0;
            let humanSize = size;

            while (humanSize >= 1024 && unitIndex < units.length - 1) {
                humanSize /= 1024;
                unitIndex++;
            }

            if (unitIndex === 0) {
                return humanSize.toString();
            } else {
                return humanSize.toFixed(1).replace(/\.0$/, '') + units[unitIndex];
            }
        }

        return size.toString();
    },

    // Affichage récursif (-R)
    displayRecursive(node, basePath, options, depth) {
        if (depth > 10) return; // Limite de profondeur pour éviter les boucles infinies

        // Vérifier si le système I-Node est disponible
        const useInodeSystem = this.inodeAdapter && this.inodeAdapter.inodeFS;

        if (useInodeSystem) {
            // Utiliser le système I-Node pour la récursion
            const dirContents = this.inodeAdapter.listDirectory(basePath);
            
            for (const item of dirContents) {
                if (item.type === 'directory' && !item.name.startsWith('.') && item.name !== '.' && item.name !== '..') {
                    const childPath = basePath === '/' ? `/${item.name}` : `${basePath}/${item.name}`;
                    this.addOutput(`\n${childPath}:`);
                    
                    // Reconstruire le nœud pour compatibilité avec getFileList
                    const childDirContents = this.inodeAdapter.listDirectory(childPath);
                    const children = {};
                    
                    for (const childItem of childDirContents) {
                        if (childItem.name !== '.' && childItem.name !== '..') {
                            if (childItem.type === 'file') {
                                children[childItem.name] = {
                                    type: 'file',
                                    content: this.inodeAdapter.readFile(childPath === '/' ? `/${childItem.name}` : `${childPath}/${childItem.name}`) || ''
                                };
                            } else {
                                children[childItem.name] = {
                                    type: 'directory',
                                    children: {}
                                };
                            }
                        }
                    }
                    
                    const childNode = {
                        type: 'directory',
                        children: children
                    };
                    
                    const childFiles = this.getFileList(childNode, options);
                    const sortedChildFiles = this.sortFileList(childFiles, options);
                    
                    if (options.long) {
                        const longOutput = this.formatLongListing(sortedChildFiles, options);
                        if (longOutput) {
                            longOutput.split('\n').forEach(line => {
                                if (line.trim()) {
                                    this.addOutput(line);
                                }
                            });
                        }
                    } else {
                        this.addOutput(sortedChildFiles.map(file => this.formatFileName(file, options)).join('<span class="mx-1"></span>'));
                    }
                    
                    this.displayRecursive(childNode, childPath, options, depth + 1);
                }
            }
        } else {
            // Utiliser l'ancien système
            for (const [name, childNode] of Object.entries(node.children)) {
                if (childNode.type === 'directory' && !name.startsWith('.')) {
                    const childPath = basePath + '/' + name;
                    this.addOutput(`\n${childPath}:`);
                    
                    const childFiles = this.getFileList(childNode, options);
                    const sortedChildFiles = this.sortFileList(childFiles, options);
                    
                    if (options.long) {
                        const longOutput = this.formatLongListing(sortedChildFiles, options);
                        if (longOutput) {
                            longOutput.split('\n').forEach(line => {
                                if (line.trim()) {
                                    this.addOutput(line);
                                }
                            });
                        }
                    } else {
                        this.addOutput(sortedChildFiles.map(file => this.formatFileName(file, options)).join('<span class="mx-1"></span>'));
                    }
                    
                    this.displayRecursive(childNode, childPath, options, depth + 1);
                }
            }
        }
    }

};

// Rendre l'objet app accessible globalement
window.app = app;

// Log pour vérifier que app est bien défini
console.log('App object defined and exposed globally:', typeof window.app !== 'undefined');

// --- Initialize the App ---
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing app...');
    
    // Nettoyer les cookies corrompus au démarrage
    try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name, value] = cookie.split('=').map(s => s.trim());
            if (name && value) {
                try {
                    // Tenter de décoder et parser les cookies qui semblent être du JSON
                    if (value.includes('%7B') || value.startsWith('{')) {
                        const decoded = decodeURIComponent(value);
                        JSON.parse(decoded);
                    }
                } catch (error) {
                    console.warn(`🧹 Nettoyage du cookie corrompu: ${name}`);
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                }
            }
        });
    } catch (error) {
        console.warn('Erreur lors du nettoyage des cookies:', error);
    }
    
    try {
        app.init();
        // Appel initial
        app.updatePromptDisplay();

        // Écoute du redimensionnement
        window.addEventListener('resize', () => app.updatePromptDisplay());
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // Gestion spécifique des erreurs de quota localStorage
        if (error.name === 'QuotaExceededError') {
            console.log('Tentative de nettoyage du localStorage pour résoudre l\'erreur de quota...');
            try {
                // Nettoyer le localStorage et réessayer
                if (app.settingsManager) {
                    app.settingsManager.cleanupLocalStorage();
                }
                // Réessayer l'initialisation avec des paramètres par défaut
                app.initWithDefaults();
            } catch (retryError) {
                console.error('Impossible de récupérer après l\'erreur de quota:', retryError);
                alert('Erreur de stockage détectée. L\'application fonctionnera avec des paramètres par défaut pour cette session.');
            }
        }
    }
});