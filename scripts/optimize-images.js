import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

async function optimizeImages() {
  console.log('🖼️  Démarrage de l\'optimisation des images...\n');

  try {
    // Trouver toutes les images PNG, JPG, JPEG
    const images = await glob('src/**/*.{png,jpg,jpeg}', {
      ignore: ['**/node_modules/**', '**/dist/**']
    });

    if (images.length === 0) {
      console.log('❌ Aucune image trouvée à optimiser.');
      return;
    }

    console.log(`📁 ${images.length} image(s) trouvée(s)\n`);

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const imagePath of images) {
      try {
        // Taille originale
        const stats = await fs.stat(imagePath);
        const originalSize = stats.size;
        totalOriginalSize += originalSize;

        // Nouveau chemin WebP
        const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

        // Convertir en WebP avec compression intelligente
        await sharp(imagePath)
          .webp({
            quality: 85,
            effort: 6 // 0-6, plus c'est élevé, meilleure la compression
          })
          .toFile(outputPath);

        // Taille optimisée
        const optimizedStats = await fs.stat(outputPath);
        const optimizedSize = optimizedStats.size;
        totalOptimizedSize += optimizedSize;

        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        const originalMB = (originalSize / 1024 / 1024).toFixed(2);
        const optimizedMB = (optimizedSize / 1024 / 1024).toFixed(2);

        console.log(`✅ ${path.basename(imagePath)}`);
        console.log(`   ${originalMB} MB → ${optimizedMB} MB (-${reduction}%)`);
        console.log(`   📝 Sauvegardé: ${outputPath}\n`);

        successCount++;

      } catch (error) {
        console.error(`❌ Erreur pour ${imagePath}:`, error.message);
        errorCount++;
      }
    }

    // Résumé
    const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'OPTIMISATION');
    console.log('='.repeat(60));
    console.log(`✅ Images converties: ${successCount}/${images.length}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📦 Taille originale: ${totalOriginalMB} MB`);
    console.log(`📦 Taille optimisée: ${totalOptimizedMB} MB`);
    console.log(`💾 Économie totale: ${totalReduction}%`);
    console.log('='.repeat(60));

    console.log('\n⚠️  IMPORTANT: N\'oubliez pas de:');
    console.log('1. Mettre à jour vos imports pour utiliser les fichiers .webp');
    console.log('2. Garder les fichiers originaux comme fallback si nécessaire');
    console.log('3. Tester l\'affichage des images dans l\'application\n');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    process.exit(1);
  }
}

optimizeImages();
