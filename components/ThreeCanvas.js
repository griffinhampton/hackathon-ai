import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function ThreeCanvas({ textureUpdate }) {
  const mountRef = useRef(null)
  const tshirtModelRef = useRef(null)
  const textureRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Initialize Three.js canvas
    const initCanvas = () => {
      const width = mount.clientWidth || 800
      const height = mount.clientHeight || 600
      
      const scene = new THREE.Scene()
      scene.background = new THREE.Color()

      const camera = new THREE.PerspectiveCamera(
        50, 
        width / height, 
        0.1, 
        1000
      )
      camera.position.set(0, 0.5, 2.5)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.domElement.style.cursor = 'grab'
      mount.appendChild(renderer.domElement)

      return { renderer, camera, scene }
    }

    const { renderer, camera, scene } = initCanvas()

    // Setup OrbitControls for rotation only around z-axis
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.enablePan = false
    // Better vertical rotation limits (not locked)
    controls.minPolarAngle = Math.PI / 3  // 60 degrees from top
    controls.maxPolarAngle = 2 * Math.PI / 3  // 60 degrees from bottom
    controls.target.set(0, 0, 0)

    // Change cursor on drag
    controls.addEventListener('start', () => {
      renderer.domElement.style.cursor = 'grabbing'
    })
    controls.addEventListener('end', () => {
      renderer.domElement.style.cursor = 'grab'
    })

    // Add lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight2.position.set(-5, -5, -5)
    scene.add(directionalLight2)

    // Load the t-shirt model
    const loader = new GLTFLoader()

    loader.load(
      '/models/tshirt.gltf',
      function(gltf) {
        const tshirtModel = gltf.scene
        tshirtModelRef.current = tshirtModel
        
        // Scale first
        const box = new THREE.Box3().setFromObject(tshirtModel)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        tshirtModel.scale.multiplyScalar(scale)
        
        // Now recalculate box after scaling and center it
        box.setFromObject(tshirtModel)
        const center = box.getCenter(new THREE.Vector3())
        tshirtModel.position.set(-center.x, -center.y, -center.z)
        
        scene.add(tshirtModel)
        console.log('T-shirt model loaded successfully!')
      },
      function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
      },
      function(error) {
        console.error('Error loading t-shirt model:', error)
      }
    )

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
    
    // Handle both resize and orientation change
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100) // Delay to ensure DOM has updated
    })

    // Initial resize to ensure proper sizing
    setTimeout(handleResize, 100)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (mount && renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
      // dispose three objects
      const tshirtModel = tshirtModelRef.current
      if (tshirtModel) {
        tshirtModel.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }
      if (textureRef.current) {
        textureRef.current.dispose()
      }
      renderer.dispose()
    }
  }, []) 

  // Effect to apply custom texture when it changes
  useEffect(() => {
    if (!textureUpdate?.canvas || !tshirtModelRef.current) return

    const tshirtModel = tshirtModelRef.current
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(textureUpdate.canvas)
    texture.flipY = false // Important for GLTF models
    texture.needsUpdate = true
    
    // Dispose old texture if exists
    if (textureRef.current) {
      textureRef.current.dispose()
    }
    textureRef.current = texture

    // Apply texture to the shirt material
    tshirtModel.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.map) {
          child.material.map.dispose()
        }
        child.material.map = texture
        child.material.needsUpdate = true
      }
    })

  }, [textureUpdate])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '1.5rem 2rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        
      }}>
        <h1 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'white'
        }}>
          Premium Custom T-Shirt
        </h1>
        <p style={{
          margin: '0 0 1rem 0',
          fontSize: '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.6'
        }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Customize with your own colors and text.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.75rem'
        }}>
          <span style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ff0000ff'
          }}>
            $30.00
          </span>
          <span style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textDecoration: 'line-through'
          }}>
            45.00
          </span>
        </div>
      </div>
      <div ref={mountRef} style={{ width: '100%', flex: 1 }} />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#000000ff',
        fontSize: '0.9rem',
        opacity: 0.7,
        pointerEvents: 'none',
        textAlign: 'center',
        fontWeight: 500,
        
      }}>
        ← Click and drag to spin →
      </div>
    </div>
  )
}
