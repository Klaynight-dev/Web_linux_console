// Settings Manager - Gestion centralisée des paramètres
export class SettingsManager {
    constructor() {
        this.settings = {};
        this.loadSettings();
        this.initializeDefaults(); // Initialiser les valeurs par défaut
    }

    // --- Utilitaire pour créer des toggles ---
    createToggle(id, checked = false) {
        return `
            <div class="relative">
                <input type="checkbox" id="${id}" class="sr-only" ${checked ? 'checked' : ''}>
                <div class="toggle-bg ${checked ? 'active' : ''}">
                    <div class="toggle-dot"></div>
                </div>
            </div>
        `;
    }

    // --- Initialiser tous les paramètres avec des valeurs par défaut ---
    initializeDefaults() {
        // Définir toutes les valeurs par défaut
        const defaults = {
            'theme': 'default',
            'font_family': "'Courier New', monospace",
            'font_size': 14,
            'console_bg_type': 'color',
            'console_bg_color': '#18181b',
            'console_bg_gradient': { color1: '#000000', color2: '#1a1a1a' },
            'console_bg_image_url': '',
            'high_contrast': false,
            'show_timestamps': false,
            'show_line_numbers': false,
            'auto_save_history': true,
            'enable_autocomplete': true,
            'autocomplete_files': true,
            'enable_sounds': true,
            'enable_notifications': true,
            'smooth_animations': true
        };

        // Appliquer les valeurs par défaut seulement si elles n'existent pas déjà
        Object.entries(defaults).forEach(([key, value]) => {
            if (this.getSetting(key) === null) {
                this.applySetting(key, value);
            }
        });
    }

    // --- Charger et appliquer tous les paramètres dans l'interface ---
    loadAllSettingsIntoUI() {
        // Charger les paramètres du thème
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.getSetting('theme', 'default');
        }

        // Charger les paramètres de police
        const fontSelect = document.getElementById('font-family-select');
        if (fontSelect) {
            fontSelect.value = this.getSetting('font_family', "'Courier New', monospace");
        }

