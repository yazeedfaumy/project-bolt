import { Package, ShippingResult } from './calculations';
import ExcelJS from 'exceljs';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
    size: 'A4'
  },
  section: {
    margin: 10,
    padding: 10,
    borderBottom: '1pt solid #999',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#999',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  warning: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 5,
  },
  recommendation: {
    color: '#1976d2',
    fontSize: 12,
    marginBottom: 5,
  }
});

export const importFromExcel = async (file: File): Promise<Package[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.getWorksheet(1);
        
        if (!worksheet) {
          throw new Error('No worksheet found');
        }

        const packages: Package[] = [];
        worksheet.eachRow((row, index) => {
          if (index === 1) return; // Skip header row
          
          packages.push({
            id: String(index - 1),
            length: Number(row.getCell(1).value) || 0,
            width: Number(row.getCell(2).value) || 0,
            height: Number(row.getCell(3).value) || 0,
            weight: Number(row.getCell(4).value) || 0,
            quantity: Number(row.getCell(5).value) || 1,
            lengthUnit: String(row.getCell(6).value || 'cm'),
            weightUnit: String(row.getCell(7).value || 'kg')
          });
        });

        resolve(packages);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

const createPackagesSheet = async (packages: Package[], workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('Packages');
  
  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Length', key: 'length', width: 15 },
    { header: 'Width', key: 'width', width: 15 },
    { header: 'Height', key: 'height', width: 15 },
    { header: 'Weight', key: 'weight', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 15 },
    { header: 'Length Unit', key: 'lengthUnit', width: 15 },
    { header: 'Weight Unit', key: 'weightUnit', width: 15 }
  ];

  // Add data
  packages.forEach(pkg => {
    worksheet.addRow({
      id: pkg.id,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      weight: pkg.weight,
      quantity: pkg.quantity,
      lengthUnit: pkg.lengthUnit,
      weightUnit: pkg.weightUnit
    });
  });

  return worksheet;
};

const createConfigSheet = async (result: ShippingResult, workbook: ExcelJS.Workbook) => {
  const worksheet = workbook.addWorksheet('Configuration');
  
  worksheet.columns = [
    { header: 'Setting', key: 'setting', width: 20 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  worksheet.addRows([
    { setting: 'Container Type', value: result.containerType },
    { setting: 'Container Length', value: `${result.containerLength} cm` },
    { setting: 'Container Width', value: `${result.containerWidth} cm` },
    { setting: 'Container Height', value: `${result.containerHeight} cm` },
    { setting: 'Total Volume', value: `${result.totalVolume} m³` },
    { setting: 'Total Weight', value: `${result.totalWeight} kg` }
  ]);

  return worksheet;
};

const createCalculationsSheet = (packages: Package[], result: ShippingResult, workbook: ExcelJS.Workbook, packagesSheet: ExcelJS.Worksheet, configSheet: ExcelJS.Worksheet) => {
  const worksheet = workbook.addWorksheet('Calculations');
  
  // Add formulas for total volume and weight
  worksheet.getCell('B2').value = 'SUM(Packages!I2:I1000)';
  worksheet.getCell('A2').value = 'Total Volume (m³):';
  
  worksheet.getCell('B3').value = 'SUM(Packages!J2:J1000)';
  worksheet.getCell('A3').value = 'Total Weight (kg):';

  // Add shipping cost calculation
  worksheet.getCell('B4').value = 'B3*Configuration!B2';
  worksheet.getCell('A4').value = 'Shipping Cost:';

  // Add tax calculation
  worksheet.getCell('B5').value = 'B4*(Configuration!B3/100)';
  worksheet.getCell('A5').value = 'Tax:';

  // Add total cost calculation
  worksheet.getCell('B6').value = 'B4+B5';
  worksheet.getCell('A6').value = 'Total Cost:';

  return worksheet;
};

export const exportToExcel = async (
  packages: Package[],
  result: ShippingResult,
  usePallet: boolean
) => {
  const workbook = new ExcelJS.Workbook();
  
  // Create sheets
  const packagesSheet = await createPackagesSheet(packages, workbook);
  const configSheet = await createConfigSheet(result, workbook);

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'shipping_calculator.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
};

export const ShippingPDF = ({ packages, result, usePallet }: {
  packages: Package[];
  result: ShippingResult;
  usePallet: boolean;
}) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Shipping Calculation Report</Text>
        
        <Text style={styles.subtitle}>Package Details</Text>
        {packages.map((pkg, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.text}>Package #{index + 1}</Text>
            <Text style={styles.text}>Dimensions: {pkg.length}x{pkg.width}x{pkg.height} {pkg.lengthUnit}</Text>
            <Text style={styles.text}>Weight: {pkg.weight} {pkg.weightUnit}</Text>
            <Text style={styles.text}>Quantity: {pkg.quantity}</Text>
          </View>
        ))}

        <Text style={styles.subtitle}>Cost Summary</Text>
        <View style={styles.section}>
          <Text style={styles.text}>Shipping Cost: {result.currencyCode} {result.shippingCost.toFixed(2)}</Text>
          <Text style={styles.text}>Tax: {result.currencyCode} {result.tax.toFixed(2)}</Text>
          <Text style={styles.text}>Total Cost: {result.currencyCode} {result.totalCost.toFixed(2)}</Text>
          <Text style={styles.text}>Total Weight: {result.totalWeight.toFixed(2)} kg</Text>
          {usePallet && (
            <Text style={styles.text}>Pallets Needed: {result.palletsNeeded}</Text>
          )}
        </View>

        {result.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Warnings</Text>
            {result.warnings.map((warning, index) => (
              <Text key={index} style={styles.warning}>{warning}</Text>
            ))}
          </View>
        )}

        {result.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Recommendations</Text>
            {result.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendation}>{rec}</Text>
            ))}
          </View>
        )}

        <Text style={styles.subtitle}>Calculation Details</Text>
        <View style={styles.section}>
          {result.calculations.map((calc, index) => (
            <Text key={index} style={styles.text}>{calc}</Text>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);