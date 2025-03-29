import React from 'react';
import { Package, PalletSize } from '../utils/calculations';

interface PalletDiagramProps {
  pkg: Package;
  palletSize: PalletSize;
  stacking: {
    layers: number;
    itemsPerLayer: number;
    totalItems: number;
  };
}

const PalletDiagram: React.FC<PalletDiagramProps> = ({ pkg, palletSize, stacking }) => {
  const scale = 200 / Math.max(palletSize.length, palletSize.width);
  
  const palletStyle = {
    width: `${palletSize.length * scale}px`,
    height: `${palletSize.width * scale}px`,
    border: '2px solid #666',
    position: 'relative' as const,
    backgroundColor: '#e5e7eb'
  };

  const boxStyle = {
    width: `${pkg.length * scale}px`,
    height: `${pkg.width * scale}px`,
    backgroundColor: '#3b82f6',
    border: '1px solid #1d4ed8',
    position: 'absolute' as const
  };

  const boxes = [];
  const boxesPerRow = Math.floor(palletSize.length / pkg.length);
  const boxesPerCol = Math.floor(palletSize.width / pkg.width);

  for (let i = 0; i < boxesPerRow * boxesPerCol; i++) {
    const row = Math.floor(i / boxesPerRow);
    const col = i % boxesPerRow;
    boxes.push(
      <div
        key={i}
        style={{
          ...boxStyle,
          left: `${col * pkg.length * scale}px`,
          top: `${row * pkg.width * scale}px`,
          opacity: i < stacking.itemsPerLayer ? 1 : 0.2
        }}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Pallet Stacking Diagram</h3>
      <div className="flex gap-4">
        <div style={palletStyle} className="mb-4">
          {boxes}
        </div>
        <div className="text-sm">
          <p>Items per layer: {stacking.itemsPerLayer}</p>
          <p>Number of layers: {stacking.layers}</p>
          <p>Total items: {stacking.totalItems}</p>
          <p className="mt-2 text-gray-600">
            Showing top view of first layer
          </p>
        </div>
      </div>
    </div>
  );
};

export default PalletDiagram;