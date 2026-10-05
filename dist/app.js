(() => {
  'use strict';
  const QUIZ_URL = 'https://v1.sacmetodo.com.br/';
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid'];
  const incoming = new URLSearchParams(window.location.search);
  const destination = new URL(QUIZ_URL);
  campaignKeys.forEach(key => {
    const value = incoming.get(key);
    if (value) destination.searchParams.set(key, value);
  });

  // Events are available to a future GTM/analytics integration. No third-party
  // tracking IDs were supplied, so no advertising tags are installed here.
  window.dataLayer = window.dataLayer || [];
  const track = (event, details = {}) => {
    window.dataLayer.push({ event, page_name: 'metodo_sac_vsl', ...details });
  };
  track('view_content');
  document.querySelectorAll('[data-apply]').forEach(link => {
    link.href = destination.toString();
    link.addEventListener('click', () => track('click_apply', {
      cta_position: link.dataset.apply,
      destination: QUIZ_URL
    }));
  });

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
