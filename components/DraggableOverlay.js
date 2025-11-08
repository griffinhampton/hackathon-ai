import { useState, useRef, useEffect } from 'react'

/**
 * DraggableOverlay Component
 * Allows users to add and drag text/images on a 3D canvas
 * Can be reused for any merch item (shirts, hats, hoodies, etc.)
 */
export default function DraggableOverlay({ 
  canvasRef, 
  overlays = [], 
  onOverlaysChange,
  meshRef,
  cameraRef,
  sceneRef
}) {
  const [selectedOverlay, setSelectedOverlay] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Convert screen coordinates to UV coordinates on the mesh
  const screenToUV = (screenX, screenY) => {
    if (!canvasRef.current || !meshRef.current || !cameraRef.current) return null

    const canvas = canvasRef.current.querySelector('canvas')
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    
    // Normalize to -1 to 1
    const x = ((screenX - rect.left) / rect.width) * 2 - 1
    const y = -((screenY - rect.top) / rect.height) * 2 + 1

    // Raycaster to find intersection with mesh
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({ x, y }, cameraRef.current)

    const intersects = raycaster.intersectObject(meshRef.current, true)
    
    if (intersects.length > 0) {
      const uv = intersects[0].uv
      return uv ? { x: uv.x, y: uv.y } : null
    }

    return null
  }

  const handleMouseDown = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    
    setSelectedOverlay(index)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || selectedOverlay === null) return

    const uv = screenToUV(e.clientX, e.clientY)
    
    if (uv) {
      const newOverlays = [...overlays]
      newOverlays[selectedOverlay] = {
        ...newOverlays[selectedOverlay],
        position: { x: uv.x, y: uv.y }
      }
      onOverlaysChange(newOverlays)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, selectedOverlay, overlays])

  // Add text overlay
  const addTextOverlay = (text) => {
    const newOverlay = {
      type: 'text',
      content: text,
      position: { x: 0.5, y: 0.5 }, // Center of UV space
      fontSize: 24,
      color: '#000000',
      fontFamily: 'Arial',
      rotation: 0,
      scale: 1
    }
    onOverlaysChange([...overlays, newOverlay])
  }

  // Add image overlay
  const addImageOverlay = (imageUrl) => {
    const newOverlay = {
      type: 'image',
      content: imageUrl,
      position: { x: 0.5, y: 0.5 },
      width: 100,
      height: 100,
      rotation: 0,
      scale: 1
    }
    onOverlaysChange([...overlays, newOverlay])
  }

  // Update overlay property
  const updateOverlay = (index, property, value) => {
    const newOverlays = [...overlays]
    newOverlays[index] = {
      ...newOverlays[index],
      [property]: value
    }
    onOverlaysChange(newOverlays)
  }

  // Delete overlay
  const deleteOverlay = (index) => {
    const newOverlays = overlays.filter((_, i) => i !== index)
    onOverlaysChange(newOverlays)
    if (selectedOverlay === index) setSelectedOverlay(null)
  }

  return {
    // Export methods for parent component to use
    addTextOverlay,
    addImageOverlay,
    updateOverlay,
    deleteOverlay,
    selectedOverlay,
    setSelectedOverlay,
    
    // Render overlay controls
    OverlayControls: () => (
      <div style={{
        position: 'fixed',
        top: '90px',
        right: '20px',
        background: '#fff',
        border: '3px solid #000',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '300px',
        boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '800',
          marginBottom: '1rem',
          textTransform: 'uppercase',
        }}>Customize</h3>

        {/* Add Text Button */}
        <button
          onClick={() => addTextOverlay('Your Text')}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '0.5rem',
            background: '#4db8ff',
            border: '2px solid #000',
            borderRadius: '8px',
            color: '#000',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3da0e0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#4db8ff'}
        >
          + Add Text
        </button>

        {/* Add Image Button */}
        <button
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e) => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  addImageOverlay(event.target.result)
                }
                reader.readAsDataURL(file)
              }
            }
            input.click()
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            background: '#ffeb3b',
            border: '2px solid #000',
            borderRadius: '8px',
            color: '#000',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e0d025'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffeb3b'}
        >
          + Add Image
        </button>

        {/* Overlay List */}
        {overlays.length > 0 && (
          <div style={{
            borderTop: '2px solid #000',
            paddingTop: '1rem',
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
            }}>Elements ({overlays.length})</h4>
            
            {overlays.map((overlay, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: selectedOverlay === index ? '#f0f0f0' : '#fff',
                  border: `2px solid ${selectedOverlay === index ? '#000' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedOverlay(index)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
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
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                    }}
                  >
                    Delete
                  </button>
                </div>

                {overlay.type === 'text' && (
                  <input
                    type="text"
                    value={overlay.content}
                    onChange={(e) => updateOverlay(index, 'content', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid #000',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                    }}
                  />
                )}

                {/* Scale Control */}
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Size: {Math.round(overlay.scale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={overlay.scale}
                    onChange={(e) => updateOverlay(index, 'scale', parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Rotation Control */}
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
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

                {overlay.type === 'text' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={overlay.color}
                      onChange={(e) => updateOverlay(index, 'color', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        height: '30px',
                        border: '2px solid #000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    
    // Handle dragging on canvas
    handleCanvasMouseDown: (e) => {
      const uv = screenToUV(e.clientX, e.clientY)
      if (!uv) return

      // Check if clicked on an existing overlay
      for (let i = overlays.length - 1; i >= 0; i--) {
        const overlay = overlays[i]
        const dx = Math.abs(uv.x - overlay.position.x)
        const dy = Math.abs(uv.y - overlay.position.y)
        
        // Simple hit detection - within 0.05 UV units
        if (dx < 0.05 && dy < 0.05) {
          handleMouseDown(e, i)
          return
        }
      }
    }
  }
}
