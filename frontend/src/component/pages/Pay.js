import React, { useState } from 'react';
import Chapa from './Chapa';

const Pay = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        amount: ''
    });

    const { firstName, lastName, phone, amount, email } = formData;

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h2>Pay</h2>
                <div className="form-group">
                    <label>First Name:</label>
                    <input
                        type="text"
                        name="firstName"
                        value={firstName}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Last Name:</label>
                    <input
                        type="text"
                        name="lastName"
                        value={lastName}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        type="text"
                        name="phone"
                        value={phone}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>email:</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Amount:</label>
                    <input
                        type="text"
                        name="amount"
                        value={amount}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <Chapa firstName={firstName} lastName={lastName} phone={phone} amount={amount} email={email}/>
        </div>
    );
};

export default Pay;