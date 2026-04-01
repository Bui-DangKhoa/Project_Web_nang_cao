import React, { Component } from "react";
import MyContext from "./MyContext";

class MyProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: "",
      username: "",
      setToken: this.setToken,
      setUsername: this.setUsername,
    };
  }

  setToken = (value) => {
    this.setState({ token: value });
  };

  setUsername = (value) => {
    this.setState({ username: value });
  };

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;
