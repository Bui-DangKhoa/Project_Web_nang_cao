import React, { Component } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Active from './ActiveComponent';
import Home from './HomeComponent';
import Inform from './InformComponent';
import Login from './LoginComponent';
import Mycart from './MycartComponent';
import Myorders from './MyordersComponent';
import Myprofile from './MyprofileComponent';
import Signup from './SignupComponent';

class Main extends Component {
  render() {
    return (
      <div className="body-customer">
        <Inform />
        <Routes>
          <Route path="/" element={<Navigate replace to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/active" element={<Active />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mycart" element={<Mycart />} />
          <Route path="/myorders" element={<Myorders />} />
          <Route path="/myprofile" element={<Myprofile />} />
        </Routes>
      </div>
    );
  }
}

export default Main;
