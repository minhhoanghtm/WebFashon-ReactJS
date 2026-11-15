import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SignalFabricCanvas({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    // Scene & Camera setup per threejs-fundamentals
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL not supported, fallback remains visible
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Create tactile sculptural fabric plane with custom vertex wave
    const geometry = new THREE.PlaneGeometry(3.6, 3.6, 48, 48);
    const material = new THREE.MeshStandardMaterial({
      color: 0xd6532c, // Oxidized signal orange
      roughness: 0.35,
      metalness: 0.15,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 4.5;
    mesh.rotation.z = Math.PI / 10;
    scene.add(mesh);

    // Dynamic light rigs
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd8f04a, 2.2); // Acid lime highlight
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3449d2, 1.8); // Cobalt fill
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    // Pointer response
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.3;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Animation loop & pause on view departure
    let isVisible = true;
    let animId = null;
    let clock = new THREE.Clock();
    const posAttr = geometry.attributes.position;
    const initialZ = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      initialZ[i] = posAttr.getZ(i);
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animId) {
        clock.start();
        renderFrame();
      }
    }, { threshold: 0.1 });
    observer.observe(container);

    function renderFrame() {
      if (!isVisible) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(renderFrame);

      const elapsed = clock.getElapsedTime();

      // Fluid fabric wave math across vertices
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const wave =
          Math.sin(u * 2.2 + elapsed * 1.8) * 0.22 +
          Math.cos(v * 1.9 + elapsed * 1.5) * 0.18 +
          Math.sin((u + v) * 1.5 + elapsed * 2.1) * 0.12;
        posAttr.setZ(i, initialZ[i] + wave);
      }
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      // Smooth camera tilt towards pointer target
      mesh.rotation.y += (targetX - mesh.rotation.y) * 0.05;
      mesh.rotation.x += (-Math.PI / 4.5 + targetY - mesh.rotation.x) * 0.05;

      renderer.render(scene, camera);
    }
    renderFrame();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Strict resource cleanup per threejs-fundamentals
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      if (animId) cancelAnimationFrame(animId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="orb orb-one" />
      <div className="orb orb-two" />
    </div>
  );
}
