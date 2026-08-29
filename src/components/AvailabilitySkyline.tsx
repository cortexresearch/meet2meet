"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Environment } from "@react-three/drei";
import { format, isSameDay } from "date-fns";
import * as THREE from "three";

export type SkylineSlot = {
  id: string;
  start: string | Date;
  end: string | Date;
  count: number;
  names: string[];
};

type Mode = "select" | "pick" | "view";

function lerpColor(t: number) {
  // cool slate -> amber -> hot green, mirrors the "heat" of availability
  const c1 = new THREE.Color("#1e293b");
  const c2 = new THREE.Color("#f59e0b");
  const c3 = new THREE.Color("#22c55e");
  if (t < 0.5) return c1.clone().lerp(c2, t / 0.5);
  return c2.clone().lerp(c3, (t - 0.5) / 0.5);
}

function Bar({
  slot,
  position,
  heightScale,
  isMine,
  isFinal,
  mode,
  onClick,
}: {
  slot: SkylineSlot;
  position: [number, number, number];
  heightScale: number;
  isMine: boolean;
  isFinal: boolean;
  mode: Mode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const baseHeight = Math.max(heightScale, 0.06);
  const targetHeight = useRef(baseHeight);
  targetHeight.current = baseHeight;

  useFrame(() => {
    if (!meshRef.current) return;
    const h = meshRef.current.scale.y;
    const goal = isFinal ? targetHeight.current * 1.15 : targetHeight.current;
    meshRef.current.scale.y = THREE.MathUtils.lerp(h, goal, 0.15);
    meshRef.current.position.y = (meshRef.current.scale.y * 1) / 2;
    if (isFinal) {
      const pulse = 1 + Math.sin(performance.now() / 300) * 0.03;
      meshRef.current.scale.x = pulse;
      meshRef.current.scale.z = pulse;
    } else {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, hovered ? 1.15 : 1, 0.2);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, hovered ? 1.15 : 1, 0.2);
    }
  });

  const color = isFinal ? "#facc15" : isMine ? "#38bdf8" : lerpColor(heightScale);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          if (mode !== "view") onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = mode !== "view" ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[0.7, 1, 0.7]} />
        <meshStandardMaterial
          color={color}
          emissive={isFinal ? "#facc15" : isMine ? "#0284c7" : "#000000"}
          emissiveIntensity={isFinal ? 0.6 : isMine ? 0.3 : 0}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      {hovered && (
        <Html position={[0, baseHeight + 0.9, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-xs text-white shadow-xl whitespace-nowrap">
            <div className="font-semibold">{format(new Date(slot.start), "EEE h:mm a")}</div>
            <div className="text-white/60">
              {slot.count} {slot.count === 1 ? "person" : "people"} free
            </div>
            {slot.names.length > 0 && (
              <div className="text-white/40 mt-0.5">{slot.names.join(", ")}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({
  slots,
  selectedIds,
  finalSlotId,
  mode,
  onBarClick,
}: {
  slots: SkylineSlot[];
  selectedIds: Set<string>;
  finalSlotId?: string | null;
  mode: Mode;
  onBarClick: (id: string) => void;
}) {
  const { columns, maxCount, dayLabels } = useMemo(() => {
    const days: Date[] = [];
    for (const s of slots) {
      const d = new Date(s.start);
      if (!days.some((existing) => isSameDay(existing, d))) days.push(d);
    }
    days.sort((a, b) => a.getTime() - b.getTime());
    const cols = days.map((day) => ({
      day,
      slots: slots
        .filter((s) => isSameDay(new Date(s.start), day))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    }));
    const max = Math.max(1, ...slots.map((s) => s.count));
    return { columns: cols, maxCount: max, dayLabels: days.map((d) => format(d, "EEE M/d")) };
  }, [slots]);

  const spacing = 1.1;
  const rowCount = Math.max(...columns.map((c) => c.slots.length), 1);
  const xOffset = ((columns.length - 1) * spacing) / 2;
  const zOffset = ((rowCount - 1) * spacing) / 2;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />
      <pointLight position={[-6, 4, -4]} intensity={0.4} color="#38bdf8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0b1120" roughness={1} />
      </mesh>
      <gridHelper args={[40, 40, "#1e293b", "#0f172a"]} position={[0, 0, 0]} />

      {columns.map((col, ci) => (
        <group key={ci}>
          <Text
            position={[ci * spacing - xOffset, 0.02, zOffset + 1.1]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.28}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {dayLabels[ci]}
          </Text>
          {col.slots.map((slot, si) => (
            <Bar
              key={slot.id}
              slot={slot}
              position={[ci * spacing - xOffset, 0, si * spacing - zOffset]}
              heightScale={(slot.count / maxCount) * 3}
              isMine={selectedIds.has(slot.id)}
              isFinal={finalSlotId === slot.id}
              mode={mode}
              onClick={() => onBarClick(slot.id)}
            />
          ))}
        </group>
      ))}
    </>
  );
}

export default function AvailabilitySkyline({
  slots,
  selectedIds = new Set(),
  finalSlotId = null,
  mode,
  onBarClick,
  height = 420,
}: {
  slots: SkylineSlot[];
  selectedIds?: Set<string>;
  finalSlotId?: string | null;
  mode: Mode;
  onBarClick: (id: string) => void;
  height?: number;
}) {
  if (slots.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-white/40 text-sm"
      >
        No time slots yet
      </div>
    );
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
      <Canvas shadows camera={{ position: [7, 6.5, 9], fov: 42 }}>
        <Scene slots={slots} selectedIds={selectedIds} finalSlotId={finalSlotId} mode={mode} onBarClick={onBarClick} />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.6}
        />
        <Environment preset="city" environmentIntensity={0.3} />
      </Canvas>
    </div>
  );
}
