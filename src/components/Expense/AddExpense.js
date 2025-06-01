import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { storage, db, auth } from '../../services/firebase';
import './AddExpense.css';

function AddExpense() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });
  const [processing, setProcessing] = useState(false);
  const [validationStep, setValidationStep] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer rear camera
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setPreview(imageDataUrl);
    
    fetch(imageDataUrl)
      .then(res => res.blob())
      .then(blob => {
        setImage(blob);
      });
    
    stream.getTracks().forEach(track => track.stop());
    setValidationStep(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const processReceipt = async () => {
    if (!image) return;
    setProcessing(true);
    
    try {
      // Upload image to storage
      const storageRef = ref(storage, `receipts/${auth.currentUser.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(storageRef);
      
      // Create expense document
      await addDoc(collection(db, 'expenses'), {
        userId: auth.currentUser.uid,
        imageUrl,
        amount: parseFloat(expenseData.amount) || 0,
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date,
        status: 'pending_processing',
        createdAt: new Date().toISOString(),
        lastEditedAt: null
      });
      
      // Reset form
      setImage(null);
      setPreview('');
      setExpenseData({
        amount: '',
        description: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
      });
      setValidationStep(false);
      alert('Expense submitted successfully!');
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Failed to submit expense. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="add-expense-container">
      <h2>Add New Expense</h2>
      
      {!preview ? (
        <div className="camera-section">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="camera-preview"
          />
          <div className="camera-controls">
            <button 
              onClick={startCamera} 
              className="btn btn-primary"
            >
              Start Camera
            </button>
            <button 
              onClick={captureImage} 
              disabled={!stream}
              className="btn btn-primary"
            >
              Capture Receipt
            </button>
          </div>
        </div>
      ) : validationStep ? (
        <div className="validation-section">
          <h3>Verify Receipt Details</h3>
          <div className="validation-content">
            <div className="receipt-preview">
              <img 
                src={preview} 
                alt="Receipt preview" 
                className="receipt-image"
              />
            </div>
            <div className="expense-form">
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  value={expenseData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={expenseData.description}
                  onChange={handleChange}
                  placeholder="What was this expense for?"
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={expenseData.category}
                  onChange={handleChange}
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={expenseData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={processReceipt} 
                  disabled={processing || !expenseData.amount}
                  className="btn btn-submit"
                >
                  {processing ? 'Submitting...' : 'Submit Expense'}
                </button>
                <button 
                  onClick={() => setValidationStep(false)}
                  className="btn btn-cancel"
                >
                  Retake Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AddExpense;