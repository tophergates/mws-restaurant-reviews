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

  image.className = className;
  image.setAttribute('src', src);
  image.setAttribute('alt', alt);
  image.setAttribute('srcset', srcset);
  image.setAttribute('sizes', sizes);

  image.onload = event => {
    if (onload) {
      onload(image);
    }
  };

  return image;
};

/**
 * Calculates average rating percentage
 */
const averageRating = reviews => {
  const TOP_RATING = 5;
  const total = reviews.reduce((acc, review) => {
    return acc + review.rating;
  }, 0);

  return (total / (reviews.length * TOP_RATING) * 100);
};

/**
 * Generates the stars used for the ratings
 */
const generateStarsHtml = () => {
  const RATING_LIMIT = 5;
  const star = document.createElement('span');
  const docFrag = document.createDocumentFragment();

  star.textContent = '★';
  
  for (let i=RATING_LIMIT; i>0; i--) {
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
const makeStarRating = reviews => {
  const average = averageRating(reviews);
  return generateStarRatingHtml(average);
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
  loadGoogleMaps,
  makeImage,
  makeStarRating,
  registerSW,
};
