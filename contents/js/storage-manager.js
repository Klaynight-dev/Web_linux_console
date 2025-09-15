// Gestionnaire de stockage optimisé pour éviter les cookies trop volumineux
class StorageManager {
    constructor() {
        this.storagePrefix = 'clk_';
        this.cookieOnlyKeys = ['pseudo']; // Seules ces clés restent en cookies
        this.maxCookieSize = 1000; // Limite très restrictive pour éviter 431
        this.maxFragments = 5; // Réduction du nombre de fragments
        this.fragmentSuffix = '_frag_'; // Suffixe pour les fragments
        this.forceLocalStorage = true; // Force l'utilisation de localStorage par défaut
        
        // Migrer automatiquement les anciennes données
        this.migrateFromCookies();
        
        // Nettoyer les fragments orphelins au démarrage
        this.cleanupOrphanedFragments();
        
        // Surveillance continue des cookies pour éviter l'erreur 431
        this.startCookieMonitoring();
    }

    // Migrer les données existantes des cookies vers localStorage
    migrateFromCookies() {
        const cookiesToMigrate = [
            'console_filesystem',
            'console_linux_filesystem',
            'console_history',
            'console_settings',
            'console_tabs',
            'console_inode_system',
            'clk_disabled_commands',
            'console_bg_last_color',
            'console_bg_last_image'
        ];

        cookiesToMigrate.forEach(key => {
            const cookieValue = this.getCookieValue(key);
            if (cookieValue) {
                try {
                    localStorage.setItem(this.storagePrefix + key, cookieValue);
                    this.deleteCookie(key);
                    console.log(`Migré ${key} des cookies vers localStorage`);
                } catch (error) {
                    console.warn(`Erreur lors de la migration de ${key}:`, error);
                }
            }
        });

        // Détecter et supprimer les duplicatas
        this.removeDuplicates();

        // Migration aggressive de TOUS les gros cookies pour éviter l'erreur 431
        this.migrateAllLargeCookies();
    }

    // Migrer agressivement tous les cookies volumineux
    migrateAllLargeCookies() {
        try {
            const cookies = document.cookie.split(';');
            const largeCookies = [];
            
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const [name, value] = trimmedCookie.split('=');
                
                if (name && value && value.length > 500) { // Seuil très bas
                    largeCookies.push({ name: name.trim(), value });
                }
            });
            
            largeCookies.forEach(({ name, value }) => {
                try {
                    const decodedValue = decodeURIComponent(value);
                    localStorage.setItem(this.storagePrefix + name, decodedValue);
                    this.deleteCookie(name);
                    console.log(`Migration aggressive: ${name} (${value.length} chars) -> localStorage`);
                } catch (error) {
                    console.warn(`Erreur migration aggressive ${name}:`, error);
                }
            });
            
