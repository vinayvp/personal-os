
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Box } from '@react-three/drei';
import * as THREE from 'three';

const Nodes = () => {
    const groupRef = useRef<THREE.Group>(null);
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 15; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            temp.push({ pos });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if(groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05;
            groupRef.current.rotation.x += delta * 0.02;
        }
    });

    return (
        <group ref={groupRef}>
            {nodes.map((node, i) => (
                <Box key={i} position={node.pos} args={[0.4, 0.4, 0.4]}>
                    <meshBasicMaterial color="#217bff" transparent opacity={0.6} wireframe />
                </Box>
            ))}
        </group>
    );
};

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full -z-10">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <Stars
          radius={50}
          depth={50}
          count={5000}
          factor={4}
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
