import { getMetadata } from '../caas-marquee-metadata/caas-marquee-metadata.js';
import { createTag } from '../../utils/utils.js';

// 3 seconds max wait time for marquee to load
const WAIT_TIME_MAX = 3000;

const typeSize = {
  small: ['xl', 'm', 'm'],
  medium: ['xl', 'm', 'm'],
  large: ['xxl', 'xl', 'l'],
  xlarge: ['xxl', 'xl', 'l'],
};

async function getAllMarquees(promoId) {
  const [language, country] = document.documentElement.lang.split('-');
  const endPoint = 'https://14257-chimera-stage.adobeioruntime.net/api/v1/web/chimera-0.0.1/sm-collection';
  const payload = `originSelection=milo&language=${language}&country=${country}&promoId=${promoId || 'homepage'}`;
  return fetch(`${endPoint}?${payload}`).then((res) => res.json());
}

/**
 * function getMarqueeId() : Eventually from Spectra API
 * @returns {string} id - currently marquee index (eventually will be marquee ID from SpectarAI)
 */
function getMarqueeId() {
  // URL param to overrides SpectraAI marquee ID
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('marqueeId')) return urlParams.get('marqueeId');

  // Until the Spectra API is ready, we are using this as a fallback
  return '2d218e9a-97af-583d-b1ad-9b64786d4e92';
}

/**
 * function normalizeData()
 * @param {*} data - marquee JSON data
 * @returns {Object} metadata - marquee data
 */
function normalizeData(data) {
  console.log('normalizeData', data);
  const images = {
    tablet: data.arbitrary?.find((item) => item.key === 'imageTablet')?.value,
    desktop: data.arbitrary?.find((item) => item.key === 'imageDesktop')?.value,
  };

  const marqueeMetadata = {
    id: data.id,
    title: data.contentArea?.title,
    description: data.contentArea?.description,
    detail: data.contentArea?.detailText,
    image: data.styles?.backgroundImage,
    imagetablet: images.tablet,
    imagedesktop: images.desktop,
    cta1url: data.footer[0].right[0]?.href,
    cta1text: data.footer[0]?.right[0]?.text,
    cta1style: data.footer[0]?.right[0]?.style,
    cta2url: data.footer[0]?.center[0]?.href,
    cta2text: data.footer[0]?.center[0]?.text,
    cta2style: data.footer[0]?.center[0]?.style,
  };

  const arbitrary = {};
  data.arbitrary?.forEach((item) => { arbitrary[item.key] = item.value; });
  marqueeMetadata.variant = arbitrary.variant || 'dark, static-links';

  return marqueeMetadata;
}

/**
 * function renderMarquee()
 * @param {HTMLElement} marquee - marquee container
 * @param {Object} data - marquee data either from chimera or fallback
 * @param {string} id - marquee id
 * @returns {void}
 */