            if (largeCookies.length > 0) {
                console.log(`Migration agressive terminée: ${largeCookies.length} cookies migrés`);
            }
        } catch (error) {
            console.error('Erreur lors de la migration aggressive:', error);
        }
    }

    // NOUVELLE MÉTHODE: Détecter et supprimer les duplicatas
    removeDuplicates() {
        console.log('🔍 Détection des duplicatas...');
        
        const duplicatePairs = [
            ['console_filesystem', 'console_linux_filesystem'],
            ['console_filesystem', 'clk_console_filesystem'],
            ['console_inode_system', 'clk_console_inode_system'],
            ['console_tabs', 'clk_console_tabs']
        ];
        
        let totalSaved = 0;
        
        duplicatePairs.forEach(([primary, duplicate]) => {
            const primaryValue = this.load(primary);
            const duplicateValue = this.load(duplicate);
            
            if (primaryValue && duplicateValue) {
                // Garder la version la plus récente ou la plus complète
                const primarySize = JSON.stringify(primaryValue).length;
                const duplicateSize = JSON.stringify(duplicateValue).length;
                
                if (duplicateSize > primarySize) {
                    // Le duplicata est plus complet, on l'utilise comme principale
                    this.save(primary, duplicateValue, true);
                    console.log(`📦 Fusionné ${duplicate} vers ${primary} (plus complet: ${duplicateSize} vs ${primarySize} chars)`);
                } else {
                    console.log(`📦 Conservé ${primary}, ${duplicate} identique ou moins complet`);
                }
                
                // Supprimer le duplicata
                this.remove(duplicate);
                console.log(`🗑️ Supprimé duplicata: ${duplicate} (économie: ${duplicateSize} chars)`);
                totalSaved += duplicateSize;
                
            } else if (duplicateValue && !primaryValue) {
                // Seul le duplicata existe, on le renomme
                this.save(primary, duplicateValue, true);
                this.remove(duplicate);
                const savedSize = JSON.stringify(duplicateValue).length;
                console.log(`📁 Renommé ${duplicate} vers ${primary} (${savedSize} chars)`);
                
            } else if (duplicateValue) {
                // Le duplicata existe mais n'est pas nécessaire
                this.remove(duplicate);
                const savedSize = JSON.stringify(duplicateValue).length;
                console.log(`🗑️ Supprimé duplicata inutile: ${duplicate} (économie: ${savedSize} chars)`);
                totalSaved += savedSize;
            }
        });
        
        // Supprimer aussi les anciens cookies volumineux détectés
        const cookieSavings = this.removeKnownLargeCookies();
        totalSaved += cookieSavings;
        
        console.log(`✅ Nettoyage des duplicatas terminé - Total économisé: ${Math.round(totalSaved/1024)}KB`);
        return totalSaved;
    }

    // Supprimer les cookies volumineux connus
    removeKnownLargeCookies() {
        const knownLargeCookies = [
            'console_filesystem',
            'console_linux_filesystem', 
            'console_tabs',
            'console_inode_system',
            'clk_console_filesystem',
            'clk_console_inode_system',
            'clk_console_tabs',
            'console_history'
        ];
        
        let totalSaved = 0;
        
        knownLargeCookies.forEach(cookieName => {
            const cookieValue = this.getCookieValue(cookieName);
            if (cookieValue && cookieValue.length > 500) {
                console.log(`🚨 Cookie volumineux détecté: ${cookieName} (${cookieValue.length} chars)`);
                
                // Sauvegarder en localStorage avant suppression
                try {
                    const existingLocal = localStorage.getItem(this.storagePrefix + cookieName);
                    if (!existingLocal || existingLocal.length < cookieValue.length) {
                        localStorage.setItem(this.storagePrefix + cookieName, cookieValue);
                        console.log(`💾 Migré vers localStorage: ${cookieName}`);
                    }
                } catch (error) {
                    console.warn(`Erreur migration ${cookieName}:`, error);
                }
                
                // Supprimer le cookie
                this.deleteCookie(cookieName);
                console.log(`🗑️ Cookie supprimé: ${cookieName}`);
                totalSaved += cookieValue.length;
            }
        });
        
        return totalSaved;
    }

    // Méthode unifiée pour sauvegarder
    save(key, data, forceLocalStorage = false) {
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Priorité absolue au localStorage pour éviter l'erreur 431
        if (this.forceLocalStorage || 
            forceLocalStorage || 
            stringData.length > this.maxCookieSize || 
            !this.cookieOnlyKeys.includes(key)) {
            
            try {
                localStorage.setItem(this.storagePrefix + key, stringData);
                console.log(`Données sauvegardées en localStorage: ${key} (${stringData.length} chars)`);
                return true;
            } catch (error) {
                console.error(`Erreur localStorage pour ${key}:`, error);
                // Fallback vers cookies seulement si localStorage échoue ET que la donnée est petite
                if (stringData.length <= this.maxCookieSize && this.cookieOnlyKeys.includes(key)) {
                    console.warn(`Fallback vers cookies pour ${key}`);
                    return this.setCookie(key, stringData);
                }
                return false;
            }
        } else {
            // Utiliser les cookies seulement pour les données très petites et essentielles
            return this.setCookie(key, stringData);
        }
    }

    // Méthode unifiée pour charger
    load(key, defaultValue = null) {
        // Essayer localStorage d'abord
        try {
            const localData = localStorage.getItem(this.storagePrefix + key);
            if (localData !== null) {
                try {
                    return JSON.parse(localData);
                } catch {
                    return localData; // Retourner comme string si pas JSON
                }
            }
        } catch (error) {
            console.warn(`Erreur localStorage pour ${key}:`, error);
        }

        // Fallback vers les cookies pour les clés spécifiques
        if (this.cookieOnlyKeys.includes(key)) {
            const cookieData = this.getCookieValue(key);
            if (cookieData) {
                try {
                    return JSON.parse(cookieData);
                } catch {
                    return cookieData;
                }
            }
        }

        return defaultValue;
    }

    // Supprimer une donnée
    remove(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
        } catch (error) {
            console.warn(`Erreur suppression localStorage pour ${key}:`, error);
        }
        
        this.deleteCookie(key);
    }

    // Nettoyer toutes les données
    clearAll() {
        // Nettoyer localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Erreur lors du nettoyage localStorage:', error);
        }

        // Nettoyer les cookies normaux
        this.cookieOnlyKeys.forEach(key => {
            this.deleteCookie(key);
        });

        // Nettoyer tous les cookies fragmentés orphelins
        this.cleanupOrphanedFragments();
    }

    // Nettoyer les fragments orphelins
    cleanupOrphanedFragments() {
        try {
            const cookies = document.cookie.split(';');
            const fragmentsToDelete = [];
            const metadataFound = new Set();
            
            // Identifier les métadonnées existantes
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const name = trimmedCookie.split('=')[0];
                
                if (name && name.includes(this.fragmentSuffix) && name.endsWith('meta')) {
                    const baseName = name.replace(this.fragmentSuffix + 'meta', '');
                    metadataFound.add(baseName);
                }
            });
            
            // Identifier les fragments orphelins
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const name = trimmedCookie.split('=')[0];
                
                if (name && name.includes(this.fragmentSuffix) && !name.endsWith('meta')) {
                    const baseName = name.split(this.fragmentSuffix)[0];
                    if (!metadataFound.has(baseName)) {
                        fragmentsToDelete.push(name);
                    }
                }
            });
            
            // Supprimer les fragments orphelins
            fragmentsToDelete.forEach(fragmentName => {
                document.cookie = `${fragmentName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
            if (fragmentsToDelete.length > 0) {
                console.log(`Nettoyé ${fragmentsToDelete.length} fragments orphelins`);
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage des fragments orphelins:', error);
        }
    }

    // Obtenir les statistiques de stockage
    getStorageStats() {
        let localStorageSize = 0;
        let cookieSize = 0;
        let fragmentedCookieSize = 0;
        let itemCount = 0;
        let fragmentedCookieCount = 0;

        // Calculer la taille du localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storagePrefix)) {
                    const value = localStorage.getItem(key);
                    localStorageSize += key.length + (value ? value.length : 0);
                    itemCount++;
                }
            });
        } catch (error) {
            console.warn('Erreur calcul stats localStorage:', error);
        }

        // Calculer la taille des cookies normaux et fragmentés
        try {
            const cookies = document.cookie.split(';');
            const fragmentedCookies = new Set();
            
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const [name, value] = trimmedCookie.split('=');
                
                if (name && value) {
                    // Vérifier si c'est un fragment ou métadonnées
                    if (name.includes(this.fragmentSuffix)) {
                        const baseName = name.split(this.fragmentSuffix)[0];
                        if (name.endsWith('meta')) {
                            fragmentedCookies.add(baseName);
                        }
                        fragmentedCookieSize += name.length + value.length;
                    } else if (this.cookieOnlyKeys.includes(name)) {
                        cookieSize += name.length + value.length;
                    }
                }
            });
            
            fragmentedCookieCount = fragmentedCookies.size;
        } catch (error) {
            console.warn('Erreur calcul stats cookies:', error);
        }

        return {
            localStorageSize: Math.round(localStorageSize / 1024 * 100) / 100, // KB
            cookieSize: Math.round(cookieSize / 1024 * 100) / 100, // KB
            fragmentedCookieSize: Math.round(fragmentedCookieSize / 1024 * 100) / 100, // KB
            fragmentedCookieCount,
            itemCount,
            totalSize: Math.round((localStorageSize + cookieSize + fragmentedCookieSize) / 1024 * 100) / 100 // KB
        };
    }

    // === Méthodes internes pour les cookies ===
    setCookie(name, value, days = 30) {
        try {
            // Vérification stricte de la taille pour éviter l'erreur 431
            if (value.length > this.maxCookieSize) {
                console.warn(`Cookie ${name} trop volumineux (${value.length} chars), redirection vers localStorage`);
                return this.save(name, value, true);
            }
            
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            
            // Cookie simple et sécurisé
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
            console.log(`Cookie sauvegardé: ${name} (${value.length} chars)`);
            return true;
        } catch (error) {
            console.error(`Erreur création cookie ${name}:`, error);
            // Fallback vers localStorage en cas d'erreur
            console.warn(`Fallback localStorage pour ${name}`);
            return this.save(name, value, true);
        }
    }

    // Créer un cookie fragmenté pour éviter l'erreur 431
    setFragmentedCookie(name, value, days = 30) {
        try {
            const encodedValue = encodeURIComponent(value);
            const totalLength = encodedValue.length;
            const fragmentCount = Math.ceil(totalLength / this.maxCookieSize);
            
            // Vérifier si on dépasse le nombre maximum de fragments
            if (fragmentCount > this.maxFragments) {
                console.warn(`Cookie ${name} trop volumineux même fragmenté (${fragmentCount} fragments), migration vers localStorage`);
                return this.save(name, value, true);
            }
            
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            const expiresString = expires.toUTCString();
            
            // Nettoyer d'abord les anciens fragments
            this.clearFragmentedCookie(name);
            
            // Créer le cookie de métadonnées
            const metadata = {
                totalFragments: fragmentCount,
                totalLength: totalLength,
                timestamp: Date.now()
            };
            document.cookie = `${name}${this.fragmentSuffix}meta=${encodeURIComponent(JSON.stringify(metadata))}; expires=${expiresString}; path=/; SameSite=Strict`;
            
            // Créer les fragments
            for (let i = 0; i < fragmentCount; i++) {
                const start = i * this.maxCookieSize;
                const end = Math.min(start + this.maxCookieSize, totalLength);
                const fragment = encodedValue.substring(start, end);
                
                document.cookie = `${name}${this.fragmentSuffix}${i}=${fragment}; expires=${expiresString}; path=/; SameSite=Strict`;
            }
            
            console.log(`Cookie ${name} fragmenté en ${fragmentCount} parties`);
            return true;
        } catch (error) {
            console.error(`Erreur création cookie fragmenté ${name}:`, error);
            return false;
        }
    }

    getCookieValue(name) {
        try {
            // Vérifier d'abord si c'est un cookie fragmenté (pour la compatibilité)
            const metadata = this.getFragmentedCookieMetadata(name);
            if (metadata) {
                console.warn(`Cookie fragmenté détecté: ${name}, migration vers localStorage recommandée`);
                return this.getFragmentedCookieValue(name, metadata);
            }
            
            // Cookie normal
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
                    console.log(`Cookie chargé: ${name} (${value.length} chars)`);
                    return value;
                }
            }
        } catch (error) {
            console.error(`Erreur lecture cookie ${name}:`, error);
        }
        return null;
    }

    // Obtenir les métadonnées d'un cookie fragmenté
    getFragmentedCookieMetadata(name) {
        try {
            const metaName = `${name}${this.fragmentSuffix}meta=`;
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(metaName) === 0) {
                    const metaValue = decodeURIComponent(c.substring(metaName.length, c.length));
                    return JSON.parse(metaValue);
                }
            }
        } catch (error) {
            console.error(`Erreur lecture métadonnées cookie fragmenté ${name}:`, error);
        }
        return null;
    }

    // Reconstituer un cookie fragmenté
    getFragmentedCookieValue(name, metadata) {
        try {
            let reconstructedValue = '';
            
            // Vérifier que tous les fragments sont présents
            for (let i = 0; i < metadata.totalFragments; i++) {
                const fragmentName = `${name}${this.fragmentSuffix}${i}=`;
                const ca = document.cookie.split(';');
                let fragmentFound = false;
                
                for (let j = 0; j < ca.length; j++) {
                    let c = ca[j];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(fragmentName) === 0) {
                        reconstructedValue += c.substring(fragmentName.length, c.length);
                        fragmentFound = true;
                        break;
                    }
                }
                
                if (!fragmentFound) {
                    console.warn(`Fragment ${i} manquant pour le cookie ${name}`);
                    return null;
                }
            }
            
            // Vérifier l'intégrité
            if (reconstructedValue.length !== metadata.totalLength) {
                console.warn(`Taille incorrecte lors de la reconstitution du cookie ${name}`);
                return null;
            }
            
            return decodeURIComponent(reconstructedValue);
        } catch (error) {
            console.error(`Erreur reconstitution cookie fragmenté ${name}:`, error);
            return null;
        }
    }

    deleteCookie(name) {
        try {
            // Supprimer le cookie normal
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            
            // Supprimer les fragments s'ils existent
            this.clearFragmentedCookie(name);
        } catch (error) {
            console.error(`Erreur suppression cookie ${name}:`, error);
        }
    }

    // Nettoyer tous les fragments d'un cookie
    clearFragmentedCookie(name) {
        try {
            // Supprimer les métadonnées
            document.cookie = `${name}${this.fragmentSuffix}meta=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            
            // Supprimer tous les fragments possibles
            for (let i = 0; i < this.maxFragments; i++) {
                document.cookie = `${name}${this.fragmentSuffix}${i}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        } catch (error) {
            console.error(`Erreur nettoyage fragments cookie ${name}:`, error);
        }
    }

    // Compresser les données pour économiser l'espace
    compress(data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        
        // Compression simple : supprimer les espaces inutiles et remplacer les chaînes répétitives
        return data
            .replace(/\s+/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/\[\s*/g, '[')
            .replace(/\s*\]/g, ']');
    }

    // Décompresser les données
    decompress(data) {
        return data;
    }

    // Diagnostiquer les cookies fragmentés (utile pour le debug)
    diagnoseFragmentedCookies() {
        const diagnosis = {
            fragmentedCookies: [],
            orphanedFragments: [],
            totalFragments: 0,
            totalSize: 0
        };

        try {
            const cookies = document.cookie.split(';');
            const metadataFound = new Map();
            const fragmentsFound = new Map();

            // Analyser tous les cookies
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const [name, value] = trimmedCookie.split('=');
                
                if (name && name.includes(this.fragmentSuffix)) {
                    if (name.endsWith('meta')) {
                        const baseName = name.replace(this.fragmentSuffix + 'meta', '');
                        try {
                            const metadata = JSON.parse(decodeURIComponent(value || '{}'));
                            metadataFound.set(baseName, metadata);
                        } catch (error) {
                            console.warn(`Métadonnées corrompues pour ${baseName}:`, error);
                        }
                    } else {
                        const parts = name.split(this.fragmentSuffix);
                        const baseName = parts[0];
                        const fragmentIndex = parseInt(parts[1]);
                        
                        if (!fragmentsFound.has(baseName)) {
                            fragmentsFound.set(baseName, []);
                        }
                        fragmentsFound.get(baseName).push({
                            index: fragmentIndex,
                            size: value ? value.length : 0
                        });
                        
                        diagnosis.totalFragments++;
                        diagnosis.totalSize += (value ? value.length : 0);
                    }
                }
            });

            // Analyser les cookies fragmentés complets
            metadataFound.forEach((metadata, baseName) => {
                const fragments = fragmentsFound.get(baseName) || [];
                const expectedFragments = metadata.totalFragments || 0;
                
                diagnosis.fragmentedCookies.push({
                    name: baseName,
                    expectedFragments,
                    foundFragments: fragments.length,
                    isComplete: fragments.length === expectedFragments,
                    totalSize: metadata.totalLength || 0,
                    fragments: fragments.sort((a, b) => a.index - b.index)
                });
            });

            // Trouver les fragments orphelins
            fragmentsFound.forEach((fragments, baseName) => {
                if (!metadataFound.has(baseName)) {
                    diagnosis.orphanedFragments.push({
                        name: baseName,
                        fragments: fragments
                    });
                }
            });

        } catch (error) {
            console.error('Erreur lors du diagnostic des cookies fragmentés:', error);
        }

        return diagnosis;
    }

    // Surveillance continue des cookies pour éviter l'erreur 431
    startCookieMonitoring() {
        // Vérification immédiate
        this.checkAndCleanCookies();
        
        // Surveillance périodique (toutes les 30 secondes)
        setInterval(() => {
            this.checkAndCleanCookies();
        }, 30000);
        
        console.log('Surveillance des cookies activée pour éviter l\'erreur 431');
    }

    // Vérifier et nettoyer les cookies trop volumineux
    checkAndCleanCookies() {
        try {
            const cookies = document.cookie.split(';');
            let totalCookieSize = 0;
            const problematicCookies = [];
            
            cookies.forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const [name, value] = trimmedCookie.split('=');
                
                if (name && value) {
                    const cookieSize = name.length + value.length;
                    totalCookieSize += cookieSize;
                    
                    // Identifier les cookies problématiques
                    if (value.length > this.maxCookieSize) {
                        problematicCookies.push({ name: name.trim(), size: value.length });
                    }
                }
            });
            
            // Si la taille totale dépasse 3KB ou qu'il y a des cookies volumineux
            if (totalCookieSize > 3000 || problematicCookies.length > 0) {
                console.warn(`Cookies volumineux détectés (${totalCookieSize} chars total), nettoyage en cours...`);
                
                problematicCookies.forEach(({ name, size }) => {
                    // Sauvegarder en localStorage avant suppression
                    const cookieValue = this.getCookieValue(name);
                    if (cookieValue) {
                        localStorage.setItem(this.storagePrefix + name, cookieValue);
                        this.deleteCookie(name);
                        console.log(`Cookie volumineux migré: ${name} (${size} chars)`);
                    }
                });
                
                return problematicCookies.length;
            }
            
            return 0;
        } catch (error) {
            console.error('Erreur lors de la surveillance des cookies:', error);
            return -1;
        }
    }

    // Forcer le nettoyage immédiat de tous les gros cookies
    emergencyCleanup() {
        console.log('🚨 Nettoyage d\'urgence des cookies pour éviter l\'erreur 431');
        
        const cleanedCount = this.checkAndCleanCookies();
        this.cleanupOrphanedFragments();
        
        // Forcer la migration de tous les cookies restants vers localStorage
        this.migrateAllLargeCookies();
        
        console.log(`✅ Nettoyage d'urgence terminé (${cleanedCount} cookies traités)`);
        return cleanedCount;
    }
}

// Instance globale
const storageManagerInstance = new StorageManager();
window.StorageManager = storageManagerInstance;

// Fonctions de test globales pour faciliter les tests
window.testCookieFragmentation = function() {
    console.log('=== Test de fragmentation des cookies ===');
    
    // Créer des données volumineuses
    const testData = 'TEST_DATA_' + 'x'.repeat(15000); // ~15KB
    const testKey = 'fragmentation_test';
    
    console.log(`Taille des données: ${testData.length} caractères`);
    
    // Sauvegarder
    const saveResult = storageManagerInstance.save(testKey, testData);
    console.log('Sauvegarde réussie:', saveResult);
    
    // Charger
    const loadedData = storageManagerInstance.load(testKey);
    const isIdentical = loadedData === testData;
    console.log('Chargement réussi:', loadedData !== null);
    console.log('Données identiques:', isIdentical);
    
    // Diagnostiquer
    const diagnosis = storageManagerInstance.diagnoseFragmentedCookies();
    console.log('Diagnostic:', diagnosis);
    
    // Nettoyer
    storageManagerInstance.remove(testKey);
    console.log('Test terminé et nettoyé');
    
    return isIdentical;
};

window.showStorageStats = function() {
    const stats = storageManagerInstance.getStorageStats();
    console.table(stats);
    return stats;
};

// Nouvelles fonctions pour éviter l'erreur 431
window.emergencyCleanup = function() {
    return storageManagerInstance.emergencyCleanup();
};

window.checkCookieSafety = function() {
    console.log('=== Vérification de la sécurité des cookies ===');
    
    const cookies = document.cookie.split(';');
    let totalSize = 0;
    const cookieInfo = [];
    
    cookies.forEach(cookie => {
        const trimmed = cookie.trim();
        const [name, value] = trimmed.split('=');
        if (name && value) {
            const size = name.length + value.length;
            totalSize += size;
            cookieInfo.push({
                name: name.trim(),
                size: size,
                safe: size < 1000
            });
        }
    });
    
    console.log(`Taille totale des cookies: ${totalSize} caractères`);
    console.log('Statut: ' + (totalSize < 3000 ? '✅ SAFE' : '⚠️ RISQUE 431'));
    
    if (cookieInfo.length > 0) {
        console.table(cookieInfo);
    }
    
    return { totalSize, cookieCount: cookieInfo.length, safe: totalSize < 3000 };
};

window.forceMigrateAllCookies = function() {
    console.log('🔄 Migration forcée de tous les cookies vers localStorage');
    storageManagerInstance.migrateAllLargeCookies();
    return checkCookieSafety();
};

// NOUVELLE FONCTION: Nettoyage manuel des duplicatas
window.cleanupDuplicates = function() {
    console.log('🧹 Nettoyage manuel des duplicatas...');
    const savedBytes = storageManagerInstance.removeDuplicates();
    const stats = storageManagerInstance.getStorageStats();
    
    console.log('=== Résultats du nettoyage ===');
    console.log(`💾 Espace économisé: ${Math.round(savedBytes/1024*100)/100} KB`);
    console.table(stats);
    
    return { savedBytes, stats };
};

// NOUVELLE FONCTION: Diagnostic complet du stockage
window.fullStorageDiagnosis = function() {
    console.log('🔍 Diagnostic complet du stockage...');
    
    // Vérifier localStorage
    const localStorageInfo = [];
    const storagePrefix = 'clk_';
    
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(storagePrefix)) {
                const value = localStorage.getItem(key);
                const size = value ? value.length : 0;
                localStorageInfo.push({
                    key: key.replace(storagePrefix, ''),
                    size: size,
                    sizeKB: Math.round(size/1024*100)/100
                });
            }
        });
    } catch (error) {
        console.warn('Erreur lecture localStorage:', error);
    }
    
    // Vérifier les cookies
    const cookieInfo = [];
    try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const trimmed = cookie.trim();
            const [name, value] = trimmed.split('=');
            if (name && value) {
                const size = value.length;
                cookieInfo.push({
                    name: name.trim(),
                    size: size,
                    sizeKB: Math.round(size/1024*100)/100,
                    status: size > 1000 ? '⚠️ VOLUMINEUX' : '✅ OK'
                });
            }
        });
    } catch (error) {
        console.warn('Erreur lecture cookies:', error);
    }
    
    // Détecter les duplicatas potentiels
    const potentialDuplicates = [];
    localStorageInfo.forEach(item => {
        const duplicateNames = [
            item.key.replace('console_', 'console_linux_'),
            item.key.replace('console_', 'clk_console_'),
            item.key.replace('linux_', ''),
            item.key.replace('clk_', '')
        ];
        
        duplicateNames.forEach(dupName => {
            const foundDup = localStorageInfo.find(other => other.key === dupName && other.key !== item.key);
            if (foundDup) {
                potentialDuplicates.push({
                    original: item.key,
                    duplicate: foundDup.key,
                    originalSize: item.sizeKB,
                    duplicateSize: foundDup.sizeKB
                });
            }
        });
    });
    
    console.log('=== DIAGNOSTIC COMPLET ===');
    console.log('📦 LocalStorage:');
    console.table(localStorageInfo);
    
    console.log('🍪 Cookies:');
    console.table(cookieInfo);
    
    if (potentialDuplicates.length > 0) {
        console.log('⚠️ Duplicatas détectés:');
        console.table(potentialDuplicates);
    } else {
        console.log('✅ Aucun duplicata détecté');
    }
    
    const stats = storageManagerInstance.getStorageStats();
    console.log('📊 Statistiques globales:');
    console.table(stats);
    
    return {
        localStorage: localStorageInfo,
        cookies: cookieInfo,
        duplicates: potentialDuplicates,
        stats: stats
    };
};

export default storageManagerInstance;
