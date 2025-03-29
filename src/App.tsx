import React, { useState, useCallback } from 'react';
import { Package, PalletSize, Location, ProductCategory, ShippingResult, ShippingCostConfig } from './utils/calculations';
import { calculateShippingCostMultiple, calculatePalletStacking, calculateCombinedDimensions } from './utils/calculations';
import { LengthUnit, WeightUnit, CurrencyCode } from './utils/units';
import PalletVisualization from './components/PalletVisualization';
import { Boxes, Calculator, Package as PackageIcon, AlertTriangle, Lightbulb, File as FilePdf, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import palletData from './data/palletData.json';
import { ShippingPDF } from './utils/export.tsx';
import { PDFDownloadLink } from '@react-pdf/renderer';

function App() {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [usePallet, setUsePallet] = useState(true);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('cm');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [packages, setPackages] = useState<Package[]>([{
    id: '1',
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    quantity: 1,
    lengthUnit: 'cm',
    weightUnit: 'kg'
  }]);
  
  const [selectedPallet, setSelectedPallet] = useState<PalletSize>(palletData.palletSizes[0]);
  const [customPallet, setCustomPallet] = useState<PalletSize>({
    id: 'custom',
    name: 'Custom Pallet',
    length: 0,
    width: 0,
    height: 0,
    maxWeight: 0,
    description: 'Custom dimensions',
    lengthUnit: 'cm'
  });

  const [fromLocation, setFromLocation] = useState<Location>(palletData.locations[0]);
  const [toLocation, setToLocation] = useState<Location>(palletData.locations[1]);
  const [category, setCategory] = useState<ProductCategory>(palletData.productCategories[0]);
  
  const [shippingConfig, setShippingConfig] = useState<ShippingCostConfig>({
    type: 'weight',
    unit: 'kg',
    ratePerUnit: 0,
    currency: 'USD',
    taxRate: 0
  });
  
  const [results, setResults] = useState<{
    shipping: ShippingResult;
    stacking: {
      layers: number;
      itemsPerLayer: number;
      totalItems: number;
      palletsNeeded: number;
      calculations: string[];
    };
  } | null>(null);

  const handleAddPackage = () => {
    setPackages([...packages, {
      id: String(packages.length + 1),
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      quantity: 1,
      lengthUnit,
      weightUnit
    }]);
  };

  const handleRemovePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index));
    }
  };

  const handlePackageChange = (index: number, field: keyof Package, value: number | string) => {
    const updatedPackages = [...packages];
    updatedPackages[index] = {
      ...updatedPackages[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    setPackages(updatedPackages);
  };

  const handleCalculate = () => {
    const shipping = calculateShippingCostMultiple(
      packages,
      fromLocation,
      toLocation,
      selectedPallet.id === 'custom' ? customPallet : selectedPallet,
      shippingConfig,
      usePallet
    );
    
    const combinedPackage = calculateCombinedDimensions(packages);
    const stacking = combinedPackage ? calculatePalletStacking(
      combinedPackage,
      selectedPallet.id === 'custom' ? customPallet : selectedPallet
    ) : {
      layers: 0,
      itemsPerLayer: 0,
      totalItems: 0,
      palletsNeeded: 0,
      calculations: []
    };
    
    setResults({
      shipping,
      stacking
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center">
              <Boxes className="h-8 w-8 text-green-600" />
              <h1 className="ml-2 text-2xl font-bold text-green-700">Sterling Carter Technology Distributors</h1>
            </div>
            <div className="text-yellow-600 mt-1">For Business Solutions That Work</div>
            <div className="text-sm text-gray-600 mt-2">
              22 Cargill Avenue, Kingston 10, Jamaica | Tel: 876-968-6637
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShow3D(!show3D)}
                className={`px-4 py-2 rounded-md flex items-center ${
                  show3D ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {show3D ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {show3D ? 'Hide 3D' : 'Show 3D'}
              </button>
              <button
                onClick={() => setUsePallet(!usePallet)}
                className={`px-4 py-2 rounded-md flex items-center ${
                  usePallet ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Boxes className="w-4 h-4 mr-2" />
                {usePallet ? 'Using Pallets' : 'No Pallets'}
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Advanced Mode
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center text-green-700">
                  <PackageIcon className="h-5 w-5 mr-2 text-green-600" />
                  Package Details
                </h2>
                <div className="flex space-x-2">
                  <button
                    disabled
                    className="px-3 py-1 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed flex items-center"
                  >
                    Import Excel
                  </button>
                  <button
                    onClick={handleAddPackage}
                    className="px-3 py-1 rounded-md bg-green-600 text-white flex items-center hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Package
                  </button>
                </div>
              </div>
              
              {/* Units Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Length Unit</label>
                  <select
                    value={lengthUnit}
                    onChange={(e) => {
                      setLengthUnit(e.target.value as LengthUnit);
                      setPackages(packages.map(pkg => ({ ...pkg, lengthUnit: e.target.value as LengthUnit })));
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="m">Meters (m)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight Unit</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => {
                      setWeightUnit(e.target.value as WeightUnit);
                      setPackages(packages.map(pkg => ({ ...pkg, weightUnit: e.target.value as WeightUnit })));
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>
              </div>

              {/* Package Dimensions */}
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Package #{index + 1}</h3>
                    {packages.length > 1 && (
                      <button
                        onClick={() => handleRemovePackage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Length</label>
                      <input
                        type="number"
                        value={pkg.length || ''}
                        onChange={(e) => handlePackageChange(index, 'length', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Width</label>
                      <input
                        type="number"
                        value={pkg.width || ''}
                        onChange={(e) => handlePackageChange(index, 'width', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Height</label>
                      <input
                        type="number"
                        value={pkg.height || ''}
                        onChange={(e) => handlePackageChange(index, 'height', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <input
                        type="number"
                        value={pkg.weight || ''}
                        onChange={(e) => handlePackageChange(index, 'weight', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
              <h2 className="text-lg font-semibold mb-4 text-green-700">Shipping Cost Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Calculation Type</label>
                  <select
                    value={shippingConfig.type}
                    onChange={(e) => setShippingConfig({
                      ...shippingConfig,
                      type: e.target.value as 'weight' | 'volume' | 'distance',
                      unit: e.target.value === 'weight' ? 'kg' :
                            e.target.value === 'volume' ? 'm3' : 'km'
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="weight">By Weight</option>
                    <option value="volume">By Volume</option>
                    <option value="distance">By Distance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    value={shippingConfig.unit}
                    onChange={(e) => setShippingConfig({ ...shippingConfig, unit: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    {shippingConfig.type === 'weight' && (
                      <>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="lbs">Pounds (lbs)</option>
                      </>
                    )}
                    {shippingConfig.type === 'volume' && (
                      <>
                        <option value="m3">Cubic Meters (m³)</option>
                        <option value="ft3">Cubic Feet (ft³)</option>
                      </>
                    )}
                    {shippingConfig.type === 'distance' && (
                      <>
                        <option value="km">Kilometers (km)</option>
                        <option value="mi">Miles (mi)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={shippingConfig.currency}
                    onChange={(e) => setShippingConfig({ ...shippingConfig, currency: e.target.value as CurrencyCode })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rate per {shippingConfig.unit} ({shippingConfig.currency})
                  </label>
                  <input
                    type="number"
                    value={shippingConfig.ratePerUnit || ''}
                    onChange={(e) => setShippingConfig({ ...shippingConfig, ratePerUnit: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={shippingConfig.taxRate || ''}
                    onChange={(e) => setShippingConfig({ ...shippingConfig, taxRate: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {usePallet && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
                <h2 className="text-lg font-semibold mb-4 text-green-700">Pallet Selection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pallet Type</label>
                    <select
                      value={selectedPallet.id}
                      onChange={(e) => {
                        const pallet = palletData.palletSizes.find(p => p.id === e.target.value);
                        if (pallet) setSelectedPallet(pallet);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                      {palletData.palletSizes.map((pallet) => (
                        <option key={pallet.id} value={pallet.id}>
                          {pallet.name} ({pallet.length}x{pallet.width}cm)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPallet.id === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Length</label>
                        <input
                          type="number"
                          value={customPallet.length || ''}
                          onChange={(e) => setCustomPallet({ ...customPallet, length: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Width</label>
                        <input
                          type="number"
                          value={customPallet.width || ''}
                          onChange={(e) => setCustomPallet({ ...customPallet, width: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Height</label>
                        <input
                          type="number"
                          value={customPallet.height || ''}
                          onChange={(e) => setCustomPallet({ ...customPallet, height: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Weight (kg)</label>
                        <input
                          type="number"
                          value={customPallet.maxWeight || ''}
                          onChange={(e) => setCustomPallet({ ...customPallet, maxWeight: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCalculate}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calculate Shipping
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {results && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
                  <h2 className="text-lg font-semibold mb-4 text-green-700">Cost Breakdown</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Cost:</span>
                      <span className="font-medium">
                        {results.shipping.currencyCode} {results.shipping.shippingCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">
                        {results.shipping.currencyCode} {results.shipping.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total Cost:</span>
                      <span className="font-semibold">
                        {results.shipping.currencyCode} {results.shipping.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {show3D && (
                  <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
                    <h2 className="text-lg font-semibold mb-4 text-green-700">3D Pallet Visualization</h2>
                    <PalletVisualization
                      pkg={calculateCombinedDimensions(packages)!}
                      palletSize={selectedPallet.id === 'custom' ? customPallet : selectedPallet}
                      stacking={results.stacking}
                    />
                  </div>
                )}

                {results.shipping.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="text-yellow-800 font-medium flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Warnings
                    </h3>
                    <ul className="mt-2 text-yellow-700">
                      {results.shipping.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.shipping.recommendations.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-green-800 font-medium flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Recommendations
                    </h3>
                    <ul className="mt-2 text-green-700">
                      {results.shipping.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
                  <h2 className="text-lg font-semibold mb-4 text-green-700">Calculation Details</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    {results.shipping.calculations.map((calc, index) => (
                      <p key={index}>{calc}</p>
                    ))}
                    {results.stacking.calculations.map((calc, index) => (
                      <p key={index}>{calc}</p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <PDFDownloadLink
                    document={<ShippingPDF packages={packages} result={results.shipping} usePallet={usePallet} />}
                    fileName="shipping-calculation.pdf"
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-base font-medium text-green-700 bg-white hover:bg-green-50"
                  >
                    {({ blob, url, loading, error }) => 
                      loading ? (
                        <>
                          <FilePdf className="h-5 w-5 mr-2" />
                          Generating PDF...
                        </>
                      ) : error ? (
                        <>
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Error generating PDF
                        </>
                      ) : (
                        <>
                          <FilePdf className="h-5 w-5 mr-2" />
                          Export to PDF
                        </>
                      )
                    }
                  </PDFDownloadLink>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;