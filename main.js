(() => {
  const sections = Array.from(document.querySelectorAll('section')); // or '.snap-section'
  if (!sections.length) return;

  let current = 0;
  let locked = false;
  const LOCK_MS = 700; 

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) current = sections.indexOf(e.target);
    });
  }, { threshold: 0.6 });
  sections.forEach(s => io.observe(s));

  const goTo = (idx) => {
    if (idx < 0 || idx >= sections.length) return;
    locked = true;
    sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { locked = false; }, LOCK_MS);
  };

  // Wheel → snap
  const onWheel = (e) => {
    if (locked) { e.preventDefault(); return; }
    const dir = Math.sign(e.deltaY);
    if (!dir) return;
    e.preventDefault();
    goTo(current + (dir > 0 ? 1 : -1));
  };
  window.addEventListener('wheel', onWheel, { passive: false });

  // Keyboard → snap
  const onKey = (e) => {
    if (locked) return;
    const k = e.key;
    if (['ArrowDown','PageDown',' '].includes(k) && !e.shiftKey) {
      e.preventDefault(); goTo(current + 1);
    } else if (['ArrowUp','PageUp'].includes(k) || (k === ' ' && e.shiftKey)) {
      e.preventDefault(); goTo(current - 1);
    }
  };
  window.addEventListener('keydown', onKey, { passive: false });

  // Touch → snap
  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY == null || locked) return;
    const dy = e.touches[0].clientY - touchY;
    if (Math.abs(dy) < 30) return; // small movements ignored
    e.preventDefault();
    goTo(current + (dy < 0 ? 1 : -1));
    touchY = null;
  }, { passive: false });



  // Replace previous source-button event listener block with updated code to manage active state
  (() => {
    const buttons = document.querySelectorAll('.source-button button');
    // Set the first button as active on page load
    if (buttons.length > 0) {
      buttons.forEach(b => b.classList.remove('active'));
      buttons[0].classList.add('active');
    }
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and add to the clicked one
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Call renderSlide to update the visualization
        if (typeof renderSlide === 'function') {
          renderSlide(index);
        } else {
          console.warn('renderSlide function is not available.');
        }
      });
    });
  })();
})();
