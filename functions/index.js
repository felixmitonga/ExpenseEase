const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
admin.initializeApp();
const client = new vision.ImageAnnotatorClient();

exports.processReceipt = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    const expense = snap.data();
    if (expense.status !== 'pending_processing') return null;

    try {
      const [result] = await client.textDetection(expense.imageUrl);
      const text = result.textAnnotations?.[0]?.description || '';
      
      const amountMatch = text.match(/(\d+\.\d{2})/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      let category = 'Other';
      if (/restaurant|cafe|food/i.test(text)) category = 'Food';
      else if (/gas|fuel|parking/i.test(text)) category = 'Transport';

      return snap.ref.update({
        amount,
        category,
        status: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Processing failed:', error);
      return snap.ref.update({ status: 'failed' });
    }
  });
