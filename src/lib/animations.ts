import gsap from 'gsap';

// Main heading animation
export const animateMainHeading = (element: HTMLElement) => {
  gsap.from(element, {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out"
  });
};

// Input form card animation
export const animateInputForm = (element: HTMLElement) => {
  gsap.from(element, {
    opacity: 0,
    scale: 0.95,
    duration: 0.7,
    ease: "power1.out",
    delay: 0.2
  });
};

// Plan sections staggered animation
export const animatePlanSections = (elements: HTMLElement[]) => {
  gsap.fromTo(
    elements,
    { y: 50, opacity: 0 },
    { 
      y: 0, 
      opacity: 1, 
      duration: 0.8, 
      stagger: 0.1, 
      ease: "power2.out" 
    }
  );
};

// Daily quote animation
export const animateQuote = (element: HTMLElement) => {
  gsap.fromTo(
    element,
    { opacity: 0.5, scale: 0.98 },
    { 
      opacity: 1, 
      scale: 1,
      duration: 0.5,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1
    }
  );
};

// AI Tips animation
export const animateAITips = (element: HTMLElement) => {
  gsap.to(element, {
    boxShadow: "0 0 15px rgba(107, 33, 168, 0.5)",
    duration: 1,
    repeat: 1,
    yoyo: true,
    ease: "sine.inOut"
  });
};

// Saved plans list animation
export const animateSavedPlans = (elements: HTMLElement[]) => {
  gsap.from(elements, {
    x: -50,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: "power1.out"
  });
};

// Hover animation for plan cards
export const initializeHoverAnimations = () => {
  // Add event listeners for hover effects on cards
  document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      gsap.to(e.currentTarget, {
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        duration: 0.3,
        ease: "power2.out"
      });
    });
    
    card.addEventListener('mouseleave', (e) => {
      gsap.to(e.currentTarget, {
        y: 0,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        duration: 0.3,
        ease: "power2.out"
      });
    });
  });
};