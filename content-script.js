/* eslint-disable */
// @ts-nocheck

function analyzePageSEO() {
  const pageData = {
    general: {
      metaTitle: document.title,
      metaTitleLength: document.title.length,
      metaTitleStatus: evaluateTitleLength(document.title.length),
      metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      metaDescriptionLength: document.querySelector('meta[name="description"]')?.getAttribute('content')?.length || 0,
      metaDescriptionStatus: evaluateDescriptionLength(document.querySelector('meta[name="description"]')?.getAttribute('content')?.length || 0),
      canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || '',
      hasCanonical: !!document.querySelector('link[rel="canonical"]'),
      indexable: !document.querySelector('meta[name="robots"][content*="noindex"]'),
      robotsTxtBlocked: false, // Requiere verificación adicional
      metaTags: Array.from(document.querySelectorAll('meta')).map(meta => 
        `${meta.getAttribute('name') || meta.getAttribute('property')}: ${meta.getAttribute('content')}`
      ),
      missingImportantMetaTags: findMissingMetaTags(),
      urlStructure: analyzeUrlStructure(window.location.href),
    },
    headings: {
      structure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
        tag: heading.tagName,
        text: heading.textContent.trim(),
        length: heading.textContent.trim().length,
        selector: generateUniqueSelector(heading)
      })),
      hasH1: document.querySelectorAll('h1').length === 1,
      h1Count: document.querySelectorAll('h1').length,
      hierarchyIssues: findHeadingHierarchyIssues(),
      wordRelevance: extractWordRelevance()
    },
    links: {
      internal: extractLinks(true),
      external: extractLinks(false),
      totalCount: document.querySelectorAll('a').length,
      internalCount: Array.from(document.querySelectorAll('a')).filter(link => isInternalLink(link.href)).length,
      externalCount: Array.from(document.querySelectorAll('a')).filter(link => !isInternalLink(link.href)).length,
      followCount: Array.from(document.querySelectorAll('a')).filter(link => !link.getAttribute('rel')?.includes('nofollow')).length,
      nofollowCount: Array.from(document.querySelectorAll('a')).filter(link => link.getAttribute('rel')?.includes('nofollow')).length
    },
    hreflang: extractHreflang(),
    images: extractImageAnalysis(),
    schema: extractSchemaMarkup(),
    contentAnalysis: analyzeContent(),
    performance: analyzePerformance(),
    keywordAnalysis: analyzeKeywords(),
    seoScore: calculateSEOScore()
  };

  return pageData;
}

function evaluateTitleLength(length) {
  if (length < 10) return { status: 'error', message: 'Título demasiado corto (menos de 10 caracteres)' };
  if (length > 60) return { status: 'warning', message: 'Título demasiado largo (más de 60 caracteres)' };
  return { status: 'success', message: 'Longitud del título óptima (entre 10 y 60 caracteres)' };
}

function evaluateDescriptionLength(length) {
  if (length < 50) return { status: 'error', message: 'Descripción demasiado corta (menos de 50 caracteres)' };
  if (length > 160) return { status: 'warning', message: 'Descripción demasiado larga (más de 160 caracteres)' };
  return { status: 'success', message: 'Longitud de descripción óptima (entre 50 y 160 caracteres)' };
}

function findMissingMetaTags() {
  const importantMetaTags = ['viewport', 'robots', 'description'];
  return importantMetaTags.filter(tagName => !document.querySelector(`meta[name="${tagName}"]`));
}

