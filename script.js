/* ============================================
   LUSION — Interactive Script
   Three.js + GSAP Scroll Animations
   ============================================ */

// ── Custom Cursor ──
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top = mouseY + 'px';
});

function animateCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover effects for interactive elements
const hoverTargets = document.querySelectorAll('a, button, .project-card, .reel-visual, input');
hoverTargets.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ── Three.js Particle Background ──
(function initWebGL() {
  const container = document.getElementById('webgl-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Particle system
  const particleCount = 2000;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 120;
    positions[i3 + 1] = (Math.random() - 0.5) * 120;
    positions[i3 + 2] = (Math.random() - 0.5) * 80;
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const vertexShader = `
    attribute float size;
    varying float vAlpha;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      vAlpha = smoothstep(100.0, 10.0, -mvPosition.z);
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, d) * vAlpha * 0.4;
      gl_FragColor = vec4(0.0, 1.0, 0.53, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Floating mesh (wireframe icosahedron)
  const icoGeo = new THREE.IcosahedronGeometry(12, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x00FF88,
    wireframe: true,
    transparent: true,
    opacity: 0.06
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(20, -5, -20);
  scene.add(ico);

  // Secondary shape
  const torusGeo = new THREE.TorusKnotGeometry(6, 1.5, 64, 16, 2, 3);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0x7D53FF,
    wireframe: true,
    transparent: true,
    opacity: 0.04
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(-25, 10, -30);
  scene.add(torus);

  // Mouse parallax
  let targetRotX = 0, targetRotY = 0;
  document.addEventListener('mousemove', (e) => {
    targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.3;
  });

  // Scroll offset
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset;
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    const pos = geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3];
      pos[i3 + 1] += velocities[i3 + 1];
      pos[i3 + 2] += velocities[i3 + 2];

      // Boundary wrap
      if (Math.abs(pos[i3]) > 60) velocities[i3] *= -1;
      if (Math.abs(pos[i3 + 1]) > 60) velocities[i3 + 1] *= -1;
      if (Math.abs(pos[i3 + 2]) > 40) velocities[i3 + 2] *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    // Rotate shapes
    ico.rotation.x = time * 0.15;
    ico.rotation.y = time * 0.1;
    torus.rotation.x = time * 0.08;
    torus.rotation.y = time * 0.12;

    // Mouse parallax
    particles.rotation.x += (targetRotX - particles.rotation.x) * 0.02;
    particles.rotation.y += (targetRotY - particles.rotation.y) * 0.02;

    // Scroll parallax
    camera.position.y = -scrollY * 0.01;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ── Loader ──
(function initLoader() {
  const loader = document.getElementById('loader');
  const progress = document.getElementById('loaderProgress');
  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 15 + 5;
    if (p >= 100) {
      p = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        initHeroAnimations();
      }, 400);
    }
    progress.style.width = p + '%';
  }, 120);
})();

// ── Hero Animations ──
function initHeroAnimations() {
  const nav = document.getElementById('nav');
  nav.classList.add('visible');

  gsap.registerPlugin(ScrollTrigger);

  // Title words
  gsap.to('.title-word', {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: 'power3.out',
    delay: 0.2
  });

  // Badge
  gsap.to('.hero-badge', {
    opacity: 1,
    duration: 0.8,
    delay: 0.1,
    ease: 'power2.out'
  });

  // Subtitle
  gsap.to('.hero-sub', {
    opacity: 1,
    duration: 0.8,
    delay: 0.7,
    ease: 'power2.out'
  });

  // Actions
  gsap.to('.hero-actions', {
    opacity: 1,
    duration: 0.8,
    delay: 0.9,
    ease: 'power2.out'
  });

  // Scroll indicator
  gsap.to('.hero-scroll', {
    opacity: 1,
    duration: 0.8,
    delay: 1.2,
    ease: 'power2.out'
  });

  // Hero parallax on scroll
  gsap.to('.hero-content', {
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    },
    y: -100,
    opacity: 0
  });

  gsap.to('.hero-scroll', {
    scrollTrigger: {
      trigger: '.hero',
      start: '20% top',
      end: '40% top',
      scrub: 1
    },
    opacity: 0
  });

  // ── Scroll Reveal Helper ──
  // Uses IntersectionObserver + GSAP for reliable reveals
  function scrollReveal(selector, fromVars, stagger, triggerSelector) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    // Separate animation props from config props
    const configKeys = ['duration', 'delay'];
    const defaults = { opacity: 1, y: 0, x: 0, scale: 1, rotation: 0 };
    const animProps = {};
    const setProps = {};

    Object.keys(fromVars).forEach(k => {
      if (!configKeys.includes(k)) {
        setProps[k] = fromVars[k];
        animProps[k] = defaults[k] !== undefined ? defaults[k] : 0;
      }
    });

    // Set initial state
    gsap.set(els, setProps);

    const trigger = triggerSelector ? document.querySelector(triggerSelector) : els[0];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.to(els, {
            ...animProps,
            duration: fromVars.duration || 1,
            stagger: stagger || 0,
            ease: 'power3.out',
            delay: fromVars.delay || 0
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(trigger);
  }

  // ── About Section ──
  scrollReveal('.about-left', { y: 60, opacity: 0, duration: 1 }, 0, '.about');
  scrollReveal('.about-right', { y: 60, opacity: 0, duration: 1, delay: 0.2 }, 0, '.about');

  // Stat counter animation — only run on elements with data-count attribute
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');
  statNumbers.forEach(num => {
    const target = parseInt(num.dataset.count);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.to(num, {
            innerText: target,
            duration: 2,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate: function() {
              num.textContent = Math.round(parseFloat(num.textContent));
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(num);
  });

  // Expertise items
  scrollReveal('.expertise-item', { y: 40, opacity: 0, duration: 0.8 }, 0.1, '.expertise-grid');

  // ── Work Section ──
  scrollReveal('.work-header', { y: 60, opacity: 0, duration: 1 }, 0, '.work');
  scrollReveal('.project-card', { y: 80, opacity: 0, duration: 1 }, 0.15, '.projects-grid');

  // ── Philosophy Section ──
  const philLines = document.querySelectorAll('.phil-line');
  philLines.forEach((line) => {
    ScrollTrigger.create({
      trigger: line,
      start: 'top 75%',
      end: 'bottom 25%',
      onEnter: () => line.classList.add('active'),
      onLeave: () => line.classList.remove('active'),
      onEnterBack: () => line.classList.add('active'),
      onLeaveBack: () => line.classList.remove('active')
    });
  });

  // ── Reel Section ──
  scrollReveal('.reel-visual', { y: 60, opacity: 0, scale: 0.95, duration: 1.2 }, 0, '.reel-section');

  // ── CTA Section ──
  scrollReveal('.cta-content', { y: 80, opacity: 0, duration: 1 }, 0, '.cta');

  // ── Footer ──
  scrollReveal('.footer-col', { y: 30, opacity: 0, duration: 0.8 }, 0.1, '.footer');
}

// ── Menu Toggle ──
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('active');
  menuOverlay.classList.toggle('open');
  document.body.style.overflow = menuOverlay.classList.contains('open') ? 'hidden' : '';
});

// Close menu on link click
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('active');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── Video Modal ──
const playBtns   = document.querySelectorAll('#playReel, .reel-play');
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const ytPlayer   = document.getElementById('youtubePlayer');

function openVideoModal() {
  if (ytPlayer) ytPlayer.src = ytPlayer.dataset.src;
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  videoModal.classList.remove('open');
  document.body.style.overflow = '';
  if (ytPlayer) ytPlayer.src = ''; // stop playback
}

playBtns.forEach(btn => btn.addEventListener('click', openVideoModal));
modalClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideoModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideoModal(); });

// ── Smooth Scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Magnetic Button Effect ──
document.querySelectorAll('.btn-primary, .btn-play, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ── Open Account Modal ──
(function initAccountModal() {
  const overlay  = document.getElementById('accountModal');
  const openBtn  = document.getElementById('openAccountBtn');
  const closeBtn = document.getElementById('accountModalClose');
  const pwInput  = document.getElementById('accountPassword');
  const eyeBtn   = document.getElementById('togglePassword');

  if (!overlay) return;

  function openModal()  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = '';       }

  // Open from hero button and Trade Now nav button
  document.querySelectorAll('#openAccountBtn, .nav-trade-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openModal(); });
  });
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  if (eyeBtn && pwInput) {
    eyeBtn.addEventListener('click', () => {
      pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
    });
  }
})();

// ── Market Ticker ──
(function initTicker() {
  const instruments = [
    { symbol: 'EURUSD',  name: 'Euro vs US Dollar',       price: 1.08452, digits: 5, spread: 0.00010 },
    { symbol: 'USDJPY',  name: 'US Dollar vs Yen',         price: 158.681, digits: 3, spread: 0.020  },
    { symbol: 'GBPUSD',  name: 'Great Britain Pound',      price: 1.27340, digits: 5, spread: 0.00012 },
    { symbol: 'GBPJPY',  name: 'Great Britain Pound/Yen',  price: 212.622, digits: 3, spread: 0.025  },
    { symbol: 'AUDUSD',  name: 'Australian vs US Dollar',  price: 0.65210, digits: 5, spread: 0.00012 },
    { symbol: 'USDCAD',  name: 'US Dollar vs Cad Dollar',  price: 1.36540, digits: 5, spread: 0.00015 },
    { symbol: 'XAUUSD',  name: 'Gold vs US Dollar',        price: 2318.55, digits: 2, spread: 0.30   },
    { symbol: 'GER40',   name: 'GER40 Cash',               price: 22518.5, digits: 1, spread: 0.8    },
    { symbol: 'US30',    name: 'Wall Street 30',            price: 43210.0, digits: 1, spread: 1.0    },
    { symbol: 'BTCUSD',  name: 'Bitcoin vs US Dollar',     price: 67842.0, digits: 1, spread: 15.0   },
    { symbol: 'GBPAUD',  name: 'Great Britain Pound/Aud',  price: 1.9220,  digits: 4, spread: 0.0003 },
    { symbol: 'EURAUD',  name: 'Euro vs Australian Dollar',price: 1.6610,  digits: 4, spread: 0.0003 },
  ];

  // Assign initial changes
  const state = instruments.map(inst => ({
    ...inst,
    change: (Math.random() * 1.6 - 0.8),
    dir: Math.random() > 0.5 ? 'up' : 'down'
  }));

  function fmt(price, digits) {
    return price.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function buildItem(inst) {
    const isUp = inst.dir === 'up';
    const arrow = isUp ? '▲' : '▼';
    const sign  = isUp ? '+' : '';
    return `
      <div class="ticker-item" data-symbol="${inst.symbol}">
        <div class="ticker-icon ${inst.dir}">${arrow}</div>
        <div class="ticker-info">
          <span class="ticker-symbol">${inst.symbol}</span>
          <span class="ticker-name">${inst.name}</span>
        </div>
        <div class="ticker-price-wrap">
          <div class="ticker-price">${fmt(inst.price, inst.digits)}</div>
          <div class="ticker-change ${inst.dir}">${sign}${inst.change.toFixed(3)}%</div>
        </div>
      </div>`;
  }

  function renderTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    // Duplicate items for seamless infinite loop
    const html = state.map(buildItem).join('') + state.map(buildItem).join('');
    track.innerHTML = html;
  }

  function updatePrices() {
    state.forEach(inst => {
      const move = (Math.random() - 0.49) * inst.spread * 3;
      inst.price = Math.max(0.001, inst.price + move);
      inst.change += (Math.random() - 0.5) * 0.05;
      inst.change  = Math.max(-5, Math.min(5, inst.change));
      inst.dir = inst.change >= 0 ? 'up' : 'down';

      // Update DOM without full re-render to keep animation smooth
      const items = document.querySelectorAll(`[data-symbol="${inst.symbol}"]`);
      items.forEach(el => {
        const priceEl  = el.querySelector('.ticker-price');
        const changeEl = el.querySelector('.ticker-change');
        const iconEl   = el.querySelector('.ticker-icon');
        if (!priceEl) return;
        priceEl.textContent  = fmt(inst.price, inst.digits);
        const sign = inst.dir === 'up' ? '+' : '';
        changeEl.textContent = `${sign}${inst.change.toFixed(3)}%`;
        changeEl.className   = `ticker-change ${inst.dir}`;
        iconEl.className     = `ticker-icon ${inst.dir}`;
        iconEl.textContent   = inst.dir === 'up' ? '▲' : '▼';
      });
    });
  }

  renderTicker();
  setInterval(updatePrices, 1200);
})();
