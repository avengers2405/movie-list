'use client'

import React, { useState, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { Spiderman } from './spiderman3'
// import { IronMan } from './IronMan'

export default function App() {
  const [activeAction, setActiveAction] = useState(null) // 'PULL', 'PUSH', null
  const boxRef = useRef()
  // this is used to store reference to the physical box, we pass it to spiderman 
  // component so he knows exactly which object to shoot his web at
  console.log("testing github")

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#ffffff' }}>
      {/* 2D UI Overlay */}
      <div style={{ position: 'absolute', zIndex: 10, padding: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onMouseDown={() => setActiveAction('PULL')} 
          onMouseUp={() => setActiveAction(null)}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Spiderman: Pull Box
        </button>
        
        {/* <button 
          onClick={() => setActiveAction('PUSH')}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Iron Man: Push Box
        </button> */}
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={5} />
          <pointLight position={[10, 10, 10]} intensity={200} castShadow />
          
          <Physics gravity={[0, -9.81, 0]} debug >
            <Spiderman 
              isActive={activeAction === 'PULL'} 
              targetBoxRef={boxRef} 
              position={[-3, 5, 0]} // note that just changing this would move the skin
              // only, not the bounding boxes. so to move them either use useEffect 
              // or use the setNextKinematicTranslation method
            />
            
            {/* <IronMan 
              isPushing={activeAction === 'PUSH'} 
              targetBoxRef={boxRef} 
              onActionComplete={() => setActiveAction(null)}
              position={[4, 0, 0]} 
            /> */}

            {/* The Target Box */}
            {/* rigid body turns this into a physical object that can fall,
            collide, and be pulled.
            position: defines the start position of the object, [0,5,0] means 5 units 
            in the air, so that it falls when the page loads
            colliders="cuboid": means treat this object as a solid cuboid for collisions */}
            <RigidBody ref={boxRef} position={[3, 4, 0]} colliders="cuboid" density={0.5} restitution={0.7} friction={0} linearDamping={0.5} angularDamping={0.4} canSleep={false}>
              {/* other params that we can define:
              initial velocity using linearVelocity and angularVelocity
              gravityScale to make it heavier or lighter than normal gravity
              isKinematic to make it unaffected by physics but still able to collide
              enabledRotations and enabledTranslations to lock movement along certain axes
              */}
              <mesh>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial color="#3498db" />
              </mesh>
            </RigidBody>

            {/* The Ground */}
            {/* type="fixed" means this object is static, infinite mass and cannot move
            rotation="...": means flip the flat plane 90 degree so it lies flat like a 
            floor instead of standing like a wall */}
            <RigidBody type="fixed">
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </RigidBody>
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}