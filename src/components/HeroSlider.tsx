'use client'

import { useState, useEffect } from 'react'

const images = [
  '/images/hero-bg-1.jpg',
  '/images/hero-bg-2.jpg'
]

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000) // 5초마다 이미지 변경
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {images.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center bg-no-repeat ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${img}')` }}
        />
      ))}
      
      {/* Dark Overlay for Text Readability - 따뜻하고 세련된 느낌을 위한 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-brightness-75 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-black/30 z-[1]" />
    </>
  )
}