function analyzeUrlStructure(url) {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  // Verificar características de URL amigable para SEO
  const hasKeywords = path.length > 1; // No es solo la página raíz
  const hasManyParameters = urlObj.searchParams.toString().length > 50;
  const hasUppercase = /[A-Z]/.test(path);
  const hasUnderscores = path.includes('_');
  const hasNumbers = /\d/.test(path);
  const hasTooManySlashes = (path.match(/\//g) || []).length > 4;
  const hasSpecialChars = /[^\w\-\/]/.test(path);
  
  const issues = [];
  if (hasManyParameters) issues.push('Demasiados parámetros en la URL');
  if (hasUppercase) issues.push('La URL contiene letras mayúsculas');
  if (hasUnderscores) issues.push('La URL contiene guiones bajos en lugar de guiones');
  if (hasTooManySlashes) issues.push('La URL tiene demasiados niveles de profundidad');
  if (hasSpecialChars) issues.push('La URL contiene caracteres especiales');
  
  return {
    path,
    isRoot: path === '/' || path === '',
    hasParameters: urlObj.search.length > 0,
    isSEOFriendly: issues.length === 0 && hasKeywords,
    issues
  };
}

function findHeadingHierarchyIssues() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const issues = [];
  
  if (document.querySelectorAll('h1').length === 0) {
    issues.push('Falta el encabezado H1 en la página');
  } else if (document.querySelectorAll('h1').length > 1) {
    issues.push('Múltiples encabezados H1 detectados');
  }
  
  let currentLevel = 1;
  for (let i = 0; i < headings.length; i++) {
    const headingLevel = parseInt(headings[i].tagName[1]);
    
    // Verificar saltos en la jerarquía (ej. H1 a H3 sin H2)
    if (headingLevel > currentLevel + 1) {
      issues.push(`Salto en la jerarquía de encabezados: ${headings[i-1]?.tagName || 'Inicio'} a ${headings[i].tagName}`);
    }
    
    currentLevel = headingLevel;
  }
  
  return issues;
}

function extractWordRelevance() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const relevance = {
    oneWord: [],
    twoWords: [],
    threeWords: [],
    fourWords: []
  };

  // Extraer palabras y frases de los encabezados
  headings.forEach(heading => {
    const words = heading.textContent.trim().split(/\s+/);
    
    if (words.length === 1 && words[0]) relevance.oneWord.push(words[0]);
    if (words.length === 2) relevance.twoWords.push(words.join(' '));
    if (words.length === 3) relevance.threeWords.push(words.join(' '));
    if (words.length === 4) relevance.fourWords.push(words.join(' '));
  });

  // Contar frecuencia de palabras/frases
  const frequencyCounter = (arr) => {
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([text, count]) => ({ text, count }));
  };

  return {
    oneWord: frequencyCounter(relevance.oneWord),
    twoWords: frequencyCounter(relevance.twoWords),
    threeWords: frequencyCounter(relevance.threeWords),
    fourWords: frequencyCounter(relevance.fourWords)
  };
}

function isInternalLink(href) {
  try {
    const currentDomain = window.location.hostname;
    const url = new URL(href);
    return url.hostname === currentDomain;
  } catch (e) {
    return false; // En caso de URL malformada
  }
}

function extractLinks(internal = true) {
  return Array.from(document.querySelectorAll('a')).filter(link => {
    if (!link.href) return false;
    return internal ? isInternalLink(link.href) : !isInternalLink(link.href);
  }).map(link => ({
    url: link.href,
    text: link.textContent.trim(),
    nofollow: link.getAttribute('rel')?.includes('nofollow') || false,
    redirect: false, // Para verificar redirecciones se necesitaría una solicitud adicional
    status: 'unknown', // Igual que arriba, para verificar enlaces rotos
    selector: generateUniqueSelector(link)
  }));
}

function extractHreflang() {
  const hreflangTags = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(link => {
    return {
      code: link.getAttribute('hreflang'),
      href: link.href,
      selector: generateUniqueSelector(link)
    };
  });

  const issues = [];
  const languageCodes = new Set();

  // Verificar duplicados y otros problemas
  hreflangTags.forEach(tag => {
    const langCode = tag.code;
    
    if (langCode) {
      if (languageCodes.has(langCode)) {
        issues.push(`Código de idioma duplicado: ${langCode}`);
      }
      languageCodes.add(langCode);

      // Validar formato de código de idioma
      if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(langCode) && langCode !== 'x-default') {
        issues.push(`Formato de código de idioma inválido: ${langCode}`);
      }
    }
  });

  // Verificar x-default
  const xDefaultTags = hreflangTags.filter(tag => tag.code === 'x-default');
  if (xDefaultTags.length === 0) {
    issues.push('Falta etiqueta x-default');
  }
  if (xDefaultTags.length > 1) {
    issues.push('Múltiples etiquetas x-default');
  }

  // Verificar etiqueta self-referencing
  const currentLang = document.documentElement.lang.split('-')[0];
  if (currentLang && !hreflangTags.some(tag => tag.code.startsWith(currentLang))) {
    issues.push(`Falta etiqueta hreflang auto-referencial para el idioma actual (${currentLang})`);
  }

  return {
    tags: hreflangTags,
    issues: issues,
    hasTags: hreflangTags.length > 0,
    hasIssues: issues.length > 0
  };
}

function extractImageAnalysis() {
  const images = Array.from(document.querySelectorAll('img'));
  
  const imagesWithAlt = images
    .filter(img => img.alt && img.alt.trim() !== '')
    .map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      loadTime: img.complete ? 'loaded' : 'loading',
      fileSize: 'unknown', // Requeriría una solicitud para obtener el tamaño del archivo
      selector: generateUniqueSelector(img)
    }));

  const imagesWithoutAlt = images
    .filter(img => !img.alt || img.alt.trim() === '')
    .map(img => ({
      src: img.src,
      width: img.width,
      height: img.height,
      loadTime: img.complete ? 'loaded' : 'loading',
      fileSize: 'unknown',
      selector: generateUniqueSelector(img)
    }));

  return {
    imagesWithAlt,
    imagesWithoutAlt,
    totalCount: images.length,
    withAltCount: imagesWithAlt.length,
    withoutAltCount: imagesWithoutAlt.length,
    altRatio: images.length ? (imagesWithAlt.length / images.length * 100).toFixed(1) : 0,
    largeImages: images.filter(img => img.width > 1000 || img.height > 1000).length,
    smallImages: images.filter(img => img.width < 100 || img.height < 100).length,
    lazyLoaded: images.filter(img => img.loading === 'lazy').length
  };
}

function extractSchemaMarkup() {
  const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  
  const presentSchemas = [];
  const schemaDetails = {};
  const errors = [];
  
  schemaScripts.forEach((script, index) => {
    try {
      const schemaData = JSON.parse(script.textContent);
      
      if (schemaData['@type']) {
        const schemaType = schemaData['@type'];
        presentSchemas.push(schemaType);
        schemaDetails[schemaType] = schemaData;
        
        // Verificación básica de esquemas comunes
        switch(schemaType) {
          case 'Organization':
            if (!schemaData.name) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad requerida 'name'`);
            if (!schemaData.url) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad recomendada 'url'`);
            break;
          case 'Person':
            if (!schemaData.name) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad requerida 'name'`);
            break;
          case 'Product':
            if (!schemaData.name) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad requerida 'name'`);
            if (!schemaData.offers) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad recomendada 'offers'`);
            break;
          case 'Article':
          case 'BlogPosting':
            if (!schemaData.headline) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad requerida 'headline'`);
            if (!schemaData.author) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad recomendada 'author'`);
            if (!schemaData.datePublished) errors.push(`Schema ${schemaType} #${index+1}: Falta propiedad recomendada 'datePublished'`);
            break;
        }
      } else {
        errors.push(`Schema #${index+1}: Falta propiedad '@type'`);
      }
    } catch (error) {
      errors.push(`Error al analizar Schema #${index+1}: ${error.message}`);
    }
  });

  return {
    presentSchemas,
    schemaDetails,
    count: schemaScripts.length,
    hasSchema: schemaScripts.length > 0,
    errors,
    hasErrors: errors.length > 0
  };
}

