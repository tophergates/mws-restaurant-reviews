import config from '../config';
import DBHelper from './DBHelper';

/**
 * Returns the value of the specified query string parameter 
 * of the current URI.
 */
const getUrlParameter = param => {
  if (!param) return;

  // If URLSearchParams is supported, use that
  if (URLSearchParams) {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get(param);
  }

  // Otherwise, parse the param using regular expressions
  param = param.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp(`[\\?&]${param}=([^&#]*)`);
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * Appends the Google Maps API script at the end of the document.body 
 * or the specified node, if provided.
 * @param {HTMLElement} node 
 */
const loadGoogleMaps = (node = document.body) => {
  const script = document.createElement('script');

  script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${config.MAPS_KEY}&callback=initMap`);
  script.setAttribute('async', '');
  script.setAttribute('defer', '');
  node.appendChild(script);
};

/**
 * Makes a responsive image and returns it
 */
const makeImage = ({id, src, srcset, sizes, alt, className}, onload) => {
  const image = document.createElement('img');
  srcset = srcset || `${DBHelper.restaurantImgUrl({ id, size: 'small' })} 400w,
                      ${DBHelper.restaurantImgUrl({ id, size: 'medium' })} 600w,
                      ${DBHelper.restaurantImgUrl({ id, size: 'large' })} 800w`;

  image.classList.add(className);
  image.classList.add('lazy');
  image.src = `${config.HOST}${config.PORT && `:${config.PORT}`}/images/placeholder.png`;
  image.dataset.src = src;
  image.dataset.srcset = srcset;
  image.dataset.sizes = sizes;
  image.alt = alt;

  image.onload = event => {
    if (onload) {
      onload(image);
    }
  };

  return image;
};

/**
 * Generates the stars used for the ratings
 */
const generateStarsHtml = (starCount = 5) => {
  const star = document.createElement('span');
  const docFrag = document.createDocumentFragment();

  star.textContent = '★';
  
  for (let i=starCount; i>0; i--) {
    let tmp = star.cloneNode(true);
    docFrag.appendChild(tmp);
  }

  return docFrag;
}

/**
 * Generates the HTML output for a star rating
 */
const generateStarRatingHtml = rating => {
  const div = document.createElement('div');

  const container = div.cloneNode();
  const top = div.cloneNode();
  const bottom = div.cloneNode();

  container.className = 'star-rating__container';

  top.className = 'star-rating__top';
  top.style.width = `${rating}%`;
  top.appendChild(generateStarsHtml());
  container.appendChild(top);

  bottom.className = 'star-rating__bottom';
  bottom.appendChild(generateStarsHtml());
  container.appendChild(bottom);

  return container;
};

/**
 * Returns star rating for given reviews
 */
const makeStarRating = rating => {
  return generateStarRatingHtml(rating);
};

const elementInViewport = el => {
  const rect = el.getBoundingClientRect()

  return (
     rect.top    >= 0
  && rect.left   >= 0
  && rect.top <= (window.innerHeight || document.documentElement.clientHeight)
  )
};

/**
 * Lazy loads images
 */
const lazyLoadImages = () => {
  let lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
  let activeScroll = false;

  const displayAndRemove = image => {
    image.src = image.dataset.src;
    image.srcset = image.dataset.srcset;
    image.classList.remove('lazy');

    lazyImages = lazyImages.filter(i => i !== image);

    if (lazyImages.length === 0) {
      document.removeEventListener("scroll", lazyLoad);
      window.removeEventListener("resize", lazyLoad);
      window.removeEventListener("orientationchange", lazyLoad);
    }
  };

  const lazyLoad = () => {
    if (activeScroll === false) {
      activeScroll = true;

      setTimeout(() => {
        lazyImages.forEach(lazyImage => {
          if (
            (lazyImage.getBoundingClientRect().top <= window.innerHeight && 
             lazyImage.getBoundingClientRect().bottom >= 0) && 
            getComputedStyle(lazyImage).display !== 'none') {
              displayAndRemove(lazyImage);
          }
        });

        activeScroll = false;
      }, 200);
    }
  };

  // Remove images above the fold
  lazyImages.forEach(lazyImage => {
    if (elementInViewport(lazyImage)) {
      displayAndRemove(lazyImage);
    }
  });

  document.addEventListener("scroll", lazyLoad);
  window.addEventListener("resize", lazyLoad);
  window.addEventListener("orientationchange", lazyLoad);
};
 
/**
 * Registers the Service Worker
 */
const registerSW = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      // Do nothing...
    })
    .catch(console.error);
};

export {
  getUrlParameter,
  lazyLoadImages,
  loadGoogleMaps,
  makeImage,
  makeStarRating,
  registerSW,
};
