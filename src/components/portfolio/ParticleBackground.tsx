
import * as THREE from 'three';
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

function Particles({ count }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const { viewport } = useThree();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -viewport.width / 2 + Math.random() * viewport.width;
      const yFactor = -viewport.height / 2 + Math.random() * viewport.height;
      const zFactor = -20 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count, viewport.width, viewport.height]);

  useFrame((state) => {
    if(!mesh.current) return;

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      
      t = particle.t += speed;
      
      const s = Math.cos(t);
      
      particle.mx += (state.mouse.x * viewport.width - particle.mx) * 0.02;
      particle.my += (state.mouse.y * viewport.height - particle.my) * 0.02;
      
      dummy.position.set(
        xFactor + particle.mx / 10 + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        yFactor + particle.my / 10 + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      dummy.scale.setScalar(s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} emissive="#333333" />
    </instancedMesh>
  );
}

const ParticleBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[100, 100, 100]} intensity={0.5} color="lightblue" />
        <pointLight position={[-100, -100, -100]} intensity={1} color="pink" />
        <Particles count={150} />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
