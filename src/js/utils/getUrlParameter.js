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

export default getUrlParameter;
