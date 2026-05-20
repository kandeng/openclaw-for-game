import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Component, Suspense, type ReactNode } from 'react';
import * as THREE from 'three';
import type { EntityState } from '../App';

function AirportSquare() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[4, 4]} />
      <meshStandardMaterial color="#d1d5db" side={THREE.DoubleSide} />
    </mesh>
  );
}

function GridLines() {
  return (
    <gridHelper args={[10, 10, '#9ca3af', '#e5e7eb']} position={[0, 0.01, 0]} />
  );
}

const MODEL_URL = `${import.meta.env.BASE_URL}models/crazyflie_2.x.glb`;

function DroneModel({ state }: { state: EntityState }) {
  const { scene } = useGLTF(MODEL_URL);
  return (
    <primitive
      object={scene.clone()}
      position={[state.x, state.z, -state.y]}
      rotation={[0, (state.yaw * Math.PI) / 180, 0]}
      scale={[3, 3, 3]}
    />
  );
}

interface ThreeSceneProps {
  entityState: EntityState;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-400 text-sm">3D scene unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ThreeScene({ entityState }: ThreeSceneProps) {
  const fov = Math.max(20, 75 - entityState.focal * 5);

  return (
    <CanvasErrorBoundary>
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [3, 3, 3], fov, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <Suspense fallback={null}>
            <AirportSquare />
            <GridLines />
            <DroneModel state={entityState} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
