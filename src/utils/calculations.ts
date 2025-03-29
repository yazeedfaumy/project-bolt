import { LengthUnit, WeightUnit, CurrencyCode, convertLength, convertWeight } from './units';

export interface Package {
  id?: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  lengthUnit: LengthUnit;
  weightUnit: WeightUnit;
}

export interface PalletSize {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  maxWeight: number;
  description: string;
  lengthUnit: LengthUnit;
}

export interface Location {
  id: string;
  name: string;
  country: string;
  zipCode: string;
  taxRate: number;
  currencyCode: CurrencyCode;
}

export interface ProductCategory {
  id: string;
  name: string;
  baseRate: number;
  description: string;
}

export interface ShippingCostConfig {
  type: 'weight' | 'volume' | 'distance';
  unit: 'kg' | 'lbs' | 'm3' | 'ft3' | 'km' | 'mi';
  ratePerUnit: number;
  currency: CurrencyCode;
  taxRate: number;
}

export interface ShippingResult {
  shippingCost: number;
  tax: number;
  totalCost: number;
  warnings: string[];
  recommendations: string[];
  calculations: string[];
  currencyCode: CurrencyCode;
  palletsNeeded: number;
  totalWeight: number;
}

const convertPackageToMm = (pkg: Package): Package => {
  return {
    ...pkg,
    length: convertLength(pkg.length, pkg.lengthUnit, 'mm'),
    width: convertLength(pkg.width, pkg.lengthUnit, 'mm'),
    height: convertLength(pkg.height, pkg.lengthUnit, 'mm'),
    weight: convertWeight(pkg.weight, pkg.weightUnit, 'kg'),
    lengthUnit: 'mm',
    weightUnit: 'kg'
  };
};

const convertPalletToMm = (pallet: PalletSize): PalletSize => {
  return {
    ...pallet,
    length: convertLength(pallet.length, pallet.lengthUnit, 'mm'),
    width: convertLength(pallet.width, pallet.lengthUnit, 'mm'),
    height: convertLength(pallet.height, pallet.lengthUnit, 'mm'),
    lengthUnit: 'mm'
  };
};

export const calculateCombinedDimensions = (packages: Package[]): Package | null => {
  if (packages.length === 0) return null;

  // Convert all packages to mm for consistent calculation
  const standardizedPackages = packages.map(pkg => convertPackageToMm(pkg));

  // Calculate total volume
  const totalVolume = standardizedPackages.reduce((acc, pkg) => {
    return acc + (pkg.length * pkg.width * pkg.height * pkg.quantity);
  }, 0);

  // Calculate total weight
  const totalWeight = standardizedPackages.reduce((acc, pkg) => {
    return acc + (pkg.weight * pkg.quantity);
  }, 0);

  // Calculate dimensions of combined package
  // Using cube root of volume as a starting point for dimensions
  const dimension = Math.cbrt(totalVolume);

  return {
    length: dimension,
    width: dimension,
    height: dimension,
    weight: totalWeight,
    quantity: 1,
    lengthUnit: 'mm',
    weightUnit: 'kg'
  };
};

