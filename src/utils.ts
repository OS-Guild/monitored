export const safe = fn => r => {
  try {
      if (fn) {
          return fn(r);
      }
      return r;
  } catch {
      return r;
  }
};

export const timeoutPromise = function(ms: number, promise: Promise<any>, timeoutError?: string) {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((_, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject(timeoutError || 'Timed out in ' + ms + 'ms.');
      }, ms);
    });
  
    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise, timeout]);
  };