function analyzeContent() {
  // Extraer todo el texto visible de la página
  const bodyText = document.body.innerText;
  const wordCount = bodyText.split(/\s+/).length;
  
  // Calculando relación texto/código
  const htmlSize = document.documentElement.outerHTML.length;
  const textRatio = (bodyText.length / htmlSize * 100).toFixed(1);
  
  return {
    wordCount,
    characterCount: bodyText.length,
    averageSentenceLength: calculateAverageSentenceLength(bodyText),
    textHtmlRatio: textRatio,
    paragraphCount: document.querySelectorAll('p').length,
    isLongForm: wordCount > 700,
    readingTime: Math.ceil(wordCount / 200), // Tiempo de lectura estimado en minutos (200 palabras/min)
    visualContent: {
      images: document.querySelectorAll('img').length,
      videos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
      tables: document.querySelectorAll('table').length,
      lists: document.querySelectorAll('ul, ol').length
    }
  };
}

function calculateAverageSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((count, sentence) => {
    return count + sentence.split(/\s+/).filter(word => word.length > 0).length;
  }, 0);
  
  return Math.round(totalWords / sentences.length);
}

function analyzePerformance() {
  // Solo si está disponible la API de navegación
  if (!window.performance || !window.performance.timing) {
    return { available: false };
  }
  
  const timing = window.performance.timing;
  
  return {
    available: true,
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    timeToFirstByte: timing.responseStart - timing.navigationStart,
    resourceCount: window.performance.getEntriesByType('resource').length,
    largeResources: Array.from(window.performance.getEntriesByType('resource'))
      .filter(r => r.duration > 300)
      .map(r => ({
        url: r.name.split('/').pop(),
        type: r.initiatorType,
        duration: Math.round(r.duration)
      }))
      .slice(0, 5)
  };
}

// Escucha para resaltar elementos cuando se solicita
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "highlightElement" && request.selector) {
    highlightElement(request.selector);
    sendResponse({success: true});
    return true;
  }
});

function highlightElement(selector) {
  // Eliminar resaltados anteriores
  const oldHighlight = document.getElementById('seo-highlight-overlay');
  if (oldHighlight) oldHighlight.remove();
  
  // Encontrar el elemento
  const element = document.querySelector(selector);
  if (!element) return;
  
  // Crear un overlay para resaltar
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement('div');
  highlight.id = 'seo-highlight-overlay';
  highlight.style.cssText = `
    position: fixed;
    z-index: 10000;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background-color: rgba(255, 107, 107, 0.3);
    outline: 3px solid #ff6b6b;
    pointer-events: none;
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(highlight);
  element.scrollIntoView({behavior: 'smooth', block: 'center'});
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    highlight.remove();
  }, 3000);
}

// Función para generar un selector único para identificar elementos
function generateUniqueSelector(element) {
  if (!element) return null;
  
  if (element.id) {
    return '#' + element.id;
  }
  
  // Crear un selector basado en atributos y posición
  const tag = element.tagName.toLowerCase();
  if (tag === 'html' || tag === 'body') return tag;
  
  // Para imágenes, usar src o alt
  if (tag === 'img') {
    if (element.alt) return `img[alt="${element.alt}"]`;
    if (element.src) {
      const srcParts = element.src.split('/');
      return `img[src*="${srcParts[srcParts.length-1]}"]`;
    }
  }
  
  // Para enlaces, usar texto
  if (tag === 'a' && element.textContent.trim()) {
    return `a:contains("${element.textContent.trim().substring(0, 15)}")`;
  }
  
  // Usar nth-child como último recurso
  const parent = element.parentNode;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    
    const parentSelector = generateUniqueSelector(parent);
    return `${parentSelector} > ${tag}:nth-child(${index})`;
  }
  
  return tag;
}