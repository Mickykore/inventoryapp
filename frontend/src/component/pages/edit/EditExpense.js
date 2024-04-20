import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSingleExpense, updateExpense } from '../../../redux/features/expense/expenseSlice';
import { toast } from 'react-toastify';
import { useRedirectLogOutUser } from "../../../customHook/useRedirectLogOutUser"
import { useNavigate, useParams } from 'react-router-dom';

const initialState = {
  type: '',
  amount: "",
  description: '',
}

export const EditExpense = () => {

  useRedirectLogOutUser();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();


  const [expenseForm, setExpenseForm] = useState(initialState);

  const {type, amount, description} = expenseForm;

  useEffect(() => {
    dispatch(getSingleExpense(id));
  }, [dispatch, id]);
  
  const { expense } = useSelector((state) => state.expense);
  
  useEffect(() => {
    if (expense) {
      setExpenseForm(expense);
    }
  }, [expense]);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setExpenseForm({
      ...expenseForm,
      [name]: value
    })
  }

  const editExpense = (e) => {
    e.preventDefault();
    if (!type || !amount) {
      return toast.error("Please fill in all fieldsll")
    }
    
   
    const data = {
      type,
      amount,
      description,
    }
    dispatch(updateExpense({id, data}));
    navigate("/Expenses");
  }


  return (
    <div className="Expenses">
      <div>
        <div>
        <div style={{padding: "1.5rem"}}><h2>Update Expenses</h2></div>
          <form onSubmit={editExpense} className="g-3 col-md-5" style={{fontSize: "1.5rem", padding: "1.5rem"}}>
          <div>
              <label className="form-label">Purpose Of Expense</label>
              <input className="form-control" placeholder="Expense purpose" type="text" name="type" value={type} onChange={handleInputChange} />
            </div>
            <div>
              <label className="form-label">Amount</label>
              <input className="form-control" placeholder="Amount" type="number" name="amount" value={amount} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea type="text" name="description" value={description} onChange={handleInputChange} className="form-control"/>
            </div>
            <div>
            <button type="submit" className="btn btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
