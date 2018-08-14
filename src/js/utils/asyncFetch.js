/**
 * Uses the Fetch API to fetch resources from the network.
 * @param {string} url The URL of the resource to fetch.
 */
const asyncFetch = async url => {
  return await (await fetch(url)).json();
};

export default asyncFetch;
