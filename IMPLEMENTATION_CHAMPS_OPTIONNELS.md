# Implémentation des Champs Optionnels pour les Formations

## 📋 Résumé des Modifications

Les champs "Diplômes et Certifications" (incluant année d'obtention, nom du diplôme, établissement et pièces justificatives) ne sont plus obligatoires par défaut. Leur statut (obligatoire/optionnel) est maintenant configurable dynamiquement depuis l'interface d'administration.

## 🎯 Objectif

Permettre aux administrateurs de rendre optionnels les champs suivants lors de la création ou modification de formations par les praticiens :
- Année d'obtention
- Nom du diplôme / certification
- Établissement
- Pièces justificatives

## 🔧 Fichiers Modifiés

### 1. **EditFormation.jsx** (`src/pages/praticien/ProfileComponents/EditFormation.jsx`)

#### Modifications apportées :

1. **Import du service de configuration**
   ```javascript
   import { fetchFormationFieldRequirements } from "@/services/formation-field-requirement-service";
   ```

2. **Ajout de la requête pour récupérer la configuration**
   ```javascript
   const { data: fieldRequirements } = useQuery({
     queryKey: ['formationFieldRequirements'],
     queryFn: fetchFormationFieldRequirements,
     staleTime: 300000,
   });
   ```

3. **Fonction helper pour vérifier si un champ est obligatoire**
   ```javascript
   const isFieldRequired = (fieldName) => {
     if (!fieldRequirements?.data) return true;
     const req = fieldRequirements.data.find(r => r.field_name === fieldName);
     return req ? req.is_required : true;
   };
   ```

4. **Mise à jour de la fonction `validate()`**
   - La validation utilise maintenant la configuration dynamique
   - Les champs sont validés uniquement s'ils sont marqués comme obligatoires dans la configuration

5. **Mise à jour des labels dans le formulaire**
   - Les labels affichent dynamiquement `*` (obligatoire) ou `(optionnel)`
   - Exemples :
     ```jsx
     Année d'obtention {isFieldRequired('year') ? <span className="text-red-700">*</span> : <span className="text-gray-500 text-xs">(optionnel)</span>}
     ```

## 🎛️ Configuration Admin

Le composant `ManageFormationRequirements.jsx` (déjà existant) permet aux administrateurs de configurer les champs obligatoires via l'interface admin.

### Champs configurables :
- `year` : Année d'obtention
- `certification_name` : Nom du diplôme / certification
- `institution_name` : Établissement
- `support_docs` : Pièces justificatives
- `sub_specialities` : Spécialités Maîtrisées

## 🔄 Flux de Fonctionnement

1. **Chargement de la page** : Le composant `EditFormation` récupère la configuration depuis le backend
2. **Affichage du formulaire** : Les labels sont mis à jour pour refléter le statut obligatoire/optionnel
3. **Validation** : Seuls les champs marqués comme obligatoires sont validés
4. **Sauvegarde** : Les données sont envoyées au backend indépendamment du statut obligatoire

## ✅ Avantages

- ✔️ **Flexibilité** : Les administrateurs peuvent adapter les exigences selon leurs besoins
- ✔️ **Expérience utilisateur améliorée** : Les praticiens savent clairement quels champs sont obligatoires
- ✔️ **Maintenance simplifiée** : Pas besoin de modifier le code pour changer les exigences
- ✔️ **Rétrocompatibilité** : Les champs sont obligatoires par défaut si la configuration n'est pas chargée

## 🧪 Test

Pour tester la fonctionnalité :

1. Accéder à l'interface admin de gestion des champs obligatoires
2. Désactiver le statut obligatoire pour les champs souhaités (ex: "Pièces justificatives")
3. Accéder à `/praticien/configuration-specialite`
4. Cliquer sur "Ajouter une nouvelle formation" ou modifier une formation existante
5. Vérifier que les champs désactivés affichent "(optionnel)" au lieu de "*"
6. Essayer de soumettre le formulaire sans remplir les champs optionnels
7. La validation devrait réussir

## 📝 Notes Techniques

- La configuration est mise en cache pendant 5 minutes (`staleTime: 300000`)
- En cas d'échec de chargement de la configuration, tous les champs restent obligatoires par défaut (comportement sécurisé)
- La validation côté frontend est synchronisée avec la configuration backend

## 🔗 Endpoints Backend Utilisés

- `GET /admin/formation-field-requirements` : Récupérer la configuration des champs
- `PUT /admin/formation-field-requirements/update` : Mettre à jour la configuration (admin uniquement)

## 📅 Date de Mise en Production

2025-11-13
