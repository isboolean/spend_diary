import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin, RequireAuth } from './auth'
import BookLayout from './layouts/BookLayout'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Categories from './pages/Categories'
import Transactions from './pages/user/Transactions'
import Statistics from './pages/user/Statistics'
import Budgets from './pages/user/Budgets'
import UserCategories from './pages/user/Categories'
import Home from './pages/user/Home'
import Accounts from './pages/user/Accounts'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <BookLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="categories" element={<UserCategories />} />
        <Route path="accounts" element={<Accounts />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <MainLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="categories" element={<Categories />} />
      </Route>
    </Routes>
  )
}
