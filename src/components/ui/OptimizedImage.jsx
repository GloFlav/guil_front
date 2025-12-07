import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant Image optimisé pour PageSpeed Insights
 *
 * Features:
 * - Lazy loading automatique
 * - Support WebP avec fallback
 * - Placeholder pendant le chargement
 * - Responsive avec srcset
 * - Prévention du CLS (Cumulative Layout Shift)
 *
 * @example
 * <OptimizedImage
 *   src="/images/hero.png"
 *   webp="/images/hero.webp"
 *   alt="Hero image"
 *   width={1920}
 *   height={1080}
 *   priority={false}
 * />
 */
const OptimizedImage = ({
  src,
  webp,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  objectFit = 'cover',
  sizes,
  srcSet,
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Calculer l'aspect ratio pour éviter le CLS
  const aspectRatio = width && height ? (height / width) * 100 : 0;

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Style du container pour prévenir le CLS
  const containerStyle = {
    position: 'relative',
    width: '100%',
    paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
    overflow: 'hidden',
  };

  const imageStyle = {
    position: aspectRatio ? 'absolute' : 'relative',
    top: 0,
    left: 0,
    width: '100%',
    height: aspectRatio ? '100%' : 'auto',
    objectFit: objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    display: isLoaded ? 'none' : 'block',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Placeholder pendant le chargement */}
      {placeholder === 'blur' && !isLoaded && (
        <div style={placeholderStyle} aria-hidden="true">
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      )}

      {/* Image optimisée avec WebP */}
      {!hasError && (
        <picture>
          {/* Source WebP si fournie */}
          {webp && (
            <source
              srcSet={webp}
              type="image/webp"
              sizes={sizes}
            />
          )}

          {/* Fallback image */}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}

      {/* Fallback en cas d'erreur */}
      {hasError && (
        <div
          style={{
            ...imageStyle,
            opacity: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666',
          }}
          role="img"
          aria-label={alt}
        >
          Image non disponible
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  webp: PropTypes.string,
  alt: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  priority: PropTypes.bool,
  placeholder: PropTypes.oneOf(['blur', 'none']),
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  sizes: PropTypes.string,
  srcSet: PropTypes.string,
  onLoad: PropTypes.func,
};

export default OptimizedImage;
