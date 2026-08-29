"use client";

import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Environment } from "@react-three/drei";

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} />
        <pointLight position={[-5, -3, -3]} intensity={0.5} color="#22c55e" />

        <Float speed={1.4} rotationIntensity={0.7} floatIntensity={1.4}>
          <mesh position={[1.6, 0.6, -1]}>
            <icosahedronGeometry args={[1.5, 1]} />
            <MeshDistortMaterial
              color="#f59e0b"
              distort={0.35}
              speed={1.5}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
        </Float>

        <Float speed={1.8} rotationIntensity={1} floatIntensity={2} position={[-2.2, -0.8, 0]}>
          <mesh>
            <torusGeometry args={[0.7, 0.22, 24, 64]} />
            <MeshDistortMaterial color="#38bdf8" distort={0.25} speed={2} roughness={0.25} metalness={0.4} />
          </mesh>
        </Float>

        <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1} position={[-0.8, 1.6, 1]}>
          <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <MeshDistortMaterial color="#22c55e" distort={0.4} speed={1.8} roughness={0.15} metalness={0.5} />
          </mesh>
        </Float>

        <Sparkles count={60} scale={8} size={2} speed={0.3} color="#f59e0b" opacity={0.6} />
        <Environment preset="night" environmentIntensity={0.4} />
      </Canvas>
    </div>
  );
}
