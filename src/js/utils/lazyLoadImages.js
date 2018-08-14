/**
 * Helper function used in lazyLoadImages function to determine if the
 * element is currently within the bounding box of the browser window.
 * @param {*} el The DOM element to check
 * @returns {boolean} True if the element is inside the viewport, False otherwise.
 */
const elementInViewport = el => {
  const rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight)
  );
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
      document.removeEventListener('scroll', lazyLoad);
      window.removeEventListener('resize', lazyLoad);
      window.removeEventListener('orientationchange', lazyLoad);
    }
  };

  const lazyLoad = () => {
    if (activeScroll === false) {
      activeScroll = true;

      setTimeout(() => {
        lazyImages.forEach(lazyImage => {
          if (
            lazyImage.getBoundingClientRect().top <= window.innerHeight &&
            lazyImage.getBoundingClientRect().bottom >= 0 &&
            getComputedStyle(lazyImage).display !== 'none'
          ) {
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

  document.addEventListener('scroll', lazyLoad);
  window.addEventListener('resize', lazyLoad);
  window.addEventListener('orientationchange', lazyLoad);
};

export default lazyLoadImages;
