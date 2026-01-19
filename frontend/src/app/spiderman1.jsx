'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { RigidBody, useSphericalJoint } from '@react-three/rapier'
import * as THREE from 'three'

export function Spiderman({ isActive, targetBoxRef, ...props }) {
  const group = useRef()
  const physicsRef = useRef()

  // Load scene and animations
  const { scene, animations } = useGLTF('/iron-spider-rigged-scaled0-transformed.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions } = useAnimations(animations, group)

  // Physical connection Spiderman <--> Box
  useSphericalJoint(
    physicsRef, 
    targetBoxRef, 
    [[0, 1.5, 0], [0, 0, 0]], 
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
      const current = physicsRef.current.translation()
      physicsRef.current.setNextKinematicTranslation({
        x: current.x - 0.02, 
        y: current.y,
        z: current.z
      })
    }
  })

  return (
    <RigidBody ref={physicsRef} type="kinematicPosition" colliders="capsule">
      <group {...props} dispose={null}>
        <primitive object={nodes._rootJoint} />
        <skinnedMesh geometry={nodes.Object_10.geometry} material={materials['group_4.002']} skeleton={nodes.Object_10.skeleton} scale={0.025} />
        <skinnedMesh geometry={nodes.Object_6.geometry} material={materials['group_0.002']} skeleton={nodes.Object_6.skeleton} scale={0.025} />
        <skinnedMesh geometry={nodes.Object_7.geometry} material={materials['group_1.002']} skeleton={nodes.Object_7.skeleton} scale={0.025} />
        <skinnedMesh geometry={nodes.Object_8.geometry} material={materials['group_1.002']} skeleton={nodes.Object_8.skeleton} scale={0.025} />
        <skinnedMesh geometry={nodes.Object_9.geometry} material={materials['group_1.002']} skeleton={nodes.Object_9.skeleton} scale={0.025} />
    </group>
      {isActive && <WebVisual startRef={physicsRef} endRef={targetBoxRef} />}
    </RigidBody>
  )
}

function WebVisual({ startRef, endRef }) {
  const lineRef = useRef()
  useFrame(() => {
    if (startRef.current && endRef.current) {
      const s = startRef.current.translation()
      const e = endRef.current.translation()
      lineRef.current.geometry.setFromPoints([
        new THREE.Vector3(s.x, s.y + 1.5, s.z),
        new THREE.Vector3(e.x, e.y, e.z)
      ])
    }
  })
  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="white" linewidth={3} />
    </line>
  )
}

useGLTF.preload('/iron-spider-rigged-scaled0-transformed.glb')
