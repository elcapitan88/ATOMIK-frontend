/**
 * Mobile-First Responsive Breakpoint System
 * 
 * This system follows a mobile-first approach where styles are designed
 * for mobile devices first, then enhanced for larger screens.
 */

import React from 'react';

// Breakpoint values in pixels
export const breakpointValues = {
  // Mobile devices
  xs: 0,      // Extra small devices (portrait phones, less than 576px)
  sm: 576,    // Small devices (landscape phones, 576px and up)
  md: 768,    // Medium devices (tablets, 768px and up)
  lg: 992,    // Large devices (desktops, 992px and up)
  xl: 1200,   // Extra large devices (large desktops, 1200px and up)
  xxl: 1400   // Extra extra large devices (larger desktops, 1400px and up)
};

// Media query helpers
export const breakpoints = {
  // Mobile-first queries (min-width)
  up: (breakpoint) => `@media (min-width: ${breakpointValues[breakpoint]}px)`,
  
  // Desktop-first queries (max-width)
  down: (breakpoint) => {
    const value = breakpointValues[breakpoint];
    return `@media (max-width: ${value - 0.02}px)`;
  },
  
  // Between two breakpoints
  between: (start, end) => {
    const startValue = breakpointValues[start];
    const endValue = breakpointValues[end];
    return `@media (min-width: ${startValue}px) and (max-width: ${endValue - 0.02}px)`;
  },
  
  // Only specific breakpoint
  only: (breakpoint) => {
    const keys = Object.keys(breakpointValues);
    const index = keys.indexOf(breakpoint);
    const nextBreakpoint = keys[index + 1];
    
    if (nextBreakpoint) {
      return breakpoints.between(breakpoint, nextBreakpoint);
    }
    return breakpoints.up(breakpoint);
  }
};

// Device-specific helpers
export const devices = {
  mobile: breakpoints.down('md'),           // < 768px
  tablet: breakpoints.between('md', 'lg'),  // 768px - 991px
  desktop: breakpoints.up('lg'),            // >= 992px
  largeDesktop: breakpoints.up('xl'),       // >= 1200px
};

// Touch device detection
export const touchDevice = '@media (hover: none) and (pointer: coarse)';
export const mouseDevice = '@media (hover: hover) and (pointer: fine)';

// Orientation queries
export const orientation = {
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)'
};

// High DPI screens
export const retina = '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)';

// Container widths for consistent layouts
export const containerWidths = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  xxl: '1320px'
};

// Responsive spacing scale (mobile-first)
export const spacing = {
  xs: {
    mobile: '4px',
    tablet: '6px',
    desktop: '8px'
  },
  sm: {
    mobile: '8px',
    tablet: '10px',
    desktop: '12px'
  },
  md: {
    mobile: '16px',
    tablet: '20px',
    desktop: '24px'
  },
  lg: {
    mobile: '24px',
    tablet: '32px',
    desktop: '40px'
  },
  xl: {
    mobile: '32px',
    tablet: '48px',
    desktop: '64px'
  }
};

// Responsive typography scale
export const typography = {
  h1: {
    mobile: { fontSize: '24px', lineHeight: '32px' },
    tablet: { fontSize: '32px', lineHeight: '40px' },
    desktop: { fontSize: '48px', lineHeight: '56px' }
  },
  h2: {
    mobile: { fontSize: '20px', lineHeight: '28px' },
    tablet: { fontSize: '24px', lineHeight: '32px' },
    desktop: { fontSize: '36px', lineHeight: '44px' }
  },
  h3: {
    mobile: { fontSize: '18px', lineHeight: '24px' },
    tablet: { fontSize: '20px', lineHeight: '28px' },
    desktop: { fontSize: '28px', lineHeight: '36px' }
  },
  body: {
    mobile: { fontSize: '14px', lineHeight: '20px' },
    tablet: { fontSize: '16px', lineHeight: '24px' },
    desktop: { fontSize: '16px', lineHeight: '24px' }
  },
  small: {
    mobile: { fontSize: '12px', lineHeight: '16px' },
    tablet: { fontSize: '14px', lineHeight: '20px' },
    desktop: { fontSize: '14px', lineHeight: '20px' }
  }
};

// Touch-friendly sizes
export const touchTargets = {
  minimum: '44px',  // Minimum touch target size (WCAG)
  comfortable: '48px',
  spacious: '56px'
};

// Z-index scale for layering
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
};

// Utility functions
export const isMobile = () => window.innerWidth < breakpointValues.md;
export const isTablet = () => window.innerWidth >= breakpointValues.md && window.innerWidth < breakpointValues.lg;
export const isDesktop = () => window.innerWidth >= breakpointValues.lg;

// Hook for responsive behavior
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState(() => {
    const width = window.innerWidth;
    if (width < breakpointValues.sm) return 'xs';
    if (width < breakpointValues.md) return 'sm';
    if (width < breakpointValues.lg) return 'md';
    if (width < breakpointValues.xl) return 'lg';
    if (width < breakpointValues.xxl) return 'xl';
    return 'xxl';
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < breakpointValues.sm) setBreakpoint('xs');
      else if (width < breakpointValues.md) setBreakpoint('sm');
      else if (width < breakpointValues.lg) setBreakpoint('md');
      else if (width < breakpointValues.xl) setBreakpoint('lg');
      else if (width < breakpointValues.xxl) setBreakpoint('xl');
      else setBreakpoint('xxl');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

// CSS-in-JS helper for responsive styles
export const responsive = (property, values) => {
  const styles = {};
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs') {
      styles[property] = value;
    } else {
      styles[breakpoints.up(breakpoint)] = {
        [property]: value
      };
    }
  });
  
  return styles;
};

// Export all as default for convenient importing
export default {
  breakpointValues,
  breakpoints,
  devices,
  touchDevice,
  mouseDevice,
  orientation,
  retina,
  containerWidths,
  spacing,
  typography,
  touchTargets,
  zIndex,
  isMobile,
  isTablet,
  isDesktop,
  useBreakpoint,
  responsive
};