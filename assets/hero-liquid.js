/* ==========================================================================
   Vortex Hydro — Animated Abstract Liquid Hero Engine
   - Multi-layered sculpted 3D glossy translucent liquid ribbons (Three.js + Custom GLSL)
   - 7 floating translucent glass spheres with subtle cursor attraction
   - 54 glowing atmospheric micro-particles
   - Continuous organic wave undulation, slow gradient shifting, multi-depth
     mouse & scroll parallax, and subtle magnetic CTA buttons
   ========================================================================== */
(function initVortexLiquidHero() {
  'use strict';

  var hero = document.getElementById('vx-hero');
  var canvas = document.getElementById('hero-liquid-canvas');
  var auraLayer = document.getElementById('hero-aura');
  var copyCol = document.getElementById('hero-copy');
  var scrollCue = document.querySelector('.hero__scroll-cue');
  if (!hero) return;

  var mqReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(mqReduced && mqReduced.matches);
  if (mqReduced && mqReduced.addEventListener) {
    mqReduced.addEventListener('change', function (e) { reduced = !!e.matches; });
  }

  /* ---------- 1. Subtle Magnetic Buttons ([data-magnetic]) ---------- */
  var magBtns = Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]'));
  magBtns.forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      if (reduced || e.pointerType !== 'mouse') return;
      var r = btn.getBoundingClientRect();
      var dx = ((e.clientX - r.left) / r.width - 0.5) * 12;
      var dy = ((e.clientY - r.top) / r.height - 0.5) * 10;
      btn.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
    });
    btn.addEventListener('pointerleave', function () {
      btn.style.transform = '';
    });
  });

  /* ---------- 2. Pointer & Scroll State ---------- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var scrollProg = 0;

  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
  }, { passive: true });

  hero.addEventListener('pointerleave', function () {
    pointer.tx = 0;
    pointer.ty = 0;
  }, { passive: true });

  function updateHeroScroll() {
    var beranda = document.getElementById('beranda');
    if (beranda && beranda.hidden) return;
    var sy = window.scrollY || window.pageYOffset || 0;
    var h = hero.offsetHeight || window.innerHeight || 800;
    scrollProg = Math.min(1, Math.max(0, sy / Math.max(300, h * 0.85)));

    if (reduced) return;

    /* Different layer speeds for smooth multi-depth hero exit */
    if (auraLayer) {
      auraLayer.style.transform = 'translate3d(0,' + (scrollProg * 68).toFixed(1) + 'px,0) scale(' + (1 + scrollProg * 0.06).toFixed(3) + ')';
    }
    if (copyCol) {
      if (scrollProg <= 0.002) {
        copyCol.style.transform = '';
        copyCol.style.opacity = '';
      } else {
        copyCol.style.transform = 'translate3d(0,' + (-scrollProg * 54).toFixed(1) + 'px,0)';
        copyCol.style.opacity = Math.max(0, 1 - scrollProg * 1.25).toFixed(3);
      }
    }
    if (scrollCue) {
      if (scrollProg <= 0.002) {
        scrollCue.style.transform = '';
        scrollCue.style.opacity = '';
      } else {
        scrollCue.style.transform = 'translate3d(-50%,' + (-scrollProg * 28).toFixed(1) + 'px,0)';
        scrollCue.style.opacity = Math.max(0, 1 - scrollProg * 2.2).toFixed(3);
      }
    }
  }
  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  window.addEventListener('resize', updateHeroScroll, { passive: true });
  updateHeroScroll();

  /* ---------- 3. Sculpted 3D Abstract Liquid Engine (Three.js + Custom GLSL) ---------- */
  if (!canvas || typeof window.THREE === 'undefined') return;
  var THREE = window.THREE;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (_) {
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 80);
  camera.position.set(0, 0, 11.5);

  var rootGroup = new THREE.Group();
  scene.add(rootGroup);

  /* Custom Tapered Organic Ribbon Geometry along a 3D CatmullRomCurve3 */
  function createLiquidRibbonGeometry(points, width, thickness, tubularSegs, radialSegs, twistTurns) {
    var curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    var frames = curve.computeFrenetFrames(tubularSegs, false);

    var verts = [];
    var norms = [];
    var uvs = [];
    var indices = [];

    var p = new THREE.Vector3();
    var nrm = new THREE.Vector3();
    var pos = new THREE.Vector3();

    for (var i = 0; i <= tubularSegs; i++) {
      var u = i / tubularSegs;
      curve.getPointAt(u, p);

      /* Smooth tapered ribbon silhouette (narrow tips, generous glossy body) */
      var taper = Math.sin(u * Math.PI);
      taper = Math.pow(Math.max(0.001, taper), 0.52);
      var w = width * taper;
      var th = thickness * (0.45 + 0.55 * taper);

      /* Organic helical ribbon twist along the curve */
      var twist = u * Math.PI * 2.0 * twistTurns;
      var cosT = Math.cos(twist), sinT = Math.sin(twist);

      var N = frames.normals[i];
      var B = frames.binormals[i];

      var rx = N.x * cosT + B.x * sinT;
      var ry = N.y * cosT + B.y * sinT;
      var rz = N.z * cosT + B.z * sinT;

      var bx = -N.x * sinT + B.x * cosT;
      var by = -N.y * sinT + B.y * cosT;
      var bz = -N.z * sinT + B.z * cosT;

      for (var j = 0; j <= radialSegs; j++) {
        var v = j / radialSegs;
        var a = v * Math.PI * 2.0;
        var ca = Math.cos(a), sa = Math.sin(a);

        /* Flattened sleek elliptical ribbon cross-section */
        var ox = rx * ca * w + bx * sa * th;
        var oy = ry * ca * w + by * sa * th;
        var oz = rz * ca * w + bz * sa * th;

        pos.set(p.x + ox, p.y + oy, p.z + oz);
        verts.push(pos.x, pos.y, pos.z);

        /* Smooth elliptical normal */
        var nx = rx * ca / Math.max(0.04, w) + bx * sa / Math.max(0.04, th);
        var ny = ry * ca / Math.max(0.04, w) + by * sa / Math.max(0.04, th);
        var nz = rz * ca / Math.max(0.04, w) + bz * sa / Math.max(0.04, th);
        nrm.set(nx, ny, nz).normalize();
        norms.push(nrm.x, nrm.y, nrm.z);

        uvs.push(u, v);
      }
    }

    var row = radialSegs + 1;
    for (var ii = 0; ii < tubularSegs; ii++) {
      for (var jj = 0; jj < radialSegs; jj++) {
        var aIdx = ii * row + jj;
        var bIdx = (ii + 1) * row + jj;
        var cIdx = (ii + 1) * row + (jj + 1);
        var dIdx = ii * row + (jj + 1);
        indices.push(aIdx, bIdx, dIdx);
        indices.push(bIdx, cIdx, dIdx);
      }
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    return geom;
  }

  /* Custom Glossy Translucent Liquid Ribbon Shader */
  var RIBBON_VERT = [
    'uniform float uTime;',
    'uniform float uSpeed;',
    'uniform float uPhase;',
    'uniform float uWaveAmp;',
    'uniform vec2  uMouse;',
    'varying vec3 vNormalW;',
    'varying vec3 vViewDir;',
    'varying vec2 vUv;',
    'varying float vWave;',
    'void main() {',
    '  vUv = uv;',
    '  float t = uTime * uSpeed + uPhase;',
    '  float env = sin(uv.x * 3.14159265);',
    '  float w1 = sin(uv.x * 7.2 - t * 1.45 + uv.y * 2.2);',
    '  float w2 = cos(uv.x * 4.5 + t * 1.05 - uv.y * 3.1);',
    '  float w3 = sin(uv.x * 11.0 - t * 1.9);',
    '  float disp = (w1 * 0.58 + w2 * 0.30 + w3 * 0.12) * uWaveAmp * env;',
    '  vWave = w1 * 0.5 + 0.5;',
    '  vec3 pos = position + normal * disp;',
    '  pos.x += sin(uv.x * 4.2 + t * 0.85) * 0.24 * env + uMouse.x * 0.32 * env;',
    '  pos.y += cos(uv.x * 3.6 - t * 0.78) * 0.22 * env + uMouse.y * 0.28 * env;',
    '  vec3 pertN = normalize(normal + vec3(w2 * 0.14, w1 * 0.14, w3 * 0.08));',
    '  vec4 worldPos = modelMatrix * vec4(pos, 1.0);',
    '  vNormalW = normalize(mat3(modelMatrix) * pertN);',
    '  vViewDir = normalize(cameraPosition - worldPos.xyz);',
    '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
    '}'
  ].join('\n');

  var RIBBON_FRAG = [
    'uniform float uTime;',
    'uniform float uPhase;',
    'uniform float uOpacity;',
    'uniform vec3  uColA;',
    'uniform vec3  uColB;',
    'uniform vec3  uColC;',
    'varying vec3 vNormalW;',
    'varying vec3 vViewDir;',
    'varying vec2 vUv;',
    'varying float vWave;',
    'void main() {',
    '  vec3 N = normalize(vNormalW);',
    '  if (!gl_FrontFacing) N = -N;',
    '  vec3 V = normalize(vViewDir);',
    '  vec3 L1 = normalize(vec3(-0.48, 0.72, 0.65));',
    '  vec3 L2 = normalize(vec3(0.65, -0.35, 0.55));',
    '  vec3 H1 = normalize(L1 + V);',
    '  vec3 H2 = normalize(L2 + V);',
    '',
    '  /* Slow continuous gradient shift along ribbon length */',
    '  float gShift = clamp(vUv.x + 0.14 * sin(uTime * 0.45 + uPhase + vUv.y * 3.14159), 0.0, 1.0);',
    '  vec3 baseCol = mix(uColA, uColB, smoothstep(0.0, 0.58, gShift));',
    '  baseCol = mix(baseCol, uColC, smoothstep(0.45, 1.0, gShift));',
    '  baseCol = mix(baseCol, uColC, vWave * 0.16);',
    '',
    '  /* Studio diffuse + soft subsurface glow */',
    '  float diff1 = max(dot(N, L1), 0.0);',
    '  float diff2 = max(dot(N, L2), 0.0);',
    '  float wrap = 0.55 + 0.45 * diff1 + 0.22 * diff2;',
    '',
    '  /* Glossy Fresnel glass rim */',
    '  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5);',
    '',
    '  /* Dual crisp specular reflections */',
    '  float spec1 = pow(max(dot(N, H1), 0.0), 46.0);',
    '  float spec2 = pow(max(dot(N, H2), 0.0), 16.0);',
    '',
    '  vec3 col = baseCol * wrap;',
    '  col += vec3(0.082, 0.851, 0.949) * fresnel * 0.62;',
    '  col += vec3(0.741, 0.922, 1.000) * spec2 * 0.34;',
    '  col += vec3(0.96, 0.99, 1.00) * spec1 * 0.85;',
    '',
    '  /* Soft tip fade & glassy translucent alpha */',
    '  float tipFade = smoothstep(0.0, 0.10, vUv.x) * smoothstep(1.0, 0.90, vUv.x);',
    '  float alpha = clamp((uOpacity + fresnel * 0.28 + spec1 * 0.25) * tipFade, 0.0, 0.96);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  /* Palette Colors (Brand Hex -> THREE.Color) */
  var C_NAVY     = new THREE.Color(0x061B49);
  var C_ROYAL    = new THREE.Color(0x0757C8);
  var C_ELECTRIC = new THREE.Color(0x168BFF);
  var C_CYAN     = new THREE.Color(0x15D9F2);
  var C_ICE      = new THREE.Color(0xBDEBFF);
  var C_WHITE    = new THREE.Color(0xF4FAFF);

  /* Build 4 Sculpted Layered Liquid Ribbons (Different Depths, Sizes & Speeds; Sweeping into Center!) */
  var ribbonConfigs = [
    {
      /* Back Deep-Navy -> Royal Blue sweeping wave extending smoothly behind center */
      points: [
        new THREE.Vector3(-2.6, -2.5, -2.6),
        new THREE.Vector3(-0.3,  0.4, -2.0),
        new THREE.Vector3( 2.2,  2.1, -1.6),
        new THREE.Vector3( 4.9,  1.2, -2.2),
        new THREE.Vector3( 6.6, -1.5, -2.5)
      ],
      width: 1.08, thickness: 0.24, twist: 0.72, speed: 0.36, phase: 0.0, waveAmp: 0.20,
      colA: C_NAVY, colB: C_ROYAL, colC: C_ELECTRIC, opacity: 0.68, depthFactor: 0.45, scrollFactor: 0.55
    },
    {
      /* Primary Centerpiece Liquid Ribbon: Sculpted 3D Vortex S-Curve */
      points: [
        new THREE.Vector3(-1.4,  2.8, -0.4),
        new THREE.Vector3( 0.9,  1.6,  0.6),
        new THREE.Vector3( 2.8,  0.1,  1.0),
        new THREE.Vector3( 1.9, -1.8,  0.2),
        new THREE.Vector3( 4.3, -2.4, -0.5),
        new THREE.Vector3( 6.4, -0.2,  0.3)
      ],
      width: 0.96, thickness: 0.20, twist: 1.15, speed: 0.48, phase: 1.6, waveAmp: 0.24,
      colA: C_ROYAL, colB: C_ELECTRIC, colC: C_CYAN, opacity: 0.78, depthFactor: 0.85, scrollFactor: 0.95
    },
    {
      /* Mid-Foreground Glossy Cyan / Turquoise Weaving Ribbon */
      points: [
        new THREE.Vector3(-2.0, -0.8,  0.5),
        new THREE.Vector3( 0.5, -1.9,  1.2),
        new THREE.Vector3( 3.1, -0.6,  1.5),
        new THREE.Vector3( 4.2,  1.6,  0.9),
        new THREE.Vector3( 1.9,  3.1,  0.4),
        new THREE.Vector3( 5.8,  2.9, -0.2)
      ],
      width: 0.74, thickness: 0.16, twist: 1.38, speed: 0.60, phase: 3.1, waveAmp: 0.22,
      colA: C_ELECTRIC, colB: C_CYAN, colC: C_ICE, opacity: 0.72, depthFactor: 1.15, scrollFactor: 1.25
    },
    {
      /* Foreground Delicate Luminous Ice-Blue Silk Ribbon */
      points: [
        new THREE.Vector3(-0.6,  3.2,  1.1),
        new THREE.Vector3( 1.6,  1.0,  1.8),
        new THREE.Vector3( 3.9, -0.3,  2.0),
        new THREE.Vector3( 5.2, -2.3,  1.3),
        new THREE.Vector3( 2.8, -3.4,  0.7)
      ],
      width: 0.46, thickness: 0.11, twist: 1.65, speed: 0.72, phase: 4.5, waveAmp: 0.18,
      colA: C_CYAN, colB: C_ICE, colC: C_WHITE, opacity: 0.64, depthFactor: 1.45, scrollFactor: 1.55
    }
  ];

  var ribbons = [];
  ribbonConfigs.forEach(function (cfg) {
    var geom = createLiquidRibbonGeometry(cfg.points, cfg.width, cfg.thickness, 150, 32, cfg.twist);
    var mat = new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERT,
      fragmentShader: RIBBON_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime:    { value: 0 },
        uSpeed:   { value: cfg.speed },
        uPhase:   { value: cfg.phase },
        uWaveAmp: { value: cfg.waveAmp },
        uOpacity: { value: cfg.opacity },
        uMouse:   { value: new THREE.Vector2(0, 0) },
        uColA:    { value: cfg.colA },
        uColB:    { value: cfg.colB },
        uColC:    { value: cfg.colC }
      }
    });
    var mesh = new THREE.Mesh(geom, mat);
    rootGroup.add(mesh);
    ribbons.push({ mesh: mesh, mat: mat, cfg: cfg });
  });

  /* ---------- 4. Floating Translucent 3D Glass Spheres (Glass Droplets) ---------- */
  var GLASS_VERT = [
    'varying vec3 vNormalW;',
    'varying vec3 vViewDir;',
    'void main() {',
    '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
    '  vNormalW = normalize(mat3(modelMatrix) * normal);',
    '  vViewDir = normalize(cameraPosition - worldPos.xyz);',
    '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
    '}'
  ].join('\n');

  var GLASS_FRAG = [
    'uniform vec3 uTint;',
    'uniform float uTime;',
    'varying vec3 vNormalW;',
    'varying vec3 vViewDir;',
    'void main() {',
    '  vec3 N = normalize(vNormalW);',
    '  vec3 V = normalize(vViewDir);',
    '  vec3 L1 = normalize(vec3(-0.55, 0.72, 0.68));',
    '  vec3 L2 = normalize(vec3(0.55, -0.50, 0.55));',
    '  vec3 H1 = normalize(L1 + V);',
    '  vec3 H2 = normalize(L2 + V);',
    '  float ndv = clamp(dot(N, V), 0.0, 1.0);',
    '  float fresnel = pow(1.0 - ndv, 2.35);',
    '  float spec1 = pow(max(dot(N, H1), 0.0), 72.0);',
    '  float spec2 = pow(max(dot(N, H2), 0.0), 22.0);',
    '  float innerRefract = smoothstep(0.15, 0.95, max(dot(-N, L1), 0.0));',
    '  vec3 col = mix(uTint, vec3(0.741, 0.922, 1.000), innerRefract * 0.48 + 0.12 * sin(uTime * 0.7));',
    '  col += vec3(0.082, 0.851, 0.949) * fresnel * 0.78;',
    '  col += vec3(0.74, 0.92, 1.0) * spec2 * 0.42;',
    '  col += vec3(1.0) * spec1 * 0.96;',
    '  float alpha = clamp(0.18 + fresnel * 0.68 + spec1 * 0.55 + innerRefract * 0.14, 0.0, 0.94);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var sphereSpecs = [
    { x:  0.15, y:  2.05, z:  1.8, r: 0.46, tint: C_CYAN,     pull: 0.62, amp: 0.30, spd: 0.78, ph: 0.4 },
    { x:  4.55, y:  2.35, z:  1.1, r: 0.64, tint: C_ELECTRIC, pull: 0.36, amp: 0.26, spd: 0.62, ph: 1.5 },
    { x:  2.55, y:  0.45, z:  2.4, r: 0.32, tint: C_ICE,      pull: 0.85, amp: 0.34, spd: 0.95, ph: 2.3 },
    { x:  5.45, y: -0.95, z:  1.5, r: 0.54, tint: C_CYAN,     pull: 0.48, amp: 0.28, spd: 0.68, ph: 3.6 },
    { x:  0.95, y: -2.10, z:  2.1, r: 0.36, tint: C_ICE,      pull: 0.78, amp: 0.32, spd: 0.88, ph: 4.2 },
    { x: -1.15, y:  0.55, z:  1.4, r: 0.26, tint: C_CYAN,     pull: 0.92, amp: 0.24, spd: 1.02, ph: 5.1 },
    { x:  3.65, y: -2.45, z: -0.6, r: 0.72, tint: C_ROYAL,    pull: 0.28, amp: 0.22, spd: 0.52, ph: 2.9 }
  ];

  var sphereGeom = new THREE.SphereGeometry(1, 32, 32);
  var spheres = [];
  sphereSpecs.forEach(function (sp) {
    var sMat = new THREE.ShaderMaterial({
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTint: { value: sp.tint },
        uTime: { value: 0 }
      }
    });
    var mesh = new THREE.Mesh(sphereGeom, sMat);
    mesh.scale.setScalar(sp.r);
    mesh.position.set(sp.x, sp.y, sp.z);
    rootGroup.add(mesh);
    spheres.push({ mesh: mesh, mat: sMat, sp: sp });
  });

  /* ---------- 5. Subtle Glowing Atmospheric Micro-Particles ---------- */
  var PARTICLE_COUNT = 54;
  var pPos = new Float32Array(PARTICLE_COUNT * 3);
  var pBase = new Float32Array(PARTICLE_COUNT * 3);
  var pSeeds = new Float32Array(PARTICLE_COUNT);
  var pSizes = new Float32Array(PARTICLE_COUNT);
  for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
    var px = -2.2 + Math.random() * 9.2;
    var py = -3.6 + Math.random() * 7.2;
    var pz = -2.0 + Math.random() * 4.5;
    pBase[pi * 3]     = px;
    pBase[pi * 3 + 1] = py;
    pBase[pi * 3 + 2] = pz;
    pPos[pi * 3]      = px;
    pPos[pi * 3 + 1]  = py;
    pPos[pi * 3 + 2]  = pz;
    pSeeds[pi] = Math.random() * Math.PI * 2;
    pSizes[pi] = 6.0 + Math.random() * 14.0;
  }

  var pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeom.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
  pGeom.setAttribute('aSeed', new THREE.BufferAttribute(pSeeds, 1));

  var pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:  { value: 0 },
      uDpr:   { value: Math.min(1.75, window.devicePixelRatio || 1) },
      uCol1:  { value: C_CYAN },
      uCol2:  { value: C_ICE }
    },
    vertexShader: [
      'attribute float aSize;',
      'attribute float aSeed;',
      'uniform float uTime;',
      'uniform float uDpr;',
      'varying float vTwinkle;',
      'varying float vSeed;',
      'void main() {',
      '  vSeed = aSeed;',
      '  vTwinkle = 0.52 + 0.48 * sin(uTime * 1.4 + aSeed * 3.0);',
      '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = aSize * uDpr * (9.5 / max(2.0, -mvPos.z));',
      '  gl_Position = projectionMatrix * mvPos;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uCol1;',
      'uniform vec3 uCol2;',
      'varying float vTwinkle;',
      'varying float vSeed;',
      'void main() {',
      '  float d = length(gl_PointCoord - vec2(0.5));',
      '  if (d > 0.5) discard;',
      '  float glow = pow(1.0 - d * 2.0, 2.2);',
      '  vec3 c = mix(uCol1, uCol2, fract(vSeed));',
      '  gl_FragColor = vec4(c, glow * vTwinkle * 0.65);',
      '}'
    ].join('\n')
  });
  var particles = new THREE.Points(pGeom, pMat);
  rootGroup.add(particles);

  /* ---------- 6. Responsive Layout Positioning & Resize ---------- */
  function handleResize() {
    var r = hero.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var w = r.width, h = r.height;
    var dpr = Math.min(1.75, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uDpr.value = dpr;

    /* Position sculpture cleanly in right-center on desktop, balanced backdrop on mobile */
    if (w < 860) {
      rootGroup.position.set(-1.3, -0.5, -1.6);
      rootGroup.scale.setScalar(0.76);
    } else if (w < 1180) {
      rootGroup.position.set(0.3, 0.0, -0.6);
      rootGroup.scale.setScalar(0.92);
    } else {
      rootGroup.position.set(0.95, 0.05, 0.0);
      rootGroup.scale.setScalar(1.06);
    }
  }
  handleResize();
  window.addEventListener('resize', handleResize, { passive: true });
  window.__vxHeroResize = handleResize;

  /* Pause WebGL rendering when Hero is off-screen or hidden */
  var isInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { isInView = entry.isIntersecting; });
    }, { threshold: 0.02 }).observe(hero);
  }

  /* ---------- 7. Continuous Organic 60 FPS Render Loop ---------- */
  var simTime = 0, lastT = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    var beranda = document.getElementById('beranda');
    if (!isInView || document.hidden || (beranda && beranda.hidden)) {
      lastT = now;
      return;
    }

    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;

    /* Smooth spring-damped mouse tracking (never twitchy) */
    var mEase = 1.0 - Math.pow(0.004, dt);
    pointer.x += (pointer.tx - pointer.x) * mEase;
    pointer.y += (pointer.ty - pointer.y) * mEase;

    simTime += dt * (reduced ? 0.16 : 1.0);

    /* Subtle whole-sculpture breathing tilt + mouse response */
    var targetRotY = pointer.x * 0.18 + Math.sin(simTime * 0.28) * 0.06;
    var targetRotX = -pointer.y * 0.12 + Math.cos(simTime * 0.24) * 0.04;
    rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
    rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;

    /* Animate each of the 4 liquid ribbons with distinct depth parallax & scroll exit */
    for (var i = 0; i < ribbons.length; i++) {
      var rb = ribbons[i];
      var cfg = rb.cfg;
      rb.mat.uniforms.uTime.value = simTime;
      rb.mat.uniforms.uMouse.value.set(pointer.x * cfg.depthFactor, pointer.y * cfg.depthFactor);
      rb.mesh.position.x = pointer.x * 0.34 * cfg.depthFactor;
      rb.mesh.position.y = pointer.y * 0.24 * cfg.depthFactor + scrollProg * 2.4 * cfg.scrollFactor;
      rb.mesh.rotation.z = Math.sin(simTime * 0.22 + cfg.phase) * 0.055;
    }

    /* Animate 7 floating translucent glass spheres (float + light rotation + soft cursor attraction) */
    for (var s = 0; s < spheres.length; s++) {
      var obj = spheres[s];
      var sp = obj.sp;
      obj.mat.uniforms.uTime.value = simTime;
      var bobY = Math.sin(simTime * sp.spd + sp.ph) * sp.amp;
      var bobX = Math.cos(simTime * (sp.spd * 0.8) + sp.ph) * (sp.amp * 0.55);
      obj.mesh.position.x = sp.x + bobX + pointer.x * sp.pull;
      obj.mesh.position.y = sp.y + bobY + pointer.y * sp.pull + scrollProg * (1.8 + sp.pull * 2.2);
      obj.mesh.rotation.y = simTime * 0.35 + sp.ph;
      obj.mesh.rotation.x = simTime * 0.22;
    }

    /* Animate 54 subtle glowing micro-particles */
    pMat.uniforms.uTime.value = simTime;
    var arr = pGeom.attributes.position.array;
    for (var k = 0; k < PARTICLE_COUNT; k++) {
      var seed = pSeeds[k];
      arr[k * 3]     = pBase[k * 3]     + Math.sin(simTime * 0.45 + seed) * 0.35 + pointer.x * 0.42;
      arr[k * 3 + 1] = pBase[k * 3 + 1] + Math.cos(simTime * 0.38 + seed * 1.4) * 0.32 + scrollProg * 2.2;
      arr[k * 3 + 2] = pBase[k * 3 + 2] + Math.sin(simTime * 0.30 + seed * 0.7) * 0.22;
    }
    pGeom.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
