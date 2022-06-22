const identityClearTimeout =
    (handle: ReturnType<typeof setTimeout>) =>
    <T>(value: T) => {
        clearTimeout(handle);
        return value;
    };

export const timeoutPromise = function (ms: number, promise: Promise<any>, timeoutError?: string) {
    // Create a promise that rejects in <ms> milliseconds
    let timeoutHandle: ReturnType<typeof setTimeout>;

    let timeout = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(timeoutError || 'Timed out in ' + ms + 'ms.');
        }, ms);
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise.then(identityClearTimeout(timeoutHandle!)), timeout]);
};

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
