import axios from "axios";
import React, { Component } from "react";
import MyContext from "../contexts/MyContext";

class Order extends Component {
  static contextType = MyContext;

  PENDING_STATUSES = ["PENDING", "Chờ xác nhận"];

  APPROVED_BY_SOURCE = {
    PENDING: "APPROVED",
    "Chờ xác nhận": "Đang xử lý",
  };

  CANCELED_BY_SOURCE = {
    PENDING: "CANCELED",
    "Chờ xác nhận": "Đã hủy",
  };

  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      order: null,
    };
  }

  componentDidMount() {
    this.apiGetOrders();
  }

  trItemClick(item) {
    this.setState({ order: item });
  }

  getOrderDateLabel(item) {
    const raw = item.cdate || item.createdAt;
    if (!raw) return "-";

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }

  getCustomerName(item) {
    return item.customer?.name || item.shippingAddress?.name || "-";
  }

  getCustomerPhone(item) {
    return item.customer?.phone || item.shippingAddress?.phone || "-";
  }

  getTotal(item) {
    if (typeof item.total === "number") return item.total;
    if (typeof item.totalPrice === "number") return item.totalPrice;
    return 0;
  }

  canProcessOrder(item) {
    return this.PENDING_STATUSES.includes(item.status);
  }

  lnkApproveClick(item) {
    const nextStatus = this.APPROVED_BY_SOURCE[item.status] || "APPROVED";
    this.apiPutOrderStatus(item._id, nextStatus);
  }

  lnkCancelClick(item) {
    const nextStatus = this.CANCELED_BY_SOURCE[item.status] || "CANCELED";
    this.apiPutOrderStatus(item._id, nextStatus);
  }

  apiGetOrders() {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.get("/api/admin/orders", config).then((res) => {
      const result = res.data;
      this.setState({ orders: result });
    });
  }

  apiPutOrderStatus(id, status) {
    const body = { status: status };
    const config = { headers: { "x-access-token": this.context.token } };
    axios.put("/api/admin/orders/status/" + id, body, config).then((res) => {
      const result = res.data;
      if (result) {
        this.apiGetOrders();
      } else {
        alert("SORRY BABY!");
      }
    });
  }

  render() {
    const orders = this.state.orders.map((item) => {
      return (
        <tr key={item._id} className="datatable" onClick={() => this.trItemClick(item)}>
          <td>{item._id}</td>
          <td>{this.getOrderDateLabel(item)}</td>
          <td>{this.getCustomerName(item)}</td>
          <td>{this.getCustomerPhone(item)}</td>
          <td>{this.getTotal(item)}</td>
          <td>{item.status}</td>
          <td>
            {this.canProcessOrder(item) ? (
              <div>
                <span className="link" onClick={() => this.lnkApproveClick(item)}>
                  APPROVE
                </span>{" "}
                ||{" "}
                <span className="link" onClick={() => this.lnkCancelClick(item)}>
                  CANCEL
                </span>
              </div>
            ) : (
              <div />
            )}
          </td>
        </tr>
      );
    });

    let items = [];
    if (this.state.order) {
      const legacyItems = Array.isArray(this.state.order.items) ? this.state.order.items : [];
      const modernItems = Array.isArray(this.state.order.orderItems)
        ? this.state.order.orderItems
        : [];
      const orderItems = legacyItems.length > 0 ? legacyItems : modernItems;
      items = orderItems.map((item, index) => {
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
              {imageSrc ? (
                <img
                  src={imageSrc}
                  width="70px"
                  height="70px"
                  alt=""
                />
              ) : (
                <span>-</span>
              )}
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
                <th>Action</th>
              </tr>
              {orders}
            </tbody>
          </table>
        </div>
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

export default Order;
