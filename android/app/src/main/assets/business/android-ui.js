/* Loaded by the Android package before app.js. No business data is stored here. */
(() => {
  'use strict';
  // The hosted website also ships this file. Keep the Android/mobile shell
  // disabled on normal desktop browsers while retaining it for phone-sized
  // WebViews and mobile browsers.
  if (!window.matchMedia('(max-width: 850px)').matches) return;
  document.documentElement.classList.add('invoicey-android');
  const q = selector => document.querySelector(selector);
  const logoURL = 'assets/invoicey-badge.png';
  let scheduled = false;
  let scrim;
  let sidebarCloseTimer = 0;
  let systemTop = 0;
  let systemBottom = 0;
   let imeBottom = 0;
   let fullViewportHeight = 0;
  function syncSystemInsets() {
    document.documentElement.style.setProperty('--android-system-top', `${systemTop}px`);
    document.documentElement.style.setProperty('--android-system-bottom', `${systemBottom}px`);
     document.documentElement.style.setProperty('--android-ime-bottom', `${imeBottom}px`);
  }
  const setViewportHeight = () => {
    const viewport = window.visualViewport;
     const rawViewportHeight = Math.round(viewport?.height || window.innerHeight);
     const active = document.activeElement;
     const keyboardOpen = imeBottom > 0 || active?.matches?.('input,textarea,select');
     if (!keyboardOpen || !fullViewportHeight) fullViewportHeight = Math.max(fullViewportHeight, rawViewportHeight, Math.round(window.innerHeight));
     const resizedByIme = imeBottom > 0 && rawViewportHeight < fullViewportHeight - 24;
     const viewportHeight = resizedByIme ? rawViewportHeight : (imeBottom > 0 ? Math.max(0, Math.min(rawViewportHeight, fullViewportHeight - imeBottom)) : rawViewportHeight);
     const keyboardHeight = imeBottom > 0 ? (resizedByIme ? 0 : imeBottom) : Math.max(0, Math.round(fullViewportHeight - rawViewportHeight - systemBottom));
     document.documentElement.style.setProperty('--android-viewport-height', `${viewportHeight}px`);
    document.documentElement.style.setProperty('--android-keyboard-height', `${keyboardHeight}px`);
    if (active?.matches?.('input,textarea,select')) window.setTimeout(() => keepFieldVisible(active), 80);
  };
  setViewportHeight();
  window.visualViewport?.addEventListener('resize', setViewportHeight);
  window.visualViewport?.addEventListener('scroll', setViewportHeight);
  window.addEventListener('resize', setViewportHeight);

  function closeSidebar() {
    window.clearTimeout(sidebarCloseTimer);
    sidebarCloseTimer = 0;
    q('#sidebar')?.classList.remove('open');
  }

  function scheduleSidebarClose() {
    window.clearTimeout(sidebarCloseTimer);
    if (!q('#sidebar.open')) return;
    sidebarCloseTimer = window.setTimeout(closeSidebar, 6500);
  }

  function keepFieldVisible(field) {
    if (!field?.isConnected || !field.matches('input,textarea,select')) return;
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop || 0;
     const viewportBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--android-viewport-height')) - systemBottom - 12;
    const modalBody = field.closest('.modal-body');
    const accessRoot = field.closest('#accessRoot');
    const modal = field.closest('.modal');
    const footerTop = modal?.querySelector('.modal-footer')?.getBoundingClientRect().top;
    const scroller = modalBody || accessRoot || field.closest('[data-scroll-container]') || document.scrollingElement;
    const scrollerRect = scroller && scroller !== document.scrollingElement ? scroller.getBoundingClientRect() : null;
    const safeBottom = Math.min(viewportBottom, scrollerRect?.bottom ? scrollerRect.bottom - 12 : viewportBottom, Number.isFinite(footerTop) ? footerTop - 12 : viewportBottom);
    const safeTop = Math.max(viewportTop + 12, scrollerRect?.top ? scrollerRect.top + 12 : viewportTop + 12);
    const rect = field.getBoundingClientRect();
    if (!scroller) return;
    let delta = 0;
    if (rect.bottom > safeBottom) delta = rect.bottom - safeBottom;
    else if (rect.top < safeTop) delta = rect.top - safeTop;
    if (Math.abs(delta) > 1) scroller.scrollTop += delta;
    if (modalBody) modalBody.scrollTop = Math.max(0, modalBody.scrollTop);
    if (accessRoot) accessRoot.scrollTop = Math.max(0, accessRoot.scrollTop);
  }

  function openSidebar() {
    const sidebar = q('#sidebar');
    if (!sidebar || !window.matchMedia('(max-width: 850px)').matches) return;
    sidebar.classList.add('open');
    scheduleSidebarClose();
  }

  function closeAbout() {
    q('#androidAbout')?.remove();
  }

  function showAbout() {
    closeSidebar();
    closeAbout();
    const about = document.createElement('div');
    about.id = 'androidAbout';
    about.className = 'android-about-backdrop';
    about.innerHTML = '<section class="android-about-card" role="dialog" aria-modal="true" aria-labelledby="androidAboutTitle"><button class="close-button" type="button" data-android-action="close-about" aria-label="Close about">×</button><img src="' + logoURL + '" alt="ITSME Invoicey logo"><h2 id="androidAboutTitle">itsme invoicey</h2><p>Business management for Android<br>Company records are saved on this device.</p><address><span>Designed &amp; developed by</span><strong>B. A. Dhameera Idumal</strong><a href="tel:+94702359602">+94 70 235 9602</a><a href="mailto:dhameera@hotmail.com">dhameera@hotmail.com</a><a href="https://www.linkedin.com/in/dhameera" target="_blank" rel="noopener noreferrer">LinkedIn profile ↗</a><span>Published by</span><strong>ITSMe Technology</strong></address></section>';
    about.addEventListener('click', event => {
      if (event.target === about || event.target.closest('[data-android-action="close-about"]')) closeAbout();
    });
    document.body.append(about);
    about.querySelector('button').focus();
  }

  function syncUI() {
    scheduled = false;
    if (!document.body) return;
    const sidebar = q('#sidebar');
    const modal = q('#modalRoot .modal');
    const open = !!sidebar?.classList.contains('open') && window.matchMedia('(max-width: 850px)').matches;
    if (scrim) scrim.hidden = !open;
    q('#menuButton')?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('android-modal-open', !!modal);

    for (const mark of document.querySelectorAll('.brand-mark')) {
      if (mark.querySelector('img')) continue;
      const img = document.createElement('img');
      img.src = logoURL;
      img.alt = 'ITSME Invoicey';
      img.decoding = 'async';
      mark.append(img);
    }
    const accessBrand = q('.access-brand');
    if (accessBrand && !accessBrand.querySelector('.brand-mark')) {
      const mark = document.createElement('span');
      mark.className = 'brand-mark';
      const img = document.createElement('img');
      img.src = logoURL;
      img.alt = 'ITSME Invoicey';
      mark.append(img);
      accessBrand.prepend(mark);
    }

    for (const row of document.querySelectorAll('.line-row')) {
      const headings = row.closest('table')?.querySelectorAll('thead th') || [];
      for (let i = 0; i < row.cells.length; i++) {
        const label = headings[i]?.textContent?.trim() || '';
        if (row.cells[i].dataset.fieldLabel !== label) row.cells[i].dataset.fieldLabel = label;
      }
    }
    for (const scroll of document.querySelectorAll('.table-scroll')) {
      if (scroll.closest('.pdf-document')) continue;
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', 'Records table. Swipe horizontally for more columns.');
      const overflow = scroll.scrollWidth > scroll.clientWidth + 4;
      if (overflow && !scroll.previousElementSibling?.classList.contains('android-table-hint')) {
        const hint = document.createElement('p');
        hint.className = 'android-table-hint';
        hint.textContent = 'Swipe table left or right to see all columns ↔';
        scroll.before(hint);
      } else if (!overflow && scroll.previousElementSibling?.classList.contains('android-table-hint')) {
        scroll.previousElementSibling.remove();
      }
    }
    for (const input of document.querySelectorAll('input')) {
      const name = String(input.name || input.id || '').toLowerCase();
      if (input.type === 'number' && !input.inputMode) input.inputMode = 'decimal';
      if (input.type === 'text' && /(phone|contactnumber|telephone)/.test(name)) input.inputMode = 'tel';
    }
    for (const text of document.querySelectorAll('#accessRoot .access-intro')) {
      if (text.textContent.includes('on this computer')) text.textContent = text.textContent.replaceAll('on this computer', 'on this device');
      if (text.textContent.includes('Passwords are encrypted.')) text.textContent = text.textContent.replace('Passwords are encrypted.', 'Passwords are stored securely.');
    }
    const setupPasswordNote = q('#setupForm .auth-footnote');
    if (setupPasswordNote?.textContent.startsWith('Passwords are encrypted.')) setupPasswordNote.textContent = setupPasswordNote.textContent.replace('Passwords are encrypted.', 'Passwords are stored securely.');
    if (modal?.querySelector('.pdf-document')) {
      const note = modal.querySelector('.required-note');
      if (note && note.textContent !== 'A4 document · Save PDF or print with Android') note.textContent = 'A4 document · Save PDF or print with Android';
    }
  }

  function scheduleUI() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncUI);
  }

  function initialize() {
    scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'android-nav-scrim';
    scrim.hidden = true;
    scrim.setAttribute('aria-label', 'Close navigation');
    scrim.addEventListener('click', closeSidebar);
    document.body.append(scrim);
    const menuButton = q('#menuButton');
    menuButton?.addEventListener('click', event => {
      event.preventDefault();
      q('#sidebar')?.classList.contains('open') ? closeSidebar() : openSidebar();
      scheduleUI();
    });
    q('#sidebar')?.addEventListener('touchstart', scheduleSidebarClose, { passive: true });
    q('#sidebar')?.addEventListener('pointerdown', scheduleSidebarClose, { passive: true });
    document.addEventListener('touchstart', event => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      event.target.closest?.('#sidebar') && scheduleSidebarClose();
    }, { passive: true });
    let swipeStartX = 0;
    let swipeStartY = 0;
    document.addEventListener('touchstart', event => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      swipeStartX = touch.clientX;
      swipeStartY = touch.clientY;
    }, { passive: true });
    document.addEventListener('touchend', event => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      const deltaX = touch.clientX - swipeStartX;
      const deltaY = Math.abs(touch.clientY - swipeStartY);
      if (deltaX > 45 && deltaY < 65 && swipeStartX < 48) openSidebar();
      else if (deltaX < -45 && deltaY < 65 && q('#sidebar.open')) closeSidebar();
    }, { passive: true });
    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'android-about-button';
    aboutButton.textContent = 'ⓘ  About itsme invoicey';
    aboutButton.addEventListener('click', showAbout);
    q('.sidebar-bottom')?.prepend(aboutButton);
    q('#menuButton')?.setAttribute('aria-controls', 'sidebar');
    const observer = new MutationObserver(scheduleUI);
    observer.observe(document.body, { childList: true, subtree: true });
    if (q('#sidebar')) observer.observe(q('#sidebar'), { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', scheduleUI);
    document.addEventListener('click', scheduleUI);
    window.addEventListener('hashchange', () => {
      closeSidebar();
      window.scrollTo(0, 0);
      scheduleUI();
    });
    // Focusing a form field should keep its label and error area visible above the keyboard.
    document.addEventListener('focusin', event => {
      if (!event.target.matches('input,textarea,select')) return;
      [80, 220, 450, 750, 1100].forEach(delay => setTimeout(() => keepFieldVisible(event.target), delay));
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeAbout(); closeSidebar(); }
    });
    syncUI();
  }

  // Android's Back callback closes the topmost temporary surface before navigation.
  function handleBack() {
      if (q('#androidAbout')) { closeAbout(); return true; }
      if (q('#sidebar.open')) { closeSidebar(); return true; }
      const modalClose = q('#modalRoot [data-action="close-modal"]');
      if (modalClose) { modalClose.click(); return true; }
      const search = q('#globalSearchResults');
      if (search && !search.hidden) { search.hidden = true; q('#globalSearch')?.blur(); return true; }
      const accessBack = q('#accessRoot [data-action="show-login"]');
      if (accessBack && !q('#accessRoot').hidden) { accessBack.click(); return true; }
      return false;
  }
  syncSystemInsets();
    window.InvoiceyAndroidUI = Object.freeze({ handleBack, setSystemInsets(top = 0, bottom = 0, ime = 0) { systemTop = Math.max(0, Number(top) || 0); systemBottom = Math.max(0, Number(bottom) || 0); imeBottom = Math.max(0, Number(ime) || 0); syncSystemInsets(); setViewportHeight(); scheduleUI(); } });
  window.invoiceyHandleBack = handleBack;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();

