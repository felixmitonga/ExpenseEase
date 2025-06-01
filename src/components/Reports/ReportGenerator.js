import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth, functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportPDF from './ReportPDF';
import './ReportGenerator.css';

function ReportGenerator() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', dateRange.startDate),
        where('date', '<=', dateRange.endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const expenses = [];
      const categories = {};
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        expenses.push(data);
        
        // Sum by category
        if (!categories[data.category]) {
          categories[data.category] = 0;
        }
        categories[data.category] += data.amount;
      });
      
      setReportData({
        expenses,
        categories,
        total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReport = async () => {
    if (!reportData) return;
    
    try {
      const sendReport = httpsCallable(functions, 'sendReportEmail');
      await sendReport({
        email: auth.currentUser.email,
        reportData
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  return (
    <div className="report-generator">
      <h2>Generate Expense Report</h2>
      
      <div className="date-selection">
        <div className="date-input">
          <label>Start Date:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        
        <div className="date-input">
          <label>End Date:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            min={dateRange.startDate}
          />
        </div>
        
        <button 
          onClick={generateReport}
          disabled={loading}
          className="btn btn-generate"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      
      {reportData && (
        <div className="report-results">
          <h3>Report Summary</h3>
          <p>
            Period: {new Date(reportData.startDate).toLocaleDateString()} - 
            {new Date(reportData.endDate).toLocaleDateString()}
          </p>
          
          <div className="category-summary">
            {Object.entries(reportData.categories).map(([category, total]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}:</span>
                <span className="category-amount">${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="total-summary">
            <span>Total:</span>
            <span>${reportData.total.toFixed(2)}</span>
          </div>
          
          <div className="report-actions">
            <PDFDownloadLink
              document={<ReportPDF data={reportData} />}
              fileName={`expense_report_${reportData.startDate}_to_${reportData.endDate}.pdf`}
              className="btn btn-download"
            >
              {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF')}
            </PDFDownloadLink>
            
            <button 
              onClick={sendEmailReport}
              className="btn btn-email"
            >
              Send to Email
            </button>
            
            {emailSent && (
              <div className="email-sent-message">
                Report sent to your email successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportGenerator;