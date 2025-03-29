import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Package, PalletSize } from '../utils/calculations';

interface PalletVisualizationProps {
  packages: Package[];
  palletSize: PalletSize;
}

const Box: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}> = ({ position, size, color = '#3b82f6' }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const PalletVisualization: React.FC<PalletVisualizationProps> = ({ packages, palletSize }) => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Pallet base */}
        <Box 
          position={[0, -0.5, 0]} 
          size={[palletSize.length / 100, 1, palletSize.width / 100]} 
          color="#8B4513"
        />
        
        {/* Packages */}
        {packages.map((pkg, index) => (
          <Box
            key={pkg.id}
            position={[
              (index % 2) * (pkg.length / 100) - (pkg.length / 200),
              pkg.height / 200,
              Math.floor(index / 2) * (pkg.width / 100) - (pkg.width / 200)
            ]}
            size={[pkg.length / 100, pkg.height / 100, pkg.width / 100]}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default PalletVisualization;