export function renderMarquee(marquee, data, id) {
  console.log('renderMarquee', data, id);
  // if the fallback marquee is already rendered,
  // we don't want to render the chimera marquee
  if (marquee.classList.contains('fallback')) return;
  const metadata = data.cards
    ? normalizeData(data.cards.find((item) => item.id === id))
    : data;

  // remove loader
  marquee.innerHTML = '';

  // selaect class list based on marquee variant
  const classList = metadata.variant.split(',').map((c) => c.trim());
  // configure block font sizes
  /* eslint-disable no-nested-ternary */
  const size = classList.includes('small') ? 'small'
    : classList.includes('medium') ? 'medium'
      : classList.includes('large') ? 'large'
        : 'xlarge';
  /* eslint-enable no-nested-ternary */

  // background content
  const bgContent = `<div class="mobile-only">
    <picture>
      <source type="image/webp" srcset="${metadata.image}?width=2000&amp;format=webply&amp;optimize=medium" media="(min-width: 600px)">
      <source type="image/webp" srcset="${metadata.image}?width=750&amp;format=webply&amp;optimize=medium">
      <source type="image/jpeg" srcset="${metadata.image}?width=2000&amp;format=jpeg&amp;optimize=medium" media="(min-width: 600px)">
      <img loading="eager" alt="" src="${metadata.image}?width=750&amp;format=jpeg&amp;optimize=medium" width="1440" height="992" fetchpriority="high">
    </picture>
  </div>
  <div class="tablet-only">
    <picture>
      <source type="image/webp" srcset="${metadata.imagetablet}?width=2000&amp;format=webply&amp;optimize=medium" media="(min-width: 600px)">
      <source type="image/webp" srcset="${metadata.imagetablet}?width=750&amp;format=webply&amp;optimize=medium">
      <source type="image/jpeg" srcset="${metadata.imagetablet}?width=2000&amp;format=jpeg&amp;optimize=medium" media="(min-width: 600px)">
      <img loading="lazy" alt="" src="${metadata.imagetablet}?width=750&amp;format=jpeg&amp;optimize=medium" width="2048" height="520">
  </picture>
  </div>
  <div class="desktop-only">
    <picture>
      <source type="image/webp" srcset="${metadata.imagedesktop}?width=2000&amp;format=webply&amp;optimize=medium" media="(min-width: 600px)">
      <source type="image/webp" srcset="${metadata.imagedesktop}?width=750&amp;format=webply&amp;optimize=medium">
      <source type="image/png" srcset="${metadata.imagedesktop}?width=2000&amp;format=png&amp;optimize=medium" media="(min-width: 600px)">
      <img loading="lazy" alt="" src="${metadata.imagedesktop}?width=750&amp;format=png&amp;optimize=medium" width="2400" height="813" style="object-position: 32% center;">
    </picture>
  </div>`;

  const background = createTag('div', { class: 'background' });
  background.innerHTML = bgContent;

  // foreground content
  const createLink = (url, text, style) => {
    if (!url) return '';
    let target = '';
    if (url.includes('#')) {
      const [path, hash] = url.split('#');
      if (hash === '_blank') {
        target = ' target="_blank"';
      } else if (style === 'blue' || style === 'outline') {
        return `<a 
          class="con-button ${style} button-${typeSize[size][1]} button-justified-mobile modal"
          data-modal-path="${path.replace(/^.*.com/, '')}"
          data-modal-hash="#${hash}"
          href="#${hash}">${text}
        </a>`;
      } else {
        return `<a href="${url}"${target}>${text}</a>`;
      }
    // button link
    } else if (style === 'blue' || style === 'outline') {
      return `<a 
          class="con-button ${style} button-${typeSize[size][1]} button-justified-mobile"
          href="${url}"${target}>${text}
        </a>`;
    }
    // text link
    return `<a href="${url}"${target}>${text}</a>`;
  };

  const detail = metadata.detail ? `<p class="detail-l">${metadata.detail}</p>` : '';
  const cta = metadata.cta1url ? createLink(metadata.cta1url, metadata.cta1text, metadata.cta1style) : '';
  const cta2 = metadata.cta2url ? createLink(metadata.cta2url, metadata.cta2text, metadata.cta2style) : '';

  const fgContent = `<div class="text">
    ${detail}
    <h1 class="heading-${typeSize[size][0]}">${metadata.title}</h1>
    <p class="body-${typeSize[size][1]}">${metadata.description}</p>
    <p class="action-area">
      ${cta} 
      ${cta2}
      </p>  
  </div>`;

  const foreground = createTag('div', { class: 'foreground container' });
  foreground.innerHTML = fgContent;

  // apply marquee variant to viewer
  if (metadata.variant) {
    const classes = metadata.variant.toLowerCase().split(' ').map((c) => c.trim());
    classes.forEach((c) => marquee.classList.add(c));
  }

  marquee.append(background, foreground);
  marquee.classList.remove('loading');
}

/**
 * function init()
 * @param {*} el - element with metadata for marquee
 */
export default async function init(el) {
  const metadata = getMetadata(el);
  const marquee = createTag('div', { class: `loading marquee split ${metadata.variant.replaceAll(',', ' ')}` });
  marquee.innerHTML = '<div class="lds-ring LOADING"><div></div><div></div><div></div><div></div></div>';
  el.parentNode.prepend(marquee);

  setTimeout(() => {
    // In case of failure
    if (marquee.children.length !== 2) {
      // If there is a fallback marquee provided, we use it.
      // Otherwise, we use this strings as the last resort fallback
      metadata.title = metadata.title || 'Welcome to Adobe';
      metadata.description = metadata.description || 'Do it all with Adobe Creative Cloud.';
      renderMarquee(marquee, metadata, null);
      marquee.classList.add('fallback');
    }
  }, WAIT_TIME_MAX);

  const selectedId = await getMarqueeId();
  const allMarqueesJson = await getAllMarquees(metadata.promoId || 'homepage');
  await renderMarquee(marquee, allMarqueesJson, selectedId);
}
