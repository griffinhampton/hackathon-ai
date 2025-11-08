import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [stateField, setStateField] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [processing, setProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
    setCartItems(cart)
  }, [])

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0)
  }

  const handleBuy = (e) => {
    e.preventDefault()
    // Basic validation
    if (!email || !name || cartItems.length === 0) {
      alert('Please provide your name, email and have items in your cart.')
      return
    }

    setProcessing(true)

    // Simulate processing delay
    setTimeout(() => {
      // Clear cart and notify app
      sessionStorage.removeItem('cart')
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      // Mark order as placed
      const id = 'JOK' + Date.now().toString(36).toUpperCase()
      setOrderId(id)
      setOrderPlaced(true)
      setProcessing(false)

      // In a real app, you'd send order details to your backend here and trigger an email
    }, 900)
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <main style={{ padding: '80px 1rem' }}>
        <div style={{ maxWidth: '700px', margin: '3rem auto' }}>
          <div style={{
            background: '#fff',
            border: '4px solid #000',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase' }}>Checkout</h2>
            <p style={{ color: '#666', marginTop: '1rem' }}>Your cart is empty. Add items before checking out.</p>
            <div style={{ marginTop: '1.5rem' }}>
              <a href="/buy" style={{
                display: 'inline-block',
                padding: '0.8rem 1.2rem',
                background: '#aed13a',
                border: '3px solid #000',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#000',
                fontWeight: '800'
              }}>Back to Shop</a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head>
        <title>Checkout — Jokester</title>
      </Head>
      <main style={{ padding: '80px 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-start',
          }}>
            {/* Form (left) */}
            <div style={{ flex: 1 }}>
              <div style={{
                background: '#fff',
                border: '4px solid #000',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '8px 8px 0px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase' }}>Checkout</h2>
                {!orderPlaced ? (
                  <form onSubmit={handleBuy} style={{ marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Full name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Example" style={{ width: '100%', padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={{ width: '100%', padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                    </div>

                    <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 800 }}>Shipping Address</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Address line 1" style={{ width: '100%', padding: '0.75rem', border: '2px solid #000', borderRadius: 6, marginBottom: '0.5rem' }} />
                      <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Address line 2 (optional)" style={{ width: '100%', padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem', marginBottom: '1rem' }}>
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                      <input value={stateField} onChange={(e) => setStateField(e.target.value)} placeholder="State" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                      <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                    </div>

                    <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 800 }}>Payment</h3>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" style={{ width: '100%', padding: '0.75rem', border: '2px solid #000', borderRadius: 6, marginBottom: '0.5rem' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem' }}>
                        <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                        <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="CVC" style={{ padding: '0.75rem', border: '2px solid #000', borderRadius: 6 }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button type="submit" disabled={processing} style={{ flex: 1, padding: '0.9rem', background: '#aed13a', border: '3px solid #000', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>{processing ? 'Processing...' : `Buy — $${getTotalPrice().toFixed(2)}`}</button>
                      <a href="/buy" style={{ display: 'inline-block', padding: '0.9rem', background: '#fff', border: '3px solid #000', borderRadius: '12px', textDecoration: 'none', color: '#000', fontWeight: 800 }}>Back to shop</a>
                    </div>
                  </form>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Order confirmed</h3>
                    <p style={{ color: '#666' }}>Thanks — we sent a confirmation email to <strong>{email}</strong> with shipping details. Your order id is <strong>{orderId}</strong>.</p>
                    <div style={{ marginTop: '1rem' }}>
                      <a href="/" style={{ display: 'inline-block', padding: '0.8rem 1.2rem', background: '#4db8ff', border: '3px solid #000', borderRadius: '10px', textDecoration: 'none', color: '#000', fontWeight: '800' }}>Return Home</a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary (right) */}
            <div style={{ width: '320px' }}>
              <div style={{
                background: '#fff',
                border: '4px solid #000',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '8px 8px 0px rgba(0,0,0,0.15)'
              }}>
                <h4 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Order Summary</h4>
                <div style={{ marginTop: '1rem' }}>
                  {cartItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ width: 56, height: 56, background: item.design ? `url(${item.design})` : '#fff', backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid #000', borderRadius: 6 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800 }}>{item.type === 'shirt' ? 'T-Shirt' : 'Pants'}</div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>{item.color}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>${item.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '3px solid #000', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontWeight: 900, color: '#aed13a' }}>${getTotalPrice().toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