        // Charger la taille de police
        const fontSizeRange = document.getElementById('font-size-range');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeRange && fontSizeValue) {
            const fontSize = this.getSetting('font_size', 14);
            fontSizeRange.value = fontSize;
            fontSizeValue.textContent = fontSize + 'px';
        }

        // Charger le type d'arrière-plan
        const bgTypeSelect = document.getElementById('console-bg-type');
        if (bgTypeSelect) {
            bgTypeSelect.value = this.getSetting('console_bg_type', 'color');
        }

        // Charger la couleur d'arrière-plan
        const bgColorInput = document.getElementById('console-bg-color');
        if (bgColorInput) {
            bgColorInput.value = this.getSetting('console_bg_color', '#18181b');
        }

        // Charger l'URL d'image
        const bgUrlInput = document.getElementById('console-bg-url');
        if (bgUrlInput) {
            bgUrlInput.value = this.getSetting('console_bg_image_url', '');
        }

        // Charger le toggle de contraste élevé
        const highContrastToggle = document.getElementById('high-contrast-toggle');
        if (highContrastToggle) {
            const isHighContrast = this.getSetting('high_contrast', false);
            highContrastToggle.checked = isHighContrast;
            const toggleBg = highContrastToggle.parentElement.querySelector('.toggle-bg');
            if (toggleBg) {
                if (isHighContrast) {
                    toggleBg.classList.add('active');
                } else {
                    toggleBg.classList.remove('active');
                }
            }
        }
    }

    // --- Core Settings Functions ---
    applySetting(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this.settings[key] = value;
            return true;
        } catch (error) {
            console.warn('Erreur sauvegarde localStorage:', error);
            return false;
        }
    }

    getSetting(key, defaultValue = null) {
        if (this.settings[key] !== undefined) {
            return this.settings[key];
        }
        
        try {
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                const parsed = JSON.parse(stored);
                // Vérification de validité pour les objets de gradient
                if (key === 'console_bg_gradient') {
                    if (!parsed || typeof parsed !== 'object' || !parsed.color1 || !parsed.color2) {
                        console.warn('Gradient invalide trouvé, utilisation de la valeur par défaut');
                        this.settings[key] = defaultValue;
                        return defaultValue;
                    }
                }
                this.settings[key] = parsed;
                return parsed;
            }
        } catch (error) {
            console.warn('Erreur lecture localStorage pour', key, ':', error);
        }
        
        this.settings[key] = defaultValue;
        return defaultValue;
    }

    loadSettings() {
        // Charger tous les paramètres depuis localStorage
        const keys = [
            'console_bg_type', 'console_bg_color', 'console_bg_gradient',
            'console_bg_image_url', 'font_size', 'theme', 'font_family',
            'high_contrast', 'console_bg_gradient_start', 'console_bg_gradient_end',
            'console_bg_gradient_direction'
        ];
        
        keys.forEach(key => {
            this.getSetting(key);
        });
    }

    // --- Background Settings ---
    initBackgroundControls(app) {
        const bgTypeSelect = document.getElementById('console-bg-type');
        if (bgTypeSelect) {
            bgTypeSelect.addEventListener('change', (e) => {
                app.switchBackgroundType(e.target.value);
            });
        }

        // Gestionnaire pour la couleur unie avec feedback visuel
        const bgColorInput = document.getElementById('console-bg-color');
        if (bgColorInput) {
            bgColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                app.applyConsoleBackground('color', color);
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_color', color);
            });
            
            bgColorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                app.applyConsoleBackground('color', color);
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
                    app.applyConsoleBackground('image', url);
                    // Sauvegarder immédiatement pour la mémoire
                    this.applySetting('console_bg_image_url', url);
                }
            });
            
            bgUrlInput.addEventListener('blur', (e) => {
                const url = e.target.value.trim();
                if (url) {
                    app.applyConsoleBackground('image', url);
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
                        app.applyConsoleBackground('image', dataUrl);
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
                app.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_start', gradientColor1.value);
            });
            gradientColor2.addEventListener('input', () => {
                app.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_end', gradientColor2.value);
            });
            
            // Événement 'change' pour la sauvegarde finale
            gradientColor1.addEventListener('change', () => {
                app.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_start', gradientColor1.value);
            });
            gradientColor2.addEventListener('change', () => {
                app.updateGradientBackground();
                // Sauvegarder immédiatement pour la mémoire
                this.applySetting('console_bg_gradient_end', gradientColor2.value);
            });
        }

        // Charger les paramètres d'arrière-plan actuels
        this.loadBackgroundSettings(app);
    }

    loadBackgroundSettings(app) {
        // Force la couleur unie comme défaut si c'était "default" avant
        let bgType = this.getSetting('console_bg_type', 'color');
        if (bgType === 'default') {
            bgType = 'color';
            this.applySetting('console_bg_type', 'color');
        }
        
        const bgTypeSelect = document.getElementById('console-bg-type');
        if (bgTypeSelect) {
            bgTypeSelect.value = bgType;
            app.switchBackgroundType(bgType);
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
                app.applyConsoleBackground('color', bgColor);
            }
        }

        // Charger l'URL d'image
        const bgImageUrl = this.getSetting('console_bg_image_url', '');
        const bgUrlInput = document.getElementById('console-bg-url');
        if (bgUrlInput) {
            bgUrlInput.value = bgImageUrl;
        }

        // Charger les couleurs de dégradé avec les vraies valeurs par défaut
        let bgGradient = this.getSetting('console_bg_gradient', { color1: '#000000', color2: '#1a1a1a' });
        
        // Vérification de sécurité pour s'assurer que bgGradient est un objet valide
        if (!bgGradient || typeof bgGradient !== 'object' || !bgGradient.color1 || !bgGradient.color2) {
            bgGradient = { color1: '#000000', color2: '#1a1a1a' };
            this.applySetting('console_bg_gradient', bgGradient); // Sauvegarder la valeur corrigée
        }
        
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
                app.updateGradientBackground();
            }
        }
    }

    // --- Appearance Settings ---
    createAppearanceSection() {
        return `
        <style>
        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            height: 8px;
            background: linear-gradient(to right, #4f46e5 0%, #4f46e5 var(--value), #1e293b var(--value), #1e293b 100%);
            border-radius: 4px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
            transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }
        
        input[type="color"] {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            border: none;
            background: none;
            padding: 0;
        }
        
        input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
            border: none;
        }
        
        input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 0.75rem;
        }
        
        input[type="color"]::-moz-color-swatch {
            border: none;
            border-radius: 0.75rem;
        }
        
        .bg-control-group {
            transition: all 0.3s ease;
        }
        
        .bg-control-group:not(.hidden) {
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        </style>
        
        <div class="space-y-8">
            <div>
                <h3 class="text-2xl font-bold text-white mb-2">Configuration de l'apparence</h3>
                <p class="text-slate-400">Personnalisez l'aspect visuel de votre terminal</p>
            </div>

            <!-- Thème -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                    </svg>
                    Thème et couleurs
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Thème principal</label>
                        <select id="theme-select" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                            <option value="default" selected>CLK Default</option>
                            <option value="dark">Dark Mode</option>
                            <option value="matrix">Matrix</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Police de caractères</label>
                        <select id="font-family-select" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                            <option value="'Courier New', monospace" selected>Courier New</option>
                            <option value="'Monaco', monospace">Monaco</option>
                            <option value="'Menlo', monospace">Menlo</option>
                            <option value="'Source Code Pro', monospace">Source Code Pro</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Arrière-plan -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Arrière-plan de la console
                </h4>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">Type d'arrière-plan</label>
                        <select id="console-bg-type" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                            <option value="default">Par défaut</option>
                            <option value="color" selected>Couleur unie</option>
                            <option value="gradient">Dégradé</option>
                            <option value="image">Image personnalisée</option>
                        </select>
                    </div>
                    
                    <div id="color-controls" class="bg-control-group hidden">
                        <label class="block text-sm font-medium text-slate-300 mb-3">Couleur d'arrière-plan</label>
                        <div class="flex items-center space-x-4">
                            <input type="color" id="console-bg-color" value="#18181b" class="w-16 h-16 border-2 border-slate-600/50 rounded-xl cursor-pointer bg-transparent" title="Choisir une couleur">
                            <div class="text-sm text-slate-400">
                                <div>Cliquez pour choisir</div>
                                <div>une couleur</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="gradient-controls" class="bg-control-group hidden space-y-4">
                        <div class="text-sm text-slate-400 mb-2">Configurez les couleurs du dégradé :</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-slate-300">Couleur de début</label>
                                <div class="flex items-center space-x-3">
                                    <input type="color" id="gradient-color1" value="#000000" class="w-14 h-14 border-2 border-slate-600/50 rounded-xl cursor-pointer bg-transparent" title="Couleur de début du dégradé">
                                    <div class="text-xs text-slate-500">Début</div>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-slate-300">Couleur de fin</label>
                                <div class="flex items-center space-x-3">
                                    <input type="color" id="gradient-color2" value="#1a1a1a" class="w-14 h-14 border-2 border-slate-600/50 rounded-xl cursor-pointer bg-transparent" title="Couleur de fin du dégradé">
                                    <div class="text-xs text-slate-500">Fin</div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-slate-700/30 rounded-lg">
                            <div class="text-xs text-slate-400 mb-2">Aperçu du dégradé :</div>
                            <div id="gradient-preview" class="w-full h-12 rounded-lg border border-slate-600/30"></div>
                        </div>
                    </div>
                    
                    <div id="image-controls" class="bg-control-group hidden space-y-4">
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-slate-300">URL de l'image</label>
                            <input type="url" id="console-bg-url" placeholder="https://exemple.com/image.jpg" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-sm text-slate-400">ou</div>
                            <div class="flex-1 h-px bg-slate-600/30"></div>
                        </div>
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-slate-300">Fichier local</label>
                            <div class="relative">
                                <input type="file" id="console-bg-file" accept="image/*" class="sr-only">
                                <label for="console-bg-file" class="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600/50 rounded-lg cursor-pointer hover:border-blue-400/50 transition-colors">
                                    <div class="text-center">
                                        <svg class="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        <p class="text-sm text-slate-400">Cliquez pour sélectionner une image</p>
                                        <p class="text-xs text-slate-500 mt-1">PNG, JPG, GIF (max 5MB)</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Taille de police -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Taille du texte
                </h4>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-slate-300">Taille de police</label>
                        <span id="font-size-value" class="text-sm text-blue-400 font-medium">14px</span>
                    </div>
                    <input type="range" id="font-size-range" min="10" max="24" value="14" class="w-full">
                    <div class="flex justify-between text-xs text-slate-500">
                        <span>10px</span>
                        <span>24px</span>
                    </div>
                </div>
            </div>

            <!-- Accessibilité -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Accessibilité
                </h4>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Contraste élevé</label>
                            <p class="text-xs text-slate-400 mt-1">Améliore la lisibilité pour les utilisateurs malvoyants</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="high-contrast-toggle" class="sr-only">
                            <div class="toggle-bg">
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                    </svg>
                    Gestion des paramètres
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button id="export-settings-btn" class="flex items-center justify-center px-4 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Exporter
                    </button>
                    <button id="import-settings-btn" class="flex items-center justify-center px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Importer
                    </button>
                </div>
            </div>
        </div>`;
    }

    // --- Settings Action Functions ---
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
    }

    exportSettings() {
        try {
            const settings = {};
            for (const [key, value] of Object.entries(this.settings)) {
                settings[key] = value;
            }
            
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `console-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            // Feedback utilisateur
            const exportBtn = document.getElementById('export-settings-btn');
            if (exportBtn) {
                const originalText = exportBtn.innerHTML;
                exportBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Exporté !
                `;
                exportBtn.classList.add('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                exportBtn.classList.remove('bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
                
                setTimeout(() => {
                    exportBtn.innerHTML = originalText;
                    exportBtn.classList.remove('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                    exportBtn.classList.add('bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur export paramètres:', error);
            alert('Erreur lors de l\'export des paramètres');
        }
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const settings = JSON.parse(event.target.result);
                        this.loadImportedSettings(settings);
                        
                        // Feedback utilisateur
                        const importBtn = document.getElementById('import-settings-btn');
                        if (importBtn) {
                            const originalText = importBtn.innerHTML;
                            importBtn.innerHTML = `
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Importé !
                            `;
                            importBtn.classList.add('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                            importBtn.classList.remove('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                            
                            setTimeout(() => {
                                importBtn.innerHTML = originalText;
                                importBtn.classList.remove('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                                importBtn.classList.add('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                                location.reload(); // Recharger pour appliquer tous les paramètres
                            }, 1500);
                        }
                    } catch (error) {
                        console.error('Erreur import paramètres:', error);
                        alert('Fichier de paramètres invalide');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    loadImportedSettings(importedSettings) {
        for (const [key, value] of Object.entries(importedSettings)) {
            this.applySetting(key, value);
        }
    }

    // --- Save All Settings ---
    saveAllSettings() {
        // Cette fonction sauvegarde tous les paramètres actuels
        console.log('Tous les paramètres sont sauvegardés automatiquement');
        return true;
    }

    // --- Load All Settings ---
    loadAllSavedSettings(app) {
        // Charger tous les paramètres sauvegardés
        this.loadBackgroundSettings(app);
        
        // Charger la taille de police
        const fontSize = this.getSetting('font_size', 14);
        app.applyFontSize(fontSize);
        
        // Charger le thème
        const theme = this.getSetting('theme', 'default');
        app.applyTheme(theme);
        
        // Charger la famille de police
        const fontFamily = this.getSetting('font_family', "'Courier New', monospace");
        app.applyFontFamily(fontFamily);
        
        // Charger le contraste élevé
        const highContrast = this.getSetting('high_contrast', false);
        app.applyHighContrast(highContrast);
        
        // Charger les paramètres d'arrière-plan
        const bgType = this.getSetting('console_bg_type', 'color');
        const bgGradient = this.getSetting('console_bg_gradient', { color1: '#1e293b', color2: '#0f172a' });
        const bgColor = this.getSetting('console_bg_color', '#18181b');
        const bgImageUrl = this.getSetting('console_bg_image_url', '');
        
        if (app.consoleOutput) {
            if (bgType === 'gradient') {
                app.consoleOutput.style.backgroundColor = '';
                app.consoleOutput.style.backgroundImage = '';
                app.consoleOutput.style.background = `linear-gradient(135deg, ${bgGradient.color1}, ${bgGradient.color2})`;
            } else if (bgType === 'color') {
                app.consoleOutput.style.backgroundColor = bgColor;
                app.consoleOutput.style.backgroundImage = '';
                app.consoleOutput.style.background = '';
            } else if (bgType === 'image' && bgImageUrl) {
                app.consoleOutput.style.backgroundColor = '';
                app.consoleOutput.style.background = '';
                app.consoleOutput.style.backgroundImage = `url('${bgImageUrl}')`;
                app.consoleOutput.style.backgroundSize = 'cover';
                app.consoleOutput.style.backgroundPosition = 'center';
                app.consoleOutput.style.backgroundRepeat = 'no-repeat';
            }
        }
    }
}
