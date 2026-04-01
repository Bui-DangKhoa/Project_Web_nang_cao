import React, { Component } from 'react';

class Home extends Component {
  render() {
    return (
      <div className="align-center">
        <h2 className="text-center">CUSTOMER HOME</h2>
        <div
          style={{
            height: '360px',
            borderRadius: '12px',
            border: '1px solid #2f2a24',
            background: 'linear-gradient(135deg, #1f1f1f 0%, #161616 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '56px' }}>🛍️</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#c8a96e' }}>
            Welcome to Customer Dashboard
          </div>
          <div style={{ color: '#c9c9c9' }}>Manage account, cart, and orders in one place.</div>
        </div>
      </div>
    );
  }
}

export default Home;
