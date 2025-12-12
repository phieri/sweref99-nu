"use strict";
function isAppleDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMac = /macintosh|mac os x/.test(userAgent);
    return isIOS || isMac;
}
function isAndroidDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
}
function determineDesignSystem() {
    if (isAndroidDevice()) {
        return 'material-design';
    }
    if (isAppleDevice()) {
        return 'liquid-glass';
    }
    return 'liquid-glass';
}
function getPlatformInfo() {
    const isApple = isAppleDevice();
    const isAndroid = isAndroidDevice();
    const designSystem = determineDesignSystem();
    let platform = 'unknown';
    if (isApple) {
        platform = 'apple';
    }
    else if (isAndroid) {
        platform = 'android';
    }
    return {
        platform,
        designSystem,
        isApple,
        isAndroid
    };
}
function loadDesignSystemCSS(designSystem) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/${designSystem}.css`;
    link.id = 'design-system-stylesheet';
    const firstStylesheet = document.querySelector('link[rel="stylesheet"]');
    if (firstStylesheet && firstStylesheet.parentNode) {
        firstStylesheet.parentNode.insertBefore(link, firstStylesheet.nextSibling);
    }
    else {
        document.head.appendChild(link);
    }
    console.log(`Design system loaded: ${designSystem}`);
}
function storeDesignSystemPreference(designSystem) {
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('design-system', designSystem);
        }
    }
    catch (error) {
        console.warn('Could not store design system preference:', error);
    }
}
function getStoredDesignSystemPreference() {
    try {
        if (typeof sessionStorage !== 'undefined') {
            const stored = sessionStorage.getItem('design-system');
            if (stored === 'liquid-glass' || stored === 'material-design') {
                return stored;
            }
        }
    }
    catch (error) {
        console.warn('Could not retrieve design system preference:', error);
    }
    return null;
}
function initializeDesignSwitcher() {
    let designSystem = getStoredDesignSystemPreference();
    if (!designSystem) {
        const platformInfo = getPlatformInfo();
        designSystem = platformInfo.designSystem;
        storeDesignSystemPreference(designSystem);
        console.log('Platform detected:', {
            platform: platformInfo.platform,
            userAgent: navigator.userAgent,
            designSystem: designSystem
        });
    }
    else {
        console.log('Using stored design system preference:', designSystem);
    }
    loadDesignSystemCSS(designSystem);
}
function switchDesignSystem(designSystem) {
    const existingStylesheet = document.getElementById('design-system-stylesheet');
    if (existingStylesheet && existingStylesheet.parentNode) {
        existingStylesheet.parentNode.removeChild(existingStylesheet);
    }
    loadDesignSystemCSS(designSystem);
    storeDesignSystemPreference(designSystem);
    console.log('Design system switched to:', designSystem);
}
if (typeof window !== 'undefined') {
    window.designSwitcher = {
        getPlatformInfo,
        switchDesignSystem,
        isAppleDevice,
        isAndroidDevice
    };
}
initializeDesignSwitcher();
//# sourceMappingURL=design-switcher.js.map