import DBHelper from './db';

/**
 * Creates a responsive image.
 * @param {*} props The image properties (id, src, srcset, sizes, alt, className).
 * @param {function} onload The callback function to call once the image has loaded.
 * @returns {*} The HTML for the responsive image.
 */
const makeImage = ({ id, src, srcset, sizes, alt, className }, onload) => {
  const srcSet =
    srcset ||
    `${DBHelper.restaurantImgUrl({ id, size: 'small' })} 800w,
    ${DBHelper.restaurantImgUrl({ id, size: 'medium' })} 1200w,
    ${DBHelper.restaurantImgUrl({ id, size: 'large' })} 1600w`;

  return `<img 
    src="${DBHelper.BASE_URL}/images/placeholder.png"
    data-src="${src}"
    data-srcset="${srcSet}"
    data-sizes="${sizes}"
    class="${className} lazy"
    alt="${alt}"
  />`;
};

/**
 * Utility function that generates the stars used for the ratings.
 * @param {number} stars The number of stars to generate.
 * @returns {*} THe HTML for the stars that make up the star rating.
 */
const generateStarsHTML = () => {
  const starCount = DBHelper.MAX_REVIEW_SCORE;
  const html = Array(starCount).fill('★');
  return html.join('');
};

/**
 * Generates the HTML output for a restaurant average star rating.
 * @param {number} rating The restaurants average rating.
 * @returns {*} The HTML for the restaurants star rating.
 */
const makeStarRating = rating => {
  const starsHTML = generateStarsHTML();

  return `
    <div class="star-rating__container">
      <div class="star-rating__top" style="width: ${rating ? rating : 0}%">${starsHTML}</div>
      <div class="star-rating__bottom">${starsHTML}</div>
    </div>
  `;
};

/**
 * Utility function to populate a select box with values.
 * @param {*} selectEl The select element (HTML DOM element).
 * @param {[string]} values The values to populate the select element with.
 * @returns {undefined} Does not return a value.
 */
const populateSelectBox = (selectEl, values, selectedValue) => {
  // Create a document fragment and option element
  const docFrag = document.createDocumentFragment();
  const optionEl = document.createElement('option');

  // Clear all child nodes, except the first child
  while (selectEl.childNodes.length > 1) {
    selectEl.removeChild(selectEl.lastChild);
  }

  // Add an option for each value
  values.forEach(value => {
    // Clone the option element
    let option = optionEl.cloneNode();

    // Set the textContent and value
    option.textContent = value;
    option.value = value;

    if (value === selectedValue) {
      option.selected = true;
    }

    // Append the option to the document fragment
    docFrag.appendChild(option);
  });

  // Append the document fragment to the select box
  selectEl.appendChild(docFrag);
};

export { makeImage, makeStarRating, populateSelectBox };
