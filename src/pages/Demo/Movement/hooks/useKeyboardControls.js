import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard input for character movement
 * @returns {Object} Keyboard state and handlers
 */
const useKeyboardControls = () => {
  const keysState = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    Shift: false,
    Control: false,
  });
  
  const isShiftPressed = useRef(false);
  const isLocked = useRef(false);
  const isFocused = useRef(true);
  
  // Calculate movement vector based on current key state
  const calculateMovement = useCallback((walkSpeed, sprintSpeed) => {
    const keys = keysState.current;
    const shift = isShiftPressed.current;
    const speed = shift ? sprintSpeed : walkSpeed;
    
    let vx = 0;
    let vy = 0;
    let moving = false;
    let direction = null;

    if (!isLocked.current) {
      if (keys['ArrowRight'] || keys['d']) {
        vx = speed;
        direction = 'right';
        moving = true;
      } else if (keys['ArrowLeft'] || keys['a']) {
        vx = -speed;
        direction = 'left';
        moving = true;
      }

      if (keys['ArrowUp'] || keys['w']) {
        vy = -speed;
        direction = 'up';
        moving = true;
      } else if (keys['ArrowDown'] || keys['s']) {
        vy = speed;
        direction = 'down';
        moving = true;
      }

      // Normalize diagonal movement
      const len = Math.sqrt(vx * vx + vy * vy);
      if (len > speed) {
        vx = (vx / len) * speed;
        vy = (vy / len) * speed;
      }
    }

    return {
      vx,
      vy,
      moving,
      direction,
      isLocked: isLocked.current,
      isSprinting: shift
    };
  }, []);
  
  // Setup keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysState.current[e.key] = true;
      if (e.key === 'Shift') isShiftPressed.current = true;
      if (e.key === 'Control') {
        isLocked.current = !isLocked.current;
      }
    };

    const handleKeyUp = (e) => {
      keysState.current[e.key] = false;
      if (e.key === 'Shift') {
        isShiftPressed.current = false;
      }
    };

    const handleFocusIn = () => (isFocused.current = true);
    const handleFocusOut = () => (isFocused.current = false);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
  
  return {
    calculateMovement,
    isFocused,
    isLocked,
    keysState
  };
};

export default useKeyboardControls;
