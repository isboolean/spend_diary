import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

export function RequireAuth({ children }: { children: ReactElement }) {
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function RequireAdmin({ children }: { children: ReactElement }) {
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />
  }
  if (localStorage.getItem('userRole') !== 'ADMIN') {
    return <Navigate to="/home" replace />
  }
  return children
}
