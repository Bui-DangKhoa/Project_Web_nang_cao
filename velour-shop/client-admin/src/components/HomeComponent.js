import React, { Component } from "react";

class Home extends Component {
  render() {
    return (
      <div className="align-center admin-home">
        <h2 className="text-center">ADMIN HOME</h2>

        <div className="home-hero">
          <div className="home-hero-copy">
            <span className="home-chip">Velour Control Center</span>
            <h3>
              Quản trị thông minh,
              <br />
              trải nghiệm cao cấp
            </h3>
            <p>
              Theo dõi đơn hàng, sản phẩm và khách hàng trên cùng một màn hình trực quan.
              Giao diện được làm mới với font hiện đại, bố cục thoáng và các khối hình ảnh để
              mang lại cảm giác chuyên nghiệp hơn.
            </p>
          </div>

          <div className="home-visual-grid">
            <div
              className="home-image-card tall"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80')",
              }}
            />
            <div
              className="home-image-card"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=600&q=80')",
              }}
            />
            <div
              className="home-image-card"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80')",
              }}
            />
          </div>
        </div>

        <div className="home-stats">
          <div className="home-stat">
            <strong>Live</strong>
            <span>Order Tracking</span>
          </div>
          <div className="home-stat">
            <strong>Fast</strong>
            <span>Inventory Update</span>
          </div>
          <div className="home-stat">
            <strong>360°</strong>
            <span>Customer View</span>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
