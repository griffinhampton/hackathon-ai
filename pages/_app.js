import '../styles/globals.css'
import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const [showCartModal, setShowCartModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDesignsModal, setShowDesignsModal] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [savedDesigns, setSavedDesigns] = useState([])

  // Load cart from sessionStorage on mount
  useEffect(() => {
    // Check if user is logged in (stored in sessionStorage)
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      setCurrentUser(storedUser)
      loadSavedDesigns(storedUser)
    }
    loadCart()
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart()
    }

    const handleOpenCart = () => {
      setShowCartModal(true)
    }

    const handleOpenDesigns = () => {
      setShowDesignsModal(true)
    }

    const handleDesignsUpdated = () => {
      const user = sessionStorage.getItem('currentUser')
      if (user) {
        loadSavedDesigns(user)
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('openCart', handleOpenCart)
    window.addEventListener('openDesigns', handleOpenDesigns)
    window.addEventListener('designsUpdated', handleDesignsUpdated)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('openCart', handleOpenCart)
      window.removeEventListener('openDesigns', handleOpenDesigns)
      window.removeEventListener('designsUpdated', handleDesignsUpdated)
    }
  }, [])

  // Save cart whenever it changes or user changes
  useEffect(() => {
    if (currentUser) {
      // Save to user-specific localStorage
      localStorage.setItem(`cart_${currentUser}`, JSON.stringify(cartItems))
    } else {
      // Save to sessionStorage for guest
      sessionStorage.setItem('cart', JSON.stringify(cartItems))
    }
  }, [cartItems, currentUser])

  const loadCart = () => {
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      // Load from user-specific localStorage
      const userCart = JSON.parse(localStorage.getItem(`cart_${storedUser}`) || '[]')
      setCartItems(userCart)
    } else {
      // Load from sessionStorage for guest
      const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
      setCartItems(cart)
    }
  }

  const clearCart = () => {
    if (currentUser) {
      localStorage.removeItem(`cart_${currentUser}`)
    } else {
      sessionStorage.removeItem('cart')
    }
    setCartItems([])
  }

  const removeItem = (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index)
    setCartItems(updatedCart)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) {
      alert('Please enter username and password')
      return
    }

    // Check if user exists in localStorage (simple check: if a user key exists)
    const userExists = localStorage.getItem(`user_${loginUsername}`)
    
    if (userExists) {
      const storedPassword = JSON.parse(userExists).password
      if (storedPassword === loginPassword) {
        // Login successful
        setCurrentUser(loginUsername)
        sessionStorage.setItem('currentUser', loginUsername)
        
        // Load user's saved cart
        const userCart = JSON.parse(localStorage.getItem(`cart_${loginUsername}`) || '[]')
        setCartItems(userCart)
        
        setShowLoginModal(false)
        setLoginUsername('')
        setLoginPassword('')
      } else {
        alert('Incorrect password')
      }
    } else {
      // User doesn't exist, create account
      localStorage.setItem(`user_${loginUsername}`, JSON.stringify({ username: loginUsername, password: loginPassword }))
      setCurrentUser(loginUsername)
      sessionStorage.setItem('currentUser', loginUsername)
      
      // Start with empty cart for new user
      setCartItems([])
      
      setShowLoginModal(false)
      setLoginUsername('')
      setLoginPassword('')
      alert('Account created and logged in!')
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem('currentUser')
    setCartItems([])
    setSavedDesigns([])
    // Reload from guest sessionStorage
    loadCart()
  }

  const loadSavedDesigns = (username) => {
    const designs = JSON.parse(localStorage.getItem(`designs_${username}`) || '[]')
    setSavedDesigns(designs)
  }

  const deleteDesign = (index) => {
    if (!currentUser) return
    const updatedDesigns = savedDesigns.filter((_, i) => i !== index)
    setSavedDesigns(updatedDesigns)
    localStorage.setItem(`designs_${currentUser}`, JSON.stringify(updatedDesigns))
  }

  const loadDesign = (design) => {
    // Dispatch event with design data to be picked up by customizer
    window.dispatchEvent(new CustomEvent('loadDesign', { detail: design }))
    setShowDesignsModal(false)
    
    // Navigate to appropriate customizer page
    const targetPage = design.type === 'shirt' ? '/buy/shirt' : '/buy/pants'
    if (window.location.pathname !== targetPage) {
      window.location.href = targetPage
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0)
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/assets/icon.png" />
      </Head>
      
      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 100,
        borderBottom: '3px solid #000',
      }}>
        {/* Left side - Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
          {/* Upload Button */}
          <button
            onClick={() => {
              if (window.location.pathname === '/') {
                // If on home page, trigger the modal directly
                window.dispatchEvent(new CustomEvent('openUploadModal'))
              } else {
                window.location.href = '/'
              }
            }}
            style={{
              fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
              fontWeight: '800',
              fontFamily: "'mono45-headline', monospace, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
              color: '#000',
              cursor: 'pointer',
              padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1.2rem, 3vw, 2rem)',
              border: '3px solid #000',
              borderRadius: '50px',
              background: '#aed13a',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#9bc025'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#aed13a'
              e.currentTarget.style.transform = 'scale(1)'
            }}>
            UPLOAD
          </button>
          
          {/* Our Merch Button */}
          <button
            onClick={() => window.location.href = '/buy'}
            style={{
              fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
              fontWeight: '800',
              fontFamily: "'mono45-headline', monospace, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
              color: '#000',
              cursor: 'pointer',
              padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1.2rem, 3vw, 2rem)',
              border: '3px solid #000',
              borderRadius: '50px',
              background: '#ffb74d',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ee9f35'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffb74d'
              e.currentTarget.style.transform = 'scale(1)'
            }}>
            MERCH
          </button>
        </div>
        
        {/* Center - Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
          <img 
            src="/assets/main-logo.png" 
            alt="Jokester Logo" 
            style={{
              height: '60px',
              width: 'auto',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = '/'}
          />
        </div>
        
        {/* Right side - Cart */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          {/* Login/Logout Button */}
          {currentUser ? (
            <button 
              onClick={handleLogout}
              style={{
                fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
                fontWeight: '800',
                fontFamily: "'mono45-headline', monospace, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                color: '#000',
                cursor: 'pointer',
                padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1.2rem, 3vw, 2rem)',
                border: '3px solid #000',
                borderRadius: '50px',
                background: '#b388ff',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#9d6eeb'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#b388ff'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
              LOGOUT
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              style={{
                fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
                fontWeight: '800',
                fontFamily: "'mono45-headline', monospace, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                color: '#000',
                cursor: 'pointer',
                padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1.2rem, 3vw, 2rem)',
                border: '3px solid #000',
                borderRadius: '50px',
                background: '#4db8ff',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3aa0e6'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4db8ff'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
              LOGIN
            </button>
          )}
          
          {/* Cart Button */}
          <button 
            onClick={() => setShowCartModal(true)}
            style={{
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            fontWeight: '800',
            fontFamily: "'mono45-headline', monospace, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            color: '#000',
            cursor: 'pointer',
            padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1.2rem, 3vw, 2rem)',
            border: '3px solid #000',
            borderRadius: '50px',
            background: '#d97676',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#c96666'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#d97676'
            e.currentTarget.style.transform = 'scale(1)'
          }}>
            CART({cartItems.length})
          </button>
        </div>
      </nav>

      {/* Page Content with padding for fixed navbar */}
      <div style={{ paddingTop: '70px', minHeight: '100vh' }}>
        <Component {...pageProps} />
      </div>

      {/* Cart Modal */}
      {showCartModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            border: '4px solid #000',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Logo */}
            <img 
              src="/assets/main-logo.png" 
              alt="Logo" 
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                height: '32px',
                width: 'auto',
              }}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setShowCartModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#000',
                border: '2px solid #000',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                fontWeight: 'bold',
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d97676'
                e.currentTarget.style.color = '#000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000'
                e.currentTarget.style.color = '#fff'
              }}
            >
              ✕
            </button>

            <h2 style={{ 
              color: '#000', 
              marginBottom: '1.5rem', 
              marginTop: '2.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              filter: 'blur(0.5px)',
              fontFamily: 'Trebuchet MS, Arial Black, Impact, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            }}>Your Cart</h2>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#999',
                fontSize: '1.1rem',
                fontStyle: 'italic',
              }}>
                Your cart is empty
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  {cartItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: '#f5f5f5',
                        border: '3px solid #000',
                        borderRadius: '12px',
                      }}
                    >
                      {/* Item Image/Thumbnail - Show design snapshot */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: item.design ? `url(${item.design})` : '#fff',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }} />

                      {/* Item Details */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                        }}>
                          Custom {item.type === 'shirt' ? 'T-Shirt' : 'Pants'}
                        </h3>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#666',
                          marginBottom: '0.25rem',
                        }}>
                          Color: <span style={{ fontWeight: '600' }}>{item.color || 'White'}</span>
                        </p>
                        <p style={{
                          fontSize: '1.1rem',
                          fontWeight: '800',
                          color: '#aed13a',
                        }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(index)}
                        style={{
                          background: '#ff6b8a',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ff4d6d'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ff6b8a'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total and Actions */}
                <div style={{
                  borderTop: '3px solid #000',
                  paddingTop: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}>
                      Total:
                    </span>
                    <span style={{
                      fontSize: '1.8rem',
                      fontWeight: '800',
                      color: '#aed13a',
                    }}>
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={clearCart}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#fff',
                        border: '3px solid #000',
                        borderRadius: '12px',
                        color: '#000',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease',
                        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)'
                        e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(0, 0)'
                        e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={() => {
                        // Navigate to checkout page
                        window.location.href = '/checkout'
                      }}
                      style={{
                        flex: 2,
                        padding: '1rem',
                        background: '#aed13a',
                        border: '3px solid #000',
                        borderRadius: '12px',
                        color: '#000',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease',
                        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)'
                        e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
                        e.currentTarget.style.background = '#9bc025'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(0, 0)'
                        e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
                        e.currentTarget.style.background = '#aed13a'
                      }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            border: '4px solid #000',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            position: 'relative',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Logo */}
            <img 
              src="/assets/main-logo.png" 
              alt="Logo" 
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                height: '32px',
                width: 'auto',
              }}
            />
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowLoginModal(false)
                setLoginUsername('')
                setLoginPassword('')
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#000',
                border: '2px solid #000',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                fontWeight: 'bold',
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4db8ff'
                e.currentTarget.style.color = '#000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000'
                e.currentTarget.style.color = '#fff'
              }}
            >
              ✕
            </button>

            <h2 style={{ 
              color: '#000', 
              marginBottom: '1rem', 
              marginTop: '2.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              filter: 'blur(0.5px)',
              fontFamily: 'Trebuchet MS, Arial Black, Impact, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            }}>Login</h2>

            <p style={{
              color: '#666',
              fontSize: '0.95rem',
              marginBottom: '1.5rem',
            }}>
              Enter your credentials to access your saved cart. Don't have an account? We'll create one for you!
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#4db8ff',
                  border: '3px solid #000',
                  borderRadius: '12px',
                  color: '#000',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)'
                  e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.background = '#3aa0e6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.background = '#4db8ff'
                }}
              >
                Login / Sign Up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Designs Modal */}
      {showDesignsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            border: '4px solid #000',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
          }}>
            {/* Logo */}
            <img 
              src="/assets/main-logo.png" 
              alt="Logo" 
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                height: '32px',
                width: 'auto',
              }}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setShowDesignsModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#000',
                border: '2px solid #000',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                fontWeight: 'bold',
                padding: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffeb3b'
                e.currentTarget.style.color = '#000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000'
                e.currentTarget.style.color = '#fff'
              }}
            >
              ✕
            </button>

            <h2 style={{ 
              color: '#000', 
              marginBottom: '1.5rem', 
              marginTop: '2.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              filter: 'blur(0.5px)',
              fontFamily: 'Trebuchet MS, Arial Black, Impact, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            }}>My Designs</h2>

            {/* Saved Designs List */}
            {savedDesigns.length === 0 ? (
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#999',
                fontSize: '1.1rem',
                fontStyle: 'italic',
              }}>
                No saved designs yet. Create and save a design from the customizer!
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                {savedDesigns.map((design, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      marginBottom: '1rem',
                      background: '#f5f5f5',
                      border: '3px solid #000',
                      borderRadius: '12px',
                    }}
                  >
                    {/* Design Preview */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: design.preview ? `url(${design.preview})` : '#fff',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '2px solid #000',
                      borderRadius: '8px',
                      flexShrink: 0,
                    }} />

                    {/* Design Details */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                      }}>
                        {design.name}
                      </h3>
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#666',
                        marginBottom: '0.25rem',
                      }}>
                        {design.type === 'shirt' ? 'T-Shirt' : 'Pants'} • {design.color}
                      </p>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#999',
                      }}>
                        {design.overlays?.length || 0} element{design.overlays?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        onClick={() => loadDesign(design)}
                        style={{
                          background: '#4db8ff',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#3aa0e6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#4db8ff'
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${design.name}"?`)) {
                            deleteDesign(index)
                          }
                        }}
                        style={{
                          background: '#ff6b8a',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ff4d6d'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ff6b8a'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: '#000',
        color: '#fff',
        padding: '3rem 2rem',
        borderTop: '4px solid #d97676',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
        }}>
          <div>
            <h4 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}>
              JOKESTER
            </h4>
            <p style={{
              color: '#aaa',
              lineHeight: '1.6',
            }}>
              Turn your viral moments into wearable art. Custom merch made from your funniest content.
            </p>
          </div>
          <div>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}>
              Links
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>About</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>FAQ</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}>
              Social
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Instagram</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>TikTok</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none' }}>Twitter</a>
              </li>
            </ul>
          </div>
        </div>
        <div style={{
          maxWidth: '1200px',
          margin: '3rem auto 0',
          paddingTop: '2rem',
          borderTop: '1px solid #333',
          textAlign: 'center',
          color: '#666',
        }}>
          © 2025 JOKESTER. All rights reserved.
        </div>
      </footer>
    </>
  )
}
