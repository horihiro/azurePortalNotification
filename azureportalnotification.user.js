// ==UserScript==
// @name         Azure Portal Notification
// @namespace    http://horihiro.net/
// @version      0.2
// @description  Azure Portal Notification
// @author       horihiro
// @match        https://portal.azure.com/*
// @match        https://ms.portal.azure.com/*
// @downloadURL  https://github.com/horihiro/azurePortalNotification/raw/master/azureportalnotification.user.js
// @updateURL    https://github.com/horihiro/azurePortalNotification/raw/master/azureportalnotification.meta.js
// @grant        none
// ==/UserScript==

(async function() {
  'use strict';

  const scriptname = GM_info.script.name;

  const notificationsPane = await new Promise((res) => {
    const notificationsPaneSelector = '.fxs-notificationspane-progressbar';

    const observer = new MutationObserver(() => {
      const notificationsPane = document.querySelector(notificationsPaneSelector);
      if (!notificationsPane) return;

      console.debug(`[${scriptname}]Observation finished.`);
      observer.disconnect();

      res(notificationsPane);
    });
    observer.observe(document, { childList: true, subtree: true, characterData: true });
    console.debug(`[${scriptname}]Observation starts.`);
  });

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
  let currentClasses = notificationsPane.className;console.log(currentClasses);
  const progressObserver = new MutationObserver((mutatons) => {
    mutatons.forEach((mutation) => {
      if (mutation.attributeName !== 'class') return;
      if (currentClasses.indexOf(TARGET_CLASS) >= 0 && notificationsPane.className.indexOf(TARGET_CLASS) < 0) {
        blinkFavicon({
          interval: 500
        });
      } else if (currentClasses.indexOf(TARGET_CLASS) < 0 && notificationsPane.className.indexOf(TARGET_CLASS) >= 0) {
        clearTimeout(timeout);
        head.removeChild(document.querySelectorAll('*[rel="shortcut icon"]')[0]);
        head.appendChild(faviconOrig);
      }
      currentClasses = notificationsPane.className;
    });
  });
  progressObserver.observe(notificationsPane, { attributes: true });
  // End blinking favicon

  // Begin desktop notification
  const permission = await new Promise((res) => {
    Notification.requestPermission((result) => {
      res(result);
    });
  });
  if (permission !== 'granted') return;

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
  const toastContainerObserver = new MutationObserver((mutations) => {
    const toastContainer = document.querySelector(TARGET_CLASS_TOAST);
    if (!toastContainer) return;
    console.log(toastContainer);
    toastContainerObserver.disconnect();
    toastObserver.observe(document.querySelector(TARGET_CLASS_TOAST), { childList: true, subtree: true });
  });
  toastContainerObserver.observe(document, { childList: true, subtree: true });
  // End desktop notification
})();
