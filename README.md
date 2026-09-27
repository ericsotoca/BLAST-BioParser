# 🧬 Visualiseur & Parser de Résultats BLAST (NCBI / BLAST+)

Un visualiseur et parser de résultats BLAST autonome, performant et élégant, codé entièrement côté client en **React**, **TypeScript** et **Tailwind CSS**. Ce projet est configuré pour être déployé automatiquement sur **GitHub Pages**.

---

## 🚀 Comment déployer automatiquement sur GitHub Pages

Tout a été configuré pour que le déploiement se fasse de manière autonome et automatique grâce à **GitHub Actions**.

### Étape 1 : Créer un dépôt sur GitHub et pousser votre code
1. Créez un nouveau dépôt public ou privé sur votre compte GitHub (par exemple : `blast-parser`).
2. Ouvrez un terminal dans le dossier du projet local et exécutez les commandes suivantes pour pousser le code :
   ```bash
   git init
   git add .
   git commit -m "Initial BLAST Parser setup"
   git branch -M main
   git remote add origin https://github.com/VOTRE_PSEUDO/NOM_DU_DEPOT.git
   git push -u origin main
   ```

### Étape 2 : Activer les permissions pour GitHub Actions
Pour que le script de déploiement puisse publier l'application sur la branche `gh-pages`, vous devez lui accorder les permissions d'écriture :
1. Allez sur votre dépôt GitHub.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans la barre latérale gauche, allez dans **Actions** > **General**.
4. Faites défiler la page jusqu'à la section **Workflow permissions** (Permissions des workflows).
5. Sélectionnez **Read and write permissions** (Permissions en lecture et écriture).
6. Cliquez sur **Save** (Enregistrer).

### Étape 3 : Configurer GitHub Pages
Une fois que vous poussez votre code sur la branche `main` (ou `master`), l'action GitHub va s'exécuter automatiquement, compiler l'application, et créer une branche nommée `gh-pages` contenant les fichiers compilés.

Pour l'afficher en ligne :
1. Allez dans les **Settings** (Paramètres) de votre dépôt.
2. Dans la barre latérale gauche, cliquez sur **Pages**.
3. Dans la section **Build and deployment** > **Source**, assurez-vous que **Deploy from a branch** est sélectionné.
4. Sous **Branch**, sélectionnez la branche **`gh-pages`** et le dossier **`/ (root)`**.
5. Cliquez sur **Save**.

Votre application sera en ligne à l'adresse suivante :
`https://VOTRE_PSEUDO.github.io/NOM_DU_DEPOT/`

---

## 🛠️ Fonctionnalités du Visualiseur

1. **Parser Multi-Formats** :
   - Formats tabulaires (`outfmt 6` et `outfmt 7` avec commentaires `#`).
   - Format XML (`outfmt 5`).
   - Format Texte standard par paires (`outfmt 0`).
   - Glisser-déposer de fichiers, zone de copier-coller et détection automatique de format.

2. **Tableau de Bord de Statistiques** :
   - Graphiques de distribution d'identité, de corrélation Longueur vs Bit-score, et répartition taxonomique.
   - Calcul de KPI en direct (meilleur E-value, identité moyenne, organisme prédominant).

3. **Filtrage Dynamique Interactif** :
   - Filtrage en temps réel par : E-value (notation scientifique), pourcentage d'identité, couverture de requête, Bit-score, et longueur.
   - Export des données filtrées en **CSV**, **TSV** ou **JSON**.

4. **Visualisation Graphique & Alignement** :
   - **NCBI-Style SVG Track Plot** : Carte interactive représentant la couverture des hits par rapport à la séquence requête avec coloration dynamique par score.
   - **Inspecteur Pairwise Détaillé** : Surlignage couleur monospace des mutations/mismatches (rouge) et des gaps (jaune/orange).

5. **Impression de Rapports** :
   - Mise en page optimisée pour l'impression ou l'export direct au format **PDF**.
