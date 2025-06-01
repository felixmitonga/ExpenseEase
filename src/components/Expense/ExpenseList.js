import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  deleteDoc,
  orderBy 
} from 'firebase/firestore';
import { db, auth, storage } from '../../services/firebase';
import { ref, deleteObject } from 'firebase/storage';
import './ExpenseList.css';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filter, setFilter] = useState({
    category: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        let q = query(
          collection(db, 'expenses'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );

        // Apply filters if they exist
        if (filter.startDate && filter.endDate) {
          q = query(q, 
            where('date', '>=', filter.startDate),
            where('date', '<=', filter.endDate)
          );
        }
        
        if (filter.category) {
          q = query(q, where('category', '==', filter.category));
        }

        const querySnapshot = await getDocs(q);
        const expensesData = [];
        
        querySnapshot.forEach(doc => {
          expensesData.push({ id: doc.id, ...doc.data() });
        });
        
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, [filter]);

  const startEditing = (expense) => {
    setEditingId(expense.id);
    setEditData({
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (expenseId) => {
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        ...editData,
        lastEditedAt: new Date().toISOString(),
        status: 'processed' // Mark as manually processed
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (expenseId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      // Delete the receipt image from storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      
      // Delete the expense document
      await deleteDoc(doc(db, 'expenses', expenseId));
      
      // Update local state
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_processing':
        return <span className="status-badge processing">Processing</span>;
      case 'processed':
        return <span className="status-badge processed">Verified</span>;
      case 'processing_failed':
        return <span className="status-badge failed">Failed</span>;
      default:
        return <span className="status-badge">Unknown</span>;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilter({
      category: '',
      startDate: '',
      endDate: ''
    });
  };

  if (loading) return <div className="loading">Loading expenses...</div>;

  return (
    <div className="expense-list-container">
      <h2>Your Expenses</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            name="category"
            value={filter.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleFilterChange}
            min={filter.startDate}
          />
        </div>
        
        <button 
          onClick={clearFilters}
          className="btn btn-clear"
        >
          Clear Filters
        </button>
      </div>
      
      {expenses.length === 0 ? (
        <div className="no-expenses">No expenses found</div>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Status</th>
              <th>Receipt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>
                  {editingId === expense.id ? (
                    <input
                      type="date"
                      name="date"
                      value={editData.date}
                      onChange={(e) => setEditData({...editData, date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    new Date(expense.date).toLocaleDateString()
                  )}
                </td>
                
                <td>
                  {editingId === expense.id ? (
                    <input
                      type="text"
                      name="description"
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                    />
                  ) : (
                    expense.description || '-'
                  )}
                </td>
                
                <td>
                  {editingId === expense.id ? (
                    <input
                      type="number"
                      name="amount"
                      value={editData.amount}
                      onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    `$${expense.amount.toFixed(2)}`
                  )}
                </td>
                
                <td>
                  {editingId === expense.id ? (
                    <select
                      name="category"
                      value={editData.category}
                      onChange={(e) => setEditData({...editData, category: e.target.value})}
                    >
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Bills">Bills</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    expense.category
                  )}
                </td>
                
                <td>{getStatusBadge(expense.status)}</td>
                
                <td>
                  {expense.imageUrl && (
                    <a 
                      href={expense.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="receipt-link"
                    >
                      View
                    </a>
                  )}
                </td>
                
                <td className="actions">
                  {editingId === expense.id ? (
                    <>
                      <button 
                        onClick={() => saveEdit(expense.id)}
                        className="btn btn-save"
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="btn btn-cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEditing(expense)}
                        className="btn btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id, expense.imageUrl)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpenseList;