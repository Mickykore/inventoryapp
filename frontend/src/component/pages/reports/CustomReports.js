
import { useState, useEffect } from 'react';
import ReportGenerator from './ReportGenerator';
import ExpenseReportGerator from './ExpenseReportGenerator';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useRedirectEmployee } from '../../../customHook/useRedirectEmploye';
import { useRedirectLogOutUser } from '../../../customHook/useRedirectLogOutUser';


const initialState = {
  startDate: '',
  endDate: '',
};

const CustomReports = () => {

  useRedirectLogOutUser();
  useRedirectEmployee();

  const firstComponentRef = useRef();

  const [inputDate, setInputDate] = useState(initialState);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfits, setTotalProfits] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [printView, setPrintView] = useState(false);


  const { totalSale, totalExpense, totalProfit, totalPurchase } = useSelector((state) => state.report);



  const { startDate, endDate } = inputDate;

   

  useEffect(() => {
    setTotalExpenses(totalExpense);
    setTotalSales(totalSale);
    setTotalProfits(totalProfit);
    setTotalPurchases(totalPurchase);
  }, [totalSale, totalExpense, totalProfit, totalPurchase]);

  const handleDateChange = (e) => {
    const {name, value} = e.target;
    setInputDate({ ...inputDate, [name]: value });
  };

  const handlePrint = () => {
    setPrintView(true);
  };
  const handleBeforeGetContent = async () => {
      await setPrintView(true);
  };



  

  

  return (
    <div>
      <div>
      <ul class="nav nav-pills">
        <button  className="nav-link disabled"><Link to="/reports">Custom Report</Link></button>
        <Link to="/Daily-report" ><button  className="nav-link">Daily Report</button></Link>
        <Link to="/Monthly-Report"><button  className="nav-link">Monthly Reports</button></Link>
        <Link to="/Yearly-report" ><button  className="nav-link">Yearly Report</button></Link>
      </ul>
        </div>
      <h2>input Dates to get Report</h2>
      <div className="col-md-8 align-items-center justify-content-center">
      <form className="g-3 col-md-5" style={{fontSize: "1.5rem", padding: "1.5rem"}}>
      <div>
        <label htmlFor="startDate" className="form-label">Start Date:</label>
        <input  type="text" className="form-control" id="startDate" name="startDate" placeholder="yyyy/mm/dd" value={startDate} onChange={handleDateChange} />
      </div>
      <div>
        <label htmlFor="endDate" className="form-label">End Date:</label>
        <input type="text" className="form-control" id="endDate" name="endDate" placeholder="yyyy/mm/dd" value={endDate} onChange={handleDateChange} />
      </div>
      <button className="btn btn-lg btn-primary ">Generate Report</button>
      </form>
      </div>
        <div>
        </div>
        <div>
          <br />
        <h2>Custom Sale Report</h2>
        <ReportGenerator startDate={startDate} endDate={endDate} />
      </div>
        <div>
        <h2>Custom Expense Report</h2>
        <ExpenseReportGerator startDate={startDate} endDate={endDate} />
      </div>
      <div>
          <h2>Profit After Expense Within Selected Period</h2>
          <div className='table-responsive'>
          <ReactToPrint
          trigger={() => (
            <button className="btn btn-primary" onClick={handlePrint}>Print Table</button>
          )}
          content={() => firstComponentRef.current}
          onAfterPrint={() => setPrintView(false)}
          onBeforeGetContent={handleBeforeGetContent}
        />
          <div style={{margin: printView ? "30px" : null}} ref={firstComponentRef}>
          {printView && (
        <>
          <div style={{padding: "1.5rem"}}><h2 >Income Within selected period</h2></div>
          <div style={{marginBottom: '1rem', textAlign: "right", fontSize: "1.5rem"}}>Date: {new Date().toLocaleDateString()}</div>
        </>
      )}
          <table className="table table-striped table-hover caption-top"  style={{fontSize: "12px"}}>
            <thead>
              <tr>
                <th>No</th>
                <th>Total Purchase Price</th>
                <th>Total Sales</th>
                <th>Gross Profit</th>
                <th>TOtal Expense</th>
                <th>Net Income</th>
              </tr>
            </thead>
            <tbody>
                <tr>
                  <td>1</td>
                  <td>{totalPurchases}</td>
                  <td>{totalSales}</td>
                  <td>{totalProfits}</td>
                  <td>{totalExpenses}</td>
                    <td>{totalProfits - totalExpenses}</td>
                </tr>
            </tbody>
          </table>
          </div>
          </div>
        </div>
    </div>
  );
};

export default CustomReports;
