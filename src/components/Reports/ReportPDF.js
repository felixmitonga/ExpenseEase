import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2', fontWeight: 700 }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666'
  },
  section: {
    marginBottom: 10
  },
  table: {
    display: 'flex',
    width: '100%',
    marginBottom: 15,
    border: '1px solid #e0e0e0'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  cell: {
    padding: 8,
    flex: 1,
    fontSize: 10
  },
  categoryHeader: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#999'
  }
});

// Create Document Component
const ReportPDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text>Expense Report</Text>
      </View>
      
      <View style={styles.subtitle}>
        <Text>
          {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.categoryHeader}>Expense Details</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cell}>Date</Text>
            <Text style={styles.cell}>Description</Text>
            <Text style={styles.cell}>Category</Text>
            <Text style={styles.cell}>Amount</Text>
          </View>
          
          {data.expenses.map((expense, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.cell}>{new Date(expense.date).toLocaleDateString()}</Text>
              <Text style={styles.cell}>{expense.description || '-'}</Text>
              <Text style={styles.cell}>{expense.category}</Text>
              <Text style={styles.cell}>${expense.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.categoryHeader}>Category Summary</Text>
        {Object.entries(data.categories).map(([category, total]) => (
          <View key={category} style={styles.categoryItem}>
            <Text>{category}</Text>
            <Text>${total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.total}>
        <Text>Total Expenses</Text>
        <Text>${data.total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text>Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

export default ReportPDF;
