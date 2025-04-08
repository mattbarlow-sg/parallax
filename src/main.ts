import * as THREE from 'three'
import './style.css'

const scene = new THREE.Scene()

const frustumSize = 10
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1000,
)

const canvas = document.querySelector('#canvas') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({canvas, antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const layers = [
  {image: 'bg.png', depth: -4, speed: 0.1},
  {image: 'fg.png', depth: -2, speed: 0.3},
]

const textureLoader = new THREE.TextureLoader()
const parallaxLayers: {left: THREE.Mesh; right: THREE.Mesh}[] = []

const viewportHeight = frustumSize
const viewportWidth = frustumSize * aspect

for (const layer of layers) {
  const texture1 = textureLoader.load(layer.image)
  const texture2 = textureLoader.load(layer.image)

  texture1.wrapS = THREE.RepeatWrapping
  texture2.wrapS = THREE.RepeatWrapping

  const geometry = new THREE.PlaneGeometry(viewportWidth, viewportHeight)
  const material1 = new THREE.MeshBasicMaterial({
    map: texture1,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  })
  const material2 = new THREE.MeshBasicMaterial({
    map: texture2,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  })

  const plane1 = new THREE.Mesh(geometry, material1)
  const plane2 = new THREE.Mesh(geometry, material2)

  plane1.position.z = layer.depth
  plane2.position.z = layer.depth
  plane1.position.x = 0
  plane2.position.x = viewportWidth

  scene.add(plane1)
  scene.add(plane2)

  parallaxLayers.push({
    left: plane1,
    right: plane2,
  })
}

camera.position.z = 5

const gameSpeed = 0.05
const isMoving = true

let mouseX = 0
let mouseY = 0
const parallaxStrength = 0.1

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - window.innerWidth / 2) * 0.001
  mouseY = (event.clientY - window.innerHeight / 2) * 0.001
})

function animate() {
  requestAnimationFrame(animate)

  if (isMoving) {
    parallaxLayers.forEach((layerPair, index) => {
      const layer = layers[index]
      const speed = gameSpeed * layer.speed

      layerPair.left.position.x -= speed
      layerPair.right.position.x -= speed

      const parallaxX = -mouseX * (Math.abs(layer.depth) + 1) * parallaxStrength
      const parallaxY = mouseY * (Math.abs(layer.depth) + 1) * parallaxStrength

      layerPair.left.position.y = parallaxY
      layerPair.right.position.y = parallaxY

      if (layerPair.left.position.x <= -viewportWidth) {
        layerPair.left.position.x = layerPair.right.position.x + viewportWidth
        ;[layerPair.left, layerPair.right] = [layerPair.right, layerPair.left]
      }
    })
  }

  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  const newAspect = window.innerWidth / window.innerHeight
  const newWidth = frustumSize * newAspect

  camera.left = -newWidth / 2
  camera.right = newWidth / 2
  camera.top = frustumSize / 2
  camera.bottom = -frustumSize / 2
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)

  for (const layerPair of parallaxLayers) {
    layerPair.left.geometry = new THREE.PlaneGeometry(newWidth, frustumSize)
    layerPair.right.geometry = new THREE.PlaneGeometry(newWidth, frustumSize)

    if (layerPair.right.position.x - layerPair.left.position.x !== newWidth) {
      layerPair.right.position.x = layerPair.left.position.x + newWidth
    }
  }
})

animate()
