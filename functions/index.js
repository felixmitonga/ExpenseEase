const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const nodemailer = require('nodemailer');
admin.initializeApp();

const client = new vision.ImageAnnotatorClient();

// Process receipt when new expense is created
exports.processReceipt = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    const expense = snap.data();
    
    // Skip if already processed or not pending
    if (expense.status !== 'pending_processing') return;
    
    try {
      // If user already entered amount, use that instead of OCR
      const userEnteredAmount = expense.amount > 0 ? expense.amount : null;
      
      // Detect text in the image only if needed
      let detectedAmount = null;
      let detectedCategory = expense.category; // Default to user's selection
      
      if (!userEnteredAmount || expense.category === 'Other') {
        const [result] = await client.textDetection(expense.imageUrl);
        const detections = result.textAnnotations;
        
        if (detections && detections.length > 0) {
          const text = detections[0].description;
          
          // Find amount if not provided by user
          if (!userEnteredAmount) {
            const amountMatch = text.match(/(\d+\.\d{2})/);
            if (amountMatch) detectedAmount = parseFloat(amountMatch[1]);
          }
          
          // Detect category if not specified or set to 'Other'
          if (expense.category === 'Other') {
            const lowerText = text.toLowerCase();
            if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('cafe')) {
              detectedCategory = 'Food';
            } else if (lowerText.includes('gas') || lowerText.includes('fuel') || lowerText.includes('parking')) {
              detectedCategory = 'Transport';
            } else if (lowerText.includes('electric') || lowerText.includes('water') || lowerText.includes('bill')) {
              detectedCategory = 'Bills';
            } else if (lowerText.includes('movie') || lowerText.includes('entertainment') || lowerText.includes('game')) {
              detectedCategory = 'Entertainment';
            }
          }
        }
      }
      
      // Update the expense document
      await snap.ref.update({
        amount: userEnteredAmount || detectedAmount || 0,
        category: detectedCategory,
        status: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error processing receipt:', error);
      await snap.ref.update({
        status: 'processing_failed',
        error: error.message
      });
    }
  });

// Send report via email
exports.sendReportEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'You must be logged in to send reports'
    );
  }
  
  const { email, reportData } = data;
  
  // Configure email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: functions.config().gmail.email,
      pass: functions.config().gmail.password
    }
  });
  
  try {
    // Create email content
    const mailOptions = {
      from: `ExpenseTracker <${functions.config().gmail.email}>`,
      to: email,
      subject: `Expense Report ${reportData.startDate} to ${reportData.endDate}`,
      html: `
        <h1>Expense Report</h1>
        <p>Period: ${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}</p>
        
        <h2>Category Summary</h2>
        <ul>
          ${Object.entries(reportData.categories).map(([category, total]) => `
            <li><strong>${category}:</strong> $${total.toFixed(2)}</li>
          `).join('')}
        </ul>
        
        <h3>Total: $${reportData.total.toFixed(2)}</h3>
        
        <p>This report was generated on ${new Date().toLocaleDateString()}.</p>
      `,
      attachments: [{
        filename: `expense_report_${reportData.startDate}_${reportData.endDate}.pdf`,
        path: 'https://yourapp.com/generate-pdf' // You would implement this endpoint
      }]
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
