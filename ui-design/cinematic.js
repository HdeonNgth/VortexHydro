    window.addEventListener('load', function () {
      'use strict';

      // =========================================================================
      // CINEMATIC SETUP — opsi lewat URL: ?ui=0 ?titles=0 ?bars=1 ?exp=1.15 ?bloom=0.55 ?speed=1 ?autoplay=0
      // =========================================================================
      const Q = new URLSearchParams(location.search);
      const qNum = (k, d) => { const v = parseFloat(Q.get(k)); return isFinite(v) ? v : d; };
      const OPT = {
        ui: Q.get('ui') !== '0',
        titles: Q.get('titles') !== '0',
        bars: Q.get('bars') === '1',
        exposure: qNum('exp', 0.85),
        bloom: qNum('bloom', 0.30),
        speed: qNum('speed', 1),
        autoplay: Q.get('autoplay') !== '0'
      };

      const stage = document.getElementById('stage');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.02, 80);

      const isTouch = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
      let pixelRatio = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 1.75);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true // supaya canvas bisa direkam jadi video
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x03070d, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.NoToneMapping; // tone mapping dikerjakan di pass grading
      stage.appendChild(renderer.domElement);

      // ---- Pencahayaan ala studio sinematik: key hangat, rim cyan, backlight amber ----
      const hemiLight = new THREE.HemisphereLight(0x9ec8ff, 0x0a1018, 0.45);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffd7ad, 1.25);
      keyLight.position.set(2.5, 4.6, 2.8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 14;
      const shadowBound = 2.2;
      keyLight.shadow.camera.left = -shadowBound;
      keyLight.shadow.camera.right = shadowBound;
      keyLight.shadow.camera.top = shadowBound;
      keyLight.shadow.camera.bottom = -shadowBound;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      const rimCyan = new THREE.DirectionalLight(0x38bdf8, 1.0);
      rimCyan.position.set(-3.0, 2.4, -2.6);
      scene.add(rimCyan);

      const rimAmber = new THREE.DirectionalLight(0xff9a4d, 0.8);
      rimAmber.position.set(3.2, 2.0, -3.0);
      scene.add(rimAmber);

      const fillCool = new THREE.DirectionalLight(0x7aa8ff, 0.4);
      fillCool.position.set(-2.4, 1.6, 3.2);
      scene.add(fillCool);

      // ---- Langit/latar: gradient shader dengan cahaya hangat di belakang ----
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vDir;
          uniform float uTime;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 zenith  = vec3(0.006, 0.014, 0.030);
            vec3 horizon = vec3(0.020, 0.085, 0.120);
            vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.5));
            col = mix(col, vec3(0.008, 0.020, 0.030), smoothstep(0.0, -0.35, h));
            float warm = pow(max(dot(d, normalize(vec3(0.45, 0.12, -0.88))), 0.0), 9.0);
            float cool = pow(max(dot(d, normalize(vec3(-0.85, 0.18, 0.35))), 0.0), 7.0);
            col += vec3(1.0, 0.50, 0.20) * warm * 0.50;
            col += vec3(0.10, 0.55, 0.95) * cool * 0.30;
            col += vec3(0.04, 0.10, 0.14) * exp(-abs(h) * 14.0) * (0.85 + 0.15 * sin(uTime * 0.3));
            gl_FragColor = vec4(col, 1.0);
          }`
      });
      const skyDome = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 20), skyMat);
      skyDome.renderOrder = -10;
      scene.add(skyDome);

      // ---- Lantai: kolam cahaya + grid tipis yang memudar ----
      const floorMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        extensions: { derivatives: true },
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec3 vW;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: `
          varying vec3 vW;
          uniform float uTime;
          void main() {
            float r = length(vW.xz);
            float pool = exp(-r * r * 0.30);
            vec3 col = vec3(0.012, 0.028, 0.040) + vec3(0.020, 0.115, 0.155) * pool;
            vec2 g = vW.xz * 5.0;
            vec2 gr = abs(fract(g - 0.5) - 0.5) / fwidth(g);
            float line = 1.0 - min(min(gr.x, gr.y), 1.0);
            float fade = smoothstep(6.0, 0.6, r);
            col += vec3(0.10, 0.50, 0.72) * line * 0.20 * fade;
            float ring = smoothstep(0.02, 0.0, abs(fract(r * 0.5 - uTime * 0.03) - 0.5) - 0.48) * 0.05 * fade;
            col += vec3(0.1, 0.5, 0.7) * ring;
            gl_FragColor = vec4(col, smoothstep(9.0, 3.0, r));
          }`
      });
      const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(10, 64), floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.renderOrder = -5;
      scene.add(floorMesh);

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.ShadowMaterial({ opacity: 0.6 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.002;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // ---- Sorot cahaya volumetrik palsu (god rays) ----
      const beamMats = [];
      function makeBeam(src, dst, color, strength) {
        const dir = new THREE.Vector3().subVectors(src, dst);
        const len = dir.length();
        const geo = new THREE.CylinderGeometry(0.10, 1.25, len, 36, 1, true);
        const mat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uStrength: { value: strength },
            uTime: { value: 0 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vW;
            void main() {
              vUv = uv;
              vec4 w = modelMatrix * vec4(position, 1.0);
              vW = w.xyz;
              gl_Position = projectionMatrix * viewMatrix * w;
            }`,
          fragmentShader: `
            varying vec2 vUv;
            varying vec3 vW;
            uniform vec3 uColor;
            uniform float uStrength;
            uniform float uTime;
            void main() {
              float along = vUv.y;                       // 1 = sumber, 0 = ujung
              float a = pow(along, 1.4) * (1.0 - pow(1.0 - along, 8.0));
              float streak = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 0.6);
              float camFade = smoothstep(1.2, 4.2, distance(cameraPosition, vW));
              float groundFade = smoothstep(0.0, 0.8, vW.y);
              float flick = 0.92 + 0.08 * sin(uTime * 1.3 + vUv.x * 6.0);
              gl_FragColor = vec4(uColor, a * streak * camFade * groundFade * uStrength * flick);
            }`
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(src).add(dst).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        m.renderOrder = 5;
        scene.add(m);
        beamMats.push(mat);
      }
      makeBeam(new THREE.Vector3(-2.4, 4.8, 2.3), new THREE.Vector3(-0.3, 0.0, 0.2), 0x7cc8ff, 0.045);
      makeBeam(new THREE.Vector3(2.7, 4.6, -2.5), new THREE.Vector3(0.5, 0.0, -0.3), 0xffa866, 0.040);

      // ---- Partikel debu / gelembung cahaya melayang ----
      const DUST_N = 520;
      const dustGeo = new THREE.BufferGeometry();
      const dPos = new Float32Array(DUST_N * 3);
      const dSeed = new Float32Array(DUST_N);
      const dSize = new Float32Array(DUST_N);
      for (let i = 0; i < DUST_N; i++) {
        dPos[i * 3] = (Math.random() - 0.5) * 5.0;
        dPos[i * 3 + 1] = Math.random() * 3.2;
        dPos[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
        dSeed[i] = Math.random();
        dSize[i] = 0.4 + Math.random() * 1.1;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
      dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
      dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
      const dustMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uScale: { value: 500 } },
        vertexShader: `
          attribute float aSeed;
          attribute float aSize;
          uniform float uTime;
          uniform float uScale;
          varying float vSeed;
          varying float vTw;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.11 + aSeed * 40.0) * 0.35;
            p.y += mod(uTime * (0.015 + aSeed * 0.03) + aSeed * 3.0, 3.2);
            p.y = mod(p.y, 3.2);
            p.z += cos(uTime * 0.09 + aSeed * 31.0) * 0.35;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(aSize * uScale * 0.0011 / max(0.3, -mv.z) * 14.0, 1.0, 9.0);
            vSeed = aSeed;
            vTw = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 50.0);
          }`,
        fragmentShader: `
          varying float vSeed;
          varying float vTw;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = smoothstep(0.5, 0.0, d);
            a *= a;
            vec3 col = mix(vec3(0.35, 0.80, 1.0), vec3(1.0, 0.75, 0.45), step(0.72, vSeed));
            gl_FragColor = vec4(col, a * (0.20 + 0.50 * vTw) * 0.45);
          }`
      });
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      dustPoints.frustumCulled = false;
      dustPoints.renderOrder = 6;
      scene.add(dustPoints);

      // ---- Shader tambahan untuk material model (rim fresnel, kaustik air, scan line) ----
      const SHARED = {
        uTime: { value: 0 },
        uScan: { value: 0 },
        uScanX: { value: -1.2 }
      };
      const GLSL_CAUSTIC = `
        float cCaustic(vec2 p, float t) {
          vec2 q = p;
          float v = 0.0;
          float a = 1.0;
          for (int i = 0; i < 3; i++) {
            q += vec2(sin(q.y * 1.7 + t * 1.1), cos(q.x * 1.3 - t * 0.9)) * 0.6;
            v += abs(sin(q.x * 1.5 + q.y * 1.2 + t)) * a;
            a *= 0.5;
            q *= 1.6;
          }
          v = 1.0 - v / 1.75;
          return pow(clamp(v, 0.0, 1.0), 3.0);
        }`;

      function buildFragExtra(kind) {
        const glass = kind === 'glass';
        let s = `
          float cFres = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), ${glass ? '2.2' : '3.0'});
          gl_FragColor.rgb += vec3(0.10, 0.55, 0.85) * cFres * ${glass ? '0.14' : '0.22'};
        `;
        if (glass) s += 'gl_FragColor.a = min(1.0, gl_FragColor.a + cFres * 0.12);\n';
        if (kind === 'tank') {
          s += `
            float cc = cCaustic(vWPos.xz * 11.0, uTime * 0.9);
            gl_FragColor.rgb += vec3(0.30, 0.85, 1.0) * cc * 0.55;
            gl_FragColor.rgb += vec3(0.85, 0.97, 1.0) * pow(cc, 5.0) * 0.9;
          `;
        }
        if (kind === 'flume') {
          s += `
            float cc = cCaustic(vec2(vWPos.x * 12.0 - uTime * 2.4, vWPos.z * 10.0), uTime * 1.2);
            gl_FragColor.rgb += vec3(0.30, 0.85, 1.0) * cc * 0.60;
            gl_FragColor.rgb += vec3(0.85, 0.97, 1.0) * pow(cc, 5.0) * 1.0;
          `;
        }
        s += `
          float cScan = smoothstep(0.07, 0.0, abs(vWPos.x - uScanX)) * uScan;
          gl_FragColor.rgb += vec3(0.10, 0.80, 1.0) * cScan * (0.45 + 0.55 * cFres);
        `;
        return s;
      }

      function patchStdMaterial(mat, kind) {
        if (mat.userData.cinePatched) return;
        mat.userData.cinePatched = true;
        mat.customProgramCacheKey = function () { return 'cine-' + kind; };
        mat.onBeforeCompile = function (sh) {
          sh.uniforms.uTime = SHARED.uTime;
          sh.uniforms.uScan = SHARED.uScan;
          sh.uniforms.uScanX = SHARED.uScanX;
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
            .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uTime;\nuniform float uScan;\nuniform float uScanX;\n' + GLSL_CAUSTIC)
            .replace('#include <dithering_fragment>', buildFragExtra(kind) + '\n#include <dithering_fragment>');
        };
        mat.needsUpdate = true;
      }

      // =========================================================================
      // 3. PROCEDURAL TEXTURES (HPL BIRCH WOOD GRAIN & CALIBRATED TANK SCALE)
      // =========================================================================
      function createBirchHplTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 512;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#d7ba8e';
        ctx.fillRect(0, 0, 1024, 512);

        for (let y = 0; y < 512; y += 2) {
          const wave = Math.sin(y * 0.04) * 7;
          ctx.fillStyle = y % 4 === 0 ? 'rgba(155, 112, 62, 0.12)' : 'rgba(248, 232, 204, 0.12)';
          ctx.fillRect(0, y, 1024, 1.5);
          if (y % 16 === 0) {
            ctx.strokeStyle = 'rgba(130, 88, 44, 0.16)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(340, y + wave, 680, y - wave, 1024, y);
            ctx.stroke();
          }
        }

        // Faint CAD layout lines
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.10)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 1024; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 512);
          ctx.stroke();
        }
        for (let y = 0; y <= 512; y += 64) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1024, y);
          ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 4;
        return tex;
      }

      function createTankGaugeTexture() {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 512;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 128, 512);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(10, 10, 108, 492);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 108, 492);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 18px JetBrains Mono, monospace';
        ctx.textAlign = 'right';

        const levels = ['120L', '100L', '80L', '60L', '40L', '20L'];
        levels.forEach((lbl, idx) => {
          const y = 55 + idx * 76;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(16, y - 2, 26, 3);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(lbl, 106, y + 6);
        });

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        return tex;
      }

      const woodHplTex = createBirchHplTexture();
      const tankGaugeTex = createTankGaugeTexture();

      // Track materials for Solid CAD / X-Ray / Wireframe modes
      const trackedMaterials = [];
      function trackMat(mat, baseOpacity = 1.0, baseTransparent = false) {
        mat.userData.baseOpacity = baseOpacity;
        mat.userData.baseTransparent = baseTransparent;
        trackedMaterials.push(mat);
        return mat;
      }

      const mats = {
        steelFrame: trackMat(new THREE.MeshStandardMaterial({
          color: 0x333c48,
          metalness: 0.70,
          roughness: 0.34
        })),
        tabletopWood: trackMat(new THREE.MeshStandardMaterial({
          map: woodHplTex,
          color: 0xffffff,
          roughness: 0.56,
          metalness: 0.04
        })),
        edgeBanding: trackMat(new THREE.MeshStandardMaterial({
          color: 0x1e242c,
          roughness: 0.65,
          metalness: 0.1
        })),
        rubber: trackMat(new THREE.MeshStandardMaterial({
          color: 0x181e26,
          roughness: 0.88,
          metalness: 0.05
        })),
        stainless: trackMat(new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          metalness: 0.88,
          roughness: 0.22
        })),
        aluminum: trackMat(new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          metalness: 0.82,
          roughness: 0.26
        })),
        brass: trackMat(new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.85,
          roughness: 0.25
        })),
        clearPoly: new THREE.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.28,
          roughness: 0.10,
          metalness: 0.05,
          depthWrite: false,
          side: THREE.DoubleSide
        }),
        retainingWallAcrylic: new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.38,
          roughness: 0.10,
          metalness: 0.08,
          depthWrite: false,
          side: THREE.DoubleSide
        }),
        guideWallCyan: new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.56,
          roughness: 0.14,
          metalness: 0.12,
          depthWrite: false,
          side: THREE.DoubleSide
        }),
        clearPipe: new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.34,
          roughness: 0.12,
          metalness: 0.05,
          depthWrite: false
        }),
        pvcFitting: trackMat(new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.40,
          metalness: 0.20
        })),
        pumpGreen: trackMat(new THREE.MeshStandardMaterial({
          color: 0x388e3c,
          metalness: 0.48,
          roughness: 0.32
        })),
        wheelBlue: trackMat(new THREE.MeshStandardMaterial({
          color: 0x0288d1,
          metalness: 0.34,
          roughness: 0.28
        })),
        splashWall: trackMat(new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          metalness: 0.16,
          roughness: 0.36
        })),
        genBlue: trackMat(new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          metalness: 0.66,
          roughness: 0.30
        })),
        batteryCase: trackMat(new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.48,
          metalness: 0.18
        })),
        meterBox: trackMat(new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.40,
          metalness: 0.28
        })),
        wireRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 }),
        wireBlack: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
      };

      // =========================================================================
      // 4. EXPLODABLE SUB-ASSEMBLIES & TECHNICAL PART INSPECTION REGISTRY
      // =========================================================================
      const rootAssembly = new THREE.Group();
      scene.add(rootAssembly);

      const subGroups = {
        frame: new THREE.Group(),
        bottomShelf: new THREE.Group(),
        topTabletop: new THREE.Group(),
        tank: new THREE.Group(),
        suctionAndPump: new THREE.Group(),
        pressureAndFlowMeter: new THREE.Group(),
        stanchions: new THREE.Group(),
        chuteAndRetainingWalls: new THREE.Group(),
        waterwheel: new THREE.Group(),
        splashPartition: new THREE.Group(),
        dryZoneGear: new THREE.Group()
      };

      const explodeVectors = {
        frame: new THREE.Vector3(0, 0, 0),
        bottomShelf: new THREE.Vector3(0, 0.08, 0.20),
        topTabletop: new THREE.Vector3(0, 0.22, 0),
        tank: new THREE.Vector3(0.30, 0.12, 0.24),
        suctionAndPump: new THREE.Vector3(0.14, 0.18, 0.34),
        pressureAndFlowMeter: new THREE.Vector3(-0.34, 0.22, 0.14),
        stanchions: new THREE.Vector3(0, 0.34, 0.08),
        chuteAndRetainingWalls: new THREE.Vector3(0, 0.52, 0.14),
        waterwheel: new THREE.Vector3(0, 0.42, 0.28),
        splashPartition: new THREE.Vector3(0, 0.26, -0.20),
        dryZoneGear: new THREE.Vector3(0.10, 0.30, -0.46)
      };

      Object.values(subGroups).forEach((g) => rootAssembly.add(g));

      const clickableMeshes = [];
      function registerPart(mesh, partInfo) {
        mesh.userData.partInfo = partInfo;
        clickableMeshes.push(mesh);
        return mesh;
      }

      function createBoxPart(w, h, d, x, y, z, mat, partInfo = null, castShadow = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = true;
        if (partInfo) registerPart(mesh, partInfo);
        return mesh;
      }

      // =========================================================================
      // 5. STEEL FRAME (RANGKA BESI HOLLOW 40x40mm, 9 VERTICAL LEGS, WET + DRY ZONES)
      //    - Main wet-zone frame: X = -1.00..+1.00, Z = -0.36..+0.36
      //    - Rear dry-zone extension frame: X = -1.00..+1.00, Z = -0.72..-0.36
      //    - 9 vertical legs: X in {-1.00, +0.20, +1.00}, Z in {-0.72, -0.36, +0.36}
      // =========================================================================
      const FRAME_INFO = {
        name: 'Rangka Meja Besi Hollow 40×40 mm (9 Kaki Terpadu)',
        material: 'Besi Hollow Galvanis 40×40×2 mm Powder-Coated + Kaki Karet Peredam',
        dims: 'X: -1.00..+1.00 m | Z: -0.72..+0.36 m | Y: 0.00..0.92 m',
        desc: 'Rangka utama zona basah yang terlas menyatu dengan rangka perluasan zona kering belakang melalui 9 kolom kaki vertikal, palang bawah (Y=0.12 m), tengah (Y=0.52 m), dan atas (Y=0.90 m).'
      };

      (function buildSteelFrame() {
        const g = subGroups.frame;
        const tube = 0.04; // 40x40 mm
        const xCols = [-1.00, 0.20, 1.00];
        const zCols = [-0.72, -0.36, 0.36];

        // 9 Vertical Legs: Rubber feet (Y=0.00..0.02) + Steel columns (Y=0.02..0.92)
        xCols.forEach((x) => {
          zCols.forEach((z) => {
            const foot = new THREE.Mesh(
              new THREE.CylinderGeometry(0.028, 0.032, 0.020, 16),
              mats.rubber
            );
            foot.position.set(x, 0.010, z);
            registerPart(foot, FRAME_INFO);
            g.add(foot);

            g.add(createBoxPart(tube, 0.900, tube, x, 0.470, z, mats.steelFrame, FRAME_INFO));
          });
        });

        // Bottom Rails (Y_center = 0.12, top face at Y = 0.140)
        zCols.forEach((z) => {
          g.add(createBoxPart(2.04, tube, tube, 0.00, 0.12, z, mats.steelFrame, FRAME_INFO));
        });
        xCols.forEach((x) => {
          g.add(createBoxPart(tube, tube, 1.12, x, 0.12, -0.18, mats.steelFrame, FRAME_INFO));
        });
        // Extra bottom tank/pump support stringers (Y_center = 0.12, Z = ±0.18)
        [-0.18, 0.18].forEach((sz) => {
          g.add(createBoxPart(1.24, tube, tube, 0.36, 0.12, sz, mats.steelFrame, FRAME_INFO));
        });

        // Mid Rails (Y_center = 0.52, Y = 0.50..0.54)
        zCols.forEach((z) => {
          g.add(createBoxPart(2.04, tube, tube, 0.00, 0.52, z, mats.steelFrame, FRAME_INFO));
        });
        // Transverse mid rails at X = -1.00 and X = +1.00 across full depth, plus X = +0.20 in dry zone only (so wet-zone tank/suction pipe have total clearance)
        [-1.00, 1.00].forEach((x) => {
          g.add(createBoxPart(tube, tube, 1.12, x, 0.52, -0.18, mats.steelFrame, FRAME_INFO));
        });
        g.add(createBoxPart(tube, tube, 0.40, 0.20, 0.52, -0.54, mats.steelFrame, FRAME_INFO));

        // Top Rails (Y_center = 0.90, top face at Y = 0.920)
        zCols.forEach((z) => {
          g.add(createBoxPart(2.04, tube, tube, 0.00, 0.90, z, mats.steelFrame, FRAME_INFO));
        });
        xCols.forEach((x) => {
          g.add(createBoxPart(tube, tube, 1.12, x, 0.90, -0.18, mats.steelFrame, FRAME_INFO));
        });
        // Cutout perimeter reinforcement cross-rails under tabletop (X = +0.53 and X = +0.85, Z = -0.36..+0.36)
        [0.53, 0.85].forEach((cx) => {
          g.add(createBoxPart(tube, tube, 0.72, cx, 0.90, 0.00, mats.steelFrame, FRAME_INFO));
        });
      })();

      // =========================================================================
      // 6. WOODEN TABLETOP & BOTTOM SHELF (PAPAN MEJA & RAK BAWAH)
      //    - Bottom Shelf: Y = 0.140..0.165 (resting directly on bottom rails)
      //    - Top Tabletop: Y = 0.920..0.946 (resting on top rails across wet & dry zones)
      //      with exact rectangular discharge cutout: X = +0.55..+0.83, Z = -0.22..+0.22
      // =========================================================================
      const BOTTOM_SHELF_INFO = {
        name: 'Papan Rak Bawah (Bottom Shelf Board)',
        material: 'Multipleks Birch Lapis HPL 25 mm + Edging PVC Charcoal',
        dims: 'X: -0.98..+0.98 m | Z: -0.34..+0.34 m | Y: 0.140..0.165 m',
        desc: 'Bertumpu langsung di atas palang rangka besi bawah (Y=0.140 m) tanpa celah untuk menopang tangki penampung air utuh dan pompa air sentrifugal.'
      };

      const TOP_TABLETOP_INFO = {
        name: 'Papan Meja Atas & Bukaan Terjunan Air (Top Tabletop)',
        material: 'Multipleks Birch Lapis HPL 26 mm + Edging PVC Charcoal',
        dims: 'Y: 0.920..0.946 m | Cutout: X = +0.55..+0.83 m, Z = -0.22..+0.22 m',
        desc: 'Menutup penuh zona basah dan zona kering belakang dengan lubang persegi presisi di atas tangki penampung agar air terjun dari saluran jatuh bersih ke tangki tanpa mengenai kayu.'
      };

      function createEdgedBoard(w, h, d, x, y, z, partInfo, edges = { f: true, b: true, l: true, r: true }) {
        const grp = new THREE.Group();
        grp.add(createBoxPart(w, h, d, x, y, z, mats.tabletopWood, partInfo));
        const t = 0.004;
        if (edges.f) grp.add(createBoxPart(w, h + 0.001, t, x, y, z + d / 2 + t / 2, mats.edgeBanding, partInfo, false));
        if (edges.b) grp.add(createBoxPart(w, h + 0.001, t, x, y, z - d / 2 - t / 2, mats.edgeBanding, partInfo, false));
        if (edges.l) grp.add(createBoxPart(t, h + 0.001, d, x - w / 2 - t / 2, y, z, mats.edgeBanding, partInfo, false));
        if (edges.r) grp.add(createBoxPart(t, h + 0.001, d, x + w / 2 + t / 2, y, z, mats.edgeBanding, partInfo, false));
        return grp;
      }

      // 6A. Bottom Shelf Board (Y = 0.140..0.165, notched cleanly around X = +0.20, Z = ±0.36 columns)
      (function buildBottomShelf() {
        const g = subGroups.bottomShelf;
        const yC = 0.1525;
        const h = 0.025;
        // Main inner deck: X = -0.98..+0.98 (1.96m), Z = -0.32..+0.32 (0.64m)
        g.add(createEdgedBoard(1.96, h, 0.64, 0.00, yC, 0.00, BOTTOM_SHELF_INFO, { f: false, b: false, l: true, r: true }));
        // Front & Rear edge strips split cleanly around X = +0.20 legs (X_leg = +0.18..+0.22)
        // Left front/rear strips: X = -0.98..+0.18 (1.16m, xC = -0.40)
        g.add(createEdgedBoard(1.16, h, 0.02, -0.40, yC, 0.33, BOTTOM_SHELF_INFO, { f: true, b: false, l: true, r: true }));
        g.add(createEdgedBoard(1.16, h, 0.02, -0.40, yC, -0.33, BOTTOM_SHELF_INFO, { f: false, b: true, l: true, r: true }));
        // Right front/rear strips: X = +0.22..+0.98 (0.76m, xC = +0.60)
        g.add(createEdgedBoard(0.76, h, 0.02, 0.60, yC, 0.33, BOTTOM_SHELF_INFO, { f: true, b: false, l: true, r: true }));
        g.add(createEdgedBoard(0.76, h, 0.02, 0.60, yC, -0.33, BOTTOM_SHELF_INFO, { f: false, b: true, l: true, r: true }));
      })();

      // 6B. Top Tabletop Board (Y = 0.920..0.946) with exact cutout X = +0.55..+0.83, Z = -0.22..+0.22
      (function buildTopTabletop() {
        const g = subGroups.topTabletop;
        const yC = 0.933; // 0.920 to 0.946
        const h = 0.026;

        // 1. Left Main Deck: X = -1.03..+0.55 (w = 1.58, xC = -0.24), Z = -0.75..+0.39 (d = 1.14, zC = -0.18)
        g.add(createEdgedBoard(1.58, h, 1.14, -0.24, yC, -0.18, TOP_TABLETOP_INFO, { f: true, b: true, l: true, r: true }));

        // 2. Right End Deck: X = +0.83..+1.03 (w = 0.20, xC = +0.93), Z = -0.75..+0.39 (d = 1.14, zC = -0.18)
        g.add(createEdgedBoard(0.20, h, 1.14, 0.93, yC, -0.18, TOP_TABLETOP_INFO, { f: true, b: true, l: true, r: true }));

        // 3. Front Cutout Bridge Strip: X = +0.55..+0.83 (w = 0.28, xC = +0.69), Z = +0.22..+0.39 (d = 0.17, zC = +0.305)
        g.add(createEdgedBoard(0.28, h, 0.17, 0.69, yC, 0.305, TOP_TABLETOP_INFO, { f: true, b: true, l: false, r: false }));

        // 4. Rear Cutout Bridge Strip: X = +0.55..+0.83 (w = 0.28, xC = +0.69), Z = -0.75..-0.22 (d = 0.53, zC = -0.485)
        g.add(createEdgedBoard(0.28, h, 0.53, 0.69, yC, -0.485, TOP_TABLETOP_INFO, { f: true, b: true, l: false, r: false }));
      })();

      // =========================================================================
      // 7. INTACT RESERVOIR TANK (TANGKI PENAMPUNG UTUH ANTI-BOCOR)
      //    - Sits on Bottom Shelf (Y = 0.165) at X = +0.60, Z = 0.00
      //    - Y = 0.165..0.785 (height = 0.620m, radius = 0.260m)
      //    - Semi-transparent polycarbonate wall with level markings, zero holes
      //    - Animated water surface at Y = 0.660 with concentric ripples
      // =========================================================================
      const TANK_X = 0.60;
      const TANK_Z = 0.00;
      const TANK_BASE_Y = 0.165;
      const TANK_TOP_Y = 0.785;
      const TANK_HEIGHT = TANK_TOP_Y - TANK_BASE_Y; // 0.620 m
      const TANK_RADIUS = 0.260;
      const WATER_SURFACE_Y = 0.660;

      const TANK_INFO = {
        name: 'Tangki Penampung Air Utuh (Anti-Bocor)',
        material: 'Polikarbonat Transparan Ø 520 mm + Alas & Ring Stainless Steel',
        dims: 'Pusat: X = +0.60 m, Z = 0.00 m | Y: 0.165..0.785 m (R = 0.26 m)',
        desc: 'Tangki sirkulasi utama bertumpu langsung di papan rak bawah dengan dinding dan dasar 100% utuh tanpa dilubangi, dilengkapi skala volume dan riak air aktif pada Y = 0.660 m.'
      };

      let tankWaterSurface;
      const tankRipples = [];

      (function buildReservoirTank() {
        const g = subGroups.tank;

        // Solid intact stainless base plate (Y = 0.165..0.179, zero holes)
        const basePlate = new THREE.Mesh(
          new THREE.CylinderGeometry(TANK_RADIUS + 0.006, TANK_RADIUS + 0.006, 0.014, 48),
          mats.stainless
        );
        basePlate.position.set(TANK_X, TANK_BASE_Y + 0.007, TANK_Z);
        basePlate.receiveShadow = true;
        registerPart(basePlate, TANK_INFO);
        g.add(basePlate);

        // Semi-transparent polycarbonate cylinder wall (open top at Y = 0.785, zero side holes)
        const cylWall = new THREE.Mesh(
          new THREE.CylinderGeometry(TANK_RADIUS, TANK_RADIUS, TANK_HEIGHT, 48, 1, true),
          mats.clearPoly
        );
        cylWall.position.set(TANK_X, TANK_BASE_Y + TANK_HEIGHT / 2, TANK_Z);
        registerPart(cylWall, TANK_INFO);
        g.add(cylWall);

        // Top stainless reinforcement rim at Y = 0.785 (135mm clearance below tabletop underside Y = 0.920)
        const topRim = new THREE.Mesh(
          new THREE.TorusGeometry(TANK_RADIUS, 0.008, 14, 48),
          mats.stainless
        );
        topRim.rotation.x = Math.PI / 2;
        topRim.position.set(TANK_X, TANK_TOP_Y, TANK_Z);
        registerPart(topRim, TANK_INFO);
        g.add(topRim);

        // Calibrated level gauge strip curved onto front outer wall of tank
        const gaugeArc = new THREE.Mesh(
          new THREE.CylinderGeometry(TANK_RADIUS + 0.002, TANK_RADIUS + 0.002, TANK_HEIGHT * 0.84, 24, 1, true, -0.18, 0.36),
          new THREE.MeshBasicMaterial({ map: tankGaugeTex, transparent: true, side: THREE.DoubleSide })
        );
        gaugeArc.position.set(TANK_X, TANK_BASE_Y + TANK_HEIGHT * 0.50, TANK_Z);
        registerPart(gaugeArc, TANK_INFO);
        g.add(gaugeArc);

        // Water volume inside tank (Y = 0.179..0.660)
        const waterH = WATER_SURFACE_Y - (TANK_BASE_Y + 0.014);
        const waterVol = new THREE.Mesh(
          new THREE.CylinderGeometry(TANK_RADIUS - 0.005, TANK_RADIUS - 0.005, waterH, 40),
          new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.42,
            roughness: 0.10,
            depthWrite: false
          })
        );
        waterVol.position.set(TANK_X, TANK_BASE_Y + 0.014 + waterH / 2, TANK_Z);
        g.add(waterVol);

        // Animated water surface at Y = 0.660
        const surfGeo = new THREE.CircleGeometry(TANK_RADIUS - 0.005, 48);
        surfGeo.rotateX(-Math.PI / 2);
        tankWaterSurface = new THREE.Mesh(
          surfGeo,
          new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.74,
            roughness: 0.08
          })
        );
        tankWaterSurface.position.set(TANK_X, WATER_SURFACE_Y, TANK_Z);
        g.add(tankWaterSurface);

        // Concentric ripples at tailrace waterfall impact point (X = +0.65, Z = 0.00)
        for (let i = 0; i < 4; i++) {
          const rGeo = new THREE.RingGeometry(0.014, 0.022, 32);
          rGeo.rotateX(-Math.PI / 2);
          const rMat = new THREE.MeshBasicMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.80,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(rGeo, rMat);
          ring.position.set(0.65, WATER_SURFACE_Y + 0.003, 0.00);
          ring.userData.phase = i / 4;
          g.add(ring);
          tankRipples.push(ring);
        }
      })();

      // =========================================================================
      // 8. HELPER: SMOOTH PIPE & ELBOW BUILDER
      // =========================================================================
      function buildSmoothPipeChain(waypoints, radius, targetGroup, partInfo) {
        const curvePath = new THREE.CurvePath();
        for (let i = 0; i < waypoints.length - 1; i++) {
          const p0 = waypoints[i];
          const p1 = waypoints[i + 1];
          curvePath.add(new THREE.LineCurve3(p0, p1));

          const dir = new THREE.Vector3().subVectors(p1, p0);
          const len = dir.length();
          if (len > 0.0005) {
            const seg = new THREE.Mesh(
              new THREE.CylinderGeometry(radius, radius, len, 20),
              mats.clearPipe
            );
            seg.position.copy(p0).addScaledVector(dir, 0.5);
            seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
            if (partInfo) registerPart(seg, partInfo);
            targetGroup.add(seg);
          }

          if (i > 0) {
            const elbow = new THREE.Mesh(
              new THREE.SphereGeometry(radius * 1.24, 16, 16),
              mats.pvcFitting
            );
            elbow.position.copy(p0);
            if (partInfo) registerPart(elbow, partInfo);
            targetGroup.add(elbow);
          }
        }
        return curvePath;
      }

      // =========================================================================
      // 9. OVER-THE-TOP SUCTION PIPE & CENTRIFUGAL PUMP (PIPA HISAP ATAS ANTI-BOCOR)
      //    - Foot valve inside tank at (X=+0.44, Y=0.195, Z=+0.16)
      //    - Rises vertically past rim (Y=0.785) to 180° U-bend crest at Y=0.845
      //      (cleanly below tabletop underside Y=0.920!)
      //    - Drops vertically outside tank (X=+0.29, Z=+0.16) to Y=0.235
      //    - Enters centrifugal pump suction flange at (X=+0.09, Y=0.235, Z=+0.16)
      // =========================================================================
      const SUCTION_PIPE_INFO = {
        name: 'Pipa Hisap Atas Anti-Bocor (Over-the-Top Suction)',
        material: 'Pipa PVC Transparan 1" + Foot Valve Kuningan & U-Bend 180°',
        dims: 'Inlet: (0.44, 0.195, 0.16) | U-Bend Crest: Y = 0.845 m | Drop: X = 0.29 m',
        desc: 'Menghisap air dari dasar tangki melalui foot valve, naik melewati bibir atas tangki (Y=0.785 m) dengan puncak U-bend di Y=0.845 m (aman di bawah papan meja Y=0.920 m), lalu turun ke pompa tanpa melubangi tangki.'
      };

      const PUMP_INFO = {
        name: 'Pompa Air Sentrifugal Sirkulasi',
        material: 'Casing Aluminium Cor Hijau (#388E3C) + Dudukan Karet Anti-Getar',
        dims: 'Pusat: X = -0.06 m, Z = +0.16 m | Suctions: X=+0.09, Y=0.235 | Out: Y=0.340',
        desc: 'Bertumpu kokoh di atas papan rak bawah (Y=0.165 m) untuk memompa air dari jalur pipa hisap atas menuju pipa dorong dan alat pengukur debit air.'
      };

      let suctionCurvePath;

      (function buildSuctionAndPump() {
        const g = subGroups.suctionAndPump;

        // Build smooth 180° U-bend arch points from X=+0.44 to X=+0.29 at crest Y=0.845
        const uCenterX = (0.44 + 0.29) / 2; // 0.365
        const uRadius = (0.44 - 0.29) / 2;  // 0.075
        const uBaseY = 0.845 - uRadius;     // 0.770 -> crest at 0.770 + 0.075 = 0.845!

        const suctionWaypoints = [
          new THREE.Vector3(0.44, 0.195, 0.16), // Submerged foot valve inside tank
          new THREE.Vector3(0.44, uBaseY, 0.16) // Vertical riser inside tank
        ];

        // 180° semicircular U-bend crest peaking at exact Y = 0.845
        const archSteps = 12;
        for (let i = 1; i <= archSteps; i++) {
          const ang = (i / archSteps) * Math.PI; // 0 to PI
          const ax = uCenterX + uRadius * Math.cos(ang);
          const ay = uBaseY + uRadius * Math.sin(ang);
          suctionWaypoints.push(new THREE.Vector3(ax, ay, 0.16));
        }

        suctionWaypoints.push(
          new THREE.Vector3(0.29, 0.235, 0.16), // Drops straight down outside tank (X=0.29)
          new THREE.Vector3(0.09, 0.235, 0.16)  // Enters centrifugal pump suction flange
        );

        suctionCurvePath = buildSmoothPipeChain(suctionWaypoints, 0.020, g, SUCTION_PIPE_INFO);

        // Submerged brass foot-valve strainer at (X=+0.44, Y=0.195, Z=+0.16)
        const footValve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.030, 0.034, 0.052, 20),
          mats.brass
        );
        footValve.position.set(0.44, 0.195, 0.16);
        registerPart(footValve, SUCTION_PIPE_INFO);
        g.add(footValve);

        // Pipe clamp support tying vertical drop pipe (X=0.29, Z=0.16) cleanly to front mid-rail (Z=0.36, Y=0.52)
        g.add(createBoxPart(0.026, 0.024, 0.20, 0.29, 0.52, 0.26, mats.steelFrame, SUCTION_PIPE_INFO));
        const clampRing = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 10, 20), mats.stainless);
        clampRing.rotation.x = Math.PI / 2;
        clampRing.position.set(0.29, 0.52, 0.16);
        g.add(clampRing);

        // Centrifugal Pump mounted on rubber vibration-isolation base pad on Bottom Shelf (Y = 0.165)
        g.add(createBoxPart(0.26, 0.016, 0.16, -0.06, 0.173, 0.16, mats.rubber, PUMP_INFO));

        // Motor body (X = -0.17..-0.02, Y_center = 0.245, Z = +0.16)
        const motorCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.064, 0.064, 0.15, 24),
          mats.pumpGreen
        );
        motorCyl.rotation.z = Math.PI / 2;
        motorCyl.position.set(-0.10, 0.245, 0.16);
        motorCyl.castShadow = true;
        registerPart(motorCyl, PUMP_INFO);
        g.add(motorCyl);

        // Pump volute impeller housing centered at X = -0.02, Y = 0.245, Z = +0.16
        const voluteCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.074, 0.074, 0.070, 24),
          mats.pumpGreen
        );
        voluteCyl.rotation.z = Math.PI / 2;
        voluteCyl.position.set(0.01, 0.245, 0.16);
        voluteCyl.castShadow = true;
        registerPart(voluteCyl, PUMP_INFO);
        g.add(voluteCyl);

        // Brass suction flange at (X=+0.09, Y=0.235, Z=+0.16) & top discharge flange at (X=-0.06, Y=0.340, Z=+0.16)
        const sucFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.06, 20), mats.brass);
        sucFlange.rotation.z = Math.PI / 2;
        sucFlange.position.set(0.065, 0.235, 0.16);
        registerPart(sucFlange, PUMP_INFO);
        g.add(sucFlange);

        const disFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.055, 20), mats.brass);
        disFlange.position.set(-0.06, 0.315, 0.16);
        registerPart(disFlange, PUMP_INFO);
        g.add(disFlange);

        // Pump electrical terminal box
        g.add(createBoxPart(0.062, 0.036, 0.050, -0.12, 0.320, 0.16, mats.meterBox, PUMP_INFO));
      })();

      // =========================================================================
      // 10. HELPER: BACKLIT 3D DIGITAL LCD INSTRUMENT PANEL
      // =========================================================================
      function createDigitalInstrument(headerTitle, accentHex, partInfo) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;

        const grp = new THREE.Group();
        grp.add(createBoxPart(0.24, 0.135, 0.042, 0, 0, 0, mats.meterBox, partInfo));
        grp.add(createBoxPart(0.248, 0.143, 0.032, 0, 0, 0, mats.aluminum, partInfo, false));

        const screenMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 0.115),
          new THREE.MeshBasicMaterial({ map: tex })
        );
        screenMesh.position.z = 0.022;
        if (partInfo) registerPart(screenMesh, partInfo);
        grp.add(screenMesh);

        function updateDisplay(mainValue, unitText, subLine, badgeText, badgeColor) {
          ctx.fillStyle = '#050d1a';
          ctx.fillRect(0, 0, 512, 256);

          ctx.strokeStyle = accentHex;
          ctx.lineWidth = 4;
          ctx.strokeRect(8, 8, 496, 240);

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(12, 12, 488, 42);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '700 20px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(headerTitle, 22, 40);

          if (badgeText) {
            ctx.fillStyle = badgeColor || '#34d399';
            ctx.font = '700 18px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(badgeText, 488, 39);
          }

          ctx.fillStyle = accentHex;
          ctx.font = '700 76px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(mainValue, 22, 144);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 30px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(unitText, 488, 140);

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(22, 174);
          ctx.lineTo(490, 174);
          ctx.stroke();

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 21px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(subLine, 22, 216);

          tex.needsUpdate = true;
        }

        return { group: grp, updateDisplay };
      }

      // =========================================================================
      // 11. PRESSURE PIPE & INLINE DIGITAL FLOW METER (PIPA DORONG & DEBIT AIR)
      //     - Exits pump top discharge (X=-0.06, Y=0.340, Z=+0.16)
      //     - Runs left to X=-1.07, turns 90° straight up through Inline Digital Flow Meter
      //     - Reaches Y=1.280, turns 90° right, and PENETRATES DIRECTLY INSIDE the Upper
      //       Headbox left wall (X=-0.920) through a sealed bulkhead flange with an
      //       internal downward discharge nozzle at (X=-0.840, Z=0.000)
      // =========================================================================
      const PRESSURE_PIPE_INFO = {
        name: 'Pipa Dorong & Nosel Masuk Headbox (Pressure Pipe)',
        material: 'Pipa PVC Transparan 1" + Bulkhead Flange Kuningan Kedap Air',
        dims: 'Pump Out (-0.06, 0.34, 0.16) → Riser X=-1.07 → Headbox Nozzle (-0.84, 1.19, 0.00)',
        desc: 'Menyalurkan air dari pompa menuju sisi kiri meja, naik melalui flow meter digital, lalu menembus masuk ke dalam kotak penenang (Headbox) melalui flensa kedap air dan nosel mengarah ke bawah.'
      };

      const FLOW_METER_INFO = {
        name: 'Alat Pengukur Debit Air Digital (Inline Water Flow Meter)',
        material: 'Tabung Turbin Akrilik + Rotor 4-Sudu + Layar LCD Digital',
        dims: 'Terpasang Inline di X = -1.07 m, Y = 0.72 m, Z = 0.00 m',
        desc: 'Mengukur debit aliran air secara real-time (L/min & m³/h) menggunakan rotor turbin internal berputar yang terpasang kokoh dengan bracket baja ke kolom rangka kiri.'
      };

      let pressureCurvePath;
      let flowTurbineRotor;
      let flowLcdUnit;

      (function buildPressurePipeAndFlowMeter() {
        const g = subGroups.pressureAndFlowMeter;

        const pressureWaypoints = [
          new THREE.Vector3(-0.06, 0.340, 0.16), // Pump top discharge flange
          new THREE.Vector3(-0.06, 0.400, 0.16), // Rises slightly
          new THREE.Vector3(-0.18, 0.400, 0.00), // Centers to Z = 0.00 cleanly below mid-rail (Y=0.52)
          new THREE.Vector3(-1.07, 0.400, 0.00), // Runs horizontally left past left frame leg (X=-1.00)
          new THREE.Vector3(-1.07, 1.280, 0.00), // Turns 90° straight up through inline Flow Meter (Y=0.72)
          new THREE.Vector3(-0.920, 1.280, 0.00), // Turns 90° right & penetrates Headbox left wall (X=-0.920)
          new THREE.Vector3(-0.840, 1.280, 0.00), // Continues horizontally INSIDE the clear Headbox
          new THREE.Vector3(-0.840, 1.185, 0.00)  // Internal downward discharge nozzle inside Headbox!
        ];

        pressureCurvePath = buildSmoothPipeChain(pressureWaypoints, 0.020, g, PRESSURE_PIPE_INFO);

        // Under-table hanger brackets supporting horizontal pressure pipe (Y=0.400 to Y=0.920)
        [-0.45, -0.88].forEach((hx) => {
          g.add(createBoxPart(0.022, 0.52, 0.022, hx, 0.66, 0.00, mats.steelFrame, PRESSURE_PIPE_INFO));
        });

        // Sealed brass bulkhead flange where pressure pipe penetrates Headbox left wall at (X=-0.920, Y=1.280, Z=0.00)
        const bulkhead = new THREE.Mesh(
          new THREE.CylinderGeometry(0.036, 0.036, 0.032, 24),
          mats.brass
        );
        bulkhead.rotation.z = Math.PI / 2;
        bulkhead.position.set(-0.920, 1.280, 0.00);
        registerPart(bulkhead, PRESSURE_PIPE_INFO);
        g.add(bulkhead);

        // Internal brass discharge nozzle tip inside Headbox at (X=-0.840, Y=1.185, Z=0.00)
        const nozzleTip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.018, 0.032, 20),
          mats.brass
        );
        nozzleTip.position.set(-0.840, 1.185, 0.00);
        registerPart(nozzleTip, PRESSURE_PIPE_INFO);
        g.add(nozzleTip);

        // Inline Digital Water Flow Meter mounted on vertical riser at X = -1.07, Y = 0.72, Z = 0.00
        const meterGrp = new THREE.Group();
        meterGrp.position.set(-1.07, 0.72, 0.00);
        g.add(meterGrp);

        // Steel mounting bracket anchoring Flow Meter to left frame leg (X=-1.00, Z=+0.36)
        g.add(createBoxPart(0.07, 0.026, 0.026, -1.035, 0.72, 0.00, mats.steelFrame, FLOW_METER_INFO));
        g.add(createBoxPart(0.026, 0.026, 0.36, -1.00, 0.72, 0.18, mats.steelFrame, FLOW_METER_INFO));

        // Brass hex unions top & bottom
        const topHex = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.028, 6), mats.brass);
        topHex.position.y = 0.088;
        registerPart(topHex, FLOW_METER_INFO);
        meterGrp.add(topHex);

        const botHex = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.028, 6), mats.brass);
        botHex.position.y = -0.088;
        registerPart(botHex, FLOW_METER_INFO);
        meterGrp.add(botHex);

        // Clear acrylic turbine housing
        const chamber = new THREE.Mesh(
          new THREE.CylinderGeometry(0.042, 0.042, 0.148, 28),
          mats.clearPoly
        );
        registerPart(chamber, FLOW_METER_INFO);
        meterGrp.add(chamber);

        // Spinning 4-blade red & white turbine rotor inside chamber
        flowTurbineRotor = new THREE.Group();
        const rotorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.11, 16), mats.stainless);
        flowTurbineRotor.add(rotorShaft);

        for (let i = 0; i < 4; i++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.064, 0.082, 0.005),
            new THREE.MeshStandardMaterial({
              color: i % 2 === 0 ? 0xdc2626 : 0xf8fafc,
              roughness: 0.3
            })
          );
          blade.rotation.y = (i * Math.PI) / 4;
          flowTurbineRotor.add(blade);
        }
        meterGrp.add(flowTurbineRotor);

        // Digital LCD Display angled toward front-left camera
        flowLcdUnit = createDigitalInstrument('DEBIT AIR • FLOW METER', '#38bdf8', FLOW_METER_INFO);
        flowLcdUnit.group.position.set(-0.075, 0.00, 0.075);
        flowLcdUnit.group.rotation.y = -Math.PI * 0.25;
        meterGrp.add(flowLcdUnit.group);
      })();

      // =========================================================================
      // 12. CHUTE GEOMETRY & CHUTE SUPPORT STANCHIONS (TIANG PENYANGGA SALURAN)
      //     - Headbox: X = -0.920..-0.660, floor Y = 1.120, width Z = -0.220..+0.220
      //     - Sloped Chute: X = -0.660..+0.740 (dX = 1.400m), floor Y = 1.120..0.975 (dY = -0.145m)
      //     - Twin symmetric steel support stanchions at Z = ±0.195 rising strictly from
      //       tabletop (Y = 0.946) to bolted U-saddle brackets under the chute at:
      //       X = -0.820 (Headbox cradle), X = -0.380 (mid-chute cradle), X = +0.520 (lower-chute cradle)
      //     - ZERO contact or collision with any pipes!
      // =========================================================================
      const HB_X0 = -0.920;
      const HB_X1 = -0.660;
      const HB_FLOOR_Y = 1.120;

      const CHUTE_X0 = -0.660;
      const CHUTE_Y0 = 1.120;
      const CHUTE_X1 = 0.740;
      const CHUTE_Y1 = 0.975;
      const CHUTE_DX = CHUTE_X1 - CHUTE_X0; // 1.400 m
      const CHUTE_DY = CHUTE_Y1 - CHUTE_Y0; // -0.145 m
      const CHUTE_LEN = Math.hypot(CHUTE_DX, CHUTE_DY);
      const CHUTE_ANGLE = Math.atan2(CHUTE_DY, CHUTE_DX); // -0.1032 rad (-5.91°)
      const CHUTE_OUTER_W = 0.440; // Z = -0.220..+0.220
      const CHUTE_FLOOR_THICK = 0.012;

      function getChuteFloorY(x) {
        if (x <= CHUTE_X0) return HB_FLOOR_Y;
        const t = Math.max(0, Math.min(1, (x - CHUTE_X0) / CHUTE_DX));
        return CHUTE_Y0 + t * CHUTE_DY;
      }

      const STANCHION_INFO = {
        name: 'Tiang Penyangga Saluran & Saddle Bracket (3 Pasang)',
        material: 'Besi Hollow 28×28 mm + Pelat Flensa & U-Saddle Baut Stainless',
        dims: 'Z = ±0.195 m | X = -0.820 m (Headbox), -0.380 m (Tengah), +0.520 m (Hilir)',
        desc: 'Enam kolom penyangga simetris berdiri kokoh di atas papan meja (Y=0.946 m) hingga U-saddle bracket di bawah lantai saluran, 100% terpisah dari jalur pipa sirkulasi.'
      };

      (function buildChuteStanchions() {
        const g = subGroups.stanchions;
        const tableTopY = 0.946;
        const stanchionXs = [-0.820, -0.380, 0.520];

        stanchionXs.forEach((sx) => {
          const floorY = getChuteFloorY(sx);
          const saddleBottomY = floorY - CHUTE_FLOOR_THICK - 0.010; // Directly underneath chute floor
          const colH = saddleBottomY - tableTopY;

          [-0.195, 0.195].forEach((sz) => {
            // Base mounting flange bolted to Top Tabletop Board (Y = 0.946)
            g.add(createBoxPart(0.058, 0.008, 0.058, sx, tableTopY + 0.004, sz, mats.stainless, STANCHION_INFO));
            // Vertical steel column strictly between tabletop and U-saddle
            g.add(createBoxPart(0.028, colH, 0.028, sx, tableTopY + colH / 2, sz, mats.steelFrame, STANCHION_INFO));
          });

          // Transverse U-saddle cradle beam supporting the underside of the chute
          const saddleGrp = new THREE.Group();
          saddleGrp.position.set(sx, saddleBottomY + 0.005, 0.00);
          if (sx > CHUTE_X0) saddleGrp.rotation.z = CHUTE_ANGLE;
          saddleGrp.add(createBoxPart(0.036, 0.010, CHUTE_OUTER_W + 0.016, 0, 0, 0, mats.steelFrame, STANCHION_INFO));
          // Upward U-lips cradling the outer acrylic side walls
          [-0.224, 0.224].forEach((uz) => {
            saddleGrp.add(createBoxPart(0.036, 0.028, 0.008, 0, 0.014, uz, mats.stainless, STANCHION_INFO));
          });
          g.add(saddleGrp);
        });
      })();

      // =========================================================================
      // 13. CHUTE & WATER FLOW RETAINING / GUIDE WALLS (DINDING PEMBATAS ALIRAN AIR)
      //     Featured Detail:
      //     1. High clear-acrylic outer retaining side walls (Z=±0.220, 12mm thick with
      //        brushed aluminum corner framing) along entire Headbox & sloped chute (X=-0.920..+0.740)
      //     2. Internal Stilling Baffle Wall inside Headbox (X=-0.700) calming pumped inflow
      //     3. Twin Converging Hydraulic Guide Walls on chute floor (X=-0.08..+0.20)
      //        narrowing flow path from 0.42m to 0.28m directly onto the 6 blue paddles
      //     4. Raised Waterwheel Splash Retaining Shields flanking the waterwheel (X=+0.14..+0.54)
      //     5. Downward Tailrace Discharge Splash Skirt at chute exit (X=+0.56..+0.74, Y=0.975..0.800)
      // =========================================================================
      const OUTER_WALL_INFO = {
        name: 'Dinding Pembatas Samping Luar Saluran & Headbox',
        material: 'Akrilik Bening 12 mm + Rangka Siku & Rel Aluminium Anodized',
        dims: 'X: -0.920..+0.740 m | Z = ±0.220 m | Tinggi Dinding: 0.22–0.28 m',
        desc: 'Dinding pembatas tinggi di sepanjang sisi kiri-kanan Headbox dan saluran miring dengan bingkai sudut aluminium untuk mencegah air meluap ke samping.'
      };

      const BAFFLE_WALL_INFO = {
        name: 'Dinding Sekat Penenang Headbox (Stilling Baffle Wall)',
        material: 'Pelat Akrilik Bening 10 mm + Bingkai Aluminium',
        dims: 'X = -0.700 m | Z: -0.208..+0.208 m | Celah Bawah Laminar: 45 mm',
        desc: 'Dinding sekat internal di dalam kotak penenang (Headbox) yang meredam turbulensi pancaran air dari pipa dorong sehingga aliran masuk ke saluran miring menjadi tenang dan merata.'
      };

      const GUIDE_WALL_INFO = {
        name: 'Dinding Pembatas Pengarah Aliran Konvergen (Converging Guide Walls)',
        material: 'Akrilik Hidrodinamis 10 mm + Top Cap Aluminium',
        dims: 'X: -0.08..+0.20 m | Lebar Menyempit: 0.416 m → 0.280 m (Z = ±0.140 m)',
        desc: 'Sepasang dinding pengarah miring yang menyempitkan penampang aliran dari 0,42 m menjadi 0,28 m tepat di depan kincir air sehingga seluruh debit air menghantam 6 sudu kincir tanpa lolos di tepi.'
      };

      const SPLASH_SHIELD_INFO = {
        name: 'Dinding Pembatas Cipratan Kincir (Waterwheel Splash Shields)',
        material: 'Perisai Akrilik Tinggi 12 mm + Bingkai Aluminium Perimeter',
        dims: 'X: +0.14..+0.54 m | Z = ±0.220 m | Puncak Perisai: Y = 1.38 m',
        desc: 'Dinding pembatas ekstra tinggi mengapit roda kincir air 6 sudu untuk menahan percikan air radial akibat putaran kincir agar tetap berada di dalam saluran.'
      };

      const TAILRACE_SKIRT_INFO = {
        name: 'Dinding Pembatas Terjunan Air (Tailrace Discharge Splash Skirt)',
        material: 'Cerobong Akrilik Bening 10 mm + Bingkai Aluminium',
        dims: 'X: +0.56..+0.74 m | Z = ±0.205 m | Y: 0.985 m turun ke 0.800 m',
        desc: 'Dinding pemandu vertikal yang menembus bukaan meja kerja menuju mulut tangki penampung untuk mengarahkan air terjun masuk bersih ke dalam tangki tanpa memercik ke papan meja.'
      };

      let flumeStreamTex;
      let flumeWaterMesh;

      (function buildChuteAndRetainingWalls() {
        const g = subGroups.chuteAndRetainingWalls;
        const wallT = 0.012; // 12 mm acrylic thickness
        const zWall = 0.214; // centerline of 12mm walls -> outer face at ±0.220!

        // --- A. UPPER HEADBOX (X = -0.920..-0.660, floor Y = 1.120, walls up to Y = 1.380) ---
        const hbW = HB_X1 - HB_X0; // 0.260 m
        const hbXC = (HB_X0 + HB_X1) / 2; // -0.790
        const hbWallH = 0.260; // Y = 1.120..1.380

        // Headbox floor
        g.add(createBoxPart(hbW, CHUTE_FLOOR_THICK, CHUTE_OUTER_W, hbXC, HB_FLOOR_Y - CHUTE_FLOOR_THICK / 2, 0.00, mats.clearPoly, OUTER_WALL_INFO, false));
        // Headbox left end wall (penetrated by pressure pipe at X = -0.920, Y = 1.280)
        g.add(createBoxPart(wallT, hbWallH + CHUTE_FLOOR_THICK, CHUTE_OUTER_W, HB_X0, HB_FLOOR_Y + (hbWallH - CHUTE_FLOOR_THICK) / 2, 0.00, mats.retainingWallAcrylic, OUTER_WALL_INFO, false));
        // Headbox front & rear retaining walls
        [-zWall, zWall].forEach((zw) => {
          g.add(createBoxPart(hbW, hbWallH, wallT, hbXC, HB_FLOOR_Y + hbWallH / 2, zw, mats.retainingWallAcrylic, OUTER_WALL_INFO, false));
          // Aluminum top & corner framing
          g.add(createBoxPart(hbW + 0.012, 0.012, 0.016, hbXC, HB_FLOOR_Y + hbWallH, zw, mats.aluminum, OUTER_WALL_INFO, false));
        });
        // Vertical aluminum corner posts at Headbox left corners (X = -0.920, Z = ±0.220)
        [-0.220, 0.220].forEach((zc) => {
          g.add(createBoxPart(0.016, hbWallH + 0.016, 0.016, HB_X0, HB_FLOOR_Y + hbWallH / 2, zc, mats.aluminum, OUTER_WALL_INFO, false));
        });
        g.add(createBoxPart(0.016, 0.012, CHUTE_OUTER_W + 0.012, HB_X0, HB_FLOOR_Y + hbWallH, 0.00, mats.aluminum, OUTER_WALL_INFO, false));

        // --- B. INTERNAL STILLING BAFFLE WALL INSIDE HEADBOX (X = -0.700) ---
        // Descends from Y = 1.355 down to Y = 1.165 (leaving 45mm laminar underflow gap Y = 1.120..1.165)
        const baffleH = 0.190;
        const baffleYC = 1.165 + baffleH / 2;
        g.add(createBoxPart(0.010, baffleH, 0.416, -0.700, baffleYC, 0.00, mats.guideWallCyan, BAFFLE_WALL_INFO, false));
        g.add(createBoxPart(0.014, 0.010, 0.416, -0.700, 1.355, 0.00, mats.aluminum, BAFFLE_WALL_INFO, false));
        g.add(createBoxPart(0.014, 0.010, 0.416, -0.700, 1.165, 0.00, mats.aluminum, BAFFLE_WALL_INFO, false));

        // --- C. SLOPED CHUTE & HIGH OUTER RETAINING SIDE WALLS (X = -0.660..+0.740) ---
        const chuteGrp = new THREE.Group();
        chuteGrp.position.set((CHUTE_X0 + CHUTE_X1) / 2, (CHUTE_Y0 + CHUTE_Y1) / 2, 0.00);
        chuteGrp.rotation.z = CHUTE_ANGLE;
        g.add(chuteGrp);

        const sideWallH = 0.220;
        // Chute bottom floor
        chuteGrp.add(createBoxPart(CHUTE_LEN, CHUTE_FLOOR_THICK, CHUTE_OUTER_W, 0, -CHUTE_FLOOR_THICK / 2, 0, mats.clearPoly, OUTER_WALL_INFO, false));

        // Front & Rear high clear-acrylic outer retaining side walls + brushed aluminum top/bottom edge rails
        [-zWall, zWall].forEach((zw) => {
          chuteGrp.add(createBoxPart(CHUTE_LEN, sideWallH, wallT, 0, sideWallH / 2, zw, mats.retainingWallAcrylic, OUTER_WALL_INFO, false));
          chuteGrp.add(createBoxPart(CHUTE_LEN + 0.008, 0.012, 0.016, 0, sideWallH, zw, mats.aluminum, OUTER_WALL_INFO, false));
          chuteGrp.add(createBoxPart(CHUTE_LEN + 0.008, 0.010, 0.016, 0, -CHUTE_FLOOR_THICK, zw, mats.aluminum, OUTER_WALL_INFO, false));
        });

        // Animated flowing water stream layer inside the sloped chute
        const wCanvas = document.createElement('canvas');
        wCanvas.width = 512;
        wCanvas.height = 128;
        const wCtx = wCanvas.getContext('2d');
        wCtx.fillStyle = '#0284c7';
        wCtx.fillRect(0, 0, 512, 128);
        for (let i = 0; i < 70; i++) {
          const x = (i * 37) % 512;
          const y = (i * 23) % 128;
          const len = 36 + (i % 5) * 16;
          wCtx.fillStyle = i % 3 === 0 ? 'rgba(224, 242, 254, 0.82)' : 'rgba(56, 189, 248, 0.72)';
          wCtx.fillRect(x, y, len, 3);
        }
        flumeStreamTex = new THREE.CanvasTexture(wCanvas);
        flumeStreamTex.wrapS = THREE.RepeatWrapping;
        flumeStreamTex.wrapT = THREE.RepeatWrapping;
        flumeStreamTex.repeat.set(4, 1);

        flumeWaterMesh = new THREE.Mesh(
          new THREE.BoxGeometry(CHUTE_LEN - 0.01, 0.032, 0.412),
          new THREE.MeshPhysicalMaterial({
            map: flumeStreamTex,
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.76,
            roughness: 0.12
          })
        );
        flumeWaterMesh.position.set(0, 0.018, 0);
        chuteGrp.add(flumeWaterMesh);

        // --- D. TWIN CONVERGING HYDRAULIC GUIDE WALLS ON CHUTE FLOOR (X = -0.08..+0.20) ---
        // Narrows flow channel from Z = ±0.208 (0.416m) inward to Z = ±0.140 (0.280m) directly onto the 6 blue paddles
        const gwX0 = -0.08;
        const gwX1 = 0.20;
        const gwY0 = getChuteFloorY(gwX0);
        const gwY1 = getChuteFloorY(gwX1);
        const gwH = 0.145;

        [-1, 1].forEach((side) => {
          const pStart = new THREE.Vector3(gwX0, gwY0, side * 0.206);
          const pEnd = new THREE.Vector3(gwX1, gwY1, side * 0.140);
          const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
          const span = new THREE.Vector3().subVectors(pEnd, pStart);
          const len = span.length();
          const yaw = Math.atan2(-span.z, span.x);

          const guideGrp = new THREE.Group();
          guideGrp.position.set(mid.x, mid.y + gwH / 2, mid.z);
          guideGrp.rotation.y = yaw;
          guideGrp.rotation.z = CHUTE_ANGLE;

          guideGrp.add(createBoxPart(len, gwH, 0.010, 0, 0, 0, mats.guideWallCyan, GUIDE_WALL_INFO, false));
          guideGrp.add(createBoxPart(len + 0.006, 0.010, 0.014, 0, gwH / 2, 0, mats.aluminum, GUIDE_WALL_INFO, false));
          g.add(guideGrp);
        });

        // --- E. RAISED WATERWHEEL SPLASH RETAINING SHIELDS (X = +0.14..+0.54, Y up to 1.38) ---
        const shieldW = 0.40; // X = +0.14..+0.54
        const shieldXC = 0.34;
        const shieldTopY = 1.38;
        const shieldBotY = getChuteFloorY(0.34) + 0.19;
        const shieldH = shieldTopY - shieldBotY;

        [-0.220, 0.220].forEach((sz) => {
          g.add(createBoxPart(shieldW, shieldH, 0.010, shieldXC, shieldBotY + shieldH / 2, sz, mats.retainingWallAcrylic, SPLASH_SHIELD_INFO, false));
          // Aluminum top & vertical end frames
          g.add(createBoxPart(shieldW + 0.012, 0.012, 0.016, shieldXC, shieldTopY, sz, mats.aluminum, SPLASH_SHIELD_INFO, false));
          g.add(createBoxPart(0.014, shieldH, 0.016, 0.14, shieldBotY + shieldH / 2, sz, mats.aluminum, SPLASH_SHIELD_INFO, false));
          g.add(createBoxPart(0.014, shieldH, 0.016, 0.54, shieldBotY + shieldH / 2, sz, mats.aluminum, SPLASH_SHIELD_INFO, false));
        });

        // --- F. DOWNWARD TAILRACE DISCHARGE SPLASH SKIRT (X = +0.56..+0.74, Y = 0.985 down to 0.800) ---
        const skirtX0 = 0.56;
        const skirtX1 = 0.74;
        const skirtW = skirtX1 - skirtX0; // 0.18 m
        const skirtXC = (skirtX0 + skirtX1) / 2; // 0.65
        const skirtTopY = 0.982;
        const skirtBotY = 0.800; // Extends cleanly through tabletop cutout (Y=0.920..0.946) down toward tank rim (Y=0.785)
        const skirtH = skirtTopY - skirtBotY;
        const skirtYC = (skirtTopY + skirtBotY) / 2;

        // Side splash skirts at Z = ±0.205
        [-0.205, 0.205].forEach((skz) => {
          g.add(createBoxPart(skirtW, skirtH, 0.010, skirtXC, skirtYC, skz, mats.retainingWallAcrylic, TAILRACE_SKIRT_INFO, false));
          g.add(createBoxPart(skirtW + 0.008, 0.010, 0.014, skirtXC, skirtBotY, skz, mats.aluminum, TAILRACE_SKIRT_INFO, false));
        });
        // End baffle wall at X = +0.740 (extending from top of chute walls Y=1.195 down to Y=0.800)
        const endWallTopY = 1.195;
        const endWallH = endWallTopY - skirtBotY;
        g.add(createBoxPart(0.010, endWallH, 0.420, skirtX1, skirtBotY + endWallH / 2, 0.00, mats.retainingWallAcrylic, TAILRACE_SKIRT_INFO, false));
        g.add(createBoxPart(0.014, 0.010, 0.424, skirtX1, skirtBotY, 0.00, mats.aluminum, TAILRACE_SKIRT_INFO, false));
        g.add(createBoxPart(0.014, 0.010, 0.424, skirtX1, endWallTopY, 0.00, mats.aluminum, TAILRACE_SKIRT_INFO, false));
      })();

      // =========================================================================
      // 14. 6-BLADE BLUE WATERWHEEL & STAINLESS MAIN SHAFT (KINCIR AIR & POROS UTAMA)
      //     - Centered at X = +0.340, Y = 1.175, Z = 0.00
      //     - Outer blade radius R = 0.165m (bottom tip Y = 1.010, skimming chute water stream)
      //     - Blade width 0.25m (Z = -0.125..+0.125), fitting inside 0.28m converged channel
      //     - Stainless main shaft penetrates splash-guard partition wall at Z = -0.340
      // =========================================================================
      const WHEEL_X = 0.340;
      const WHEEL_Y = 1.175;
      let hydroWheelRotor;

      const WHEEL_INFO = {
        name: 'Kincir Air 6 Sudu Biru & Poros Utama (Main Shaft)',
        material: 'Sudu Polimer Hidrodinamis (#0288D1) + Poros Stainless Steel Ø 30 mm',
        dims: 'Pusat: X = +0.340 m, Y = 1.175 m | Ø Luar: 330 mm | Lebar Sudu: 250 mm',
        desc: 'Menerima aliran air terkonsentrasi dari dinding pengarah konvergen dan mengubahnya menjadi energi mekanik putar menuju zona kering di balik dinding sekat.'
      };

      (function buildWaterwheel() {
        const g = subGroups.waterwheel;

        // Front pillow-block bearing bridge mounted across top of raised splash shields (Y = 1.385)
        g.add(createBoxPart(0.052, 0.018, 0.46, WHEEL_X, 1.388, 0.00, mats.steelFrame, WHEEL_INFO));
        g.add(createBoxPart(0.028, 0.21, 0.028, WHEEL_X, 1.28, 0.225, mats.steelFrame, WHEEL_INFO));
        const frontBearing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, 0.036, 20),
          mats.brass
        );
        frontBearing.rotation.x = Math.PI / 2;
        frontBearing.position.set(WHEEL_X, WHEEL_Y, 0.225);
        registerPart(frontBearing, WHEEL_INFO);
        g.add(frontBearing);

        // Stainless Steel Main Shaft (Z = +0.245 through wheel, splash wall Z = -0.340, pillow blocks, to drive pulley Z = -0.46)
        const mainShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.78, 24),
          mats.stainless
        );
        mainShaft.rotation.x = Math.PI / 2;
        mainShaft.position.set(WHEEL_X, WHEEL_Y, -0.145);
        mainShaft.castShadow = true;
        registerPart(mainShaft, WHEEL_INFO);
        g.add(mainShaft);

        // Rotating 6-blade blue paddle wheel rotor
        hydroWheelRotor = new THREE.Group();
        hydroWheelRotor.position.set(WHEEL_X, WHEEL_Y, 0.00);
        g.add(hydroWheelRotor);

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.048, 0.265, 24),
          mats.steelFrame
        );
        hub.rotation.x = Math.PI / 2;
        registerPart(hub, WHEEL_INFO);
        hydroWheelRotor.add(hub);

        // Side Shroud Rings (R = 0.145m)
        [-0.128, 0.128].forEach((zs) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.145, 0.007, 12, 36),
            mats.steelFrame
          );
          ring.position.z = zs;
          hydroWheelRotor.add(ring);
        });

        // 6 Blue Paddles (tip radius = 0.045 + 0.120 = 0.165 m)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const pivot = new THREE.Group();
          pivot.rotation.z = angle;
          const paddle = createBoxPart(0.011, 0.125, 0.250, 0, 0.1025, 0, mats.wheelBlue, WHEEL_INFO);
          pivot.add(paddle);
          hydroWheelRotor.add(pivot);
        }
      })();

      // =========================================================================
      // 15. WATERPROOF SPLASH-GUARD PARTITION WALL (Z = -0.340)
      //     - Separates wet chute from dry rear platform (X = -0.32..+0.92, Y = 0.946..1.54)
      //     - Sealed rotary shaft bearing gland at (X = +0.340, Y = 1.175, Z = -0.340)
      // =========================================================================
      const PARTITION_INFO = {
        name: 'Dinding Sekat Pelindung Zona Kering (Splash-Guard Partition)',
        material: 'Panel PVC Komposit Kedap Air + Frame Aluminium & Gland Bearing Kuningan',
        dims: 'Z = -0.340 m | X: -0.32..+0.92 m | Y: 0.946..1.540 m',
        desc: 'Dinding pembatas vertikal kedap air yang memisahkan total area basah saluran kincir dengan komponen transmisi, generator, baterai, dan lampu LED di zona kering belakang.'
      };

      (function buildSplashPartitionWall() {
        const g = subGroups.splashPartition;
        const wallZ = -0.340;
        const wallW = 1.24; // X = -0.32..+0.92
        const wallX = 0.30;
        const wallH = 0.594; // Y = 0.946..1.540
        const wallY = 0.946 + wallH / 2;

        g.add(createBoxPart(wallW, wallH, 0.022, wallX, wallY, wallZ, mats.splashWall, PARTITION_INFO));
        // Aluminum frame & EPDM rubber bottom water seal
        g.add(createBoxPart(wallW + 0.016, 0.018, 0.030, wallX, 1.540, wallZ, mats.aluminum, PARTITION_INFO));
        g.add(createBoxPart(wallW + 0.016, 0.016, 0.034, wallX, 0.954, wallZ, mats.rubber, PARTITION_INFO));
        g.add(createBoxPart(0.018, wallH, 0.030, -0.32, wallY, wallZ, mats.aluminum, PARTITION_INFO));
        g.add(createBoxPart(0.018, wallH, 0.030, 0.92, wallY, wallZ, mats.aluminum, PARTITION_INFO));

        // Sealed rotary ball-bearing shaft gland at (X = +0.340, Y = 1.175, Z = -0.340)
        const gland = new THREE.Mesh(
          new THREE.CylinderGeometry(0.042, 0.042, 0.042, 24),
          mats.brass
        );
        gland.rotation.x = Math.PI / 2;
        gland.position.set(WHEEL_X, WHEEL_Y, wallZ);
        registerPart(gland, PARTITION_INFO);
        g.add(gland);

        const oRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.042, 0.007, 12, 24),
          mats.rubber
        );
        oRing.position.set(WHEEL_X, WHEEL_Y, wallZ + 0.015);
        g.add(oRing);
      })();

      // =========================================================================
      // 16. REAR DRY PLATFORM EQUIPMENT (Z = -0.36..-0.72, RESTING ON TABLETOP Y = 0.946)
      //     - Pillow-block bearings supporting main shaft
      //     - 1:4 V-belt pulley transmission with animated belt
      //     - DC generator on slotted tension bracket
      //     - 12V battery + charge controller with red/black cabling
      //     - Digital instrument console (Main Shaft RPH, Generator RPH, Battery Voltage V)
      //     - 12 Watt LED load lamp with aluminum heatsink, switch & dynamic warm-white light
      // =========================================================================
      const PULLEY_INFO = {
        name: 'Transmisi Pulley & Sabuk V-Belt (Rasio Step-Up 1:4)',
        material: 'Pulley Aluminium Ø 270 mm + Pulley Kuningan Ø 67.5 mm + V-Belt Karet',
        dims: 'Z = -0.46 m | Rasio Putaran: 1 : 4 (Main Shaft → Generator)',
        desc: 'Meningkatkan kecepatan putaran poros utama sebesar 4 kali lipat ke poros generator DC di dalam zona kering yang aman dari cipratan air.'
      };

      const GENERATOR_INFO = {
        name: 'Generator DC Magnet Permanen & Bracket Tension',
        material: 'Stator Tembaga + Magnet Neodymium + Slotted Steel Tension Bracket',
        dims: 'Pusat Poros: X = +0.620 m, Y = 1.195 m, Z = -0.58 m',
        desc: 'Mengonversi putaran mekanik V-belt menjadi daya listrik DC untuk mengisi baterai 12V dan menyuplai beban lampu LED 12 Watt.'
      };

      const BATTERY_INFO = {
        name: 'Baterai 12V DC & Charge Controller',
        material: 'Baterai VRLA/LiFePO4 12V + Modul Charge Controller + Kabel Merah/Hitam',
        dims: 'Posisi: X = +0.06 m, Z = -0.55 m, Y = 0.946 m',
        desc: 'Menyimpan energi listrik hasil pembangkitan dan mengatur tegangan pengisian/pelepasan menuju rangkaian beban lampu LED 12 Watt.'
      };

      const CONSOLE_INFO = {
        name: 'Panel Instrumen Digital Zona Kering (RPH & Voltmeter)',
        material: '3 Unit Layar LCD Backlit Presisi + Rangka Penyangga Baja',
        dims: 'Posisi: X = +0.34 m, Z = -0.63 m, Y = 1.39 m',
        desc: 'Menampilkan pembacaan real-time RPH poros utama (Main Shaft), RPH generator (rasio 1:4), dan tegangan terminal baterai 12V.'
      };

      const LED_LAMP_INFO = {
        name: 'Beban Lampu LED 12 Watt & Saklar Beban',
        material: 'Lampu LED 12W 12V DC + Heatsink Aluminium Sirip + Saklar Toggle',
        dims: 'Posisi: X = -0.20 m, Z = -0.55 m, Y = 0.946..1.30 m',
        desc: 'Beban kelistrikan nyata 12 Watt dengan pencahayaan warm-white dinamis yang intensitasnya mengikuti tegangan baterai dan putaran kincir.'
      };

      let drivePulleyGrp;
      let genPulleyGrp;
      let beltCurvePath;
      const beltMarkers = [];
      let mainRphLcd;
      let genRphLcd;
      let voltLcd;
      let ledDomeMat;
      let ledConeMat;
      let ledPointLight;
      let ledSwitchLever;

      (function buildDryZoneGear() {
        const g = subGroups.dryZoneGear;
        const tableTopY = 0.946;
        const pulleyZ = -0.46;

        // --- A. PILLOW-BLOCK BEARINGS FOR MAIN SHAFT (Z = -0.39 and Z = -0.52) ---
        [-0.39, -0.52].forEach((bz) => {
          const postH = WHEEL_Y - 0.025 - tableTopY;
          g.add(createBoxPart(0.06, 0.010, 0.05, WHEEL_X, tableTopY + 0.005, bz, mats.steelFrame, WHEEL_INFO));
          g.add(createBoxPart(0.036, postH, 0.036, WHEEL_X, tableTopY + postH / 2, bz, mats.steelFrame, WHEEL_INFO));
          const block = createBoxPart(0.064, 0.052, 0.038, WHEEL_X, WHEEL_Y, bz, mats.brass, WHEEL_INFO);
          g.add(block);
        });

        // --- B. 1:4 V-BELT PULLEY TRANSMISSION (Z = -0.46) ---
        const R1 = 0.135;
        drivePulleyGrp = new THREE.Group();
        drivePulleyGrp.position.set(WHEEL_X, WHEEL_Y, pulleyZ);
        g.add(drivePulleyGrp);

        const bigPulley = new THREE.Mesh(
          new THREE.CylinderGeometry(R1, R1, 0.022, 36),
          mats.aluminum
        );
        bigPulley.rotation.x = Math.PI / 2;
        registerPart(bigPulley, PULLEY_INFO);
        drivePulleyGrp.add(bigPulley);

        // Optical tachometer marker tab on main pulley
        drivePulleyGrp.add(createBoxPart(0.016, 0.030, 0.025, 0, R1 - 0.02, 0, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }), CONSOLE_INFO, false));

        const GEN_X = 0.620;
        const GEN_Y = 1.195;
        const R2 = 0.03375; // Exact 1:4 ratio

        genPulleyGrp = new THREE.Group();
        genPulleyGrp.position.set(GEN_X, GEN_Y, pulleyZ);
        g.add(genPulleyGrp);

        const smallPulley = new THREE.Mesh(
          new THREE.CylinderGeometry(R2, R2, 0.022, 24),
          mats.brass
        );
        smallPulley.rotation.x = Math.PI / 2;
        registerPart(smallPulley, PULLEY_INFO);
        genPulleyGrp.add(smallPulley);

        // Closed tangent V-belt loop
        const c1 = new THREE.Vector3(WHEEL_X, WHEEL_Y, pulleyZ);
        const c2 = new THREE.Vector3(GEN_X, GEN_Y, pulleyZ);
        const dist = c1.distanceTo(c2);
        const baseAng = Math.atan2(GEN_Y - WHEEL_Y, GEN_X - WHEEL_X);
        const alpha = Math.asin((R1 - R2) / dist);
        const tTop = baseAng + Math.PI / 2 - alpha;
        const tBot = baseAng - Math.PI / 2 + alpha;

        const p1Top = new THREE.Vector3(WHEEL_X + R1 * Math.cos(tTop), WHEEL_Y + R1 * Math.sin(tTop), pulleyZ);
        const p2Top = new THREE.Vector3(GEN_X + R2 * Math.cos(tTop), GEN_Y + R2 * Math.sin(tTop), pulleyZ);
        const p2Bot = new THREE.Vector3(GEN_X + R2 * Math.cos(tBot), GEN_Y + R2 * Math.sin(tBot), pulleyZ);
        const p1Bot = new THREE.Vector3(WHEEL_X + R1 * Math.cos(tBot), WHEEL_Y + R1 * Math.sin(tBot), pulleyZ);

        beltCurvePath = new THREE.CurvePath();
        beltCurvePath.add(new THREE.LineCurve3(p1Top, p2Top));

        const arcR = [];
        for (let i = 0; i <= 12; i++) {
          const a = tTop - (i / 12) * (Math.PI - 2 * alpha);
          arcR.push(new THREE.Vector3(GEN_X + R2 * Math.cos(a), GEN_Y + R2 * Math.sin(a), pulleyZ));
        }
        beltCurvePath.add(new THREE.CatmullRomCurve3(arcR));
        beltCurvePath.add(new THREE.LineCurve3(p2Bot, p1Bot));

        const arcL = [];
        for (let i = 0; i <= 16; i++) {
          const a = tBot - (i / 16) * (Math.PI + 2 * alpha);
          arcL.push(new THREE.Vector3(WHEEL_X + R1 * Math.cos(a), WHEEL_Y + R1 * Math.sin(a), pulleyZ));
        }
        beltCurvePath.add(new THREE.CatmullRomCurve3(arcL));

        const beltTube = new THREE.Mesh(
          new THREE.TubeGeometry(beltCurvePath, 80, 0.006, 8, true),
          mats.rubber
        );
        registerPart(beltTube, PULLEY_INFO);
        g.add(beltTube);

        for (let i = 0; i < 16; i++) {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b })
          );
          dot.userData.u = i / 16;
          g.add(dot);
          beltMarkers.push(dot);
        }

        // --- C. DC GENERATOR ON SLOTTED TENSION BRACKET (X = +0.620, Y = 1.195, Z = -0.58) ---
        const genPedH = GEN_Y - 0.075 - tableTopY;
        g.add(createBoxPart(0.18, 0.012, 0.16, GEN_X, tableTopY + 0.006, -0.58, mats.steelFrame, GENERATOR_INFO));
        // Slotted tension adjustment rails
        [-0.05, 0.05].forEach((sx) => {
          g.add(createBoxPart(0.022, 0.016, 0.14, GEN_X + sx, tableTopY + 0.018, -0.58, mats.aluminum, GENERATOR_INFO));
        });
        g.add(createBoxPart(0.09, genPedH - 0.02, 0.09, GEN_X, tableTopY + 0.02 + (genPedH - 0.02) / 2, -0.58, mats.steelFrame, GENERATOR_INFO));

        const genBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.076, 0.076, 0.17, 28),
          mats.genBlue
        );
        genBody.rotation.x = Math.PI / 2;
        genBody.position.set(GEN_X, GEN_Y, -0.585);
        genBody.castShadow = true;
        registerPart(genBody, GENERATOR_INFO);
        g.add(genBody);

        const genShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.010, 0.010, 0.08, 16),
          mats.stainless
        );
        genShaft.rotation.x = Math.PI / 2;
        genShaft.position.set(GEN_X, GEN_Y, -0.49);
        g.add(genShaft);

        // --- D. 12V BATTERY & CHARGE CONTROLLER (X = +0.06, Z = -0.55, Y = 0.946) ---
        const batH = 0.175;
        g.add(createBoxPart(0.24, batH, 0.15, 0.06, tableTopY + batH / 2, -0.55, mats.batteryCase, BATTERY_INFO));
        g.add(createBoxPart(0.246, 0.018, 0.156, 0.06, tableTopY + batH + 0.009, -0.55, mats.steelFrame, BATTERY_INFO));

        const posTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.024, 12), mats.wireRed);
        posTerm.position.set(-0.01, tableTopY + batH + 0.028, -0.55);
        g.add(posTerm);

        const negTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.024, 12), mats.wireBlack);
        negTerm.position.set(0.13, tableTopY + batH + 0.028, -0.55);
        g.add(negTerm);

        // Charge Controller module mounted beside battery at X = +0.24, Z = -0.58
        g.add(createBoxPart(0.11, 0.095, 0.036, 0.24, tableTopY + 0.055, -0.58, mats.meterBox, BATTERY_INFO));
        g.add(createBoxPart(0.09, 0.042, 0.006, 0.24, tableTopY + 0.072, -0.60, new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }), BATTERY_INFO, false));

        // --- E. DIGITAL INSTRUMENT CONSOLE (MAIN SHAFT RPH, GENERATOR RPH, BATTERY VOLTAGE V) ---
        // Mounted on twin steel posts at X = +0.08 and X = +0.62, Z = -0.64, Y = 0.946..1.42
        const consoleY = 1.42;
        const consoleZ = -0.64;
        [0.08, 0.62].forEach((px) => {
          const postH = consoleY - tableTopY;
          g.add(createBoxPart(0.022, postH, 0.022, px, tableTopY + postH / 2, consoleZ, mats.steelFrame, CONSOLE_INFO));
        });
        // Horizontal instrument mounting crossbar
        g.add(createBoxPart(0.80, 0.026, 0.026, 0.35, consoleY, consoleZ, mats.steelFrame, CONSOLE_INFO));

        // 1. Battery Voltage (V) LCD at X = +0.09
        voltLcd = createDigitalInstrument('TEGANGAN BATERAI 12V', '#34d399', CONSOLE_INFO);
        voltLcd.group.position.set(0.09, consoleY, consoleZ - 0.022);
        voltLcd.group.rotation.y = Math.PI; // Faces rear dry zone (-Z)
        g.add(voltLcd.group);

        // 2. Main Shaft RPH LCD at X = +0.35
        mainRphLcd = createDigitalInstrument('RPH • MAIN SHAFT', '#fbbf24', CONSOLE_INFO);
        mainRphLcd.group.position.set(0.35, consoleY, consoleZ - 0.022);
        mainRphLcd.group.rotation.y = Math.PI;
        g.add(mainRphLcd.group);

        // 3. Generator RPH (1:4) LCD at X = +0.61
        genRphLcd = createDigitalInstrument('RPH • GENERATOR (1:4)', '#38bdf8', CONSOLE_INFO);
        genRphLcd.group.position.set(0.61, consoleY, consoleZ - 0.022);
        genRphLcd.group.rotation.y = Math.PI;
        g.add(genRphLcd.group);

        // --- F. 12 WATT LED LOAD LAMP (X = -0.20, Z = -0.55, Y = 0.946..1.30) ---
        const lampX = -0.20;
        const lampZ = -0.55;
        const standH = 1.29 - tableTopY;

        g.add(createBoxPart(0.13, 0.012, 0.13, lampX, tableTopY + 0.006, lampZ, mats.steelFrame, LED_LAMP_INFO));
        g.add(createBoxPart(0.022, standH, 0.022, lampX, tableTopY + standH / 2, lampZ, mats.steelFrame, LED_LAMP_INFO));

        // Physical Rocker Switch Box on lamp stand
        g.add(createBoxPart(0.068, 0.086, 0.038, lampX, 1.06, lampZ, mats.meterBox, LED_LAMP_INFO));
        ledSwitchLever = createBoxPart(0.028, 0.042, 0.022, lampX, 1.06, lampZ - 0.022, mats.wireRed, LED_LAMP_INFO, false);
        ledSwitchLever.rotation.x = 0.25;
        g.add(ledSwitchLever);

        // Finned Aluminum Heatsink Housing for 12W LED
        const heatsink = new THREE.Mesh(
          new THREE.CylinderGeometry(0.066, 0.054, 0.054, 24),
          mats.aluminum
        );
        heatsink.position.set(lampX, 1.30, lampZ);
        registerPart(heatsink, LED_LAMP_INFO);
        g.add(heatsink);

        for (let f = 0; f < 5; f++) {
          const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.004, 24), mats.aluminum);
          fin.position.set(lampX, 1.28 + f * 0.01, lampZ);
          g.add(fin);
        }

        // Emissive 12W LED Warm-White Dome Lens
        ledDomeMat = new THREE.MeshStandardMaterial({
          color: 0xfef9c3,
          emissive: 0xfde047,
          emissiveIntensity: 2.2,
          roughness: 0.18
        });
        const ledDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.052, 24, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55),
          ledDomeMat
        );
        ledDome.position.set(lampX, 1.275, lampZ);
        registerPart(ledDome, LED_LAMP_INFO);
        g.add(ledDome);

        // Soft warm-white volumetric light cone
        ledConeMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const lightCone = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.33, 24, 1, true),
          ledConeMat
        );
        lightCone.position.set(lampX, 1.11, lampZ);
        g.add(lightCone);

        // Dynamic THREE.PointLight illuminating the dry workspace
        ledPointLight = new THREE.PointLight(0xfef08a, 1.5, 1.8);
        ledPointLight.position.set(lampX, 1.17, lampZ);
        g.add(ledPointLight);

        // --- G. NEAT RED/BLACK DC WIRING HARNESS ---
        function addWire(pts, mat) {
          const curve = new THREE.CatmullRomCurve3(pts);
          g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.005, 8, false), mat));
        }

        // Generator -> Charge Controller -> Battery
        addWire([
          new THREE.Vector3(GEN_X, 1.12, -0.58),
          new THREE.Vector3(0.42, 0.98, -0.58),
          new THREE.Vector3(0.28, 0.99, -0.58)
        ], mats.wireRed);
        addWire([
          new THREE.Vector3(GEN_X, 1.11, -0.60),
          new THREE.Vector3(0.42, 0.97, -0.60),
          new THREE.Vector3(0.28, 0.98, -0.60)
        ], mats.wireBlack);

        addWire([
          new THREE.Vector3(0.19, 1.00, -0.58),
          new THREE.Vector3(0.05, 1.15, -0.56),
          new THREE.Vector3(-0.01, 1.14, -0.55)
        ], mats.wireRed);
        addWire([
          new THREE.Vector3(0.19, 0.99, -0.59),
          new THREE.Vector3(0.14, 1.15, -0.56),
          new THREE.Vector3(0.13, 1.14, -0.55)
        ], mats.wireBlack);

        // Battery -> Switch -> 12W LED Lamp
        addWire([
          new THREE.Vector3(-0.01, 1.14, -0.55),
          new THREE.Vector3(-0.12, 1.01, -0.55),
          new THREE.Vector3(lampX, 1.02, lampZ)
        ], mats.wireRed);
        addWire([
          new THREE.Vector3(lampX, 1.10, lampZ),
          new THREE.Vector3(lampX, 1.28, lampZ - 0.01)
        ], mats.wireRed);
        addWire([
          new THREE.Vector3(0.13, 1.14, -0.55),
          new THREE.Vector3(-0.08, 0.97, -0.58),
          new THREE.Vector3(lampX + 0.01, 1.28, lampZ - 0.02)
        ], mats.wireBlack);
      })();

      // =========================================================================
      // 17. CONTINUOUS MOVING WATER SIMULATION ALONG EXACT INTERIOR CENTERLINES
      //     - Suction pipe pulses (foot valve -> U-bend crest -> pump suction)
      //     - Pressure pipe pulses (pump discharge -> flow meter -> inside headbox nozzle)
      //     - Headbox calming swirl, sloped chute stream converging through guide walls
      //       (Z = ±0.20 -> Z = ±0.14), waterwheel paddle impact, tailrace waterfall
      //       through tabletop cutout into reservoir tank surface ripples!
      // =========================================================================
      const suctionPulses = [];
      const pressurePulses = [];
      const pulseGeo = new THREE.SphereGeometry(0.013, 10, 10);
      pulseGeo.scale(1.0, 1.65, 1.0);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.88
      });

      for (let i = 0; i < 42; i++) {
        const m = new THREE.Mesh(pulseGeo, pulseMat);
        m.userData.u = i / 42;
        subGroups.suctionAndPump.add(m);
        suctionPulses.push(m);
      }

      for (let i = 0; i < 68; i++) {
        const m = new THREE.Mesh(pulseGeo, pulseMat);
        m.userData.u = i / 68;
        subGroups.pressureAndFlowMeter.add(m);
        pressurePulses.push(m);
      }

      // 260 Instanced 3D water droplets for Headbox jet, Converged Chute Flow, Wheel Splashes & Tailrace Waterfall
      const DROPLET_COUNT = 260;
      const dropGeo = new THREE.SphereGeometry(0.010, 8, 8);
      const dropMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.88
      });
      const dropInstanced = new THREE.InstancedMesh(dropGeo, dropMat, DROPLET_COUNT);
      dropInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      subGroups.chuteAndRetainingWalls.add(dropInstanced);

      const droplets = [];
      for (let i = 0; i < DROPLET_COUNT; i++) {
        let mode = 1; // 0: headbox nozzle jet, 1: converged sloped chute stream, 2: waterfall into tank, 3: wheel paddle splash
        if (i < 35) mode = 0;
        else if (i < 165) mode = 1;
        else if (i < 225) mode = 2;
        else mode = 3;

        droplets.push({
          mode,
          t: Math.random(),
          zNorm: (Math.random() - 0.5) * 2.0, // -1..+1 normalized width
          jitter: 0.84 + Math.random() * 0.36
        });
      }

      const dummy = new THREE.Object3D();

      function updateMovingWater(dt, flowRatio, elapsed) {
        // 1. Over-the-Top Suction Pipe Centerline Flow
        const sStep = dt * 0.44 * flowRatio;
        for (let i = 0; i < suctionPulses.length; i++) {
          const p = suctionPulses[i];
          p.visible = flowRatio > 0.005;
          p.userData.u = (p.userData.u + sStep) % 1;
          const pt = suctionCurvePath.getPointAt(p.userData.u);
          const tan = suctionCurvePath.getTangentAt(p.userData.u);
          p.position.copy(pt);
          p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
        }

        // 2. Pressure Pipe & Inline Flow Meter Centerline Flow (entering inside Headbox nozzle)
        const pStep = dt * 0.28 * flowRatio;
        for (let i = 0; i < pressurePulses.length; i++) {
          const p = pressurePulses[i];
          p.visible = flowRatio > 0.005;
          p.userData.u = (p.userData.u + pStep) % 1;
          const pt = pressureCurvePath.getPointAt(p.userData.u);
          const tan = pressureCurvePath.getTangentAt(p.userData.u);
          p.position.copy(pt);
          p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
        }

        // 3. Sloped Chute Water Surface Texture Motion
        if (flumeStreamTex) {
          flumeStreamTex.offset.x -= dt * 2.2 * flowRatio;
        }
        if (flumeWaterMesh) {
          flumeWaterMesh.position.y = 0.017 + Math.sin(elapsed * 9) * 0.002 * flowRatio;
        }

        // 4. Headbox Nozzle Jet, Converging Guide-Wall Stream, Waterfall Skirt & Wheel Splashes
        for (let i = 0; i < DROPLET_COUNT; i++) {
          const d = droplets[i];
          if (flowRatio <= 0.005) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            dropInstanced.setMatrixAt(i, dummy.matrix);
            continue;
          }

          if (d.mode === 0) {
            // Downward discharge jet from internal nozzle (-0.840, 1.185, 0) passing under Headbox stilling baffle (X=-0.700)
            d.t += dt * 1.45 * flowRatio * d.jitter;
            if (d.t >= 1) d.t -= 1;
            const x = -0.840 + d.t * 0.180;
            const y = 1.185 - Math.sin(d.t * Math.PI * 0.5) * 0.052;
            const z = d.zNorm * (0.02 + d.t * 0.16);
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, 0, -0.4);
            dummy.scale.set(1.5, 0.85, 0.85);
          } else if (d.mode === 1) {
            // Sloped chute stream that narrows cleanly between the twin converging guide walls (X=-0.08..+0.20)
            d.t += dt * 0.85 * flowRatio * d.jitter;
            if (d.t >= 1) d.t -= 1;
            const x = CHUTE_X0 + d.t * CHUTE_DX;
            const y = getChuteFloorY(x) + 0.028 + Math.sin(d.t * 28 - elapsed * 14) * 0.005;

            // Compute half-width envelope matching the converging hydraulic guide walls (0.195m -> 0.125m)
            let halfW = 0.192;
            if (x >= -0.08 && x <= 0.20) {
              const k = (x - (-0.08)) / 0.28;
              halfW = 0.192 - k * (0.192 - 0.124);
            } else if (x > 0.20 && x <= 0.56) {
              halfW = 0.124 + ((x - 0.20) / 0.36) * 0.035;
            } else if (x > 0.56) {
              halfW = 0.165;
            }
            const z = d.zNorm * halfW;

            dummy.position.set(x, y, z);
            dummy.rotation.set(0, 0, CHUTE_ANGLE);
            dummy.scale.set(2.3, 0.65, 0.85);
          } else if (d.mode === 2) {
            // Cascading tailrace waterfall guided inside the downward splash skirt (X=+0.65, Y=0.975 -> tank water Y=0.660)
            d.t += dt * 1.65 * Math.max(0.35, flowRatio) * d.jitter;
            if (d.t >= 1) d.t -= 1;
            const prog = d.t;
            const x = 0.64 + Math.sin(prog * Math.PI) * 0.025 * flowRatio;
            const y = 0.985 - (prog * prog) * (0.985 - WATER_SURFACE_Y);
            const z = d.zNorm * 0.155;
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, 0, -Math.PI * 0.48);
            dummy.scale.set(1.9 + prog * 1.1, 0.85, 0.85);
          } else {
            // Water droplets splashed inside the raised waterwheel splash shields (X = +0.340)
            d.t += dt * 2.1 * flowRatio * d.jitter;
            if (d.t >= 1) d.t -= 1;
            const ang = d.t * Math.PI * 0.85;
            const r = 0.145 + Math.sin(d.t * Math.PI) * 0.055;
            const x = WHEEL_X + Math.cos(ang - 0.45) * r;
            const y = (WHEEL_Y - 0.11) + Math.sin(ang) * 0.11;
            const z = d.zNorm * 0.135;
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, 0, 0);
            const sc = (1 - d.t) * 1.05;
            dummy.scale.set(sc, sc, sc);
          }

          dummy.updateMatrix();
          dropInstanced.setMatrixAt(i, dummy.matrix);
        }
        dropInstanced.instanceMatrix.needsUpdate = true;

        // 5. Reservoir Tank Water Surface Undulation & Concentric Ripples
        if (tankWaterSurface) {
          tankWaterSurface.position.y = WATER_SURFACE_Y + Math.sin(elapsed * 5.5) * 0.0022 * flowRatio;
        }
        for (let i = 0; i < tankRipples.length; i++) {
          const ring = tankRipples[i];
          if (flowRatio <= 0.005) {
            ring.visible = false;
            continue;
          }
          ring.visible = true;
          ring.userData.phase = (ring.userData.phase + dt * 0.72 * Math.max(0.4, flowRatio)) % 1;
          const s = 0.55 + ring.userData.phase * 5.8;
          ring.scale.set(s, s, 1);
          ring.material.opacity = (1 - ring.userData.phase) * 0.78;
        }
      }


      // =========================================================================
      // CINEMATIC — PATCH MATERIAL MODEL, POST-PROCESSING, KAMERA OTOMATIS
      // =========================================================================
      // Aliran air & kilau dibuat additive supaya ikut menyala di bloom
      dropMat.color.set(0xbdeeff);
      dropMat.blending = THREE.AdditiveBlending;
      dropMat.depthWrite = false;
      dropMat.opacity = 0.95;
      pulseMat.color.set(0x5fd0ff);
      pulseMat.blending = THREE.AdditiveBlending;
      pulseMat.depthWrite = false;
      pulseMat.opacity = 0.95;

      scene.traverse(function (o) {
        if (!o.isMesh) return;
        const arr = Array.isArray(o.material) ? o.material : [o.material];
        arr.forEach(function (m) {
          if (!m || !m.isMeshStandardMaterial) return;
          let kind = 'std';
          if (tankWaterSurface && m === tankWaterSurface.material) kind = 'tank';
          else if (flumeWaterMesh && m === flumeWaterMesh.material) kind = 'flume';
          else if (m.transparent) kind = 'glass';
          patchStdMaterial(m, kind);
        });
      });

      // ---- Post-processing: MSAA + bloom + grading (teal/orange, chromatic aberration, vignette, grain) ----
      const GradeShader = {
        uniforms: {
          tDiffuse: { value: null },
          uTime: { value: 0 },
          uFade: { value: 0 },
          uBars: { value: OPT.bars ? 1 : 0 },
          uAspect: { value: window.innerWidth / window.innerHeight },
          uExposure: { value: OPT.exposure },
          uCA: { value: 0.012 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float uTime;
          uniform float uFade;
          uniform float uBars;
          uniform float uAspect;
          uniform float uExposure;
          uniform float uCA;
          varying vec2 vUv;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          vec3 aces(vec3 x) {
            const float a = 2.51; const float b = 0.03; const float c = 2.43; const float d = 0.59; const float e = 0.14;
            return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
          }
          void main() {
            vec2 uv = vUv;
            vec2 d = uv - 0.5;
            float r2 = dot(d, d);
            vec2 off = d * r2 * uCA;
            vec3 col;
            col.r = texture2D(tDiffuse, uv + off).r;
            col.g = texture2D(tDiffuse, uv).g;
            col.b = texture2D(tDiffuse, uv - off).b;

            col *= uExposure;
            col = aces(col);
            float l = dot(col, vec3(0.2126, 0.7152, 0.0722));

            // split toning: bayangan ke teal, highlight ke hangat
            col += vec3(-0.015, 0.012, 0.035) * pow(1.0 - l, 2.0);
            col += vec3(0.045, 0.022, -0.025) * pow(l, 2.0);
            col = mix(vec3(l), col, 1.14);
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.26);

            float v = 1.0 - smoothstep(0.35, 0.98, length(d) * 1.28);
            col *= mix(0.52, 1.0, v);

            float g = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 91.7) - 0.5;
            col += g * 0.04 * (1.0 - l * 0.6);

            if (uBars > 0.5) {
              float edge = 0.5 * min(1.0, uAspect / 2.39);
              col *= smoothstep(edge + 0.002, edge - 0.002, abs(uv.y - 0.5));
            }
            col *= uFade;
            gl_FragColor = vec4(col, 1.0);
          }`
      };

      let composer = null;
      let bloomPass = null;
      let gradePass = null;

      function initComposer() {
        if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.ShaderPass || !THREE.UnrealBloomPass) return;
        const w = window.innerWidth * pixelRatio;
        const h = window.innerHeight * pixelRatio;
        const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
        let rt;
        const isGL2 = renderer.capabilities.isWebGL2;
        const hdr = isGL2 && renderer.extensions.has('EXT_color_buffer_float');
        if (isGL2 && typeof THREE.WebGLMultisampleRenderTarget === 'function') {
          rt = new THREE.WebGLMultisampleRenderTarget(w, h, Object.assign({}, opts, hdr ? { type: THREE.HalfFloatType } : {}));
          rt.samples = 4;
        } else {
          rt = new THREE.WebGLRenderTarget(w, h, opts);
        }
        composer = new THREE.EffectComposer(renderer, rt);
        composer.setPixelRatio(pixelRatio);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), OPT.bloom, 0.5, 0.95);
        composer.addPass(bloomPass);
        gradePass = new THREE.ShaderPass(GradeShader);
        composer.addPass(gradePass);
      }
      try {
        initComposer();
      } catch (err) {
        console.warn('Post-processing dimatikan, pakai render langsung:', err);
        composer = null;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = OPT.exposure;
      }

      // ---- Resize (juga dipakai saat merekam 1080p) ----
      let forceW = 0, forceH = 0;
      function resize() {
        const w = forceW || window.innerWidth;
        const h = forceH || window.innerHeight;
        const pr = forceW ? 1 : pixelRatio;
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (composer) {
          composer.setPixelRatio(pr);
          composer.setSize(w, h);
        }
        if (gradePass) gradePass.uniforms.uAspect.value = w / h;
        dustMat.uniforms.uScale.value = h * pr;
      }
      window.addEventListener('resize', resize);
      resize();

      // =========================================================================
      // JALUR KAMERA: 8 SHOT, ~53 DETIK, LOOP
      // =========================================================================
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      const mixN = (a, b, u) => a + (b - a) * u;
      const easeU = (u) => mixN(u, u * u * (3 - 2 * u), 0.55);
      const DEG = Math.PI / 180;
      function orbitPos(cx, cz, r, deg, h) {
        const a = deg * DEG;
        return V(cx + Math.sin(a) * r, h, cz + Math.cos(a) * r);
      }

      const SHOTS = [
        {
          dur: 7.0, fov: [38, 34], no: '01', title: 'Gambaran Umum',
          sub: 'Project pembangkit mikrohidro', hero: true,
          at: (u) => ({
            p: orbitPos(0, -0.1, mixN(3.7, 2.8, u), mixN(-68, -32, u), mixN(1.0, 1.75, u)),
            t: V(mixN(-0.1, 0.0, u), mixN(0.8, 0.95, u), -0.1)
          })
        },
        {
          dur: 6.0, fov: [40, 34], no: '02', title: 'Headbox & Aliran Masuk',
          sub: 'Air ditenangkan dulu sebelum meluncur ke saluran',
          at: (u) => ({
            p: V(mixN(-1.5, -0.6, u), mixN(1.50, 1.42, u), mixN(0.95, 0.85, u)),
            t: V(mixN(-0.8, -0.15, u), mixN(1.2, 1.1, u), 0)
          })
        },
        {
          dur: 7.5, fov: [32, 34], no: '03', title: 'Kincir 6 Sudu',
          sub: 'Energi aliran berubah jadi putaran poros',
          at: (u) => ({
            p: orbitPos(0.34, 0, mixN(1.25, 0.95, u), mixN(-25, 50, u), mixN(1.32, 1.20, u)),
            t: V(mixN(0.34, 0.40, u), mixN(1.175, 1.10, u), 0)
          })
        },
        {
          dur: 6.0, fov: [36, 32], no: '04', title: 'Terjunan & Tangki',
          sub: 'Air jatuh kembali ke tangki, siap disirkulasi',
          at: (u) => ({
            p: V(mixN(1.65, 1.35, u), mixN(1.05, 0.82, u), mixN(1.45, 1.55, u)),
            t: V(0.62, mixN(0.80, 0.58, u), 0)
          })
        },
        {
          dur: 6.0, fov: [38, 34], no: '05', title: 'Pompa & Pipa',
          sub: 'Sirkulasi tertutup, anti bocor, dipantau flow meter',
          at: (u) => ({
            p: V(mixN(-1.15, 0.05, u), mixN(0.55, 0.62, u), mixN(1.5, 1.45, u)),
            t: V(mixN(-0.85, -0.10, u), mixN(0.78, 0.80, u), 0.1)
          })
        },
        {
          dur: 7.0, fov: [36, 33], no: '06', title: 'Zona Kering',
          sub: 'Panel ukur, baterai, dan beban lampu LED 12 W', scan: true,
          at: (u) => ({
            p: V(mixN(1.3, 0.1, u), mixN(1.45, 1.38, u), mixN(-2.45, -1.85, u)),
            t: V(mixN(0.3, 0.12, u), mixN(1.25, 1.28, u), -0.55)
          })
        },
        {
          dur: 6.0, fov: [34, 34], no: '07', title: 'Transmisi 1 : 4',
          sub: 'Puli dan V-belt menaikkan putaran ke generator', scan: true,
          at: (u) => ({
            p: orbitPos(0.48, -0.30, mixN(1.05, 0.80, u), mixN(158, 205, u), mixN(1.45, 1.30, u)),
            t: V(mixN(0.48, 0.50, u), mixN(1.18, 1.20, u), mixN(-0.25, -0.30, u))
          })
        },
        {
          dur: 7.5, fov: [36, 40], no: '08', title: 'Hasil Akhir',
          sub: 'Vortex Hydro • Mekanika Fluida Offering B', scan: true, finale: true,
          at: (u) => ({
            p: V(mixN(-1.2, -2.5, u), mixN(0.8, 2.7, u), mixN(2.9, 3.3, u)),
            t: V(0, mixN(0.85, 0.9, u), -0.1)
          })
        }
      ];
      const TOTAL = SHOTS.reduce((s, x) => s + x.dur, 0);

      // ---- UI (judul bab & kontrol) ----
      const elHero = document.getElementById('hero');
      const elChapter = document.getElementById('chapter');
      const elChNo = document.getElementById('ch-no');
      const elChTitle = document.getElementById('ch-title');
      const elChSub = document.getElementById('ch-sub');
      const elUi = document.getElementById('ui');
      const elLoader = document.getElementById('loader');
      const btnPlay = document.getElementById('btn-play');
      const btnBars = document.getElementById('btn-bars');
      const btnRec = document.getElementById('btn-rec');
      const btnFull = document.getElementById('btn-full');
      const elProgress = document.getElementById('progress-bar');

      if (!OPT.ui) elUi.style.display = 'none';
      if (!OPT.titles) {
        elHero.style.display = 'none';
        elChapter.style.display = 'none';
      }

      let lastShot = -1;
      function showShotUi(idx) {
        const s = SHOTS[idx];
        if (!OPT.titles) return;
        elChNo.textContent = s.no + ' / ' + String(SHOTS.length).padStart(2, '0');
        elChTitle.textContent = s.title;
        elChSub.textContent = s.sub;
        elChapter.classList.remove('show');
        elHero.classList.remove('show');
        void elChapter.offsetWidth;
        if (s.hero) elHero.classList.add('show');
        else elChapter.classList.add('show');
        if (s.finale) elChapter.classList.add('show');
      }

      // ---- Telemetri LCD pada panel (nilai hidup mengikuti debit) ----
      let lastTel = -10;
      function syncTelemetryLite(t, ratio) {
        if (t - lastTel < 0.25) return;
        lastTel = t;
        const flowLpm = 24.0 * ratio;
        if (flowLcdUnit) flowLcdUnit.updateDisplay(flowLpm.toFixed(1), 'L/min', 'DEBIT: ' + ((flowLpm * 60) / 1000).toFixed(2) + ' m³/h', 'FLOWING', '#38bdf8');
        const mainRpm = 80.0 * ratio;
        const mainRph = Math.round(mainRpm * 60);
        if (mainRphLcd) mainRphLcd.updateDisplay(mainRph.toLocaleString('en-US'), 'RPH', 'MAIN SHAFT: ' + mainRpm.toFixed(1) + ' RPM', 'ACTIVE', '#fbbf24');
        const genRpm = mainRpm * 4.0;
        if (genRphLcd) genRphLcd.updateDisplay(Math.round(genRpm * 60).toLocaleString('en-US'), 'RPH', 'GENERATOR: ' + genRpm.toFixed(0) + ' RPM (1:4)', 'GEN ON', '#38bdf8');
        const genWatts = 24.0 * Math.pow(ratio, 1.35);
        const netWatts = genWatts - 12.0;
        const batVolt = Math.max(11.6, Math.min(14.1, 12.2 + netWatts * 0.11));
        const batAmp = netWatts / batVolt;
        const badge = batAmp > 0.05 ? 'CHARGING' : 'DISCHARGE';
        const badgeCol = batAmp > 0.05 ? '#34d399' : '#fbbf24';
        if (voltLcd) voltLcd.updateDisplay(batVolt.toFixed(1), 'VOLT', 'ARUS: ' + (batAmp >= 0 ? '+' : '') + batAmp.toFixed(2) + ' A • BEBAN 12W', badge, badgeCol);
        const factor = Math.max(0.65, Math.min(1.18, (batVolt - 11.2) / 2.6));
        ledDomeMat.emissiveIntensity = 2.6 * factor;
        ledConeMat.opacity = 0.18 * factor;
        ledPointLight.intensity = 1.7 * factor;
      }

      // ---- Loop utama ----
      let T = 0;          // waktu timeline (detik)
      let paused = !OPT.autoplay;
      let recording = false;
      let recorder = null;
      let chunks = [];
      const clock = new THREE.Clock();
      const tmpP = new THREE.Vector3();
      const tmpT = new THREE.Vector3();
      let simTime = 0;
      let slowFrames = 0, fastFrames = 0, frameCount = 0;
      let firstFrame = true;

      function setPlayUi() {
        btnPlay.textContent = paused ? '▶ Putar' : '❚❚ Jeda';
      }

      function frame() {
        requestAnimationFrame(frame);
        const rawDt = Math.min(clock.getDelta(), 0.05);
        const dt = paused ? 0 : rawDt * OPT.speed;

        T += dt;
        simTime += dt;
        if (T >= TOTAL) {
          if (recording) { stopRecording(); T = TOTAL - 0.001; }
          else T = T % TOTAL;
        }

        // cari shot aktif
        let acc = 0, idx = 0;
        for (let i = 0; i < SHOTS.length; i++) {
          if (T < acc + SHOTS[i].dur || i === SHOTS.length - 1) { idx = i; break; }
          acc += SHOTS[i].dur;
        }
        const shot = SHOTS[idx];
        const local = Math.min(shot.dur, Math.max(0, T - acc));
        const u = easeU(local / shot.dur);
        if (idx !== lastShot) { lastShot = idx; showShotUi(idx); }

        const pose = shot.at(u);
        tmpP.copy(pose.p);
        tmpT.copy(pose.t);
        // goyangan tangan halus (handheld)
        const sx = Math.sin(simTime * 0.7) * 0.004 + Math.sin(simTime * 1.9 + 2.0) * 0.002;
        const sy = Math.sin(simTime * 0.9 + 1.0) * 0.003 + Math.sin(simTime * 2.3) * 0.0015;
        const sz = Math.sin(simTime * 0.6 + 3.0) * 0.004;
        tmpP.x += sx; tmpP.y += sy; tmpP.z += sz;
        tmpT.x += sx * 0.6; tmpT.y += sy * 0.6;
        camera.position.copy(tmpP);
        camera.lookAt(tmpT);
        const fov = mixN(shot.fov[0], shot.fov[1], easeU(local / shot.dur));
        if (Math.abs(camera.fov - fov) > 0.001) { camera.fov = fov; camera.updateProjectionMatrix(); }

        // fade hitam di awal/akhir tiap shot
        const edge = 0.45;
        let f = Math.min(1, local / edge, (shot.dur - local) / edge);
        f = Math.max(0, f);
        const fade = f * f * (3 - 2 * f);

        // debit "hidup": berdenyut halus
        const flowRatio = 0.93 + 0.06 * Math.sin(simTime * 0.35);
        const mainOmega = ((80 * Math.PI * 2) / 60) * flowRatio;
        if (hydroWheelRotor) hydroWheelRotor.rotation.z -= mainOmega * dt;
        if (drivePulleyGrp) drivePulleyGrp.rotation.z -= mainOmega * dt;
        if (genPulleyGrp) genPulleyGrp.rotation.z -= mainOmega * 4.0 * dt;
        if (beltCurvePath) {
          const bStep = dt * 0.68 * flowRatio;
          for (let i = 0; i < beltMarkers.length; i++) {
            const dot = beltMarkers[i];
            dot.userData.u = (dot.userData.u + bStep) % 1;
            dot.position.copy(beltCurvePath.getPointAt(dot.userData.u));
          }
        }
        if (flowTurbineRotor) flowTurbineRotor.rotation.y += mainOmega * 3.8 * dt;
        updateMovingWater(dt, flowRatio, simTime);
        syncTelemetryLite(simTime, flowRatio);

        // shader uniforms
        SHARED.uTime.value = simTime;
        skyMat.uniforms.uTime.value = simTime;
        floorMat.uniforms.uTime.value = simTime;
        dustMat.uniforms.uTime.value = simTime;
        beamMats.forEach((m) => { m.uniforms.uTime.value = simTime; });
        const scanEnv = shot.scan ? Math.min(1, local / 0.8, (shot.dur - local) / 0.8) : 0;
        SHARED.uScan.value = Math.max(0, scanEnv);
        SHARED.uScanX.value = mixN(-1.15, 1.15, (local / shot.dur));
        rimCyan.intensity = 1.0 + Math.sin(simTime * 0.5) * 0.12;

        if (gradePass) {
          gradePass.uniforms.uTime.value = simTime;
          gradePass.uniforms.uFade.value = fade;
          gradePass.uniforms.uBars.value = OPT.bars ? 1 : 0;
        }

        if (composer) composer.render(rawDt);
        else renderer.render(scene, camera);

        elProgress.style.transform = 'scaleX(' + (T / TOTAL).toFixed(4) + ')';

        if (firstFrame) {
          firstFrame = false;
          elLoader.classList.add('hide');
        }

        // kualitas adaptif: turunkan resolusi jika FPS rendah
        if (!recording && !paused) {
          frameCount++;
          if (rawDt > 0.034) slowFrames++; else fastFrames++;
          if (frameCount >= 90) {
            if (slowFrames > 55 && pixelRatio > 1) {
              pixelRatio = Math.max(1, pixelRatio - 0.25);
              resize();
            }
            frameCount = 0; slowFrames = 0; fastFrames = 0;
          }
        }
      }

      // ---- Kontrol ----
      function togglePlay() { paused = !paused; setPlayUi(); }
      function toggleBars() {
        OPT.bars = !OPT.bars;
        btnBars.classList.toggle('on', OPT.bars);
      }
      function toggleFull() {
        const el = document.documentElement;
        if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); }
        else { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); }
      }

      function startRecording() {
        if (recording) return;
        if (!window.MediaRecorder || !renderer.domElement.captureStream) {
          alert('Browser ini belum mendukung perekaman. Coba Chrome atau Edge di desktop.');
          return;
        }
        const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
        forceW = 1920; forceH = 1080;
        resize();
        const stream = renderer.domElement.captureStream(60);
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16000000 });
        chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'vortex-hydro-cinematic.webm';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
          forceW = 0; forceH = 0;
          resize();
          btnRec.classList.remove('on');
          btnRec.textContent = '⏺ Rekam';
          T = 0; lastShot = -1;
        };
        T = 0; lastShot = -1; paused = false; setPlayUi();
        recording = true;
        btnRec.classList.add('on');
        btnRec.textContent = '● Merekam…';
        recorder.start(250);
      }
      function stopRecording() {
        if (!recording) return;
        recording = false;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      }

      btnPlay.addEventListener('click', togglePlay);
      btnBars.addEventListener('click', toggleBars);
      btnFull.addEventListener('click', toggleFull);
      btnRec.addEventListener('click', () => { recording ? stopRecording() : startRecording(); });
      btnBars.classList.toggle('on', OPT.bars);
      setPlayUi();

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        else if (e.key === 'b' || e.key === 'B') toggleBars();
        else if (e.key === 'f' || e.key === 'F') toggleFull();
        else if (e.key === 'r' || e.key === 'R') { recording ? stopRecording() : startRecording(); }
        else if (e.key === 'ArrowRight') { T = Math.min(TOTAL - 0.01, T + 3); lastShot = -1; }
        else if (e.key === 'ArrowLeft') { T = Math.max(0, T - 3); lastShot = -1; }
      });

      // klik pada video = jeda/putar (kecuali di tombol)
      stage.addEventListener('click', togglePlay);

      // kontrol auto-hide
      let hideTimer = null;
      function wakeUi() {
        elUi.classList.add('awake');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => elUi.classList.remove('awake'), 2600);
      }
      window.addEventListener('pointermove', wakeUi);
      window.addEventListener('touchstart', wakeUi, { passive: true });
      wakeUi();

      frame();
    });
  
