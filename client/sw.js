self.addEventListener('install', function(event) {
    // console.log('SW installing');
});
  
self.addEventListener('fetch', function(event) {
    // console.log('used to intercept requests so we can check for the file or data in the cache');
});
  
self.addEventListener('activate', function(event) {
    // console.log('SW activating');
});