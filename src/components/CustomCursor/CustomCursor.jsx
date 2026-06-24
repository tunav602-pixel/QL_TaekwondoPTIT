import React, { useEffect, useState, useRef } from 'react';
import useThemeStore from '../../store/useThemeStore';

const CustomCursor = () => {
  const { useCustomCursor } = useThemeStore();
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Mouse coordinate refs
  const mouseCoords = useRef({ x: 0, y: 0 });
  const ringCoords = useRef({ x: 0, y: 0 });
  const dotCoords = useRef({ x: 0, y: 0 });

  // DOM elements refs
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const animationFrameId = useRef(null);

  // Detect mobile/touch devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set mouse coordinates on movement
  useEffect(() => {
    if (!useCustomCursor || isMobile) {
      document.documentElement.classList.remove('custom-cursor-active');
      return;
    }

    // Add CSS class to hide native cursor
    document.documentElement.classList.add('custom-cursor-active');

    const handleMouseMove = (e) => {
      mouseCoords.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [useCustomCursor, isMobile]);

  // Click & Hover listeners
  useEffect(() => {
    if (!useCustomCursor || isMobile) return;

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    // Global delegation for hover states
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      // Check if target or its parent is interactive
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' || 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('.clickable') || 
        target.closest('[role="button"]') ||
        target.classList.contains('cursor-pointer');

      if (isInteractive) {
        setHovered(true);
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' || 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('.clickable') || 
        target.closest('[role="button"]') ||
        target.classList.contains('cursor-pointer');

      if (isInteractive) {
        setHovered(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [useCustomCursor, isMobile]);

  // Animation Loop for fluid custom cursor tracking (Lag/Spring physics)
  useEffect(() => {
    if (!useCustomCursor || isMobile) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const tick = () => {
      // 1. Update Dot position instantly (no lag)
      dotCoords.current.x = mouseCoords.current.x;
      dotCoords.current.y = mouseCoords.current.y;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotCoords.current.x}px, ${dotCoords.current.y}px, 0) translate(-50%, -50%)`;
      }

      // 2. Interpolate Ring position with lag (lag ratio = 0.16 for smooth drag)
      const easeRatio = 0.16;
      ringCoords.current.x += (mouseCoords.current.x - ringCoords.current.x) * easeRatio;
      ringCoords.current.y += (mouseCoords.current.y - ringCoords.current.y) * easeRatio;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringCoords.current.x}px, ${ringCoords.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [useCustomCursor, isMobile]);

  if (!useCustomCursor || isMobile) return null;

  return (
    <>
      <div 
        ref={dotRef} 
        className={`custom-cursor-dot ${hovered ? 'hovered' : ''}`} 
        style={{ left: 0, top: 0 }}
      />
      <div 
        ref={ringRef} 
        className={`custom-cursor-ring ${hovered ? 'hovered' : ''} ${clicked ? 'clicked' : ''}`}
        style={{ left: 0, top: 0 }}
      />
    </>
  );
};

export default CustomCursor;
