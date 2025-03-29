// Polyfill for scheduler exports needed by @react-three/fiber
const getTime = () => Date.now();

export const unstable_scheduleCallback = (priority, callback) => {
    if (typeof window !== 'undefined') {
        return window.requestIdleCallback(callback);
    }
    return setTimeout(callback, 0);
};

export const unstable_IdlePriority = 5;
export const unstable_ImmediatePriority = 1;
export const unstable_LowPriority = 4;
export const unstable_NormalPriority = 3;
export const unstable_UserBlockingPriority = 2;

export const unstable_cancelCallback = (callbackId) => {
    if (typeof window !== 'undefined') {
        window.cancelIdleCallback(callbackId);
    } else {
        clearTimeout(callbackId);
    }
};

export const unstable_shouldYield = () => false;
export const unstable_requestPaint = () => {};
export const unstable_continueExecution = () => true;
export const unstable_pauseExecution = () => {};
export const unstable_getFirstCallbackNode = () => null;
export const unstable_forceExit = () => {};
export const unstable_now = getTime;