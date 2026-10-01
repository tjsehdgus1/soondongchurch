'use client'

import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { prefersReducedMotion } from '@/lib/motion'

// 스테인드글라스를 통과하는 듯한 빛줄기 + 떠다니는 빛 입자 (사진 위에 은은하게 겹침)
const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uLight;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(vec2(i, 0.0)), hash(vec2(i + 1.0, 0.0)), smoothstep(0.0, 1.0, f));
}

void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    vec2 l = vec2(uLight.x * aspect, uLight.y);
    vec2 d = p - l;
    float dist = length(d);
    float ang = atan(d.y, d.x);

    // 각도별 노이즈 → 빛줄기
    float rays = noise1(ang * 18.0 + uTime * 0.12) * 0.6 + noise1(ang * 43.0 - uTime * 0.08) * 0.4;
    rays = pow(rays, 3.0);
    float falloff = exp(-dist * 1.15);
    float light = rays * falloff * 0.9 + exp(-dist * 3.0) * 0.3;

    // 천천히 떠오르는 빛 입자
    vec2 g = vec2(vUv.x * aspect, vUv.y) * 14.0;
    g.y -= uTime * 0.06;
    g.x += sin(uTime * 0.1 + g.y * 0.7) * 0.25;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id);
    vec2 offset = vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5;
    float particle = smoothstep(0.07, 0.0, length(f - offset * 0.6)) * step(0.8, h)
        * (0.55 + 0.45 * sin(uTime * 1.3 + h * 40.0));

    float alpha = clamp(light * 0.5 + particle * 0.55 * (0.4 + falloff), 0.0, 0.85);
    vec3 color = mix(vec3(1.0, 0.84, 0.55), vec3(1.0, 0.97, 0.9), particle);
    gl_FragColor = vec4(color * alpha, alpha);
}
`

// 동작 줄이기·WebGL 미지원이면 아무것도 그리지 않음 (부모의 CSS 그라디언트가 대신함)
export default function HeroLight({ className = '' }: { className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container || prefersReducedMotion()) return

        let renderer: Renderer
        try {
            renderer = new Renderer({ alpha: true, premultipliedAlpha: true, dpr: Math.min(window.devicePixelRatio, 1.5) })
        } catch {
            return
        }
        const gl = renderer.gl
        if (!gl) return
        gl.clearColor(0, 0, 0, 0)
        gl.canvas.style.width = '100%'
        gl.canvas.style.height = '100%'
        container.appendChild(gl.canvas)

        const program = new Program(gl, {
            vertex,
            fragment,
            transparent: true,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [1, 1] },
                uLight: { value: [0.18, 1.15] },
            },
        })
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

        const resize = () => {
            const { clientWidth, clientHeight } = container
            renderer.setSize(clientWidth, clientHeight)
            program.uniforms.uResolution.value = [clientWidth, clientHeight]
        }
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)
        resize()

        // 마우스 위치에 따라 광원이 살짝 이동
        let targetX = 0.18
        const onMove = (e: PointerEvent) => { targetX = 0.18 + (e.clientX / window.innerWidth - 0.5) * 0.16 }
        window.addEventListener('pointermove', onMove)

        // 화면에 보일 때만 그림
        let visible = true
        const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
        io.observe(container)

        let frame = 0
        const start = performance.now()
        const loop = (now: number) => {
            frame = requestAnimationFrame(loop)
            if (!visible || document.hidden) return
            const light = program.uniforms.uLight.value as number[]
            light[0] += (targetX - light[0]) * 0.04
            program.uniforms.uTime.value = (now - start) / 1000
            renderer.render({ scene: mesh })
        }
        frame = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(frame)
            resizeObserver.disconnect()
            io.disconnect()
            window.removeEventListener('pointermove', onMove)
            gl.getExtension('WEBGL_lose_context')?.loseContext()
            gl.canvas.remove()
        }
    }, [])

    return <div ref={containerRef} aria-hidden="true" className={`pointer-events-none ${className}`} />
}
