const ease = [0.2, 0.7, 0.25, 1] as const

export const popIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.16, ease },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.13, ease },
  },
}

const slideMap = {
  right: { x: 24 },
  left: { x: -24 },
  bottom: { y: 24 },
} as const

type SlideDirection = keyof typeof slideMap

export const slideIn = (direction: SlideDirection = "right") => {
  const axis = slideMap[direction]
  return {
    initial: { opacity: 0, ...axis },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.18, ease },
    },
    exit: {
      opacity: 0,
      ...axis,
      transition: { duration: 0.14, ease },
    },
  }
}
