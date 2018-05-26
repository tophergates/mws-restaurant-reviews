const registerSW = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered');
    })
    .catch(console.error);
};

export default registerSW;