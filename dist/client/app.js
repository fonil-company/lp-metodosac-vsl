(() => {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  const track = (event, details = {}) => {
    window.dataLayer.push({ event, page_name: 'metodo_sac_vsl', ...details });
  };
  track('view_content');
  const dialog = document.getElementById('diagnostico');
  const quizFrame = document.getElementById('quiz-frame');
  let started = false;
  let opener;
  function openQuiz() {
    if (dialog.open) return;
    if (!quizFrame.hasAttribute('src')) {
      quizFrame.src = `quiz/index.html${window.location.search}`;
    }
    document.querySelectorAll('video').forEach(video => video.pause());
    document.querySelector('#vsl-player iframe')?.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube-nocookie.com');
    dialog.showModal();
    document.body.classList.add('quiz-open');
    if (!started) { track('quiz_start'); started = true; }
  }
  function closeQuiz() {
    dialog.close();
    document.body.classList.remove('quiz-open');
    if (location.hash === '#diagnostico') history.replaceState(null, '', location.pathname + location.search);
    opener?.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-apply]').forEach(link => {
    link.href = '#diagnostico';
    link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      track('click_apply', { cta_position: link.dataset.apply, destination: '#diagnostico' });
      if (location.hash !== '#diagnostico') history.pushState(null, '', '#diagnostico');
      openQuiz();
    });
  });
  document.getElementById('quiz-close').addEventListener('click', closeQuiz);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeQuiz(); });
  window.addEventListener('popstate', () => location.hash === '#diagnostico' ? openQuiz() : closeQuiz());
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== quizFrame.contentWindow) return;
    if (event.data?.type === 'sac-quiz-close') closeQuiz();
    if (event.data?.type === 'sac-quiz-complete') track('quiz_complete');
  });
  if (location.hash === '#diagnostico') openQuiz();

  // Load YouTube only after an intentional click. The real playback event is
  // emitted only when the player reports PLAYING, never on the initial click.
  const launch = document.querySelector('.video-launch');
  const frame = document.getElementById('vsl-player');
  launch?.addEventListener('click', event => {
    event.preventDefault();
    const iframe = document.createElement('iframe');
    const videoUrl = new URL('https://www.youtube-nocookie.com/embed/v-A7exiRzbE');
    videoUrl.searchParams.set('autoplay', '1');
    videoUrl.searchParams.set('playsinline', '1');
    videoUrl.searchParams.set('rel', '0');
    videoUrl.searchParams.set('enablejsapi', '1');
    videoUrl.searchParams.set('origin', window.location.origin);
    iframe.src = videoUrl.toString();
    iframe.title = 'Método S.A.C — apresentação do Motor Duplo B2B';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(iframe);
    iframe.focus();
    track('video_requested', { video_id: 'v-A7exiRzbE' });

    const api = document.createElement('script');
    api.src = 'https://www.youtube.com/iframe_api';
    let played = false;
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player(iframe, {
        events: {
          onStateChange: e => {
            if (e.data === window.YT.PlayerState.PLAYING && !played) {
              played = true;
              track('play_video', { video_id: 'v-A7exiRzbE' });
            }
          }
        }
      });
    };
    document.head.append(api);
  }, { once: true });

  // Avoid overlapping audio and record only actual testimonial playback.
  const testimonials = document.querySelectorAll('[data-testimonial]');
  testimonials.forEach(video => {
    video.addEventListener('play', () => {
      testimonials.forEach(other => { if (other !== video) other.pause(); });
    });
    video.addEventListener('playing', () => {
      track('play_testimonial', { testimonial: video.dataset.testimonial });
    }, { once: true });
  });

  // Keep one FAQ answer open in browsers without native details[name] support.
  document.querySelectorAll('.faq-items details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      document.querySelectorAll('.faq-items details').forEach(other => {
        if (other !== detail) other.open = false;
      });
    });
  });
  document.getElementById('copyright-year').textContent = String(new Date().getFullYear());
})();
