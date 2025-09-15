/**
 * Gestionnaire d'onglets pour CLK Console
 * Gère la création, suppression, commutation et sauvegarde des onglets
 */

const TabManager = {
    // Propriétés des onglets
    tabs: [],
    activeTabId: null,
    nextTabId: 1,
    tabsContainer: null,
    newTabButton: null,
    compactTabs: false,

    // Initialisation du gestionnaire d'onglets (OPTIMISÉE)
    init(app) {
        this.app = app;
        this.tabsContainer = document.getElementById('tabs-container');
        this.newTabButton = document.getElementById('new-tab-button');

        // Initialiser les compteurs
        this.saveCounter = 0;
        this.renderCounter = 0;

        // Charger les onglets depuis les cookies
        this.loadTabsFromCookie();

        if (this.newTabButton) {
            this.newTabButton.addEventListener('click', this.createNewTab.bind(this));
        }

        const toggleTabsSizeButton = document.getElementById('toggle-tabs-size-button');
        if (toggleTabsSizeButton) {
            toggleTabsSizeButton.addEventListener('click', this.toggleTabsSize.bind(this));
        }

        // OPTIMISATION: Démarrer le nettoyage automatique des onglets
        this.startTabsCleanup();
    },

    // NOUVELLE MÉTHODE: Démarrage du nettoyage automatique
    startTabsCleanup() {
        // Nettoyage immédiat
        setTimeout(() => {
            this.cleanupTabsData();
        }, 5000);

        // Nettoyage périodique toutes les 2 minutes
        setInterval(() => {
            this.cleanupTabsData();
            this.resetCounters();
        }, 120000); // 2 minutes

        console.log('🔄 Nettoyage automatique des onglets activé');
    },

    // Sauvegarde des onglets dans les cookies avec optimisation
    saveTabsToCookie() {
        const tabsData = {
            tabs: this.tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                currentDir: tab.currentDir,
                // OPTIMISATION: Limiter drastiquement l'historique pour éviter la croissance
                outputHistory: this.optimizeOutputHistory(tab.outputHistory || []),
                isActive: tab.isActive,
                // OPTIMISATION: Limiter l'historique des commandes aussi
                history: this.optimizeCommandHistory(tab.history || []),
                historyIndex: tab.historyIndex || -1,
                commandCount: tab.commandCount || 0
            })),
            activeTabId: this.activeTabId,
            nextTabId: this.nextTabId
        };
        
        try {
            // Sauvegarder avec le StorageManager optimisé si disponible
            if (window.StorageManager && typeof window.StorageManager.save === 'function') {
                window.StorageManager.save('console_tabs', tabsData, true);
            } 
            
            // TOUJOURS sauvegarder aussi en localStorage direct pour la compatibilité
            try {
                const jsonString = JSON.stringify(tabsData);
                localStorage.setItem('console_tabs', jsonString);
                console.log('✅ Onglets sauvegardés en localStorage direct');
            } catch (e) {
                console.warn('Erreur sauvegarde localStorage direct:', e);
            }
            
            // Sauvegarde de secours ultra-légère
            const essentialData = {
                activeTabId: this.activeTabId,
                nextTabId: this.nextTabId,
                tabCount: this.tabs.length
            };
            document.cookie = `console_tabs_backup=${encodeURIComponent(JSON.stringify(essentialData))};path=/;max-age=31536000`;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des onglets:', error);
            // Tentative de sauvegarde d'urgence avec données minimales
            this.saveMinimalTabsData();
        }
    },

    // NOUVELLE MÉTHODE: Optimiser l'historique de sortie (CORRIGÉ)
    optimizeOutputHistory(outputHistory) {
        if (!outputHistory || outputHistory.length === 0) return [];
        
        // Limiter à seulement 25 éléments les plus récents (augmenté de 20 pour préserver plus)
        const limitedHistory = outputHistory.slice(-25);
        
        // Compresser le contenu HTML en préservant la structure
        return limitedHistory.map(item => ({
            // Utiliser la compression améliorée qui préserve l'affichage
            html: this.compressHTML(item.html || ''),
            className: item.className || ''
        }));
    },

    // NOUVELLE MÉTHODE: Optimiser l'historique des commandes
    optimizeCommandHistory(commandHistory) {
        if (!commandHistory || commandHistory.length === 0) return [];
        
        // Limiter à 50 commandes récentes (au lieu de tout garder)
        return commandHistory.slice(-50);
    },

    // NOUVELLE MÉTHODE: Compresser le HTML pour économiser l'espace (CORRIGÉ)
    compressHTML(html) {
        if (!html || typeof html !== 'string') return '';
        
        return html
            // Supprimer seulement les espaces multiples en ligne (garder les retours à la ligne)
            .replace(/[ \t]+/g, ' ')
            // Supprimer les espaces en début/fin de ligne
            .replace(/^\s+|\s+$/gm, '')
            // Supprimer les lignes complètement vides (mais garder les <br> et structures)
            .replace(/\n\s*\n/g, '\n')
            // Supprimer les commentaires HTML volumineux
            .replace(/<!--[\s\S]*?-->/g, '')
            // Supprimer les attributs style très volumineux (>100 chars) seulement
            .replace(/\s+style="[^"]{100,}"/g, '')
            // Limiter la longueur totale à 800 caractères par entrée (augmenté de 500)
            .substring(0, 800);
    },

    // NOUVELLE MÉTHODE: Sauvegarde minimale en cas d'urgence
    saveMinimalTabsData() {
        try {
            const minimalData = {
                tabs: this.tabs.map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    currentDir: tab.currentDir,
                    isActive: tab.isActive,
                    commandCount: tab.commandCount || 0
                    // Pas d'historique pour économiser l'espace
                })),
                activeTabId: this.activeTabId,
                nextTabId: this.nextTabId
            };
            
            localStorage.setItem('console_tabs_minimal', JSON.stringify(minimalData));
            console.log('🚨 Sauvegarde minimale des onglets effectuée');
        } catch (error) {
            console.error('Erreur sauvegarde minimale:', error);
        }
    },

    // Chargement des onglets depuis les cookies (CORRIGÉ)
    loadTabsFromCookie() {
        try {
            // Essayer d'abord avec le StorageManager optimisé
            let savedData = null;
            if (window.StorageManager && typeof window.StorageManager.load === 'function') {
                savedData = window.StorageManager.load('console_tabs');
            } 
            
            // Si StorageManager n'a pas de données, essayer localStorage direct
            if (!savedData) {
                const rawData = localStorage.getItem('console_tabs');
                if (rawData) {
                    try {
                        savedData = JSON.parse(rawData);
                    } catch (e) {
                        console.warn('Erreur parsing console_tabs:', e);
                    }
                }
            }
            
            // Si toujours pas de données, essayer avec le préfixe clk_
            if (!savedData) {
                const rawDataWithPrefix = localStorage.getItem('clk_console_tabs');
                if (rawDataWithPrefix) {
                    try {
                        savedData = JSON.parse(rawDataWithPrefix);
                    } catch (e) {
                        console.warn('Erreur parsing clk_console_tabs:', e);
                    }
                }
            }
            
            if (savedData && savedData.tabs && Array.isArray(savedData.tabs) && savedData.tabs.length > 0) {
                this.tabs = savedData.tabs.map(tab => ({
                    id: tab.id || this.nextTabId++,
                    title: tab.title || `Terminal ${tab.id}`,
                    currentDir: tab.currentDir || '/home/user',
                    // OPTIMISATION: Les données sont déjà compressées
                    outputHistory: tab.outputHistory || [],
                    isActive: false,
                    history: tab.history || [],
                    historyIndex: tab.historyIndex || -1,
                    commandCount: tab.commandCount || 0
                }));
                
                this.nextTabId = savedData.nextTabId || this.tabs.length + 1;
                this.activeTabId = savedData.activeTabId || this.tabs[0]?.id || null;
                
                // Mettre à jour l'état actif
                this.tabs.forEach(tab => {
                    tab.isActive = tab.id === this.activeTabId;
                });
                
                this.renderTabs();
                this.loadTabState(this.activeTabId);
                console.log('✅ Onglets chargés avec succès:', this.tabs.length, 'onglets');
                return;
            }
            
            // Fallback vers sauvegarde minimale
            const minimalData = localStorage.getItem('console_tabs_minimal');
            if (minimalData) {
                const parsedMinimal = JSON.parse(minimalData);
                if (parsedMinimal.tabs && parsedMinimal.tabs.length > 0) {
                    this.tabs = parsedMinimal.tabs.map(tab => ({
                        ...tab,
                        outputHistory: [], // Pas d'historique dans la version minimale
                        history: [],
                        historyIndex: -1
                    }));
                    
                    this.nextTabId = parsedMinimal.nextTabId || this.tabs.length + 1;
                    this.activeTabId = parsedMinimal.activeTabId || this.tabs[0]?.id || null;
                    
                    this.tabs.forEach(tab => {
                        tab.isActive = tab.id === this.activeTabId;
                    });
                    
                    this.renderTabs();
                    this.loadTabState(this.activeTabId);
                    console.log('🔄 Données minimales des onglets restaurées');
                    return;
                }
            }
            
            // Fallback vers les cookies de sauvegarde
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
                            history: [],
                            historyIndex: -1,
                            commandCount: 0
                        });
                    }
                    this.activeTabId = backupData.activeTabId || 1;
                    this.renderTabs();
                    
                    this.app.loadHistoryFromCookie();
                    this.app.addOutput(this.app.defaultMessage, 'system');
                    return;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des onglets:', error);
        }
        
        // Si aucune sauvegarde trouvée, créer le premier onglet
        this.createFirstTab();
    },

    // Création du premier onglet
    createFirstTab() {
        this.app.loadHistoryFromCookie();
        
        const firstTab = {
            id: this.nextTabId++,
            title: 'Terminal 1',
            currentDir: '/home/user',
            outputHistory: [],
            isActive: true,
            history: [...this.app.history],
            historyIndex: this.app.historyIndex || -1,
            commandCount: 0
        };
        
        this.tabs.push(firstTab);
        this.activeTabId = firstTab.id;
        this.renderTabs();
        this.saveTabsToCookie();
        
        this.app.addOutput(this.app.defaultMessage, 'system');
    },

    // Création d'un nouvel onglet
    createNewTab() {
        const newTab = {
            id: this.nextTabId++,
            title: `Terminal ${this.nextTabId - 1}`,
            currentDir: '/home/user',
            outputHistory: [],
            isActive: false,
            history: [],
            historyIndex: -1,
            commandCount: 0
        };
        
        this.saveCurrentTabState();
        this.tabs.push(newTab);
        this.switchToTab(newTab.id);
        this.renderTabs();
        this.saveTabsToCookie();
    },

    // Sauvegarde de l'état de l'onglet actuel (CORRIGÉE pour préserver l'affichage)
    saveCurrentTabState() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        activeTab.currentDir = this.app.currentDir;
        // OPTIMISATION: Limiter l'historique des commandes
        activeTab.history = this.optimizeCommandHistory([...this.app.history]);
        activeTab.historyIndex = this.app.historyIndex;
        
        const outputElements = Array.from(this.app.outputElement.children)
            .filter(child => 
                child.id !== 'loading-llm-indicator' && 
                child.id !== 'console-end-ref' &&
                !child.classList.contains('loading-animation')
            );
        
        // OPTIMISATION: Augmenté de 15 à 20 éléments pour préserver plus d'affichage
        const limitedElements = outputElements.slice(-20);
        
        // OPTIMISATION: Compression légère qui préserve l'affichage
        activeTab.outputHistory = limitedElements.map(child => {
            let html = child.innerHTML;
            
            // Pour les éléments critiques (dessins ASCII, UI), pas de compression
            if (html.includes('pre') || html.includes('code') || 
                html.includes('ascii') || html.includes('github') ||
                html.includes('░') || html.includes('▓') || html.includes('█') ||
                html.includes('┌') || html.includes('└') || html.includes('│') ||
                html.includes('CLK') || html.includes('Console')) {
                // Garder intégralement les dessins et UI spéciaux
                return {
                    html: html.length > 1000 ? html.substring(0, 1000) + '...' : html,
                    className: child.className || ''
                };
            } else {
                // Compression légère pour le reste
                return {
                    html: this.compressHTML(html),
                    className: child.className || ''
                };
            }
        });

        if (this.app.loadingLLMIndicator && !this.app.outputElement.contains(this.app.loadingLLMIndicator)) {
            this.app.outputElement.appendChild(this.app.loadingLLMIndicator);
        }

        if (this.app.consoleEndRefElement && !this.app.outputElement.contains(this.app.consoleEndRefElement)) {
            this.app.outputElement.appendChild(this.app.consoleEndRefElement);
        }

        // OPTIMISATION: Sauvegarder seulement tous les 3 appels pour réduire la fréquence
        if (!this.saveCounter) this.saveCounter = 0;
        this.saveCounter++;
        
        if (this.saveCounter % 3 === 0) {
            this.saveTabsToCookie();
            this.renderTabs();
        }
    },

    // Chargement de l'état d'un onglet
    loadTabState(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;

        this.app.currentDir = tab.currentDir || '/home/user';
        
        if (tab.history && tab.history.length > 0) {
            this.app.history = [...tab.history];
            this.app.historyIndex = tab.historyIndex || -1;
        } else {
            this.app.loadHistoryFromCookie();
            this.app.historyIndex = -1;
        }

        this.clearConsoleKeepIndicators();
        
        if (tab.outputHistory && tab.outputHistory.length > 0) {
            tab.outputHistory.forEach(item => {
                const div = document.createElement('div');
                div.innerHTML = item.html;
                if (item.className) {
                    div.className = item.className;
                }
                this.app.outputElement.insertBefore(div, this.app.consoleEndRefElement);
            });
        } else {
            this.app.addOutput(this.app.defaultMessage, 'system');
        }

        this.app.updatePrompt();
        this.app.scrollToBottom();
    },

    // Nettoyage de la console en gardant les indicateurs
    clearConsoleKeepIndicators() {
        const toKeep = [this.app.loadingLLMIndicator, this.app.consoleEndRefElement];
        Array.from(this.app.outputElement.childNodes).forEach(child => {
            if (!toKeep.includes(child)) {
                this.app.outputElement.removeChild(child);
            }
        });
    },

    // Renommage d'un onglet
    renameTab(tabId, newTitle) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = newTitle;
            this.renderTabs();
            this.saveTabsToCookie();
        }
    },

    // Rendu des onglets
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

            const activityIndicator = tab.isActive 
                ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-r-full shadow-lg shadow-blue-400/50 animate-pulse"></div>'
                : '';

            const hasNewActivity = (tab.commandCount && tab.commandCount > 0 && !tab.isActive) || (tab.outputHistory && tab.outputHistory.length > 0 && !tab.isActive);
            const notificationBadge = hasNewActivity
                ? '<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce shadow-lg"></div>'
                : '';

            tabElement.innerHTML = `
                ${activityIndicator}
                ${notificationBadge}
                
                <div class="flex items-center min-w-0 flex-1 relative">
                    <div class="flex-shrink-0 mr-3 p-1.5 rounded-lg transition-all duration-150 ${
                        tab.isActive 
                            ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400 shadow-inner shadow-blue-400/20' 
                            : 'bg-gradient-to-br from-gray-700/40 to-gray-800/30 text-gray-500 group-hover:bg-gradient-to-br group-hover:from-gray-600/50 group-hover:to-gray-700/40 group-hover:text-gray-400'
                    }">
                        <svg class="w-4 h-4 transition-transform duration-150 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l3 3-3 3m5 0h3"/>
                        </svg>
                    </div>
                    
                    <span class="truncate text-sm font-semibold select-none pointer-events-none flex-1 min-w-0 relative ${
                        tab.isActive ? 'text-white' : 'text-gray-300'
                    }" title="${tab.title}">
                        ${tab.title}
                        ${tab.isActive ? '<span class="inline-block w-px h-4 ml-1 bg-blue-400 animate-pulse"></span>' : ''}
                    </span>
                    
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
                
                ${tab.isActive ? `
                    <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 
                                shadow-lg shadow-blue-400/50 animate-pulse"></div>
                ` : ''}
                
                <div class="absolute right-1 top-1 w-2 h-2 rounded-full transition-all duration-150 ${
                    tab.isActive 
                        ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' 
                        : 'bg-gray-600 group-hover:bg-gray-500'
                }"></div>
            `;

            let clickTimeout = null;
            let clickCount = 0;

            tabElement.addEventListener('click', (e) => {
                if (e.target.closest('.close-tab-btn')) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                clickCount++;
                
                if (clickCount === 1) {
                    clickTimeout = setTimeout(() => {
                        this.switchToTab(tab.id);
                        clickCount = 0;
                    }, 250);
                } else if (clickCount === 2) {
                    clearTimeout(clickTimeout);
                    this.startTabRename(tab.id, tabElement);
                    clickCount = 0;
                }
            });

            // Gestion du clic molette (bouton du milieu) pour fermer l'onglet
            tabElement.addEventListener('mousedown', (e) => {
                if (e.button === 1) { // Bouton du milieu (molette)
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Ne pas fermer s'il n'y a qu'un seul onglet
                    if (this.tabs.length > 1) {
                        this.closeTab(tab.id);
                    } else {
                        // Feedback visuel pour indiquer qu'on ne peut pas fermer le dernier onglet
                        this.app.showNotification({
                            type: 'warning',
                            title: '⚠️ Impossible de fermer',
                            message: 'Vous ne pouvez pas fermer le dernier onglet',
                            duration: 2000
                        });
                    }
                }
            });

            // Empêcher le comportement par défaut du clic molette (scroll)
            tabElement.addEventListener('auxclick', (e) => {
                if (e.button === 1) { // Bouton du milieu
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            const closeBtn = tabElement.querySelector('.close-tab-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeTab(tab.id);
                });
            }

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

            tabElement.setAttribute('tabindex', '0');
            tabElement.setAttribute('role', 'tab');
            tabElement.setAttribute('aria-selected', tab.isActive);
            tabElement.setAttribute('aria-label', `Onglet ${tab.title}, ${tab.commandCount || 0} commandes. Double-clic pour renommer, F2 pour renommer.`);

            this.tabsContainer.appendChild(tabElement);
        });

        const delimiter = document.createElement('div');
        delimiter.className = 'flex-1 bg-gradient-to-r from-gray-900/50 via-gray-800/30 to-gray-900/20 border-b border-gray-700/20';
        this.tabsContainer.appendChild(delimiter);
    },

    // Début du renommage d'un onglet
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

    // Basculement vers un onglet
    switchToTab(tabId) {
        this.saveCurrentTabState();
        
        this.tabs.forEach(tab => {
            tab.isActive = tab.id === tabId;
        });
        
        this.activeTabId = tabId;
        this.loadTabState(tabId);
        this.renderTabs();
        this.saveTabsToCookie();
    },

    // Fermeture d'un onglet
    closeTab(tabId) {
        if (this.tabs.length <= 1) {
            this.app.addOutput('<span class="text-yellow-400">⚠️ Impossible de fermer le dernier onglet</span>', 'system');
            return;
        }

        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        const wasActive = this.tabs[tabIndex].isActive;
        this.tabs.splice(tabIndex, 1);

        if (wasActive) {
            const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
            const newActiveTab = this.tabs[newActiveIndex];
            this.switchToTab(newActiveTab.id);
        }

        this.renderTabs();
        this.saveTabsToCookie();
    },

    // Incrémentation du compteur de commandes de l'onglet actif (OPTIMISÉE)
    incrementActiveTabCommandCount(arg) {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        if (!activeTab.commandCount) {
            activeTab.commandCount = 0;
        }
        if (arg === "clear") {
            activeTab.commandCount = 0;
            return;
        } else {
            activeTab.commandCount++;
        }

        // OPTIMISATION: Ne pas rendre/sauvegarder à chaque incrémentation
        // Seulement tous les 5 appels pour réduire la charge
        if (!this.renderCounter) this.renderCounter = 0;
        this.renderCounter++;
        
        if (this.renderCounter % 5 === 0) {
            this.renderTabs();
            this.saveTabsToCookie();
        }
    },

    // NOUVELLE MÉTHODE: Nettoyage périodique des données des onglets
    cleanupTabsData() {
        this.tabs.forEach(tab => {
            // Nettoyer l'historique de sortie trop volumineux
            if (tab.outputHistory && tab.outputHistory.length > 15) {
                tab.outputHistory = tab.outputHistory.slice(-15);
            }
            
            // Nettoyer l'historique des commandes trop volumineux
            if (tab.history && tab.history.length > 50) {
                tab.history = tab.history.slice(-50);
            }
            
            // Compresser le HTML existant
            if (tab.outputHistory) {
                tab.outputHistory = tab.outputHistory.map(item => ({
                    html: this.compressHTML(item.html),
                    className: item.className || ''
                }));
            }
        });
        
        console.log('🧹 Nettoyage des données des onglets terminé');
        this.saveTabsToCookie();
    },

    // NOUVELLE MÉTHODE: Réinitialiser les compteurs pour éviter l'accumulation
    resetCounters() {
        this.saveCounter = 0;
        this.renderCounter = 0;
    },

    // NOUVELLE MÉTHODE: Diagnostic des onglets pour déboguer les problèmes
    debugTabsStorage() {
        console.log('=== DIAGNOSTIC DES ONGLETS ===');
        
        // Vérifier localStorage direct
        const directTabs = localStorage.getItem('console_tabs');
        console.log('📋 localStorage console_tabs:', directTabs ? `${directTabs.length} chars` : 'VIDE');
        
        // Vérifier avec préfixe clk_
        const prefixTabs = localStorage.getItem('clk_console_tabs');
        console.log('📋 localStorage clk_console_tabs:', prefixTabs ? `${prefixTabs.length} chars` : 'VIDE');
        
        // Vérifier sauvegarde minimale
        const minimalTabs = localStorage.getItem('console_tabs_minimal');
        console.log('📋 localStorage minimal:', minimalTabs ? `${minimalTabs.length} chars` : 'VIDE');
        
        // Vérifier StorageManager
        if (window.StorageManager && typeof window.StorageManager.load === 'function') {
            const smTabs = window.StorageManager.load('console_tabs');
            console.log('📋 StorageManager tabs:', smTabs ? 'DONNÉES TROUVÉES' : 'VIDE');
        } else {
            console.log('❌ StorageManager non disponible');
        }
        
        // Vérifier cookies de sauvegarde
        const cookieMatch = document.cookie.match(/(?:^|;\s*)console_tabs_backup=([^;]*)/);
        console.log('🍪 Cookie backup:', cookieMatch ? 'TROUVÉ' : 'VIDE');
        
        // État actuel des onglets
        console.log('🗂️ Onglets actuels:', this.tabs.length);
        console.log('🎯 Onglet actif:', this.activeTabId);
        
        return {
            directTabs: !!directTabs,
            prefixTabs: !!prefixTabs,
            minimalTabs: !!minimalTabs,
            storageManager: !!(window.StorageManager && window.StorageManager.load('console_tabs')),
            cookieBackup: !!cookieMatch,
            currentTabsCount: this.tabs.length,
            activeTabId: this.activeTabId
        };
    },

    // NOUVELLE MÉTHODE: Nettoyer et restaurer l'affichage des onglets corrompus
    fixDisplayIssues() {
        console.log('🔧 Correction des problèmes d\'affichage...');
        
        let fixCount = 0;
        
        this.tabs.forEach(tab => {
            if (tab.outputHistory && tab.outputHistory.length > 0) {
                tab.outputHistory = tab.outputHistory.map(item => {
                    let html = item.html;
                    
                    // Détecter si le HTML a été sur-compressé (tout sur une ligne)
                    if (html && html.length > 100 && !html.includes('\n') && 
                        (html.includes('<div') || html.includes('<span') || html.includes('<pre'))) {
                        
                        // Restaurer les retours à la ligne après les balises fermantes importantes
                        html = html
                            .replace(/(<\/div>)/g, '$1\n')
                            .replace(/(<\/p>)/g, '$1\n')
                            .replace(/(<\/pre>)/g, '$1\n')
                            .replace(/(<br\s*\/?>)/g, '$1\n')
                            .replace(/(<\/li>)/g, '$1\n')
                            // Ajouter des espaces après certaines balises inline
                            .replace(/(<\/span>)(?=<)/g, '$1 ')
                            .replace(/(<\/strong>)(?=<)/g, '$1 ')
                            .replace(/(<\/em>)(?=<)/g, '$1 ');
                        
                        fixCount++;
                    }
                    
                    return {
                        html: html,
                        className: item.className || ''
                    };
                });
            }
        });
        
        if (fixCount > 0) {
            console.log(`✅ ${fixCount} éléments d'affichage corrigés`);
            this.saveTabsToCookie();
            this.renderTabs();
            
            // Recharger l'onglet actif si nécessaire
            if (this.activeTabId) {
                this.loadTabState(this.activeTabId);
            }
        } else {
            console.log('ℹ️ Aucun problème d\'affichage détecté');
        }
        
        return fixCount;
    },

    // Mise à jour du compteur de sortie de l'onglet actif
    updateActiveTabOutputCount() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;

        const outputElements = Array.from(this.app.outputElement.children)
            .filter(child => child.id !== 'loading-llm-indicator' && child.id !== 'console-end-ref');
        
        activeTab.outputHistory = outputElements.map(child => ({
            html: child.innerHTML,
            className: child.className || ''
        }));

        this.renderTabs();
        this.saveTabsToCookie();
    },

    // Basculement de la taille des onglets
    toggleTabsSize() {
        this.compactTabs = !this.compactTabs;
        this.renderTabs();
        
        const toggleButton = document.getElementById('toggle-tabs-size-button');
        if (toggleButton) {
            toggleButton.textContent = this.compactTabs ? '📏 Normal' : '📐 Compact';
        }
    },

    // Commandes liées aux onglets
    createTabCommands() {
        return {
            newtab: (args) => {
                const title = args.join(' ').trim();
                const newTab = {
                    id: this.nextTabId++,
                    title: title || `Terminal ${this.nextTabId - 1}`,
                    currentDir: '/home/user',
                    outputHistory: [],
                    isActive: false,
                    history: [],
                    historyIndex: -1,
                    commandCount: 0
                };
                
                this.saveCurrentTabState();
                this.tabs.push(newTab);
                this.switchToTab(newTab.id);
                this.renderTabs();
                
                this.app.addOutput(`<span class="text-green-400">✅ Nouvel onglet créé : ${newTab.title}</span>`, 'system');
            },

            closetab: (args) => {
                if (this.tabs.length <= 1) {
                    this.app.addOutput('<span class="text-yellow-400">⚠️ Impossible de fermer le dernier onglet</span>', 'system');
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
                    this.app.addOutput(`<span class="text-red-400">🗑️ Fermeture de l'onglet : ${tab.title}</span>`, 'system');
                    this.closeTab(targetTabId);
                }
            },

            renametab: (args) => {
                const newTitle = args.join(' ').trim();
                if (!newTitle) {
                    this.app.addOutput('renametab: utilisation: renametab <nouveau nom>', 'error');
                    return;
                }

                this.renameTab(this.activeTabId, newTitle);
                this.app.addOutput(`<span class="text-blue-400">📝 Onglet renommé : ${newTitle}</span>`, 'system');
            },

            listtabs: () => {
                this.app.addOutput('<span class="font-bold text-blue-400">📋 Liste des onglets :</span>');
                this.tabs.forEach((tab, index) => {
                    const activeIndicator = tab.isActive ? '<span class="text-green-400">●</span>' : '<span class="text-gray-500">○</span>';
                    this.app.addOutput(`  ${activeIndicator} ${index + 1}. ${tab.title} <span class="text-gray-400">(${tab.currentDir})</span>`);
                });
            },

            switchtab: (args) => {
                if (args.length === 0) {
                    this.app.addOutput('switchtab: utilisation: switchtab <numéro>', 'error');
                    return;
                }

                const tabNumber = parseInt(args[0]);
                if (isNaN(tabNumber) || tabNumber < 1 || tabNumber > this.tabs.length) {
                    this.app.addOutput(`switchtab: numéro d'onglet invalide (1-${this.tabs.length})`, 'error');
                    return;
                }
                
                const targetTab = this.tabs[tabNumber - 1];
                this.switchToTab(targetTab.id);
                this.app.addOutput(`<span class="text-blue-400">🔄 Basculé vers l'onglet : ${targetTab.title}</span>`, 'system');
            }
        };
    }
};

// Export ES6 pour utilisation dans d'autres fichiers
export default TabManager;

// Export pour compatibilité CommonJS (optionnel)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabManager;
}