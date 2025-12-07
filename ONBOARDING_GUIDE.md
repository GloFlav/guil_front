# Guide d'Onboarding - Espace Praticien

## Vue d'ensemble

Une fonctionnalité d'onboarding a été ajoutée au composant `PraticienProfil` pour guider les nouveaux utilisateurs à travers les différentes sections de leur espace praticien.

## Fonctionnalités

### 1. Onboarding Automatique
- L'onboarding se déclenche automatiquement pour les nouveaux utilisateurs
- Il apparaît 1 seconde après le chargement de la page
- L'état est sauvegardé dans le localStorage pour éviter les répétitions

### 2. Bouton d'Aide
- **Desktop** : Bouton d'aide (icône ?) dans la barre d'onglets
- **Mobile** : Bouton d'aide flottant en haut à droite de la barre de navigation

### 3. Étapes de l'Onboarding
1. **Bienvenue** : Introduction générale
2. **Mes informations** : Gestion du profil personnel
3. **Mes cabinets** : Gestion des lieux de consultation
4. **Mes formations** : Parcours professionnel
5. **Abonnement** : Gestion des forfaits
6. **Navigation mobile** : Guide pour l'utilisation mobile *(affiché uniquement sur mobile)*

## Composants Utilisés

### OnboardingTour
- Composant réutilisable pour les guides d'utilisation
- Supporte les étapes multiples avec navigation
- Indicateur de progression visuel
- Boutons de navigation (Précédent/Suivant/Terminer/Passer)

### Intégration dans PraticienProfil
- État local pour gérer l'affichage
- Persistance dans localStorage
- Déclenchement automatique et manuel

## Utilisation

### Pour l'utilisateur
1. L'onboarding se lance automatiquement lors de la première visite
2. Cliquer sur le bouton d'aide pour relancer le guide
3. Naviguer avec les boutons ou cliquer sur "Passer" pour fermer

### Pour le développeur
```jsx
// Ajouter des étapes
const onboardingSteps = [
  {
    title: "Titre de l'étape",
    description: "Description détaillée",
    image: "url_de_l_image" // optionnel
  }
];

// Utiliser le composant
<OnboardingTour
  steps={onboardingSteps}
  isOpen={showOnboarding}
  onClose={() => setShowOnboarding(false)}
  onComplete={handleOnboardingComplete}
  title="Titre du guide"
  showHelpButton={false}
/>
```

## Personnalisation

### Ajouter de nouvelles étapes
Modifier le tableau `onboardingSteps` dans `PraticienProfil.jsx` :

```jsx
{
  title: "Nouvelle section",
  description: "Description de la nouvelle fonctionnalité",
  image: "/path/to/image.png" // optionnel
}
```

### Modifier le style
Le composant utilise les classes Tailwind CSS et peut être personnalisé via :
- Classes CSS personnalisées
- Props de style
- Thème de couleurs (actuellement #5DA781)

## État et Persistance

- **localStorage key** : `praticien-onboarding-completed`
- **Valeur** : `'true'` si l'onboarding a été vu
- **Reset** : Supprimer la clé du localStorage pour relancer l'onboarding

## Responsive Design

- **Desktop** : Modal centrée avec navigation complète (5 étapes)
- **Mobile** : Modal adaptée avec bouton d'aide dans la barre de navigation (6 étapes incluant la navigation mobile)
- **Tablette** : Comportement similaire au desktop (5 étapes)
- **Adaptation dynamique** : L'étape "Navigation mobile" n'apparaît que sur les écrans < 768px

## Accessibilité

- Navigation au clavier supportée
- Contraste de couleurs approprié
- Textes descriptifs pour les icônes
- Boutons avec labels explicites 