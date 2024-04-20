import React, { useRef } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, getProducts, selectProducts, deleteProduct } from '../../redux/features/product/productSlice';
import { selectName } from '../../redux/features/auth/authSlice';
import { getallCategories } from '../../redux/features/product/categorySlice';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTable, usePagination, useGlobalFilter } from 'react-table';
import BulkProductForm from './bulkProduct';
import { GlobalFilter } from '../globalFilter';
import { useRedirectLogOutUser } from "../../customHook/useRedirectLogOutUser"
import { Link } from 'react-router-dom';
import { MdEditSquare, MdDeleteForever } from 'react-icons/md';
import { confirmAlert } from 'react-confirm-alert';
import ButtonLoading from '../../loader/ButtonLoader';
import { ProductPrint } from './print/ProductPrint';
import ReactToPrint from 'react-to-print';

class ComponentToPrint extends React.Component {
  render() {
    return(
      <div className='printOnly'>
      <ProductPrint Products={this.props.Products} />
      </div>
    )
  }
}

const initialState = {
  name: "",
  brand: "",
  purchasedPrice: "",
  minSellingPrice: "",
  maxSellingPrice: "",
  description: "",
  quantity: "",
  category: "",
  includeVAT: false
}

export const Products = () => {
  useRedirectLogOutUser()

  const dispatch = useDispatch();
  // const navigate = Navigate();
  const componentRef = useRef();

  const [product, setProduct] = useState(initialState);
  const [addedProduct, setAddedProduct] = useState([]);
  const [printMode, setPrintMode] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [printView, setPrintView] = useState(false);

  // const [allProducts, setAllProducts] = useState([{}]);
  // const [showAddProduct, setShowAddProduct] = useState(true);

  const {name, brand, purchasedPrice, description, quantity, category, maxSellingPrice, minSellingPrice, includeVAT} = product;
  const seller = useSelector(selectName);
  
  


  const categories = useSelector((state) => state.category.categories);
  const { products, isError } = useSelector((state) => state.product);
 



  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setProduct({
      ...product,
      [name]: value
    })
  }

  const addProduct = (e) => {
    e.preventDefault();

    if (!name || !brand || !purchasedPrice || !minSellingPrice || !maxSellingPrice || !category || !quantity) {
      return toast.error("Please fill in all fieldsllll")
    }
   
    const data = {
      name,
      brand,
      purchasedPrice,
      minSellingPrice,
      maxSellingPrice,
      description,
      category,
      quantity,
      includeVAT,
    }

    setAddedProduct([...addedProduct, data]);
    setProduct(initialState);
    // dispatch(createProduct(data));
    // navigate("/Products")
  }

  const submitProduct = async () => {
    setIsLoading(true);
    try {
        await Promise.all(addedProduct.map((product) => dispatch(createProduct(product))));
        setAddedProduct([]);
    } catch (error) {
        // Handle dispatch error if necessary
    }
    setIsLoading(false);
}

  // const printDiv = () => {
  //   setPrintMode(true);
  //   // Render the Invoice component with addedProduct as a prop
  //   ReactDOM.render(<Invoice products={addedProduct} />, document.body);
  //   window.print();
  //   setPrintMode(false);
  // };

  const delProduct= async(id) => {
    dispatch(deleteProduct(id));
    // dispatch(getProducts());
    // setShowProduct(true);
  }

  const remove = async (no) => {
    const newOrder = addedProduct.filter((order, index) => index !== no - 1);
    setAddedProduct(newOrder);
  }

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch, showProduct]);

  const ConfirmDelete = (id) => {
    confirmAlert({
      title: 'Delete Products',
      message: 'Are you sure to delete this Product?',
      buttons: [
        {
          label: 'Delete',
          onClick: () => delProduct(id)
        },
        {
          label: 'Cancel',
        }
      ]
    });
  }

  const handlePrint = () => {
    setPrintView(true);
  };
  const handleBeforeGetContent = async () => {
      await setPrintView(true);
  };

  


  const columns = useMemo(() => {
    const baseColumns = [
      {
        Header: 'No',
        accessor: 'no',
        Cell: ({ row }) => row.index + 1
      },
      {
        Header: 'Name Of Product',
        accessor: 'name'
      },
      {
        Header: 'Brand',
        accessor: 'brand'
      },
      {
        Header: 'Category',
        accessor: 'category.name',
      },
      {
        Header: 'Minimum Selling Price',
        accessor: 'sellingPriceRange.minSellingPrice'
      },
      {
        Header: 'Maximum Selling Price',
        accessor: 'sellingPriceRange.maxSellingPrice'
      },
      {
        Header: 'VAT Amount',
        accessor: 'VATamount'
      },
      {
        Header: 'Quantity',
        accessor: 'quantity'
      },
      {
        Header: 'Added By',
        accessor: 'addedBy.firstname'
      },
      {
        Header: 'Date',
        accessor: 'createdAt'
      }
    ];
  
    if (!printView) {
      baseColumns.push({
        Header: 'Action',
        Cell: ({ row }) => (
          <>
            <span className="text-warning" style={{ padding: '5px', cursor: 'pointer' }}>
              <Link to={`/Product/edit-product/${row.original._id}`}>
                <MdEditSquare size={24} />
              </Link>
            </span>
            <span
              className="text-danger"
              onClick={() => ConfirmDelete(row.original._id)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              <MdDeleteForever size={24} />
            </span>
          </>
        )
      });
    }
  
    return baseColumns;
  }, [printView]);
  
  const data = useMemo(() => products, [products]);

  const tableInstance = useTable({
    columns,
    data
  }, useGlobalFilter, usePagination);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    gotoPage,
    pageCount,
    setGlobalFilter,
    pageOptions,
    setPageSize,
    state,
    prepareRow
  } = tableInstance;

  const { pageIndex, globalFilter, pageSize } = state;

  return (
    <div className="Orders">
      <div>
        <h1>Products</h1>
        <div>
          <ul class="nav nav-pills">
            <li class="nav-item">
            <button  className={showProduct ? 'nav-link' : 'nav-link disabled'} onClick={() => setShowProduct(false)}>Add Products</button>
            </li>
            <li class="nav-item">
            <button  className={showProduct ? 'nav-link disabled' : 'nav-link'} onClick={() => setShowProduct(true)}>Show Products</button>
            </li>
          </ul>
        </div>
        {!showProduct && (
        <>
        <div>
          <BulkProductForm />
          <div id="hide-onprint" style={{padding: "1.5rem"}}><h2>Add Products</h2></div>
          <form id="hide-onprint" onSubmit={addProduct} className="g-3 col-md-5" style={{fontSize: "1.5rem", padding: "1.5rem"}}>
          <div>
              <label htmlFor="category">Category</label>
              <select className="form-control form-select form-select-lg" placeholder="Category Of The Product" name="category" value={category} onChange={handleInputChange} >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="form-label">Name</label>
              <input className="form-control" placeholder="Name Of The Product" type="text" name="name" value={name} onChange={handleInputChange} />
            </div>
            <div>
              <label className="form-label">Brand</label>
              <input className="form-control" placeholder="Brand Of The Product" type="text" name="brand" value={brand} onChange={handleInputChange} />
            </div>
            <div>
              <label className="form-label">purchasedPrice</label>
              <input className="form-control" type="number" min="1" required placeholder="Price Of The Product" name="purchasedPrice" value={purchasedPrice} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">  Include VAT</label>
              <div className="form-check form-switch" style={{fontSize: "20px"}}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="includeVAT"
                  checked={includeVAT}
                  style={{marginLeft: "0.1px"}}
                  onChange={(e) => setProduct({ ...product, includeVAT: e.target.checked })}
                />
                <label className="form-check-label">-Include VAT</label>
              </div>
            </div>
            <div>
              <label className="form-label">minSellingPrice</label>
              <input className="form-control" type="number" min="1" required placeholder="Minimum Selling Price" name="minSellingPrice" value={minSellingPrice} onChange={handleInputChange} />
            </div>
            <div>
              <label className="form-label">maxSellingPrice</label>
              <input className="form-control" type="number" min="1" required placeholder="Maximum Selling Price" name="maxSellingPrice" value={maxSellingPrice} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-control" type="number" min="1" required placeholder="Quantity Of The Product" name="quantity" value={quantity} onChange={handleInputChange} />
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
        <div id="printableArea" className='table-responsive'>
          <br />
          <h2>Added Products</h2>
          <table className="table table-striped table-hover caption-top" style={{fontSize: "12px"}}>
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {addedProduct.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{product.name}</td>
                  <td>{product.brand}</td>
                  <td>{product.category}</td>
                  <td>{product.purchasedPrice}</td>
                  <td>{product.quantity}</td>
                  <td>{product.purchasedPrice * product.quantity}</td>
                  <td className="action-column">
                  <button className="btn btn-danger" style={{fontSize:"1.5rem"}} onClick={() => remove(index + 1)}>Remove</button>
                  </td>
                </tr>
              ))}
              <tr>
            <td colSpan="6">Subtotal</td>
            <td>{addedProduct.reduce((sum, product) => sum + product.purchasedPrice * product.quantity, 0)}</td>
            <td></td>
        </tr>
            </tbody>
          </table>
          {/* <button className="btn btn-primary action-column" onClick={submitProduct}>Submit Product</button> */}
          {isLoading ? (
          <ButtonLoading className="btn btn-lg btn-primary " type="submit" disabled>Loading...</ButtonLoading>
            ) : (
              <button className="btn btn-lg btn-primary" type="submit" onClick={submitProduct}>Submit Product</button>
          )}
        </div>
        </>
        )}
        {/* <div id="hide-onprint" className="table-style" style={{padding: "1.5rem"}}> */}
        { showProduct && ( 
        <>
          <ReactToPrint
            trigger={() => (
              <button className="btn btn-primary" onClick={handlePrint}>Print Table</button>
            )}
            content={() => componentRef.current}
            onAfterPrint={() => setPrintView(false)}
            onBeforeGetContent={handleBeforeGetContent}/>
          <div style={{padding: "1.5rem"}}><h2>Products</h2></div>
          <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
          <div className='table-responsive' >
            <div style={{margin: printView ? "30px" : null}} ref={componentRef}>
            {printView && (
        <>
          <div style={{padding: "1.5rem"}}><h2>Products</h2></div>
          <div style={{marginBottom: '1rem', textAlign: "right", fontSize: "1.5rem"}}>Date: {new Date().toLocaleDateString()}</div>
        </>
      )}
          <table className="table table-striped table-hover caption-top"  {...getTableProps()} style={{fontSize: "12px"}}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
          </div>
          <div>
            <ul className="pagination justify-content-center pagination-lg">
              <span style={{padding: "5px", fontSize: '15px'}}>
              page{' '}
              <strong>
                <em style={{color: 'blue'}}>{pageIndex + 1}</em> of {pageOptions.length}
              </strong>
            </span>
            <select className="form-select form-select-lg" style={{maxWidth: '90px'}}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
              }} >
              {[10, 15, 20, 30, 40, 50, data.length].map((pageSize,index) => (
                <option key={index} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            <li>
                <button className="page-link" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>{'<<'}</button>
              </li>
              <li className={`page-item ${!canPreviousPage ? 'disabled' : ''}`}>
                <button className="page-link" onClick={previousPage} disabled={!canPreviousPage}>Previous</button>
              </li>
              <li className={`page-item ${!canNextPage ? 'disabled' : ''}`}>
                <button className="page-link" onClick={nextPage} disabled={!canNextPage}>Next</button>
              </li>
              <li>
                <button className="page-link" onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>{'>>'}</button>
              </li>
            </ul>
          </div>
        </>
        )}
      </div>
      {/* </div> */}
    </div>
  )
}