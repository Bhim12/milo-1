import { createTag } from '../../utils/utils.js';

const CTA_STYLES = {
  STRONG: 'blue',
  EM: 'outline',
};
function getCtaStyle(tagName) {
  return CTA_STYLES[tagName] || '';
}

function parseCtas(el) {
  const a = el.querySelectorAll('a');
  const ctaLinks = Array.from(a);
  const ctas = {};

  ctaLinks.forEach((ctaLink, index) => {
    if (ctaLink.hasAttribute('data-modal-hash')) {
      ctaLink.href = `${ctaLink.dataset.modalPath}${ctaLink.dataset.modalHash}`;
    }
    if (ctaLink.hasAttribute('target')) {
      ctaLink.href = `${ctaLink.href}#_blank`;
    } 
    index += 1;
    ctas[`cta${index}url`] = ctaLink.href || '';
    ctas[`cta${index}text`] = ctaLink.textContent?.trim() || '';
    ctas[`cta${index}style`] = getCtaStyle(ctaLink.parentNode?.tagName);
  });

  return ctas;
}
export const getMetadata = (el) => {
  let metadata = {};
  for (const row of el.children) {
    const key = row.children[0].textContent.trim().toLowerCase() || '';
    let val = row.children[1].innerHTML || '';
    if (key.startsWith('image')) {
      const img = row.children[1].querySelector('img');
      val = img ? new URL(img.src).pathname : '';
    }
    if (key.startsWith('cta')) {
      metadata = { ...metadata, ...parseCtas(row.children[1]) };
    }
    if (key.startsWith('variant')) {
      val = val.replaceAll(',', '');
    }
    metadata[key] = val;
  }
  return metadata;
};
export default function init(el) {
  const metadata = getMetadata(el);
  const additionalFields = {
    arbitrary: `
      promoId: ${metadata.promoid},
      context: ${metadata.context},
      imageTablet: ${metadata.imagetablet},
      imageDesktop: ${metadata.imagedesktop},
      variant: ${metadata.variant}`.trim(),
    tags: 'caas:content-type/promotion',
    cta1url: `${metadata.cta1url}`,
    cta1text: `${metadata.cta1text}`,
    cta1style: `${metadata.cta1style}`,
    cta1target: `${metadata.cta1target}`,
    cta2url: `${metadata.cta2url}`,
    cta2text: `${metadata.cta2text}`,
    cta2style: `${metadata.cta2style}`,
    cta2target: `${metadata.cta2target}`,
  };

  for (const [key, val] of Object.entries(additionalFields)) {
    const container = createTag('div');
    container.innerHTML = `
    <div data-valign="middle">${key}</div>
    <div data-valign="middle">${val}</div>
  `;
    el.appendChild(container);
  }
}