import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Classes for the outer container controlling size/aspect */
  className?: string
  /** Classes applied directly to the img element */
  imgClassName?: string
}

export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src = '', alt, className, imgClassName, ...props }, ref) => {
    const [loaded, setLoaded] = useState(false)

    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Skeleton
          className={cn(
            'absolute inset-0 h-full w-full transition-opacity duration-300',
            loaded && 'opacity-0 animate-none'
          )}
        />
        {src && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0',
              imgClassName
            )}
            {...props}
          />
        )}
      </div>
    )
  },
)

LazyImage.displayName = 'LazyImage'

