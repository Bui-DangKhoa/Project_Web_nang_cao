import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { orderAPI, couponAPI } from "../services/api";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    street: "",
    city: "Hồ Chí Minh",
    district: "",
    phone: "",
  });
  const [paymentMethod, setPayment] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [toast, setToast] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const fmt = (n) => n.toLocaleString("vi-VN") + "đ";

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      const msg = "Vui lòng nhập mã giảm giá";
      setCouponMessage(msg);
      setToast({ type: "error", text: msg });
      return;
    }
    try {
      setCheckingCoupon(true);
      setCouponMessage("");
      const { data } = await couponAPI.validate({
        code: couponCode,
        orderTotal: cartTotal,
      });
      const discount = data.discount || 0;
      setDiscountAmount(discount);
      const msg = data.message || "Áp dụng mã giảm giá thành công";
      setCouponMessage(msg);
      setToast({ type: "success", text: `${msg} (-${fmt(discount)})` });
    } catch (err) {
      const msg = err.response?.data?.message || "Mã giảm giá không hợp lệ";
      setDiscountAmount(0);
      setCouponMessage(msg);
      setToast({ type: "error", text: msg });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const placeOrder = async () => {
    if (!form.name || !form.street || !form.phone)
      return alert("Vui lòng điền đầy đủ thông tin giao hàng");
    try {
      setLoading(true);
      let paidResult = paymentResult;
      const finalTotal = Math.max(0, cartTotal - discountAmount);

      const buildOrderPayload = (result, method = paymentMethod) => ({
        orderItems: cart.map((i) => ({
          name: i.name,
          qty: i.qty,
          image: i.images?.[0] || "",
          price: i.price,
          product: i._id,
          color: i.selectedColor,
          size: i.selectedSize,
        })),
        shippingAddress: form,
        paymentMethod: method,
        couponCode: couponCode.trim() || undefined,
        paymentResult: result || undefined,
      });

      const isOnlinePayment = ["momo", "card", "paypal"].includes(
        paymentMethod,
      );

      let order;
      if (isOnlinePayment) {
        order = await orderAPI.create(
          buildOrderPayload({
            provider: paymentMethod === "card" ? "stripe" : paymentMethod,
            method: paymentMethod,
            status: "pending",
            amount: finalTotal,
            update_time: new Date().toISOString(),
          }),
        );
      }

      if (paymentMethod === "momo" && !paidResult) {
        const momo = await orderAPI.createMomoPayment({
          amount: finalTotal,
          orderInfo: `Thanh toán đơn hàng VELOUR - ${form.name}`,
          orderId: order?.data?._id,
        });

        if (!momo.data.payUrl) {
          throw new Error("Không lấy được đường dẫn thanh toán MoMo");
        }

        window.open(momo.data.payUrl, "_blank", "noopener,noreferrer");

        paidResult = {
          id: momo.data.orderId,
          provider: "momo",
          method: "momo",
          status: "pending",
          amount: momo.data.amount,
          transactionNo: momo.data.requestId,
          payUrl: momo.data.payUrl,
          update_time: new Date().toISOString(),
        };
        setPaymentResult(paidResult);
      }

      if (paymentMethod === "card" && !paidResult) {
        const stripeSession = await orderAPI.createStripeCheckoutSession({
          amount: finalTotal,
          orderId: order?.data?._id,
          successUrl: `${window.location.origin}/dashboard?payment=stripe_success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=stripe_cancel`,
        });

        if (!stripeSession.data.url) {
          throw new Error("Không tạo được Stripe checkout session");
        }

        window.open(stripeSession.data.url, "_blank", "noopener,noreferrer");

        paidResult = {
          id: stripeSession.data.sessionId,
          provider: "stripe",
          method: "card",
          status: "pending",
          amount: finalTotal,
          transactionNo: stripeSession.data.sessionId,
          payUrl: stripeSession.data.url,
          update_time: new Date().toISOString(),
        };
        setPaymentResult(paidResult);
      }

      if (paymentMethod === "paypal" && !paidResult) {
        const paypalOrder = await orderAPI.createPaypalOrder({
          amount: finalTotal / 25000,
          currency: "USD",
          orderId: order?.data?._id,
        });

        const approveLink = (paypalOrder.data.links || []).find(
          (item) => item.rel === "approve",
        )?.href;
        if (approveLink) {
          window.open(approveLink, "_blank", "noopener,noreferrer");
        }
        paidResult = {
          id: paypalOrder.data.orderId,
          provider: "paypal",
          method: "paypal",
          status: "pending",
          amount: finalTotal,
          currency: "VND",
          transactionNo: paypalOrder.data.orderId,
          payUrl: approveLink,
          update_time: new Date().toISOString(),
        };
        setPaymentResult(paidResult);
      }

      if (!isOnlinePayment) {
        order = await orderAPI.create(buildOrderPayload(paidResult));
      }

      clearCart();
      navigate("/dashboard", { state: { newOrder: order?.data?._id } });
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {toast && (
        <div
          className="toast"
          style={{
            borderLeftColor:
              toast.type === "success" ? "var(--green)" : "var(--red)",
          }}
        >
          {toast.text}
        </div>
      )}
      <button className="back-btn" onClick={() => navigate("/cart")}>
        ← Quay lại giỏ hàng
      </button>
      <div className="checkout-page">
        <div>
          <h1 className="checkout-title">Thanh Toán</h1>
          <p className="checkout-subtitle">Hoàn tất đơn hàng của bạn</p>

          {/* Thông tin giao hàng */}
          <div className="form-section">
            <div className="form-section-title">Thông Tin Giao Hàng</div>
            {[
              ["name", "Họ & Tên", "Nguyễn Văn An"],
              ["street", "Địa Chỉ", "123 Đường Lê Lợi"],
              ["phone", "Số Điện Thoại", "0912 345 678"],
            ].map(([fieldName, label, ph]) => (
              <div key={fieldName} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  name={fieldName}
                  value={form[fieldName]}
                  onChange={handle}
                  placeholder={ph}
                />
              </div>
            ))}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Thành Phố</label>
                <select
                  className="form-select"
                  name="city"
                  value={form.city}
                  onChange={handle}
                >
                  <option>Hồ Chí Minh</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quận/Huyện</label>
                <input
                  className="form-input"
                  name="district"
                  value={form.district}
                  onChange={handle}
                  placeholder="Quận 1"
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="form-section">
            <div className="form-section-title">Phương Thức Thanh Toán</div>
            <div className="payment-methods">
              {[
                ["cod", "💵", "Thanh toán khi nhận hàng"],
                ["bank", "🏦", "Chuyển khoản ngân hàng"],
                ["momo", "💜", "Ví MoMo"],
                ["card", "💳", "Thẻ tín dụng/ghi nợ (Stripe Checkout)"],
                ["paypal", "🟦", "PayPal"],
              ].map(([val, em, label]) => (
                <div
                  key={val}
                  className={`payment-option ${paymentMethod === val ? "selected" : ""}`}
                  onClick={() => setPayment(val)}
                >
                  <div className="payment-radio">
                    {paymentMethod === val && (
                      <div className="payment-radio-inner" />
                    )}
                  </div>
                  <span style={{ fontSize: 20 }}>{em}</span>
                  <span className="payment-name">{label}</span>
                </div>
              ))}
            </div>

            {paymentMethod === "momo" && (
              <div
                style={{
                  marginTop: 12,
                  background: "rgba(129, 33, 129, 0.06)",
                  border: "1px solid rgba(129, 33, 129, 0.2)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                }}
              >
                Thanh toán MoMo sandbox: hệ thống sẽ tạo giao dịch và ghi nhận
                URL thanh toán có chữ ký HMAC. Sau khi trả về, IPN sẽ cập nhật
                trạng thái đơn.
              </div>
            )}

            {paymentMethod === "card" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: "var(--mid-gray)" }}>
                  Bạn sẽ được chuyển đến Stripe Checkout để nhập thông tin thẻ
                  an toàn theo chuẩn PCI DSS.
                </div>
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "var(--mid-gray)",
                }}
              >
                Hệ thống sẽ tạo PayPal order và capture thanh toán qua API
                PayPal.
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", padding: 16 }}
            onClick={placeOrder}
            disabled={loading || cart.length === 0}
          >
            {loading ? "Đang xử lý..." : "Xác Nhận Đặt Hàng"}
          </button>
        </div>

        {/* Sidebar */}
        <div className="checkout-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              Đơn Hàng ({cart.length} sản phẩm)
            </div>
            {cart.map((i) => (
              <div
                key={`${i._id}-${i.selectedSize}`}
                className="mini-cart-item"
              >
                <div className="mini-cart-emoji">
                  {i.images?.[0] ? (
                    <img
                      src={i.images[0]}
                      alt={i.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div>
                  <div className="mini-cart-name">{i.name}</div>
                  <div className="mini-cart-meta">
                    ×{i.qty} · {i.selectedSize}
                  </div>
                </div>
                <div className="mini-cart-price">{fmt(i.price * i.qty)}</div>
              </div>
            ))}
          </div>
          <div className="sidebar-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              <span>Tạm tính</span>
              <span>{fmt(cartTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  fontSize: 14,
                  color: "var(--green)",
                }}
              >
                <span>Giảm giá</span>
                <span>-{fmt(discountAmount)}</span>
              </div>
            )}
            <div style={{ margin: "12px 0" }}>
              <input
                className="form-input"
                placeholder="Nhập mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <button
                type="button"
                className="btn-outline"
                style={{ width: "100%", padding: 10, fontSize: 12 }}
                onClick={applyCoupon}
                disabled={checkingCoupon || !cart.length}
              >
                {checkingCoupon ? "Đang kiểm tra..." : "Áp Dụng Mã"}
              </button>
              {couponMessage && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: discountAmount > 0 ? "var(--green)" : "var(--red)",
                  }}
                >
                  {couponMessage}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              <span>Vận chuyển</span>
              <span style={{ color: "var(--green)" }}>Miễn phí</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                fontWeight: 600,
                paddingTop: 12,
                borderTop: "1px solid var(--light-gray)",
              }}
            >
              <span>Tổng cộng</span>
              <span style={{ color: "var(--accent)" }}>
                {fmt(Math.max(0, cartTotal - discountAmount))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
