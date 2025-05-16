import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard input for character movement
 * Uses a simple direct approach that works reliably across browsers
 * @returns {Object} Keyboard state and handlers
 */
const useKeyboardControls = () => {
  // Define directions
  const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
  };
  
  // Track pressed keys with additional metadata
  const keys = useRef({
    up: false,    // w or ArrowUp
    down: false,  // s or ArrowDown
    left: false,  // a or ArrowLeft
    right: false, // d or ArrowRight
    shift: false, // Shift (sprint)
    // Track both left and right shift separately for better detection
    leftShift: false,
    rightShift: false
  });
  
  // Track state
  const isLocked = useRef(false);
  const isFocused = useRef(true);
  const lastDirection = useRef(DIRECTIONS.RIGHT);
  
  // Reset all keys
  const resetAllKeys = useCallback(() => {
    // Reset all keys
    keys.current = {
      up: false,
      down: false,
      left: false,
      right: false,
      shift: false,
      leftShift: false,
      rightShift: false
    };
  }, []);
  

  

  
  // Calculate movement based on key state
  const calculateMovement = useCallback((walkSpeed, sprintSpeed) => {
    // Don't move if locked or not focused
    if (isLocked.current || !isFocused.current) {
      return {
        vx: 0,
        vy: 0,
        moving: false,
        direction: lastDirection.current,
        isLocked: isLocked.current,
        isSprinting: false
      };
    }
    
    // Check if any direction key is pressed
    const isMoving = keys.current.up || keys.current.down || keys.current.left || keys.current.right;
    
    // If not moving, return zeros
    if (!isMoving) {
      return {
        vx: 0,
        vy: 0,
        moving: false,
        direction: lastDirection.current,
        isLocked: isLocked.current,
        isSprinting: false
      };
    }
    
    // Determine sprint state - check both the combined shift flag and individual shift keys
    const isSprinting = keys.current.shift || keys.current.leftShift || keys.current.rightShift;
    const speed = isSprinting ? sprintSpeed : walkSpeed;
    
    // Calculate velocity
    let vx = 0;
    let vy = 0;
    let direction = lastDirection.current;
    
    // Horizontal movement
    if (keys.current.right) {
      vx = speed;
      direction = DIRECTIONS.RIGHT;
    } else if (keys.current.left) {
      vx = -speed;
      direction = DIRECTIONS.LEFT;
    }
    
    // Vertical movement
    if (keys.current.up) {
      vy = -speed;
      // Only change direction if no horizontal movement
      if (!keys.current.left && !keys.current.right) {
        direction = DIRECTIONS.UP;
      }
    } else if (keys.current.down) {
      vy = speed;
      // Only change direction if no horizontal movement
      if (!keys.current.left && !keys.current.right) {
        direction = DIRECTIONS.DOWN;
      }
    }
    
    // Normalize diagonal movement
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0 && len > speed) {
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }
    
    // Update last direction
    lastDirection.current = direction;
    
    return {
      vx,
      vy,
      moving: true,
      direction,
      isLocked: isLocked.current,
      isSprinting
    };
  }, []);
  

  
  // Set up event listeners
  useEffect(() => {
    const keyDownHandler = (e) => {
      
      // Prevent default for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Ignore key repeats
      if (e.repeat) {
        return;
      }
      
      // Handle lock toggle
      if (e.key === 'Control') {
        isLocked.current = !isLocked.current;
        return;
      }
      
      // If locked, ignore movement input
      if (isLocked.current) return;
      
      // Update key state
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true;
      
      // Handle shift key with more precision
      if (e.key === 'Shift') {
        keys.current.shift = true;
        
        // Track left/right shift separately
        if (e.location === 1) {
          keys.current.leftShift = true;
        } else if (e.location === 2) {
          keys.current.rightShift = true;
        }
      }
      
      // Also detect shift key from the event property
      if (e.shiftKey) {
        keys.current.shift = true;
      }
    };
    
    const keyUpHandler = (e) => {
      
      // Update key state
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false;
      
      // Handle shift key with more precision
      if (e.key === 'Shift') {
        // Track left/right shift separately
        if (e.location === 1) {
          keys.current.leftShift = false;
        } else if (e.location === 2) {
          keys.current.rightShift = false;
        } else {
          // Generic shift key
          keys.current.leftShift = false;
          keys.current.rightShift = false;
        }
        
        // Only set shift to false if both left and right shift are released
        keys.current.shift = keys.current.leftShift || keys.current.rightShift;
      }
      
      // Double-check shift state based on event property
      if (!e.shiftKey) {
        // If the browser reports no shift key is pressed, make sure our state reflects that
        if (keys.current.shift) {
          keys.current.shift = false;
          keys.current.leftShift = false;
          keys.current.rightShift = false;
        }
      }
    };
    
    const focusInHandler = () => {
      isFocused.current = true;
      resetAllKeys();
    };
    
    const focusOutHandler = () => {
      isFocused.current = false;
      resetAllKeys();
    };
    
    const visibilityChangeHandler = () => {
      if (document.hidden) {
        resetAllKeys();
      }
    };
    
    const windowBlurHandler = () => {
      resetAllKeys();
    };
    
    // Add event listeners
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    window.addEventListener('focusin', focusInHandler);
    window.addEventListener('focusout', focusOutHandler);
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    window.addEventListener('blur', windowBlurHandler);
    
    // Initial reset
    resetAllKeys();
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
      window.removeEventListener('focusin', focusInHandler);
      window.removeEventListener('focusout', focusOutHandler);
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
      window.removeEventListener('blur', windowBlurHandler);
    };
  }, [resetAllKeys]);

  return {
    calculateMovement,
    resetAllKeys,
    isFocused
  };
};

export default useKeyboardControls;
