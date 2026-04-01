import axios from "axios";
import React, { Component } from "react";
import MyContext from "../contexts/MyContext";

class Customer extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      customers: [],
      orders: [],
      order: null,
    };
  }

  componentDidMount() {
    this.apiGetCustomers();
  }

  trCustomerClick(item) {
    this.setState({ orders: [], order: null });
    this.apiGetOrdersByCustID(item._id);
  }

  trOrderClick(item) {
    this.setState({ order: item });
  }

  lnkDeactiveClick(item) {
    this.apiPutCustomerDeactive(item._id, item.token);
  }

  lnkEmailClick(item) {
    this.apiGetCustomerSendmail(item._id);
  }

  apiGetCustomers() {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.get("/api/admin/customers", config).then((res) => {
      const result = res.data;
      this.setState({ customers: result });
    });
  }

  apiGetOrdersByCustID(cid) {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.get("/api/admin/orders/customer/" + cid, config).then((res) => {
      const result = res.data;
      this.setState({ orders: result });
    });
  }

  apiPutCustomerDeactive(id, token) {
    const body = { token: token };
    const config = { headers: { "x-access-token": this.context.token } };
    axios.put("/api/admin/customers/deactive/" + id, body, config).then((res) => {
      const result = res.data;
      if (result) {
        this.apiGetCustomers();
      } else {
        alert("SORRY BABY!");
      }
    });
  }

  apiGetCustomerSendmail(id) {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.get("/api/admin/customers/sendmail/" + id, config).then((res) => {
      const result = res.data;
      alert(result.message);
    });
  }

  render() {
    const customers = this.state.customers.map((item) => {
      return (
        <tr key={item._id} className="datatable" onClick={() => this.trCustomerClick(item)}>
          <td>{item._id}</td>
          <td>{item.username}</td>
          <td>{item.password}</td>
          <td>{item.name}</td>
          <td>{item.phone}</td>
          <td>{item.email}</td>
          <td>{item.active}</td>
          <td>
            {item.active === 0 ? (
              <span className="link" onClick={() => this.lnkEmailClick(item)}>
                EMAIL
              </span>
            ) : (
              <span className="link" onClick={() => this.lnkDeactiveClick(item)}>
                DEACTIVE
              </span>
            )}
          </td>
        </tr>
      );
    });

    const orders = this.state.orders.map((item) => {
      return (
        <tr key={item._id} className="datatable" onClick={() => this.trOrderClick(item)}>
          <td>{item._id}</td>
          <td>{new Date(item.cdate).toLocaleString()}</td>
          <td>{item.customer?.name}</td>
          <td>{item.customer?.phone}</td>
          <td>{item.total}</td>
          <td>{item.status}</td>
        </tr>
      );
    });

    let items = [];
    if (this.state.order) {
      items = this.state.order.items.map((item, index) => {
        const productId = item.product?._id || item.product || "-";
        const productName = item.product?.name || item.name || "-";
        const productPrice =
          typeof item.product?.price === "number"
            ? item.product.price
            : typeof item.price === "number"
              ? item.price
              : 0;
        const quantity =
          typeof item.quantity === "number"
            ? item.quantity
            : typeof item.qty === "number"
              ? item.qty
              : 0;
        const rawImage = item.product?.image || item.image || "";
        const imageSrc = rawImage.startsWith("http")
          ? rawImage
          : rawImage
            ? `data:image/jpg;base64,${rawImage}`
            : "";

        return (
          <tr key={`${productId}-${index}`} className="datatable">
            <td>{index + 1}</td>
            <td>{productId}</td>
            <td>{productName}</td>
            <td>
              {imageSrc ? <img src={imageSrc} width="70px" height="70px" alt="" /> : <span>-</span>}
            </td>
            <td>{productPrice}</td>
            <td>{quantity}</td>
            <td>{productPrice * quantity}</td>
          </tr>
        );
      });
    }

    return (
      <div>
        <div className="align-center">
          <h2 className="text-center">CUSTOMER LIST</h2>
          <table className="datatable" border="1">
            <tbody>
              <tr className="datatable">
                <th>ID</th>
                <th>Username</th>
                <th>Password</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
              {customers}
            </tbody>
          </table>
        </div>

        {this.state.orders.length > 0 ? (
          <div className="align-center">
            <h2 className="text-center">ORDER LIST</h2>
            <table className="datatable" border="1">
              <tbody>
                <tr className="datatable">
                  <th>ID</th>
                  <th>Creation date</th>
                  <th>Cust.name</th>
                  <th>Cust.phone</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
                {orders}
              </tbody>
            </table>
          </div>
        ) : (
          <div />
        )}

        {this.state.order ? (
          <div className="align-center">
            <h2 className="text-center">ORDER DETAIL</h2>
            <table className="datatable" border="1">
              <tbody>
                <tr className="datatable">
                  <th>No.</th>
                  <th>Prod.ID</th>
                  <th>Prod.name</th>
                  <th>Image</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
                {items}
              </tbody>
            </table>
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default Customer;
