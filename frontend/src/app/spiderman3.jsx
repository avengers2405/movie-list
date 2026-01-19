'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { RigidBody, useSphericalJoint } from '@react-three/rapier'
import * as THREE from 'three'

const spiderman_path = '/spiderman3.glb'

export function Spiderman({ isActive, targetBoxRef, ...props }) {
  const group = useRef()
  const physicsRef = useRef()

  // Load scene and animations
  const { scene, animations } = useGLTF(spiderman_path)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions } = useAnimations(animations, group)

  console.log("Animations are: ", actions)

  // Physical connection Spiderman <--> Box
  useSphericalJoint(
    physicsRef, 
    targetBoxRef, 
    [[0, 1.5, 0], [0, 0, 0]], // anchor points on spiderman and on the box.
    isActive
  )

  useEffect(() => {
    const animationName = Object.keys(actions)[0] // Usually 'Take 001' or 'Shoot'
    if (isActive) {
      actions[animationName]?.reset().fadeIn(0.2).play()
    } else {
      actions[animationName]?.fadeOut(0.2)
    }
  }, [isActive, actions])

  useFrame(() => {
    if (isActive && physicsRef.current) {
      // Pulling physics: Move Spiderman back to create tension
      
      // This is for when type="kinematicPosition"
      // const current = physicsRef.current.translation()
      // physicsRef.current.setNextKinematicTranslation({
      //   x: current.x - 0.02, 
      //   y: current.y,
      //   z: current.z
      // })

    // This is for dynamic bodies
    physicsRef.current.addForce({ x: -5000, y: 0, z: 0}, true)
    }
  })

  return (
    <group>
      <RigidBody ref={physicsRef} scale={1} colliders={"trimesh"} density={1} friction={1} linearDamping={1} angularDamping={1}>
        {/* debate wether spiderman should be made a type="kinematicPosition" */}
        {/* <CapsuleCollider args={[0.8, 0.4]} position={[-3, 0, 0]} /> */}

        <group ref={group} {...props} dispose={null}>
          <group name="Sketchfab_Scene">
            <primitive object={nodes._rootJoint} />
            {console.log("printing this shit: ", nodes._rootJoint.scale)}
            <skinnedMesh name="Object_7" geometry={nodes.Object_7.geometry} material={materials['Model001_Material003.001']} skeleton={nodes.Object_7.skeleton} scale={1} />
            <skinnedMesh name="Object_8" geometry={nodes.Object_8.geometry} material={materials['Model001_Material002.001']} skeleton={nodes.Object_8.skeleton} scale={1} />
            <skinnedMesh name="Object_9" geometry={nodes.Object_9.geometry} material={materials['Model001_Material001.001']} skeleton={nodes.Object_9.skeleton} scale={1} />
            <skinnedMesh name="Object_10" geometry={nodes.Object_10.geometry} material={materials['Model001_Material004.001']} skeleton={nodes.Object_10.skeleton} scale={1} />
            <skinnedMesh name="Object_11" geometry={nodes.Object_11.geometry} material={materials['Model001_Material005.001']} skeleton={nodes.Object_11.skeleton} scale={1} />
            <skinnedMesh name="Object_12" geometry={nodes.Object_12.geometry} material={materials['Model001_Material006.001']} skeleton={nodes.Object_12.skeleton} scale={1} />
            <skinnedMesh name="Object_13" geometry={nodes.Object_13.geometry} material={materials['Model001_Material006.001']} skeleton={nodes.Object_13.skeleton} scale={1} />
          </group>
        </group>
      </RigidBody>
      {/* {isActive && <WebVisual startRef={physicsRef} endRef={targetBoxRef} />} */}
    </group>
  )
}

function WebVisual({ startRef, endRef }) {
  const lineRef = useRef()
  useFrame(() => {
    if (startRef.current && endRef.current) {
      const s = startRef.current.translation()
      const e = endRef.current.translation()
      console.log("Web from ", s, " to ", e, " \n For: ", startRef.current, "and target object ", endRef.current)
      lineRef.current.geometry.setFromPoints([
        new THREE.Vector3(s.x, s.y, s.z),
        new THREE.Vector3(e.x, e.y, e.z)
      ])
      lineRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="white" linewidth={3} />
    </line>
  )
}

useGLTF.preload(spiderman_path)