export const calculateShippingCost = (
  pkg: Package,
  fromLocation: Location,
  toLocation: Location,
  palletSize: PalletSize,
  costConfig: ShippingCostConfig
): ShippingResult => {
  const standardizedPkg = convertPackageToMm(pkg);
  const standardizedPallet = convertPalletToMm(palletSize);
  
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const calculations: string[] = [];

  // Calculate volume in cubic meters
  const volume = (standardizedPkg.length * standardizedPkg.width * standardizedPkg.height * standardizedPkg.quantity) / 1000000000;
  calculations.push(`Package volume: ${volume.toFixed(3)} m³`);

  const totalWeight = standardizedPkg.weight * standardizedPkg.quantity;
  calculations.push(`Total package weight: ${totalWeight.toFixed(2)} kg`);

  // Calculate how many pallets are needed based on both volume and weight
  const stackingResult = calculatePalletStacking(pkg, palletSize);
  const palletsNeededByVolume = Math.ceil(standardizedPkg.quantity / (stackingResult.itemsPerLayer * stackingResult.layers));
  
  const weightPerPallet = totalWeight / palletsNeededByVolume;
  const palletsNeededByWeight = Math.ceil(totalWeight / standardizedPallet.maxWeight);
  
  const palletsNeeded = Math.max(palletsNeededByVolume, palletsNeededByWeight);
  
  calculations.push(`Pallets needed by volume: ${palletsNeededByVolume}`);
  calculations.push(`Pallets needed by weight: ${palletsNeededByWeight}`);
  calculations.push(`Total pallets needed: ${palletsNeeded}`);

  let baseShippingCost = 0;

  switch (costConfig.type) {
    case 'weight':
      const weightInSelectedUnit = costConfig.unit === 'kg' ? totalWeight : totalWeight * 2.20462;
      baseShippingCost = weightInSelectedUnit * costConfig.ratePerUnit;
      calculations.push(`Weight-based cost: ${weightInSelectedUnit.toFixed(2)} ${costConfig.unit} × ${costConfig.ratePerUnit} ${costConfig.currency}/${costConfig.unit}`);
      break;

    case 'volume':
      const volumeInSelectedUnit = costConfig.unit === 'm3' ? volume : volume * 35.3147;
      baseShippingCost = volumeInSelectedUnit * costConfig.ratePerUnit;
      calculations.push(`Volume-based cost: ${volumeInSelectedUnit.toFixed(2)} ${costConfig.unit} × ${costConfig.ratePerUnit} ${costConfig.currency}/${costConfig.unit}`);
      break;

    case 'distance':
      const distance = costConfig.unit === 'km' ? 1000 : 621.371;
      baseShippingCost = distance * costConfig.ratePerUnit * palletsNeeded;
      calculations.push(`Distance-based cost: ${distance.toFixed(2)} ${costConfig.unit} × ${costConfig.ratePerUnit} ${costConfig.currency}/${costConfig.unit} × ${palletsNeeded} pallets`);
      break;
  }

  // Add pallet weight to total weight
  const palletWeight = standardizedPallet.maxWeight * 0.1; // Assuming pallet weight is 10% of max capacity
  const totalWeightWithPallets = totalWeight + (palletWeight * palletsNeeded);
  calculations.push(`Pallet weight (each): ${palletWeight.toFixed(2)} kg`);
  calculations.push(`Total weight including pallets: ${totalWeightWithPallets.toFixed(2)} kg`);

  calculations.push(`Base shipping cost: ${costConfig.currency} ${baseShippingCost.toFixed(2)}`);

  // Check weight limits
  if (weightPerPallet > standardizedPallet.maxWeight) {
    warnings.push(`Weight per pallet (${weightPerPallet.toFixed(2)}kg) exceeds pallet maximum capacity of ${standardizedPallet.maxWeight}kg`);
  }

  // Add recommendations based on utilization
  const palletVolume = (standardizedPallet.length * standardizedPallet.width * standardizedPallet.height) / 1000000000;
  const volumeUtilization = (volume / (palletVolume * palletsNeeded)) * 100;
  calculations.push(`Pallet utilization: ${volumeUtilization.toFixed(1)}%`);

  if (volumeUtilization < 40) {
    recommendations.push('Consider using a smaller pallet size for better cost efficiency');
  } else if (volumeUtilization > 90) {
    recommendations.push('High volume utilization - ensure proper securing of goods');
  }

  if (palletsNeeded > 1) {
    recommendations.push(`Multiple pallets required (${palletsNeeded}) - consider splitting shipment or using larger pallets if available`);
  }

  // Calculate tax using user-provided tax rate
  const tax = baseShippingCost * (costConfig.taxRate / 100);
  calculations.push(`Tax calculation: ${baseShippingCost.toFixed(2)} × ${costConfig.taxRate}%`);

  return {
    shippingCost: baseShippingCost,
    tax,
    totalCost: baseShippingCost + tax,
    warnings,
    recommendations,
    calculations,
    currencyCode: costConfig.currency,
    palletsNeeded,
    totalWeight: totalWeightWithPallets
  };
};

