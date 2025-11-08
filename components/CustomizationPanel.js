import { useEffect, useRef, useState } from 'react'

export default function CustomizationPanel({ onApplyTexture }) {
  const [shirtColor, setShirtColor] = useState('#000000')
  const [textInput, setTextInput] = useState('')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [fontSize, setFontSize] = useState(48)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textElements, setTextElements] = useState([])
  const [selectedTextIndex, setSelectedTextIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [openSection, setOpenSection] = useState('color') // 'color' or 'text'
  const uvImageRef = useRef(null)
  const canvasRef = useRef(null)

  const shirtColors = [
    '#FFFFFF', 
    '#000000', 
    '#323232', 
    '#0038ff', 
    '#224e22', 
    '#FFFF00', 
    '#e969c5', 
    '#00ff80', 
  ]

  useEffect(() => {
    const img = new Image()
    img.src = '/uv-maps/shirt-uv.png'
    img.onload = () => {
      uvImageRef.current = img
      applyTexture('#000000')
      drawPreview()
    }
  }, [])

  useEffect(() => {
    if (uvImageRef.current) {
      applyTexture(shirtColor)
    }
  }, [shirtColor])

  useEffect(() => {
    if (uvImageRef.current) {
      drawPreview()
      applyTexture(shirtColor)
    }
  }, [textElements])

  useEffect(() => {
    if (openSection === 'text' && uvImageRef.current) {
      // Redraw preview when text section opens
      setTimeout(() => drawPreview(), 10)
    }
  }, [openSection])

  const applyTexture = (color) => {
    if (!uvImageRef.current) return
    
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = 1024
    outputCanvas.height = 1024
    const outputCtx = outputCanvas.getContext('2d')
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = outputCanvas.width
    tempCanvas.height = outputCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(uvImageRef.current, 0, 0, tempCanvas.width, tempCanvas.height)
    const uvData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    
    const outputData = outputCtx.createImageData(outputCanvas.width, outputCanvas.height)
    const rgbColor = hexToRgb(color)
    
    for (let i = 0; i < uvData.data.length; i += 4) {
      const r = uvData.data[i]
      const g = uvData.data[i + 1]
      const b = uvData.data[i + 2]
      const a = uvData.data[i + 3]
      
      const isWhiteOrBlack = (r > 200 && g > 200 && b > 200) || (r < 55 && g < 55 && b < 55)
      
      if (isWhiteOrBlack) {
        outputData.data[i] = rgbColor.r
        outputData.data[i + 1] = rgbColor.g
        outputData.data[i + 2] = rgbColor.b
        outputData.data[i + 3] = a
      } else {
        outputData.data[i] = r
        outputData.data[i + 1] = g
        outputData.data[i + 2] = b
        outputData.data[i + 3] = a
      }
    }
    
    outputCtx.putImageData(outputData, 0, 0)

    // Draw text elements on the texture
    textElements.forEach(({ text, x, y, color, size, font }) => {
      outputCtx.font = `bold ${size}px ${font}`
      outputCtx.textAlign = 'center'
      outputCtx.textBaseline = 'middle'
      outputCtx.fillStyle = color
      outputCtx.strokeStyle = '#000000'
      outputCtx.lineWidth = Math.max(2, size / 24)

      outputCtx.strokeText(text, x, y)
      outputCtx.fillText(text, x, y)
    })
    
    if (onApplyTexture) {
      onApplyTexture(outputCanvas)
    }
  }

  const drawPreview = () => {
    if (!canvasRef.current || !uvImageRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Clear and draw UV map
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(uvImageRef.current, 0, 0, canvas.width, canvas.height)
    
    // Draw text elements
    const scale = canvas.width / 1024
    textElements.forEach(({ text, x, y, color, size, font }, index) => {
      ctx.font = `bold ${size * scale}px ${font}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = Math.max(2, size / 24) * scale

      ctx.strokeText(text, x * scale, y * scale)
      ctx.fillText(text, x * scale, y * scale)

      // Draw selection indicator
      if (index === selectedTextIndex) {
        ctx.strokeStyle = '#7dd3fc'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        const metrics = ctx.measureText(text)
        const textWidth = metrics.width
        const textHeight = size * scale
        ctx.strokeRect(
          x * scale - textWidth / 2 - 5,
          y * scale - textHeight / 2 - 5,
          textWidth + 10,
          textHeight + 10
        )
        ctx.setLineDash([])
      }
    })
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    
    const x = (e.clientX - rect.left) * scale
    const y = (e.clientY - rect.top) * scale
    
    // Convert to 1024x1024 coordinates
    const uvX = (x / canvas.width) * 1024
    const uvY = (y / canvas.height) * 1024
    
    // Check if clicking on existing text
    const clickedIndex = findTextAtPosition(uvX, uvY)
    
    if (clickedIndex !== -1) {
      setSelectedTextIndex(clickedIndex)
      drawPreview()
    } else if (textInput.trim()) {
      // Add new text
      const newText = {
        text: textInput,
        x: uvX,
        y: uvY,
        color: textColor,
        size: fontSize,
        font: fontFamily
      }
      setTextElements([...textElements, newText])
      setTextInput('')
      setSelectedTextIndex(textElements.length)
    }
  }

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    
    const x = ((e.clientX - rect.left) * scale / canvas.width) * 1024
    const y = ((e.clientY - rect.top) * scale / canvas.height) * 1024
    
    const clickedIndex = findTextAtPosition(x, y)
    
    if (clickedIndex !== -1) {
      setSelectedTextIndex(clickedIndex)
      setIsDragging(true)
      
      drawPreview()
    }
  }

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    
    const x = ((e.clientX - rect.left) * scale / canvas.width) * 1024
    const y = ((e.clientY - rect.top) * scale / canvas.height) * 1024
    
    if (isDragging && selectedTextIndex !== null) {
      // Dragging text
      const newTextElements = [...textElements]
      newTextElements[selectedTextIndex] = {
        ...newTextElements[selectedTextIndex],
        x: Math.max(0, Math.min(1024, x)),
        y: Math.max(0, Math.min(1024, y))
      }
      setTextElements(newTextElements)
      canvas.classList.add('grabbing')
    } else {
      // Update cursor based on hover
      const hoveredIndex = findTextAtPosition(x, y)
      if (hoveredIndex !== -1) {
        canvas.classList.add('grab-cursor')
        canvas.classList.remove('grabbing')
      } else {
        canvas.classList.remove('grab-cursor', 'grabbing')
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (canvasRef.current) {
      canvasRef.current.classList.remove('grabbing')
    }
  }

  const findTextAtPosition = (x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return -1
    
    const ctx = canvas.getContext('2d')
    const scale = canvas.width / 1024
    
    // Check in reverse order (top to bottom in z-order)
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i]
      ctx.font = `bold ${element.size * scale}px ${element.font}`
      const metrics = ctx.measureText(element.text)
      const textWidth = metrics.width / scale
      const textHeight = element.size
      
      const left = element.x - textWidth / 2
      const right = element.x + textWidth / 2
      const top = element.y - textHeight / 2
      const bottom = element.y + textHeight / 2
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return i
      }
    }
    return -1
  }

  const deleteSelectedText = () => {
    if (selectedTextIndex !== null) {
      const newTextElements = textElements.filter((_, index) => index !== selectedTextIndex)
      setTextElements(newTextElements)
      setSelectedTextIndex(null)
    }
  }

  const updateSelectedTextProperties = () => {
    if (selectedTextIndex !== null) {
      const newTextElements = [...textElements]
      newTextElements[selectedTextIndex] = {
        ...newTextElements[selectedTextIndex],
        color: textColor,
        size: fontSize,
        font: fontFamily
      }
      setTextElements(newTextElements)
    }
  }

  useEffect(() => {
    if (selectedTextIndex !== null) {
      const element = textElements[selectedTextIndex]
      if (element) {
        setTextColor(element.color)
        setFontSize(element.size)
        setFontFamily(element.font)
      }
    }
  }, [selectedTextIndex])
  
  const clearText = () => {
    setTextElements([])
    setSelectedTextIndex(null)
  }
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }
  }

  return (
    <div className="customization-panel">
        <h1 style={{ color: "#000000" }}>Customization Panel</h1>
      <div className="section">
        <button 
          className={`section-header ${openSection === 'color' ? 'active' : ''}`}
          onClick={() => setOpenSection(openSection === 'color' ? null : 'color')}
        >
          <span>Choose Your Color</span>
          <span className="arrow">{openSection === 'color' ? '▼' : '▶'}</span>
        </button>
        
        {openSection === 'color' && (
          <div className="section-content">
            <div className="color-grid">
              {shirtColors.map((color) => (
                <button
                  key={color}
                  className={`color-button ${shirtColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setShirtColor(color)}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <button 
          className={`section-header ${openSection === 'text' ? 'active' : ''}`}
          onClick={() => setOpenSection(openSection === 'text' ? null : 'text')}
        >
          <span>Add Text</span>
          <span className="arrow">{openSection === 'text' ? '▼' : '▶'}</span>
        </button>
        
        {openSection === 'text' && (
          <div className="section-content">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="text-input"
            />
            
            <div className="text-controls">
              <div className="control-group">
                <label>Font</label>
                <select 
                  value={fontFamily} 
                  onChange={(e) => {
                    setFontFamily(e.target.value)
                    updateSelectedTextProperties()
                  }}
                  className="font-select"
                >
                  <option value="Arial">Arial</option>
                  <option value="Impact">Impact</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                  <option value="Times New Roman">Times</option>
                </select>
              </div>

              <div className="control-group">
                <label>Size: {fontSize}px</label>
                <input
                  type="range"
                  min="24"
                  max="120"
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(parseInt(e.target.value))
                    updateSelectedTextProperties()
                  }}
                  className="slider"
                />
              </div>

              <div className="control-group">
                <label>Text Color</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value)
                    updateSelectedTextProperties()
                  }}
                  className="color-picker"
                />
              </div>
            </div>

            <p className="instruction">Click to place text or drag to move</p>
            
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="uv-preview"
            />
            
            <div className="button-group">
              {selectedTextIndex !== null && (
                <button onClick={deleteSelectedText} className="delete-button">
                  Delete Selected
                </button>
              )}
              {textElements.length > 0 && (
                <button onClick={clearText} className="clear-button">
                  Clear All Text
                </button>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  )
}
