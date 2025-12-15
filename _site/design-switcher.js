"use strict";
function isTestModeEnabled() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('test');
}
const testModeEnabled = isTestModeEnabled();
if (!testModeEnabled) {
    console.log('Design system feature flag not enabled. Use ?test to activate.');
}
function getBowserParser() {
    if (typeof window.Bowser !== 'undefined') {
        const Bowser = window.Bowser;
        return Bowser.getParser(window.navigator.userAgent);
    }
    return null;
}
function isAppleDevice() {
    const bowser = getBowserParser();
    if (bowser) {
        const osName = bowser.getOSName(true);
        return osName === 'ios' || osName === 'macos';
    }
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod|macintosh|mac os x/.test(userAgent);
}
function isAndroidDevice() {
    const bowser = getBowserParser();
    if (bowser) {
        const osName = bowser.getOSName(true);
        return osName === 'android';
    }
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
}
function determineDesignSystem() {
    if (isAppleDevice()) {
        return 'liquid-glass';
    }
    return 'material-design';
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
    else {
        platform = 'other';
    }
    return {
        platform,
        designSystem,
        isApple,
        isAndroid,
        userAgent: navigator.userAgent
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
if (testModeEnabled) {
    initializeDesignSwitcher();
}
//# sourceMappingURL=design-switcher.js.map