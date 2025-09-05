// Interface Windows OS pour la console CLK

// Fonction pour charger les icônes SVG
let icons = {};

// Chargement des styles CSS
let styles = '';
fetch('./plugins/windows-os/contents/styles.css')
    .then(response => response.text())
    .then(css => {
        styles = `<style>${css}</style>`;
    })
    .catch(() => {
        styles = '';
    });

async function loadIcons() {
    try {
        const response = await fetch('./plugins/windows-os/contents/icons.json');
        icons = await response.json();
    } catch (error) {
        console.warn('Impossible de charger les icônes SVG, utilisation des emojis de secours');
        // Icônes de secours (emojis)
        icons = {
            user: '👤', search: '🔍', folder: '📁', notepad: '📝', calculator: '🔢',
            terminal: '⌨️', settings: '⚙️', browser: '🌐', info: 'ℹ️', refresh: '🔄',
            lock: '🔒', restart: '🔄', power: '⏻', files: '📄', close: '✕',
            minimize: '−', maximize: '□', computer: '🖥️', windows: '🪟'
        };
    }
}

// Fonction pour créer une icône SVG ou emoji
function createIcon(iconName, size = '1em', color = 'currentColor') {
    const iconData = icons[iconName];
    if (!iconData) return '?';
    
    // Si c'est un SVG
    if (iconData.startsWith('<svg')) {
        return `<span style="display: inline-block; width: ${size}; height: ${size}; color: ${color};">${iconData}</span>`;
    }
    
    // Sinon c'est un emoji de secours
    return `<span style="font-size: ${size};">${iconData}</span>`;
}
const windowsOS = {
    name: 'win',
    description: 'Lance l\'interface graphique Windows',
    usage: 'win ou windows',
    execute: async (args) => {
        try {
            // Charger les icônes d'abord
            await loadIcons();
            // Injecter le CSS et le JavaScript pour l'interface Windows
            await injectWindowsInterface();
            return 'Interface Windows lancée avec succès !';
        } catch (error) {
            return `Erreur lors du lancement de l'interface Windows: ${error.message}`;
        }
    }
};

const windows = {
    name: 'windows',
    description: 'Lance l\'interface graphique Windows',
    usage: 'win ou windows',
    execute: async (args) => {
        return windowsOS.execute(args);
    }
};

