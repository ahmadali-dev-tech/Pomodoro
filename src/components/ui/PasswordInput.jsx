import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './Field'

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? 'text' : 'password'} className="pr-10" {...props} />
      <button type="button" onClick={() => setShown(v => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-faint hover:text-text">
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
})
export default PasswordInput
