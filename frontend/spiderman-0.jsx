// Command: npx gltfjsx@6.5.3 ..\assets\gltf_iron_spidermantexturedrigged\scene.gltf --transform 
// Files: ..\assets\gltf_iron_spidermantexturedrigged\scene.gltf [107.57KB] > D:\movie-list\frontend\scene-transformed.glb [253.62KB] (-136%)

import React from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

export function Model(props) {
  const { scene } = useGLTF('/scene-transformed.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes._rootJoint} />
      <skinnedMesh geometry={nodes.Object_6.geometry} material={materials.group_0} skeleton={nodes.Object_6.skeleton} scale={0.025} />
      <skinnedMesh geometry={nodes.Object_7.geometry} material={materials.group_1} skeleton={nodes.Object_7.skeleton} scale={0.025} />
      <skinnedMesh geometry={nodes.Object_8.geometry} material={materials.group_1} skeleton={nodes.Object_8.skeleton} scale={0.025} />
      <skinnedMesh geometry={nodes.Object_9.geometry} material={materials.group_1} skeleton={nodes.Object_9.skeleton} scale={0.025} />
      <skinnedMesh geometry={nodes.Object_10.geometry} material={materials.group_4} skeleton={nodes.Object_10.skeleton} scale={0.025} />
    </group>
  )
}

useGLTF.preload('/scene-transformed.glb')
