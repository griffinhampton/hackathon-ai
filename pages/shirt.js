import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function ShirtCustomizer() {
  const mountRef = useRef(null)
  const canvasRef = useRef(null)
  const meshRef = useRef(null)
  const cameraRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const textureCanvasRef = useRef(null)
  
  const [overlays, setOverlays] = useState([])
  const [selectedOverlay, setSelectedOverlay] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Initialize Three.js scene
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth || 800
    const height = mount.clientHeight || 600
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 0.5, 2.5)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer
    canvasRef.current = renderer.domElement

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = Math.PI / 3
    controls.maxPolarAngle = 2 * Math.PI / 3
    controls.target.set(0, 0, 0)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight2.position.set(-5, -5, -5)
    scene.add(directionalLight2)

    // Load t-shirt model
    const loader = new GLTFLoader()
    loader.load('/models/tshirt.gltf', (gltf) => {
      const tshirtModel = gltf.scene
      meshRef.current = tshirtModel
      
      const box = new THREE.Box3().setFromObject(tshirtModel)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim
      tshirtModel.scale.multiplyScalar(scale)
      
      box.setFromObject(tshirtModel)
      const center = box.getCenter(new THREE.Vector3())
      tshirtModel.position.set(-center.x, -center.y, -center.z)
      
      scene.add(tshirtModel)
      
      // Create initial texture canvas
      updateTexture()
    })

    let frameId
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w > 0 && h > 0) {
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
    }
    
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      if (mount && renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Update texture when overlays change
  useEffect(() => {
    updateTexture()
  }, [overlays])

  const updateTexture = () => {
    if (!meshRef.current) return

    // Create or get texture canvas
    let canvas = textureCanvasRef.current
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 2048
      textureCanvasRef.current = canvas
    }

    const ctx = canvas.getContext('2d')
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw all overlays
    overlays.forEach((overlay) => {
      const x = overlay.position.x * canvas.width
      const y = (1 - overlay.position.y) * canvas.height // Flip Y for texture coordinates

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((overlay.rotation * Math.PI) / 180)
      ctx.scale(overlay.scale, overlay.scale)

      if (overlay.type === 'text') {
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`
        ctx.fillStyle = overlay.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(overlay.content, 0, 0)
      } else if (overlay.type === 'image' && overlay.imageElement) {
        const w = overlay.width || 100
        const h = overlay.height || 100
        ctx.drawImage(overlay.imageElement, -w / 2, -h / 2, w, h)
      }

      ctx.restore()
    })

    // Apply texture to mesh
    const texture = new THREE.CanvasTexture(canvas)
    texture.flipY = false
    texture.needsUpdate = true

    meshRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.map) {
          child.material.map.dispose()
        }
        child.material.map = texture
        child.material.needsUpdate = true
      }
    })
  }

  const handleCanvasClick = (e) => {
    if (!cameraRef.current || !meshRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({ x, y }, cameraRef.current)

    const intersects = raycaster.intersectObject(meshRef.current, true)
    
    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv
      
      // Check if clicked on existing overlay
      for (let i = overlays.length - 1; i >= 0; i--) {
        const overlay = overlays[i]
        const dx = Math.abs(uv.x - overlay.position.x)
        const dy = Math.abs(uv.y - overlay.position.y)
        
        if (dx < 0.08 && dy < 0.08) {
          setSelectedOverlay(i)
          setIsDragging(true)
          return
        }
      }
      setSelectedOverlay(null)
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || selectedOverlay === null) return
    if (!cameraRef.current || !meshRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({ x, y }, cameraRef.current)

    const intersects = raycaster.intersectObject(meshRef.current, true)
    
    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv
      const newOverlays = [...overlays]
      newOverlays[selectedOverlay] = {
        ...newOverlays[selectedOverlay],
        position: { x: uv.x, y: uv.y }
      }
      setOverlays(newOverlays)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const addTextOverlay = () => {
    const newOverlay = {
      type: 'text',
      content: 'Your Text',
      position: { x: 0.5, y: 0.5 },
      fontSize: 48,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      rotation: 0,
      scale: 1
    }
    setOverlays([...overlays, newOverlay])
    setSelectedOverlay(overlays.length)
  }

  const addImageOverlay = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            const newOverlay = {
              type: 'image',
              content: event.target.result,
              imageElement: img,
              position: { x: 0.5, y: 0.5 },
              width: 200,
              height: 200,
              rotation: 0,
              scale: 1
            }
            setOverlays([...overlays, newOverlay])
            setSelectedOverlay(overlays.length)
          }
          img.src = event.target.result
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const updateOverlay = (index, property, value) => {
    const newOverlays = [...overlays]
    newOverlays[index] = {
      ...newOverlays[index],
      [property]: value
    }
    setOverlays(newOverlays)
  }

  const deleteOverlay = (index) => {
    const newOverlays = overlays.filter((_, i) => i !== index)
    setOverlays(newOverlays)
    if (selectedOverlay === index) setSelectedOverlay(null)
  }

  return (
    <main style={{ 
      display: 'flex', 
      minHeight: 'calc(100vh - 70px)',
      background: '#fff',
      position: 'relative'
    }}>
      {/* 3D Canvas */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <div style={{
          padding: '2rem',
          borderBottom: '3px solid #000',
        }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: '900',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            filter: 'blur(0.5px)',
            fontFamily: 'Trebuchet MS, Arial Black, Impact, sans-serif',
          }}>
            <span style={{
              color: '#ff6b8a',
              WebkitTextStroke: '2px #000',
              paintOrder: 'stroke',
            }}>Custom </span>
            <span style={{
              color: '#4db8ff',
              WebkitTextStroke: '2px #000',
              paintOrder: 'stroke',
            }}>T-Shirt</span>
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#333',
            marginBottom: '1rem',
          }}>
            Customize with your own text and images
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.75rem'
          }}>
            <span style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#aed13a',
            }}>
              $30.00
            </span>
            <span style={{
              fontSize: '1rem',
              color: '#999',
              textDecoration: 'line-through'
            }}>
              $45.00
            </span>
          </div>
        </div>
        
        <div 
          ref={mountRef} 
          style={{ flex: 1, cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#666',
          fontSize: '0.9rem',
          fontWeight: '600',
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          ← Click and drag to rotate →
        </div>
      </div>

      {/* Customization Panel */}
      <div style={{
        width: '350px',
        borderLeft: '3px solid #000',
        padding: '2rem',
        overflowY: 'auto',
        background: '#f5f5f5',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '800',
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
        }}>Customize</h2>

        {/* Add Buttons */}
        <button
          onClick={addTextOverlay}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: '0.75rem',
            background: '#4db8ff',
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
          + Add Text
        </button>

        <button
          onClick={addImageOverlay}
          style={{
            width: '100%',
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#ffeb3b',
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
          + Add Image
        </button>

        {/* Overlays List */}
        {overlays.length > 0 && (
          <>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}>Elements ({overlays.length})</h3>
            
            {overlays.map((overlay, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: selectedOverlay === index ? '#fff' : '#fff',
                  border: `3px solid ${selectedOverlay === index ? '#000' : '#ddd'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: selectedOverlay === index ? '4px 4px 0px rgba(0, 0, 0, 0.2)' : 'none',
                }}
                onClick={() => setSelectedOverlay(index)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                    {overlay.type === 'text' ? '📝 Text' : '🖼️ Image'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteOverlay(index)
                    }}
                    style={{
                      background: '#ff6b8a',
                      border: '2px solid #000',
                      borderRadius: '6px',
                      padding: '0.4rem 0.8rem',
                      cursor: 'pointer',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Delete
                  </button>
                </div>

                {overlay.type === 'text' && (
                  <>
                    <input
                      type="text"
                      value={overlay.content}
                      onChange={(e) => updateOverlay(index, 'content', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #000',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        marginBottom: '0.75rem',
                        fontWeight: '600',
                      }}
                    />
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                        Color
                      </label>
                      <input
                        type="color"
                        value={overlay.color}
                        onChange={(e) => updateOverlay(index, 'color', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: '40px',
                          border: '2px solid #000',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                    Size: {Math.round(overlay.scale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.1"
                    value={overlay.scale}
                    onChange={(e) => updateOverlay(index, 'scale', parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                    Rotation: {Math.round(overlay.rotation)}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={overlay.rotation}
                    onChange={(e) => updateOverlay(index, 'rotation', parseInt(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {overlays.length === 0 && (
          <p style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '0.9rem',
            padding: '2rem 1rem',
            fontStyle: 'italic',
          }}>
            Click "Add Text" or "Add Image" to start customizing
          </p>
        )}

        {/* Checkout Button */}
        {overlays.length > 0 && (
          <button
            style={{
              width: '100%',
              padding: '1.25rem',
              marginTop: '2rem',
              background: '#aed13a',
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)'
              e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.2)'
            }}
          >
            Add to Cart - $30.00
          </button>
        )}
      </div>
    </main>
  )
}
