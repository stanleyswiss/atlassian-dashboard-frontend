import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'medium', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
        {text && (
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Inline loading spinner for small spaces
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <Loader2 className={`animate-spin h-4 w-4 text-blue-600 ${className}`} />
  )
}

// Full page loading overlay
export function PageLoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <LoadingSpinner size="large" text={text} />
    </div>
  )
}