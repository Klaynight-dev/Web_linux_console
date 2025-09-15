/**
 * Script d'urgence pour nettoyer tous les cookies et éviter l'erreur 431
 * À exécuter dans la console du navigateur si l'erreur 431 persiste
 */

function emergencyCleanupAll() {
    console.log('🚨 NETTOYAGE D\'URGENCE COMPLET - Suppression de tous les cookies...');
    
    // Supprimer TOUS les cookies du domaine
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Nettoyer aussi le localStorage
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('clk_') || key.includes('console_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ localStorage nettoyé');
    } catch (error) {
        console.warn('Erreur nettoyage localStorage:', error);
    }
    
    // Nettoyer le sessionStorage
    try {
        sessionStorage.clear();
        console.log('✅ sessionStorage nettoyé');
    } catch (error) {
        console.warn('Erreur nettoyage sessionStorage:', error);
    }
    
    console.log('✅ Nettoyage d\'urgence terminé. Rechargez la page.');
    return 'NETTOYAGE_TERMINE';
}

// Auto-exécution si ce script est chargé directement
if (typeof window !== 'undefined' && window.location.search.includes('emergency=true')) {
    emergencyCleanupAll();
    setTimeout(() => {
        window.location.href = window.location.href.split('?')[0];
    }, 1000);
}

// Export pour utilisation manuelle
window.emergencyCleanupAll = emergencyCleanupAll;