// Fonction pour injecter l'interface Windows dans la page
async function injectWindowsInterface() {
    // Créer le conteneur Windows
    const windowsContainer = document.createElement('div');
    windowsContainer.id = 'windows-os-container';
    windowsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        user-select: none;
        overflow: hidden;
    `;

    windowsContainer.innerHTML = styles + createWindowsHTML();
    document.body.appendChild(windowsContainer);

    // Initialiser les événements
    initializeWindowsEvents();
}

function createWindowsHTML() {
    const currentTime = new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const currentDate = new Date().toLocaleDateString('fr-FR');

    return `
        <div class="windows-desktop">
            <div class="close-windows-container" 
                 onmouseenter="handleCloseContainerHover(true)" 
                 onmouseleave="handleCloseContainerHover(false)">
                <div class="drag-handle" onmousedown="startDragCloseButton(event)" title="Déplacer les contrôles">
                    <div class="drag-dot-row">
                        <div class="drag-dot"></div>
                        <div class="drag-dot"></div>
                        <div class="drag-dot"></div>
                    </div>
                    <div class="drag-dot-row">
                        <div class="drag-dot"></div>
                        <div class="drag-dot"></div>
                        <div class="drag-dot"></div>
                    </div>
                </div>
                <button class="close-windows" onclick="closeWindowsOS()" title="Fermer Windows">${createIcon('close', '18px')}</button>
            </div>
            
            <!-- Icônes du bureau -->
            <div class="desktop-icon" style="left: 30px; top: 30px;" data-app="explorer">
                <div class="icon-image">${createIcon('computer', '32px', '#333')}</div>
                <div class="icon-label">Ce PC</div>
            </div>
            
            <div class="desktop-icon" style="left: 30px; top: 150px;" data-app="notepad">
                <div class="icon-image">${createIcon('notepad', '32px', '#333')}</div>
                <div class="icon-label">Bloc-notes</div>
            </div>
            
            <div class="desktop-icon" style="left: 30px; top: 270px;" data-app="calculator">
                <div class="icon-image">${createIcon('calculator', '32px', '#333')}</div>
                <div class="icon-label">Calculatrice</div>
            </div>
            
            <div class="desktop-icon" style="left: 30px; top: 390px;" data-app="terminal">
                <div class="icon-image">${createIcon('terminal', '32px', '#333')}</div>
                <div class="icon-label">Console CLK</div>
            </div>
            
            <!-- Barre des tâches -->
            <div class="taskbar">
                <button class="start-button" onclick="toggleStartMenu()">${createIcon('windows', '18px', 'white')} Démarrer</button>
                
                <div class="system-time">
                    <div>${currentTime}</div>
                    <div style="font-size: 10px;">${currentDate}</div>
                </div>
            </div>
            
            <!-- Menu Démarrer -->
            <div class="start-menu" id="start-menu">
                <div class="start-menu-header">
                    <div class="user-profile">
                        <div class="user-avatar">${createIcon('user', '24px', 'white')}</div>
                        <div class="user-info">
                            <h3>Utilisateur</h3>
                            <p>Compte local</p>
                        </div>
                    </div>
                    <div class="search-box">
                        <div class="search-icon">${createIcon('search', '16px', 'rgba(255,255,255,0.6)')}</div>
                        <input type="text" class="search-input" placeholder="Rechercher des applications, fichiers...">
                    </div>
                </div>
                
                <div class="start-menu-content">
                    <div class="section-title">Applications</div>
                    <div class="start-menu-apps">
                        <div class="start-app" onclick="openApp('explorer')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);">${createIcon('folder', '18px', 'white')}</div>
                            <div class="app-name">Explorateur</div>
                        </div>
                        <div class="start-app" onclick="openApp('notepad')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #87ceeb 0%, #4682b4 100%);">${createIcon('notepad', '18px', 'white')}</div>
                            <div class="app-name">Bloc-notes</div>
                        </div>
                        <div class="start-app" onclick="openApp('calculator')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #90ee90 0%, #32cd32 100%);">${createIcon('calculator', '18px', 'white')}</div>
                            <div class="app-name">Calculatrice</div>
                        </div>
                        <div class="start-app" onclick="openApp('terminal')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #2e2e2e 0%, #1a1a1a 100%);">${createIcon('terminal', '18px', 'white')}</div>
                            <div class="app-name">Console CLK</div>
                        </div>
                        <div class="start-app" onclick="openApp('settings')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #dda0dd 0%, #9370db 100%);">${createIcon('settings', '18px', 'white')}</div>
                            <div class="app-name">Paramètres</div>
                        </div>
                        <div class="start-app" onclick="openApp('browser')">
                            <div class="app-icon" style="background: linear-gradient(135deg, #ff6347 0%, #dc143c 100%);">${createIcon('browser', '18px', 'white')}</div>
                            <div class="app-name">Navigateur</div>
                        </div>
                    </div>
                    
                    <div class="section-title">Actions rapides</div>
                    <div class="quick-actions">
                        <div class="quick-action" onclick="openApp('explorer')">
                            <div class="quick-action-icon">${createIcon('files', '14px')}</div>
                            <span>Mes fichiers</span>
                        </div>
                        <div class="quick-action" onclick="openApp('settings')">
                            <div class="quick-action-icon">${createIcon('settings', '14px')}</div>
                            <span>Paramètres</span>
                        </div>
                        <div class="quick-action" onclick="refreshDesktop()">
                            <div class="quick-action-icon">${createIcon('refresh', '14px')}</div>
                            <span>Actualiser</span>
                        </div>
                        <div class="quick-action" onclick="showAbout()">
                            <div class="quick-action-icon">${createIcon('info', '14px')}</div>
                            <span>À propos</span>
                        </div>
                    </div>
                </div>
                
                <div class="start-menu-footer">
                    <div class="power-options">
                        <div class="power-button" onclick="lockScreen()">
                            <span>${createIcon('lock', '16px')}</span>
                            <span>Verrouiller</span>
                        </div>
                        <div class="power-button restart" onclick="restartWindows()">
                            <span>${createIcon('restart', '16px')}</span>
                            <span>Redémarrer</span>
                        </div>
                        <div class="power-button shutdown" onclick="closeWindowsOS()">
                            <span>${createIcon('power', '16px')}</span>
                            <span>Arrêter</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initializeWindowsEvents() {
    let openWindows = [];
    let windowZIndex = 1000;

    // Variables globales pour Windows OS
    window.closeWindowsOS = function() {
        const container = document.getElementById('windows-os-container');
        if (container) {
            container.remove();
        }
    };

    // Gestion du hover du conteneur de fermeture
    window.handleCloseContainerHover = function(isEntering) {
        const container = document.querySelector('.close-windows-container');
        if (container) {
            if (isEntering) {
                container.classList.add('active');
            } else {
                // Ne retirer la classe active que si on n'est pas en train de glisser
                if (!container.classList.contains('dragging')) {
                    setTimeout(() => {
                        if (!container.matches(':hover')) {
                            container.classList.remove('active');
                        }
                    }, 100);
                }
            }
        }
    };

    window.toggleStartMenu = function() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.toggle('open');
    };

    window.openApp = function(appType) {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('open');

        const windowId = 'window-' + Date.now();
        const window = createWindow(windowId, appType);
        document.querySelector('.windows-desktop').appendChild(window);
        openWindows.push(windowId);
        focusWindow(windowId);
    };

    window.closeWindow = function(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.remove();
            openWindows = openWindows.filter(id => id !== windowId);
        }
    };

    window.minimizeWindow = function(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'none';
        }
    };

    window.maximizeWindow = function(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            if (window.dataset.maximized === 'true') {
                window.style.left = window.dataset.originalLeft;
                window.style.top = window.dataset.originalTop;
                window.style.width = window.dataset.originalWidth;
                window.style.height = window.dataset.originalHeight;
                window.dataset.maximized = 'false';
            } else {
                window.dataset.originalLeft = window.style.left;
                window.dataset.originalTop = window.style.top;
                window.dataset.originalWidth = window.style.width;
                window.dataset.originalHeight = window.style.height;
                window.style.left = '0px';
                window.style.top = '0px';
                window.style.width = '100vw';
                window.style.height = 'calc(100vh - 48px)';
                window.dataset.maximized = 'true';
            }
        }
    };

    function focusWindow(windowId) {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowZIndex++;
            windowElement.style.zIndex = windowZIndex;
            
            // Effet visuel de focus
            windowElement.classList.add('focused');
            // Enlever la classe focused des autres fenêtres
            document.querySelectorAll('.window').forEach(w => {
                if (w.id !== windowId) {
                    w.classList.remove('focused');
                }
            });
        }
    }

    function createWindow(windowId, appType) {
        const window = document.createElement('div');
        window.className = 'window';
        window.id = windowId;
        window.style.left = (100 + openWindows.length * 30) + 'px';
        window.style.top = (100 + openWindows.length * 30) + 'px';
    window.style.width = '800px';
    window.style.height = '600px';
        window.style.zIndex = ++windowZIndex;

        let title, content;
        
        switch (appType) {
            case 'explorer':
                title = 'Explorateur de fichiers';
                content = createFileExplorerContent();
                break;
            case 'notepad':
                title = 'Bloc-notes';
                content = `
                    <div style="height: 100%; display: flex; flex-direction: column; background: #ffffff; color: #333;">
                        <div style="padding: 8px 16px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; gap: 8px; align-items: center;">
                            <button style="padding: 6px 12px; border: 1px solid #0078d4; background: white; border-radius: 4px; color: #0078d4; cursor: pointer; font-size: 12px;">Nouveau</button>
                            <button style="padding: 6px 12px; border: 1px solid #0078d4; background: white; border-radius: 4px; color: #0078d4; cursor: pointer; font-size: 12px;">Ouvrir</button>
                            <button style="padding: 6px 12px; border: 1px solid #0078d4; background: white; border-radius: 4px; color: #0078d4; cursor: pointer; font-size: 12px;">Enregistrer</button>
                        </div>
                        <textarea style="flex: 1; border: none; outline: none; resize: none; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; padding: 16px; background: #ffffff; color: #333;" placeholder="Commencez à taper votre texte ici..."></textarea>
                    </div>
                `;
                break;
            case 'calculator':
                title = 'Calculatrice';
                content = createCalculatorContent();
                break;
            case 'terminal':
                title = 'Console CLK';
                content = `
                    <div style="height: 100%; background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%); color: #00ff00; padding: 20px; font-family: 'Consolas', 'Monaco', monospace; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #00ff00, #00cc00, #00ff00); opacity: 0.8;"></div>
                        <div style="margin-bottom: 16px; font-size: 14px; color: #00cc00;">
                            <div>╔══════════════════════════════════════════════════════════════╗</div>
                            <div>║                     CONSOLE CLK INTÉGRÉE                    ║</div>
                            <div>╚══════════════════════════════════════════════════════════════╝</div>
                        </div>
                        <div style="color: #00ff00; font-size: 13px; line-height: 1.6;">
                            <div style="margin-bottom: 8px;">CLK@Windows:~$ <span style="color: #ffff00;">system info</span></div>
                            <div style="color: #00cc00; margin-left: 20px;">● Version: CLK Console v2.0</div>
                            <div style="color: #00cc00; margin-left: 20px;">● Statut: Interface Windows active</div>
                            <div style="color: #00cc00; margin-left: 20px;">● Mémoire: 256MB disponible</div>
                            <div style="margin: 16px 0 8px 0;">CLK@Windows:~$ <span style="color: #ffff00;">help</span></div>
                            <div style="color: #00cc00; margin-left: 20px;">● Fermez cette fenêtre pour retourner à la console principale</div>
                            <div style="color: #00cc00; margin-left: 20px;">● Utilisez 'exit' pour fermer l'interface Windows</div>
                            <div style="margin: 16px 0 8px 0;">CLK@Windows:~$ <span style="animation: blink 1s infinite;">_</span></div>
                        </div>
                        <style>
                            @keyframes blink {
                                0%, 50% { opacity: 1; }
                                51%, 100% { opacity: 0; }
                            }
                        </style>
                    </div>
                `;
                break;
            case 'settings':
                title = 'Paramètres';
                content = createSettingsContent();
                break;
            case 'browser':
                title = 'Navigateur Web';
                content = createBrowserContent();
                break;
            case 'about':
                title = 'À propos de Windows OS';
                content = createAboutContent();
                window.style.width = '800px';
                window.style.height = '600px';
                break;
            default:
                title = 'Application';
                content = '<div>Application inconnue</div>';
        }

        window.innerHTML = `
            <div class="window-titlebar" onmousedown="startDrag(event, '${windowId}')">
                <div class="window-title">
                    <div class="window-icon">${getAppIcon(appType)}</div>
                    ${title}
                </div>
                <div class="window-controls">
                    <button class="window-control minimize" onclick="minimizeWindow('${windowId}')">${createIcon('minimize', '14px')}</button>
                    <button class="window-control maximize" onclick="maximizeWindow('${windowId}')">${createIcon('maximize', '14px')}</button>
                    <button class="window-control close" onclick="closeWindow('${windowId}')">${createIcon('close', '14px')}</button>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        // Animation d'ouverture
        window.style.opacity = '0';
        window.style.transform = 'scale(0.9) translateY(20px)';
        
        setTimeout(() => {
            window.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            window.style.opacity = '1';
            window.style.transform = 'scale(1) translateY(0)';
        }, 10);

        // Rendre la fenêtre cliquable pour focus
        window.addEventListener('mousedown', () => focusWindow(windowId));

        return window;
    }

    // Fonction pour obtenir l'icône d'une application
    function getAppIcon(appType) {
        const iconMap = {
            'explorer': 'folder',
            'notepad': 'notepad',
            'calculator': 'calculator',
            'terminal': 'terminal',
            'settings': 'settings',
            'browser': 'browser',
            'about': 'info'
        };
        return createIcon(iconMap[appType] || 'files', '16px', 'white');
    }

    function createSettingsContent() {
        return `
            <div style="padding: 20px; font-family: 'Segoe UI', sans-serif; background: #ffffff; color: #333; height: 100%; overflow-y: auto;">
                <h2 style="margin: 0 0 20px 0; color: #333; border-bottom: 2px solid #0078d4; padding-bottom: 10px;">⚙️ Paramètres Windows</h2>
                
                <div style="display: grid; gap: 16px;">
                    <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #0078d4;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">🎨 Personnalisation</h3>
                        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Modifiez l'apparence du bureau et des fenêtres</p>
                        <button style="padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Personnaliser</button>
                    </div>
                    
                    <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">🔐 Système et sécurité</h3>
                        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Gérez la sécurité et les mises à jour</p>
                        <button style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Configurer</button>
                    </div>
                    
                    <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">🌐 Réseau et Internet</h3>
                        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Paramètres de connexion réseau</p>
                        <button style="padding: 8px 16px; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer;">Paramètres réseau</button>
                    </div>
                    
                    <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6f42c1;">
                        <h3 style="margin: 0 0 8px 0; color: #333;">👤 Comptes</h3>
                        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Gérez les comptes utilisateurs</p>
                        <button style="padding: 8px 16px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer;">Gérer les comptes</button>
                    </div>
                </div>
            </div>
        `;
    }

    function createBrowserContent() {
        return `
            <div style="height: 100%; display: flex; flex-direction: column; background: #ffffff; color: #333;">
                <div style="padding: 8px; background: #f0f0f0; border-bottom: 1px solid #ccc; display: flex; gap: 8px; align-items: center;">
                    <button style="padding: 4px 8px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; color: #333;">← Retour</button>
                    <button style="padding: 4px 8px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; color: #333;">→ Suivant</button>
                    <button style="padding: 4px 8px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; color: #333;">🔄</button>
                    <input type="text" value="https://www.example.com" style="flex: 1; padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; color: #333;" readonly>
                    <button style="padding: 4px 8px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; color: #333;">⭐</button>
                </div>
                <div style="flex: 1; background: white; display: flex; align-items: center; justify-content: center; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🌐</div>
                        <h3 style="color: #333;">Navigateur Web simulé</h3>
                        <p style="color: #666;">Cette version démontre l'interface d'un navigateur</p>
                        <button style="padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 16px;">Page d'accueil</button>
                    </div>
                </div>
            </div>
        `;
    }

    function createAboutContent() {
        return `
            <div style="padding: 24px; text-align: center; font-family: 'Segoe UI', sans-serif;">
                <div style="font-size: 64px; margin-bottom: 16px;">${createIcon('computer', '64px', '#0078d4')}</div>
                <h2 style="margin: 0 0 8px 0; color: #0078d4;">Windows OS Simulator</h2>
                <p style="margin: 0 0 16px 0; color: #666;">Version 1.0.0</p>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: left;">
                    <h3 style="margin: 0 0 8px 0; color: #333;">Informations système</h3>
                    <div style="font-size: 13px; color: #666; line-height: 1.6;">
                        <div><strong>Système :</strong> Windows OS Simulator</div>
                        <div><strong>Plateforme :</strong> Console CLK</div>
                        <div><strong>Développeur :</strong> Klaynight-dev</div>
                        <div><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
                
                <p style="font-size: 12px; color: #999; margin: 0;">
                    Interface Windows complète intégrée à la console CLK.<br>
                    Toutes les fonctionnalités sont simulées à des fins éducatives.
                </p>
            </div>
        `;
    }

    function createFileExplorerContent() {
        // Ajout des animations CSS si pas déjà présent
        if (!document.getElementById('explorer-animations-style')) {
            const style = document.createElement('style');
            style.id = 'explorer-animations-style';
            style.innerHTML = `
                /* Animation galerie : fade + scale */
                .file-item.gallery-anim {
                    opacity: 0;
                    transform: scale(0.85);
                    animation: galleryFadeIn 0.35s cubic-bezier(.4,1.3,.5,1) forwards;
                }
                @keyframes galleryFadeIn {
                    to { opacity: 1; transform: scale(1); }
                }
                /* Animation détails : fade + slide */
                tr.file-item.details-anim {
                    opacity: 0;
                    transform: translateY(16px);
                    animation: detailsFadeIn 0.35s cubic-bezier(.4,1.3,.5,1) forwards;
                }
                @keyframes detailsFadeIn {
                    to { opacity: 1; transform: none; }
                }
            `;
            document.head.appendChild(style);
        }
        // Intégration avec le système de fichiers CLK (I-Node)
        let currentDir = '/';
        let fileSystemData = null;
        
        // Récupérer le système de fichiers depuis l'application CLK
        try {
            if (window.app && window.app.currentDir) {
                currentDir = window.app.currentDir;
            }
            if (window.app && window.app.inodeAdapter) {
                // Utiliser le nouveau système I-Node
                fileSystemData = 'inode';
            } else if (window.app && window.app.fileSystem) {
                // Fallback vers l'ancien système
                fileSystemData = window.app.fileSystem;
            }
        } catch (error) {
            console.warn('Impossible d\'accéder au système de fichiers CLK:', error);
        }
        
        // Initialiser le mode d'affichage si absent
        if (!window.explorerViewMode) window.explorerViewMode = 'list';
        return `
            <div class="file-explorer">
                <div class="explorer-toolbar">
                    <button class="explorer-button" onclick="navigateBack()">
                        ${createIcon('refresh', '14px')} Retour
                    </button>
                    <button class="explorer-button" onclick="navigateUp()">
                        ↑ Parent
                    </button>
                    <input type="text" class="explorer-path" id="current-path" value="${currentDir}" readonly>
                    <button class="explorer-button" onclick="refreshExplorer()">
                        ${createIcon('refresh', '14px')} Actualiser
                    </button>
                    <button class="explorer-button" onclick="createNewFolder()">
                        ${createIcon('folder', '14px')} Nouveau dossier
                    </button>
                    <select class="explorer-button" id="explorer-view-mode" onchange="changeExplorerViewMode(this.value)" style="margin-left:8px;">
                        <option value="list" ${window.explorerViewMode==='list'?'selected':''}>Liste</option>
                        <option value="gallery" ${window.explorerViewMode==='gallery'?'selected':''}>Galerie</option>
                        <option value="details" ${window.explorerViewMode==='details'?'selected':''}>Détails</option>
                    </select>
                </div>
                <div class="explorer-content" id="explorer-files">
                    ${getFileListHTML(currentDir, fileSystemData)}
                </div>
                <div id="explorer-context-menu" style="display:none; position:absolute; z-index:99999; background:#fff; border:1px solid #ccc; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15); min-width:180px; font-size:14px;">
                    <div class="context-menu-item" onclick="openContextMenuAction('open')">${createIcon('files', '16px')} Ouvrir</div>
                    <div class="context-menu-item" onclick="openContextMenuAction('rename')">${createIcon('notepad', '16px')} Renommer</div>
                    <div class="context-menu-item" onclick="openContextMenuAction('delete')">${createIcon('close', '16px')} Supprimer</div>
                    <div class="context-menu-item" onclick="openContextMenuAction('properties')">${createIcon('info', '16px')} Propriétés</div>
                    <div class="context-menu-item context-menu-new" onmouseenter="showNewMenu(event)" onmouseleave="hideNewMenu()">
                        ${createIcon('folder', '16px')} Nouveau ▶
                        <div id="explorer-context-newmenu" style="display:none; position:absolute; top:0; left:100%; background:#fff; border:1px solid #ccc; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15); min-width:180px; font-size:14px;">
                            <div class="context-menu-item" onclick="createNewFileType('folder')">${createIcon('folder', '16px')} Dossier</div>
                            <div class="context-menu-item" onclick="createNewFileType('txt')">${createIcon('notepad', '16px')} Fichier texte (.txt)</div>
                            <div class="context-menu-item" onclick="createNewFileType('md')">${createIcon('notepad', '16px')} Fichier Markdown (.md)</div>
                            <div class="context-menu-item" onclick="createNewFileType('js')">${createIcon('terminal', '16px')} Fichier JavaScript (.js)</div>
                            <div class="context-menu-item" onclick="createNewFileType('json')">${createIcon('settings', '16px')} Fichier JSON (.json)</div>
                            <div class="context-menu-item" onclick="createNewFileType('html')">${createIcon('browser', '16px')} Fichier HTML (.html)</div>
                        </div>
                    </div>
                </div>
            <script>
            // Gestion du sous-menu "Nouveau" du menu contextuel
            window.showNewMenu = function(event) {
                const newMenu = document.getElementById('explorer-context-newmenu');
                const parent = event.currentTarget;
                if (newMenu && parent) {
                    // Calculer la place à droite/gauche
                    const rect = parent.getBoundingClientRect();
                    const menuWidth = 200;
                    const spaceRight = window.innerWidth - rect.right;
                    const spaceLeft = rect.left;
                    newMenu.style.display = 'block';
                    newMenu.style.top = '0px';
                    if (spaceRight < menuWidth && spaceLeft > menuWidth) {
                        newMenu.style.left = '-' + menuWidth + 'px';
                    } else {
                        newMenu.style.left = '100%';
                    }
                }
            };
            window.hideNewMenu = function() {
                const newMenu = document.getElementById('explorer-context-newmenu');
                if (newMenu) newMenu.style.display = 'none';
            };

            // Création de fichiers/dossiers depuis le menu contextuel
            window.createNewFileType = function(type) {
                const menu = document.getElementById('explorer-context-menu');
                if (menu) menu.style.display = 'none';
                
                const pathInput = document.getElementById('current-path');
                const currentPath = pathInput ? pathInput.value : '/';
                
                let name = '';
                if (type === 'folder') {
                    name = prompt('Nom du nouveau dossier :', 'Nouveau dossier');
                    if (name && name.trim()) {
                        const newFolderPath = currentPath === '/' ? '/' + name.trim() : currentPath + '/' + name.trim();
                        
                        try {
                            let created = false;
                            
                            // Utiliser le système I-Node si disponible
                            if (window.app && window.app.inodeAdapter) {
                                created = window.app.inodeAdapter.createDirectory(currentPath, name.trim());
                                if (created) {
                                    console.log('Dossier créé avec succès via I-Node: ' + newFolderPath);
                                }
                            }
                            
                            // Fallback vers l'ancien système
                            if (!created && window.app && window.app.fileSystem) {
                                const parentDir = getFileFromPath(currentPath, window.app.fileSystem);
                                if (parentDir && parentDir.type === 'directory' && parentDir.children) {
                                    parentDir.children[name.trim()] = {
                                        type: 'directory',
                                        children: {}
                                    };
                                    created = true;
                                    console.log('Dossier créé via ancien système: ' + newFolderPath);
                                }
                            }
                            
                            if (created) {
                                showNotification('✓ Dossier "' + name.trim() + '" créé', '#28a745');
                                setTimeout(() => refreshExplorer(), 300);
                            } else {
                                showNotification('✗ Impossible de créer le dossier "' + name.trim() + '"', '#dc3545');
                            }
                            
                        } catch (error) {
                            console.error('Erreur lors de la création du dossier:', error);
                            showNotification('✗ Erreur lors de la création du dossier', '#dc3545');
                        }
                    }
                } else {
                    name = prompt('Nom du nouveau fichier :', 'nouveau-fichier.' + type);
                    if (name && name.trim()) {
                        const newFilePath = currentPath === '/' ? '/' + name.trim() : currentPath + '/' + name.trim();
                        
                        // Contenu par défaut selon le type de fichier
                        let defaultContent = '';
                        switch (type) {
                            case 'txt':
                                defaultContent = 'Nouveau fichier texte';
                                break;
                            case 'md':
                                defaultContent = '# Nouveau document Markdown\\n\\nVotre contenu ici...';
                                break;
                            case 'js':
                                defaultContent = '// Nouveau fichier JavaScript\\nconsole.log("Hello, World!");';
                                break;
                            case 'json':
                                defaultContent = '{\\n  "name": "nouveau-fichier",\\n  "version": "1.0.0"\\n}';
                                break;
                            case 'html':
                                defaultContent = '<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Nouveau document</title>\\n</head>\\n<body>\\n    <h1>Hello, World!</h1>\\n</body>\\n</html>';
                                break;
                            default:
                                defaultContent = '';
                        }
                        
                        try {
                            let created = false;
                            
                            // Utiliser le système I-Node si disponible
                            if (window.app && window.app.inodeAdapter) {
                                created = window.app.inodeAdapter.createFile(currentPath, name.trim(), defaultContent);
                                if (created) {
                                    console.log('Fichier créé avec succès via I-Node: ' + newFilePath);
                                }
                            }
                            
                            // Fallback vers l'ancien système
                            if (!created && window.app && window.app.fileSystem) {
                                const parentDir = getFileFromPath(currentPath, window.app.fileSystem);
                                if (parentDir && parentDir.type === 'directory' && parentDir.children) {
                                    parentDir.children[name.trim()] = {
                                        type: 'file',
                                        content: defaultContent
                                    };
                                    created = true;
                                    console.log('Fichier créé via ancien système: ' + newFilePath);
                                }
                            }
                            
                            if (created) {
                                showNotification('✓ Fichier "' + name.trim() + '" créé', '#28a745');
                                setTimeout(() => {
                                    refreshExplorer();
                                    // Ouvrir automatiquement le fichier créé
                                    setTimeout(() => {
                                        openFileInNotepad(name.trim(), currentPath);
                                    }, 500);
                                }, 300);
                            } else {
                                showNotification('✗ Impossible de créer le fichier "' + name.trim() + '"', '#dc3545');
                            }
                            
                        } catch (error) {
                            console.error('Erreur lors de la création du fichier:', error);
                            showNotification('✗ Erreur lors de la création du fichier', '#dc3545');
                        }
                    }
                }
                window.hideNewMenu();
            };
            </script>
            <style>
            /* Correction de l'alignement des colonnes en mode détails */
            .explorer-details-table {
                width: 100%;
                border-collapse: collapse;
                    table-layout: fixed;
                }
                .explorer-details-table th, .explorer-details-table td {
                    padding: 6px 10px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .explorer-details-table th {
                    background: #f5f5f5;
                    font-weight: 600;
                }
                .explorer-details-table th.name, .explorer-details-table td.name {
                    width: 45%;
                }
                .explorer-details-table th.type, .explorer-details-table td.type {
                    width: 20%;
                }
                .explorer-details-table th.size, .explorer-details-table td.size {
                    width: 15%;
                    text-align: right;
                }
                .explorer-details-table th.date, .explorer-details-table td.date {
                    width: 20%;
                }
                .context-menu-item {
                    padding: 10px 18px;
                    cursor: pointer;
                    transition: background 0.15s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .context-menu-item:hover {
                    background: #f0f0f0;
                }
                </style>
            </div>
        `;
    }
    // Gestion du menu contextuel clic droit dans l'explorateur de fichiers
    document.addEventListener('contextmenu', function(event) {
        const explorer = event.target.closest('.explorer-content, .explorer-details-table, .explorer-list-item, .explorer-gallery-item, .explorer-details-row');
        if (explorer) {
            event.preventDefault();
            let fileElem = event.target.closest('[data-filename]');
            if (fileElem) {
                window._contextMenuFile = {
                    name: fileElem.getAttribute('data-filename'),
                    type: fileElem.getAttribute('data-filetype'),
                    path: document.getElementById('current-path')?.value || '/'
                };
            } else {
                window._contextMenuFile = null;
            }
            const menu = document.getElementById('explorer-context-menu');
            if (menu) {
                menu.style.display = 'block';
                // Calculer la position du menu contextuel pour qu'il reste visible dans la fenêtre
                const menuWidth = menu.offsetWidth || 200;
                const menuHeight = menu.offsetHeight || 250;
                let x = event.pageX;
                let y = event.pageY;
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 8;
                }
                if (y + menuHeight > window.innerHeight) {
                    y = window.innerHeight - menuHeight - 8;
                }
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';
                menu.style.position = 'absolute';
            }
        } else {
            const menu = document.getElementById('explorer-context-menu');
            if (menu) menu.style.display = 'none';
        }
    });
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('explorer-context-menu');
        if (menu && menu.style.display === 'block') {
            if (!event.target.closest('#explorer-context-menu')) {
                menu.style.display = 'none';
            }
        }
    });

    // Action du menu contextuel
    window.openContextMenuAction = function(action) {
        const file = window._contextMenuFile;
        const menu = document.getElementById('explorer-context-menu');
        if (menu) menu.style.display = 'none';
        if (!file) return;
        if (action === 'open') {
            window.openFile(file.name, file.type, file.path);
        } else if (action === 'rename') {
            // Simple prompt pour renommer
            const newName = prompt('Nouveau nom pour ' + file.name, file.name);
            if (newName && newName !== file.name) {
                // À adapter selon l'API réelle de gestion de fichiers
                alert('Renommage de ' + file.name + ' en ' + newName + ' (fonction à implémenter)');
            }
        } else if (action === 'delete') {
            if (confirm('Supprimer ' + file.name + ' ?')) {
                // À adapter selon l'API réelle de gestion de fichiers
                alert('Suppression de ' + file.name + ' (fonction à implémenter)');
            }
        } else if (action === 'properties') {
            showFilePropertiesWindow(file.name, file.type, file.path);
        }
    };

    // Fenêtre propriétés façon Windows
    window.showFilePropertiesWindow = function(fileName, fileType, filePath) {
        // Récupérer les infos du fichier/dossier (à adapter selon l'API réelle)
        let fileInfo = {
            name: fileName,
            type: fileType || 'Fichier',
            path: filePath,
            size: 'Taille inconnue',
            modified: '-',
            created: '-',
            icon: getFileIcon(fileName),
            isDir: fileType === 'folder' || fileType === 'dossier' || fileType === 'directory',
            nbFiles: 0,
            nbFolders: 0,
            totalSize: 0
        };
        // Si possible, récupérer les vraies infos depuis le système de fichiers CLK
        try {
            let fsData = window.fileSystemData || null;
            if (!fsData && typeof getFileSystemData === 'function') fsData = getFileSystemData();
            if (fsData) {
                let node = getFileFromPath((filePath.endsWith('/') ? filePath : filePath + '/') + fileName, fsData);
                if (!node && filePath === '/' && fsData[fileName]) node = fsData[fileName];
                if (node) {
                    if (node.type === 'folder' || node.type === 'directory' || node.children) {
                        fileInfo.isDir = true;
                        const style = document.createElement('style');
                        style.id = 'explorer-animations-style';
                        style.innerHTML = `
                            /* Animation galerie : fade + scale */
                            .file-item.gallery-anim {
                                opacity: 0;
                                transform: scale(0.85);
                                animation: galleryFadeIn 0.35s cubic-bezier(.4,1.3,.5,1) forwards;
                            }
                            @keyframes galleryFadeIn {
                                to { opacity: 1; transform: scale(1); }
                            }
                            /* Animation détails : fade + slide */
                            tr.file-item.details-anim {
                                opacity: 0;
                                transform: translateY(16px);
                                animation: detailsFadeIn 0.35s cubic-bezier(.4,1.3,.5,1) forwards;
                            }
                            @keyframes detailsFadeIn {
                                to { opacity: 1; transform: none; }
                            }
                        `;
                        document.head.appendChild(style);
                    } else {
                        fileInfo.size = typeof node.size === 'number' ? formatFileSize(node.size) : 'Taille inconnue';
                        fileInfo.modified = node.modified || '-';
                        fileInfo.created = node.created || '-';
                    }
                }
            }
        } catch(e) {}
        // Créer la fenêtre
        const propWinId = 'window-properties-' + Date.now();
        const win = document.createElement('div');
        win.className = 'window';
        win.id = propWinId;
        win.style.left = '180px';
        win.style.top = '180px';
        win.style.width = '420px';
        win.style.height = 'auto';
        win.style.zIndex = 99999;
        win.innerHTML = `
            <div class="window-titlebar" onmousedown="startDrag(event, '${propWinId}')">
                <div class="window-title">
                    <div class="window-icon">${fileInfo.icon}</div>
                    Propriétés de : ${fileInfo.name}
                </div>
                <div class="window-controls">
                    <button class="window-control close" onclick="closeWindow('${propWinId}')">${createIcon('close', '14px')}</button>
                </div>
            </div>
            <div class="window-content" style="padding:18px 24px; background:#f8f9fa; color:#222; font-family:'Segoe UI',sans-serif;">
                <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
                    <div style="font-size:38px;">${fileInfo.icon}</div>
                    <div>
                        <div style="font-size:18px;font-weight:600;">${fileInfo.name}</div>
                        <div style="font-size:13px;color:#666;">${fileInfo.isDir ? 'Dossier' : 'Fichier'}</div>
                    </div>
                </div>
                <div style="margin-bottom:10px;"><b>Emplacement :</b> <span style="color:#555;">${fileInfo.path}</span></div>
                <div style="margin-bottom:10px;"><b>Taille :</b> <span style="color:#555;">${fileInfo.size}</span></div>
                ${fileInfo.isDir ? `<div style=\"margin-bottom:10px;\"><b>Contenu :</b> <span style=\"color:#555;\">${fileInfo.nbFolders} dossier(s), ${fileInfo.nbFiles} fichier(s)</span></div>` : ''}
                ${fileInfo.isDir ? `<div style=\"margin-bottom:10px;\"><b>Poids total :</b> <span style=\"color:#555;\">${formatFileSize(fileInfo.totalSize)}</span></div>` : ''}
                <div style="margin-bottom:10px;"><b>Modifié le :</b> <span style="color:#555;">${fileInfo.modified}</span></div>
                <div style="margin-bottom:10px;"><b>Créé le :</b> <span style="color:#555;">${fileInfo.created}</span></div>
                <div style="margin-top:18px;text-align:right;">
                    <button onclick="closeWindow('${propWinId}')" style="padding:7px 18px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;">Fermer</button>
                </div>
            </div>
        `;
        document.querySelector('.windows-desktop').appendChild(win);
        setTimeout(()=>{win.style.opacity='1';win.style.transform='none';},10);
        win.addEventListener('mousedown',()=>{
            if (typeof focusWindow === 'function') focusWindow(propWinId);
        });
    };
    
    

    function createCalculatorContent() {
        return `
            <div style="padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height: 100%;">
                <div style="display: flex; gap: 12px; align-items: flex-start; height: 100%;">
                    <div style="flex: 1;">
                        <input type="text" id="calc-display" style="width: 100%; height: 60px; font-size: 28px; text-align: right; margin-bottom: 20px; border: 2px solid #e0e0e0; padding: 12px; border-radius: 8px; background: white; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);" readonly>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                            <button onclick="clearCalc()" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3); transition: all 0.2s ease;">C</button>
                            <button onclick="backspaceCalc()" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #90caf9 0%, #1976d2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">⌫</button>
                            <button onclick="calcInput('(')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #b2dfdb 0%, #009688 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">(</button>
                            <button onclick="calcInput(')')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #b2dfdb 0%, #009688 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">)</button>
                            <button onclick="calcInput('/')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3); transition: all 0.2s ease;">÷</button>
                            <button onclick="calcInput('7')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">7</button>
                            <button onclick="calcInput('8')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">8</button>
                            <button onclick="calcInput('9')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">9</button>
                            <button onclick="calcInput('*')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3); transition: all 0.2s ease;">×</button>
                            <button onclick="calcInput('4')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">4</button>
                            <button onclick="calcInput('5')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">5</button>
                            <button onclick="calcInput('6')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">6</button>
                            <button onclick="calcInput('-')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3); transition: all 0.2s ease;">−</button>
                            <button onclick="calcInput('1')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">1</button>
                            <button onclick="calcInput('2')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">2</button>
                            <button onclick="calcInput('3')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">3</button>
                            <button onclick="calcInput('+')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3); transition: all 0.2s ease;">+</button>
                            <button onclick="calcInput('0')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333; grid-column: span 2;">0</button>
                            <button onclick="calcInput('.')" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%); border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; color: #333;">.</button>
                            <button onclick="calculateResult()" style="padding: 18px; font-size: 18px; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); transition: all 0.2s ease;">=</button>
                        </div>
                    </div>
                    <div style="width: 220px;">
                        <div style="margin-bottom: 10px; text-align: center; font-weight: bold; color: #0078d4;">Mode scientifique</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            <button onclick="calcFunc('sin')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">sin</button>
                            <button onclick="calcFunc('cos')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">cos</button>
                            <button onclick="calcFunc('tan')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">tan</button>
                            <button onclick="calcFunc('log')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">log</button>
                            <button onclick="calcFunc('sqrt')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">√</button>
                            <button onclick="calcFunc('pow')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">x²</button>
                            <button onclick="calcFunc('exp')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">exp</button>
                            <button onclick="calcFunc('pi')" style="padding: 10px; font-size: 15px; background: #e3f2fd; border: none; border-radius: 6px; cursor: pointer;">π</button>
                        </div>
                    </div>
                </div>
                <script>
                // Support du pavé numérique et raccourcis clavier pour la calculatrice
                (function() {
                    const calcDisplay = document.getElementById('calc-display');
                    if (!window._calcKeyListenerAdded) {
                        window._calcKeyListenerAdded = true;
                        document.addEventListener('keydown', function(e) {
                            if (!calcDisplay || !calcDisplay.closest('.window-content')) return;
                            // Vérifie si la calculatrice est visible
                            if (!calcDisplay.offsetParent) return;
                            // Numpad et touches classiques
                            const key = e.key;
                            if ((key >= '0' && key <= '9') || key === '.' || key === ',') {
                                window.calcInput(key === ',' ? '.' : key);
                                e.preventDefault();
                            } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%') {
                                window.calcInput(key);
                                e.preventDefault();
                            } else if (key === 'Enter' || key === '=') {
                                window.calculateResult();
                                e.preventDefault();
                            } else if (key === 'Backspace') {
                                const display = document.getElementById('calc-display');
                                if (display) display.value = display.value.slice(0, -1);
                                e.preventDefault();
                            } else if (key === 'c' || key === 'C') {
                                window.clearCalc();
                                e.preventDefault();
                            }
                        });
                    }
                })();
                </script>
            </div>
        `;
    }

    function getFileListHTML(directory, fileSystemData = null) {
        try {
            // Utiliser le système I-Node si disponible
            if (window.app && window.app.inodeAdapter) {
                const files = getDirectoryContents(directory, 'inode');
                if (files.length === 0) {
                    return '<div style="padding: 16px; color: #666; text-align: center;">Répertoire vide</div>';
                }
                if (mode === 'gallery') {
                    return `<div style="display: flex; flex-wrap: wrap; gap: 18px; padding: 12px;">` +
                        files.map((file, i) => {
                            const isDirectory = file.type === 'directory';
                            const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                            const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                            return `
                                <div class="file-item gallery-anim" style="animation-delay:${i*40}ms;flex-direction:column;align-items:center;justify-content:center;width:110px;height:110px;display:flex;cursor:pointer;border-radius:12px;padding:10px;transition:background 0.2s;" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                    <div class="file-icon" style="font-size:38px;width:48px;height:48px;">${createIcon(iconName, '38px', iconColor)}</div>
                                    <div class="file-name" style="font-size:13px;text-align:center;margin-top:8px;word-break:break-all;">${file.name}</div>
                                </div>
                            `;
                        }).join('') + '</div>';
                } else if (mode === 'details') {
                    return `<table class="explorer-details-table">
                        <thead><tr>
                            <th class="name">Nom</th>
                            <th class="type">Type</th>
                            <th class="size">Taille</th>
                            <th class="date">Modifié</th>
                        </tr></thead>
                        <tbody>` +
                        files.map((file, i) => {
                            const isDirectory = file.type === 'directory';
                            const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                            const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                            return `<tr class="file-item details-anim explorer-details-row" style="animation-delay:${i*40}ms;cursor:pointer;" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                <td class="name">
                                    ${createIcon(iconName, '16px', iconColor)} <span>${file.name}</span>
                                </td>
                                <td class="type">${isDirectory ? 'Dossier' : 'Fichier'}</td>
                                <td class="size">${isDirectory ? '' : formatFileSize(file.content ? file.content.length : 0)}</td>
                                <td class="date">-</td>
                            </tr>`;
                        }).join('') + '</tbody></table>';
                } else { // mode list
                    return files.map(file => {
                        const isDirectory = file.type === 'directory';
                        const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                        const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                        return `
                            <div class="file-item explorer-list-item" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                <div class="file-icon">${createIcon(iconName, '16px', iconColor)}</div>
                                <div class="file-name">${file.name}</div>
                                <div class="file-details" style="margin-left: auto; font-size: 11px; color: #999;">
                                    ${isDirectory ? 'Dossier' : formatFileSize(file.content ? file.content.length : 0)}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
            // Utiliser l'ancien système de fichiers CLK si I-Node n'est pas disponible
            else if (fileSystemData && fileSystemData !== 'inode') {
                const files = getDirectoryContents(directory, fileSystemData);
                if (files.length === 0) {
                    return '<div style="padding: 16px; color: #666; text-align: center;">Répertoire vide</div>';
                }
                if (mode === 'gallery') {
                    return `<div style="display: flex; flex-wrap: wrap; gap: 18px; padding: 12px;">` +
                        files.map((file, i) => {
                            const isDirectory = file.type === 'directory';
                            const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                            const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                            return `
                                <div class="file-item gallery-anim" style="animation-delay:${i*40}ms;flex-direction:column;align-items:center;justify-content:center;width:110px;height:110px;display:flex;cursor:pointer;border-radius:12px;padding:10px;transition:background 0.2s;" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                    <div class="file-icon" style="font-size:38px;width:48px;height:48px;">${createIcon(iconName, '38px', iconColor)}</div>
                                    <div class="file-name" style="font-size:13px;text-align:center;margin-top:8px;word-break:break-all;">${file.name}</div>
                                </div>
                            `;
                        }).join('') + '</div>';
                } else if (mode === 'details') {
                    return `<table class="explorer-details-table">
                        <thead><tr>
                            <th class="name">Nom</th>
                            <th class="type">Type</th>
                            <th class="size">Taille</th>
                            <th class="date">Modifié</th>
                        </tr></thead>
                        <tbody>` +
                        files.map((file, i) => {
                            const isDirectory = file.type === 'directory';
                            const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                            const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                            return `<tr class="file-item details-anim explorer-details-row" style="animation-delay:${i*40}ms;cursor:pointer;" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                <td class="name">
                                    ${createIcon(iconName, '16px', iconColor)} <span>${file.name}</span>
                                </td>
                                <td class="type">${isDirectory ? 'Dossier' : 'Fichier'}</td>
                                <td class="size">${isDirectory ? '' : formatFileSize(file.content ? file.content.length : 0)}</td>
                                <td class="date">-</td>
                            </tr>`;
                        }).join('') + '</tbody></table>';
                } else { // mode list
                    return files.map(file => {
                        const isDirectory = file.type === 'directory';
                        const iconName = isDirectory ? 'folder' : getFileIcon(file.name);
                        const iconColor = isDirectory ? '#0078d4' : getFileIconColor(file.name);
                        return `
                            <div class="file-item explorer-list-item" data-filename="${file.name}" data-filetype="${file.type}" ondblclick="openFile('${file.name}', '${file.type}', '${directory}')">
                                <div class="file-icon">${createIcon(iconName, '16px', iconColor)}</div>
                                <div class="file-name">${file.name}</div>
                                <div class="file-details" style="margin-left: auto; font-size: 11px; color: #999;">
                                    ${isDirectory ? 'Dossier' : formatFileSize(file.content ? file.content.length : 0)}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
            // Système de fichiers par défaut si CLK n'est pas disponible
            return `<div style="padding: 16px; color: #999;">Aucun fichier</div>`;
        } catch (error) {
            return '<div style="padding: 16px; color: #e74c3c;">Erreur lors de la lecture du répertoire</div>';
        }
    }
    // Changement de mode d'affichage
    window.changeExplorerViewMode = function(mode) {
        window.explorerViewMode = mode;
        refreshExplorer();
    };

    // Fonction pour parser le système de fichiers CLK (I-Node et Legacy)
    function getDirectoryContents(directory, fileSystemData) {
        try {
            // Utiliser le système I-Node si disponible
            if (fileSystemData === 'inode' && window.app && window.app.inodeAdapter) {
                const dirNode = window.app.inodeAdapter.getPath(directory);
                if (dirNode && dirNode.children) {
                    return Object.keys(dirNode.children).map(name => {
                        const item = dirNode.children[name];
                        return {
                            name: name,
                            type: item.type === 'directory' ? 'directory' : 'file',
                            content: item.content || null,
                            children: item.children || null
                        };
                    });
                }
                return [];
            }
            
            // Fallback vers l'ancien système de fichiers
            const parts = directory === '/' ? [] : directory.split('/').filter(p => p !== '');
            let current = fileSystemData['/'];
            
            // Naviguer vers le répertoire demandé
            for (const part of parts) {
                if (current && current.type === 'directory' && current.children && current.children[part]) {
                    current = current.children[part];
                } else {
                    return []; // Répertoire non trouvé
                }
            }
            
            // Extraire les fichiers et dossiers
            if (current && current.type === 'directory' && current.children) {
                return Object.keys(current.children).map(name => {
                    const item = current.children[name];
                    return {
                        name: name,
                        type: item.type,
                        content: item.content || null,
                        children: item.children || null
                    };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Erreur lors du parsing du système de fichiers:', error);
            return [];
        }
    }

    // Fonction pour obtenir l'icône d'un fichier selon son extension
    function getFileIcon(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
            case 'txt':
            case 'md':
            case 'readme':
                return 'notepad';
            case 'js':
            case 'json':
            case 'ts':
                return 'files';
            case 'html':
            case 'htm':
                return 'browser';
            case 'css':
                return 'files';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'svg':
                return 'files';
            case 'pdf':
                return 'files';
            case 'zip':
            case 'rar':
            case '7z':
                return 'files';
            default:
                return 'files';
        }
    }

    // Fonction pour obtenir la couleur d'un fichier selon son extension
    function getFileIconColor(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
            case 'txt':
            case 'md':
            case 'readme':
                return '#4CAF50';
            case 'js':
            case 'json':
            case 'ts':
                return '#FFC107';
            case 'html':
            case 'htm':
                return '#FF5722';
            case 'css':
                return '#2196F3';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'svg':
                return '#9C27B0';
            case 'pdf':
                return '#F44336';
            case 'zip':
            case 'rar':
            case '7z':
                return '#795548';
            default:
                return '#757575';
        }
    }

    // Fonction pour formater la taille d'un fichier
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Fonctions globales pour la calculatrice
    window.calcInput = function(value) {
        const display = document.getElementById('calc-display');
        if (display) {
            // Remplace la virgule par un point
            if (value === ',') value = '.';
            display.value = (display.value || '') + value;
        }
    };

    // Fonction retour arrière pour la calculatrice
    window.backspaceCalc = function() {
        const display = document.getElementById('calc-display');
        if (!display) return;
        let v = display.value;
        // Supprime les blocs scientifiques d'un coup
        const patterns = [
            { re: /pi$/, len: 2 },
            { re: /sin\($/, len: 4 },
            { re: /cos\($/, len: 4 },
            { re: /tan\($/, len: 4 },
            { re: /log\($/, len: 4 },
            { re: /sqrt\($/, len: 5 },
            { re: /exp\($/, len: 4 },
            { re: /\^2$/, len: 2 },
            { re: /Error/, len: 0 },
            { re: /Erreur/, len: 0 }
        ];
        for (const p of patterns) {
            if (p.re.test(v)) {
                display.value = v.slice(0, -p.len);
                return;
            }
        }
        // Sinon, supprime un caractère
        display.value = v.slice(0, -1);
    };

    window.calculateResult = function() {
        const display = document.getElementById('calc-display');
        if (display) {
            try {
                let expr = display.value.replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                // Remplacement des fonctions scientifiques par JS natif
                expr = expr.replace(/pi/g, '(' + Math.PI + ')');
                expr = expr.replace(/([0-9.]+)\^2/g, 'Math.pow($1,2)');
                expr = expr.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
                expr = expr.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
                expr = expr.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
                expr = expr.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
                expr = expr.replace(/log\(([^)]+)\)/g, 'Math.log10 ? Math.log10($1) : (Math.log($1)/Math.LN10)');
                expr = expr.replace(/exp\(([^)]+)\)/g, 'Math.exp($1)');
                // Sécurité : autorise chiffres, opérateurs, parenthèses, Math et point
                if (/^[0-9+\-*/%.() Mathpiqrtanlogex]+$/.test(expr)) {
                    expr = expr.replace(/%/g, '/100');
                    display.value = eval(expr);
                } else {
                    display.value = 'Erreur';
                }
            } catch (e) {
                display.value = 'Erreur';
            }
        }
    };

    // Fonctions scientifiques : insèrent le nom dans l'affichage, le calcul se fait lors de =
    window.calcFunc = function(func) {
        const display = document.getElementById('calc-display');
        if (!display) return;
        if (func === 'pi') {
            display.value += 'pi';
        } else if (func === 'pow') {
            display.value += '^2';
        } else if (func === 'sqrt') {
            display.value += 'sqrt(';
        } else {
            display.value += func + '(';
        }
    };

    // Fonctions pour l'explorateur de fichiers
    window.openFile = function(fileName, fileType, currentPath) {
        if (fileType === 'directory') {
            // Navigation vers un dossier
            navigateToDirectory(currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`);
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            // Ouvrir dans le bloc-notes avec le contenu du fichier
            openFileInNotepad(fileName, currentPath);
        } else if (fileName.endsWith('.js') || fileName.endsWith('.json') || fileName.endsWith('.html') || fileName.endsWith('.css')) {
            // Ouvrir dans le bloc-notes pour les fichiers de code
            openFileInNotepad(fileName, currentPath);
        } else {
            // Autres types de fichiers
            console.log('Ouverture de:', fileName, 'Type:', fileType);
            openFileInNotepad(fileName, currentPath);
        }
    };

    function openFileInNotepad(fileName, currentPath) {
        // Récupérer le contenu du fichier depuis le système de fichiers CLK
        let fileContent = '';
        let fullPath = '';
        
        try {
            // Construire le chemin complet
            fullPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
            console.log(`Tentative d'ouverture du fichier: ${fullPath}`);
            
            // Utiliser le système I-Node si disponible
            if (window.app && window.app.inodeAdapter) {
                console.log(`Lecture via I-Node: ${fullPath}`);
                const file = window.app.inodeAdapter.getPath(fullPath);
                
                if (file && file.type === 'file') {
                    fileContent = typeof file.content === 'function' ? file.content() : (file.content || '');
                    console.log(`Fichier lu avec succès via I-Node`);
                } else {
                    console.warn(`Fichier non trouvé via I-Node: ${fullPath}`);
                    fileContent = `Fichier non trouvé: ${fileName}`;
                }
            }
            // Fallback vers l'ancien système
            else if (window.app && window.app.fileSystem) {
                console.log(`Lecture via ancien système: ${fullPath}`);
                const file = getFileFromPath(fullPath, window.app.fileSystem);
                
                if (file && file.type === 'file') {
                    fileContent = typeof file.content === 'function' ? file.content() : (file.content || '');
                    console.log(`Fichier lu avec succès via ancien système`);
                } else {
                    console.warn(`Fichier non trouvé via ancien système: ${fullPath}`);
                    fileContent = `Fichier non trouvé: ${fileName}`;
                }
            }
            else {
                fileContent = `Système de fichiers non disponible`;
                console.warn('Aucun système de fichiers disponible');
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
            fileContent = `Erreur lors de la lecture du fichier: ${fileName}`;
        }

        // Créer une fenêtre Bloc-notes avec le contenu
        const notepadWindow = createCustomNotepadWindow(fileName, fileContent, fullPath);
        document.querySelector('.windows-desktop').appendChild(notepadWindow);
    }

    function getFileFromPath(filePath, fileSystemData) {
        try {
            // Utiliser le système I-Node si disponible
            if (window.app && window.app.inodeAdapter) {
                return window.app.inodeAdapter.getPath(filePath);
            }
            
            // Fallback vers l'ancien système
            const parts = filePath === '/' ? [] : filePath.split('/').filter(p => p !== '');
            let current = fileSystemData['/'];
            
            // Naviguer vers le fichier
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (current && current.type === 'directory' && current.children && current.children[part]) {
                    current = current.children[part];
                } else {
                    return null; // Fichier non trouvé
                }
            }
            
            return current;
        } catch (error) {
            console.error('Erreur lors de la recherche du fichier:', error);
            return null;
        }
    }

    function createCustomNotepadWindow(fileName, content, filePath = null) {
        const windowId = 'notepad-' + Date.now();
        const window = document.createElement('div');
        window.className = 'window';
        window.id = windowId;
        
        // Stocker le chemin du fichier dans l'élément pour la sauvegarde
        window.setAttribute('data-file-path', filePath || fileName);
        
        window.style.left = (120 + openWindows.length * 30) + 'px';
        window.style.top = (120 + openWindows.length * 30) + 'px';
        window.style.width = '700px';
        window.style.height = '500px';
        window.style.zIndex = ++windowZIndex;

        window.innerHTML = `
            <div class="window-titlebar" onmousedown="startDrag(event, '${windowId}')">
                <div class="window-title">
                    <div class="window-icon">${createIcon('notepad', '16px', 'white')}</div>
                    ${fileName} - Bloc-notes
                </div>
                <div class="window-controls">
                    <button class="window-control minimize" onclick="minimizeWindow('${windowId}')">${createIcon('minimize', '14px')}</button>
                    <button class="window-control maximize" onclick="maximizeWindow('${windowId}')">${createIcon('maximize', '14px')}</button>
                    <button class="window-control close" onclick="closeWindow('${windowId}')">${createIcon('close', '14px')}</button>
                </div>
            </div>
            <div class="window-content">
                <div style="height: 100%; display: flex; flex-direction: column; background: #ffffff; color: #333;">
                    <div style="padding: 8px 16px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; gap: 8px; align-items: center;">
                        <button onclick="saveFileContentAdvanced('${windowId}', '${fileName}')" style="padding: 6px 12px; border: 1px solid #0078d4; background: white; border-radius: 4px; color: #0078d4; cursor: pointer; font-size: 12px;">${createIcon('files', '12px')} Enregistrer</button>
                        <button onclick="refreshFileContentAdvanced('${windowId}', '${fileName}')" style="padding: 6px 12px; border: 1px solid #28a745; background: white; border-radius: 4px; color: #28a745; cursor: pointer; font-size: 12px;">${createIcon('refresh', '12px')} Actualiser</button>
                        <div style="margin-left: auto; font-size: 12px; color: #666;">
                            Fichier: ${filePath || fileName} | Taille: ${formatFileSize(content.length)}
                        </div>
                    </div>
                    <textarea id="notepad-content-${windowId}" style="flex: 1; border: none; outline: none; resize: none; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; padding: 16px; background: #ffffff; color: #333;" placeholder="Contenu du fichier...">${content}</textarea>
                </div>
            </div>
        `;

        // Ajouter la fenêtre à la liste des fenêtres ouvertes
        openWindows.push(windowId);
        
        // Animation d'ouverture
        window.style.opacity = '0';
        window.style.transform = 'scale(0.9) translateY(20px)';
        
        setTimeout(() => {
            window.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            window.style.opacity = '1';
            window.style.transform = 'scale(1) translateY(0)';
        }, 10);

        // Rendre la fenêtre cliquable pour focus
        window.addEventListener('mousedown', () => focusWindow(windowId));

        return window;
    }

    window.saveFileContent = function(windowId, fileName) {
        const textarea = document.getElementById(`notepad-content-${windowId}`);
        if (textarea) {
            const content = textarea.value;
            console.log(`Sauvegarde de ${fileName}:`, content);
            
            // Sauvegarder dans le système de fichiers CLK
            try {
                let saved = false;
                
                // Utiliser le système I-Node si disponible
                if (window.app && window.app.inodeAdapter) {
                    // Obtenir le répertoire courant de l'explorateur
                    const pathInput = document.getElementById('current-path');
                    const currentPath = pathInput ? pathInput.value : '/';
                    const fullPath = currentPath.endsWith('/') ? currentPath + fileName : currentPath + '/' + fileName;
                    
                    // Essayer d'écrire le fichier
                    saved = window.app.inodeAdapter.writeFile(fullPath, content);
                    
                    if (saved) {
                        console.log(`Fichier ${fullPath} sauvegardé avec succès via I-Node`);
                    }
                }
                
                // Fallback vers l'ancien système si I-Node échoue
                if (!saved && window.app && window.app.fileSystem) {
                    // Code de fallback pour l'ancien système
                    const file = getFileFromPath(`/${fileName}`, window.app.fileSystem);
                    if (file) {
                        file.content = content;
                        saved = true;
                        console.log(`Fichier ${fileName} sauvegardé via ancien système`);
                    }
                }
                
                // Notification de sauvegarde
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${saved ? '#28a745' : '#dc3545'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 30000;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                notification.textContent = saved ? `✓ ${fileName} sauvegardé` : `✗ Erreur lors de la sauvegarde de ${fileName}`;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
                
                // Actualiser l'explorateur si la sauvegarde a réussi
                if (saved) {
                    setTimeout(() => {
                        const refreshBtn = document.querySelector('.explorer-button[onclick="refreshExplorer()"]');
                        if (refreshBtn) {
                            refreshExplorer();
                        }
                    }, 500);
                }
                
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                
                // Notification d'erreur
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #dc3545;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 30000;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                notification.textContent = `✗ Erreur lors de la sauvegarde de ${fileName}`;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
            }
        }
    };

    // Nouvelles fonctions avancées pour le bloc-notes
    window.saveFileContentAdvanced = function(windowId, fileName) {
        const textarea = document.getElementById(`notepad-content-${windowId}`);
        const windowElement = document.getElementById(windowId);
        
        if (textarea && windowElement) {
            const content = textarea.value;
            const filePath = windowElement.getAttribute('data-file-path') || fileName;
            
            console.log(`Sauvegarde avancée de ${filePath}:`, content);
            
            try {
                let saved = false;
                
                // Utiliser le système I-Node si disponible
                if (window.app && window.app.inodeAdapter) {
                    console.log(`Tentative de sauvegarde via I-Node: ${filePath}`);
                    saved = window.app.inodeAdapter.writeFile(filePath, content);
                    
                    if (saved) {
                        console.log(`Fichier sauvegardé avec succès via I-Node: ${filePath}`);
                    } else {
                        console.warn(`Échec de la sauvegarde via I-Node: ${filePath}`);
                    }
                }
                
                // Fallback vers l'ancien système si I-Node échoue
                if (!saved && window.app && window.app.fileSystem) {
                    console.log(`Tentative de sauvegarde via ancien système: ${filePath}`);
                    const file = getFileFromPath(filePath, window.app.fileSystem);
                    if (file && file.type === 'file') {
                        file.content = content;
                        saved = true;
                        console.log(`Fichier sauvegardé via ancien système: ${filePath}`);
                    }
                }
                
                // Mettre à jour la taille affichée
                const sizeDisplay = windowElement.querySelector('.window-content [style*="margin-left: auto"]');
                if (sizeDisplay) {
                    sizeDisplay.innerHTML = `Fichier: ${filePath} | Taille: ${formatFileSize(content.length)}`;
                }
                
                // Notification de sauvegarde
                showNotification(
                    saved ? `✓ ${fileName} sauvegardé` : `✗ Erreur lors de la sauvegarde de ${fileName}`,
                    saved ? '#28a745' : '#dc3545'
                );
                
                // Actualiser l'explorateur si la sauvegarde a réussi
                if (saved) {
                    setTimeout(() => {
                        if (typeof refreshExplorer === 'function') {
                            refreshExplorer();
                        }
                    }, 500);
                }
                
            } catch (error) {
                console.error('Erreur lors de la sauvegarde avancée:', error);
                showNotification(`✗ Erreur lors de la sauvegarde de ${fileName}`, '#dc3545');
            }
        }
    };

    window.refreshFileContentAdvanced = function(windowId, fileName) {
        const textarea = document.getElementById(`notepad-content-${windowId}`);
        const windowElement = document.getElementById(windowId);
        
        if (textarea && windowElement) {
            const filePath = windowElement.getAttribute('data-file-path') || fileName;
            
            try {
                let content = '';
                let found = false;
                
                // Utiliser le système I-Node si disponible
                if (window.app && window.app.inodeAdapter) {
                    console.log(`Rafraîchissement via I-Node: ${filePath}`);
                    const file = window.app.inodeAdapter.getPath(filePath);
                    
                    if (file && file.type === 'file') {
                        content = typeof file.content === 'function' ? file.content() : (file.content || '');
                        found = true;
                        console.log(`Fichier rafraîchi avec succès via I-Node`);
                    }
                }
                
                // Fallback vers l'ancien système
                if (!found && window.app && window.app.fileSystem) {
                    console.log(`Rafraîchissement via ancien système: ${filePath}`);
                    const file = getFileFromPath(filePath, window.app.fileSystem);
                    
                    if (file && file.type === 'file') {
                        content = typeof file.content === 'function' ? file.content() : (file.content || '');
                        found = true;
                        console.log(`Fichier rafraîchi avec succès via ancien système`);
                    }
                }
                
                if (found) {
                    textarea.value = content;
                    
                    // Mettre à jour la taille affichée
                    const sizeDisplay = windowElement.querySelector('.window-content [style*="margin-left: auto"]');
                    if (sizeDisplay) {
                        sizeDisplay.innerHTML = `Fichier: ${filePath} | Taille: ${formatFileSize(content.length)}`;
                    }
                    
                    showNotification(`✓ ${fileName} actualisé`, '#28a745');
                } else {
                    showNotification(`✗ Impossible d'actualiser ${fileName}`, '#dc3545');
                }
                
            } catch (error) {
                console.error('Erreur lors du rafraîchissement:', error);
                showNotification(`✗ Erreur lors de l'actualisation de ${fileName}`, '#dc3545');
            }
        }
    };

    // Fonction utilitaire pour afficher les notifications
    function showNotification(message, backgroundColor = '#28a745') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 30000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    window.refreshFileContent = function(windowId, fileName) {
        const textarea = document.getElementById(`notepad-content-${windowId}`);
        if (textarea) {
            // Recharger le contenu depuis le système de fichiers
            try {
                // Utiliser le système I-Node si disponible
                if (window.app && window.app.inodeAdapter) {
                    const file = window.app.inodeAdapter.getPath(`/${fileName}`);
                    if (file && file.content !== undefined) {
                        const content = typeof file.content === 'function' ? file.content() : file.content;
                        textarea.value = content;
                    }
                }
                // Fallback vers l'ancien système
                else if (window.app && window.app.fileSystem) {
                    const file = getFileFromPath(`/${fileName}`, window.app.fileSystem);
                    if (file && file.content !== undefined) {
                        const content = typeof file.content === 'function' ? file.content() : file.content;
                        textarea.value = content;
                    }
                }
            } catch (error) {
                console.warn('Impossible de rafraîchir le fichier:', error);
            }
        }
    };

    function navigateToDirectory(newPath) {
        const pathInput = document.getElementById('current-path');
        const explorerFiles = document.getElementById('explorer-files');
        
        if (pathInput && explorerFiles) {
            console.log(`Navigation vers: ${newPath}`);
            
            // Vérifier si le répertoire existe
            let directoryExists = false;
            
            if (window.app && window.app.inodeAdapter) {
                const dirNode = window.app.inodeAdapter.getPath(newPath);
                directoryExists = dirNode && dirNode.type === 'directory';
            } else if (window.app && window.app.fileSystem) {
                const dirNode = getFileFromPath(newPath, window.app.fileSystem);
                directoryExists = dirNode && dirNode.type === 'directory';
            }
            
            if (directoryExists) {
                pathInput.value = newPath;
                const fileSystemData = (window.app && window.app.inodeAdapter) ? 'inode' : (window.app ? window.app.fileSystem : null);
                explorerFiles.innerHTML = getFileListHTML(newPath, fileSystemData);
                console.log(`Navigation réussie vers: ${newPath}`);
            } else {
                console.warn(`Répertoire inexistant: ${newPath}`);
                showNotification(`Répertoire inexistant: ${newPath}`, '#dc3545');
            }
        }
    }

    window.navigateBack = function() {
        const pathInput = document.getElementById('current-path');
        if (pathInput) {
            const currentPath = pathInput.value;
            console.log('Navigation arrière depuis:', currentPath);
            // Pour l'instant, aller au répertoire parent comme navigateUp
            window.navigateUp();
        }
    };

    window.navigateUp = function() {
        const pathInput = document.getElementById('current-path');
        if (pathInput) {
            const currentPath = pathInput.value;
            if (currentPath !== '/') {
                const parts = currentPath.split('/').filter(p => p !== '');
                parts.pop(); // Enlever le dernier élément
                const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
                console.log(`Navigation vers le parent: ${currentPath} -> ${parentPath}`);
                navigateToDirectory(parentPath);
            } else {
                console.log('Déjà à la racine, impossible de remonter');
            }
        }
    };

    window.refreshExplorer = function() {
        const explorerFiles = document.getElementById('explorer-files');
        const pathInput = document.getElementById('current-path');
        if (explorerFiles && pathInput) {
            const currentPath = pathInput.value;
            console.log(`Actualisation de l'explorateur: ${currentPath}`);
            
            // Utiliser le système I-Node si disponible, sinon fallback
            const fileSystemData = (window.app && window.app.inodeAdapter) ? 'inode' : (window.app ? window.app.fileSystem : null);
            explorerFiles.innerHTML = getFileListHTML(currentPath, fileSystemData);
            
            showNotification(`✓ Explorateur actualisé`, '#28a745');
        }
    };

    window.createNewFolder = function() {
        const folderName = prompt('Nom du nouveau dossier:');
        if (folderName && folderName.trim()) {
            const pathInput = document.getElementById('current-path');
            const currentPath = pathInput ? pathInput.value : '/';
            const newFolderPath = currentPath === '/' ? `/${folderName.trim()}` : `${currentPath}/${folderName.trim()}`;
            
            console.log(`Création du dossier: ${newFolderPath}`);
            
            try {
                let created = false;
                
                // Utiliser le système I-Node si disponible
                if (window.app && window.app.inodeAdapter) {
                    created = window.app.inodeAdapter.createDirectory(currentPath, folderName.trim());
                    if (created) {
                        console.log(`Dossier créé avec succès via I-Node: ${newFolderPath}`);
                    }
                }
                
                // Fallback vers l'ancien système
                if (!created && window.app && window.app.fileSystem) {
                    // Implémentation pour l'ancien système
                    const parentDir = getFileFromPath(currentPath, window.app.fileSystem);
                    if (parentDir && parentDir.type === 'directory' && parentDir.children) {
                        parentDir.children[folderName.trim()] = {
                            type: 'directory',
                            children: {}
                        };
                        created = true;
                        console.log(`Dossier créé via ancien système: ${newFolderPath}`);
                    }
                }
                
                if (created) {
                    showNotification(`✓ Dossier "${folderName.trim()}" créé`, '#28a745');
                    setTimeout(() => {
                        refreshExplorer();
                    }, 300);
                } else {
                    showNotification(`✗ Impossible de créer le dossier "${folderName.trim()}"`, '#dc3545');
                }
                
            } catch (error) {
                console.error('Erreur lors de la création du dossier:', error);
                showNotification(`✗ Erreur lors de la création du dossier`, '#dc3545');
            }
        }
    };

    // Nouvelles fonctions pour le menu Démarrer amélioré
    window.refreshDesktop = function() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('open');
        
        // Animation de rafraîchissement
        const desktop = document.querySelector('.windows-desktop');
        desktop.style.opacity = '0.8';
        setTimeout(() => {
            desktop.style.opacity = '1';
        }, 200);
        
        console.log('Bureau actualisé');
    };

    window.showAbout = function() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('open');
        
        // Créer une fenêtre "À propos"
        const aboutWindow = createWindow('about-' + Date.now(), 'about');
        document.querySelector('.windows-desktop').appendChild(aboutWindow);
    };

    window.lockScreen = function() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('open');
        
        // Créer un écran de verrouillage
        const lockScreen = document.createElement('div');
        lockScreen.id = 'lock-screen';
        lockScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
            z-index: 20000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Segoe UI', sans-serif;
        `;
        
        lockScreen.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">${createIcon('user', '48px', 'white')}</div>
                <h2 style="margin: 0 0 8px 0; font-size: 24px;">Utilisateur</h2>
                <p style="margin: 0 0 40px 0; color: rgba(255, 255, 255, 0.7);">Session verrouillée</p>
                <button onclick="unlockScreen()" style="padding: 12px 24px; background: #0078d4; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">Déverrouiller</button>
            </div>
            <div style="position: absolute; bottom: 40px; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                ${new Date().toLocaleTimeString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}
            </div>
        `;
        
        document.body.appendChild(lockScreen);
    };

    window.unlockScreen = function() {
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen) {
            lockScreen.remove();
        }
    };

    window.restartWindows = function() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('open');
        
        // Animation de redémarrage
        const desktop = document.querySelector('.windows-desktop');
        desktop.style.transition = 'opacity 0.5s ease';
        desktop.style.opacity = '0';
        
        setTimeout(() => {
            // Fermer toutes les fenêtres
            const windows = document.querySelectorAll('.window');
            windows.forEach(w => w.remove());
            
            // Réafficher le bureau
            desktop.style.opacity = '1';
            
            // Afficher un message de redémarrage
            const restartMsg = document.createElement('div');
            restartMsg.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 8px;
                font-size: 16px;
                z-index: 1000;
            `;
            restartMsg.textContent = 'Redémarrage terminé ✓';
            desktop.appendChild(restartMsg);
            
            setTimeout(() => restartMsg.remove(), 2000);
        }, 500);
    };

    // Gestion du drag & drop des fenêtres
    let isDragging = false;
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };
    let isDraggingCloseButton = false;
    let closeButtonDragTarget = null;
    let closeButtonOffset = { x: 0, y: 0 };

    window.startDrag = function(event, windowId) {
        isDragging = true;
        dragTarget = document.getElementById(windowId);
        const rect = dragTarget.getBoundingClientRect();
        dragOffset.x = event.clientX - rect.left;
        dragOffset.y = event.clientY - rect.top;
        event.preventDefault();
    };

    window.startDragCloseButton = function(event) {
        isDraggingCloseButton = true;
        closeButtonDragTarget = document.querySelector('.close-windows-container');
        
        // Ajouter la classe active pour maintenir la visibilité
        closeButtonDragTarget.classList.add('active');
        
        const rect = closeButtonDragTarget.getBoundingClientRect();
        closeButtonOffset.x = event.clientX - rect.left;
        closeButtonOffset.y = event.clientY - rect.top;
        
        // Ajouter une classe pour indiquer qu'on est en train de glisser
        closeButtonDragTarget.classList.add('dragging');
        
        event.preventDefault();
        event.stopPropagation();
    };

    document.addEventListener('mousemove', function(event) {
        if (isDragging && dragTarget) {
            const x = event.clientX - dragOffset.x;
            const y = event.clientY - dragOffset.y;
            dragTarget.style.left = Math.max(0, x) + 'px';
            dragTarget.style.top = Math.max(0, y) + 'px';
        }
        
        if (isDraggingCloseButton && closeButtonDragTarget) {
            const x = event.clientX - closeButtonOffset.x;
            const y = event.clientY - closeButtonOffset.y;
            const maxX = window.innerWidth - closeButtonDragTarget.offsetWidth;
            const maxY = window.innerHeight - closeButtonDragTarget.offsetHeight;
            
            closeButtonDragTarget.style.position = 'fixed';
            closeButtonDragTarget.style.left = Math.max(0, Math.min(maxX, x)) + 'px';
            closeButtonDragTarget.style.top = Math.max(0, Math.min(maxY, y)) + 'px';
            closeButtonDragTarget.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        dragTarget = null;
        
        if (isDraggingCloseButton) {
            isDraggingCloseButton = false;
            
            // Retirer les classes après un délai pour permettre le hover
            if (closeButtonDragTarget) {
                closeButtonDragTarget.classList.remove('dragging');
                
                // Garder la classe active un moment puis la retirer si pas en hover
                setTimeout(() => {
                    if (!closeButtonDragTarget.matches(':hover')) {
                        closeButtonDragTarget.classList.remove('active');
                    }
                }, 500);
            }
            
            closeButtonDragTarget = null;
        }
    });

    // Gestion des icônes du bureau
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', function() {
            const appType = this.dataset.app;
            if (appType) {
                openApp(appType);
            }
        });
    });

    // Fermer le menu démarrer en cliquant ailleurs
    document.addEventListener('click', function(event) {
        const startMenu = document.getElementById('start-menu');
        const startButton = document.querySelector('.start-button');
        
        if (startMenu && !startMenu.contains(event.target) && !startButton.contains(event.target)) {
            startMenu.classList.remove('open');
        }
    });

    // Mettre à jour l'heure
    setInterval(function() {
        const timeElement = document.querySelector('.system-time');
        if (timeElement) {
            const now = new Date();
            const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString('fr-FR');
            timeElement.innerHTML = `<div>${time}</div><div style="font-size: 10px;">${date}</div>`;
        }
    }, 1000);
}

// Export des commandes
module.exports = {
    win: windowsOS,
    windows: windows
};
