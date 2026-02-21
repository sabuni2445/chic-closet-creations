
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, PerspectiveCamera, Center } from "@react-three/drei";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";

interface ThreeDViewerProps {
    image?: string;
}

const BackgroundRemovalMaterial = ({ texture }: { texture: THREE.Texture }) => {
    const shaderArgs = useMemo(() => ({
        uniforms: {
            uTexture: { value: texture },
            uThreshold: { value: 0.95 }, // Sensitivity for white removal
            uSmoothing: { value: 0.05 },
        },
        vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uThreshold;
      uniform float uSmoothing;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(uTexture, vUv);
        // Calculate brightness/whiteness
        float brightness = (color.r + color.g + color.b) / 3.0;
        // Create an alpha mask based on whiteness
        float alpha = 1.0 - smoothstep(uThreshold - uSmoothing, uThreshold, brightness);
        gl_FragColor = vec4(color.rgb, color.a * alpha);
        
        // Discard completely transparent pixels for performance
        if (gl_FragColor.a < 0.01) discard;
      }
    `
    }), [texture]);

    return <shaderMaterial
        args={[shaderArgs]}
        transparent={true}
        side={THREE.DoubleSide}
    />;
};

const FloatingImage = ({ url }: { url: string }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const texture = useTexture(url);

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    useFrame((state) => {
        const { mouse } = state;
        if (meshRef.current) {
            // Smooth movement following cursor
            const targetRotationX = -mouse.y * 0.3;
            const targetRotationY = mouse.x * 0.3;

            meshRef.current.rotation.x = THREE.MathUtils.lerp(
                meshRef.current.rotation.x,
                targetRotationX,
                0.08
            );
            meshRef.current.rotation.y = THREE.MathUtils.lerp(
                meshRef.current.rotation.y,
                targetRotationY,
                0.08
            );

            // Subtle floating breathing effect
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2.4, 3.2]} />
            <BackgroundRemovalMaterial texture={texture} />
        </mesh>
    );
};

const ThreeDViewer = ({ image }: ThreeDViewerProps) => {
    if (!image) return null;

    return (
        <div className="w-full h-[500px] bg-transparent rounded-lg overflow-hidden relative group cursor-none">
            {/* Custom cursor for boutique feel */}
            <div className="absolute inset-0 z-0 bg-radial-gradient from-primary/5 to-transparent pointer-events-none" />

            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] tracking-[0.4em] uppercase text-primary font-bold">Atelier View</span>
                    <div className="w-8 h-px bg-primary/30" />
                </div>
            </div>

            <Canvas gl={{ alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />
                <Suspense fallback={null}>
                    <Center>
                        <FloatingImage url={image} />
                    </Center>
                </Suspense>
            </Canvas>

            {/* Minimal boutique framing */}
            <div className="absolute inset-12 border border-primary/5 pointer-events-none" />
        </div>
    );
};

export default ThreeDViewer;
