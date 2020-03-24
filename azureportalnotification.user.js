// ==UserScript==
// @name         Azure Portal Notification
// @namespace    http://horihiro.net/
// @version      0.1
// @description  Azure Portal Notification
// @author       horihiro
// @match        https://portal.azure.com/*
// @downloadURL  https://raw.githubusercontent.com/horihiro/azurePortalNotification/master/azureportalnotification.user.js
// @updateURL    https://raw.githubusercontent.com/horihiro/azurePortalNotification/master/azureportalnotification.meta.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const scriptname = GM_info.script.name;

  new Promise((res) => {
    Notification.requestPermission((result) => {
      res(result);
    });
  }).then((permission) => {
    return new Promise((res) => {
      const notificationsPaneSelector = '.fxs-notificationspane-progressbar';

      const observer = new MutationObserver(() => {
        const notificationsPane = document.querySelector(notificationsPaneSelector);
        if (!notificationsPane) return;

        console.debug(`[${scriptname}]Observation finished.`);
        observer.disconnect();

        res({notificationsPane, permission});
      });
      observer.observe(document, { childList: true, subtree: true, characterData: true });
      console.debug(`[${scriptname}]Observation starts.`);
    });
  }).then((params) => {

    // Begin blinking favicon
    const TARGET_CLASS = 'fxs-display-none';
    const BLANK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAhElEQVR4Xu3VAREAMAwCseLfdIV85qAcGbv4W/z+E4AGxBNAIF4AnyACCMQTQCBeACuAAALxBBCIF8AKIIBAPAEE4gWwAgggEE8AgXgBrAACCMQTQCBeACuAAALxBBCIF8AKIIBAPAEE4gWwAgggEE8AgXgBrAACCMQTQCBeACuAQJ3AA2jYAEGs/2CBAAAAAElFTkSuQmCC';

    const faviconOrig = document.querySelectorAll('*[rel="shortcut icon"]')[0];
    const faviconBlank = document.createElement('link');
    const head = faviconOrig.parentNode;
    faviconBlank.href = BLANK_IMAGE;
    faviconBlank.setAttribute('rel', 'shortcut icon');
    faviconBlank.setAttribute('type', 'image/png');
    head.removeChild(document.querySelectorAll('*[rel="icon"]')[0]);
    let timeout = 0;

    const blinkFavicon = (params) => {
      timeout = setTimeout(() => {
        const current = document.querySelectorAll('*[rel="shortcut icon"]')[0];
        head.removeChild(current);
        head.appendChild(current === faviconOrig ? faviconBlank : faviconOrig);
        blinkFavicon(params);
      }, params.interval);
    };
    let currentClasses = params.notificationsPane.className;console.log(currentClasses);
    const progressObserver = new MutationObserver((mutatons) => {
      mutatons.forEach((mutation) => {
        if (mutation.attributeName !== 'class') return;
        if (currentClasses.indexOf(TARGET_CLASS) >= 0 && params.notificationsPane.className.indexOf(TARGET_CLASS) < 0) {
          blinkFavicon({
            interval: 500
          });
        } else if (currentClasses.indexOf(TARGET_CLASS) < 0 && params.notificationsPane.className.indexOf(TARGET_CLASS) >= 0) {
          clearTimeout(timeout);
          head.removeChild(document.querySelectorAll('*[rel="shortcut icon"]')[0]);
          head.appendChild(faviconOrig);
        }
        currentClasses = params.notificationsPane.className;
      });
    });
    progressObserver.observe(params.notificationsPane, { attributes: true });
    // End blinking favicon

    // Begin desktop notification
    if (params.permission !== 'granted') return;

    const TARGET_CLASS_TOAST = '.fxs-toast';
    const icon = 'https://portal.azure.com/favicon.ico';
    const toastObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.prototype.forEach.call(mutation.addedNodes, (addedNode) => {
          if (!addedNode.innerHTML || !/<use [^>]+><\/use>/.test(addedNode.innerHTML) || addedNode.parentNode.className !== 'fxs-toast-icon') return;

          const toastTitle = document.querySelectorAll('.fxs-toast-title')[0].innerText;
          const body = document.querySelectorAll('.fxs-toast-description')[0].innerText;
          const n = new Notification(toastTitle, {body, icon});
          n.addEventListener('click', () => {
            window.focus();
          });
        });
      });
    });
    toastObserver.observe(document.querySelector(TARGET_CLASS_TOAST), { childList: true, subtree: true });
    // End desktop notification
  });
})();
