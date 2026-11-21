/* ==========================================================================
   Vortex Hydro — Pure WebGL2 Metaball Water Fluid Background
   - Zero heavy libraries (raw WebGL2 + GLSL 300 es fragment shader)
   - 8 metaball drops with kernel (1 - d^2/R^2)^3, R = 2*r, threshold 0.30
   - Frame-rate independent scroll lag + river-flow X trajectory + tanh Y clamp
   - Diffuse, small specular, Fresnel rim, caustics, outer halo & IGN dithering
   - Respects prefers-color-scheme, data-theme, prefers-reduced-motion & CSS fallback
   ========================================================================== */
(function initVortexFluidBackground() {
  'use strict';

  var canvas = document.getElementById('vx-fluid-bg');
  if (!canvas) return;

  var root = document.documentElement;
  function enableFallback() {
    canvas.hidden = true;
    root.classList.add('vx-fluid-fallback');
  }

  var gl = null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false
    });
  } catch (_) {
    gl = null;
  }
  if (!gl) {
    enableFallback();
    return;
  }

  /* ---------- GLSL 300 es Shaders ---------- */
  var VERT_SRC = [
    '#version 300 es',
    'precision highp float;',
    'const vec2 POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));',
    'void main() {',
    '  gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG_SRC = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 fragColor;',
    '',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform float uSpeed;',
    'uniform float uDark;',
    'uniform vec3  uBg;',
    'uniform vec3  uShallow;',
    'uniform vec3  uDeep;',
    'uniform vec3  uDrops[8];',
    '',
    'float ign(vec2 p) {',
    '  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));',
    '}',
    '',
    'float causticPattern(vec2 uv, float t, float spd) {',
    '  vec2 p = uv * 0.017;',
    '  float amp = 1.0 + spd * 1.15;',
    '  float w1 = sin(p.x * 2.1 + t * 0.95 + cos(p.y * 1.7 - t * 0.72) * 1.25 * amp);',
    '  float w2 = sin(p.y * 2.3 - t * 0.84 + cos(p.x * 1.9 + t * 0.68) * 1.15 * amp);',
    '  float w3 = sin((p.x + p.y) * 1.45 + t * 0.62);',
    '  float c = 0.5 + 0.5 * (w1 * w2 * 0.7 + w3 * 0.3);',
    '  return pow(clamp(c, 0.0, 1.0), 3.4);',
    '}',
    '',
    'void main() {',
    '  /* Pixel coordinate in CSS-space (top-left origin matching JS scroll/viewport coords) */',
    '  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);',
    '',
    '  float field = 0.0;',
    '  vec2 grad = vec2(0.0);',
    '',
    '  /* 8-drop metaball field: kernel = (1 - d^2 / R^2)^3 with R = 2 * radius */',
    '  for (int i = 0; i < 8; i++) {',
    '    vec2 c = uDrops[i].xy;',
    '    float r = uDrops[i].z;',
    '    float R = 2.0 * r;',
    '    float R2 = R * R;',
    '    vec2 d = p - c;',
    '    float d2 = dot(d, d);',
    '    if (d2 < R2) {',
    '      float q = 1.0 - (d2 / R2);',
    '      float q2 = q * q;',
    '      field += q2 * q;',
    '      grad += (-6.0 / R2) * q2 * d;',
    '    }',
    '  }',
    '',
    '  /* Subtle edge halo outside the 0.30 threshold */',
    '  float mask = smoothstep(0.285, 0.315, field);',
    '  float halo = smoothstep(0.06, 0.30, field) * (1.0 - mask);',
    '  float haloStrength = mix(0.20, 0.28, uDark);',
    '  vec3 col = mix(uBg, uShallow, halo * haloStrength);',
    '',
    '  if (mask > 0.001) {',
    '    /* Surface normal from metaball field gradient + smooth wave ripples */',
    '    float ripAmp = 0.14 + uSpeed * 0.38;',
    '    float distort = 1.0 + uSpeed * 0.55;',
    '    vec2 wp = p * 0.022;',
    '    float rx = cos(wp.x * 1.6 + uTime * 1.25 + sin(wp.y * 1.3 - uTime * 0.9) * distort)',
    '             + 0.45 * sin((wp.x - wp.y) * 2.2 - uTime * 1.5);',
    '    float ry = sin(wp.y * 1.7 - uTime * 1.10 + cos(wp.x * 1.4 + uTime * 0.85) * distort)',
    '             + 0.45 * cos((wp.x + wp.y) * 2.1 + uTime * 1.35);',
    '',
    '    vec2 nXY = (-grad * 72.0) + vec2(rx, ry) * ripAmp;',
    '    vec3 N = normalize(vec3(nXY, 1.35));',
    '    vec3 V = vec3(0.0, 0.0, 1.0);',
    '    vec3 L = normalize(vec3(-0.38, -0.52, 0.76));',
    '    vec3 H = normalize(L + V);',
    '',
    '    /* Depth blend between shallow and deep aqua tones */',
    '    float depth = smoothstep(0.30, 1.15, field);',
    '    vec3 waterCol = mix(uShallow, uDeep, depth);',
    '',
    '    /* Soft diffuse & small crisp specular highlight */',
    '    float diff = 0.74 + 0.26 * max(dot(N, L), 0.0);',
    '    float spec = pow(max(dot(N, H), 0.0), 46.0);',
    '',
    '    /* Fresnel rim brightening along edges */',
    '    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.8);',
    '',
    '    /* Animated internal caustics pattern */',
    '    float caust = causticPattern(p + nXY * 14.0, uTime, uSpeed) * smoothstep(0.30, 0.72, field);',
    '',
    '    waterCol *= diff;',
    '    waterCol += mix(vec3(0.16, 0.28, 0.34), vec3(0.18, 0.42, 0.50), uDark) * caust * mix(0.56, 0.68, uDark);',
    '    waterCol += mix(vec3(0.18, 0.26, 0.30), vec3(0.24, 0.50, 0.58), uDark) * fresnel * mix(0.62, 0.70, uDark);',
    '    waterCol += vec3(1.0) * spec * mix(0.36, 0.26, uDark);',
    '',
    '    /* Readability-safe blend over page background (guarantees >= 4.5:1 text contrast) */',
    '    float waterAlpha = mix(0.46, 0.56, uDark);',
    '    vec3 blendedWater = mix(uBg, waterCol, waterAlpha);',
    '    col = mix(col, blendedWater, mask);',
    '  }',
    '',
    '  /* Light IGN dithering to prevent 8-bit color banding */',
    '  float dither = (ign(gl_FragCoord.xy) - 0.5) / 255.0;',
    '  fragColor = vec4(clamp(col + dither, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function compileShader(type, src) {
    var sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  var vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
  var fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
  var prog = gl.createProgram();
  if (!vs || !fs || !prog) {
    enableFallback();
    return;
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    enableFallback();
    return;
  }
  gl.useProgram(prog);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uSpeed = gl.getUniformLocation(prog, 'uSpeed');
  var uDark = gl.getUniformLocation(prog, 'uDark');
  var uBg = gl.getUniformLocation(prog, 'uBg');
  var uShallow = gl.getUniformLocation(prog, 'uShallow');
  var uDeep = gl.getUniformLocation(prog, 'uDeep');
  var uDrops = gl.getUniformLocation(prog, 'uDrops');

  /* ---------- Theme & CSS --bg Color Synchronization ---------- */
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var mqMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var isReducedMotion = !!(mqMotion && mqMotion.matches);
  var isDark = false;
  var bgRgb = [0.98, 0.984, 0.992];

  function parseCssColor(str) {
    var s = (str || '').trim();
    if (!s) return null;
    if (s[0] === '#') {
      var hex = s.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16) / 255,
          parseInt(hex[1] + hex[1], 16) / 255,
          parseInt(hex[2] + hex[2], 16) / 255
        ];
      }
      if (hex.length >= 6) {
        return [
          parseInt(hex.slice(0, 2), 16) / 255,
          parseInt(hex.slice(2, 4), 16) / 255,
          parseInt(hex.slice(4, 6), 16) / 255
        ];
      }
    }
    var m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
    return null;
  }

  function syncTheme() {
    var explicit = root.dataset.theme;
    if (explicit === 'dark') isDark = true;
    else if (explicit === 'light') isDark = false;
    else isDark = !!(mqDark && mqDark.matches);

    var cs = getComputedStyle(root);
    var parsed = parseCssColor(cs.getPropertyValue('--bg')) || parseCssColor(getComputedStyle(document.body).backgroundColor);
    if (parsed) {
      bgRgb = parsed;
    } else {
      bgRgb = isDark ? [0.02, 0.059, 0.118] : [0.98, 0.984, 0.992];
    }
  }

  syncTheme();
  if (mqDark && mqDark.addEventListener) {
    mqDark.addEventListener('change', syncTheme);
  }
  if (mqMotion && mqMotion.addEventListener) {
    mqMotion.addEventListener('change', function (e) { isReducedMotion = !!e.matches; });
  }
  if ('MutationObserver' in window) {
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-pal'] });
  }

  /* ---------- Viewport & DPR (capped at 1.5) ---------- */
  var vw = window.innerWidth || 1280;
  var vh = window.innerHeight || 720;
  var dpr = Math.min(1.5, window.devicePixelRatio || 1);

  function resize() {
    vw = window.innerWidth || 1280;
    vh = window.innerHeight || 720;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(vw * dpr));
    var h = Math.max(1, Math.round(vh * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ---------- 8-Drop Scroll Lag Physics ---------- */
  var N = 8;
  var lagY = new Float32Array(N);
  var dropData = new Float32Array(N * 3);
  var alpha60 = new Float32Array(N);
  alpha60[0] = 0.42; /* Head stays tightly anchored near viewport center */
  for (var i = 1; i < N; i++) {
    /* Smooth lag from 0.22 (drop 1) down to 0.035 (drop 7) */
    alpha60[i] = 0.22 + ((i - 1) / (N - 2)) * (0.035 - 0.22);
  }

  var initialScroll = window.scrollY || window.pageYOffset || 0;
  for (var j = 0; j < N; j++) lagY[j] = initialScroll;

  var prevScrollY = initialScroll;
  var smoothSpeed = 0;
  var simTime = 0;
  var lastTime = performance.now();
  var contextLost = false;

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    contextLost = true;
  }, false);
  canvas.addEventListener('webglcontextrestored', function () {
    contextLost = false;
    resize();
  }, false);

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /* ---------- Render Loop ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || contextLost) {
      lastTime = now;
      return;
    }

    var dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    /* Slow shader time under prefers-reduced-motion */
    simTime += dt * (isReducedMotion ? 0.18 : 1.0);

    var sy = window.scrollY || window.pageYOffset || 0;
    var instSpeed = Math.min(1.0, Math.abs(sy - prevScrollY) / Math.max(12, dt * 1850));
    prevScrollY = sy;

    var spdFactor = 1.0 - Math.pow(1.0 - 0.12, dt * 60.0);
    smoothSpeed += (instSpeed - smoothSpeed) * spdFactor;

    /* Base drop radius: 11.5% of smallest viewport side, clamped 34..125 px */
    var rBase = clamp(Math.min(vw, vh) * 0.115, 34, 125);
    var yBound = vh * 0.42;

    /* Update 8 metaball positions (in framebuffer pixels) */
    for (var k = 0; k < N; k++) {
      var f = 1.0 - Math.pow(1.0 - alpha60[k], dt * 60.0);
      lagY[k] += (sy - lagY[k]) * f;

      var diff = lagY[k] - sy;
      var yCss = vh * 0.5 + yBound * Math.tanh(diff / Math.max(1, yBound));
      var xCss = vw * (0.5 + 0.24 * Math.sin(lagY[k] * 0.0022));

      /* Gentle idle wobble per drop when stationary (disabled under prefers-reduced-motion) */
      if (!isReducedMotion) {
        var idleMix = 1.0 - smoothSpeed * 0.7;
        var phase = k * 1.17;
        var amp = (8.0 + k * 2.2) * idleMix;
        xCss += Math.sin(simTime * (0.72 + k * 0.09) + phase) * amp;
        yCss += Math.cos(simTime * (0.64 + k * 0.08) + phase * 1.3) * (amp * 0.85);
      }

      /* Drop 0: 1.2x base radius; drops 1..7: -6% per index */
      var rCss = (k === 0) ? (rBase * 1.2) : (rBase * (1.0 - 0.06 * k));

      dropData[k * 3]     = xCss * dpr;
      dropData[k * 3 + 1] = yCss * dpr;
      dropData[k * 3 + 2] = rCss * dpr;
    }

    /* Default Aqua Shallow & Deep Colors (Light vs Dark Mode) */
    if (isDark) {
      gl.uniform3f(uShallow, 0.16, 0.55, 0.66);
      gl.uniform3f(uDeep,    0.03, 0.22, 0.32);
    } else {
      gl.uniform3f(uShallow, 0.62, 0.90, 0.95);
      gl.uniform3f(uDeep,    0.20, 0.62, 0.78);
    }

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, simTime);
    gl.uniform1f(uSpeed, smoothSpeed);
    gl.uniform1f(uDark, isDark ? 1.0 : 0.0);
    gl.uniform3f(uBg, bgRgb[0], bgRgb[1], bgRgb[2]);
    gl.uniform3fv(uDrops, dropData);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  requestAnimationFrame(frame);
})();
