import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'

export default function Buy() {
  const [generatedFrame, setGeneratedFrame] = useState(null)
  const [processedImageUrl, setProcessedImageUrl] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Get the generated frames from localStorage
    const framesJson = localStorage.getItem('generatedFrames')
    if (framesJson) {
      try {
        const frames = JSON.parse(framesJson)
        if (frames && frames.length > 0) {
          // Use the first frame
          const frameUrl = `http://localhost:8080/${frames[0]}`
          setGeneratedFrame(frameUrl)
          console.log('Loaded frame:', frames[0])
          
          // Process the image to remove navy blue background
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            
            // Get image data and make navy blue transparent
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              
              // Check for navy blue (dark blue colors)
              if (r < 50 && g < 50 && b > 60 && b < 150) {
                data[i + 3] = 0 // Set alpha to 0 (transparent)
              }
            }
            
            ctx.putImageData(imageData, 0, 0)
            setProcessedImageUrl(canvas.toDataURL())
          }
          img.src = frameUrl
        }
      } catch (error) {
        console.error('Error parsing frames:', error)
      }
    }
  }, [])

  return (
    <main style={{ padding: '2rem', background: '#fff', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 5rem)',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          filter: 'blur(0.5px)',
          fontFamily: 'Trebuchet MS, Arial Black, Impact, sans-serif',
        }}>
          <span style={{
            color: '#ff6b8a',
            WebkitTextStroke: '2px #000',
            paintOrder: 'stroke',
          }}>Merchify </span>
          <span style={{
            color: '#4db8ff',
            WebkitTextStroke: '2px #000',
            paintOrder: 'stroke',
          }}>Menu</span>
        </h1>
        <p style={{
          fontSize: '1.5rem',
          color: '#333',
          textAlign: 'center',
          fontWeight: '600',
        }}>
          Choose your product and customize it your way
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <Link href="/buy/shirt" style={{
          textDecoration: 'none',
          color: '#000',
          background: '#fff',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '2rem',
          transition: 'all 0.3s ease',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '8px 8px 0px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '250px',
            marginBottom: '1.5rem',
          }}>
            <Image 
              src="/placeholders/shirt-placeholder.png" 
              alt="Custom T-Shirt"
              fill
              style={{ objectFit: 'contain', objectPosition: 'top' }}
            />
            {processedImageUrl && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={processedImageUrl} 
                  alt="Generated frame"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}>Custom T-Shirt</h3>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '1rem',
            flex: '1',
          }}>Design your own t-shirt with custom colors and text</p>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: '800',
            color: '#aed13a',
          }}>From $30.00</span>
        </Link>

        <Link href="/buy/pants" style={{
          textDecoration: 'none',
          color: '#000',
          background: '#fff',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '2rem',
          transition: 'all 0.3s ease',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '8px 8px 0px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '250px',
            marginBottom: '1.5rem',
          }}>
            <Image 
              src="/placeholders/shirt-placeholder.png" 
              alt="Custom Pants"
              fill
              style={{ objectFit: 'contain', objectPosition: 'top' }}
            />
            {processedImageUrl && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={processedImageUrl} 
                  alt="Generated frame"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}>Custom Pants</h3>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '1rem',
            flex: '1',
          }}>Design your own pants with custom colors and text</p>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: '800',
            color: '#aed13a',
          }}>From $45.00</span>
        </Link>

        <Link href="/buy/hat" style={{
          textDecoration: 'none',
          color: '#000',
          background: '#fff',
          border: '4px solid #000',
          borderRadius: '16px',
          padding: '2rem',
          transition: 'all 0.3s ease',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '8px 8px 0px rgba(0, 0, 0, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '250px',
            marginBottom: '1.5rem',
          }}>
            <Image 
              src="/placeholders/shirt-placeholder.png" 
              alt="Custom Hat"
              fill
              style={{ objectFit: 'contain', objectPosition: 'top' }}
            />
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}>Custom Hat</h3>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '1rem',
            flex: '1',
          }}>Design your own hat with custom colors and text</p>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: '800',
            color: '#aed13a',
          }}>From $25.00</span>
        </Link>

        <div style={{
          background: '#f5f5f5',
          border: '4px solid #ddd',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          opacity: '0.6',
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '250px',
            marginBottom: '1.5rem',
          }}>
            <Image 
              src="/placeholders/shirt-placeholder.png" 
              alt="Custom Hoodie"
              fill
              style={{ objectFit: 'contain', objectPosition: 'top' }}
            />
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            color: '#999',
          }}>Custom Hoodie</h3>
          <p style={{
            fontSize: '1rem',
            color: '#999',
            marginBottom: '1rem',
            flex: '1',
          }}>Coming soon...</p>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: '800',
            color: '#999',
          }}>TBA</span>
        </div>
      </div>
    </main>
  )
}
