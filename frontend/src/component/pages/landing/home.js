import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { Link } from 'react-router-dom';
import { FiPackage, FiUsers, FiDollarSign } from 'react-icons/fi'; // Import appropriate React icons
import heroImg from "../../../assets/inv-img.png";
import './Home.scss';
import report from "../../../assets/reports.png";
import order from "../../../assets/order.png";
import products from "../../../assets/products.png";
import Pay from "../Pay";


const Home = () => {
  return (
    <>
      <LandingHeader />
      <div className="features">
      <div className="container marketing">
        {/* Three columns of text */}
        <div className="row">
          <FeatureColumn icon={<FiPackage size={50}/>} title="Inventory Management" description="Efficiently manage your store's inventory, keep track of stock levels, and streamline the reordering process." />
          <FeatureColumn icon={<FiUsers size={50}/>} title="Order Management" description="Build and maintain relationships with your customers, by track their order and provide personalized service." />
          <FeatureColumn icon={<FiDollarSign size={50} />} title="Sales Analytics" description="Gain insights into your store's performance, track sales trends, and make data-driven decisions to optimize your business." />
        </div>

        {/* Start the featurettes */}
        <hr className="featurette-divider" />

        {/* Featurette 1 */}
        <Featurette title="Inventory Tracking" description="Track inventory levels in real-time, receive alerts for low stock items, and optimize stock replenishment to avoid stockouts." icon={<FiPackage size={50}/>} image={products} />

        <hr className="featurette-divider" />

        {/* Featurette 2 */}
        <Featurette title="Customer Engagement" description="Engage with your customers through loyalty programs, promotions, and personalized recommendations to enhance their shopping experience." icon={<FiUsers size={50}/>} image={order} />

        <hr className="featurette-divider" />

        {/* Featurette 3 */}
        <Featurette title="Sales Reporting" description="Generate detailed reports on sales performance, analyze product profitability, and identify opportunities for growth." icon={<FiDollarSign size={50}/>} image={report} />

        <hr className="featurette-divider" />
      </div>
      </div>
      <div className="container">
        <Pay />
      </div>
      <LandingFooter />
    </>
  );
}

const NumberText = ({ num, text }) => {
  return (
    <div className="mr-3">
      <h3 className="text-white">{num}</h3>
      <p className="text-white">{text}</p>
    </div>
  );
};

const FeatureColumn = ({ icon, title, description }) => {
  return (
    <div className="col-lg-4">
      {icon}
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

const Featurette = ({ title, description, icon, image }) => {
  return (
    <div className="row featurette">
      <div className="col-md-7">
        <h2 className="featurette-heading">{title}</h2>
        <p className="lead">{description}</p>
      </div>
      <div className="col-md-5">
        {icon}
        <img src={image} alt={title} className="bd-placeholder-img bd-placeholder-img-lg featurette-image img-fluid mx-auto" />
      </div>
    </div>
  );
};

export default Home;