export const calculatePalletStacking = (
  pkg: Package,
  palletSize: PalletSize
): { layers: number; itemsPerLayer: number; totalItems: number; calculations: string[]; palletsNeeded: number } => {
  const standardizedPkg = convertPackageToMm(pkg);
  const standardizedPallet = convertPalletToMm(palletSize);
  
  const calculations: string[] = [];

  if (standardizedPkg.length === 0 || standardizedPkg.width === 0 || standardizedPkg.height === 0) {
    return { layers: 0, itemsPerLayer: 0, totalItems: 0, calculations: ['Invalid package dimensions'], palletsNeeded: 0 };
  }

  // Try both orientations of the package
  const orientation1 = {
    lengthwise: Math.floor(standardizedPallet.length / standardizedPkg.length),
    widthwise: Math.floor(standardizedPallet.width / standardizedPkg.width)
  };

  const orientation2 = {
    lengthwise: Math.floor(standardizedPallet.length / standardizedPkg.width),
    widthwise: Math.floor(standardizedPallet.width / standardizedPkg.length)
  };

  // Use the orientation that fits more items
  const useOrientation1 = orientation1.lengthwise * orientation1.widthwise >= orientation2.lengthwise * orientation2.widthwise;
  const { lengthwise, widthwise } = useOrientation1 ? orientation1 : orientation2;

  const itemsPerLayer = lengthwise * widthwise;

  calculations.push(`Items per row: ${lengthwise}`);
  calculations.push(`Rows per layer: ${widthwise}`);
  calculations.push(`Total items per layer: ${itemsPerLayer}`);

  // Calculate layers (max height 2.4m)
  const maxHeight = 2400; // 2.4m in mm
  const maxLayersByHeight = Math.floor((maxHeight - standardizedPallet.height) / standardizedPkg.height);
  const layers = Math.min(maxLayersByHeight, Math.ceil(standardizedPkg.quantity / itemsPerLayer));

  calculations.push(`Maximum layers possible: ${layers}`);
  calculations.push(`Total stack height: ${(layers * standardizedPkg.height + standardizedPallet.height).toFixed(0)}mm`);

  const itemsPerPallet = itemsPerLayer * layers;
  const palletsNeeded = Math.ceil(standardizedPkg.quantity / itemsPerPallet);
  
  calculations.push(`Items per pallet: ${itemsPerPallet}`);
  calculations.push(`Pallets needed: ${palletsNeeded}`);

  return {
    layers,
    itemsPerLayer,
    totalItems: standardizedPkg.quantity,
    calculations,
    palletsNeeded
  };
};

export const calculateShippingCostMultiple = (
  packages: Package[],
  fromLocation: Location,
  toLocation: Location,
  palletSize: PalletSize,
  costConfig: ShippingCostConfig,
  usePallet: boolean
): ShippingResult => {
  if (!usePallet) {
    // Calculate as one combined package
    const combinedPackage = calculateCombinedDimensions(packages);
    if (!combinedPackage) {
      return {
        shippingCost: 0,
        tax: 0,
        totalCost: 0,
        warnings: ['No packages to calculate'],
        recommendations: [],
        calculations: [],
        currencyCode: costConfig.currency,
        palletsNeeded: 0,
        totalWeight: 0
      };
    }
    return calculateShippingCost(combinedPackage, fromLocation, toLocation, palletSize, costConfig);
  }

  // Calculate with pallets
  let totalCost = 0;
  let totalTax = 0;
  let totalPallets = 0;
  let totalWeight = 0;
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const calculations: string[] = [];

  packages.forEach((pkg, index) => {
    const result = calculateShippingCost(pkg, fromLocation, toLocation, palletSize, costConfig);
    totalCost += result.shippingCost;
    totalTax += result.tax;
    totalPallets += result.palletsNeeded;
    totalWeight += result.totalWeight;
    
    calculations.push(`Package ${index + 1} calculations:`);
    calculations.push(...result.calculations);
    warnings.push(...result.warnings);
    recommendations.push(...result.recommendations);
  });

  return {
    shippingCost: totalCost,
    tax: totalTax,
    totalCost: totalCost + totalTax,
    warnings,
    recommendations,
    calculations,
    currencyCode: costConfig.currency,
    palletsNeeded: totalPallets,
    totalWeight
  };
};