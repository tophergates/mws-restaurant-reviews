const registerSW = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      // Do nothing
    })
    .catch(console.error);
};

export default registerSW;