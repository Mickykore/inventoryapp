import { useTable } from 'react-table';
import { useMemo } from 'react';


export const SalePrint = ({Sales}) => {

    const columns = useMemo(() => [
        {
          Header: 'No',
          accessor: 'no', // Use the 'id' accessor for the ID column
          Cell: ({ row }) => row.index + 1
        },
        {
          Header: 'Product Name',
          accessor: 'product.name'
        },
        {
          Header: 'Category',
          accessor: 'product.category.name',
        },
        {
          Header: 'Sale Price',
          accessor: 'singleSalePrice'
        },
        {
          Header: 'Quantity',
          accessor: 'quantity'
        },
        {
          Header: 'Total Price',
          accessor: 'totalPrice'
        },
        {
          Header: 'Seller',
          accessor: 'seller.firstname'
        },
        {
          Header: 'Date',
          accessor: 'createdAt'
        },
      ], []);

        const data = useMemo(() => Sales, [Sales]);

        const tableInstance = useTable({
            columns,
            data
        });

       const {
              getTableProps,
              getTableBodyProps,
              headerGroups,
              rows,
              prepareRow
         } = tableInstance;

    return (
        <div style={{margin: "20px"}}>
        <div style={{padding: "1.5rem"}}><h2>Sales</h2></div>
        <div style={{marginBottom: '1rem', textAlign: "right", fontSize: "1.5rem"}}>Date: {new Date().toLocaleDateString()}</div>
            <table {...getTableProps()} className="table table-bordered table-striped table-hover">
                <thead>
                    {
                        headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {
                                    headerGroup.headers.map(column => (
                                        <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                                    ))
                                }
                            </tr>
                        ))
                    }
                </thead>
                <tbody {...getTableBodyProps()}>
                    {
                        rows.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {
                                        row.cells.map(cell => {
                                            return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        })
                                    }
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
        </div>
    )
};