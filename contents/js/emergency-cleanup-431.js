// Script d'urgence pour éviter l'erreur HTTP 431
// Exécute ce script immédiatement en cas d'erreur 431

(function() {
    'use strict';
    
    console.log('🚨 SCRIPT D\'URGENCE - Prévention erreur HTTP 431');
    
    // Fonction de nettoyage immédiat
    function emergencyCleanupCookies() {
        try {
            const cookies = document.cookie.split(';');
            let cleanedCount = 0;
            let totalSizeBefore = 0;
            let totalSizeAfter = 0;
            
            // Calculer la taille avant nettoyage
            cookies.forEach(cookie => {
                const trimmed = cookie.trim();
                if (trimmed) {
                    totalSizeBefore += trimmed.length;
                }
            });
            
            console.log(`📊 Taille totale des cookies avant: ${totalSizeBefore} caractères`);
            
            // Identifier et nettoyer les gros cookies
            cookies.forEach(cookie => {
                const trimmed = cookie.trim();
                const [name, value] = trimmed.split('=');
                
                if (name && value && value.length > 500) {
                    try {
                        // Sauvegarder en localStorage
                        const decodedValue = decodeURIComponent(value);
                        localStorage.setItem('clk_' + name.trim(), decodedValue);
                        
                        // Supprimer le cookie
                        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                        
                        cleanedCount++;
                        console.log(`✅ Migré: ${name.trim()} (${value.length} chars)`);
                    } catch (error) {
                        console.warn(`⚠️ Erreur migration ${name}:`, error);
                    }
                }
            });
            
            // Calculer la taille après nettoyage
            const remainingCookies = document.cookie.split(';');
            remainingCookies.forEach(cookie => {
                const trimmed = cookie.trim();
                if (trimmed) {
                    totalSizeAfter += trimmed.length;
                }
            });
            
            console.log(`📊 Taille totale des cookies après: ${totalSizeAfter} caractères`);
            console.log(`🎉 Nettoyage terminé: ${cleanedCount} cookies migrés`);
            console.log(`💾 Réduction: ${totalSizeBefore - totalSizeAfter} caractères`);
            
            // Vérifier si c'est maintenant sûr
            if (totalSizeAfter < 2000) {
                console.log('✅ STATUT: SÉCURISÉ - Risque d\'erreur 431 éliminé');
            } else {
                console.log('⚠️ STATUT: ENCORE RISQUÉ - Nettoyage supplémentaire nécessaire');
            }
            
            return {
                cleanedCount,
                sizeBefore: totalSizeBefore,
                sizeAfter: totalSizeAfter,
                safe: totalSizeAfter < 2000
            };
            
        } catch (error) {
            console.error('❌ Erreur durant le nettoyage d\'urgence:', error);
            return null;
        }
    }
    
    // Fonction pour supprimer TOUS les cookies si nécessaire
    function nuclearCleanup() {
        console.log('☢️ NETTOYAGE NUCLÉAIRE - Suppression de TOUS les cookies');
        
        try {
            const cookies = document.cookie.split(';');
            let deletedCount = 0;
            
            cookies.forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    deletedCount++;
                }
            });
            
            console.log(`💥 ${deletedCount} cookies supprimés`);
            console.log('✅ Tous les cookies ont été supprimés');
            
            return deletedCount;
        } catch (error) {
            console.error('❌ Erreur durant le nettoyage nucléaire:', error);
            return 0;
        }
    }
    
    // Exposer les fonctions globalement
    window.emergencyCleanupCookies = emergencyCleanupCookies;
    window.nuclearCleanup = nuclearCleanup;
    
    // Exécution automatique du nettoyage
    console.log('🔄 Démarrage du nettoyage automatique...');
    const result = emergencyCleanupCookies();
    
    if (result && !result.safe) {
        console.log('⚠️ Nettoyage standard insuffisant, nettoyage nucléaire disponible');
        console.log('Tapez: nuclearCleanup() pour supprimer TOUS les cookies');
    }
    
    console.log('🏁 Script d\'urgence terminé');
    
})();

// Instructions d'utilisation
console.log(`
📋 INSTRUCTIONS D'URGENCE:
1. emergencyCleanupCookies() - Nettoyage intelligent
2. nuclearCleanup() - Suppression totale des cookies
3. checkCookieSafety() - Vérifier la sécurité
4. forceMigrateAllCookies() - Migration forcée

🎯 OBJECTIF: Maintenir les cookies sous 2KB pour éviter l'erreur 431
`);
