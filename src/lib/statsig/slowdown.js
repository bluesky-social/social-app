const realFetch = window.fetch
window.fetch = async function (url) {
  if (url === 'https://featuregates.org/v1/initialize') {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  return realFetch.apply(this, arguments)
}
