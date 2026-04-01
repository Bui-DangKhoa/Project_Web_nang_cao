// @ts-nocheck
import axios from "axios";
import React, { Component } from "react";
import MyContext from "../contexts/MyContext";

const isHttpUrl = (value) => /^https?:\/\//i.test(value || "");
const isDataImage = (value) => /^data:image\/[a-zA-Z+]+;base64,/.test(value || "");

const toDisplayImageSrc = (rawImage) => {
  if (!rawImage) return "";
  if (isHttpUrl(rawImage) || isDataImage(rawImage)) return rawImage;
  return `data:image/jpg;base64,${rawImage}`;
};

const toPayloadImage = (value) => {
  if (!value) return "";
  if (isDataImage(value)) {
    return value.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  }
  return value;
};

class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      txtID: "",
      txtName: "",
      txtPrice: 0,
      cmbCategory: "",
      txtCategory: "",
      imgProduct: "",
    };
  }

  componentDidMount() {
    this.apiGetCategories();
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item && this.props.item) {
      this.setState({
        txtID: this.props.item._id,
        txtName: this.props.item.name,
        txtPrice: this.props.item.price,
        cmbCategory: this.props.item.category?._id || "",
        txtCategory: this.props.item.category?.name || "",
        imgProduct: toDisplayImageSrc(this.props.item.image),
      });
    }
  }

  previewImage(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.setState({ imgProduct: evt.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  async ensureCategoryId() {
    const selectedId = this.state.cmbCategory;
    if (selectedId) return selectedId;

    const manual = (this.state.txtCategory || "").trim();
    if (!manual) return "";

    const byId = this.state.categories.find((c) => c._id === manual);
    if (byId) return byId._id;

    const byName = this.state.categories.find(
      (c) => (c.name || "").toLowerCase() === manual.toLowerCase(),
    );
    if (byName) return byName._id;

    const config = { headers: { "x-access-token": this.context.token } };
    const created = await axios.post("/api/admin/categories", { name: manual }, config);
    const newCategory = created?.data;
    if (newCategory?._id) {
      this.setState((prev) => ({
        categories: [...prev.categories, newCategory],
        cmbCategory: newCategory._id,
      }));
      return newCategory._id;
    }
    return "";
  }

  async btnAddClick(e) {
    e.preventDefault();
    const name = this.state.txtName;
    const price = parseInt(this.state.txtPrice, 10);
    const category = await this.ensureCategoryId();
    const image = toPayloadImage(this.state.imgProduct);

    if (name && price && category && image) {
      const prod = { name, price, category, image };
      this.apiPostProduct(prod);
    } else {
      alert("Please input name and price and category and image");
    }
  }

  async btnUpdateClick(e) {
    e.preventDefault();
    const id = this.state.txtID;
    const name = this.state.txtName;
    const price = parseInt(this.state.txtPrice, 10);
    const category = await this.ensureCategoryId();
    const image = toPayloadImage(this.state.imgProduct);

    if (id && name && price && category && image) {
      const prod = { name, price, category, image };
      this.apiPutProduct(id, prod);
    } else {
      alert("Please input id and name and price and category and image");
    }
  }

  btnDeleteClick(e) {
    e.preventDefault();
    if (window.confirm("ARE YOU SURE?")) {
      const id = this.state.txtID;
      if (id) {
        this.apiDeleteProduct(id);
      } else {
        alert("Please input id");
      }
    }
  }

  apiPostProduct(prod) {
    const config = { headers: { "x-access-token": this.context.token } };
    axios
      .post("/api/admin/products", prod, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert("OK BABY!");
          this.apiGetProducts();
        } else {
          alert("SORRY BABY!");
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 413) {
          alert("Image is too large. Please choose a smaller file.");
          return;
        }
        alert(err?.response?.data?.message || "Failed to add product");
      });
  }

  apiPutProduct(id, prod) {
    const config = { headers: { "x-access-token": this.context.token } };
    axios
      .put("/api/admin/products/" + id, prod, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          alert("OK BABY!");
          this.apiGetProducts();
        } else {
          alert("SORRY BABY!");
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 413) {
          alert("Image is too large. Please choose a smaller file.");
          return;
        }
        alert(err?.response?.data?.message || "Failed to update product");
      });
  }

  apiDeleteProduct(id) {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.delete("/api/admin/products/" + id, config).then((res) => {
      const result = res.data;
      if (result) {
        alert("OK BABY!");
        this.apiGetProducts();
      } else {
        alert("SORRY BABY!");
      }
    });
  }

  apiGetCategories() {
    const config = { headers: { "x-access-token": this.context.token } };
    axios.get("/api/admin/categories", config).then((res) => {
      const result = res.data;
      const list = Array.isArray(result) ? result : [];
      this.setState({ categories: list });
      if (!this.state.cmbCategory && list.length > 0) {
        this.setState({ cmbCategory: list[0]._id });
      }
    });
  }

  apiGetProducts() {
    const config = { headers: { "x-access-token": this.context.token } };
    axios
      .get("/api/admin/products?page=" + this.props.curPage, config)
      .then((res) => {
        const result = res.data;
        if (result.products.length !== 0) {
          this.props.updateProducts(result.products, result.noPages, result.curPage);
        } else {
          axios
            .get("/api/admin/products?page=" + (this.props.curPage - 1), config)
            .then((res2) => {
              const result2 = res2.data;
              this.props.updateProducts(result2.products, result2.noPages, result2.curPage);
            });
        }
      });
  }

  render() {
    const cates = this.state.categories.map((cate) => (
      <option key={cate._id} value={cate._id}>
        {cate.name}
      </option>
    ));

    return (
      <div className="float-right">
        <h2 className="text-center">PRODUCT DETAIL</h2>
        <form>
          <table>
            <tbody>
              <tr>
                <td>ID</td>
                <td>
                  <input
                    type="text"
                    value={this.state.txtID}
                    onChange={(e) => this.setState({ txtID: e.target.value })}
                    readOnly={true}
                  />
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td>
                  <input
                    type="text"
                    value={this.state.txtName}
                    onChange={(e) => this.setState({ txtName: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td>Price</td>
                <td>
                  <input
                    type="text"
                    value={this.state.txtPrice}
                    onChange={(e) => this.setState({ txtPrice: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td>Image</td>
                <td>
                  <input
                    type="file"
                    name="fileImage"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={(e) => this.previewImage(e)}
                  />
                </td>
              </tr>
              <tr>
                <td>Category</td>
                <td>
                  <select
                    value={this.state.cmbCategory}
                    onChange={(e) => this.setState({ cmbCategory: e.target.value })}
                  >
                    <option value="">-- Select category --</option>
                    {cates}
                  </select>
                  <input
                    type="text"
                    placeholder="or type category name"
                    value={this.state.txtCategory}
                    onChange={(e) => this.setState({ txtCategory: e.target.value, cmbCategory: "" })}
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <input
                    type="submit"
                    value="ADD NEW"
                    onClick={(e) => this.btnAddClick(e)}
                  />
                  <input
                    type="submit"
                    value="UPDATE"
                    onClick={(e) => this.btnUpdateClick(e)}
                  />
                  <input
                    type="submit"
                    value="DELETE"
                    onClick={(e) => this.btnDeleteClick(e)}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <img src={this.state.imgProduct} width="300" height="300" alt="" />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    );
  }
}

export default ProductDetail;
