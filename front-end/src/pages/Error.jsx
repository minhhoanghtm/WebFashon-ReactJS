import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import React from 'react'

const Error = () => {
  useDocumentTitle("404 Not Found");
  return (
    <div>
      404 Not Found
    </div>
  )
}

export default Error
