import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function SignalFabricCanvas({ className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let scene, camera, renderer, mesh, animationFrameId;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    try {
      scene = new THREE.Scene();
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 500;

      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 2.5;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Create silk plane
      const geometry = new THREE.PlaneGeometry(3.6, 2.4, 48, 36);
      const material = new THREE.MeshStandardMaterial({
        color: 0x1a1a20,
        roughness: 0.35,
        metalness: 0.65,
        wireframe: false,
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -0.3;
      scene.add(mesh);

      // Light setup: high contrast key light + orange signal rim light
      const dirLight = new THREE.DirectionalLight(0xf4f0e8, 2.5);
      dirLight.position.set(2, 4, 3);
      scene.add(dirLight);

      const signalLight = new THREE.PointLight(0xe65100, 4.0, 8);
      signalLight.position.set(-2, 1, 1.5);
      scene.add(signalLight);

      const ambientLight = new THREE.AmbientLight(0x0c0c0e, 1.2);
      scene.add(ambientLight);

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
      };

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener("resize", handleResize);
      container.addEventListener("mousemove", handleMouseMove);

      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Wave deformation
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getY(i);
          const wave =
            Math.sin(u * 2.5 + elapsedTime * 1.2) * 0.12 +
            Math.cos(v * 3.0 + elapsedTime * 0.9) * 0.08;
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;

        // Smooth cursor tracking
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        mesh.rotation.y = targetX * 0.25;
        mesh.rotation.x = -0.3 + targetY * 0.2;

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("mousemove", handleMouseMove);
        if (renderer?.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    } catch (e) {
      console.warn("WebGL not supported or error initializing Three.js:", e);
    }
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[360px] pointer-events-auto overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Fallback subtle geometric mesh background if WebGL is disabled */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#121215] via-[#1a1a20]/40 to-transparent pointer-events-none" />
    </div>
  );
}
