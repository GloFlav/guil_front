# Test de l'Onboarding - Guide de Vérification

## 🧪 Comment tester l'onboarding

### 1. Test de l'onboarding automatique

1. **Ouvrir la console du navigateur** (F12)
2. **Supprimer la clé localStorage** :
   ```javascript
   localStorage.removeItem('praticien-onboarding-completed')
   ```
3. **Recharger la page** (F5)
4. **Vérifier** : L'onboarding doit apparaître automatiquement après 1 seconde

### 2. Test du bouton d'aide

1. **Cliquer sur le bouton d'aide** (icône ?) dans la barre d'onglets
2. **Vérifier** : L'onboarding doit s'ouvrir

### 3. Test de navigation

1. **Naviguer entre les étapes** avec les boutons "Précédent" et "Suivant"
2. **Vérifier** : L'indicateur de progression doit se mettre à jour
3. **Tester le bouton "Passer"** : L'onboarding doit se fermer
4. **Tester le bouton "Terminer"** : L'onboarding doit se fermer et ne plus se relancer

### 4. Test responsive

1. **Tester sur mobile** : Redimensionner la fenêtre ou utiliser les outils de développement
2. **Vérifier** : Le bouton d'aide doit être visible dans la barre de navigation mobile
3. **Vérifier l'étape mobile** : Sur mobile (< 768px), l'étape "Navigation mobile" doit apparaître
4. **Vérifier sur desktop** : Sur desktop (≥ 768px), l'étape "Navigation mobile" ne doit pas apparaître

### 5. Test de persistance

1. **Terminer l'onboarding**
2. **Recharger la page**
3. **Vérifier** : L'onboarding ne doit plus apparaître automatiquement

## 🔧 Bouton de test (Mode développement)

En mode développement, un bouton "Reset" apparaît à côté du bouton d'aide pour réinitialiser facilement l'onboarding.

## 🐛 Problèmes courants et solutions

### L'onboarding ne s'affiche pas

- **Vérifier** : La clé `praticien-onboarding-completed` dans localStorage
- **Solution** : Supprimer la clé et recharger

### L'onboarding s'affiche en dehors de la page

- **Cause** : Problème de z-index
- **Solution** : Vérifier que les z-index sont corrects (9999 pour l'overlay, 10000 pour la modal)

### L'onboarding ne se ferme pas

- **Vérifier** : Les fonctions `onClose` et `onComplete` sont bien définies
- **Solution** : Vérifier la console pour les erreurs JavaScript

## 📱 Test sur différents appareils

### Desktop

- ✅ Modal centrée
- ✅ Navigation complète (5 étapes)
- ✅ Bouton d'aide dans la barre d'onglets
- ✅ Pas d'étape "Navigation mobile"

### Mobile

- ✅ Modal adaptée
- ✅ Bouton d'aide dans la barre de navigation
- ✅ Scroll si le contenu est trop long
- ✅ Étape "Navigation mobile" incluse (6 étapes total)

### Tablette

- ✅ Comportement similaire au desktop
- ✅ Modal responsive

## 🎯 Critères de succès

- [ ] L'onboarding s'affiche automatiquement pour les nouveaux utilisateurs
- [ ] Le bouton d'aide fonctionne correctement
- [ ] La navigation entre les étapes fonctionne
- [ ] L'onboarding se ferme correctement
- [ ] L'état est sauvegardé dans localStorage
- [ ] L'onboarding est responsive
- [ ] Les animations sont fluides
- [ ] L'accessibilité est respectée (navigation clavier, contraste, etc.)
