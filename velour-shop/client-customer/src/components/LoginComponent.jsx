import axios from 'axios';
import React, { Component } from 'react';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import MyContext from '../contexts/MyContext';
import { firebaseAuth, googleProvider } from '../services/firebase';
import withRouter from '../utils/withRouter';

class Login extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      txtUsername: 'sonkk',
      txtPassword: '123',
    };
  }

  async componentDidMount() {
    try {
      const redirectResult = await getRedirectResult(firebaseAuth);
      if (redirectResult && redirectResult.user) {
        const body = {
          email: redirectResult.user.email,
          name: redirectResult.user.displayName,
        };
        await this.apiGoogleLogin(body);
      }
    } catch (err) {
      alert(this.getFirebaseErrorMessage(err));
    }
  }

  btnLoginClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername;
    const password = this.state.txtPassword;

    if (username && password) {
      const account = { username: username, password: password };
      this.apiLogin(account);
    } else {
      alert('Please input username and password');
    }
  }

  apiLogin(account) {
    axios.post('/api/customer/login', account).then((res) => {
      const result = res.data;
      if (result.success === true) {
        this.context.setToken(result.token);
        this.context.setCustomer(result.customer);
        this.props.navigate('/home');
      } else {
        alert(result.message);
      }
    });
  }

  async apiGoogleLogin(body) {
    const res = await axios.post('/api/customer/login-google', body);
    const result = res.data;

    if (result.success === true) {
      this.context.setToken(result.token);
      this.context.setCustomer(result.customer);
      this.props.navigate('/home');
    } else {
      alert(result.message);
    }
  }

  getFirebaseErrorMessage(error) {
    const code = error?.code || '';

    if (code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      return `Domain hien tai chua duoc phep tren Firebase. Hay them 2 domain: ${currentHost} va app.github.dev vao Authentication > Settings > Authorized domains.`;
    }
    if (code === 'auth/popup-blocked') {
      return 'Trinh duyet dang chan popup. He thong se chuyen sang dang nhap bang redirect.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Ban da dong cua so dang nhap Google truoc khi hoan tat.';
    }
    if (code === 'auth/invalid-api-key') {
      return 'Firebase API key khong hop le. Vui long kiem tra VITE_FIREBASE_API_KEY.';
    }

    return `Google login failure (${code || 'unknown-error'})`;
  }

  btnGoogleLoginClick = async (e) => {
    e.preventDefault();
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const user = credential.user;
      const body = {
        email: user.email,
        name: user.displayName,
      };

      await this.apiGoogleLogin(body);
    } catch (err) {
      const code = err?.code || '';
      const msg = this.getFirebaseErrorMessage(err);

      if (code === 'auth/popup-blocked') {
        alert(msg);
        await signInWithRedirect(firebaseAuth, googleProvider);
        return;
      }

      alert(msg);
    }
  };

  render() {
    return (
      <div className="align-center">
        <h2 className="text-center">CUSTOMER LOGIN</h2>
        <form>
          <table className="align-center">
            <tbody>
              <tr>
                <td>Username</td>
                <td>
                  <input
                    type="text"
                    value={this.state.txtUsername}
                    onChange={(e) => {
                      this.setState({ txtUsername: e.target.value });
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td>Password</td>
                <td>
                  <input
                    type="password"
                    value={this.state.txtPassword}
                    onChange={(e) => {
                      this.setState({ txtPassword: e.target.value });
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <input type="submit" value="LOGIN" onClick={(e) => this.btnLoginClick(e)} />
                  <input
                    type="submit"
                    value="LOGIN WITH GOOGLE"
                    onClick={(e) => this.btnGoogleLoginClick(e)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    );
  }
}

export default withRouter(Login);
