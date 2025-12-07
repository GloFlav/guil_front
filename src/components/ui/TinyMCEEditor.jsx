import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Composant TinyMCE Editor réutilisable
 * @param {Object} props
 * @param {string} props.value - Contenu HTML actuel
 * @param {Function} props.onChange - Callback appelé quand le contenu change
 * @param {string} props.placeholder - Texte placeholder
 * @param {boolean} props.hasError - Si true, affiche une bordure rouge
 * @param {number} props.height - Hauteur de l'éditeur en pixels (défaut: 400)
 */
export function TinyMCEEditor({
  value,
  onChange,
  placeholder = "Écrivez votre contenu ici...",
  hasError = false,
  height = 400
}) {
  const editorRef = useRef(null);
  const editorInitialized = useRef(false);
  const initialContentSet = useRef(false);
  const isUpdatingContent = useRef(false);
  const [editorLoaded, setEditorLoaded] = React.useState(false);
  const [tinymceLoaded, setTinymceLoaded] = React.useState(false);

  // Helper function to safely check if editor is valid
  const isEditorValid = useCallback((editor) => {
    if (!editor) return false;
    if (typeof editor.isRemoved === 'function') {
      return !editor.isRemoved();
    }
    if (editor.destroyed === true) return false;
    if (editor.removed === true) return false;
    try {
      return typeof editor.getContent === 'function' &&
             typeof editor.setContent === 'function' &&
             editor.initialized === true;
    } catch (e) {
      return false;
    }
  }, []);

  // Chargement TinyMCE
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initTinyMCE = async () => {
      try {
        if (!mounted) return;
        if (!window.tinymce) {
          if (document.querySelector('script[src*="tinymce"]')) {
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.9.0/tinymce.min.js';
          script.onload = () => {
            if (mounted) {
              setTinymceLoaded(true);
            }
          };
          script.onerror = () => {
            retryCount++;
            if (retryCount < maxRetries && mounted) {
              setTimeout(() => initTinyMCE(), 1000 * retryCount);
            }
          };
          document.head.appendChild(script);
        } else {
          if (mounted) {
            setTinymceLoaded(true);
          }
        }
      } catch (err) {
        }
    };

    initTinyMCE();

    return () => {
      mounted = false;
    };
  }, []);

  // Setup TinyMCE
  useEffect(() => {
    if (!tinymceLoaded || editorInitialized.current) return;

    let setupTimer;
    const setupTinyMCE = () => {
      try {
        if (!window.tinymce || !window.tinymce.init) {
          return;
        }

        const existingEditor = window.tinymce.get('tinymce-editor');
        if (existingEditor) {
          editorRef.current = existingEditor;
          setEditorLoaded(true);
          return;
        }

        const editorElement = document.getElementById('tinymce-editor');
        if (!editorElement) {
          return;
        }

        editorInitialized.current = true;

        window.tinymce.init({
          selector: '#tinymce-editor',
          height: height,
          menubar: 'edit view insert format tools table help',
          plugins: [
            'lists', 'link', 'code', 'table', 'wordcount', 'autoresize',
            'searchreplace', 'visualblocks', 'fullscreen', 'help',
            'paste', 'textcolor', 'colorpicker', 'advlist', 'textpattern'
          ],
          toolbar: [
            'undo redo | formatselect fontsize',
            'bold italic underline strikethrough | forecolor backcolor',
            'alignleft aligncenter alignright alignjustify',
            'outdent indent | bullist numlist',
            'table | link | removeformat',
            'searchreplace | code visualblocks fullscreen | help'
          ].join(' | '),

          block_formats: 'Paragraphe=p; Titre 1=h1; Titre 2=h2; Titre 3=h3; Titre 4=h4; Titre 5=h5; Titre 6=h6',
          fontsize_formats: '8px 10px 12px 14px 16px 18px 20px 22px 24px 26px 28px 32px 36px 48px 72px',

          color_map: [
            '405969', 'Hello Blue',
            '5DA781', 'Hello Soin',
            '9095A1', 'Hello Gray',
            '000000', 'Noir',
            '333333', 'Gris foncé',
            '666666', 'Gris moyen',
            '999999', 'Gris clair',
            'CCCCCC', 'Gris très clair',
            'FFFFFF', 'Blanc',
            'FF0000', 'Rouge',
            '00FF00', 'Vert',
            '0000FF', 'Bleu',
            'FFFF00', 'Jaune',
            'FF00FF', 'Magenta',
            '00FFFF', 'Cyan',
            'F8F9FA', 'Gris très clair',
            'E9ECEF', 'Gris clair bg',
            'DEE2E6', 'Bordure grise',
            'CED4DA', 'Gris input',
            'D4EDDA', 'Vert clair',
            'D1ECF1', 'Bleu clair',
            'FFF3CD', 'Jaune clair',
            'F8D7DA', 'Rouge clair'
          ],

          branding: false,
          promotion: false,
          readonly: false,
          resize: 'both',
          statusbar: true,
          placeholder: placeholder,

          setup: (editor) => {
            editorRef.current = editor;

            // Raccourcis clavier
            editor.addShortcut('Ctrl+1', 'Heading 1', () => {
              editor.execCommand('mceToggleFormat', false, 'h1');
            });
            editor.addShortcut('Ctrl+2', 'Heading 2', () => {
              editor.execCommand('mceToggleFormat', false, 'h2');
            });
            editor.addShortcut('Ctrl+3', 'Heading 3', () => {
              editor.execCommand('mceToggleFormat', false, 'h3');
            });
            editor.addShortcut('Ctrl+0', 'Paragraph', () => {
              editor.execCommand('mceToggleFormat', false, 'p');
            });

            editor.on('init', () => {
              editor.initialized = true;
              const body = editor.getBody();
              if (body) {
                body.setAttribute('contenteditable', 'true');
                body.style.cursor = 'text';
              }
              editor.getElement().removeAttribute('readonly');
              setEditorLoaded(true);

              if (value && !initialContentSet.current) {
                setTimeout(() => {
                  if (isEditorValid(editor)) {
                    editor.setContent(value);
                    initialContentSet.current = true;
                  }
                }, 100);
              }
            });

            editor.on('change keyup paste input nodechange', () => {
              if (isUpdatingContent.current) return;
              try {
                if (isEditorValid(editor)) {
                  const editorContent = editor.getContent();
                  if (onChange) {
                    onChange(editorContent);
                  }
                }
              } catch (err) {
                }
            });

            editor.on('error', (e) => {
              });
          }
        });
      } catch (err) {
        editorInitialized.current = false;
      }
    };

    setupTimer = setTimeout(() => {
      const editorElement = document.getElementById('tinymce-editor');
      if (editorElement) {
        setupTinyMCE();
      } else {
        setTimeout(setupTinyMCE, 500);
      }
    }, 500);

    return () => {
      if (setupTimer) {
        clearTimeout(setupTimer);
      }
      try {
        const editor = window.tinymce?.get('tinymce-editor');
        if (editor) {
          if (typeof editor.remove === 'function') {
            editor.remove();
          } else if (typeof editor.destroy === 'function') {
            editor.destroy();
          }
        }
      } catch (err) {
        }
      editorInitialized.current = false;
      initialContentSet.current = false;
    };
  }, [tinymceLoaded, placeholder, onChange, isEditorValid, height]);

  // Mettre à jour le contenu de l'éditeur quand value change de l'extérieur
  useEffect(() => {
    if (!editorRef.current || !isEditorValid(editorRef.current)) return;

    const editor = editorRef.current;
    const currentContent = editor.getContent();

    // Ne mettre à jour que si le contenu a vraiment changé
    if (currentContent !== value && !isUpdatingContent.current) {
      isUpdatingContent.current = true;
      editor.setContent(value || '');
      setTimeout(() => {
        isUpdatingContent.current = false;
      }, 100);
    }
  }, [value, isEditorValid]);

  return (
    <div>
      {tinymceLoaded ? (
        <div style={{
          border: hasError ? '1px solid #ef4444' : '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <textarea
            id="tinymce-editor"
            defaultValue={value}
            style={{
              width: '100%',
              minHeight: `${height}px`,
              border: 'none',
              outline: 'none'
            }}
          />
        </div>
      ) : (
        <div>
          <div style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '12px',
            color: '#666'
          }}>
            ⏳ Chargement de l'éditeur WYSIWYG...
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            style={{
              width: '100%',
              minHeight: `${height}px`,
              padding: '10px',
              border: hasError ? '1px solid #ef4444' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif'
            }}
            placeholder={placeholder}
          />
        </div>
      )}

      {editorLoaded && (
        <div style={{ color: '#28a745', fontSize: '12px', marginTop: '5px' }}>
          ✅ Éditeur chargé
        </div>
      )}

      {tinymceLoaded && !editorLoaded && (
        <div style={{
          color: '#ff9800',
          fontSize: '12px',
          marginTop: '5px',
          padding: '5px',
          backgroundColor: '#fff3cd',
          borderRadius: '3px'
        }}>
          ⚠️ Éditeur en cours d'initialisation...
        </div>
      )}
    </div>
  );
}
