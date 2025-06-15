
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Box, Line } from '@react-three/drei';
import * as THREE from 'three';

const Nodes = () => {
    const groupRef = useRef<THREE.Group>(null!);
    
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30
            );
            temp.push(pos);
        }
        return temp;
    }, []);

    const lines = useMemo(() => {
        const temp: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].distanceTo(nodes[j]) < 12 && Math.random() > 0.7) {
                    temp.push({ start: nodes[i], end: nodes[j] });
                }
            }
        }
        return temp;
    }, [nodes]);

    useFrame((_state, delta) => {
        if(groupRef.current) {
            groupRef.current.rotation.y += delta * 0.02;
            groupRef.current.rotation.x += delta * 0.01;
        }
    });

    return (
        <group ref={groupRef}>
            {nodes.map((pos, i) => (
                <Box key={i} position={pos} args={[0.5, 0.5, 0.5]}>
                    <meshStandardMaterial color="#217bff" emissive="#217bff" emissiveIntensity={0.5} wireframe />
                </Box>
            ))}
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={[line.start, line.end]}
                    color="#ffffff"
                    lineWidth={0.5}
                    transparent
                    opacity={0.3}
                />
            ))}
        </group>
    );
};

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 30] }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} color="#217bff" intensity={2} distance={100}/>
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={5}
          saturation={0}
          fade
          speed={1}
        />
        <Nodes />
      </Canvas>
    </div>
  );
};

export default AnimatedBackground;
