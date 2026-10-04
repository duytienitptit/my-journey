"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createGarden, disposeGarden, type GardenState } from "./garden-model";
import { ForestGrove } from "./ForestGrove";

type Props = GardenState & { visible: boolean };

/** Render on demand: zero continuous render loop while focusing, typing or idle. */
export default function GroveCanvas({ levels, neglect, danger, streak, visible }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const updateRef = useRef<((state: GardenState) => void) | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const initial = useRef({ levels, neglect, danger, streak });

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch {
      // Reflect an external GPU initialization failure in the accessible SVG fallback.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, .1, 60);
    camera.position.set(0, 5.5, 9); camera.lookAt(0, 1.45, 0);
    const ambient = new THREE.HemisphereLight("#fff4d7", "#71624b", 2.3); scene.add(ambient);
    const sun = new THREE.DirectionalLight("#ffe3b1", 3.2);
    sun.position.set(-4, 8, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 6, bottom: -4, near: .5, far: 25 });
    sun.shadow.normalBias = .035; sun.shadow.bias = -.0005;
    scene.add(sun);
    const rim = new THREE.DirectionalLight("#b9d3e5", 1.2); rim.position.set(4, 5, -4); scene.add(rim);
    const nightGlow = new THREE.PointLight("#ffd08b", 0, 10, 2); nightGlow.position.set(.6, 1.8, 2.5); scene.add(nightGlow);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: "#413923", opacity: .12 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.43; floor.receiveShadow = true; scene.add(floor);
    let garden = createGarden(initial.current); scene.add(garden);
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.visibilityState !== "hidden") renderer.render(scene, camera);
      });
    };
    function theme() {
      const night = document.documentElement.dataset.theme === "dark";
      ambient.color.set(night ? "#b8d1e9" : "#fff4d7"); ambient.intensity = night ? 1.1 : 2.3;
      sun.color.set(night ? "#accee8" : "#ffe3b1"); sun.intensity = night ? 1.3 : 3.2;
      rim.intensity = night ? .8 : 1.2; nightGlow.intensity = night ? 9 : 0;
      renderer.toneMappingExposure = night ? .95 : 1.05;
      draw();
    }
    const themeObserver = new MutationObserver(theme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const halfHeight = Math.max(3.12, 3.65 / aspect);
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix();
      renderer.setSize(width, height); draw();
    });
    resize.observe(container); theme();
    const contextLost = (event: Event) => { event.preventDefault(); setUnavailable(true); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const contextRestored = () => { setUnavailable(false); draw(); };
    renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
    renderRef.current = draw;
    updateRef.current = (state) => {
      const next = createGarden(state);
      scene.remove(garden); disposeGarden(garden); garden = next; scene.add(garden); draw();
    };
    document.addEventListener("visibilitychange", draw);
    return () => {
      renderRef.current = null; updateRef.current = null;
      cancelAnimationFrame(frame); resize.disconnect(); themeObserver.disconnect();
      document.removeEventListener("visibilitychange", draw);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
      disposeGarden(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);

  // The timer re-renders every second. Rebuild only when visual state actually changes.
  useEffect(() => {
    updateRef.current?.({ levels: { mind: levels.mind, health: levels.health, spirit: levels.spirit },
      neglect: { mind: neglect.mind, health: neglect.health, spirit: neglect.spirit }, danger, streak });
  }, [levels.mind, levels.health, levels.spirit, neglect.mind, neglect.health, neglect.spirit, danger, streak]);
  useEffect(() => { if (visible) renderRef.current?.(); }, [visible]);

  return <div className="grove-canvas" ref={host}>
    {unavailable && <div className="grove-fallback"><ForestGrove levels={levels} streak={streak} danger={danger} neglectDanger={neglect}/></div>}
  </div>;
}
