import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * AtelierSilkCanvas — 3D Tactile Silk & Fabric Mesh Canvas (Three.js)
 * High-performance, lazy-observed, responsive, prefers-reduced-motion aware.
 */
const AtelierSilkCanvas = ({ className = "", style = {} }) => {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setHasWebGL(false);
      return;
    }

    // Prefers-reduced-motion check
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Dimensions
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    // 2. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 3. Geometry: Dense grid for silky organic cloth waves
    const geometry = new THREE.PlaneGeometry(10, 6, 64, 48);
    const positionAttribute = geometry.attributes.position;
    const initialPositions = positionAttribute.array.slice();

    // 4. Material: Luxury Silk Sheen (Subtle champagne gold reflection on deep obsidian ground)
    const material = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.35,
      metalness: 0.65,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const silkMesh = new THREE.Mesh(geometry, material);
    silkMesh.rotation.x = -0.35;
    silkMesh.rotation.y = 0.1;
    scene.add(silkMesh);

    // 5. Lighting: Architectural & Editorial
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Champagne gold directional key light
    const keyLight = new THREE.DirectionalLight(0xd4af37, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Cool rim light for fabric edge highlights
    const rimLight = new THREE.DirectionalLight(0x8fa3b0, 1.4);
    rimLight.position.set(-4, -3, 3);
    scene.add(rimLight);

    // Mouse tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetMouseX = x * 1.5;
      targetMouseY = -y * 1.5;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // Visibility Observer to pause loop when off-screen
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = clock.getElapsedTime();

      // Mouse lerping
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      silkMesh.rotation.z = currentMouseX * 0.15;
      silkMesh.rotation.x = -0.35 + currentMouseY * 0.15;

      // Silky Wave Displacement
      if (!prefersReducedMotion) {
        const positions = positionAttribute.array;
        const count = positionAttribute.count;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const u = initialPositions[i3];
          const v = initialPositions[i3 + 1];

          // Complex gentle harmonic wave
          const wave1 = Math.sin(u * 1.2 + elapsedTime * 1.1) * 0.35;
          const wave2 = Math.cos(v * 1.5 + elapsedTime * 0.8) * 0.25;
          const ripple =
            Math.sin(
              Math.sqrt((u - currentMouseX * 3) ** 2 + (v - currentMouseY * 3) ** 2) * 2 -
                elapsedTime * 2
            ) * 0.12;

          positions[i3 + 2] = wave1 + wave2 + ripple;
        }

        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
      }

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Render initial frame
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#121316] via-[#1a1b1f] to-[#0A0A0C] ${className}`}
        style={style}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(197,168,128,0.3),transparent_70%)]" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export default AtelierSilkCanvas;
