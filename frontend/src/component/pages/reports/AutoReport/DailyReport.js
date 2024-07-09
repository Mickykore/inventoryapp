import React, { useState, useEffect } from 'react';
import ReportGenerator from '../ReportGenerator';
import ExpenseReportGerator from '../ExpenseReportGenerator';
import { Link } from 'react-router-dom';
import { useRedirectLogOutUser } from '../../../../customHook/useRedirectLogOutUser';
import { useRedirectEmployee } from '../../../../customHook/useRedirectEmploye';
import { useSelector } from 'react-redux';
import { useRef } from 'react';
import ReactToPrint from 'react-to-print';

const DailyReport = () => {

  useRedirectLogOutUser();
  useRedirectEmployee();

  const firstComponentRef = useRef();

  const [date, setDate] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfits, setTotalProfits] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [printView, setPrintView] = useState(false);


  const { totalSale, totalExpense, totalProfit, totalPurchase } = useSelector((state) => state.report);

  // console.log(totalSale, totalExpense, totalProfit, totalPurchase);
  
  useEffect(() => {
    const currentDate = new Date().toISOString().slice(0, 10);
    setDate(currentDate);
  }, []);

  useEffect(() => {
    setTotalExpenses(totalExpense);
    setTotalSales(totalSale);
    setTotalProfits(totalProfit);
    setTotalPurchases(totalPurchase);
  }, [totalSale, totalExpense, totalProfit, totalPurchase]);

  const handlePrint = () => {
    setPrintView(true);
  };
  const handleBeforeGetContent = async () => {
      await setPrintView(true);
  };

  return (
    <>
        <div>
          <ul class="nav nav-pills">
            <Link to="/reports" ><button  className="nav-link">Custom Report</button></Link>
            <button  className="nav-link disabled"><Link to="/Daily-report">Daily Report</Link></button>
            <Link to="/Monthly-Report"><button  className="nav-link">Monthly Reports</button></Link>
            <Link to="/Yearly-report" ><button  className="nav-link">Yearly Report</button></Link>
            <Link to="/Tax-report"><button  className="nav-link">Tax Report</button></Link>
          </ul>
        </div>
        <div>
        <h2>Daily Sale Report</h2>
        <ReportGenerator startDate={date} endDate={date} timeframe="Daily"/>
        </div>
        <div>
        <h2>Daily Expense Report</h2>
        <ExpenseReportGerator startDate={date} endDate={date} timeframe="Daily"/>
        </div>
        <div>
          <h2>Daily Profit After Expense</h2>
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
          <div style={{padding: "1.5rem"}}><h2 >Daily Income</h2></div>
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
        </>
  );
};

export default DailyReport;